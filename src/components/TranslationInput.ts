import { tags } from '@twiqjs/twiq';

const { textarea } = tags;

export const createTranslationInput = () => {
  const el = textarea({
    class: 'bg-yin-8 border-yin-7 round-s width-100 height-100 p-m resize-none',
    placeholder: '',
  }) as HTMLTextAreaElement;

  const render = () => {
    return el;
  };

  render.getValue = () => el.value;

  render.setValue = (value: string) => {
    if (el.value === value) return;
    el.value = value;
  };

  return render;
};
