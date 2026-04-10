"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  Wrench,
  ClipboardList,
  Fingerprint,
  MessageSquare,
  Upload,
} from "lucide-react";

const menuItems = [
  { href: "/", label: "Ana Panel", icon: LayoutDashboard },
  { href: "/odeme-import", label: "Ödeme İmport", icon: Upload },
  { href: "/aidatlar", label: "Aidatlar", icon: CreditCard },
  { href: "/servis-faturalari", label: "Servis Faturaları", icon: Wrench },
  { href: "/teslim-raporlari", label: "Teslim Raporları", icon: ClipboardList },
  { href: "/turnike", label: "Turnike Logları", icon: Fingerprint },
  { href: "/mesajlar", label: "Mesajlaşma", icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-blue-400">UNIGARDEN</h1>
        <p className="text-xs text-gray-400 mt-1">Muhasebe Paneli</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
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
