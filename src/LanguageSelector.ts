import { tags } from '@twiqjs/twiq';

const { div, select, option } = tags;

export interface LanguageSelectorProps {
  options: string[];
  value: string;
  onRef: (el: HTMLSelectElement) => void;
}

export const LanguageSelector = ({
  options,
  value,
  onRef,
}: LanguageSelectorProps) => {
  const el = select(
    {},
    ...options.map((lang) =>
      option(
        { value: lang, selected: lang === value ? true : undefined },
        lang,
      ),
    ),
  );

  el.value = value;

  if (onRef) onRef(el as HTMLSelectElement);

  return div({}, el, div({}, 'Target Language'));
};
