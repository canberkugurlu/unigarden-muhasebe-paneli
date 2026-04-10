import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tüm aktif engelleri listele
export async function GET() {
  const engeller = await prisma.turnikeEngel.findMany({
    where: { aktif: true },
    include: {
      ogrenci: { select: { id: true, ad: true, soyad: true, telefon: true } },
    },
    orderBy: { tarih: "desc" },
  });
  return NextResponse.json(engeller);
}

// Yeni engel ekle
export async function POST(req: NextRequest) {
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
}
