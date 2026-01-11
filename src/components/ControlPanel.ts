import { mount, tags, tagsSvg } from '@twiqjs/twiq';
import type { WllamaService } from '../services/wllama';

export type ControlPanelStatus =
  | 'INITIAL'
  | 'DOWNLOADING'
  | 'READY'
  | 'SETTINGS'
  | 'TRANSLATING';

const { div, button, select, option } = tags;
const { svg, path } = tagsSvg;

type ControlPanelDeps = {
  wllama: WllamaService;
  // External components refs
  inputComponent: { getValue: () => string };
  outputComponent: { setValue: (v: string) => void };
  // Defaults
  languages: { name: string; code: string }[];
  contextOptions: number[];
  initialLanguage: string;
  initialContextSize: number;
  defaultModelUrl: string;
  // Callbacks
  onStatusChange: (status: ControlPanelStatus) => void;
  onError: (error: string | null) => void;
  // Change events (for persistence or other side effects)
  onLanguageChange: (lang: string) => void;
  onContextSizeChange: (size: number) => void;
  // Current Global State (passed down for checking readiness)
  getCurrentStatus: () => ControlPanelStatus;
};

type ControlConfig = {
  langSelect: boolean;
  ctxSelect: boolean;
  translateBtn: boolean;
};

const CONFIGS: Record<string, ControlConfig> = {
  DISABLED: {
    langSelect: true,
    ctxSelect: true,
    translateBtn: true,
  },
  ENABLED: {
    langSelect: false,
    ctxSelect: false,
    translateBtn: false,
  },
};

const resolveControlConfig = (status: ControlPanelStatus): ControlConfig => {
  switch (status) {
    case 'INITIAL':
    case 'DOWNLOADING':
    case 'TRANSLATING':
      return CONFIGS.DISABLED;
    case 'READY':
    case 'SETTINGS':
      return CONFIGS.ENABLED;
    default:
      return CONFIGS.DISABLED;
  }
};

export const createControlPanel = (deps: ControlPanelDeps) => {
  const container = div({
    class: 'flex flex-end gap-s items-end',
  });

  // State
  let _currentStatus: ControlPanelStatus = 'INITIAL';
  let _targetLanguage = deps.initialLanguage;
  let _contextSize = deps.initialContextSize;

  // --- Logic Implementation ---

  const translate = async () => {
    const inputText = deps.inputComponent.getValue();
    if (inputText.trim() === '') return;

    // Check if we can translate via prop/getter
    const currentStatus = deps.getCurrentStatus();
    if (
      currentStatus === 'INITIAL' ||
      currentStatus === 'DOWNLOADING' ||
      currentStatus === 'TRANSLATING'
    )
      return;

    // Start Translation
    deps.onStatusChange('TRANSLATING');
    deps.onError(null);
    deps.outputComponent.setValue('');
    // We don't call updateState here directly; onStatusChange handles notification.

    try {
      // Load logic
      await deps.wllama.loadModel(deps.defaultModelUrl, undefined, {
        contextLength: _contextSize,
      });

      // Tokenize check
      const tokens = await deps.wllama.tokenize(inputText);
      const requiredCount = Math.floor(tokens.length * 2.5);

      if (requiredCount > _contextSize) {
        deps.onError(
          `Capacity exceeded (Required: ${requiredCount}). Increase context size.`,
        );
        deps.onStatusChange('READY');
        return;
      }

      // Execute Translate
      await deps.wllama.translate(inputText, _targetLanguage, (currentText) => {
        deps.outputComponent.setValue(currentText);
      });
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : String(e);
      deps.onError(`Error: ${message}`);
    } finally {
      try {
        await deps.wllama.unloadModel();
      } catch (e) {
        console.error('Unload failed:', e);
      }
      deps.onStatusChange('READY');
    }
  };

  const setLanguage = (val: string) => {
    _targetLanguage = val;
    deps.onLanguageChange(val);
  };

  const setContextSize = (val: number) => {
    _contextSize = val;
    deps.onContextSizeChange(val);
  };

  // --- Render ---

  const renderContent = () => {
    const config = resolveControlConfig(_currentStatus);

    return [
      select(
        {
          class: 'button-primary p-x-m p-y-s',
          disabled: config.langSelect ? true : undefined,
          onchange: (e: Event) => {
            const target = e.target as HTMLSelectElement;
            const val = target.value;
            setLanguage(val);
          },
        },
        ...deps.languages.map((lang) =>
          option(
            {
              value: lang.name,
              selected: lang.name === _targetLanguage ? true : undefined,
            },
            lang.code,
          ),
        ),
      ),
      select(
        {
          class: 'button-primary p-x-m p-y-s',
          disabled: config.ctxSelect ? true : undefined,
          onchange: (e: Event) => {
            const target = e.target as HTMLSelectElement;
            const val = parseInt(target.value, 10);
            setContextSize(val);
          },
        },
        ...deps.contextOptions.map((size) =>
          option(
            {
              value: size,
              selected: size === _contextSize ? true : undefined,
            },
            size.toString(),
          ),
        ),
      ),
      button(
        {
          class: 'flex center gap-s button-primary p-x-m p-y-s',
          onclick: translate,
          disabled: config.translateBtn ? true : undefined,
        },
        svg(
          {
            xmlns: 'http://www.w3.org/2000/svg',
            fill: 'none',
            viewBox: '0 0 24 24',
            'stroke-width': '1.5',
            stroke: 'currentColor',
            class: 'icon-s',
          },
          path({
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            d: 'm10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802',
          }),
        ),
        'Translate',
      ),
    ];
  };

  const render = () => {
    return container;
  };

  const _update = () => {
    mount(container, ...renderContent());
  };

  // Initial render
  _update();

  render.updateState = (status: ControlPanelStatus) => {
    if (_currentStatus === status) return;
    _currentStatus = status;
    _update();
  };

  return render;
};
