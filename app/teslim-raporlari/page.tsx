"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, CheckCircle, X, RefreshCw, Camera, Image as ImageIcon, Trash2 } from "lucide-react";

interface Konut { id: string; blok: string; daireNo: string; }
interface Ogrenci { id: string; ad: string; soyad: string; telefon: string; }
interface Rapor {
  id: string;
  konut: Konut;
  ogrenci: Ogrenci | null;
  tip: string;
  tarih: string;
  durumNotu: string | null;
  hasarlar: string | null;
  toplamTutar: number;
  dosyaYolu: string | null;
  onaylandi: boolean;
}

interface Hasar {
  aciklama: string;
  tutar: string;
  fotoUrl?: string;
}

interface YeniRapor {
  konutId: string;
  ogrenciId: string;
  tip: string;
  tarih: string;
  durumNotu: string;
  hasarlar: Hasar[];
  dairefotograflar: string[]; // genel daire fotoğrafları
}

// Küçük resim bileşeni
function Thumbnail({ url, onRemove }: { url: string; onRemove?: () => void }) {
  return (
    <div className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="foto" className="w-full h-full object-cover" />
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center"
        >
          <Trash2 size={14} className="text-white" />
        </button>
      )}
    </div>
  );
}

// Fotoğraf yükleme butonu
function FotoYukle({
  onUploaded,
  multiple = false,
  small = false,
}: {
  onUploaded: (urls: string[]) => void;
  multiple?: boolean;
  small?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function yukle(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setYukleniyor(true);
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await r.json();
    onUploaded(data.urls ?? []);
    setYukleniyor(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <label
      className={`flex items-center gap-1 cursor-pointer rounded-lg border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors ${
        small
          ? "px-2 py-1 text-xs text-gray-500 hover:text-blue-600"
          : "px-3 py-2 text-sm text-gray-500 hover:text-blue-600"
      }`}
    >
      <Camera size={small ? 13 : 15} />
      {yukleniyor ? "Yükleniyor…" : small ? "Foto" : "Fotoğraf Ekle"}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={yukle}
      />
    </label>
  );
}

export default function TeslimRaporlariPage() {
  const [raporlar, setRaporlar] = useState<Rapor[]>([]);
  const [konutlar, setKonutlar] = useState<Konut[]>([]);
  const [ogrenciler, setOgrenciler] = useState<Ogrenci[]>([]);
  const [tipFiltre, setTipFiltre] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<YeniRapor>({
    konutId: "",
    ogrenciId: "",
    tip: "Giris",
    tarih: new Date().toISOString().split("T")[0],
    durumNotu: "",
    hasarlar: [],
    dairefotograflar: [],
  });
  const [islemId, setIslemId] = useState<string | null>(null);
  const [fotoModal, setFotoModal] = useState<string[] | null>(null);

  const yukle = useCallback(async () => {
    const params = new URLSearchParams();
    if (tipFiltre) params.set("tip", tipFiltre);
    const r = await fetch(`/api/teslim-raporlari?${params}`);
    setRaporlar(await r.json());
  }, [tipFiltre]);

  useEffect(() => { yukle(); }, [yukle]);

  useEffect(() => {
    fetch("/api/konutlar").then((r) => r.json()).then(setKonutlar);
    fetch("/api/ogrenciler").then((r) => r.json()).then(setOgrenciler);
  }, []);

  function hasarEkle() {
    setForm((p) => ({ ...p, hasarlar: [...p.hasarlar, { aciklama: "", tutar: "", fotoUrl: undefined }] }));
  }

  function hasarGuncelle(i: number, alan: keyof Hasar, deger: string) {
    setForm((p) => {
      const hs = [...p.hasarlar];
      hs[i] = { ...hs[i], [alan]: deger };
      return { ...p, hasarlar: hs };
    });
  }

  function hasarSil(i: number) {
    setForm((p) => ({ ...p, hasarlar: p.hasarlar.filter((_, idx) => idx !== i) }));
  }

  function hasarFotoEkle(i: number, urls: string[]) {
    if (!urls[0]) return;
    setForm((p) => {
      const hs = [...p.hasarlar];
      hs[i] = { ...hs[i], fotoUrl: urls[0] };
      return { ...p, hasarlar: hs };
    });
  }

  function daireFotoEkle(urls: string[]) {
    setForm((p) => ({ ...p, dairefotograflar: [...p.dairefotograflar, ...urls] }));
  }

  function daireFotoSil(idx: number) {
    setForm((p) => ({ ...p, dairefotograflar: p.dairefotograflar.filter((_, i) => i !== idx) }));
  }

  async function kaydet() {
    const toplamTutar = form.hasarlar.reduce((s, h) => s + (parseFloat(h.tutar) || 0), 0);
    await fetch("/api/teslim-raporlari", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        konutId: form.konutId,
        ogrenciId: form.ogrenciId || null,
        tip: form.tip,
        tarih: new Date(form.tarih).toISOString(),
        durumNotu: form.durumNotu || null,
        hasarlar: JSON.stringify(form.hasarlar),
        toplamTutar,
        dosyaYolu: form.dairefotograflar && form.dairefotograflar.length > 0 ? JSON.stringify(form.dairefotograflar) : null,
      }),
    });
    setModal(false);
    setForm({ konutId: "", ogrenciId: "", tip: "Giris", tarih: new Date().toISOString().split("T")[0], durumNotu: "", hasarlar: [], dairefotograflar: [] });
    yukle();
  }

  async function onayla(id: string) {
    setIslemId(id);
    await fetch(`/api/teslim-raporlari/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onaylandi: true }),
    });
    setIslemId(null);
    yukle();
  }

  function parseJson<T>(s: string | null, fallback: T): T {
    if (!s) return fallback;
    try { return JSON.parse(s) as T; } catch { return fallback; }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={tipFiltre}
          onChange={(e) => setTipFiltre(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tüm Tipler</option>
          <option value="Giris">Giriş</option>
          <option value="Cikis">Çıkış</option>
        </select>
        <button onClick={yukle} className="text-gray-500 hover:text-gray-700 p-2">
          <RefreshCw size={16} />
        </button>
        <button
          onClick={() => setModal(true)}
          className="ml-auto flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus size={16} />
          Yeni Rapor
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Daire", "Öğrenci", "Tip", "Tarih", "Hasar Tutarı", "Fotoğraf", "Onay", "İşlem"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {raporlar.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Rapor bulunamadı.</td></tr>
            ) : (
              raporlar.map((r) => {
                const hasarlar = parseJson<Hasar[]>(r.hasarlar, []);
                const daireFraglar = parseJson<string[]>(r.dosyaYolu, []);
                const hasarFrolar = hasarlar.filter((h) => h.fotoUrl).map((h) => h.fotoUrl!);
                const tumFotolar = [...daireFraglar, ...hasarFrolar];

                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.konut.blok} {r.konut.daireNo}</td>
                    <td className="px-4 py-3">
                      {r.ogrenci ? `${r.ogrenci.ad} ${r.ogrenci.soyad}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.tip === "Giris" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                        {r.tip === "Giris" ? "Giriş" : "Çıkış"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(r.tarih).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-3 font-medium text-red-600">
                      {r.toplamTutar > 0 ? `₺${r.toplamTutar.toLocaleString("tr-TR")}` : "—"}
                      {hasarlar.length > 0 && (
                        <span className="ml-1 text-xs text-gray-400">({hasarlar.length} kalem)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {tumFotolar.length > 0 ? (
                        <button
                          onClick={() => setFotoModal(tumFotolar)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <ImageIcon size={14} />
                          {tumFotolar.length} foto
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.onaylandi ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle size={14} /> Onaylı
                        </span>
                      ) : (
                        <span className="text-yellow-600 text-xs">Bekliyor</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!r.onaylandi && (
                        <button
                          disabled={islemId === r.id}
                          onClick={() => onayla(r.id)}
                          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Onayla
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Fotoğraf galeri modal */}
      {fotoModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setFotoModal(null)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Fotoğraflar ({fotoModal.length})</h3>
              <button onClick={() => setFotoModal(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {fotoModal.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`foto-${i + 1}`}
                    className="w-full h-40 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity cursor-zoom-in"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Yeni rapor modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Yeni Teslim Raporu</h3>
              <button onClick={() => setModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              {/* Daire + Tip */}
              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
                  <select
                    value={form.tip}
                    onChange={(e) => setForm((p) => ({ ...p, tip: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="Giris">Giriş</option>
                    <option value="Cikis">Çıkış</option>
                  </select>
                </div>
              </div>

              {/* Öğrenci + Tarih */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci (opsiyonel)</label>
                  <select
                    value={form.ogrenciId}
                    onChange={(e) => setForm((p) => ({ ...p, ogrenciId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Seçin...</option>
                    {ogrenciler.map((o) => (
                      <option key={o.id} value={o.id}>{o.ad} {o.soyad}</option>
                    ))}
                  </select>
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
              </div>

              {/* Durum Notu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durum Notu</label>
                <textarea
                  value={form.durumNotu}
                  onChange={(e) => setForm((p) => ({ ...p, durumNotu: e.target.value }))}
                  rows={2}
                  placeholder="Dairenin genel durumu..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* Daire Fotoğrafları */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Camera size={15} className="text-blue-500" />
                    Daire Fotoğrafları
                  </label>
                  <FotoYukle onUploaded={daireFotoEkle} multiple />
                </div>
                {form.dairefotograflar && form.dairefotograflar.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.dairefotograflar.map((url, i) => (
                      <Thumbnail key={i} url={url} onRemove={() => daireFotoSil(i)} />
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-xs text-gray-400">
                    Daire fotoğrafı eklenmedi
                  </div>
                )}
              </div>

              {/* Hasarlar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Hasarlar</label>
                  <button
                    onClick={hasarEkle}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Plus size={13} /> Hasar Ekle
                  </button>
                </div>

                {form.hasarlar.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center text-xs text-gray-400">
                    Hasar kaydedilmedi
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.hasarlar.map((h, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
                        <div className="flex gap-2">
                          <input
                            value={h.aciklama}
                            onChange={(e) => hasarGuncelle(i, "aciklama", e.target.value)}
                            placeholder="Hasar açıklaması (örn: Kırık cam, Duvar çizigi...)"
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                          />
                          <input
                            type="number"
                            value={h.tutar}
                            onChange={(e) => hasarGuncelle(i, "tutar", e.target.value)}
                            placeholder="₺"
                            className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white"
                          />
                          <button onClick={() => hasarSil(i)} className="text-red-400 hover:text-red-600 shrink-0">
                            <X size={16} />
                          </button>
                        </div>

                        {/* Hasar fotoğrafı */}
                        <div className="flex items-center gap-2">
                          {h.fotoUrl ? (
                            <div className="flex items-center gap-2">
                              <Thumbnail
                                url={h.fotoUrl}
                                onRemove={() => hasarGuncelle(i, "fotoUrl", "")}
                              />
                              <span className="text-xs text-gray-400">Fotoğraf eklendi</span>
                            </div>
                          ) : (
                            <FotoYukle
                              small
                              onUploaded={(urls) => hasarFotoEkle(i, urls)}
                            />
                          )}
                        </div>
                      </div>
                    ))}

                    <p className="text-xs text-gray-500 text-right">
                      Toplam Hasar: ₺{form.hasarlar.reduce((s, h) => s + (parseFloat(h.tutar) || 0), 0).toLocaleString("tr-TR")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm">İptal</button>
              <button
                onClick={kaydet}
                disabled={!form.konutId}
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
