"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      title={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-300 transition-colors ${className}`}
      aria-label="Tema değiştir"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
