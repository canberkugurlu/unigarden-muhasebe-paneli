"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function GirisPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", sifre: "" });
  const [showPass, setShowPass] = useState(false);
  const [hata, setHata] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setHata("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
    } else {
      try {
        const j = await res.json();
        setHata(j.error ?? "Giriş başarısız.");
      } catch {
        setHata("Giriş başarısız.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-bold text-xl">UG</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">UNIGARDEN</h1>
          <p className="text-gray-500 text-sm mt-1">Muhasebe Paneli</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Hesabınıza Giriş Yapın</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">E-posta Adresi</label>
              <input
                type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ornek@email.com" autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Şifre</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"} value={form.sifre}
                  onChange={e => setForm(f => ({ ...f, sifre: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••" autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {hata && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600">{hata}</div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Şifrenizi unuttuysanız yöneticinizle iletişime geçin.
        </p>
      </div>
    </div>
  );
}
