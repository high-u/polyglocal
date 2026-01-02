import './style.css';
import { mount, tags } from '@twiqjs/twiq';
import { ContextSelector } from './ContextSelector';
import { LanguageSelector } from './LanguageSelector';
import { ModelControls } from './ModelControls';
import { loadSettings, saveSettings } from './settings';
import { Store } from './store';
import { TranslateButton } from './TranslateButton';
import { TranslationInput } from './TranslationInput';
import { TranslationOutput } from './TranslationOutput';
import { WllamaService } from './wllama';

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
];
LANGUAGES.sort();

const { div } = tags;

const store = new Store();
const wllamaService = new WllamaService();
const settings = loadSettings();

let inputRef: HTMLTextAreaElement;
let outputRef: HTMLTextAreaElement;
let languageRef: HTMLSelectElement;
let contextRef: HTMLSelectElement;
let statusRef: HTMLDivElement;

const renderModelControls = () =>
  mount('model-controls-wrapper', createModelControls());
const renderTranslateButton = () =>
  mount('translate-button-wrapper', createTranslateButton());

const createModelControls = () => {
  return ModelControls({
    downloadProgress: store.state.downloadProgress,
    isModelCached: store.state.isModelCached,
    onDownload: async () => {
      store.setDownloadProgress(0);
      store.setError(null);
      renderModelControls();

      try {
        await wllamaService.downloadModel((p) => {
          store.setDownloadProgress(p);
          renderModelControls();
        });
        store.setModelCached(true);
        store.setDownloadProgress(100);
      } catch (e: unknown) {
        console.error(e);
        const message = e instanceof Error ? e.message : String(e);
        store.setError(`Download failed: ${message}`);
        store.setDownloadProgress(0);
      }
      renderModelControls();
      renderTranslateButton();
    },
    onDeleteCache: async () => {
      try {
        await wllamaService.deleteCache();
        store.setModelCached(false);
        store.setModelLoaded(false);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        store.setError(`Delete cache failed: ${message}`);
      }
      renderModelControls();
      renderTranslateButton();
    },
  });
};

const createLanguageSelector = () => {
  return LanguageSelector({
    options: LANGUAGES.sort(),
    value: settings.targetLanguage,
    onRef: (el) => {
      languageRef = el;
    },
  });
};

const createContextSelector = () => {
  return ContextSelector({
    options: CONTEXT_OPTIONS,
    value: settings.contextSize,
    onRef: (el) => {
      contextRef = el;
    },
  });
};

const StatusDisplay = () => {
  const el = tags.div({});
  statusRef = el as HTMLDivElement;
  return el;
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

const updateStatus = (message: string) => {
  if (statusRef) statusRef.innerText = message;
};

const createTranslateButton = () => {
  return TranslateButton({
    isTranslating: store.state.isTranslating,
    isModelLoaded: store.state.isModelLoaded,
    isModelCached: store.state.isModelCached,
    downloadProgress: store.state.downloadProgress,
    onTranslate: async () => {
      const inputText = inputRef.value;
      if (inputText.trim() === '') return;

      store.setTranslating(true);
      updateStatus('');
      renderTranslateButton();
      outputRef.value = '';

      // Save settings on translate
      const currentContextSize = parseInt(contextRef.value, 10);
      const currentTargetLang = languageRef.value;
      saveSettings({
        contextSize: currentContextSize,
        targetLanguage: currentTargetLang,
      });

      try {
        const selectedCtx = currentContextSize;
        const currentLoadedCtx = wllamaService.getCurrentContextSize();

        if (!store.state.isModelLoaded || currentLoadedCtx !== selectedCtx) {
          updateStatus('Loading...');
          if (store.state.isModelLoaded) {
            await wllamaService.reloadModel(selectedCtx);
          } else {
            await wllamaService.loadModel(undefined, { n_ctx: selectedCtx });
            store.setModelLoaded(true);
          }
        }

        const tokens = await wllamaService.tokenize(inputText);
        const inputCount = tokens.length;
        const requiredCount = Math.floor(inputCount * 2.5);

        if (requiredCount > selectedCtx) {
          updateStatus(
            `Capacity exceeded (Required: ${requiredCount}, Current: ${selectedCtx}). Please select a larger context size. Warning: Larger sizes consume more memory.`,
          );
          store.setTranslating(false);
          renderTranslateButton();
          return;
        }

        const targetLang = languageRef.value;
        updateStatus('Translating...');

        await wllamaService.translate(inputText, targetLang, (currentText) => {
          if (outputRef) {
            outputRef.value = currentText;
          }
        });
        updateStatus('');
      } catch (e: unknown) {
        console.error(e);
        const message = e instanceof Error ? e.message : String(e);
        updateStatus(`Error: ${message}`);
      } finally {
        store.setTranslating(false);
        renderTranslateButton();
      }
    },
  });
};

const App = () => {
  return div(
    { id: 'app-container' },
    div({ id: 'model-controls-wrapper' }, createModelControls()),
    div(
      {},
      div({ id: 'language-selector-wrapper' }, createLanguageSelector()),
      div({ id: 'context-selector-wrapper' }, createContextSelector()),
    ),
    StatusDisplay(),
    div(
      {},
      div(
        {},
        div({ id: 'translation-input-wrapper' }, createTranslationInput()),
        div({ id: 'translation-output-wrapper' }, createTranslationOutput()),
      ),
      div({ id: 'translate-button-wrapper' }, createTranslateButton()),
    ),
  );
};

mount('app', App());

const init = async () => {
  const storedCache = await wllamaService.checkCacheResult();
  store.setModelCached(storedCache);
  renderModelControls();
  renderTranslateButton();
};

init();
