import { mount, tags } from '@twiqjs/twiq';
import {
  addPreset,
  deletePreset,
  getPresetById,
  getPresets,
  updatePreset,
} from '../services/reasoningPreset';
import { listCachedModels } from '../services/wllama';
import { createModalWindow } from './ModalWindow';
import { createModelsManager } from './ModelsManager';

const { div, button, input, textarea, select, option, ul, li, span } = tags;

const CONTEXT_LENGTH_OPTIONS = [
  1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144,
];

export const createPresetManager = () => {
  const modelsModal = createModalWindow();
  const modelsManager = createModelsManager();

  return () => {
    let editId: string | undefined;

    // 入力欄
    const nameInput = input({
      class: 'text-yin-1 bg-yin-8 border-yin-7 round-s',
      placeholder: 'Name',
    }) as HTMLInputElement;
    const modelSelect = select({
      class: 'text-yin-1 bg-yin-8 border-yin-7 round-s',
    }) as HTMLSelectElement;
    const ctxSelect = select(
      { class: 'text-yin-1 bg-yin-8 border-yin-7 round-s' },
      ...CONTEXT_LENGTH_OPTIONS.map((v) =>
        option(
          { value: String(v), selected: v === 4096 ? 'true' : undefined },
          String(v),
        ),
      ),
    ) as HTMLSelectElement;
    const promptTextarea = textarea({
      class: 'text-yin-1 bg-yin-8 border-yin-7 round-s',
      rows: 8,
      placeholder: 'System Prompt',
    }) as HTMLTextAreaElement;
    const configTextarea = textarea({
      class: 'text-yin-1 bg-yin-8 border-yin-7 round-s',
      rows: 8,
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
              { class: 'border-yin-7 p-x-m p-y-s round-s flex gap-m' },
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
      button(
        {
          class:
            'text-yin-2 bg-yin-7 border-yin-6 pointer round-s p-x-m p-y-xs',
          onclick: () => {
            modelsModal.show(modelsManager(), {
              onClose: () => {
                updateModelOptions();
                updateList();
              },
            });
          },
        },
        'Manage Models',
      ),
      div(
        { class: 'flex-col gap-s' },
        modelSelect,
        ctxSelect,
        nameInput,
        promptTextarea,
        configTextarea,
      ),
      div(
        { class: 'flex gap-s' },
        button(
          {
            class:
              'grow text-yin-2 bg-yin-7 border-yin-6 pointer round-s p-x-m p-y-xs',
            onclick: clearForm,
          },
          'Clear',
        ),
        button(
          {
            class:
              'grow text-yin-2 bg-yin-7 border-yin-6 pointer round-s p-x-m p-y-xs',
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
      modelsModal(),
    );
  };
};
