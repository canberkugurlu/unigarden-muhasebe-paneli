"use client";

import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/": "Ana Panel",
  "/odeme-import": "Ödeme İmport",
  "/aidatlar": "Aidatlar",
  "/servis-faturalari": "Servis Faturaları",
  "/teslim-raporlari": "Teslim Raporları",
  "/turnike": "Turnike Logları",
  "/mesajlar": "Mesajlaşma",
};

export default function Header() {
  const pathname = usePathname();
  const title = titles[pathname] ?? "Muhasebe Paneli";

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
      </div>
    </header>
  );
}
