import { tags } from '@twiqjs/twiq';

const { div, button, select, option } = tags;

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
  onTranslate: () => void;
  onLanguageChange: (val: string) => void;
  onContextChange: (val: number) => void;
}

export const ControlPanel = (props: ControlPanelProps) => {
  return div(
    {},
    // 1. Model Name (Select)
    div(
      {},
      select(
        { disabled: true },
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
    ),
    // 2. Download Button
    button(
      {
        onclick: props.onDownload,
        disabled: props.isModelCached ? true : undefined,
      },
      'Download',
    ),
    // 3. Delete Button
    button(
      {
        onclick: props.onDelete,
        disabled: !props.isModelCached ? true : undefined,
      },
      'Delete',
    ),
    // 4. Load Button
    button(
      {
        onclick: props.onLoad,
        disabled:
          !props.isModelCached || props.isModelLoaded ? true : undefined,
      },
      'Load',
    ),
    // 5. Language Selector
    div(
      {},
      select(
        {
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
    ),
    // 6. Context Size Selector
    div(
      {},
      select(
        {
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
    ),
    // 7. Translate Button
    button(
      {
        onclick: props.onTranslate,
        disabled:
          !props.isModelLoaded || props.isTranslating ? true : undefined,
      },
      'Translate',
    ),
  );
};
