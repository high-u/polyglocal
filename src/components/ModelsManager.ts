import { mount, tags } from '@twiqjs/twiq';
import {
  deleteModelByUrl,
  downloadModel,
  listCachedModels,
} from '../services/wllama';

const { div, button, ul, li, input, span } = tags;

export const createModelsManager = () => {
  return () => {
    const urlInput = input({
      class: 'grow bg-yin-8 text-yin-2 border-yin-8 round-s p-x-s',
      type: 'text',
      placeholder: 'Model URL',
    }) as HTMLInputElement;
    const downloadBtn = button(
      {
        class: 'text-yin-2 bg-yin-7 border-yin-7 pointer round-s p-x-s',
        onclick: async () => {
          const url = urlInput.value;
          try {
            new URL(url);
          } catch {
            alert('Invalid URL');
            return;
          }
          urlInput.readOnly = true;
          downloadBtn.disabled = true;
          urlInput.style.background = `linear-gradient(to right, var(--uchu-yin-5) 0%, var(--uchu-yin-8) 0%)`;
          try {
            await downloadModel(url, (p) => {
              urlInput.style.background = `linear-gradient(to right, var(--uchu-yin-6) ${p}%, var(--uchu-yin-8) ${p}%)`;
            });
            urlInput.value = '';
          } catch (e) {
            console.error(e);
            alert('Download failed');
          }
          urlInput.readOnly = false;
          downloadBtn.disabled = false;
          urlInput.style.background = '';
          updateList();
        },
      },
      'Download',
    ) as HTMLButtonElement;
    const updateList = async () => {
      const models = await listCachedModels();
      mount(
        'models-list',
        ul(
          { class: 'list-style-none flex-col gap-s p-x-0 p-y-0' },
          ...models.map((m) =>
            li(
              { class: 'border-yin-7 p-x-s p-y-s round-s flex gap-m' },
              span({ class: 'text-yin-2 grow' }, m),
              button(
                {
                  class:
                    'text-yin-1 bg-transparent border-none underline pointer',
                  onclick: async () => {
                    await deleteModelByUrl(m);
                    updateList();
                  },
                },
                'Delete',
              ),
            ),
          ),
        ),
      );
    };
    updateList();
    return div(
      { class: 'p-y-m flex-col gap-m' },
      div({ class: 'flex gap-s' }, urlInput, downloadBtn),
      div({ id: 'models-list' }),
    );
  };
};
