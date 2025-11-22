import { useState, useEffect } from "react";

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check system preference on mount
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDarkMode(mediaQuery.matches);

    // Optional: Listen for changes
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    const defaultColor = isDarkMode ? "#111827" : "#f9fafb";
    document.body.style.backgroundColor = defaultColor;
    root.style.backgroundColor = defaultColor;

  }, [isDarkMode]);

  return { isDarkMode, toggleDarkMode };
}
