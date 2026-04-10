import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const yil = parseInt(searchParams.get("yil") ?? String(new Date().getFullYear()));
  const ay = searchParams.get("ay") ? parseInt(searchParams.get("ay")!) : undefined;
  const durum = searchParams.get("durum") ?? undefined;

  const where: Record<string, unknown> = { yil };
  if (ay) where.ay = ay;
  if (durum) where.durum = durum;

  const aidatlar = await prisma.aidat.findMany({
    where,
    include: { konut: { select: { id: true, blok: true, daireNo: true, etap: true } } },
    orderBy: [{ ay: "asc" }, { konut: { daireNo: "asc" } }],
  });

  return NextResponse.json(aidatlar);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Toplu oluşturma: { yil, ay, tutarSabit? } — tüm konutlara borçlandırma
  if (body.topluBorclandir) {
    const { yil, ay, tutarSabit } = body;
    const konutlar = await prisma.konut.findMany({ select: { id: true, kiraBedeli: true } });

    const mevcutlar = await prisma.aidat.findMany({
      where: { yil, ay },
      select: { konutId: true },
    });
    const mevcutSet = new Set(mevcutlar.map((m) => m.konutId));

    const yeniAidatlar = konutlar
      .filter((k) => !mevcutSet.has(k.id))
      .map((k) => ({
        konutId: k.id,
        yil,
        ay,
        tutar: tutarSabit ?? k.kiraBedeli * 0.1, // %10 aidat varsayılanı
        durum: "Bekliyor",
      }));

    await prisma.aidat.createMany({ data: yeniAidatlar });
    return NextResponse.json({ olusturulan: yeniAidatlar.length });
  }

  // Tekil oluşturma
  const aidat = await prisma.aidat.create({ data: body });
  return NextResponse.json(aidat);
}
