"use client";

import { useEffect, useState, useMemo } from "react";
import { History, RotateCcw, Eye, X, Search, Filter, AlertTriangle, Check } from "lucide-react";

interface IslemLog {
  id: string;
  panel: string; modul: string; eylem: string;
  baslik: string; detay?: string | null;
  targetType?: string | null; targetId?: string | null;
  oncekiVeri?: string | null; sonrakiVeri?: string | null;
  geriAlindi: boolean; geriAlinmaTar?: string | null;
  geriAlanAd?: string | null;
  kullaniciAd?: string | null; kullaniciTip?: string | null;
  olusturmaTar: string;
}

const EYLEM_RENK: Record<string, string> = {
  CREATE:       "bg-green-100 text-green-700",
  UPDATE:       "bg-blue-100 text-blue-700",
  DELETE:       "bg-red-100 text-red-700",
  BULK_IMPORT:  "bg-purple-100 text-purple-700",
  BULK_DELETE:  "bg-pink-100 text-pink-700",
};
const EYLEM_LABEL: Record<string, string> = {
  CREATE: "Eklendi", UPDATE: "Güncellendi", DELETE: "Silindi",
  BULK_IMPORT: "Toplu İçe Aktarım", BULK_DELETE: "Toplu Silme",
};

export default function IslemlerPage() {
  const [loglar, setLoglar] = useState<IslemLog[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [arama, setArama] = useState("");
  const [modulFiltre, setModulFiltre] = useState("");
  const [eylemFiltre, setEylemFiltre] = useState("");
  const [sadeceGeriAlinabilir, setSadeceGeriAlinabilir] = useState(false);
  const [secili, setSecili]   = useState<IslemLog | null>(null);
  const [onayId, setOnayId]   = useState<string | null>(null);
  const [yapiyor, setYapiyor] = useState(false);

  const load = () => {
    setYukleniyor(true);
    fetch("/api/islemler").then(r => r.ok ? r.json() : []).then((d: IslemLog[]) => {
      setLoglar(Array.isArray(d) ? d : []);
      setYukleniyor(false);
    });
  };
  useEffect(() => { load(); }, []);

  const moduller = useMemo(() => [...new Set(loglar.map(l => l.modul))].sort(), [loglar]);
  const eylemler = useMemo(() => [...new Set(loglar.map(l => l.eylem))].sort(), [loglar]);

  const filtreli = useMemo(() => loglar.filter(l => {
    if (modulFiltre && l.modul !== modulFiltre) return false;
    if (eylemFiltre && l.eylem !== eylemFiltre) return false;
    if (sadeceGeriAlinabilir && l.geriAlindi) return false;
    if (arama) {
      const q = arama.toLowerCase();
      if (![l.baslik, l.detay, l.kullaniciAd, l.targetId].some(s => (s ?? "").toLowerCase().includes(q))) return false;
    }
    return true;
  }), [loglar, modulFiltre, eylemFiltre, sadeceGeriAlinabilir, arama]);

  const geriAl = async (id: string) => {
    setYapiyor(true);
    const res = await fetch(`/api/islemler/${id}/geri-al`, { method: "POST" });
    setYapiyor(false);
    if (res.ok) { setOnayId(null); setSecili(null); load(); }
    else { const j = await res.json().catch(() => ({})); alert(j.error ?? "Geri alma başarısız"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <History size={20} className="text-slate-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Geçmiş İşlemler</h1>
          <p className="text-xs text-gray-500">Muhasebe panelinin yaptığı tüm işlemler — incele, geri al</p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex items-center gap-2 flex-wrap bg-white rounded-xl border border-gray-100 p-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={arama} onChange={e => setArama(e.target.value)} placeholder="Başlık, detay, kullanıcı..."
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm" />
        </div>
        <select value={modulFiltre} onChange={e => setModulFiltre(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Tüm Modüller</option>
          {moduller.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={eylemFiltre} onChange={e => setEylemFiltre(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Tüm Eylemler</option>
          {eylemler.map(e => <option key={e} value={e}>{EYLEM_LABEL[e] ?? e}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-gray-600">
          <input type="checkbox" checked={sadeceGeriAlinabilir} onChange={e => setSadeceGeriAlinabilir(e.target.checked)} />
          Sadece geri alınabilirler
        </label>
      </div>

      <p className="text-xs text-gray-500"><Filter size={11} className="inline mr-1" />{filtreli.length} / {loglar.length} kayıt</p>

      {yukleniyor ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtreli.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
          <History size={40} className="mx-auto mb-3 opacity-30" />
          <p>Kayıt yok</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2.5 text-left">Tarih</th>
                <th className="px-4 py-2.5 text-left">Modül</th>
                <th className="px-4 py-2.5 text-left">Eylem</th>
                <th className="px-4 py-2.5 text-left">Açıklama</th>
                <th className="px-4 py-2.5 text-left">Kullanıcı</th>
                <th className="px-4 py-2.5 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtreli.map(l => (
                <tr key={l.id} className={`hover:bg-gray-50 ${l.geriAlindi ? "opacity-60" : ""}`}>
                  <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(l.olusturmaTar).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">{l.modul}</td>
                  <td className="px-4 py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${EYLEM_RENK[l.eylem] ?? "bg-gray-100 text-gray-700"}`}>
                      {EYLEM_LABEL[l.eylem] ?? l.eylem}
                    </span>
                    {l.geriAlindi && <span className="ml-1 text-[10px] text-gray-500">↺ Geri alındı</span>}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800">{l.baslik}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{l.kullaniciAd ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSecili(l)} title="Detay" className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600">
                        <Eye size={14} />
                      </button>
                      {!l.geriAlindi && (
                        <button onClick={() => setOnayId(l.id)} title="Geri Al" className="p-1.5 rounded hover:bg-orange-50 text-gray-400 hover:text-orange-600">
                          <RotateCcw size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detay modal */}
      {secili && <DetayModal log={secili} onClose={() => setSecili(null)} onGeriAl={(id) => { setSecili(null); setOnayId(id); }} />}

      {/* Geri-al onay */}
      {onayId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Geri Al?</h3>
                <p className="text-xs text-gray-500">Bu işlem geri alınacak. Emin misiniz?</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 bg-orange-50 rounded-lg px-3 py-2 mb-4">
              {loglar.find(l => l.id === onayId)?.baslik}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setOnayId(null)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">İptal</button>
              <button onClick={() => geriAl(onayId)} disabled={yapiyor} className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm hover:bg-orange-700 disabled:opacity-60">
                {yapiyor ? "İşleniyor..." : "Geri Al"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetayModal({ log, onClose, onGeriAl }: { log: IslemLog; onClose: () => void; onGeriAl: (id: string) => void }) {
  const onceki:  unknown = log.oncekiVeri  ? safeJSON(log.oncekiVeri)  : null;
  const sonraki: unknown = log.sonrakiVeri ? safeJSON(log.sonrakiVeri) : null;
  const hasOnceki  = onceki  != null;
  const hasSonraki = sonraki != null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-5 w-full max-w-2xl shadow-xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-800">{log.baslik}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{log.modul} · {log.eylem} · {new Date(log.olusturmaTar).toLocaleString("tr-TR")}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        {log.detay && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-3">{log.detay}</p>}
        <dl className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="bg-gray-50 px-3 py-2 rounded-lg"><dt className="text-gray-400">Kullanıcı</dt><dd className="font-medium text-gray-700">{log.kullaniciAd ?? "—"} {log.kullaniciTip && `(${log.kullaniciTip})`}</dd></div>
          <div className="bg-gray-50 px-3 py-2 rounded-lg"><dt className="text-gray-400">Hedef</dt><dd className="font-mono text-[10px] text-gray-600 truncate">{log.targetType} · {log.targetId ?? "—"}</dd></div>
        </dl>
        {log.geriAlindi && (
          <div className="text-xs bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
            <Check size={13} className="text-emerald-600" />
            Bu işlem {log.geriAlinmaTar && new Date(log.geriAlinmaTar).toLocaleString("tr-TR")} tarihinde {log.geriAlanAd ?? "—"} tarafından geri alındı.
          </div>
        )}
        {hasOnceki && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Önceki Veri</p>
            <pre className="bg-red-50 text-red-900 text-[10px] p-3 rounded-lg overflow-x-auto max-h-48">{JSON.stringify(onceki, null, 2)}</pre>
          </div>
        )}
        {hasSonraki && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Sonraki Veri</p>
            <pre className="bg-green-50 text-green-900 text-[10px] p-3 rounded-lg overflow-x-auto max-h-48">{JSON.stringify(sonraki, null, 2)}</pre>
          </div>
        )}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Kapat</button>
          {!log.geriAlindi && (
            <button onClick={() => onGeriAl(log.id)} className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm hover:bg-orange-700 flex items-center justify-center gap-2">
              <RotateCcw size={14} /> Geri Al
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function safeJSON(s: string): unknown { try { return JSON.parse(s); } catch { return s; } }
