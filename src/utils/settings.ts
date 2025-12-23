/**
 * Settings persistence utility for Jeep SQLite Browser
 * Uses chrome.storage.local for persistent storage across extension contexts
 */

const STORAGE_KEY = "jeep-sqlite-browser-settings";

// Browser compatibility: use browser.storage.local for Firefox, chrome.storage.local for Chrome
const storage =
  typeof browser !== "undefined" ? browser.storage.local : chrome.storage.local;

// Supported WASM versions in order of preference (newest first)
export const SUPPORTED_WASM_VERSIONS = ["1.13.0", "1.12.0", "1.11.0"] as const;

export const WASM_SOURCE_LABELS: Record<string, string> = {
  auto: "Auto-detect (try all versions)",
  "1.13.0": "sql-wasm-1.13.0.wasm",
  "1.12.0": "sql-wasm-1.12.0.wasm",
  "1.11.0": "sql-wasm-1.11.0.wasm",
  custom: "Custom CDN URLs",
};

export interface Settings {
  darkMode: boolean;
  autoRefresh: boolean;
  wasmSource: string;
  customWasmUrl?: string;
  customScriptUrl?: string;
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
    wasmSource: "1.13.0",
  };
}

export async function loadSettings(): Promise<Settings> {
  try {
    const result = await storage.get(STORAGE_KEY);
    const stored = result[STORAGE_KEY];
    if (stored) {
      // Merge with defaults for any missing keys
      return { ...getDefaultSettings(), ...stored };
    }
  } catch (e) {
    console.log("Failed to load settings:", e);
  }
  // No saved preference - use browser theme or light mode fallback
  return getDefaultSettings();
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  try {
    const current = await loadSettings();
    const updated = { ...current, ...settings };
    await storage.set({ [STORAGE_KEY]: updated });
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
