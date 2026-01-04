export interface AppSettings {
  targetLanguage: string;
  contextSize: number;
}

const STORAGE_KEY = 'polyglocal';

const DEFAULT_SETTINGS: AppSettings = {
  targetLanguage: 'Japanese',
  contextSize: 2048,
};

export const loadSettings = (): AppSettings => {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return DEFAULT_SETTINGS;
    const settings = JSON.parse(json);
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (e) {
    console.warn('Failed to load settings:', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
};
