import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logIslem } from "@/lib/log";

// Hangi tip için hangi prisma model'i kullanılacak — undo için
const MODEL_MAP: Record<string, string> = {
  Aidat:           "aidat",
  Odeme:           "odeme",
  ServisFaturasi:  "servisFaturasi",
  GunlukOdeme:     "gunlukOdeme",
  EtapFatura:      "etapFatura",
};

// Modül → bulk import ile eklenen kayıtların hangi modele gittiği
const BULK_MODEL_MAP: Record<string, string> = {
  "odeme-import": "gunlukOdeme",
  "aidat":        "aidat",
};

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const log = await prisma.islemLog.findUnique({ where: { id } });
  if (!log) return NextResponse.json({ error: "İşlem kaydı bulunamadı" }, { status: 404 });
  if (log.geriAlindi) return NextResponse.json({ error: "Bu işlem zaten geri alınmış" }, { status: 400 });

  try {
    // ── BULK_IMPORT: aynı dakikada eklenmiş kayıtları sil ──
    if (log.eylem === "BULK_IMPORT") {
      const modelKey = BULK_MODEL_MAP[log.modul];
      if (!modelKey) {
        return NextResponse.json({ error: "Bu toplu işlem türü için geri alma desteklenmiyor" }, { status: 400 });
      }
      // @ts-expect-error — dinamik model
      const model = prisma[modelKey];

      // sonrakiVeri içinde ids varsa direkt onları sil; yoksa tarih bazlı yaklaşık sil
      const sonraki = log.sonrakiVeri ? JSON.parse(log.sonrakiVeri) : null;
      let silinen = 0;

      if (sonraki?.ids && Array.isArray(sonraki.ids) && sonraki.ids.length > 0) {
        const r = await model.deleteMany({ where: { id: { in: sonraki.ids } } });
        silinen = r.count;
      } else {
        // Eski loglar — ids saklanmamış. Tarih + dosya filtresi ile yaklaşık silme yap.
        const tarihUst = new Date(new Date(log.olusturmaTar).getTime() + 60_000);  // log + 60s
        const tarihAlt = new Date(new Date(log.olusturmaTar).getTime() - 5_000);   // log - 5s
        if (log.modul === "odeme-import" && sonraki?.dosya) {
          const r = await model.deleteMany({
            where: {
              importDosya: sonraki.dosya,
              olusturmaTar: { gte: tarihAlt, lte: tarihUst },
            },
          });
          silinen = r.count;
        } else if (log.modul === "aidat" && sonraki?.yil && sonraki?.ay) {
          const r = await model.deleteMany({
            where: {
              yil: sonraki.yil,
              ay:  sonraki.ay,
              olusturmaTar: { gte: tarihAlt, lte: tarihUst },
            },
          });
          silinen = r.count;
        } else {
          return NextResponse.json({
            error: "Bu toplu işlem geri alınamaz (eski log — ID listesi yok). Yeni toplu işlemler için geri alma çalışacak."
          }, { status: 400 });
        }
      }

      await prisma.islemLog.update({
        where: { id },
        data: {
          geriAlindi: true, geriAlinmaTar: new Date(),
          geriAlanId: session.id, geriAlanAd: `${session.ad} ${session.soyad}`,
        },
      });
      await logIslem({
        modul: "islem-geri-al", eylem: "BULK_DELETE",
        baslik: `Toplu işlem geri alındı: ${log.baslik} (${silinen} kayıt silindi)`,
        detay: `Orijinal log #${log.id}`,
      });
      return NextResponse.json({ ok: true, silinen });
    }

    // ── Tekil işlemler için targetType lazım ──
    const targetType = log.targetType;
    if (!targetType || !(targetType in MODEL_MAP)) {
      return NextResponse.json({
        error: `Bu işlem türü için geri alma desteklenmiyor${targetType ? ` (${targetType})` : ""}`
      }, { status: 400 });
    }
    // @ts-expect-error — dinamik model
    const model = prisma[MODEL_MAP[targetType]];

    if (log.eylem === "DELETE" && log.oncekiVeri) {
      const data = JSON.parse(log.oncekiVeri);
      const norm = normalizeDates(data);
      await model.create({ data: norm });
    } else if (log.eylem === "UPDATE" && log.oncekiVeri && log.targetId) {
      const data = JSON.parse(log.oncekiVeri);
      const norm = normalizeDates(data);
      const { id: _id, ...rest } = norm;
      void _id;
      await model.update({ where: { id: log.targetId }, data: rest });
    } else if (log.eylem === "CREATE" && log.targetId) {
      await model.delete({ where: { id: log.targetId } });
    } else {
      return NextResponse.json({ error: "Bu kayıt için geri alma yapılamaz (eksik snapshot verisi)" }, { status: 400 });
    }

    await prisma.islemLog.update({
      where: { id },
      data: {
        geriAlindi:    true,
        geriAlinmaTar: new Date(),
        geriAlanId:    session.id,
        geriAlanAd:    `${session.ad} ${session.soyad}`,
      },
    });

    // Geri-alma da log'la
    await logIslem({
      modul: "islem-geri-al",
      eylem: "UPDATE",
      baslik: `Geri alındı: ${log.baslik}`,
      detay: `Orijinal log #${log.id}`,
      targetType: log.targetType ?? undefined,
      targetId: log.targetId ?? undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Geri alma hatası" }, { status: 500 });
  }
}

function normalizeDates(o: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
      out[k] = new Date(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}
