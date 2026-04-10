import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rapor = await prisma.teslimRaporu.findUnique({
      where: { id },
      include: {
        konut: { select: { id: true, blok: true, daireNo: true } },
        ogrenci: { select: { id: true, ad: true, soyad: true, telefon: true } },
      },
    });
    if (!rapor) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    return NextResponse.json(rapor);
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const rapor = await prisma.teslimRaporu.update({ where: { id }, data: body });
    return NextResponse.json(rapor);
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
