"use client";

import { useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark";
const KEY = "unigarden-theme";

export function useTheme(): { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    // localStorage'den oku
    try {
      const stored = localStorage.getItem(KEY) as Theme | null;
      if (stored === "light" || stored === "dark") {
        apply(stored);
        setThemeState(stored);
      }
    } catch {}
  }, []);

  const setTheme = useCallback((t: Theme) => {
    apply(t);
    try { localStorage.setItem(KEY, t); } catch {}
    setThemeState(t);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  return { theme, toggle, setTheme };
}

function apply(t: Theme) {
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

/** İlk yüklemede localStorage'deki temayı html'e uygulamak için inline script.
 *  layout.tsx içinde `<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />` olarak eklenebilir. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${KEY}");if(t==="dark"){document.documentElement.classList.add("dark");}}catch(e){}})();`;
