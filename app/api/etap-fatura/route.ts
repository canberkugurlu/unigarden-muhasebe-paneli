import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const konutId = searchParams.get("konutId");
  const yil = searchParams.get("yil") ? Number(searchParams.get("yil")) : undefined;
  const ay = searchParams.get("ay") ? Number(searchParams.get("ay")) : undefined;

  try {
    if (konutId) {
      const where: Record<string, unknown> = { konutId };
      if (yil) where.yil = yil;
      if (ay) where.ay = ay;
      const faturalar = await prisma.etapFatura.findMany({ where, orderBy: [{ yil: "desc" }, { ay: "desc" }] });
      return NextResponse.json(faturalar);
    }

    const konutlar = await prisma.konut.findMany({
      where: { etap: 1 },
      select: {
        id: true, daireNo: true, blok: true, tip: true,
        sozlesmeler: {
          where: { durum: "Aktif" },
          select: { id: true, aylikKira: true, kisiSayisi: true, ogrenci: { select: { ad: true, soyad: true } } },
          take: 5,
        },
        etapFaturalari: { orderBy: [{ yil: "desc" }, { ay: "desc" }], take: 1 },
      },
      orderBy: { daireNo: "asc" },
    });
    return NextResponse.json(konutlar);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { konutId, yil, ay, elektrik = 0, su = 0, dogalgaz = 0, internet = 0, kotaEsigi = 1150, aciklama } = body;
    if (!konutId || !yil || !ay) return NextResponse.json({ error: "konutId, yil ve ay zorunludur" }, { status: 400 });

    const id = `${konutId}-${yil}-${ay}`;
    const fatura = await prisma.etapFatura.upsert({
      where: { konutId_yil_ay: { konutId, yil, ay } },
      update: { elektrik, su, dogalgaz, internet, kotaEsigi, aciklama },
      create: { id, konutId, yil, ay, elektrik, su, dogalgaz, internet, kotaEsigi, aciklama },
    });
    return NextResponse.json(fatura);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kayıt hatası" }, { status: 500 });
  }
}
