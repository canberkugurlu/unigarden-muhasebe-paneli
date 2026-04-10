"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Send, X, RefreshCw, Mail, MailOpen } from "lucide-react";

interface Mesaj {
  id: string;
  mesaj: {
    id: string;
    gonderen: string;
    gonderenTip: string;
    konu: string;
    icerik: string;
    olusturmaTar: string;
  };
  okundu: boolean;
  okunmaTar: string | null;
}

interface GidenMesaj {
  id: string;
  konu: string;
  icerik: string;
  olusturmaTar: string;
  alicilar: { id: string; alici: string; okundu: boolean }[];
}

const ROLLER = ["Güvenlik", "Teknik", "Yönetim"];

export default function MesajlarPage() {
  const [sekme, setSekme] = useState<"gelen" | "giden">("gelen");
  const [gelenler, setGelenler] = useState<Mesaj[]>([]);
  const [gidenler, setGidenler] = useState<GidenMesaj[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ konu: "", icerik: "", alicilar: [] as string[] });
  const [seciliMesaj, setSeciliMesaj] = useState<Mesaj | null>(null);

  const yukle = useCallback(async () => {
    const [g, gi] = await Promise.all([
      fetch("/api/mesajlar?tip=gelen").then((r) => r.json()),
      fetch("/api/mesajlar?tip=giden").then((r) => r.json()),
    ]);
    setGelenler(g);
    setGidenler(gi);
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  function aliciToggle(rol: string) {
    setForm((p) => ({
      ...p,
      alicilar: p.alicilar.includes(rol)
        ? p.alicilar.filter((a) => a !== rol)
        : [...p.alicilar, rol],
    }));
  }

  async function gonder() {
    await fetch("/api/mesajlar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setModal(false);
    setForm({ konu: "", icerik: "", alicilar: [] });
    yukle();
  }

  async function okunduIsaretle(aliciId: string) {
    await fetch(`/api/mesajlar/${aliciId}`, { method: "PATCH" });
    yukle();
  }

  const okunmamisAdet = gelenler.filter((m) => !m.okundu).length;

  return (
    <div className="space-y-6">
      {/* Üst bar */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {(["gelen", "giden"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSekme(s)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                sekme === s ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s === "gelen" ? (
                <span className="flex items-center gap-1.5">
                  Gelen Kutusu
                  {okunmamisAdet > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                      {okunmamisAdet}
                    </span>
                  )}
                </span>
              ) : "Gönderilen"}
            </button>
          ))}
        </div>
        <button onClick={yukle} className="text-gray-400 hover:text-gray-600 p-2">
          <RefreshCw size={15} />
        </button>
        <button
          onClick={() => setModal(true)}
          className="ml-auto flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          <Send size={15} />
          Yeni Mesaj
        </button>
      </div>

      {/* Gelen */}
      {sekme === "gelen" && (
        <div className="space-y-2">
          {gelenler.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Gelen kutusu boş.</div>
          ) : (
            gelenler.map((m) => (
              <div
                key={m.id}
                className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-shadow ${
                  m.okundu ? "border-gray-200" : "border-blue-300 shadow-sm"
                }`}
                onClick={() => {
                  setSeciliMesaj(m);
                  if (!m.okundu) okunduIsaretle(m.id);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {m.okundu ? (
                      <MailOpen size={18} className="text-gray-400" />
                    ) : (
                      <Mail size={18} className="text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-medium ${m.okundu ? "text-gray-700" : "text-gray-900"}`}>
                        {m.mesaj.gonderen}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(m.mesaj.olusturmaTar).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                    <div className={`text-sm ${m.okundu ? "text-gray-600" : "font-semibold text-gray-800"}`}>
                      {m.mesaj.konu}
                    </div>
                    <div className="text-xs text-gray-400 truncate mt-0.5">{m.mesaj.icerik}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Giden */}
      {sekme === "giden" && (
        <div className="space-y-2">
          {gidenler.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Henüz gönderilmiş mesaj yok.</div>
          ) : (
            gidenler.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{m.konu}</div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">{m.icerik}</div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(m.olusturmaTar).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.alicilar.map((a) => (
                    <span
                      key={a.id}
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        a.okundu ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {a.alici} {a.okundu ? "✓" : ""}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Mesaj detay drawer */}
      {seciliMesaj && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">{seciliMesaj.mesaj.konu}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {seciliMesaj.mesaj.gonderen} • {new Date(seciliMesaj.mesaj.olusturmaTar).toLocaleString("tr-TR")}
                </p>
              </div>
              <button onClick={() => setSeciliMesaj(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
              {seciliMesaj.mesaj.icerik}
            </div>
            <button
              onClick={() => setSeciliMesaj(null)}
              className="w-full border border-gray-300 rounded-lg py-2 text-sm"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Yeni mesaj modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare size={20} /> Yeni Mesaj
              </h3>
              <button onClick={() => setModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alıcılar</label>
                <div className="flex flex-wrap gap-2">
                  {ROLLER.map((r) => (
                    <button
                      key={r}
                      onClick={() => aliciToggle(r)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        form.alicilar.includes(r)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 text-gray-600 hover:border-blue-400"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konu</label>
                <input
                  value={form.konu}
                  onChange={(e) => setForm((p) => ({ ...p, konu: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Mesaj konusu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj</label>
                <textarea
                  value={form.icerik}
                  onChange={(e) => setForm((p) => ({ ...p, icerik: e.target.value }))}
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Mesajınızı yazın..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModal(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">İptal</button>
              <button
                onClick={gonder}
                disabled={!form.konu || !form.icerik || form.alicilar.length === 0}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={15} /> Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
