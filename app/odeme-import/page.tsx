"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Upload, RefreshCw, CheckCircle, X, AlertTriangle, Link2 } from "lucide-react";
import * as XLSX from "xlsx";

interface Ogrenci { id: string; ad: string; soyad: string; telefon: string; }
interface GunlukOdeme {
  id: string;
  ogrenciAd: string;
  konutNo: string | null;
  tutar: number;
  tip: string;
  odenmeTarihi: string;
  banka: string | null;
  aciklama: string | null;
  eslestirildi: boolean;
  importDosya: string | null;
  ogrenci: Ogrenci | null;
}

// Excel'den beklenen sütun isimleri (büyük/küçük harf ve boşluk toleranslı)
function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, "").replace(/[İıÇçŞşÜüÖöĞğ]/g, (c) =>
    ({ İ: "i", ı: "i", Ç: "c", ç: "c", Ş: "s", ş: "s", Ü: "u", ü: "u", Ö: "o", ö: "o", Ğ: "g", ğ: "g" }[c] ?? c)
  );
}

function sutunBul(row: Record<string, unknown>, ...aramaListesi: string[]): string {
  for (const arama of aramaListesi) {
    const n = normalize(arama);
    const key = Object.keys(row).find((k) => normalize(k) === n);
    if (key !== undefined && row[key] !== undefined && row[key] !== null) return String(row[key]);
  }
  return "";
}

export default function OdemeImportPage() {
  const [odemeler, setOdemeler] = useState<GunlukOdeme[]>([]);
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([]);
  const [filtre, setFiltre] = useState<"hepsi" | "eslestirilmedi">("hepsi");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [onizleme, setOnizleme] = useState<Record<string, string>[] | null>(null);
  const [dosyaAd, setDosyaAd] = useState("");
  const [eslestirModal, setEslestirModal] = useState<GunlukOdeme | null>(null);
  const [eslestirOgrenciId, setEslestirOgrenciId] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    const params = filtre === "eslestirilmedi" ? "?eslestirildi=false" : "";
    const r = await fetch(`/api/odeme-import${params}`);
    setOdemeler(await r.json());
    setYukleniyor(false);
  }, [filtre]);

  useEffect(() => { yukle(); }, [yukle]);

  useEffect(() => {
    fetch("/api/ogrenciler").then((r) => r.json()).then(setOgrenciler);
  }, []);

  function dosyaOku(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDosyaAd(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      const mapped = rows.map((row) => {
        const ad = sutunBul(row, "Ad Soyad", "AdSoyad", "ad", "isim", "müşteri", "musteri");
        const tutarStr = sutunBul(row, "Tutar", "tutar", "miktar", "amount");
        const tarihVal = sutunBul(row, "Tarih", "tarih", "date", "ödeme tarihi", "odemetarihi");
        const banka = sutunBul(row, "Banka", "banka", "bank");
        const konut = sutunBul(row, "Daire", "daire", "konut", "oda", "room");
        const aciklama = sutunBul(row, "Açıklama", "aciklama", "notlar", "note", "description");

        return {
          ogrenciAd: ad || "(İsimsiz)",
          tutar: String(tutarStr).replace(/[^0-9.,]/g, "").replace(",", "."),
          odenmeTarihi: tarihVal ? new Date(tarihVal).toISOString() : new Date().toISOString(),
          banka: banka || "",
          konutNo: konut || "",
          aciklama: aciklama || "",
          importDosya: file.name,
        };
      }).filter((r) => r.ogrenciAd !== "(İsimsiz)" || Number(r.tutar) > 0);

      setOnizleme(mapped as Record<string, string>[]);
    };
    reader.readAsArrayBuffer(file);
  }

  async function importEt() {
    if (!onizleme) return;
    const r = await fetch("/api/odeme-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kayitlar: onizleme }),
    });
    const data = await r.json();
    setOnizleme(null);
    setDosyaAd("");
    if (inputRef.current) inputRef.current.value = "";
    yukle();
    alert(`${data.eklenen} kayıt eklendi.`);
  }

  async function eslestir() {
    if (!eslestirModal || !eslestirOgrenciId) return;
    await fetch(`/api/odeme-import/${eslestirModal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ogrenciId: eslestirOgrenciId, eslestirildi: true }),
    });
    setEslestirModal(null);
    setEslestirOgrenciId("");
    yukle();
  }

  async function sil(id: string) {
    if (!confirm("Bu ödeme kaydı silinsin mi?")) return;
    await fetch(`/api/odeme-import/${id}`, { method: "DELETE" });
    yukle();
  }

  const eslesmemisAdet = odemeler.filter((o) => !o.eslestirildi).length;
  const toplamTutar = odemeler.reduce((s, o) => s + o.tutar, 0);

  return (
    <div className="space-y-6">
      {/* Üst bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {(["hepsi", "eslestirilmedi"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtre === f ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "hepsi" ? "Tümü" : (
                <span className="flex items-center gap-1.5">
                  Eşleştirilmedi
                  {eslesmemisAdet > 0 && (
                    <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 leading-5">{eslesmemisAdet}</span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
        <button onClick={yukle} className="text-gray-400 hover:text-gray-600 p-2"><RefreshCw size={15} /></button>

        {/* Excel upload */}
        <label className="ml-auto flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 cursor-pointer">
          <Upload size={15} />
          Excel Yükle
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={dosyaOku} />
        </label>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Toplam Kayıt", value: odemeler.length, color: "bg-blue-50 text-blue-700" },
          { label: "Toplam Tutar", value: `₺${toplamTutar.toLocaleString("tr-TR")}`, color: "bg-green-50 text-green-700" },
          { label: "Eşleştirilmedi", value: eslesmemisAdet, color: eslesmemisAdet > 0 ? "bg-orange-50 text-orange-700" : "bg-gray-50 text-gray-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-4 ${color}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Önizleme */}
      {onizleme && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-amber-800 flex items-center gap-2">
              <AlertTriangle size={18} />
              Önizleme — {dosyaAd} ({onizleme.length} kayıt)
            </h3>
            <button onClick={() => setOnizleme(null)} className="text-amber-500"><X size={18} /></button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-amber-700">
                  <th className="text-left py-1 pr-3">Ad Soyad</th>
                  <th className="text-left py-1 pr-3">Tutar</th>
                  <th className="text-left py-1 pr-3">Tarih</th>
                  <th className="text-left py-1">Banka</th>
                </tr>
              </thead>
              <tbody>
                {onizleme.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-amber-100">
                    <td className="py-1 pr-3">{r.ogrenciAd}</td>
                    <td className="py-1 pr-3">₺{Number(r.tutar).toLocaleString("tr-TR")}</td>
                    <td className="py-1 pr-3">{r.odenmeTarihi ? new Date(r.odenmeTarihi).toLocaleDateString("tr-TR") : "—"}</td>
                    <td className="py-1">{r.banka}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {onizleme.length > 50 && <p className="text-xs text-amber-600">…ve {onizleme.length - 50} kayıt daha</p>}
          <div className="flex gap-3">
            <button onClick={() => setOnizleme(null)} className="flex-1 border border-amber-300 rounded-lg py-2 text-sm text-amber-700">İptal</button>
            <button
              onClick={importEt}
              className="flex-1 bg-amber-600 text-white rounded-lg py-2 text-sm hover:bg-amber-700"
            >
              {onizleme.length} Kaydı İçe Aktar
            </button>
          </div>
        </div>
      )}

      {/* Tablo */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Ad Soyad", "Tutar", "Tip", "Tarih", "Banka", "Eşleşme", "İşlem"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {yukleniyor ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Yükleniyor…</td></tr>
            ) : odemeler.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Kayıt yok.</td></tr>
            ) : (
              odemeler.map((o) => (
                <tr key={o.id} className={`border-b border-gray-50 hover:bg-gray-50 ${!o.eslestirildi ? "bg-orange-50/30" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.ogrenciAd}</div>
                    {o.ogrenci && (
                      <div className="text-xs text-green-600">{o.ogrenci.ad} {o.ogrenci.soyad}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">₺{o.tutar.toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{o.tip}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(o.odenmeTarihi).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{o.banka ?? "—"}</td>
                  <td className="px-4 py-3">
                    {o.eslestirildi ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs">
                        <CheckCircle size={13} /> Eşleşti
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-orange-500 text-xs">
                        <AlertTriangle size={13} /> Bekliyor
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!o.eslestirildi && (
                        <button
                          onClick={() => { setEslestirModal(o); setEslestirOgrenciId(o.ogrenci?.id ?? ""); }}
                          className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-blue-700"
                        >
                          <Link2 size={12} /> Eşleştir
                        </button>
                      )}
                      <button
                        onClick={() => sil(o.id)}
                        className="text-gray-300 hover:text-red-500"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Eşleştir modal */}
      {eslestirModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold">Ödeme Eşleştir</h3>
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <div className="font-medium">{eslestirModal.ogrenciAd}</div>
              <div className="text-gray-500">₺{eslestirModal.tutar.toLocaleString("tr-TR")} — {new Date(eslestirModal.odenmeTarihi).toLocaleDateString("tr-TR")}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci</label>
              <select
                value={eslestirOgrenciId}
                onChange={(e) => setEslestirOgrenciId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Seçin...</option>
                {ogrenciler.map((o) => (
                  <option key={o.id} value={o.id}>{o.ad} {o.soyad} — {o.telefon}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEslestirModal(null)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">İptal</button>
              <button
                onClick={eslestir}
                disabled={!eslestirOgrenciId}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Eşleştir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
