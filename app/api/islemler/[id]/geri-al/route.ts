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

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const log = await prisma.islemLog.findUnique({ where: { id } });
  if (!log) return NextResponse.json({ error: "İşlem kaydı bulunamadı" }, { status: 404 });
  if (log.geriAlindi) return NextResponse.json({ error: "Bu işlem zaten geri alınmış" }, { status: 400 });

  const targetType = log.targetType;
  if (!targetType || !(targetType in MODEL_MAP)) {
    return NextResponse.json({ error: `Bu işlem türü geri alınamaz: ${targetType}` }, { status: 400 });
  }

  // @ts-expect-error — dinamik model adı
  const model = prisma[MODEL_MAP[targetType]];

  try {
    if (log.eylem === "DELETE" && log.oncekiVeri) {
      // Silinmiş kaydı geri ekle
      const data = JSON.parse(log.oncekiVeri);
      // Tarih alanlarını Date'e çevir (Prisma ister)
      const norm = normalizeDates(data);
      await model.create({ data: norm });
    } else if (log.eylem === "UPDATE" && log.oncekiVeri && log.targetId) {
      const data = JSON.parse(log.oncekiVeri);
      const norm = normalizeDates(data);
      // id'yi where'e geçir, geri kalanını data
      const { id: _id, ...rest } = norm;
      void _id;
      await model.update({ where: { id: log.targetId }, data: rest });
    } else if (log.eylem === "CREATE" && log.targetId) {
      // Yeni eklenen kaydı sil
      await model.delete({ where: { id: log.targetId } });
    } else {
      return NextResponse.json({ error: "Bu kayıt türü için geri alma yapılamaz (eksik veri)" }, { status: 400 });
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
