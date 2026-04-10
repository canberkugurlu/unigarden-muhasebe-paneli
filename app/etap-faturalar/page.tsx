"use client";

import { useEffect, useState } from "react";
import { Zap, Droplets, Flame, Wifi, AlertTriangle, CheckCircle, Plus, ChevronDown } from "lucide-react";

const AYLAR = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const KOTA_ESIGI = 1150;

interface AktifSoz {
  id: string;
  aylikKira: number;
  kisiSayisi: number;
  ogrenci: { ad: string; soyad: string };
}
interface EtapFatura {
  id: string;
  yil: number;
  ay: number;
  elektrik: number;
  su: number;
  dogalgaz: number;
  internet: number;
  kotaEsigi: number;
  aciklama?: string;
}
interface Konut {
  id: string;
  daireNo: string;
  blok: string;
  tip: string;
  sozlesmeler: AktifSoz[];
  etapFaturalari: EtapFatura[];
}

function FaturaForm({ konut, yil, ay, mevcut, onSaved }: {
  konut: Konut;
  yil: number;
  ay: number;
  mevcut?: EtapFatura;
  onSaved: (f: EtapFatura) => void;
}) {
  const [form, setForm] = useState({
    elektrik: mevcut?.elektrik ?? 0,
    su: mevcut?.su ?? 0,
    dogalgaz: mevcut?.dogalgaz ?? 0,
    internet: mevcut?.internet ?? 0,
    aciklama: mevcut?.aciklama ?? "",
  });
  const [saving, setSaving] = useState(false);

  const toplam = form.elektrik + form.su + form.dogalgaz + form.internet;
  const kota = Math.max(0, toplam - KOTA_ESIGI);

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: k === "aciklama" ? e.target.value : Number(e.target.value) }));

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/etap-fatura", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ konutId: konut.id, yil, ay, ...form, kotaEsigi: KOTA_ESIGI }),
    });
    setSaving(false);
    if (res.ok) onSaved(await res.json());
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { key: "elektrik", label: "Elektrik", icon: Zap, color: "text-yellow-500" },
          { key: "su", label: "Su", icon: Droplets, color: "text-blue-500" },
          { key: "dogalgaz", label: "Doğalgaz", icon: Flame, color: "text-orange-500" },
          { key: "internet", label: "İnternet", icon: Wifi, color: "text-purple-500" },
        ] as const).map(({ key, label, icon: Icon, color }) => (
          <div key={key}>
            <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
              <Icon size={12} className={color} /> {label} (₺)
            </label>
            <input
              type="number" min={0} step={0.01}
              value={form[key] as number}
              onChange={f(key)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border">
        <div className="text-sm">
          <span className="text-gray-500">Toplam: </span>
          <span className="font-semibold">{toplam.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span>
          <span className="text-gray-400 text-xs ml-1">/ {KOTA_ESIGI.toLocaleString("tr-TR")} ₺ kota eşiği</span>
        </div>
        {kota > 0 ? (
          <div className="flex items-center gap-1 text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
            <AlertTriangle size={14} />
            +{kota.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺ Kota Ödemesi
          </div>
        ) : (
          <div className="flex items-center gap-1 text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            <CheckCircle size={14} />
            Kota dahilinde
          </div>
        )}
      </div>

      <div>
        <textarea
          value={form.aciklama}
          onChange={f("aciklama")}
          placeholder="Açıklama (opsiyonel)"
          rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Kaydediliyor..." : mevcut ? "Güncelle" : "Kaydet"}
      </button>
    </div>
  );
}

function KonutKart({ konut, secilenYil, secilenAy }: { konut: Konut; secilenYil: number; secilenAy: number }) {
  const [acik, setAcik] = useState(false);
  const [fatura, setFatura] = useState<EtapFatura | null>(null);
  const [yuklendi, setYuklendi] = useState(false);

  const aktifSoz = konut.sozlesmeler[0];
  const sonFatura = konut.etapFaturalari[0];

  const yukle = async () => {
    if (yuklendi) { setAcik(a => !a); return; }
    const res = await fetch(`/api/etap-fatura?konutId=${konut.id}&yil=${secilenYil}&ay=${secilenAy}`);
    const data = await res.json();
    setFatura(data[0] ?? null);
    setYuklendi(true);
    setAcik(true);
  };

  const sonToplam = sonFatura ? sonFatura.elektrik + sonFatura.su + sonFatura.dogalgaz + sonFatura.internet : null;
  const sonKota = sonToplam ? Math.max(0, sonToplam - KOTA_ESIGI) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{konut.daireNo}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{konut.tip}</span>
              {sonKota > 0 && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <AlertTriangle size={10} /> Kota Aşımı
                </span>
              )}
            </div>
            {aktifSoz ? (
              <p className="text-sm text-gray-500 mt-1">
                {aktifSoz.ogrenci.ad} {aktifSoz.ogrenci.soyad}
                <span className="ml-2 text-xs text-gray-400">{aktifSoz.kisiSayisi} kişi</span>
                <span className="ml-2 font-medium text-emerald-600">{aktifSoz.aylikKira.toLocaleString("tr-TR")} ₺ Brüt Kira</span>
              </p>
            ) : (
              <p className="text-sm text-gray-400 mt-1">Boş daire</p>
            )}
          </div>
          <div className="text-right">
            {sonFatura && (
              <p className="text-xs text-gray-400">{AYLAR[sonFatura.ay]} {sonFatura.yil}</p>
            )}
            {sonToplam !== null && (
              <p className={`text-sm font-semibold ${sonKota > 0 ? "text-red-600" : "text-gray-700"}`}>
                {sonToplam.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
              </p>
            )}
          </div>
        </div>

        <button
          onClick={yukle}
          className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700"
        >
          <Plus size={12} />
          {AYLAR[secilenAy]} {secilenYil} faturasını {fatura ? "güncelle" : "gir"}
          <ChevronDown size={12} className={`transition-transform ${acik ? "rotate-180" : ""}`} />
        </button>
      </div>

      {acik && (
        <div className="border-t border-gray-100 p-4">
          <FaturaForm
            konut={konut}
            yil={secilenYil}
            ay={secilenAy}
            mevcut={fatura ?? undefined}
            onSaved={(f) => { setFatura(f); }}
          />
        </div>
      )}
    </div>
  );
}

export default function EtapFaturalarPage() {
  const now = new Date();
  const [konutlar, setKonutlar] = useState<Konut[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secilenYil, setSecilenYil] = useState(now.getFullYear());
  const [secilenAy, setSecilenAy] = useState(now.getMonth() + 1);

  useEffect(() => {
    fetch("/api/etap-fatura")
      .then(r => r.ok ? r.json() : [])
      .then(d => { setKonutlar(Array.isArray(d) ? d : []); setYukleniyor(false); });
  }, []);

  const yillar = [now.getFullYear(), now.getFullYear() - 1];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">1. Etap Faturalar</h1>
          <p className="text-sm text-gray-500 mt-1">Brüt kira içindeki {KOTA_ESIGI.toLocaleString("tr-TR")} ₺ kota eşiğini aşan fatura takibi</p>
        </div>
        <div className="flex gap-2">
          <select value={secilenAy} onChange={e => setSecilenAy(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
            {AYLAR.slice(1).map((a, i) => <option key={i + 1} value={i + 1}>{a}</option>)}
          </select>
          <select value={secilenYil} onChange={e => setSecilenYil(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
            {yillar.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {yukleniyor ? (
        <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
      ) : konutlar.length === 0 ? (
        <div className="text-center py-12 text-gray-400">1. Etap daire bulunamadı</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {konutlar.map(k => (
            <KonutKart key={k.id} konut={k} secilenYil={secilenYil} secilenAy={secilenAy} />
          ))}
        </div>
      )}
    </div>
  );
}
