import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const ogrenciler = await prisma.ogrenci.findMany({
      select: { id: true, ad: true, soyad: true, telefon: true },
      orderBy: [{ ad: "asc" }, { soyad: "asc" }],
    });
    return NextResponse.json(ogrenciler);
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
