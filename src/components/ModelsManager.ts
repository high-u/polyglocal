import { mount, tags } from '@twiqjs/twiq';
import {
  deleteModelByUrl,
  downloadModel,
  listCachedModels,
} from '../services/wllama';

const { div, button, ul, li, input, progress: progressBar, span } = tags;

export const createModelsManager = () => {
  const createProgressBar = (props: {
    isDownloading: boolean;
    progress: number;
  }) => {
    return progressBar({
      value: props.progress,
      max: 100,
      class: props.isDownloading ? 'display-unset' : 'none',
    });
  };

  const createModelList = (props: {
    models: string[];
    deletingModels: string[];
    onDelete: (url: string) => void;
  }) => {
    return ul(
      {},
      ...props.models.map((m) => {
        const deleteBtn = button(
          {
            class: 'button-primary',
            disabled: props.deletingModels.includes(m) ? 'true' : undefined,
            onclick: () => props.onDelete(m),
          },
          'Delete',
        );
        return li({ class: '' }, span({ class: 'text-base' }, m), deleteBtn);
      }),
    );
  };

  const createControls = (props: {
    downloadUrl: string;
    isDownloading: boolean;
    onInput: (val: string) => void;
    onDownload: () => void;
  }) => {
    return [
      input({
        type: 'text',
        class: '',
        placeholder: 'Model URL',
        value: props.downloadUrl,
        readonly: props.isDownloading ? 'true' : undefined,
        oninput: (e: Event) =>
          props.onInput((e.target as HTMLInputElement).value),
      }),
      button(
        {
          class: 'button-primary',
          disabled: props.isDownloading ? 'true' : undefined,
          onclick: props.onDownload,
        },
        'Download',
      ),
    ];
  };

  const render = () => {
    const state = {
      models: [] as string[],
      downloadUrl: '',
      isDownloading: false,
      progress: 0,
      deletingModels: [] as string[],
    };

    const container = div({});
    const controlsContainer = div({});
    const progressContainer = div({});
    const listContainer = div({});

    const updateProgress = () => {
      mount(
        progressContainer,
        createProgressBar({
          isDownloading: state.isDownloading,
          progress: state.progress,
        }),
      );
    };

    const handleDelete = async (url: string) => {
      state.deletingModels = [...state.deletingModels, url];
      updateList();

      await deleteModelByUrl(url);

      state.deletingModels = state.deletingModels.filter((m) => m !== url);
      state.models = await listCachedModels();
      updateList();
    };

    const updateList = () => {
      mount(
        listContainer,
        createModelList({
          models: state.models,
          deletingModels: state.deletingModels,
          onDelete: handleDelete,
        }),
      );
    };

    const handleDownload = async () => {
      try {
        new URL(state.downloadUrl);
      } catch {
        alert('Invalid URL');
        return;
      }

      state.isDownloading = true;
      state.progress = 0;
      updateControls();
      updateProgress();

      try {
        await downloadModel(state.downloadUrl, (p: number) => {
          state.progress = p;
          updateProgress();
        });
        state.downloadUrl = '';
      } catch (e) {
        console.error(e);
        alert('Download failed');
      } finally {
        state.isDownloading = false;
        state.models = await listCachedModels();
        updateControls();
        updateProgress();
        updateList();
      }
    };

    const updateControls = () => {
      mount(
        controlsContainer,
        ...createControls({
          downloadUrl: state.downloadUrl,
          isDownloading: state.isDownloading,
          onInput: (val) => {
            state.downloadUrl = val;
          },
          onDownload: handleDownload,
        }),
      );
    };

    listCachedModels().then((models: string[]) => {
      state.models = models;
      updateList();
    });

    updateControls();
    updateProgress();

    mount(
      container,
      div({ class: 'p-y-m' }, controlsContainer, progressContainer),
      listContainer,
    );

    return container;
  };

  return render;
};
