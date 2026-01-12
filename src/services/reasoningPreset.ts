export type ReasoningPreset = {
  id: string;
  name: string;
  model: string;
  contextLength: number;
  prompt: string;
  config?: string;
};

const STORAGE_KEY = 'polyglocal-reasoning-presets';

const getPresets = (): ReasoningPreset[] => {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json) as ReasoningPreset[];
  } catch (e) {
    console.warn('Failed to parse reasoning presets:', e);
    return [];
  }
};

const save = (list: ReasoningPreset[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

const addPreset = (preset: Omit<ReasoningPreset, 'id'>): void => {
  const list = getPresets();
  const newPreset: ReasoningPreset = {
    ...preset,
    id: crypto.randomUUID(),
  };
  const newList = [...list, newPreset];
  save(newList);
};

const deletePreset = (id: string): void => {
  const list = getPresets();
  const newList = list.filter((p) => p.id !== id);
  save(newList);
};

const updatePreset = (preset: ReasoningPreset): void => {
  const list = getPresets();
  const index = list.findIndex((p) => p.id === preset.id);
  if (index !== -1) {
    list[index] = preset;
    save(list);
  }
};

const getPresetById = (id: string): ReasoningPreset | undefined => {
  const list = getPresets();
  return list.find((p) => p.id === id);
};

export { getPresets, addPreset, deletePreset, updatePreset, getPresetById };
