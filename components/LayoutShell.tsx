"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // Ekran büyüyünce drawer'ı kapat
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Overlay (mobil) */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 md:relative md:translate-x-0 md:flex
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}>
        <Sidebar onClose={() => setOpen(false)} />
      </div>

      {/* İçerik */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobil üst bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-gray-800 text-sm">UNIGARDEN Muhasebe</span>
        </div>

        {/* Desktop header */}
        <div className="hidden md:block">
          <Header />
        </div>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
