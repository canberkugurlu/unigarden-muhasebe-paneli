import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tüm aktif engelleri listele
export async function GET() {
  try {
    const engeller = await prisma.turnikeEngel.findMany({
      where: { aktif: true },
      include: {
        ogrenci: { select: { id: true, ad: true, soyad: true, telefon: true } },
      },
      orderBy: { tarih: "desc" },
    });
    return NextResponse.json(engeller);
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

// Yeni engel ekle
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // upsert: öğrencinin zaten engeli varsa güncelle
    const engel = await prisma.turnikeEngel.upsert({
      where: { ogrenciId: body.ogrenciId },
      update: { neden: body.neden, engelleyen: body.engelleyen, aktif: true, tarih: new Date() },
      create: {
        ogrenciId: body.ogrenciId,
        neden: body.neden,
        engelleyen: body.engelleyen ?? "Muhasebe",
      },
    });
    return NextResponse.json(engel);
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
