import './style.css';
import { mount, tags } from '@twiqjs/twiq';
import { createControlPanel } from './components/ControlPanel';
import { createModelButton } from './components/ModelButton';
import { createModalWindow } from './components/ModalWindow';
import { createModelsManager } from './components/ModelsManager';
import type { AppStatus } from './components/StatusDisplay';
import { createStatusDisplay } from './components/StatusDisplay';
import { createTranslationInput } from './components/TranslationInput';
import { createTranslationOutput } from './components/TranslationOutput';
import { loadSettings, saveSettings } from './settings';
import { Store } from './store';
import { WllamaService } from './wllama';

const DEFAULT_MODEL_URL =
  'https://huggingface.co/LiquidAI/LFM2-350M-ENJP-MT-GGUF/resolve/main/LFM2-350M-ENJP-MT-Q8_0.gguf';

const CONTEXT_OPTIONS = [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072];
const LANGUAGES = [
  { name: 'Arabic', code: 'AR' },
  { name: 'Bengali', code: 'BN' },
  { name: 'Burmese', code: 'MY' },
  { name: 'Chinese', code: 'ZH' },
  { name: 'Czech', code: 'CS' },
  { name: 'Dutch', code: 'NL' },
  { name: 'English', code: 'EN' },
  { name: 'French', code: 'FR' },
  { name: 'German', code: 'DE' },
  { name: 'Gujarati', code: 'GU' },
  { name: 'Hebrew', code: 'HE' },
  { name: 'Hindi', code: 'HI' },
  { name: 'Indonesian', code: 'ID' },
  { name: 'Italian', code: 'IT' },
  { name: 'Japanese', code: 'JA' },
  { name: 'Kazakh', code: 'KK' },
  { name: 'Khmer', code: 'KM' },
  { name: 'Korean', code: 'KO' },
  { name: 'Malay', code: 'MS' },
  { name: 'Marathi', code: 'MR' },
  { name: 'Mongolian', code: 'MN' },
  { name: 'Persian', code: 'FA' },
  { name: 'Polish', code: 'PL' },
  { name: 'Portuguese', code: 'PT' },
  { name: 'Russian', code: 'RU' },
  { name: 'Spanish', code: 'ES' },
  { name: 'Tagalog', code: 'TL' },
  { name: 'Tamil', code: 'TA' },
  { name: 'Telugu', code: 'TE' },
  { name: 'Thai', code: 'TH' },
  { name: 'Tibetan', code: 'BO' },
  { name: 'Turkish', code: 'TR' },
  { name: 'Ukrainian', code: 'UK' },
  { name: 'Urdu', code: 'UR' },
  { name: 'Uyghur', code: 'UG' },
  { name: 'Vietnamese', code: 'VI' },
].sort((a, b) => a.name.localeCompare(b.name));

const { div, main } = tags;

const store = new Store();
const wllamaService = new WllamaService();
const settings = loadSettings();

// --- Feature: Models Management ---

const modalWindow = createModalWindow();
const modelsManager = createModelsManager({ modal: modalWindow });

// --- Components Initialization ---

const modelButton = createModelButton({
  toggleSettings: () => {
    const status = store.state.status;
    if (status === 'SETTINGS') {
      store.setStatus('READY');
    } else if (status === 'READY') {
      store.setStatus('SETTINGS');
    }
    updateState();
  },
});

const translationInput = createTranslationInput();

const translationOutput = createTranslationOutput();

// --- State Update Orchestrator ---

const updateState = () => {
  const status = store.state.status;
  const isSettingsOpen = status === 'SETTINGS';
  const isDisabled = status === 'INITIAL' || status === 'DOWNLOADING';

  // Model Button
  modelButton.setOpen(isSettingsOpen);
  modelButton.setDisabled(isDisabled);

  // Status Display
  statusDisplay.setStatus(status);
  statusDisplay.setProgress(store.state.downloadProgress);
  statusDisplay.setError(store.state.errorMessage);

  // Control Panel
  controlPanel.updateState(status);
};

// --- Callbacks for State Management ---

const handleStatusChange = (status: AppStatus) => {
  store.setStatus(status);
  updateState();
};

const handleProgress = (progress: number) => {
  store.setDownloadProgress(progress);
  updateState();
};

const handleError = (error: string | null) => {
  store.setError(error);
  updateState();
};

// --- Settings Persistence ---

const saveCurrentSettings = () => {
  // We assume components are holding the source of truth for current selections
  // but simpler to just persist what triggered this, or read from settings object if we updated it.
  // Actually, we should update the local settings object and save it.
  saveSettings({
    contextSize: settings.contextSize,
    targetLanguage: settings.targetLanguage,
  });
};

const handleLanguageChange = (lang: string) => {
  settings.targetLanguage = lang;
  saveCurrentSettings();
};

const handleContextSizeChange = (size: number) => {
  settings.contextSize = size;
  saveCurrentSettings();
};

const statusDisplay = createStatusDisplay({
  wllama: wllamaService,
  defaultModelUrl: DEFAULT_MODEL_URL,
  onStatusChange: handleStatusChange,
  onProgress: handleProgress,
  onError: handleError,
});

const controlPanel = createControlPanel({
  wllama: wllamaService,
  inputComponent: translationInput,
  outputComponent: translationOutput,
  languages: LANGUAGES,
  contextOptions: CONTEXT_OPTIONS,
  initialLanguage: settings.targetLanguage,
  initialContextSize: settings.contextSize,
  defaultModelUrl: DEFAULT_MODEL_URL,
  // Callbacks
  onStatusChange: handleStatusChange,
  onError: handleError,
  onLanguageChange: handleLanguageChange,
  onContextSizeChange: handleContextSizeChange,
  // State Getter
  getCurrentStatus: () => store.state.status,
});

// --- Main App Layout ---

const App = () => {
  return div(
    {
      class: 'flex-col height-100',
    },
    main(
      {
        id: 'app-container',
        class: 'grow flex-col gap-s height-100 p-m',
      },
      div(
        {
          class: 'flex gap-s',
        },
        div(
          {
            class: 'grow text-base p-y-s',
          },
          'POLYGLOCAL',
        ),
        modelsManager(),
        div(
          {
            id: 'model-button-root',
          },
          modelButton(),
        ),
        div(
          {
            id: 'control-panel-root',
            class: '',
          },
          controlPanel(),
        ),
      ),
      div({ id: 'status-display-root' }, statusDisplay()),
      div(
        {
          class: 'flex gap-s grow',
        },
        translationInput(),
        translationOutput(),
      ),
      modalWindow(),
    ),
  );
};

mount('app', App());

// --- Initialization ---

const init = async () => {
  const isCached = await wllamaService.isModelCached(DEFAULT_MODEL_URL);

  if (isCached) {
    store.setStatus('READY');
  } else {
    store.setStatus('INITIAL');
  }

  store.setInitialized(true);
  updateState();
};

init();
