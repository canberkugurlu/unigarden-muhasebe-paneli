"use client";

import { useEffect, useState } from "react";
import { CheckSquare, Check, XCircle, X, Clock } from "lucide-react";

interface Gorev {
  id: string; adimId: string; sira: number; durum: string;
  adim: { ad: string; aciklama?: string | null; panel: string; rol?: string | null; aksiyon: string };
  akis: {
    id: string; baslik: string; durum: string; hedefModel: string; hedefId?: string | null;
    senaryo: { ad: string };
    baslayanAd?: string | null; baslamaTar: string;
  };
}

export default function GorevlerimPage() {
  const [gorevler, setGorevler] = useState<Gorev[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secili, setSecili] = useState<Gorev | null>(null);

  const load = () => {
    setYukleniyor(true);
    fetch("/api/gorevler").then(r => r.json()).then((d: Gorev[]) => { setGorevler(Array.isArray(d) ? d : []); setYukleniyor(false); });
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <CheckSquare size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Görevlerim</h1>
          <p className="text-xs text-gray-500">Sana atanan bekleyen senaryo adımları</p>
        </div>
      </div>

      {yukleniyor ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : gorevler.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
          <CheckSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p>Bekleyen görev yok 👍</p>
        </div>
      ) : (
        <div className="space-y-3">
          {gorevler.map(g => (
            <div key={g.id} className="bg-white rounded-xl border border-blue-200 shadow-sm p-4 hover:shadow-md cursor-pointer" onClick={() => setSecili(g)}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{g.sira}</span>
                    <h3 className="font-semibold text-gray-800">{g.adim.ad}</h3>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">Aktif</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1"><strong>Akış:</strong> {g.akis.baslik}</p>
                  <p className="text-[11px] text-gray-400">Senaryo: {g.akis.senaryo.ad} · {new Date(g.akis.baslamaTar).toLocaleString("tr-TR")}</p>
                </div>
                <Clock size={16} className="text-blue-500 animate-pulse shrink-0 mt-1" />
              </div>
              {g.adim.aciklama && <p className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5 mt-2">{g.adim.aciklama}</p>}
            </div>
          ))}
        </div>
      )}

      {secili && <KararModal gorev={secili} onClose={() => setSecili(null)} onDone={() => { setSecili(null); load(); }} />}
    </div>
  );
}

function KararModal({ gorev, onClose, onDone }: { gorev: Gorev; onClose: () => void; onDone: () => void }) {
  const [notlar, setNotlar] = useState("");
  const [yapiyor, setYapiyor] = useState(false);
  const [hata, setHata] = useState("");

  const karar = async (k: "onay" | "red") => {
    setYapiyor(true); setHata("");
    const res = await fetch("/api/gorevler", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ akisId: gorev.akis.id, adimId: gorev.adimId, karar: k, notlar }),
    });
    setYapiyor(false);
    if (res.ok) onDone();
    else { const j = await res.json().catch(() => ({})); setHata(j.error ?? "Hata"); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Görevi Tamamla</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="space-y-2 mb-4">
          <p className="text-sm font-semibold text-gray-800">{gorev.adim.ad}</p>
          {gorev.adim.aciklama && <p className="text-xs text-gray-600 bg-gray-50 rounded px-3 py-2">{gorev.adim.aciklama}</p>}
          <p className="text-xs text-gray-500">Akış: <strong>{gorev.akis.baslik}</strong></p>
        </div>
        <div>
          <label className="text-xs text-gray-500">Notlar (opsiyonel)</label>
          <textarea value={notlar} onChange={e => setNotlar(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
        </div>
        {hata && <p className="text-red-600 text-xs bg-red-50 rounded px-3 py-2 mt-2">{hata}</p>}
        <div className="flex gap-2 mt-4">
          {gorev.adim.aksiyon === "red-veya-onay" && (
            <button onClick={() => karar("red")} disabled={yapiyor} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700 flex items-center justify-center gap-1.5">
              <XCircle size={14} /> Reddet
            </button>
          )}
          <button onClick={() => karar("onay")} disabled={yapiyor} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm hover:bg-emerald-700 flex items-center justify-center gap-1.5">
            <Check size={14} /> {yapiyor ? "İşleniyor..." : "Onayla / Tamamla"}
          </button>
        </div>
      </div>
    </div>
  );
}
