import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tip = searchParams.get("tip") ?? undefined;
    const onaylandi = searchParams.get("onaylandi");

    const where: Record<string, unknown> = {};
    if (tip) where.tip = tip;
    if (onaylandi !== null && onaylandi !== "") where.onaylandi = onaylandi === "true";

    const raporlar = await prisma.teslimRaporu.findMany({
      where,
      include: {
        konut: { select: { id: true, blok: true, daireNo: true } },
        ogrenci: { select: { id: true, ad: true, soyad: true, telefon: true } },
      },
      orderBy: { tarih: "desc" },
    });

    return NextResponse.json(raporlar);
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rapor = await prisma.teslimRaporu.create({ data: body });
    return NextResponse.json(rapor);
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
