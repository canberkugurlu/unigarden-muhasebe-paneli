import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import LayoutShell from "@/components/LayoutShell";
import { headers } from "next/headers";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Unigarden - Muhasebe Paneli",
  description: "Muhasebe ve finansal işlemler yönetim sistemi",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isGiris = pathname === "/giris";

  if (isGiris) {
    return (
      <html lang="tr" className={geist.variable}>
        <body className="antialiased">{children}</body>
      </html>
    );
  }

  return (
    <html lang="tr" className={geist.variable}>
      <body className="antialiased">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
