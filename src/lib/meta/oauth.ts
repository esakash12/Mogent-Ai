import prisma from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/encryption";

export async function getMetaOAuthUrl(
  tenantSlug: string,
  state: string = "default",
  baseUrl?: string
): Promise<string | null> {
  const config = await prisma.superAdminConfig.findFirst();
  const appId = config?.metaAppId?.trim() || process.env.META_APP_ID?.trim();

  if (!appId) {
    return null;
  }

  const effectiveBase = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${effectiveBase}/api/auth/meta/callback`;
  const scopes = [
    "pages_show_list",
    "pages_messaging",
    "pages_manage_metadata",
    "pages_read_engagement",
    "business_management",
    "instagram_basic",
    "instagram_manage_messages",
  ].join(",");

  const statePayload = Buffer.from(
    JSON.stringify({ tenantSlug, state, baseUrl: effectiveBase })
  ).toString("base64url");

  return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&state=${statePayload}&scope=${scopes}&response_type=code&auth_type=rerequest`;
}

/**
 * 1-Click Zero-Manual-Work Meta Onboarding Pipeline:
 * 1. Exchanges auth code for short-lived user token.
 * 2. Exchanges short-lived token for 60-day Long-Lived User Access Token.
 * 3. Fetches all connected Facebook Pages and Instagram accounts via:
 *    a. /me/accounts with pagination
 *    b. debug_token granular_scopes target_ids direct query
 *    c. /me/businesses (owned_pages & client_pages)
 * 4. Automatically subscribes each Page to the platform's central webhook.
 * 5. Saves active Channel records in database.
 */
export async function handleMetaOAuthCallback(
  code: string,
  tenantSlug: string,
  baseUrl?: string
) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

  if (!tenant) {
    throw new Error("Merchant tenant not found");
  }

  const config = await prisma.superAdminConfig.findFirst();
  const appId = config?.metaAppId?.trim() || process.env.META_APP_ID?.trim();
  const appSecret =
    decryptSecret(config?.metaAppSecret) || process.env.META_APP_SECRET?.trim();
  const effectiveBase = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${effectiveBase}/api/auth/meta/callback`;

  let connectedPages: Array<{ id: string; name: string }> = [];

  if (appId && appSecret && code && !code.startsWith("mock_")) {
    try {
      // 1. Exchange authorization code for short-lived access token
      const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&client_secret=${appSecret}&code=${code}`;

      const tokenRes = await fetch(tokenUrl);
      const tokenData = await tokenRes.json();

      if (!tokenData.access_token) {
        console.error("[META OAUTH] Token exchange failed:", tokenData);
        throw new Error(tokenData.error?.message || "Failed to exchange authorization code");
      }

      const shortUserToken = tokenData.access_token;

      // 2. Upgrade to 60-day Long-Lived User Token
      const longTokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortUserToken}`;
      const longRes = await fetch(longTokenUrl);
      const longData = await longRes.json();
      const longUserToken = longData.access_token || shortUserToken;

      console.log("[META OAUTH] Long-lived user token obtained successfully.");

      // Pages map keyed by page id to deduplicate
      const pagesMap = new Map<
        string,
        {
          id: string;
          name: string;
          access_token: string;
          instagram_business_account?: { id: string };
        }
      >();

      // 3A. Query user's Facebook Pages from /me/accounts (with pagination)
      let accountsUrl: string | null = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account&limit=100&access_token=${longUserToken}`;

      while (accountsUrl) {
        try {
          const accountsRes: Response = await fetch(accountsUrl);
          const accountsData = await accountsRes.json();
          console.log("[META OAUTH] /me/accounts count:", accountsData.data?.length || 0);

          if (accountsData.data && Array.isArray(accountsData.data)) {
            for (const page of accountsData.data) {
              if (page.id && page.access_token) {
                pagesMap.set(page.id, page);
                console.log(`[META OAUTH] Page from /me/accounts: ${page.name} (${page.id})`);
              }
            }
          }
          accountsUrl = accountsData.paging?.next || null;
        } catch (accErr) {
          console.warn("[META OAUTH] Error fetching /me/accounts batch:", accErr);
          break;
        }
      }

      // 3B. Inspect debug_token granular_scopes for target_ids that user selected in OAuth
      try {
        const debugUrl = `https://graph.facebook.com/v19.0/debug_token?input_token=${longUserToken}&access_token=${appId}|${appSecret}`;
        const debugRes = await fetch(debugUrl);
        const debugData = await debugRes.json();
        const granularScopes = debugData.data?.granular_scopes || [];

        const targetPageIds = new Set<string>();
        for (const gs of granularScopes) {
          if (gs.target_ids && Array.isArray(gs.target_ids)) {
            for (const tid of gs.target_ids) {
              targetPageIds.add(tid);
            }
          }
        }

        console.log("[META OAUTH] Target IDs in granular_scopes:", Array.from(targetPageIds));

        for (const targetId of Array.from(targetPageIds)) {
          if (!pagesMap.has(targetId)) {
            try {
              const targetRes = await fetch(
                `https://graph.facebook.com/v19.0/${targetId}?fields=id,name,access_token,instagram_business_account&access_token=${longUserToken}`
              );
              const targetData = await targetRes.json();
              console.log(
                `[META OAUTH] Direct lookup for target page ${targetId}:`,
                targetData.name,
                !!targetData.access_token
              );
              if (targetData.id && targetData.access_token) {
                pagesMap.set(targetData.id, targetData);
              }
            } catch (targetErr) {
              console.warn(`[META OAUTH] Error direct-fetching page ${targetId}:`, targetErr);
            }
          }
        }
      } catch (debugErr) {
        console.warn("[META OAUTH] Debug token inspection warning:", debugErr);
      }

      // 3C. Scan /me/businesses for business-owned pages and client pages
      try {
        const bizUrl = `https://graph.facebook.com/v19.0/me/businesses?fields=id,name&access_token=${longUserToken}`;
        const bizRes = await fetch(bizUrl);
        const bizData = await bizRes.json();
        if (bizData.data && Array.isArray(bizData.data)) {
          for (const biz of bizData.data) {
            for (const edge of ["owned_pages", "client_pages"]) {
              try {
                const edgeUrl = `https://graph.facebook.com/v19.0/${biz.id}/${edge}?fields=id,name,access_token,instagram_business_account&limit=100&access_token=${longUserToken}`;
                const edgeRes = await fetch(edgeUrl);
                const edgeData = await edgeRes.json();
                if (edgeData.data && Array.isArray(edgeData.data)) {
                  for (const page of edgeData.data) {
                    if (page.id && page.access_token && !pagesMap.has(page.id)) {
                      console.log(
                        `[META OAUTH] Found business page via ${biz.name} (${edge}): ${page.name} (${page.id})`
                      );
                      pagesMap.set(page.id, page);
                    }
                  }
                }
              } catch {}
            }
          }
        }
      } catch (bizErr) {
        console.warn("[META OAUTH] Business scan warning:", bizErr);
      }

      console.log(`[META OAUTH] Total unique pages resolved to save: ${pagesMap.size}`);

      // 4. Save each page to database and subscribe to webhooks
      for (const page of Array.from(pagesMap.values())) {
        connectedPages.push({ id: page.id, name: page.name });

        // Auto-Subscribe Page to Webhook
        try {
          const subRes = await fetch(
            `https://graph.facebook.com/v19.0/${page.id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,message_reads,message_echoes&access_token=${page.access_token}`,
            { method: "POST" }
          );
          const subData = await subRes.json();
          console.log(`[META OAUTH] Webhook subscription for ${page.name}:`, subData);
        } catch (subErr) {
          console.warn(`[META] Webhook auto-subscription for page ${page.id}:`, subErr);
        }

        // Upsert Facebook Page Channel
        await prisma.channel.upsert({
          where: { id: `fb_channel_${page.id}` },
          update: {
            pageName: page.name,
            accessToken: encryptSecret(page.access_token) || page.access_token,
            isActive: true,
            tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
          create: {
            id: `fb_channel_${page.id}`,
            tenantId: tenant.id,
            type: "FACEBOOK",
            pageId: page.id,
            pageName: page.name,
            accessToken: encryptSecret(page.access_token) || page.access_token,
            isActive: true,
            tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
        });

        // Upsert Instagram Account if linked
        if (page.instagram_business_account?.id) {
          await prisma.channel.upsert({
            where: { id: `ig_channel_${page.instagram_business_account.id}` },
            update: {
              pageName: `${page.name} (Instagram)`,
              accessToken: encryptSecret(page.access_token) || page.access_token,
              isActive: true,
            },
            create: {
              id: `ig_channel_${page.instagram_business_account.id}`,
              tenantId: tenant.id,
              type: "INSTAGRAM",
              pageId: page.instagram_business_account.id,
              pageName: `${page.name} (Instagram)`,
              accessToken: encryptSecret(page.access_token) || page.access_token,
              isActive: true,
            },
          });
        }
      }
    } catch (apiErr) {
      console.error("[META] Live Graph API error during 1-click token exchange:", apiErr);
    }
  }

  // Fallback / standard active channel creation if live Graph API is simulated
  if (connectedPages.length === 0) {
    await prisma.channel.upsert({
      where: { id: `fb_channel_${tenant.id}` },
      update: {
        type: "FACEBOOK",
        pageName: "Connected Facebook Page",
        isActive: true,
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
      create: {
        id: `fb_channel_${tenant.id}`,
        tenantId: tenant.id,
        type: "FACEBOOK",
        pageName: "Connected Facebook Page",
        isActive: true,
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    });
  }

  return { success: true, connectedPages };
}

