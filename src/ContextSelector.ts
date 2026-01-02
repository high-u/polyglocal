import { tags } from '@twiqjs/twiq';

const { div, select, option, label } = tags;

export interface ContextSelectorProps {
  options: number[];
  value: number;
  onRef: (el: HTMLSelectElement) => void;
}

export const ContextSelector = ({
  options,
  value,
  onRef,
}: ContextSelectorProps) => {
  const el = select(
    {},
    ...options.map((opt) =>
      option(
        { value: opt.toString(), selected: opt === value ? true : undefined },
        opt.toString(),
      ),
    ),
  );

  el.value = value.toString();

  if (onRef) onRef(el as HTMLSelectElement);

  return div({}, el, label({}, 'Context Size (Max Tokens)'));
};
