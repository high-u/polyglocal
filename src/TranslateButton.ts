import { tags } from '@twiqjs/twiq';

const { div, button, i, span } = tags;

export interface TranslateButtonProps {
  isTranslating: boolean;
  isModelLoaded: boolean;
  isModelCached: boolean;
  downloadProgress: number;
  onTranslate: () => void;
}

export const TranslateButton = ({
  isTranslating,
  isModelLoaded,
  isModelCached,
  downloadProgress,
  onTranslate,
}: TranslateButtonProps) => {
  if (!isModelCached && downloadProgress === 0) return div();

  const labelText = isTranslating
    ? 'Translating...'
    : isModelLoaded
      ? 'Translate'
      : 'Load & Translate';

  return button(
    {
      disabled: isTranslating || !isModelCached || undefined,
      onclick: onTranslate,
    },
    i({}, 'translate'),
    span({}, labelText),
  );
};
