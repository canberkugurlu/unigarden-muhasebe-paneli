"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Wrench,
  ClipboardList,
  Fingerprint,
  MessageSquare,
  Upload,
  Zap,
  X,
} from "lucide-react";

const menuItems = [
  { href: "/",                  label: "Ana Panel",         icon: LayoutDashboard, color: "bg-blue-500/20 text-blue-400" },
  { href: "/odeme-import",      label: "Ödeme İmport",      icon: Upload,          color: "bg-green-500/20 text-green-400" },
  { href: "/aidatlar",          label: "Aidatlar",          icon: CreditCard,      color: "bg-purple-500/20 text-purple-400" },
  { href: "/etap-faturalar",    label: "1. Etap Faturaları", icon: Zap,            color: "bg-yellow-500/20 text-yellow-400" },
  { href: "/servis-faturalari", label: "Servis Faturaları", icon: Wrench,          color: "bg-orange-500/20 text-orange-400" },
  { href: "/teslim-raporlari",  label: "Teslim Raporları",  icon: ClipboardList,   color: "bg-cyan-500/20 text-cyan-400" },
  { href: "/turnike",           label: "Turnike Logları",   icon: Fingerprint,     color: "bg-red-500/20 text-red-400" },
  { href: "/mesajlar",          label: "Mesajlaşma",        icon: MessageSquare,   color: "bg-yellow-500/20 text-yellow-400" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-full bg-gray-900 text-white flex flex-col">
      <div className="p-5 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-blue-400">UNIGARDEN</h1>
          <p className="text-xs text-gray-400 mt-0.5">Muhasebe Paneli</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map(({ href, label, icon: Icon, color }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span className={`p-1.5 rounded-md shrink-0 ${active ? "bg-white/20 text-white" : color}`}>
                <Icon size={15} />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
        v1.0.0 &copy; {new Date().getFullYear()} Unigarden
      </div>
    </aside>
  );
}
