"use client";

import { useEffect, useState, useCallback } from "react";
import { Fingerprint, ShieldOff, ShieldCheck, RefreshCw, X } from "lucide-react";

interface Ogrenci { id: string; ad: string; soyad: string; telefon: string; }
interface TurnikeLog {
  id: string;
  ogrenci: Ogrenci;
  yon: string;
  zaman: string;
  kapi: string;
  engellendi: boolean;
}
interface TurnikeEngel {
  id: string;
  ogrenci: Ogrenci;
  neden: string;
  engelleyen: string;
  tarih: string;
  aktif: boolean;
}

export default function TurnikePage() {
  const [loglar, setLoglar] = useState<TurnikeLog[]>([]);
  const [engeller, setEngeller] = useState<TurnikeEngel[]>([]);
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([]);
  const [sekme, setSekme] = useState<"loglar" | "engeller">("loglar");
  const [engelModal, setEngelModal] = useState(false);
  const [engelForm, setEngelForm] = useState({ ogrenciId: "", neden: "" });
  const [islemId, setIslemId] = useState<string | null>(null);

  const yukleLoglar = useCallback(async () => {
    const r = await fetch("/api/turnike?limit=200");
    setLoglar(await r.json());
  }, []);

  const yukleEngeller = useCallback(async () => {
    const r = await fetch("/api/turnike/engel");
    setEngeller(await r.json());
  }, []);

  useEffect(() => {
    yukleLoglar();
    yukleEngeller();
    fetch("/api/ogrenciler").then((r) => r.json()).then(setOgrenciler);
  }, [yukleLoglar, yukleEngeller]);

  async function engelEkle() {
    await fetch("/api/turnike/engel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...engelForm, engelleyen: "Muhasebe" }),
    });
    setEngelModal(false);
    setEngelForm({ ogrenciId: "", neden: "" });
    yukleEngeller();
  }

  async function engelKaldir(engelId: string) {
    setIslemId(engelId);
    await fetch(`/api/turnike/engel/${engelId}`, { method: "DELETE" });
    setIslemId(null);
    yukleEngeller();
  }

  return (
    <div className="space-y-6">
      {/* Sekme başlıkları */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["loglar", "engeller"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSekme(s)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              sekme === s ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {s === "loglar" ? "Giriş/Çıkış Logları" : `Aktif Engeller (${engeller.length})`}
          </button>
        ))}
        <button
          onClick={() => { yukleLoglar(); yukleEngeller(); }}
          className="ml-2 text-gray-400 hover:text-gray-600 p-2"
        >
          <RefreshCw size={15} />
        </button>
        {sekme === "engeller" && (
          <button
            onClick={() => setEngelModal(true)}
            className="ml-2 flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700"
          >
            <ShieldOff size={15} />
            Engelle
          </button>
        )}
      </div>

      {/* Loglar */}
      {sekme === "loglar" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Öğrenci", "Yön", "Zaman", "Kapı", "Durum"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loglar.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Log bulunamadı.</td></tr>
              ) : (
                loglar.map((l) => (
                  <tr key={l.id} className={`border-b border-gray-50 hover:bg-gray-50 ${l.engellendi ? "bg-red-50" : ""}`}>
                    <td className="px-4 py-3 font-medium">{l.ogrenci.ad} {l.ogrenci.soyad}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        l.yon === "Giris" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {l.yon === "Giris" ? "Giriş" : "Çıkış"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(l.zaman).toLocaleString("tr-TR")}
                    </td>
                    <td className="px-4 py-3">{l.kapi}</td>
                    <td className="px-4 py-3">
                      {l.engellendi ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Engellendi</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Geçti</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Engeller */}
      {sekme === "engeller" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Öğrenci", "Neden", "Engelleyen", "Tarih", "İşlem"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {engeller.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400 flex items-center justify-center gap-2">
                  <ShieldCheck size={18} className="text-green-500" /> Aktif engel yok.
                </td></tr>
              ) : (
                engeller.map((e) => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 bg-red-50/30">
                    <td className="px-4 py-3 font-medium">
                      <div>{e.ogrenci.ad} {e.ogrenci.soyad}</div>
                      <div className="text-xs text-gray-400">{e.ogrenci.telefon}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{e.neden}</td>
                    <td className="px-4 py-3 text-gray-500">{e.engelleyen}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(e.tarih).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        disabled={islemId === e.id}
                        onClick={() => engelKaldir(e.id)}
                        className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <ShieldCheck size={13} />
                        Kaldır
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Engel modal */}
      {engelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                <ShieldOff size={20} /> Turnike Engeli
              </h3>
              <button onClick={() => setEngelModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci</label>
                <select
                  value={engelForm.ogrenciId}
                  onChange={(e) => setEngelForm((p) => ({ ...p, ogrenciId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Seçin...</option>
                  {ogrenciler.map((o) => (
                    <option key={o.id} value={o.id}>{o.ad} {o.soyad}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Neden</label>
                <textarea
                  value={engelForm.neden}
                  onChange={(e) => setEngelForm((p) => ({ ...p, neden: e.target.value }))}
                  rows={3}
                  placeholder="Engelleme nedeni..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEngelModal(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">İptal</button>
              <button
                onClick={engelEkle}
                disabled={!engelForm.ogrenciId || !engelForm.neden}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm hover:bg-red-700 disabled:opacity-50"
              >
                Engelle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
