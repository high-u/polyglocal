import { tags, tagsSvg } from '@twiqjs/twiq';
import type { AppStatus } from './store';

const { div, button, select, option } = tags;
const { svg, path } = tagsSvg;

export interface ControlPanelProps {
  status: AppStatus;
  targetLanguage: string;
  contextSize: number;

  // Data props
  languages: { name: string; code: string }[];
  contextOptions: number[];

  onTranslate: () => void;
  onLanguageChange: (val: string) => void;
  onContextChange: (val: number) => void;
}

type ControlConfig = {
  langSelect: boolean;
  ctxSelect: boolean;
  translateBtn: boolean;
};

const CONFIGS: Record<string, ControlConfig> = {
  DISABLED: {
    langSelect: true, // true = disabled
    ctxSelect: true,
    translateBtn: true,
  },
  ENABLED: {
    langSelect: false,
    ctxSelect: false,
    translateBtn: false,
  },
};

const resolveControlConfig = (status: AppStatus): ControlConfig => {
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

export const ControlPanel = (props: ControlPanelProps) => {
  const config = resolveControlConfig(props.status);

  return div(
    {
      class: 'flex flex-end gap-s items-end',
    },
    select(
      {
        class: 'button-primary p-x-m p-y-s',
        disabled: config.langSelect ? true : undefined,
        onchange: (e: Event) =>
          props.onLanguageChange((e.target as HTMLSelectElement).value),
      },
      ...props.languages.map((lang) =>
        option(
          {
            value: lang.name,
            selected: lang.name === props.targetLanguage ? true : undefined,
          },
          lang.code,
        ),
      ),
    ),
    select(
      {
        class: 'button-primary p-x-m p-y-s',
        disabled: config.ctxSelect ? true : undefined,
        onchange: (e: Event) =>
          props.onContextChange(
            parseInt((e.target as HTMLSelectElement).value, 10),
          ),
      },
      ...props.contextOptions.map((size) =>
        option(
          {
            value: size,
            selected: size === props.contextSize ? true : undefined,
          },
          size.toString(),
        ),
      ),
    ),
    button(
      {
        class: 'flex center gap-s button-primary p-x-m p-y-s',
        onclick: props.onTranslate,
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
  );
};
