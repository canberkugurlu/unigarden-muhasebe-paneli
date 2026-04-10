"use client";

import { useEffect, useState, useCallback } from "react";
import { CreditCard, Plus, CheckCircle, Clock, AlertTriangle, RefreshCw } from "lucide-react";

interface Konut {
  id: string;
  blok: string;
  daireNo: string;
  etap: number;
}

interface Aidat {
  id: string;
  konutId: string;
  konut: Konut;
  yil: number;
  ay: number;
  tutar: number;
  durum: string;
  odemeTarihi: string | null;
  aciklama: string | null;
}

const AYLAR = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const durumRenk: Record<string, string> = {
  Bekliyor: "bg-yellow-100 text-yellow-800",
  Odendi: "bg-green-100 text-green-800",
  Gecikti: "bg-red-100 text-red-800",
};

export default function AidatlarPage() {
  const simdi = new Date();
  const [yil, setYil] = useState(simdi.getFullYear());
  const [ay, setAy] = useState(simdi.getMonth() + 1);
  const [aidatlar, setAidatlar] = useState<Aidat[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [borcModal, setBorcModal] = useState(false);
  const [tutarSabit, setTutarSabit] = useState("");
  const [islemId, setIslemId] = useState<string | null>(null);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    const r = await fetch(`/api/aidatlar?yil=${yil}&ay=${ay}`);
    if (!r.ok) return;
    const data = await r.json();
    setAidatlar(data);
    setYukleniyor(false);
  }, [yil, ay]);

  useEffect(() => { yukle(); }, [yukle]);

  async function topluBorclandir() {
    const r = await fetch("/api/aidatlar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topluBorclandir: true,
        yil,
        ay,
        tutarSabit: tutarSabit ? parseFloat(tutarSabit) : undefined,
      }),
    });
    if (!r.ok) return;
    const data = await r.json();
    setBorcModal(false);
    setTutarSabit("");
    yukle();
    alert(`${data.olusturulan} daire için aidat borçlandırıldı.`);
  }

  async function durumGuncelle(id: string, durum: string) {
    setIslemId(id);
    await fetch(`/api/aidatlar/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        durum,
        odemeTarihi: durum === "Odendi" ? new Date().toISOString() : null,
      }),
    });
    setIslemId(null);
    yukle();
  }

  const toplamTutar = aidatlar.reduce((s, a) => s + a.tutar, 0);
  const odenentTutar = aidatlar.filter((a) => a.durum === "Odendi").reduce((s, a) => s + a.tutar, 0);
  const bekleyenAdet = aidatlar.filter((a) => a.durum !== "Odendi").length;

  return (
    <div className="space-y-6">
      {/* Başlık + filtreler */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <select
            value={ay}
            onChange={(e) => setAy(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {AYLAR.slice(1).map((label, i) => (
              <option key={i + 1} value={i + 1}>{label}</option>
            ))}
          </select>
          <select
            value={yil}
            onChange={(e) => setYil(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setBorcModal(true)}
          className="ml-auto flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus size={16} />
          Toplu Borçlandır
        </button>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Toplam Aidat", value: `₺${toplamTutar.toLocaleString("tr-TR")}`, color: "bg-blue-50 text-blue-700", icon: CreditCard },
          { label: "Tahsil Edilen", value: `₺${odenentTutar.toLocaleString("tr-TR")}`, color: "bg-green-50 text-green-700", icon: CheckCircle },
          { label: "Bekleyen Daire", value: bekleyenAdet, color: "bg-yellow-50 text-yellow-700", icon: Clock },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={`flex items-center gap-4 rounded-xl p-4 ${color}`}>
            <Icon size={24} />
            <div>
              <p className="text-xs font-medium opacity-70">{label}</p>
              <p className="text-xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">
            {AYLAR[ay]} {yil} — Aidat Listesi
          </h3>
          <button onClick={yukle} className="text-gray-400 hover:text-gray-600">
            <RefreshCw size={16} />
          </button>
        </div>

        {yukleniyor ? (
          <div className="p-8 text-center text-gray-400 text-sm">Yükleniyor…</div>
        ) : aidatlar.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Bu ay için aidat kaydı yok.{" "}
            <button onClick={() => setBorcModal(true)} className="text-blue-600 underline">
              Toplu borçlandır
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Blok", "Daire No", "Tutar", "Durum", "Ödeme Tarihi", "İşlem"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aidatlar.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{a.konut.blok}</td>
                  <td className="px-4 py-3">{a.konut.daireNo}</td>
                  <td className="px-4 py-3">₺{a.tutar.toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${durumRenk[a.durum] ?? "bg-gray-100 text-gray-700"}`}>
                      {a.durum}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {a.odemeTarihi
                      ? new Date(a.odemeTarihi).toLocaleDateString("tr-TR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {a.durum !== "Odendi" ? (
                      <button
                        disabled={islemId === a.id}
                        onClick={() => durumGuncelle(a.id, "Odendi")}
                        className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle size={13} />
                        Ödendi
                      </button>
                    ) : (
                      <button
                        disabled={islemId === a.id}
                        onClick={() => durumGuncelle(a.id, "Bekliyor")}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 px-2 py-1"
                      >
                        <AlertTriangle size={13} />
                        Geri Al
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Toplu borçlandır modal */}
      {borcModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {AYLAR[ay]} {yil} — Toplu Aidat Borçlandır
            </h3>
            <p className="text-sm text-gray-500">
              Tüm konutlara bu ay için aidat borçlandırılacak. Tutar boş bırakılırsa her konutun kira bedelinin %10&apos;u alınır.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sabit Tutar (opsiyonel)
              </label>
              <input
                type="number"
                value={tutarSabit}
                onChange={(e) => setTutarSabit(e.target.value)}
                placeholder="Örn: 500"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setBorcModal(false); setTutarSabit(""); }}
                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm"
              >
                İptal
              </button>
              <button
                onClick={topluBorclandir}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700"
              >
                Borçlandır
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
