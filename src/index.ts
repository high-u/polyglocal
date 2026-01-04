import './style.css';
import { mount, tags } from '@twiqjs/twiq';
import { ControlPanel } from './ControlPanel';
import { ModelButton } from './ModelButton';
import { StatusDisplay } from './StatusDisplay';
import { loadSettings, saveSettings } from './settings';
import { Store } from './store';
import { TranslationInput } from './TranslationInput';
import { TranslationOutput } from './TranslationOutput';
import { WllamaService } from './wllama';

const DEFAULT_MODEL_URL =
  'https://huggingface.co/tencent/HY-MT1.5-1.8B-GGUF/resolve/main/HY-MT1.5-1.8B-Q4_K_M.gguf';

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

let inputRef: HTMLTextAreaElement;
let outputRef: HTMLTextAreaElement;
let statusMessageRef: HTMLElement;
let modelUrlRef: HTMLInputElement;
let animationInterval: number | null = null;

const renderControlPanel = () =>
  mount('control-panel-root', createControlPanel());
const renderStatusDisplay = () =>
  mount('status-display-root', createStatusDisplay());
const renderModelButton = () => mount('model-button-root', createModelButton());

const updateApp = () => {
  renderControlPanel();
  renderStatusDisplay();
  renderModelButton();
};

const createModelButton = () => {
  const status = store.state.status;
  const isSettingsOpen = status === 'SETTINGS';
  const isDisabled = status === 'INITIAL' || status === 'DOWNLOADING';

  return ModelButton({
    isOpen: isSettingsOpen,
    disabled: isDisabled,
    onClick: () => {
      if (status === 'SETTINGS') {
        store.setStatus('READY');
      } else if (status === 'READY') {
        store.setStatus('SETTINGS');
      }
      updateApp();
    },
  });
};

const createControlPanel = () => {
  return ControlPanel({
    status: store.state.status,
    targetLanguage: settings.targetLanguage,
    contextSize: settings.contextSize,
    languages: LANGUAGES,
    contextOptions: CONTEXT_OPTIONS,
    onTranslate: async () => {
      const inputText = inputRef.value;
      if (inputText.trim() === '') return;

      const currentStatus = store.state.status;
      if (
        currentStatus === 'INITIAL' ||
        currentStatus === 'DOWNLOADING' ||
        currentStatus === 'TRANSLATING'
      )
        return;

      store.setStatus('TRANSLATING');
      store.setError(null);
      if (outputRef) outputRef.value = '';
      updateApp();

      saveSettings({
        contextSize: settings.contextSize,
        targetLanguage: settings.targetLanguage,
      });

      const startAnimation = (baseText: string) => {
        if (animationInterval) clearInterval(animationInterval);
        let dots = 0;
        const update = () => {
          dots = dots + 1;
          const text = baseText + '.'.repeat(dots);
          if (statusMessageRef) {
            mount(statusMessageRef, text);
          }
        };
        update();
        animationInterval = window.setInterval(update, 500);
      };

      const stopAnimation = () => {
        if (animationInterval) {
          clearInterval(animationInterval);
          animationInterval = null;
        }
      };

      try {
        startAnimation('Load');
        await wllamaService.loadModel(DEFAULT_MODEL_URL, undefined, {
          n_ctx: settings.contextSize,
        });

        startAnimation('Translate');

        const tokens = await wllamaService.tokenize(inputText);
        const requiredCount = Math.floor(tokens.length * 2.5);

        if (requiredCount > settings.contextSize) {
          store.setError(
            `Capacity exceeded (Required: ${requiredCount}). Increase context size.`,
          );
          store.setStatus('READY');
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
        stopAnimation();
        try {
          await wllamaService.unloadModel();
        } catch (e) {
          console.error('Unload failed:', e);
        }
        store.setStatus('READY');
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
  const status = store.state.status;

  let message = '';
  if (store.state.errorMessage) message = store.state.errorMessage;
  else if (status === 'TRANSLATING') message = 'Translating...';
  else if (status === 'READY') message = 'Ready';
  else message = '';

  const isModelCached = status !== 'INITIAL' && status !== 'DOWNLOADING';
  const isSettingsOpen = status === 'SETTINGS';
  const isDownloading = status === 'DOWNLOADING';

  return StatusDisplay({
    progress: store.state.downloadProgress,
    message: message,
    errorMessage: store.state.errorMessage,
    onMessageRef: (el) => {
      statusMessageRef = el;
    },
    // Model props
    isModelSettingsOpen: isSettingsOpen,
    modelUrl: modelUrlRef ? modelUrlRef.value : DEFAULT_MODEL_URL,
    isModelCached: isModelCached,
    isDownloading: isDownloading,
    onModelUrlRef: (el) => {
      modelUrlRef = el;
    },
    onDownload: async () => {
      const urlToDownload = modelUrlRef ? modelUrlRef.value : DEFAULT_MODEL_URL;

      store.setStatus('DOWNLOADING');
      store.setDownloadProgress(0);
      store.setError(null);
      updateApp();

      try {
        await wllamaService.downloadModel(urlToDownload, (p) => {
          store.setDownloadProgress(p);
          updateApp();
        });
        store.setDownloadProgress(100);
        store.setStatus('READY');
      } catch (e: unknown) {
        console.error(e);
        const message = e instanceof Error ? e.message : String(e);
        store.setError(`Download failed: ${message}`);
        store.setDownloadProgress(0);
        store.setStatus('INITIAL');
      }
      updateApp();
    },
    onDelete: async () => {
      const urlToDelete = modelUrlRef ? modelUrlRef.value : DEFAULT_MODEL_URL;

      const executeForceDelete = async (reason: string) => {
        console.warn(`Specific model delete failed. Reason: ${reason}`);
        console.warn('Executing force delete (clearAllCaches) as fallback.');
        await wllamaService.clearAllCaches();
        store.setStatus('INITIAL');
        store.setError(null);
      };

      try {
        const result = await wllamaService.deleteCache(urlToDelete);
        if (result.type === 'success') {
          store.setStatus('INITIAL');
          store.setError(null);
        } else {
          await executeForceDelete(result.type);
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        await executeForceDelete(`Exception: ${message}`);
      }
      updateApp();
    },
  });
};

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
        div(
          {
            id: 'model-button-root',
          },
          createModelButton(),
        ),
        div(
          {
            id: 'control-panel-root',
            class: '',
          },
          createControlPanel(),
        ),
      ),
      div({ id: 'status-display-root' }, createStatusDisplay()),
      div(
        {
          class: 'flex gap-s grow',
        },
        createTranslationInput(),
        createTranslationOutput(),
      ),
    ),
  );
};

mount('app', App());

const init = async () => {
  const storedCache = await wllamaService.checkCacheResult();

  if (storedCache) {
    store.setStatus('READY');
  } else {
    store.setStatus('INITIAL');
  }

  store.setInitialized(true);
  updateApp();
};

init();
