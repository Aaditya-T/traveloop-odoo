import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "node:crypto";

export type R2UploadScope = "profile-avatar" | "trip-cover" | "receipt" | "catalog-image";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const RECEIPT_TYPES = new Set([...IMAGE_TYPES, "application/pdf"]);

export function isR2Configured(): boolean {
  return getR2Config() !== null;
}

function getR2Config() {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET ?? process.env.R2_BUCKET_NAME;
  const publicBase = process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  const endpoint =
    process.env.R2_S3_API?.replace(/\/+$/, "") ||
    (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : null);

  if (!accessKeyId || !secretAccessKey || !bucket || !publicBase || !endpoint) {
    return null;
  }

  return { accessKeyId, secretAccessKey, bucket, publicBase, endpoint };
}

function r2Client() {
  const c = getR2Config();
  if (!c) {
    throw new Error("R2_NOT_CONFIGURED");
  }

  return new S3Client({
    region: "auto",
    endpoint: c.endpoint,
    credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey }
  });
}

function extForContentType(contentType: string) {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "application/pdf":
      return "pdf";
    default:
      return "bin";
  }
}

export function isAllowedContentType(scope: R2UploadScope, contentType: string) {
  if (scope === "receipt") {
    return RECEIPT_TYPES.has(contentType);
  }
  return IMAGE_TYPES.has(contentType);
}

export async function createPresignedPut(params: {
  scope: R2UploadScope;
  userId: string;
  contentType: string;
}): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const config = getR2Config();
  if (!config) {
    throw new Error("R2_NOT_CONFIGURED");
  }

  const { scope, userId, contentType } = params;
  if (!isAllowedContentType(scope, contentType)) {
    throw new Error("INVALID_CONTENT_TYPE");
  }

  const id = randomBytes(12).toString("hex");
  const ext = extForContentType(contentType);

  let key: string;
  switch (scope) {
    case "profile-avatar":
      key = `uploads/users/${userId}/avatar/${id}.${ext}`;
      break;
    case "trip-cover":
      key = `uploads/users/${userId}/trips/covers/${id}.${ext}`;
      break;
    case "receipt":
      key = `uploads/users/${userId}/receipts/${id}.${ext}`;
      break;
    case "catalog-image":
      key = `uploads/catalog/${id}.${ext}`;
      break;
    default:
      key = `uploads/misc/${id}.${ext}`;
  }

  const client = r2Client();
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 * 10 });
  const publicUrl = `${config.publicBase}/${key}`;

  return { uploadUrl, publicUrl, key };
}
