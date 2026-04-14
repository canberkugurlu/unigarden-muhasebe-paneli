import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const modul   = searchParams.get("modul") ?? undefined;
  const eylem   = searchParams.get("eylem") ?? undefined;
  const fromStr = searchParams.get("from");
  const toStr   = searchParams.get("to");
  const q       = searchParams.get("q")?.trim();
  const take    = Math.min(parseInt(searchParams.get("take") ?? "200", 10) || 200, 1000);

  const where: Record<string, unknown> = { panel: "muhasebe" };
  if (modul) where.modul = modul;
  if (eylem) where.eylem = eylem;
  if (fromStr || toStr) {
    where.olusturmaTar = {
      ...(fromStr ? { gte: new Date(fromStr) } : {}),
      ...(toStr   ? { lte: new Date(toStr) }   : {}),
    };
  }
  if (q) {
    where.OR = [
      { baslik: { contains: q } },
      { detay:  { contains: q } },
      { targetId: { contains: q } },
    ];
  }

  const loglar = await prisma.islemLog.findMany({
    where, orderBy: { olusturmaTar: "desc" }, take,
  });
  return NextResponse.json(loglar);
}
