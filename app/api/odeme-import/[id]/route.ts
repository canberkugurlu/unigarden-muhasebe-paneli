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
    const onceki = await prisma.gunlukOdeme.findUnique({ where: { id } });
    const odeme  = await prisma.gunlukOdeme.update({ where: { id }, data: body });
    await logIslem({
      modul: "odeme-import", eylem: "UPDATE",
      baslik: `Ödeme eşleştirme güncellendi: ${odeme.ogrenciAd} (₺${odeme.tutar})`,
      targetType: "GunlukOdeme", targetId: id,
      oncekiVeri: onceki, sonrakiVeri: odeme,
    });
    return NextResponse.json(odeme);
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
    const onceki = await prisma.gunlukOdeme.findUnique({ where: { id } });
    await prisma.gunlukOdeme.delete({ where: { id } });
    if (onceki) {
      await logIslem({
        modul: "odeme-import", eylem: "DELETE",
        baslik: `Ödeme silindi: ${onceki.ogrenciAd} (₺${onceki.tutar})`,
        targetType: "GunlukOdeme", targetId: id,
        oncekiVeri: onceki,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
