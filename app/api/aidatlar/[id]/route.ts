import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logIslem } from "@/lib/log";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const onceki = await prisma.aidat.findUnique({ where: { id } });
    const aidat  = await prisma.aidat.update({ where: { id }, data: body });
    await logIslem({
      modul: "aidat", eylem: "UPDATE",
      baslik: `Aidat güncellendi: ${aidat.yil}/${aidat.ay} (₺${aidat.tutar})`,
      targetType: "Aidat", targetId: id,
      oncekiVeri: onceki, sonrakiVeri: aidat,
    });
    return NextResponse.json(aidat);
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const onceki = await prisma.aidat.findUnique({ where: { id } });
    await prisma.aidat.delete({ where: { id } });
    if (onceki) {
      await logIslem({
        modul: "aidat", eylem: "DELETE",
        baslik: `Aidat silindi: ${onceki.yil}/${onceki.ay} (₺${onceki.tutar})`,
        targetType: "Aidat", targetId: id,
        oncekiVeri: onceki,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
