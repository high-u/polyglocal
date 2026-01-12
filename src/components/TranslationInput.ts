import { tags } from '@twiqjs/twiq';

const { textarea } = tags;

export const createTranslationInput = () => {
  const el = textarea({
    class:
      'width-100 height-100 p-m text-base border-none resize-none bg-surface-1',
    placeholder: 'Enter text to translate...',
    oninput: () => {
      // Internal value handling if needed,
      // but value prop is sufficient since we don't re-render entire element
    },
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
