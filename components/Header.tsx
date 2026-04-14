"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/odeme-import": "Ödeme İmport",
  "/aidatlar": "Aidatlar",
  "/servis-faturalari": "Servis Faturaları",
  "/teslim-raporlari": "Teslim Raporları",
  "/turnike": "Turnike Logları",
  "/mesajlar": "Mesajlaşma",
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const title = titles[pathname] ?? "Muhasebe Paneli";

  const cikisYap = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/giris");
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString("tr-TR", { dateStyle: "long" })}
        </span>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          Muhasebe
        </div>
        <button
          onClick={cikisYap}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
          title="Çıkış Yap"
        >
          <LogOut size={14} />
          Çıkış
        </button>
      </div>
    </header>
  );
}
