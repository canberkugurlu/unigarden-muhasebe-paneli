import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ogrenciId = searchParams.get("ogrenciId") ?? undefined;
    const yon = searchParams.get("yon") ?? undefined;
    const limit = parseInt(searchParams.get("limit") ?? "100");

    const where: Record<string, unknown> = {};
    if (ogrenciId) where.ogrenciId = ogrenciId;
    if (yon) where.yon = yon;

    const loglar = await prisma.turnikeLog.findMany({
      where,
      include: {
        ogrenci: { select: { id: true, ad: true, soyad: true, telefon: true } },
      },
      orderBy: { zaman: "desc" },
      take: limit,
    });

    return NextResponse.json(loglar);
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
