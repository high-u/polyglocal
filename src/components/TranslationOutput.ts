import { tags } from '@twiqjs/twiq';

const { textarea } = tags;

export const createTranslationOutput = () => {
  const el = textarea({
    class: 'bg-yin-8 border-yin-7 round-s width-100 height-100 p-m resize-none',
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
