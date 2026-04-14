"use client";

import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileLayout from "./MobileLayout";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Desktop (≥ md) */}
      <div className="hidden md:flex h-screen overflow-hidden bg-gray-50">
        <div className="w-64 shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="shrink-0">
            <Header />
          </div>
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>

      {/* Mobile (< md) */}
      <MobileLayout>{children}</MobileLayout>
    </>
  );
}
