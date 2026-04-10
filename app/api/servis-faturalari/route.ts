import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const durum = searchParams.get("durum") ?? undefined;
  const kategori = searchParams.get("kategori") ?? undefined;

  const where: Record<string, unknown> = {};
  if (durum) where.durum = durum;
  if (kategori) where.kategori = kategori;

  const faturalar = await prisma.servisFaturasi.findMany({
    where,
    include: {
      konut: { select: { id: true, blok: true, daireNo: true } },
      bakimTalebi: { select: { id: true, baslik: true } },
    },
    orderBy: { tarih: "desc" },
  });

  return NextResponse.json(faturalar);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const fatura = await prisma.servisFaturasi.create({ data: body });
  return NextResponse.json(fatura);
}
