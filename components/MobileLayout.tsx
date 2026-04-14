"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, CreditCard, Wrench, ClipboardList, Fingerprint,
  MessageSquare, Upload, Zap, LogOut, Menu, X, ArrowLeft,
} from "lucide-react";

// ── Tüm menü ──
const ALL_ITEMS = [
  { href: "/",                  label: "Ana Panel",          icon: LayoutDashboard, color: "bg-blue-500",   textColor: "text-blue-600"   },
  { href: "/odeme-import",      label: "Ödeme İmport",       icon: Upload,          color: "bg-green-500",  textColor: "text-green-600"  },
  { href: "/aidatlar",          label: "Aidatlar",           icon: CreditCard,      color: "bg-purple-500", textColor: "text-purple-600" },
  { href: "/etap-faturalar",    label: "1. Etap Faturaları", icon: Zap,             color: "bg-yellow-500", textColor: "text-yellow-600" },
  { href: "/servis-faturalari", label: "Servis Faturaları",  icon: Wrench,          color: "bg-orange-500", textColor: "text-orange-600" },
  { href: "/teslim-raporlari",  label: "Teslim Raporları",   icon: ClipboardList,   color: "bg-cyan-500",   textColor: "text-cyan-600"   },
  { href: "/turnike",           label: "Turnike Logları",    icon: Fingerprint,     color: "bg-red-500",    textColor: "text-red-600"    },
  { href: "/mesajlar",          label: "Mesajlaşma",         icon: MessageSquare,   color: "bg-amber-500",  textColor: "text-amber-600"  },
];

// ── Alt navigasyon (4 ana) ──
const BOTTOM_ITEMS = [
  ALL_ITEMS[0], // Ana Panel
  ALL_ITEMS[1], // Ödeme İmport
  ALL_ITEMS[2], // Aidatlar
  ALL_ITEMS[3], // 1. Etap Faturaları
];

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAcik, setMenuAcik] = useState(false);

  const aktifItem = ALL_ITEMS.find(i => i.href === pathname);
  const baslik = aktifItem?.label ?? "Muhasebe";
  const isRoot = pathname === "/";

  const cikisYap = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/giris");
  };

  return (
    <div className="md:hidden flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* ── Top App Bar ── */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 pt-[env(safe-area-inset-top)] shrink-0 shadow-md">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3 min-w-0">
            {!isRoot ? (
              <button onClick={() => router.back()} className="p-1 -ml-1 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors">
                <ArrowLeft size={22} />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <span className="text-sm font-bold">UG</span>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-semibold text-base truncate">{baslik}</h1>
              {isRoot && <p className="text-[11px] text-blue-100 -mt-0.5">Muhasebe Paneli</p>}
            </div>
          </div>
          <button onClick={cikisYap} className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors" title="Çıkış">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto overscroll-contain bg-gray-50 pb-24">
        <div className="p-4">{children}</div>
      </main>

      {/* ── Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-16">
          {BOTTOM_ITEMS.map(({ href, label, icon: Icon, textColor }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${active ? textColor + " font-semibold" : "text-gray-500"}`}>
                <span className={`transition-transform ${active ? "scale-110" : ""}`}>
                  <Icon size={20} />
                </span>
                <span className="leading-tight text-center px-1 truncate max-w-full">{label}</span>
              </Link>
            );
          })}
          {/* Daha Fazla (menü aç) */}
          <button onClick={() => setMenuAcik(true)}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${menuAcik ? "text-blue-600 font-semibold" : "text-gray-500"}`}>
            <Menu size={20} />
            <span className="leading-tight">Daha Fazla</span>
          </button>
        </div>
      </nav>

      {/* ── Bottom Sheet Menu (Daha Fazla) ── */}
      {menuAcik && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setMenuAcik(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div onClick={(e) => e.stopPropagation()}
               className="relative bg-white rounded-t-3xl shadow-2xl pb-[env(safe-area-inset-bottom)] animate-slide-up">
            <div className="flex items-center justify-between px-5 pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
              <h3 className="font-semibold text-gray-800 text-sm mt-3">Tüm Menü</h3>
              <button onClick={() => setMenuAcik(false)} className="p-1.5 rounded-full hover:bg-gray-100 -mr-1">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 p-4 pt-2">
              {ALL_ITEMS.map(({ href, label, icon: Icon, color }) => {
                const active = pathname === href;
                return (
                  <Link key={href} href={href} onClick={() => setMenuAcik(false)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors ${active ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                    <span className={`w-11 h-11 rounded-2xl ${color} flex items-center justify-center text-white shadow-sm`}>
                      <Icon size={20} />
                    </span>
                    <span className="text-[11px] text-gray-700 text-center leading-tight line-clamp-2">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 220ms ease-out; }
      `}</style>
    </div>
  );
}
