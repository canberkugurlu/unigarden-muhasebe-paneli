import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BEN = "Muhasebe";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tip = searchParams.get("tip") ?? "gelen"; // "gelen" | "giden"

    if (tip === "gelen") {
      const mesajlar = await prisma.mesajAlici.findMany({
        where: { alici: BEN },
        include: {
          mesaj: true,
        },
        orderBy: { mesaj: { olusturmaTar: "desc" } },
      });
      return NextResponse.json(mesajlar);
    }

    // Giden
    const mesajlar = await prisma.mesaj.findMany({
      where: { gonderen: BEN },
      include: { alicilar: true },
      orderBy: { olusturmaTar: "desc" },
    });
    return NextResponse.json(mesajlar);
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // body: { konu, icerik, alicilar: string[] }
    const mesaj = await prisma.mesaj.create({
      data: {
        gonderen: BEN,
        gonderenTip: BEN,
        konu: body.konu,
        icerik: body.icerik,
        alicilar: {
          create: body.alicilar.map((a: string) => ({
            alici: a,
            aliciTip: a,
          })),
        },
      },
      include: { alicilar: true },
    });
    return NextResponse.json(mesaj);
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
