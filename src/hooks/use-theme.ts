import { useEffect, useState } from "react";

const KEY = "agri.theme";
export type Theme = "dark" | "light";

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.dataset.theme = theme;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");
  useEffect(() => {
    try {
      const v = (localStorage.getItem(KEY) as Theme | null) ?? "dark";
      setThemeState(v);
      apply(v);
    } catch {}
  }, []);
  const setTheme = (v: Theme) => {
    setThemeState(v);
    apply(v);
    try {
      localStorage.setItem(KEY, v);
    } catch {}
  };
  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");
  return { theme, setTheme, toggle };
}
