import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const ADMIN_SESSION_COOKIE = "cg_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 gün

// Ayrı bir env değişkenine gerek bırakmamak için oturum imza anahtarı,
// zaten gizli olan service-role key'den türetilir (yalnızca sunucuda mevcut).
function sessionSecret(): string {
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error("SUPABASE_SERVICE_ROLE_KEY tanımlı değil");
  return createHmac("sha256", base).update("cytogate-admin-session-v1").digest("hex");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, expected] = parts;
  const actual = scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expected, "hex");
  if (actual.length !== expectedBuf.length) return false;
  return timingSafeEqual(actual, expectedBuf);
}

function signSession(username: string, expiresAt: number): string {
  const payload = `${username}.${expiresAt}`;
  const sig = createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  return `${Buffer.from(username).toString("base64url")}.${expiresAt}.${sig}`;
}

function parseSession(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userB64, expStr, sig] = parts;
  const username = Buffer.from(userB64, "base64url").toString();
  const expiresAt = Number(expStr);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now() / 1000) return null;
  const expectedSig = createHmac("sha256", sessionSecret())
    .update(`${username}.${expiresAt}`)
    .digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return username;
}

export async function createAdminSession(username: string): Promise<void> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const token = signSession(username, expiresAt);
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
}

/** Geçerli oturum varsa admin kullanıcı adını, yoksa null döner. */
export async function getAdminUsername(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseSession(token);
}

/** Server action'ların başında çağrılır; oturum yoksa hata fırlatır. */
export async function requireAdmin(): Promise<string> {
  const username = await getAdminUsername();
  if (!username) throw new Error("Yetkisiz erişim");
  return username;
}

/** Admin sayfalarının başında çağrılır; oturum yoksa giriş sayfasına yönlendirir. */
export async function requireAdminOrRedirect(): Promise<string> {
  const username = await getAdminUsername();
  if (!username) redirect("/admin/giris");
  return username;
}

export async function verifyCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return false;
  const { data } = await supabase
    .from("admin_users")
    .select("password_hash")
    .eq("username", username)
    .maybeSingle();
  if (!data) return false;
  return verifyPassword(password, data.password_hash);
}
