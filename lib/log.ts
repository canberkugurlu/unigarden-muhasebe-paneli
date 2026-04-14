import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export interface LogParams {
  panel?: string;             // default "muhasebe"
  modul: string;              // "odeme-import" | "aidat" | "servis-faturasi" | ...
  eylem: "CREATE" | "UPDATE" | "DELETE" | "BULK_IMPORT" | "BULK_DELETE";
  baslik: string;             // human-readable summary
  detay?: string;
  targetType?: string;        // "Konut" | "Aidat" | "Odeme" | ...
  targetId?: string;
  oncekiVeri?: unknown;       // before snapshot
  sonrakiVeri?: unknown;      // after snapshot
}

/**
 * Log helper — muhasebe-paneli'nin yaptığı işlemleri kaydeder.
 * - Sessizce başarısız olur (log hatası asıl işlemi durdurmamalı)
 * - Aktif kullanıcı session'dan otomatik alınır
 */
export async function logIslem(p: LogParams): Promise<void> {
  try {
    const session = await getSession().catch(() => null);
    await prisma.islemLog.create({
      data: {
        panel:        p.panel ?? "muhasebe",
        modul:        p.modul,
        eylem:        p.eylem,
        baslik:       p.baslik,
        detay:        p.detay        ?? null,
        targetType:   p.targetType   ?? null,
        targetId:     p.targetId     ?? null,
        oncekiVeri:   p.oncekiVeri   != null ? JSON.stringify(p.oncekiVeri)   : null,
        sonrakiVeri:  p.sonrakiVeri  != null ? JSON.stringify(p.sonrakiVeri)  : null,
        kullaniciId:  session?.id    ?? null,
        kullaniciAd:  session ? `${session.ad} ${session.soyad}` : null,
        kullaniciTip: "Muhasebe",
      },
    });
  } catch (e) {
    console.error("[islemLog] kaydedilemedi:", e instanceof Error ? e.message : e);
  }
}
