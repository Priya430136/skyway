import React, { useEffect, useCallback } from "react";

export type ThemeMode = "light";

/**
 * Hook locking theme mode permanently to Light.
 * Removes any leftover dark class and maintains standard light color schemes.
 */
export function useTheme() {
  const applyLight = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("skyway-theme");
    } catch {
      // Ignore
    }
    const root = document.documentElement;
    root.classList.remove("dark");
    root.style.colorScheme = "light";

    try {
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement("meta");
        metaThemeColor.setAttribute("name", "theme-color");
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute("content", "#F4F7FB");
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    applyLight();
  }, [applyLight]);

  return {
    theme: "light" as const,
    resolvedTheme: "light" as const,
    isDark: false,
    setTheme: () => {},
    toggle: () => {},
  };
}

export interface ThemeToggleProps {
  variant?: "switch" | "button" | "segmented";
  className?: string;
  showLabels?: boolean;
}

/**
 * Theme toggle switch is disabled as light mode is enforced.
 */
export function ThemeToggle(_props: ThemeToggleProps) {
  return null;
}
