import { tags } from '@twiqjs/twiq';

const { div, textarea } = tags;

export interface TranslationInputProps {
  value?: string;
  onRef: (el: HTMLTextAreaElement) => void;
}

export const TranslationInput = ({
  value = '',
  onRef,
}: TranslationInputProps) => {
  const el = textarea({}, value);

  if (onRef) onRef(el as unknown as HTMLTextAreaElement);

  return div({}, el);
};
