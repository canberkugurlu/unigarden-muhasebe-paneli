import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Okundu işaretle
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // id burada MesajAlici.id
    const alici = await prisma.mesajAlici.update({
      where: { id },
      data: { okundu: true, okunmaTar: new Date() },
    });
    return NextResponse.json(alici);
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
