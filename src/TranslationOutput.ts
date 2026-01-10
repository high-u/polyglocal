import { tags } from '@twiqjs/twiq';

const { div, textarea } = tags;

export interface TranslationOutputProps {
  value: string;
  onRef?: (el: HTMLTextAreaElement) => void;
}

export const TranslationOutput = ({ value, onRef }: TranslationOutputProps) => {
  const el = textarea(
    {
      class: 'height-100 width-100 resize-none',
      readonly: '',
    },
    value,
  );

  if (onRef) {
    onRef(el as unknown as HTMLTextAreaElement);
  }

  return div({ class: 'grow' }, el);
};
