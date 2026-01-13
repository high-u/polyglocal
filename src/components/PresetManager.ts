import { mount, tags } from '@twiqjs/twiq';
import {
  addPreset,
  deletePreset,
  getPresetById,
  getPresets,
  updatePreset,
} from '../services/reasoningPreset';
import { listCachedModels } from '../services/wllama';

const { div, button, input, textarea, select, option, ul, li, span } = tags;

const CONTEXT_LENGTH_OPTIONS = [
  1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144,
];

export const createPresetManager = () => {
  return () => {
    let editId: string | undefined;

    // 入力欄
    const nameInput = input({
      class: 'text-yin-1 bg-yin-8 border-yin-8 round-s p-x-s',
      placeholder: 'Name',
    }) as HTMLInputElement;
    const modelSelect = select({
      class: 'text-yin-1 bg-yin-8 border-yin-8 round-s p-x-s',
    }) as HTMLSelectElement;
    const ctxSelect = select(
      { class: 'text-yin-1 bg-yin-8 border-yin-8 round-s p-x-s' },
      ...CONTEXT_LENGTH_OPTIONS.map((v) =>
        option(
          { value: String(v), selected: v === 4096 ? 'true' : undefined },
          String(v),
        ),
      ),
    ) as HTMLSelectElement;
    const promptTextarea = textarea({
      class: 'resize-none text-yin-1 bg-yin-8 border-yin-8 round-s p-x-s',
      rows: 4,
      placeholder: 'System Prompt',
    }) as HTMLTextAreaElement;
    const configTextarea = textarea({
      class: 'resize-none text-yin-1 bg-yin-8 border-yin-8 round-s p-x-s',
      rows: 4,
      placeholder: 'Sampling Config (JSON)',
    }) as HTMLTextAreaElement;

    const clearForm = () => {
      editId = undefined;
      nameInput.value = '';
      modelSelect.value = '';
      ctxSelect.value = '4096';
      promptTextarea.value = '';
      configTextarea.value = '';
    };

    const setForm = (id: string) => {
      const target = getPresetById(id);
      if (!target) return;
      editId = id;
      nameInput.value = target.name;
      modelSelect.value = target.model;
      ctxSelect.value = String(target.contextLength);
      promptTextarea.value = target.prompt;
      configTextarea.value = target.config || '';
    };

    const updateModelOptions = async () => {
      const models = await listCachedModels();
      const current = modelSelect.value;
      mount(
        modelSelect,
        option({ value: '' }, 'Select Model'),
        ...models.map((m) =>
          option({ value: m, selected: m === current ? 'true' : undefined }, m),
        ),
      );
    };

    const updateList = async () => {
      const models = await listCachedModels();
      const presets = getPresets();
      mount(
        'preset-list',
        ul(
          { class: 'list-style-none flex-col gap-s p-x-0 p-y-0' },
          ...presets.map((p) =>
            li(
              { class: 'border-yin-7 p-x-s p-y-s round-s flex gap-m' },
              span(
                { class: 'grow text-yin-2' },
                p.name +
                  (models.includes(p.model) ? '' : ' [Model Not Downloaded]'),
              ),
              button(
                {
                  class:
                    'text-yin-2 bg-transparent border-none underline pointer',
                  onclick: () => setForm(p.id),
                },
                'Edit',
              ),
              button(
                {
                  class:
                    'text-yin-2 bg-transparent border-none underline pointer',
                  onclick: () => {
                    deletePreset(p.id);
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

    updateModelOptions();
    updateList();

    return div(
      { class: 'flex-col gap-m p-y-m' },

      div(
        { class: 'flex-col gap-s' },
        nameInput,
        modelSelect,
        ctxSelect,
        promptTextarea,
        configTextarea,
      ),
      div(
        { class: 'flex gap-s' },
        span({ class: 'grow' }),
        button(
          {
            class:
              'text-yin-2 bg-yin-7 border-yin-7 pointer round-s p-x-s',
            onclick: clearForm,
          },
          'Clear',
        ),
        button(
          {
            class:
              'text-yin-2 bg-yin-7 border-yin-7 pointer round-s p-x-s',
            onclick: () => {
              const ctx = parseInt(ctxSelect.value, 10);
              if (Number.isNaN(ctx)) {
                alert('Context Length must be a number');
                return;
              }
              const values = {
                name: nameInput.value,
                model: modelSelect.value,
                contextLength: ctx,
                prompt: promptTextarea.value,
                config: configTextarea.value,
              };
              if (!values.name || !values.model) return;
              if (editId) {
                updatePreset({ id: editId, ...values });
              } else {
                addPreset(values);
              }
              clearForm();
              updateList();
            },
          },
          'Register',
        ),
      ),
      div({ id: 'preset-list' }),
    );
  };
};
