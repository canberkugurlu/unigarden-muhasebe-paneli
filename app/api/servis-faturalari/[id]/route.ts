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
    const onceki = await prisma.servisFaturasi.findUnique({ where: { id } });
    const fatura = await prisma.servisFaturasi.update({ where: { id }, data: body });
    await logIslem({
      modul: "servis-faturasi", eylem: "UPDATE",
      baslik: `Servis faturası güncellendi: ${fatura.aciklama ?? ""} (₺${fatura.tutar})`,
      targetType: "ServisFaturasi", targetId: id,
      oncekiVeri: onceki, sonrakiVeri: fatura,
    });
    return NextResponse.json(fatura);
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
    const onceki = await prisma.servisFaturasi.findUnique({ where: { id } });
    await prisma.servisFaturasi.delete({ where: { id } });
    if (onceki) {
      await logIslem({
        modul: "servis-faturasi", eylem: "DELETE",
        baslik: `Servis faturası silindi: ${onceki.aciklama ?? ""} (₺${onceki.tutar})`,
        targetType: "ServisFaturasi", targetId: id,
        oncekiVeri: onceki,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
