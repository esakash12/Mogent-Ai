import * as React from "react";
import prisma from "@/lib/db";
import { decryptSecret } from "@/lib/encryption";
import { getServerOutboundIp } from "@/lib/server-ip";
import { ApiSettingsClient } from "./api-settings-client";

export const dynamic = "force-dynamic";

export default async function SuperAdminApiSettingsPage() {
  const config = await prisma.superAdminConfig.findFirst();
  const serverIp = await getServerOutboundIp();

  return (
    <ApiSettingsClient
      initialConfig={{
        // AI Brain
        defaultAiModel: (config?.defaultAiModel === "gemini-1.5-flash" ? "gemini-3.5-flash-lite" : config?.defaultAiModel) || "gemini-3.5-flash-lite",
        openaiApiKey: decryptSecret(config?.openaiApiKey),
        geminiApiKey: decryptSecret(config?.geminiApiKey),
        anthropicApiKey: decryptSecret(config?.anthropicApiKey),
        perMessageCost: config?.perMessageCost ?? 0.25,

        // Voice & Telephony
        voiceProvider: config?.voiceProvider || "TWILIO",
        twilioAccountSid: config?.twilioAccountSid || "",
        twilioAuthToken: decryptSecret(config?.twilioAuthToken),
        twilioPhoneNumber: config?.twilioPhoneNumber || "",
        sipServer: config?.sipServer || "",
        sipPort: config?.sipPort ?? 5060,
        sipUsername: config?.sipUsername || "",
        sipPassword: decryptSecret(config?.sipPassword),
        sipCallerId: config?.sipCallerId || "",
        ttsProvider: config?.ttsProvider || "ELEVENLABS",
        ttsApiKey: decryptSecret(config?.ttsApiKey),
        ttsVoiceId: config?.ttsVoiceId || "",
        perMinuteCallCost: config?.perMinuteCallCost ?? 2.50,

        // SMS Gateways
        smsProvider: config?.smsProvider || "GREENWEB",
        greenwebToken: decryptSecret(config?.greenwebToken),
        bulksmsApiKey: decryptSecret(config?.bulksmsApiKey),
        bulksmsSenderId: config?.bulksmsSenderId || "",
        sslczSmsApiKey: decryptSecret(config?.sslczSmsApiKey),
        sslczSmsSid: config?.sslczSmsSid || "",
        perSmsCost: config?.perSmsCost ?? 0.35,

        // Payment Gateways
        bkashAppKey: config?.bkashAppKey || "",
        bkashAppSecret: decryptSecret(config?.bkashAppSecret),
        bkashUsername: config?.bkashUsername || "",
        bkashPassword: decryptSecret(config?.bkashPassword),
        bkashSandbox: config?.bkashSandbox ?? true,
        sslczStoreId: config?.sslczStoreId || "",
        sslczStorePassword: decryptSecret(config?.sslczStorePassword),
        sslczSandbox: config?.sslczSandbox ?? true,
        aamarpayStoreId: config?.aamarpayStoreId || "",
        aamarpaySignatureKey: decryptSecret(config?.aamarpaySignatureKey),
        aamarpaySandbox: config?.aamarpaySandbox ?? true,

        // Cloud Storage
        storageProvider: config?.storageProvider || "LOCAL",
        storageAccessKeyId: config?.storageAccessKeyId || "",
        storageSecretAccessKey: decryptSecret(config?.storageSecretAccessKey),
        storageBucketName: config?.storageBucketName || "",
        storageRegion: config?.storageRegion || "ap-southeast-1",
        storageEndpoint: config?.storageEndpoint || "",
        storagePublicUrl: config?.storagePublicUrl || "",

        // Google OAuth & Sheets
        googleClientId: config?.googleClientId || "",
        googleClientSecret: decryptSecret(config?.googleClientSecret),
        googleSheetsApiKey: config?.googleSheetsApiKey || "",
        googleServiceAccountJson: decryptSecret(config?.googleServiceAccountJson),

        // Meta & WhatsApp Embedded Signup
        metaAppId: config?.metaAppId || "",
        metaAppSecret: decryptSecret(config?.metaAppSecret),
        metaConfigId: config?.metaConfigId || "",
        whatsappSystemToken: decryptSecret(config?.whatsappSystemToken),
        whatsappVerifyToken: config?.whatsappVerifyToken || "mogent_ai_secure_verify_token_2026",
      }}
      serverOutboundIp={serverIp}
    />
  );
}


