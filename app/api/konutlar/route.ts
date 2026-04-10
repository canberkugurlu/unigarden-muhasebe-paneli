import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const konutlar = await prisma.konut.findMany({
      select: { id: true, blok: true, daireNo: true, etap: true, kiraBedeli: true, durum: true },
      orderBy: [{ blok: "asc" }, { daireNo: "asc" }],
    });
    return NextResponse.json(konutlar);
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
