import "server-only";

import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "traveloop_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("Missing NEXTAUTH_SECRET. Add it to .env.local before running Traveloop.");
  }

  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(":");

  if (!salt || !key) {
    return false;
  }

  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const stored = Buffer.from(key, "base64url");

  return stored.length === derived.length && timingSafeEqual(stored, derived);
}

export async function createSession(userId: string) {
  const expires = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${userId}.${expires}`;
  const token = `${payload}.${sign(payload)}`;
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const [userId, expires, signature] = token.split(".");
  const payload = `${userId}.${expires}`;

  if (!userId || !expires || !signature || sign(payload) !== signature || Number(expires) < Date.now()) {
    return null;
  }

  return userId;
}

export async function getCurrentUser() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      photoUrl: true,
      language: true
    }
  });
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
