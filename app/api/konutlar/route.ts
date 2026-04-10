import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const konutlar = await prisma.konut.findMany({
    select: { id: true, blok: true, daireNo: true, etap: true, kiraBedeli: true, durum: true },
    orderBy: [{ blok: "asc" }, { daireNo: "asc" }],
  });
  return NextResponse.json(konutlar);
}
