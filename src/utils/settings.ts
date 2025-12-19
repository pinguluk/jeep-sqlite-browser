/**
 * Settings persistence utility for Jeep SQLite Browser
 */

const STORAGE_KEY = "jeep-sqlite-browser-settings";

export const WASM_SOURCE_LABELS: Record<string, string> = {
  auto: "Website's WASM (Auto-detect)",
  "1.13.0": "sql-wasm-1.13.0.wasm",
  "1.12.0": "sql-wasm-1.12.0.wasm",
  "1.11.0": "sql-wasm-1.11.0.wasm",
};

export interface Settings {
  darkMode: boolean;
  autoRefresh: boolean;
  wasmSource: string;
}

/**
 * Detect browser/OS dark mode preference
 */
function detectBrowserDarkMode(): boolean {
  try {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  } catch {
    return false; // Default to light mode if detection fails
  }
}

/**
 * Get default settings (browser preference or light mode fallback)
 */
function getDefaultSettings(): Settings {
  return {
    darkMode: detectBrowserDarkMode(),
    autoRefresh: true,
    wasmSource: "1.11.0",
  };
}

export function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults for any missing keys
      return { ...getDefaultSettings(), ...parsed };
    }
  } catch (e) {
    console.log("Failed to load settings:", e);
  }
  // No saved preference - use browser theme or light mode fallback
  return getDefaultSettings();
}

export function saveSettings(settings: Partial<Settings>): void {
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.log("Failed to save settings:", e);
  }
}

export function applyDarkMode(isDark: boolean): void {
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}
