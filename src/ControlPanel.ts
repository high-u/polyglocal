import { tags } from '@twiqjs/twiq';

const { div, button, select, option, label, input } = tags;

export interface ControlPanelProps {
  isModelCached: boolean;
  isModelLoaded: boolean;
  isTranslating: boolean;
  targetLanguage: string;
  contextSize: number;

  // Data props
  languages: string[];
  contextOptions: number[];
  modelOptions: { label: string; value: string }[];
  currentModel: string;

  onDownload: () => void;
  onDelete: () => void;
  onLoad: () => void;
  onUnload: () => void;
  onAutoLoadChange: (checked: boolean) => void;
  isAutoLoadChecked: boolean;
  onTranslate: () => void;
  onLanguageChange: (val: string) => void;
  onContextChange: (val: number) => void;
}

export const ControlPanel = (props: ControlPanelProps) => {
  return div(
    {
      class: 'flex gap-m'
    },
    div(
      {
        class: 'flex gap-m'
      },
      div (
        {
          class: 'flex gap-s',
        }, 
        select(
          {
            class: 'button-primary',
            disabled: true,
          },
          ...props.modelOptions.map((opt) =>
            option(
              {
                value: opt.value,
                selected: opt.value === props.currentModel ? true : undefined,
              },
              opt.label,
            ),
          ),
        ),
        button(
          {
            class: 'button-primary',
            onclick: props.onDownload,
            disabled: props.isModelCached ? true : undefined,
          },
          'Download',
        ),
        button(
          {
            class: 'button-primary',
            onclick: props.onDelete,
            disabled: !props.isModelCached ? true : undefined,
          },
          'Delete',
        ),
      ),
      div(
        {
          class: 'flex gap-s',
        },
        button(
          {
            class: 'button-primary',
            onclick: props.onLoad,
            disabled:
              !props.isModelCached || props.isModelLoaded ? true : undefined,
          },
          'Load',
        ),
        button(
          {
            class: 'button-primary',
            onclick: props.onUnload,
            disabled: !props.isModelLoaded ? true : undefined,
          },
          'Unload',
        ),
        label(
          {
            class: 'button-primary',
            for: 'auto-load-check'
          },
          input(
            {
              class: '',
              type: 'checkbox',
              id: 'auto-load-check',
              checked: props.isAutoLoadChecked ? true : undefined,
              onchange: (e: Event) =>
                props.onAutoLoadChange((e.target as HTMLInputElement).checked),
            }
          ),
          'Auto-load',
        ),
      ),
    ),
    div(
      {
        class: 'grow flex gap-s',
      },
      select(
        {
          class: 'button-primary',
          onchange: (e: Event) =>
            props.onLanguageChange((e.target as HTMLSelectElement).value),
        },
        ...props.languages.map((lang) =>
          option(
            {
              value: lang,
              selected: lang === props.targetLanguage ? true : undefined,
            },
            lang,
          ),
        ),
      ),
      select(
        {
          class: 'button-primary',
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
          class: 'grow width-100 button-primary',
          onclick: props.onTranslate,
          disabled:
            !props.isModelLoaded || props.isTranslating ? true : undefined,
        },
        'Translate',
      ),
    ),
  );
};
