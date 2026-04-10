import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eslestirildi = searchParams.get("eslestirildi");
    const limit = parseInt(searchParams.get("limit") ?? "200");

    const where: Record<string, unknown> = {};
    if (eslestirildi !== null && eslestirildi !== "") {
      where.eslestirildi = eslestirildi === "true";
    }

    const odemeler = await prisma.gunlukOdeme.findMany({
      where,
      include: {
        ogrenci: { select: { id: true, ad: true, soyad: true, telefon: true } },
      },
      orderBy: { odenmeTarihi: "desc" },
      take: limit,
    });

    return NextResponse.json(odemeler);
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// Toplu kayıt — Excel parse işlemi client tarafında yapılır, buraya düz JSON dizi gelir
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // body: { kayitlar: GunlukOdeme[] }
    const { kayitlar } = body;

    if (!Array.isArray(kayitlar) || kayitlar.length === 0) {
      return NextResponse.json({ error: "Kayıt yok" }, { status: 400 });
    }

    await prisma.gunlukOdeme.createMany({
      data: kayitlar.map((k: {
        ogrenciAd: string;
        konutNo?: string;
        tutar: number;
        tip?: string;
        odenmeTarihi: string;
        banka?: string;
        aciklama?: string;
        importDosya?: string;
      }) => ({
        ogrenciAd: k.ogrenciAd,
        konutNo: k.konutNo ?? null,
        tutar: Number(k.tutar),
        tip: k.tip ?? "Kira",
        odenmeTarihi: new Date(k.odenmeTarihi),
        banka: k.banka ?? null,
        aciklama: k.aciklama ?? null,
        importDosya: k.importDosya ?? null,
      })),
    });

    return NextResponse.json({ eklenen: kayitlar.length });
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
