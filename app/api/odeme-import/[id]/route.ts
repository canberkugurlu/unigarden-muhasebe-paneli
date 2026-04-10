import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Eşleştirme güncelle
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const odeme = await prisma.gunlukOdeme.update({ where: { id }, data: body });
  return NextResponse.json(odeme);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.gunlukOdeme.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
