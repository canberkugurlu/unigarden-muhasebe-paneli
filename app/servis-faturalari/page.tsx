"use client";

import { useEffect, useState, useCallback } from "react";
import { Wrench, Plus, CheckCircle, RefreshCw, X } from "lucide-react";

interface Konut { id: string; blok: string; daireNo: string; }
interface BakimTalebi { id: string; baslik: string; }
interface Fatura {
  id: string;
  konutId: string;
  konut: Konut;
  bakimTalebi: BakimTalebi | null;
  baslik: string;
  tutar: number;
  kategori: string;
  tarih: string;
  durum: string;
  odemeTarihi: string | null;
  aciklama: string | null;
}

const KATEGORILER = ["Teknik", "Temizlik", "Güvenlik", "Diğer"];
const durumRenk: Record<string, string> = {
  Bekliyor: "bg-yellow-100 text-yellow-800",
  Odendi: "bg-green-100 text-green-800",
};

interface YeniFatura {
  konutId: string;
  baslik: string;
  tutar: string;
  kategori: string;
  tarih: string;
  aciklama: string;
}

export default function ServisFaturalariPage() {
  const [faturalar, setFaturalar] = useState<Fatura[]>([]);
  const [konutlar, setKonutlar] = useState<Konut[]>([]);
  const [durumFiltre, setDurumFiltre] = useState("");
  const [kategoriFiltre, setKategoriFiltre] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<YeniFatura>({
    konutId: "",
    baslik: "",
    tutar: "",
    kategori: "Teknik",
    tarih: new Date().toISOString().split("T")[0],
    aciklama: "",
  });
  const [islemId, setIslemId] = useState<string | null>(null);

  const yukle = useCallback(async () => {
    const params = new URLSearchParams();
    if (durumFiltre) params.set("durum", durumFiltre);
    if (kategoriFiltre) params.set("kategori", kategoriFiltre);
    const r = await fetch(`/api/servis-faturalari?${params}`);
    setFaturalar(r.ok ? await r.json() : null);
  }, [durumFiltre, kategoriFiltre]);

  useEffect(() => { yukle(); }, [yukle]);

  useEffect(() => {
    fetch("/api/konutlar").then((r) => r.ok ? r.json() : null).then(setKonutlar);
  }, []);

  async function kaydet() {
    await fetch("/api/servis-faturalari", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tutar: parseFloat(form.tutar),
        tarih: new Date(form.tarih).toISOString(),
      }),
    });
    setModal(false);
    setForm({ konutId: "", baslik: "", tutar: "", kategori: "Teknik", tarih: new Date().toISOString().split("T")[0], aciklama: "" });
    yukle();
  }

  async function odendiIsaretle(id: string) {
    setIslemId(id);
    await fetch(`/api/servis-faturalari/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durum: "Odendi", odemeTarihi: new Date().toISOString() }),
    });
    setIslemId(null);
    yukle();
  }

  const toplamTutar = faturalar.reduce((s, f) => s + f.tutar, 0);
  const bekleyenTutar = faturalar.filter((f) => f.durum === "Bekliyor").reduce((s, f) => s + f.tutar, 0);

  return (
    <div className="space-y-6">
      {/* Üst bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={durumFiltre}
          onChange={(e) => setDurumFiltre(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tüm Durumlar</option>
          <option value="Bekliyor">Bekliyor</option>
          <option value="Odendi">Ödendi</option>
        </select>
        <select
          value={kategoriFiltre}
          onChange={(e) => setKategoriFiltre(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tüm Kategoriler</option>
          {KATEGORILER.map((k) => <option key={k}>{k}</option>)}
        </select>
        <button onClick={yukle} className="text-gray-500 hover:text-gray-700 p-2">
          <RefreshCw size={16} />
        </button>
        <button
          onClick={() => setModal(true)}
          className="ml-auto flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus size={16} />
          Yeni Fatura
        </button>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-50 text-purple-700 rounded-xl p-4 flex items-center gap-4">
          <Wrench size={22} />
          <div>
            <p className="text-xs font-medium opacity-70">Toplam Tutar</p>
            <p className="text-xl font-bold">₺{toplamTutar.toLocaleString("tr-TR")}</p>
          </div>
        </div>
        <div className="bg-yellow-50 text-yellow-700 rounded-xl p-4 flex items-center gap-4">
          <Wrench size={22} />
          <div>
            <p className="text-xs font-medium opacity-70">Bekleyen Tutar</p>
            <p className="text-xl font-bold">₺{bekleyenTutar.toLocaleString("tr-TR")}</p>
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Daire", "Başlık", "Kategori", "Tutar", "Tarih", "Durum", "İşlem"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {faturalar.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Fatura bulunamadı.</td></tr>
            ) : (
              faturalar.map((f) => (
                <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{f.konut.blok} {f.konut.daireNo}</td>
                  <td className="px-4 py-3">
                    <div>{f.baslik}</div>
                    {f.bakimTalebi && (
                      <div className="text-xs text-gray-400">{f.bakimTalebi.baslik}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{f.kategori}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">₺{f.tutar.toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(f.tarih).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${durumRenk[f.durum] ?? "bg-gray-100 text-gray-700"}`}>
                      {f.durum}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {f.durum === "Bekliyor" && (
                      <button
                        disabled={islemId === f.id}
                        onClick={() => odendiIsaretle(f.id)}
                        className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle size={13} />
                        Ödendi
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Yeni fatura modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Yeni Servis Faturası</h3>
              <button onClick={() => setModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daire</label>
                <select
                  value={form.konutId}
                  onChange={(e) => setForm((p) => ({ ...p, konutId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Seçin...</option>
                  {konutlar.map((k) => (
                    <option key={k.id} value={k.id}>{k.blok} {k.daireNo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                <input
                  value={form.baslik}
                  onChange={(e) => setForm((p) => ({ ...p, baslik: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Örn: Kombi Bakımı"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺)</label>
                  <input
                    type="number"
                    value={form.tutar}
                    onChange={(e) => setForm((p) => ({ ...p, tutar: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={form.kategori}
                    onChange={(e) => setForm((p) => ({ ...p, kategori: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {KATEGORILER.map((k) => <option key={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                <input
                  type="date"
                  value={form.tarih}
                  onChange={(e) => setForm((p) => ({ ...p, tarih: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={form.aciklama}
                  onChange={(e) => setForm((p) => ({ ...p, aciklama: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">İptal</button>
              <button
                onClick={kaydet}
                disabled={!form.konutId || !form.baslik || !form.tutar}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
