import prisma from "@/lib/db";
import { decryptSecret } from "@/lib/encryption";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface StorageConfig {
  provider: "LOCAL" | "AWS_S3" | "CLOUDFLARE_R2";
  bucketName: string;
  region: string;
  endpoint?: string;
  publicUrl?: string;
  client: S3Client;
}

/**
 * Resolves S3Client dynamically from SuperAdminConfig.
 * Decrypts secret access key securely with AES-256-GCM.
 */
export async function getStorageConfig(): Promise<StorageConfig | null> {
  const config = await prisma.superAdminConfig.findFirst();
  if (!config) return null;

  const provider = (config.storageProvider as "LOCAL" | "AWS_S3" | "CLOUDFLARE_R2") || "LOCAL";
  if (provider === "LOCAL") return null;

  const accessKeyId = config.storageAccessKeyId;
  const secretAccessKey = decryptSecret(config.storageSecretAccessKey);
  const bucketName = config.storageBucketName;
  const region = config.storageRegion || "ap-southeast-1";
  const endpoint = config.storageEndpoint || undefined;
  const publicUrl = config.storagePublicUrl || undefined;

  if (!accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  const client = new S3Client({
    region,
    endpoint: provider === "CLOUDFLARE_R2" ? endpoint : undefined,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    // Cloudflare R2 works best with path-style requests if using custom endpoint
    forcePathStyle: provider === "CLOUDFLARE_R2",
  });

  return {
    provider,
    bucketName,
    region,
    endpoint,
    publicUrl,
    client,
  };
}

/**
 * Upload a file directly to AWS S3 or Cloudflare R2
 */
export async function uploadBufferToStorage(params: {
  key: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const storage = await getStorageConfig();
    if (!storage) {
      return {
        success: false,
        error: "Cloud storage is not configured or is set to LOCAL.",
      };
    }

    const command = new PutObjectCommand({
      Bucket: storage.bucketName,
      Key: params.key,
      Body: params.buffer,
      ContentType: params.contentType,
    });

    await storage.client.send(command);

    let finalUrl = "";
    if (storage.publicUrl) {
      finalUrl = `${storage.publicUrl.replace(/\/$/, "")}/${params.key}`;
    } else if (storage.provider === "AWS_S3") {
      finalUrl = `https://${storage.bucketName}.s3.${storage.region}.amazonaws.com/${params.key}`;
    } else {
      finalUrl = `${storage.endpoint}/${storage.bucketName}/${params.key}`;
    }

    return {
      success: true,
      url: finalUrl,
    };
  } catch (err: any) {
    console.error("[STORAGE_UPLOAD_ERROR]", err);
    return {
      success: false,
      error: err.message || "Failed to upload object to cloud storage.",
    };
  }
}

/**
 * Generate a pre-signed URL for client-side direct S3/R2 uploads
 */
export async function getPresignedUploadUrl(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<{
  success: boolean;
  uploadUrl?: string;
  finalPublicUrl?: string;
  error?: string;
}> {
  try {
    const storage = await getStorageConfig();
    if (!storage) {
      return {
        success: false,
        error: "Cloud storage is not configured.",
      };
    }

    const command = new PutObjectCommand({
      Bucket: storage.bucketName,
      Key: params.key,
      ContentType: params.contentType,
    });

    const uploadUrl = await getSignedUrl(storage.client, command, {
      expiresIn: params.expiresInSeconds || 3600,
    });

    let finalPublicUrl = "";
    if (storage.publicUrl) {
      finalPublicUrl = `${storage.publicUrl.replace(/\/$/, "")}/${params.key}`;
    } else if (storage.provider === "AWS_S3") {
      finalPublicUrl = `https://${storage.bucketName}.s3.${storage.region}.amazonaws.com/${params.key}`;
    } else {
      finalPublicUrl = `${storage.endpoint}/${storage.bucketName}/${params.key}`;
    }

    return {
      success: true,
      uploadUrl,
      finalPublicUrl,
    };
  } catch (err: any) {
    console.error("[PRESIGNED_URL_ERROR]", err);
    return {
      success: false,
      error: err.message || "Failed to generate presigned URL.",
    };
  }
}
