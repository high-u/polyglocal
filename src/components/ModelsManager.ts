import { mount, tags } from '@twiqjs/twiq';
import {
  deleteModelByUrl,
  downloadModel,
  listCachedModels,
} from '../services/wllama';

const { div, button, ul, li, input, progress: progressBar, span } = tags;

export const createModelsManager = () => {
  return () => {
    const urlInput = input({
      class: 'grow bg-yin-8 text-yin-2 border-yin-7 round-s',
      type: 'text',
      placeholder: 'Model URL',
    }) as HTMLInputElement;
    const downloadBtn = button(
      {
        class: 'text-yin-1 bg-yin-8 border-yin-7 pointer round-s',
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
          mount('models-progress', progressBar({ value: 0, max: 100 }));
          try {
            await downloadModel(url, (p) => {
              mount('models-progress', progressBar({ value: p, max: 100 }));
            });
            urlInput.value = '';
          } catch (e) {
            console.error(e);
            alert('Download failed');
          }
          urlInput.readOnly = false;
          downloadBtn.disabled = false;
          mount('models-progress', '');
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
          { class: 'list-style-none flex-col gap-s' },
          ...models.map((m) =>
            li(
              { class: 'border-yin-8 p-x-m p-y-s round-s flex gap-m' },
              span({ class: 'text-yin-2' }, m),
              button(
                {
                  class: 'text-yin-1 bg-transparent border-none underline pointer',
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
      { class: 'p-y-m flex-col gap-s' },
      div(
        { class: 'flex gap-s' },
        urlInput,
        downloadBtn
      ),
      div({ id: 'models-progress' }),
      div({ id: 'models-list' }),
    );
  };
};
