import { mount, tags } from '@twiqjs/twiq';
import type { WllamaService } from '../services/wllama';

export type AppStatus =
  | 'INITIAL' // Not cached, showing download UI
  | 'DOWNLOADING' // Downloading model
  | 'READY' // Cached, showing Ready message
  | 'SETTINGS' // Cached, showing Settings UI
  | 'TRANSLATING'; // Translating

const { div, span, progress: progressBar, button, input } = tags;

type StatusDisplayDeps = {
  wllama: WllamaService;
  defaultModelUrl: string;
  onStatusChange: (status: AppStatus) => void;
  onProgress: (progress: number) => void;
  onError: (error: string | null) => void;
};

export const createStatusDisplay = (deps: StatusDisplayDeps) => {
  const container = div({ class: 'message' });
  // We use 'container' variable from closure.

  // --- Logic Implementation ---

  // Note: We don't read from Global Store. We manage local state if needed for immediate feedback,
  // but primarily we notify the parent via callbacks. The parent might call our API methods back
  // to update our display state (e.g. setStatus), creating a loop that ensures consistency.

  let _modelUrl = deps.defaultModelUrl;
  let _status: AppStatus = 'INITIAL';
  let _progress = 0;
  let _errorMessage: string | null = null;

  const downloadModel = async (url: string) => {
    // Notify start
    deps.onStatusChange('DOWNLOADING');
    deps.onProgress(0);
    deps.onError(null);

    try {
      await deps.wllama.downloadModel(url, (p) => {
        deps.onProgress(p);
      });
      deps.onProgress(100);
      deps.onStatusChange('READY');
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : String(e);
      deps.onError(`Download failed: ${message}`);
      deps.onProgress(0);
      deps.onStatusChange('INITIAL');
    }
  };

  const deleteModel = async (url: string) => {
    const executeForceDelete = async (reason: string) => {
      console.warn(`Specific model delete failed. Reason: ${reason}`);
      console.warn('Executing force delete (clearAllCaches) as fallback.');
      await deps.wllama.clearAllCaches();
      deps.onStatusChange('INITIAL');
      deps.onError(null);
    };

    try {
      const result = await deps.wllama.deleteCache(url);
      if (result.type === 'success') {
        deps.onStatusChange('INITIAL');
        deps.onError(null);
      } else {
        await executeForceDelete(result.type);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      await executeForceDelete(`Exception: ${message}`);
    }
  };

  // --- Render ---

  const renderContent = () => {
    const isModelCached = _status !== 'INITIAL' && _status !== 'DOWNLOADING';
    const isSettingsOpen = _status === 'SETTINGS';
    const isDownloading = _status === 'DOWNLOADING';

    // 1. Download Mode
    if (!isModelCached) {
      return [
        div(
          {},
          input({
            type: 'text',
            value: _modelUrl,
            readonly: true, // Read-only
          }),
          button(
            {
              onclick: () => downloadModel(_modelUrl),
              disabled: isDownloading ? true : undefined,
            },
            'Download',
          ),
        ),
        div(
          { class: `${!isDownloading ? 'none' : ''}` },
          span({}, `Downloading: ${Math.round(_progress)}%`),
          progressBar({ value: _progress, max: 100 }),
        ),
        _errorMessage ? div({}, _errorMessage) : '',
      ];
    }

    // 2. Settings Mode
    if (isSettingsOpen) {
      return [
        div(
          {},
          input({ type: 'text', value: _modelUrl, readonly: true }),
          button({ onclick: () => deleteModel(_modelUrl) }, 'Delete'),
        ),
        _errorMessage ? div({}, _errorMessage) : '',
      ];
    }

    // 3. Normal Mode
    let messageText = '';
    if (_errorMessage) messageText = _errorMessage;
    else if (_status === 'TRANSLATING') messageText = 'Translating...';
    else if (_status === 'READY') messageText = 'Ready';

    return [span({}, messageText)];
  };

  const render = () => {
    return container;
  };

  const _update = () => {
    mount(container, ...renderContent());
  };

  // Initial render
  _update();

  // API Methods
  render.setStatus = (status: AppStatus) => {
    if (_status === status) return;
    _status = status;
    _update();
  };

  render.setProgress = (progress: number) => {
    if (_progress === progress) return;
    _progress = progress;
    _update();
  };

  render.setError = (error: string | null) => {
    if (_errorMessage === error) return;
    _errorMessage = error;
    _update();
  };

  render.setModelUrl = (url: string) => {
    if (_modelUrl === url) return;
    _modelUrl = url;
    _update();
  };

  return render;
};
