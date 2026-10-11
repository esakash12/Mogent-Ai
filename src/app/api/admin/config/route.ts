import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";
import { encryptSecret, decryptSecret } from "@/lib/encryption";
import { getServerOutboundIp } from "@/lib/server-ip";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    let config = await prisma.superAdminConfig.findFirst();
    if (!config) {
      config = await prisma.superAdminConfig.create({
        data: {
          defaultAiModel: "gemini-3.5-flash-lite",
          perMessageCost: 0.25,
          perMinuteCallCost: 2.50,
          perSmsCost: 0.35,
        },
      });
    }

    const serverOutboundIp = await getServerOutboundIp();

    // Decrypt sensitive credentials for Super Admin display
    const decryptedConfig = {
      ...config,
      // AI Keys
      openaiApiKey: decryptSecret(config.openaiApiKey),
      geminiApiKey: decryptSecret(config.geminiApiKey),
      anthropicApiKey: decryptSecret(config.anthropicApiKey),
      // Meta / WhatsApp
      metaAppSecret: decryptSecret(config.metaAppSecret),
      whatsappSystemToken: decryptSecret(config.whatsappSystemToken),
      // Voice / Telephony
      twilioAuthToken: decryptSecret(config.twilioAuthToken),
      sipPassword: decryptSecret(config.sipPassword),
      ttsApiKey: decryptSecret(config.ttsApiKey),
      // SMS
      greenwebToken: decryptSecret(config.greenwebToken),
      bulksmsApiKey: decryptSecret(config.bulksmsApiKey),
      sslczSmsApiKey: decryptSecret(config.sslczSmsApiKey),
      // Payment
      bkashAppSecret: decryptSecret(config.bkashAppSecret),
      bkashPassword: decryptSecret(config.bkashPassword),
      sslczStorePassword: decryptSecret(config.sslczStorePassword),
      aamarpaySignatureKey: decryptSecret(config.aamarpaySignatureKey),
      // Storage
      storageSecretAccessKey: decryptSecret(config.storageSecretAccessKey),
      // Google
      googleClientSecret: decryptSecret(config.googleClientSecret),
      googleServiceAccountJson: decryptSecret(config.googleServiceAccountJson),
    };

    return NextResponse.json({
      success: true,
      config: decryptedConfig,
      serverOutboundIp,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();

    const dataToUpdate: any = {};

    // 1. AI Brain & Models
    if (body.defaultAiModel !== undefined) dataToUpdate.defaultAiModel = body.defaultAiModel;
    if (body.perMessageCost !== undefined) dataToUpdate.perMessageCost = parseFloat(body.perMessageCost) || 0.25;
    if (body.openaiApiKey !== undefined) dataToUpdate.openaiApiKey = encryptSecret(body.openaiApiKey);
    if (body.geminiApiKey !== undefined) dataToUpdate.geminiApiKey = encryptSecret(body.geminiApiKey);
    if (body.anthropicApiKey !== undefined) dataToUpdate.anthropicApiKey = encryptSecret(body.anthropicApiKey);

    // 2. Voice & Telephony (Twilio & Local SIP / VoIP)
    if (body.voiceProvider !== undefined) dataToUpdate.voiceProvider = body.voiceProvider;
    if (body.twilioAccountSid !== undefined) dataToUpdate.twilioAccountSid = body.twilioAccountSid?.trim() || null;
    if (body.twilioAuthToken !== undefined) dataToUpdate.twilioAuthToken = encryptSecret(body.twilioAuthToken);
    if (body.twilioPhoneNumber !== undefined) dataToUpdate.twilioPhoneNumber = body.twilioPhoneNumber?.trim() || null;
    if (body.sipServer !== undefined) dataToUpdate.sipServer = body.sipServer?.trim() || null;
    if (body.sipPort !== undefined) dataToUpdate.sipPort = parseInt(body.sipPort) || 5060;
    if (body.sipUsername !== undefined) dataToUpdate.sipUsername = body.sipUsername?.trim() || null;
    if (body.sipPassword !== undefined) dataToUpdate.sipPassword = encryptSecret(body.sipPassword);
    if (body.sipCallerId !== undefined) dataToUpdate.sipCallerId = body.sipCallerId?.trim() || null;
    if (body.ttsProvider !== undefined) dataToUpdate.ttsProvider = body.ttsProvider;
    if (body.ttsApiKey !== undefined) dataToUpdate.ttsApiKey = encryptSecret(body.ttsApiKey);
    if (body.ttsVoiceId !== undefined) dataToUpdate.ttsVoiceId = body.ttsVoiceId?.trim() || null;
    if (body.perMinuteCallCost !== undefined) dataToUpdate.perMinuteCallCost = parseFloat(body.perMinuteCallCost) || 2.50;

    // 3. SMS Gateways (Greenweb, BulkSMSBD, SSL Wireless)
    if (body.smsProvider !== undefined) dataToUpdate.smsProvider = body.smsProvider;
    if (body.greenwebToken !== undefined) dataToUpdate.greenwebToken = encryptSecret(body.greenwebToken);
    if (body.bulksmsApiKey !== undefined) dataToUpdate.bulksmsApiKey = encryptSecret(body.bulksmsApiKey);
    if (body.bulksmsSenderId !== undefined) dataToUpdate.bulksmsSenderId = body.bulksmsSenderId?.trim() || null;
    if (body.sslczSmsApiKey !== undefined) dataToUpdate.sslczSmsApiKey = encryptSecret(body.sslczSmsApiKey);
    if (body.sslczSmsSid !== undefined) dataToUpdate.sslczSmsSid = body.sslczSmsSid?.trim() || null;
    if (body.perSmsCost !== undefined) dataToUpdate.perSmsCost = parseFloat(body.perSmsCost) || 0.35;

    // 4. Payment Gateways (bKash, SSLCommerz, AamarPay)
    if (body.bkashAppKey !== undefined) dataToUpdate.bkashAppKey = body.bkashAppKey?.trim() || null;
    if (body.bkashAppSecret !== undefined) dataToUpdate.bkashAppSecret = encryptSecret(body.bkashAppSecret);
    if (body.bkashUsername !== undefined) dataToUpdate.bkashUsername = body.bkashUsername?.trim() || null;
    if (body.bkashPassword !== undefined) dataToUpdate.bkashPassword = encryptSecret(body.bkashPassword);
    if (body.bkashSandbox !== undefined) dataToUpdate.bkashSandbox = Boolean(body.bkashSandbox);
    if (body.sslczStoreId !== undefined) dataToUpdate.sslczStoreId = body.sslczStoreId?.trim() || null;
    if (body.sslczStorePassword !== undefined) dataToUpdate.sslczStorePassword = encryptSecret(body.sslczStorePassword);
    if (body.sslczSandbox !== undefined) dataToUpdate.sslczSandbox = Boolean(body.sslczSandbox);
    if (body.aamarpayStoreId !== undefined) dataToUpdate.aamarpayStoreId = body.aamarpayStoreId?.trim() || null;
    if (body.aamarpaySignatureKey !== undefined) dataToUpdate.aamarpaySignatureKey = encryptSecret(body.aamarpaySignatureKey);
    if (body.aamarpaySandbox !== undefined) dataToUpdate.aamarpaySandbox = Boolean(body.aamarpaySandbox);

    // 5. Cloud Storage (AWS S3 & Cloudflare R2)
    if (body.storageProvider !== undefined) dataToUpdate.storageProvider = body.storageProvider;
    if (body.storageAccessKeyId !== undefined) dataToUpdate.storageAccessKeyId = body.storageAccessKeyId?.trim() || null;
    if (body.storageSecretAccessKey !== undefined) dataToUpdate.storageSecretAccessKey = encryptSecret(body.storageSecretAccessKey);
    if (body.storageBucketName !== undefined) dataToUpdate.storageBucketName = body.storageBucketName?.trim() || null;
    if (body.storageRegion !== undefined) dataToUpdate.storageRegion = body.storageRegion?.trim() || "ap-southeast-1";
    if (body.storageEndpoint !== undefined) dataToUpdate.storageEndpoint = body.storageEndpoint?.trim() || null;
    if (body.storagePublicUrl !== undefined) dataToUpdate.storagePublicUrl = body.storagePublicUrl?.trim() || null;

    // 6. Google OAuth & Cloud Sheets
    if (body.googleClientId !== undefined) dataToUpdate.googleClientId = body.googleClientId?.trim() || null;
    if (body.googleClientSecret !== undefined) dataToUpdate.googleClientSecret = encryptSecret(body.googleClientSecret);
    if (body.googleSheetsApiKey !== undefined) dataToUpdate.googleSheetsApiKey = body.googleSheetsApiKey?.trim() || null;
    if (body.googleServiceAccountJson !== undefined) dataToUpdate.googleServiceAccountJson = encryptSecret(body.googleServiceAccountJson);

    // 7. Meta & WhatsApp Embedded Signup
    if (body.metaAppId !== undefined) dataToUpdate.metaAppId = body.metaAppId?.trim() || null;
    if (body.metaAppSecret !== undefined) dataToUpdate.metaAppSecret = encryptSecret(body.metaAppSecret);
    if (body.metaConfigId !== undefined) dataToUpdate.metaConfigId = body.metaConfigId?.trim() || null;
    if (body.whatsappSystemToken !== undefined) dataToUpdate.whatsappSystemToken = encryptSecret(body.whatsappSystemToken);
    if (body.whatsappVerifyToken !== undefined) dataToUpdate.whatsappVerifyToken = body.whatsappVerifyToken?.trim() || "mogent_ai_secure_verify_token_2026";

    let config = await prisma.superAdminConfig.findFirst();

    if (config) {
      config = await prisma.superAdminConfig.update({
        where: { id: config.id },
        data: dataToUpdate,
      });
    } else {
      config = await prisma.superAdminConfig.create({
        data: {
          defaultAiModel: "gemini-3.5-flash-lite",
          perMessageCost: 0.25,
          ...dataToUpdate,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "সুপার অ্যাডমিন সেন্ট্রাল কনফিগারেশন সফলভাবে এনক্রিপ্ট ও সেভ হয়েছে!",
      config: {
        id: config.id,
        updatedAt: config.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Admin config save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

