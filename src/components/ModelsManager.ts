import { mount, tags } from '@twiqjs/twiq';
import { WllamaService } from '../wllama';

const { div, button, ul, li, input, progress: progressBar, span } = tags;

type ModelsManagerProps = {
  modal: {
    show: (content: HTMLElement) => void;
    close: () => void;
  };
};

export const createModelsManager = (props: ModelsManagerProps) => {
  const wllamaService = new WllamaService();

  const createProgressBar = (props: { isDownloading: boolean; progress: number }) => {
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
        oninput: (e: Event) => props.onInput((e.target as HTMLInputElement).value),
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
    return button(
      {
        class: 'button-primary',
        onclick: async () => {
          await renderModalContent();
        },
      },
      'Models',
    );
  };

  const renderModalContent = async () => {
    // State
    const state = {
      models: await wllamaService.listCachedModels(),
      downloadUrl: '',
      isDownloading: false,
      progress: 0,
      deletingModels: [] as string[],
    };

    // Containers
    const controlsContainer = div({});
    const progressContainer = div({});
    const listContainer = div({});
    
    const updateProgress = () => {
      mount(
        progressContainer,
        createProgressBar({
            isDownloading: state.isDownloading,
            progress: state.progress
        })
      );
    };

    const handleDelete = async (url: string) => {
        state.deletingModels = [...state.deletingModels, url];
        updateList();

        await wllamaService.deleteModelByUrl(url);
        
        state.deletingModels = state.deletingModels.filter(m => m !== url);
        state.models = await wllamaService.listCachedModels();
        updateList();
    };

    const updateList = () => {
      mount(
        listContainer,
        createModelList({
            models: state.models,
            deletingModels: state.deletingModels,
            onDelete: handleDelete
        })
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
        await wllamaService.downloadModel(state.downloadUrl, (p) => {
          state.progress = p;
          updateProgress();
        });
        state.downloadUrl = '';
      } catch (e) {
        console.error(e);
        alert('Download failed');
      } finally {
        state.isDownloading = false;
        state.models = await wllamaService.listCachedModels();
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
                onInput: (val) => { state.downloadUrl = val; },
                onDownload: handleDownload
            })
        );
    };

    const container = div(
      {},
      div(
        {},
        button(
          {
            class: 'button-primary',
            onclick: props.modal.close,
          },
          'Close',
        ),
      ),
      div(
          { class: 'p-y-m' },
          controlsContainer,
          progressContainer
      ),
      listContainer,
    );

    // Initial fill
    updateControls();
    updateList();
    updateProgress();

    props.modal.show(container);
  };

  return render;
};
