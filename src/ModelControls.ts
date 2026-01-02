import { tags } from '@twiqjs/twiq';

const { div, label, progress, button, i, span } = tags;

export interface ModelControlsProps {
  downloadProgress: number;
  isModelCached: boolean;
  onDownload: () => void;
  onDeleteCache: () => void;
}

export const ModelControls = ({
  downloadProgress,
  isModelCached,
  onDownload,
  onDeleteCache,
}: ModelControlsProps) => {
  if (downloadProgress > 0 && downloadProgress < 100) {
    return div(
      {},
      label({}, `Downloading Model: ${Math.round(downloadProgress)}%`),
      progress({ value: downloadProgress, max: 100 }),
    );
  }

  if (!isModelCached) {
    return button(
      { class: 'border', onclick: onDownload },
      i({}, 'download'),
      span({}, 'Download Model'),
    );
  } else {
    return button(
      { class: 'error border', onclick: onDeleteCache },
      i({}, 'delete'),
      span({}, 'Delete Cache'),
    );
  }
};
