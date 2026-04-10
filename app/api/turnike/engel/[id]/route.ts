import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Engeli kaldır (aktif = false)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const engel = await prisma.turnikeEngel.update({
      where: { id },
      data: { aktif: false },
    });
    return NextResponse.json(engel);
  } catch (e) {
    console.error('[API Error]', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
