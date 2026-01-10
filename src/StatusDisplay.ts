import { tags } from '@twiqjs/twiq';

const { div, span, progress: progressBar, button, input } = tags;

export interface StatusDisplayProps {
  progress: number;
  message: string;
  errorMessage?: string | null;
  onMessageRef?: (el: HTMLElement, isError: boolean) => void;
  // Model settings props
  isModelSettingsOpen?: boolean;
  modelUrl?: string;
  isModelCached?: boolean;
  isDownloading?: boolean;
  onDownload?: () => void;
  onDelete?: () => void;
  onModelUrlRef?: (el: HTMLInputElement) => void;
}

export const StatusDisplay = (props: StatusDisplayProps) => {
  const wrapper = (content: (string | HTMLElement)[]) =>
    div({ class: 'message' }, ...content);

  // 1. Download Mode (Not Cached)
  if (!props.isModelCached) {
    return wrapper([
      div(
        {},
        input({
          type: 'text',
          value: props.modelUrl || '',
          onRef: (el) =>
            props.onModelUrlRef?.(el as unknown as HTMLInputElement),
        }),
        button(
          {
            onclick: props.onDownload,
          },
          'Download',
        ),
      ),
      // Progress Bar
      div(
        {
          class: `${!props.isDownloading ? 'none' : ''}`,
        },
        span({}, `Downloading: ${Math.round(props.progress)}%`),
        progressBar({ value: props.progress, max: 100 }),
      ),
      // Local Error (Download failed)
      props.errorMessage ? div({}, props.errorMessage) : '',
    ]);
  }

  // 2. Settings Mode (Cached & Open)
  if (props.isModelSettingsOpen) {
    return wrapper([
      div(
        {},
        input({
          type: 'text',
          value: props.modelUrl || '',
          readonly: true,
        }),
        button(
          {
            onclick: props.onDelete,
          },
          'Delete',
        ),
      ),
      // Local Error (Delete failed)
      props.errorMessage ? div({}, props.errorMessage) : '',
    ]);
  }

  // 3. Normal Mode (Cached & Closed)
  const messageEl = span({}, props.message);
  if (props.onMessageRef)
    props.onMessageRef(messageEl as HTMLElement, !!props.errorMessage);

  return wrapper([div({}, messageEl)]);
};
