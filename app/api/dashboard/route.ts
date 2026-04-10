import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
  const bugun = new Date();
  const yil = bugun.getFullYear();
  const ay = bugun.getMonth() + 1;

  const [
    bekleyenAidat,
    bekleyenServis,
    buAyOdeme,
    eslesmemisOdeme,
    aktifEngel,
    okunmamisMesaj,
  ] = await Promise.all([
    prisma.aidat.count({ where: { durum: { in: ["Bekliyor", "Gecikti"] } } }),
    prisma.servisFaturasi.count({ where: { durum: "Bekliyor" } }),
    prisma.gunlukOdeme.aggregate({
      where: {
        odenmeTarihi: {
          gte: new Date(yil, ay - 1, 1),
          lt: new Date(yil, ay, 1),
        },
      },
      _sum: { tutar: true },
      _count: true,
    }),
    prisma.gunlukOdeme.count({ where: { eslestirildi: false } }),
    prisma.turnikeEngel.count({ where: { aktif: true } }),
    prisma.mesajAlici.count({ where: { alici: "Muhasebe", okundu: false } }),
  ]);

  const aylikAidat = await prisma.aidat.aggregate({
    where: { yil, ay },
    _sum: { tutar: true },
    _count: true,
  });

  const aylikAidatOdenen = await prisma.aidat.aggregate({
    where: { yil, ay, durum: "Odendi" },
    _sum: { tutar: true },
    _count: true,
  });

  return NextResponse.json({
    bekleyenAidat,
    bekleyenServis,
    buAyOdeme: {
      tutar: buAyOdeme._sum.tutar ?? 0,
      adet: buAyOdeme._count,
    },
    eslesmemisOdeme,
    aktifEngel,
    okunmamisMesaj,
    aylikAidat: {
      toplam: aylikAidat._sum.tutar ?? 0,
      odenen: aylikAidatOdenen._sum.tutar ?? 0,
      toplamAdet: aylikAidat._count,
      odenenAdet: aylikAidatOdenen._count,
    },
  });
  } catch (e) {
    console.error("[dashboard]", e);
    return NextResponse.json({ error: "DB bağlantı hatası" }, { status: 500 });
  }
}
