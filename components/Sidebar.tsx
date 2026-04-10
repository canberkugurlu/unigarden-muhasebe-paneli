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
  X,
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

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-full bg-gray-900 text-white flex flex-col">
      <div className="p-5 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-blue-400">UNIGARDEN</h1>
          <p className="text-xs text-gray-400 mt-0.5">Muhasebe Paneli</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
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
