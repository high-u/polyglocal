import { mount, tags } from '@twiqjs/twiq';
import {
  addPreset,
  deletePreset,
  getPresetById,
  getPresets,
  type ReasoningPreset,
  updatePreset,
} from '../services/reasoningPreset';
import { listCachedModels } from '../services/wllama';
import { createModalWindow } from './ModalWindow';
import { createModelsManager } from './ModelsManager';

const { div, button, input, textarea, select, option, ul, li, span } = tags;

type FormState = {
  id: string;
  name: string;
  model: string;
  contextLength: number;
  prompt: string;
  config: string;
};

const createPresetForm = (props: {
  state: FormState;
  models: string[];
  onInput: (field: keyof FormState, value: string) => void;
  onRegister: () => void;
  onClear: () => void;
}) => {
  const modelOptions = [
    option({ value: '' }, 'Select Model'),
    ...props.models.map((m) =>
      option(
        { value: m, selected: m === props.state.model ? 'true' : undefined },
        m,
      ),
    ),
  ];

  return div(
    {},
    input({
      readonly: 'true',
      placeholder: 'ID (Auto-generated)',
      value: props.state.id,
    }),
    input({
      placeholder: 'Name',
      value: props.state.name,
      oninput: (e: Event) =>
        props.onInput('name', (e.target as HTMLInputElement).value),
    }),
    select(
      {
        onchange: (e: Event) =>
          props.onInput('model', (e.target as HTMLSelectElement).value),
      },
      ...modelOptions,
    ),
    input({
      type: 'number',
      placeholder: 'Ctx Length (default: 4096)',
      value: String(props.state.contextLength || 4096),
      oninput: (e: Event) =>
        props.onInput('contextLength', (e.target as HTMLInputElement).value),
    }),
    textarea({
      rows: 3,
      placeholder: 'System Prompt',
      value: props.state.prompt,
      oninput: (e: Event) =>
        props.onInput('prompt', (e.target as HTMLTextAreaElement).value),
    }),
    textarea({
      rows: 3,
      placeholder: 'Sampling Config (JSON)',
      value: props.state.config,
      oninput: (e: Event) =>
        props.onInput('config', (e.target as HTMLTextAreaElement).value),
    }),
    button(
      {
        class: 'button-primary',
        onclick: props.onRegister,
      },
      'Register',
    ),
    button(
      {
        onclick: props.onClear,
      },
      'Clear',
    ),
  );
};

const createPresetList = (props: {
  presets: ReasoningPreset[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  return ul(
    {},
    ...props.presets.map((p) =>
      li(
        { class: 'text-base' },
        span({}, p.name),
        button(
          {
            class: 'button-primary',
            onclick: () => props.onEdit(p.id),
          },
          'Edit',
        ),
        button(
          {
            class: 'button-primary',
            onclick: () => props.onDelete(p.id),
          },
          'Delete',
        ),
      ),
    ),
  );
};

export const createReasoningManager = () => {
  const container = div({});
  const modelsModal = createModalWindow();
  const modelsManager = createModelsManager();

  const render = () => {
    const state = {
      form: {
        id: '',
        name: '',
        model: '',
        contextLength: 4096,
        prompt: '',
        config: '',
      } as FormState,
      cachedModels: [] as string[],
    };

    const formContainer = div({});
    const listContainer = div({});

    const updateForm = () => {
      mount(
        formContainer,
        createPresetForm({
          state: state.form,
          models: state.cachedModels,
          onInput: (field, value) => {
            if (field === 'contextLength') {
              (state.form[field] as number) = parseInt(value, 10);
            } else {
              (state.form[field] as string) = value;
            }
          },
          onRegister: handleRegister,
          onClear: handleClear,
        }),
      );
    };

    const updateList = () => {
      const presets = getPresets();
      mount(
        listContainer,
        createPresetList({
          presets,
          onEdit: handleEdit,
          onDelete: handleDelete,
        }),
      );
    };

    const handleRegister = () => {
      if (!state.form.name || !state.form.model) return;

      if (state.form.id) {
        updatePreset({
          id: state.form.id,
          name: state.form.name,
          model: state.form.model,
          contextLength: state.form.contextLength,
          prompt: state.form.prompt,
          config: state.form.config,
        });
      } else {
        addPreset({
          name: state.form.name,
          model: state.form.model,
          contextLength: state.form.contextLength,
          prompt: state.form.prompt,
          config: state.form.config,
        });
      }
      handleClear();
    };

    const handleClear = () => {
      state.form = {
        id: '',
        name: '',
        model: '',
        contextLength: 4096,
        prompt: '',
        config: '',
      };
      updateForm();
      updateList();
    };

    const handleEdit = (id: string) => {
      const target = getPresetById(id);
      if (target) {
        state.form = {
          ...target,
          contextLength: target.contextLength || 4096,
          config: target.config || '',
        };
        updateForm();
      }
    };

    const handleDelete = (id: string) => {
      deletePreset(id);
      updateList();
    };

    const updateDropdown = async () => {
      state.cachedModels = await listCachedModels();
      updateForm();
    };

    updateDropdown();

    updateForm();
    updateList();

    const content = div(
      {},
      div(
        {},
        button(
          {
            class: 'button-primary',
            onclick: () => {
              const managerContent = modelsManager();
              modelsModal.show(managerContent, {
                onClose: () => {
                  updateDropdown();
                },
              });
            },
          },
          'Manage Models',
        ),
      ),
      formContainer,
      listContainer,

      modelsModal(),
    );

    mount(container, content);
    return container;
  };

  return render;
};
