import { tags } from '@twiqjs/twiq';

const { textarea } = tags;

export const createTranslationOutput = () => {
  const el = textarea({
    class:
      'width-100 height-100 p-m text-base border-none resize-none bg-surface-2',
    readonly: true,
  }) as HTMLTextAreaElement;

  const render = () => {
    return el;
  };

  render.setValue = (value: string) => {
    if (el.value === value) return;
    el.value = value;
  };

  return render;
};
