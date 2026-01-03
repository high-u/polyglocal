import './style.css';
import { mount, tags } from '@twiqjs/twiq';
import { ControlPanel } from './ControlPanel';
import { StatusDisplay } from './StatusDisplay';
import { loadSettings, saveSettings } from './settings';
import { Store } from './store';
import { TranslationInput } from './TranslationInput';
import { TranslationOutput } from './TranslationOutput';
import { WllamaService } from './wllama';

const MODEL_URL =
  'https://huggingface.co/tencent/HY-MT1.5-1.8B-GGUF/resolve/main/HY-MT1.5-1.8B-Q4_K_M.gguf';

const CONTEXT_OPTIONS = [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072];
const LANGUAGES = [
  'Arabic',
  'Bengali',
  'Burmese',
  'Chinese',
  'Czech',
  'Dutch',
  'English',
  'French',
  'German',
  'Gujarati',
  'Hebrew',
  'Hindi',
  'Indonesian',
  'Italian',
  'Japanese',
  'Kazakh',
  'Khmer',
  'Korean',
  'Malay',
  'Marathi',
  'Mongolian',
  'Persian',
  'Polish',
  'Portuguese',
  'Russian',
  'Spanish',
  'Tagalog',
  'Tamil',
  'Telugu',
  'Thai',
  'Tibetan',
  'Turkish',
  'Ukrainian',
  'Urdu',
  'Uyghur',
  'Vietnamese',
].sort();

const { div } = tags;

const store = new Store();
const wllamaService = new WllamaService();
const settings = loadSettings();

let inputRef: HTMLTextAreaElement;
let outputRef: HTMLTextAreaElement;

const renderControlPanel = () =>
  mount('control-panel-root', createControlPanel());
const renderStatusDisplay = () =>
  mount('status-display-root', createStatusDisplay());

const updateApp = () => {
  renderControlPanel();
  renderStatusDisplay();
};

const createControlPanel = () => {
  return ControlPanel({
    isModelCached: store.state.isModelCached,
    isModelLoaded: store.state.isModelLoaded,
    isTranslating: store.state.isTranslating,
    targetLanguage: settings.targetLanguage,
    contextSize: settings.contextSize,

    // Data props
    languages: LANGUAGES,
    contextOptions: CONTEXT_OPTIONS,
    modelOptions: [
      { label: 'Tencent/HY-MT1.5-1.8B', value: 'Tencent/HY-MT1.5-1.8B' },
    ],
    currentModel: 'Tencent/HY-MT1.5-1.8B',

    onDownload: async () => {
      store.setDownloadProgress(0);
      store.setError(null);
      updateApp();
      try {
        await wllamaService.downloadModel(MODEL_URL, (p) => {
          store.setDownloadProgress(p);
          updateApp();
        });
        store.setModelCached(true);
        store.setDownloadProgress(100);
      } catch (e: unknown) {
        console.error(e);
        const message = e instanceof Error ? e.message : String(e);
        store.setError(`Download failed: ${message}`);
        store.setDownloadProgress(0);
      }
      updateApp();
    },

    onDelete: async () => {
      try {
        const result = await wllamaService.deleteCache(MODEL_URL);
        if (result.type === 'success') {
          store.setModelCached(false);
          store.setModelLoaded(false);
          store.setError(null);
        } else if (result.type === 'not_found') {
          store.setError(
            'Target file not found, but system record exists. Files may remain or be corrupted.',
          );
        } else {
          store.setError('Delete cache failed. An unexpected error occurred.');
        }
      } catch (e: unknown) {
        console.error(e);
        const message = e instanceof Error ? e.message : String(e);
        store.setError(`Delete cache failed: ${message}`);
      }
      updateApp();
    },

    onLoad: async () => {
      store.setError(null); // Clear previous errors
      updateApp();
      try {
        await wllamaService.loadModel(MODEL_URL, undefined, {
          n_ctx: settings.contextSize,
        });
        store.setModelLoaded(true);
      } catch (e: unknown) {
        console.error(e);
        const message = e instanceof Error ? e.message : String(e);
        store.setError(`Load failed: ${message}`);
      }
      updateApp();
    },

    onUnload: async () => {
      try {
        await wllamaService.unloadModel();
        store.setModelLoaded(false);
        store.setError(null);
      } catch (e: unknown) {
        console.error(e);
        const message = e instanceof Error ? e.message : String(e);
        store.setError(`Unload failed: ${message}`);
      }
      updateApp();
    },

    onAutoLoadChange: (checked: boolean) => {
      settings.autoLoad = checked;
      saveSettings(settings); // Saving all settings
      updateApp();
    },

    isAutoLoadChecked: settings.autoLoad,

    onTranslate: async () => {
      const inputText = inputRef.value;
      if (inputText.trim() === '') return;

      store.setTranslating(true);
      if (outputRef) outputRef.value = '';
      updateApp();

      // Save settings
      saveSettings({
        contextSize: settings.contextSize,
        targetLanguage: settings.targetLanguage,
        autoLoad: settings.autoLoad,
      });

      try {
        const selectedCtx = settings.contextSize;
        const currentLoadedCtx = wllamaService.getCurrentContextSize();

        if (currentLoadedCtx !== selectedCtx) {
          await wllamaService.reloadModel(MODEL_URL, selectedCtx);
        }

        const tokens = await wllamaService.tokenize(inputText);
        const requiredCount = Math.floor(tokens.length * 2.5);

        if (requiredCount > selectedCtx) {
          store.setError(
            `Capacity exceeded (Required: ${requiredCount}). Select larger context & reload.`,
          );
          store.setTranslating(false);
          updateApp();
          return;
        }

        await wllamaService.translate(
          inputText,
          settings.targetLanguage,
          (currentText) => {
            if (outputRef) outputRef.value = currentText;
          },
        );
      } catch (e: unknown) {
        console.error(e);
        const message = e instanceof Error ? e.message : String(e);
        store.setError(`Error: ${message}`);
      } finally {
        store.setTranslating(false);
        updateApp();
      }
    },

    onLanguageChange: (val: string) => {
      settings.targetLanguage = val;
      updateApp();
    },

    onContextChange: (val: number) => {
      settings.contextSize = val;
      updateApp();
    },
  });
};

const createTranslationInput = () => {
  return TranslationInput({
    value: '',
    onRef: (el) => {
      inputRef = el;
    },
  });
};

const createTranslationOutput = () => {
  return TranslationOutput({
    value: '',
    onRef: (el) => {
      outputRef = el;
    },
  });
};

const createStatusDisplay = () => {
  let message = '';
  // Check if error message is about delete failure to show force delete button
  const errorMsg = store.state.errorMessage;
  const isDeleteError =
    errorMsg?.includes('Delete cache failed') ||
    errorMsg?.includes('Target file not found');

  const onForceDelete = isDeleteError
    ? async () => {
        await wllamaService.clearAllCaches();
        store.setError(null);
        store.setModelCached(false);
        store.setModelLoaded(false);
        updateApp();
      }
    : undefined;

  if (store.state.errorMessage) message = store.state.errorMessage;
  else if (store.state.isTranslating) message = 'Translating...';
  else if (store.state.isModelLoaded) message = 'Model Loaded. Ready.';
  else if (store.state.isModelCached) message = 'Model Cached. Ready to Load.';
  else message = 'Please download model.';

  return StatusDisplay({
    progress: store.state.downloadProgress,
    message: message,
    onForceDelete: onForceDelete,
  });
};

const App = () => {
  return div(
    { id: 'app-container' },
    div({ id: 'control-panel-root' }, createControlPanel()),
    div({ id: 'status-display-root' }, createStatusDisplay()),
    div(
      { class: 'row' },
      div({ class: 'col' }, createTranslationInput()),
      div({ class: 'col' }, createTranslationOutput()),
    ),
  );
};

mount('app', App());

const init = async () => {
  const storedCache = await wllamaService.checkCacheResult();
  store.setModelCached(storedCache);

  // Auto-load logic
  if (storedCache && settings.autoLoad) {
    try {
      await wllamaService.loadModel(MODEL_URL, undefined, {
        n_ctx: settings.contextSize,
      });
      store.setModelLoaded(true);
    } catch (e) {
      console.warn('Auto-load failed:', e);
      store.setError('Auto-load failed. Please try loading manually.');
    }
  }

  updateApp();
};

init();
