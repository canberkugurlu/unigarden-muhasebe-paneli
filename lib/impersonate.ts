import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.IMPERSONATION_SECRET ?? "unigarden-impersonation-shared-2026"
);

export interface ImpersonationPayload {
  targetUserId:  string;
  targetType:    "Kullanici" | "DaireSahibi" | "Ogrenci";
  targetPanel:   "muhasebe" | "kiralama" | "ev-sahibi" | "kiraci";
  adminId:       string;
  adminAd:       string;
}

export async function verifyImpersonationToken(token: string): Promise<ImpersonationPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as ImpersonationPayload;
  } catch {
    return null;
  }
}
