"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Wrench,
  Upload,
  AlertTriangle,
  Fingerprint,
  MessageSquare,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  bekleyenAidat: number;
  bekleyenServis: number;
  buAyOdeme: { tutar: number; adet: number };
  eslesmemisOdeme: number;
  aktifEngel: number;
  okunmamisMesaj: number;
  aylikAidat: {
    toplam: number;
    odenen: number;
    toplamAdet: number;
    odenenAdet: number;
  };
}

function StatKart({
  label,
  value,
  sub,
  icon: Icon,
  color,
  href,
  alert,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={`bg-white rounded-xl p-5 border ${
          alert ? "border-red-300 shadow-red-100" : "border-gray-200"
        } shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${alert ? "text-red-600" : "text-gray-800"}`}>
              {value}
            </p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon size={22} className="text-white" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const buAy = new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  const aidatYuzde =
    data && data.aylikAidat.toplam > 0
      ? Math.round((data.aylikAidat.odenen / data.aylikAidat.toplam) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Muhasebe Özeti</h1>
        <p className="text-sm text-gray-500 mt-1">{buAy}</p>
      </div>

      {/* Stat kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatKart
          label="Bu Ay İmport Edilen Ödemeler"
          value={data ? `₺${data.buAyOdeme.tutar.toLocaleString("tr-TR")}` : "…"}
          sub={data ? `${data.buAyOdeme.adet} işlem` : undefined}
          icon={Upload}
          color="bg-blue-500"
          href="/odeme-import"
        />
        <StatKart
          label="Eşleştirilmemiş Ödeme"
          value={data?.eslesmemisOdeme ?? "…"}
          sub="Manuel eşleme gerekiyor"
          icon={AlertTriangle}
          color="bg-orange-500"
          href="/odeme-import"
          alert={!!data && data.eslesmemisOdeme > 0}
        />
        <StatKart
          label={`Aidat Durumu — ${buAy}`}
          value={data ? `%${aidatYuzde}` : "…"}
          sub={
            data
              ? `${data.aylikAidat.odenenAdet}/${data.aylikAidat.toplamAdet} daire ödedi`
              : undefined
          }
          icon={CreditCard}
          color="bg-emerald-500"
          href="/aidatlar"
        />
        <StatKart
          label="Bekleyen Aidat"
          value={data?.bekleyenAidat ?? "…"}
          sub="Tüm zamanlar"
          icon={CreditCard}
          color="bg-yellow-500"
          href="/aidatlar"
          alert={!!data && data.bekleyenAidat > 0}
        />
        <StatKart
          label="Bekleyen Servis Faturası"
          value={data?.bekleyenServis ?? "…"}
          icon={Wrench}
          color="bg-purple-500"
          href="/servis-faturalari"
          alert={!!data && data.bekleyenServis > 0}
        />
        <StatKart
          label="Aktif Turnike Engeli"
          value={data?.aktifEngel ?? "…"}
          icon={Fingerprint}
          color="bg-red-500"
          href="/turnike"
          alert={!!data && data.aktifEngel > 0}
        />
        <StatKart
          label="Okunmamış Mesaj"
          value={data?.okunmamisMesaj ?? "…"}
          icon={MessageSquare}
          color="bg-indigo-500"
          href="/mesajlar"
          alert={!!data && data.okunmamisMesaj > 0}
        />
      </div>

      {/* Aidat ilerleme */}
      {data && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">{buAy} — Aidat Tahsilat Durumu</h3>
            <span className="text-sm text-gray-500">
              ₺{data.aylikAidat.odenen.toLocaleString("tr-TR")} /{" "}
              ₺{data.aylikAidat.toplam.toLocaleString("tr-TR")}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4">
            <div
              className="bg-emerald-500 h-4 rounded-full transition-all"
              style={{ width: `${aidatYuzde}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {data.aylikAidat.odenenAdet} daire ödedi, {data.aylikAidat.toplamAdet - data.aylikAidat.odenenAdet} daire bekliyor
          </p>
        </div>
      )}

      {/* Hızlı erişim */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/odeme-import", label: "Excel İmport", icon: Upload, color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
          { href: "/aidatlar", label: "Aidat Borçlandır", icon: CreditCard, color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
          { href: "/teslim-raporlari", label: "Teslim Raporu", icon: CheckCircle, color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
          { href: "/mesajlar", label: "Yeni Mesaj", icon: MessageSquare, color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href}>
            <div className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-transparent transition-colors ${color} cursor-pointer`}>
              <Icon size={24} />
              <span className="text-sm font-medium">{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
