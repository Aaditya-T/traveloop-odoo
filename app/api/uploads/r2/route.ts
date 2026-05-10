import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createPresignedPut, type R2UploadScope, isAllowedContentType, isR2Configured } from "@/lib/r2";

export async function POST(request: Request) {
  if (!isR2Configured()) {
    return NextResponse.json({ error: "R2 uploads are not configured on this server." }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { scope?: string; contentType?: string };

  try {
    body = (await request.json()) as { scope?: string; contentType?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const scope = body.scope as R2UploadScope | undefined;
  const contentType = typeof body.contentType === "string" ? body.contentType.trim().toLowerCase() : "";

  const scopes: R2UploadScope[] = ["profile-avatar", "trip-cover", "receipt", "catalog-image"];
  if (!scope || !scopes.includes(scope)) {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }

  if (!contentType) {
    return NextResponse.json({ error: "contentType required" }, { status: 400 });
  }

  if (scope === "catalog-image" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAllowedContentType(scope, contentType)) {
    return NextResponse.json({ error: "This file type is not allowed." }, { status: 400 });
  }

  try {
    const { uploadUrl, publicUrl, key } = await createPresignedPut({
      scope,
      userId: user.id,
      contentType
    });

    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch {
    return NextResponse.json({ error: "Could not prepare upload." }, { status: 500 });
  }
}
