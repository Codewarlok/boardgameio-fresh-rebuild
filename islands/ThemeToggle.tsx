import { useEffect, useState } from "preact/hooks";

type Theme = "light" | "dark";
const STORAGE_KEY = "princesa-theme";

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      applyTheme(saved);
      return;
    }

    const prefersDark = globalThis.matchMedia?.("(prefers-color-scheme: dark)")
      .matches;
    const nextTheme: Theme = prefersDark ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  return (
    <button class="btn btn-sm btn-ghost" type="button" onClick={toggleTheme}>
      {theme === "light" ? "🌙 Oscuro" : "☀️ Claro"}
    </button>
  );
}
