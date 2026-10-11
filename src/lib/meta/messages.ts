import fs from "fs";
import path from "path";

/**
 * Facebook Messenger & Instagram Direct Graph API Dispatcher
 */

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".webm":
      return "audio/webm";
    case ".mp4":
      return "video/mp4";
    default:
      return "application/octet-stream";
  }
}

/**
 * Mark a customer's incoming message as Seen (পঠিত / Read Receipt)
 */
export async function markFacebookSeen(
  pageAccessToken: string,
  recipientPsid: string
) {
  if (!pageAccessToken || !recipientPsid) return;

  const endpoint = `https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(
    pageAccessToken
  )}`;

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientPsid },
        sender_action: "mark_seen",
      }),
    });
  } catch (err) {
    console.warn("[META SENDER] mark_seen warning:", err);
  }
}

/**
 * Fetch Customer Profile (Name, Profile Pic) via Messenger PSID
 */
export async function fetchFacebookUserProfile(
  pageAccessToken: string,
  psid: string
): Promise<{ name?: string; firstName?: string; lastName?: string; profilePic?: string } | null> {
  if (!pageAccessToken || !psid) return null;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${psid}?fields=first_name,last_name,name,profile_pic&access_token=${encodeURIComponent(
        pageAccessToken
      )}`
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const fullName =
      data.name ||
      [data.first_name, data.last_name].filter(Boolean).join(" ") ||
      undefined;

    return {
      name: fullName,
      firstName: data.first_name,
      lastName: data.last_name,
      profilePic: data.profile_pic,
    };
  } catch (err) {
    console.warn("[META PROFILE] Error fetching profile for PSID:", err);
    return null;
  }
}

/**
 * Resolve local relative media paths to fully qualified public URLs
 */
export function resolvePublicMediaUrl(mediaUrl: string, hostHeader?: string | null): string {
  if (!mediaUrl) return "";
  if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
    return mediaUrl;
  }

  if (hostHeader) {
    const cleanHost = hostHeader.replace(/^https?:\/\//, "");
    const proto = cleanHost.includes("localhost") ? "http" : "https";
    return `${proto}://${cleanHost}${mediaUrl.startsWith("/") ? "" : "/"}${mediaUrl}`;
  }

  const defaultAppUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://tablet-rosy-unhearing.ngrok-free.dev";
  const cleanAppUrl = defaultAppUrl.replace(/\/$/, "");
  return `${cleanAppUrl}${mediaUrl.startsWith("/") ? "" : "/"}${mediaUrl}`;
}

export interface FacebookCarouselButton {
  type: "postback" | "web_url";
  title: string;
  payload?: string;
  url?: string;
}

export interface FacebookCarouselElement {
  title: string;
  subtitle?: string;
  image_url?: string;
  buttons?: FacebookCarouselButton[];
}

export interface FacebookQuickReply {
  content_type?: "text";
  title: string;
  payload: string;
}

/**
 * Send Facebook Generic Template (Product Card Carousel)
 */
export async function sendFacebookGenericTemplate(
  pageAccessToken: string,
  recipientPsid: string,
  elements: FacebookCarouselElement[]
) {
  if (!pageAccessToken || !recipientPsid || !elements || elements.length === 0) {
    return null;
  }

  const endpoint = `https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(
    pageAccessToken
  )}`;

  const payloadElements = elements.slice(0, 10).map((el) => ({
    title: el.title.slice(0, 80),
    ...(el.subtitle ? { subtitle: el.subtitle.slice(0, 80) } : {}),
    ...(el.image_url ? { image_url: el.image_url } : {}),
    ...(el.buttons && el.buttons.length > 0
      ? {
          buttons: el.buttons.slice(0, 3).map((btn) =>
            btn.type === "web_url"
              ? { type: "web_url", title: btn.title.slice(0, 20), url: btn.url }
              : { type: "postback", title: btn.title.slice(0, 20), payload: btn.payload || btn.title }
          ),
        }
      : {}),
  }));

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientPsid },
        messaging_type: "RESPONSE",
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: payloadElements,
            },
          },
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[META SENDER] Generic template error:", data);
      return { success: false, error: data };
    }
    return { success: true, messageId: data.message_id };
  } catch (err: any) {
    console.error("[META SENDER] Generic template network error:", err);
    return { success: false, error: err.message };
  }
}

export async function sendFacebookReply(
  pageAccessToken: string,
  recipientPsid: string,
  messageText: string = "",
  mediaUrl?: string | null,
  publicBaseUrl?: string | null,
  interactiveOptions?: {
    carouselElements?: FacebookCarouselElement[];
    quickReplies?: FacebookQuickReply[];
  }
) {
  if (
    !pageAccessToken ||
    !recipientPsid ||
    (!messageText?.trim() && !mediaUrl && (!interactiveOptions?.carouselElements || interactiveOptions.carouselElements.length === 0))
  ) {
    console.warn("[META SENDER] Missing token, recipient, or content", {
      hasToken: Boolean(pageAccessToken),
      recipientPsid,
      textLength: messageText?.length,
      hasMedia: Boolean(mediaUrl),
      hasCarousel: Boolean(interactiveOptions?.carouselElements?.length),
    });
    return null;
  }

  const endpoint = `https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(
    pageAccessToken
  )}`;

  try {
    // 1. Mark incoming message as Seen first
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientPsid },
        sender_action: "mark_seen",
      }),
    }).catch(() => {});

    // 2. Send Typing Indicator (Typing bubble in Messenger)
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientPsid },
        sender_action: "typing_on",
      }),
    }).catch(() => {});

    // 3. Humanized natural pause
    await new Promise((resolve) => setTimeout(resolve, 600));

    let lastResult: any = null;

    // 4. Send Carousel (Product Cards) if provided
    if (interactiveOptions?.carouselElements && interactiveOptions.carouselElements.length > 0) {
      const carouselRes = await sendFacebookGenericTemplate(
        pageAccessToken,
        recipientPsid,
        interactiveOptions.carouselElements
      );
      if (carouselRes?.success) {
        lastResult = carouselRes;
      }
    }

    // 5. Send Media Attachment if provided
    if (mediaUrl) {
      const isAudio =
        mediaUrl.endsWith(".webm") ||
        mediaUrl.endsWith(".mp3") ||
        mediaUrl.endsWith(".wav") ||
        mediaUrl.includes("audio");
      const attachmentType = isAudio ? "audio" : "image";

      let localDiskPath: string | null = null;
      if (!mediaUrl.startsWith("http://") && !mediaUrl.startsWith("https://")) {
        const cleanRelative = mediaUrl.replace(/^\/?/, "");
        const candidate = path.join(process.cwd(), "public", cleanRelative);
        if (fs.existsSync(candidate)) {
          localDiskPath = candidate;
        }
      }

      if (localDiskPath) {
        try {
          const fileBuffer = fs.readFileSync(localDiskPath);
          const mimeType = getMimeType(localDiskPath);
          const fileName = path.basename(localDiskPath);

          const formData = new FormData();
          formData.append("recipient", JSON.stringify({ id: recipientPsid }));
          formData.append(
            "message",
            JSON.stringify({
              attachment: {
                type: attachmentType,
                payload: { is_reusable: true },
              },
            })
          );
          const blob = new Blob([fileBuffer], { type: mimeType });
          formData.append("filedata", blob, fileName);

          const mediaRes = await fetch(endpoint, {
            method: "POST",
            body: formData,
          });

          const mediaData = await mediaRes.json();
          if (!mediaRes.ok) {
            console.error("[META SENDER] Failed to send binary attachment to Facebook:", mediaData);
          } else {
            console.log("[META SENDER] Binary attachment sent successfully to Facebook:", {
              recipientPsid,
              messageId: mediaData.message_id,
            });
            lastResult = { success: true, messageId: mediaData.message_id };
          }
        } catch (uploadErr) {
          console.error("[META SENDER] Error uploading binary file:", uploadErr);
        }
      } else {
        const fullUrl = resolvePublicMediaUrl(mediaUrl, publicBaseUrl);
        const mediaPayload = {
          recipient: { id: recipientPsid },
          message: {
            attachment: {
              type: attachmentType,
              payload: {
                url: fullUrl,
                is_reusable: true,
              },
            },
          },
        };

        const mediaRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mediaPayload),
        });

        const mediaData = await mediaRes.json();
        if (!mediaRes.ok) {
          console.error("[META SENDER] Failed to send attachment URL to Facebook:", mediaData);
        } else {
          lastResult = { success: true, messageId: mediaData.message_id };
        }
      }
    }

    // 6. Parse embedded [QUICK_REPLIES: opt1, opt2] directive from text if present
    let rawText = messageText || "";
    let extractedQuickReplies: FacebookQuickReply[] = interactiveOptions?.quickReplies || [];

    const quickReplyMatch = rawText.match(/\[QUICK_REPLIES:\s*([^\]]+)\]/i);
    if (quickReplyMatch) {
      const optionsStr = quickReplyMatch[1];
      const parsed = optionsStr
        .split(/[,|]/)
        .map((opt) => opt.trim())
        .filter(Boolean)
        .map((opt) => ({
          content_type: "text" as const,
          title: opt.slice(0, 20),
          payload: `OPTION_${opt.toUpperCase().replace(/\s+/g, "_")}`,
        }));

      if (parsed.length > 0) {
        extractedQuickReplies = [...extractedQuickReplies, ...parsed];
      }
      // Strip directive from user-facing message text
      rawText = rawText.replace(quickReplyMatch[0], "").trim();
    }

    // 7. Send Text Message (supports human-like [SPLIT] message delivery)
    if (rawText && rawText.trim().length > 0) {
      const parts = rawText
        .split(/\[SPLIT\]/i)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      let lastMessageId: string | undefined;

      for (let i = 0; i < parts.length; i++) {
        const bubbleText = parts[i];
        const isLastBubble = i === parts.length - 1;

        // If not first bubble, show natural typing indicator and human delay
        if (i > 0) {
          await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipient: { id: recipientPsid },
              sender_action: "typing_on",
            }),
          }).catch(() => {});

          const delayMs = Math.min(1400, Math.max(800, bubbleText.length * 25));
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        const messagePayload: any = {
          text: bubbleText,
        };

        // Attach Quick Replies to the very last text bubble
        if (isLastBubble && extractedQuickReplies && extractedQuickReplies.length > 0) {
          messagePayload.quick_replies = extractedQuickReplies.slice(0, 13).map((qr) => ({
            content_type: "text",
            title: qr.title.slice(0, 20),
            payload: qr.payload || qr.title,
          }));
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: { id: recipientPsid },
            messaging_type: "RESPONSE",
            message: messagePayload,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          console.error(`[META SENDER] Graph API Send Error on bubble ${i + 1}:`, data);
          return lastResult || { success: false, error: data };
        }
        lastMessageId = data.message_id;
      }

      return { success: true, messageId: lastMessageId };
    }

    return lastResult || { success: true };
  } catch (error: any) {
    console.error("[META SENDER] Network error sending Facebook reply:", error);
    return { success: false, error: error.message };
  }
}

