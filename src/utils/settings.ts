/**
 * Settings persistence utility for Jeep SQLite Browser
 */

const STORAGE_KEY = 'jeep-sqlite-browser-settings';

export interface Settings {
    darkMode: boolean;
    autoRefresh: boolean;
}

const defaultSettings: Settings = {
    darkMode: true,
    autoRefresh: false,
};

export function loadSettings(): Settings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return { ...defaultSettings, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.log('Failed to load settings:', e);
    }
    return { ...defaultSettings };
}

export function saveSettings(settings: Partial<Settings>): void {
    try {
        const current = loadSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.log('Failed to save settings:', e);
    }
}

export function applyDarkMode(isDark: boolean): void {
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}
