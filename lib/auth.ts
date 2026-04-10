import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "unigarden-muhasebe-jwt-gizli-2024"
);
export const COOKIE = "muhasebe_token";

export interface MuhasebePanelPayload {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  rol: string;
}

export async function signToken(payload: MuhasebePanelPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<MuhasebePanelPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as MuhasebePanelPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<MuhasebePanelPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}
