import { tags } from '@twiqjs/twiq';

const { div, span, progress: progressBar, button } = tags;

export interface StatusDisplayProps {
  progress: number;
  message: string;
  onForceDelete?: () => void;
}

export const StatusDisplay = ({
  progress,
  message,
  onForceDelete,
}: StatusDisplayProps) => {
  return div(
    {
      class: 'message',
    },
    // 1. Download Progress Bar (Show if progress > 0 && < 100)
    progress > 0 && progress < 100
      ? div(
          {},
          span({}, `Downloading: ${Math.round(progress)}%`),
          progressBar({ value: progress, max: 100 }),
        )
      : '',
    // 2. Status Message Text
    div(
      {},
      span({}, message),
      onForceDelete
        ? button(
            {
              class: 'force-delete-btn',
              style: 'margin-left: 10px; color: red; cursor: pointer;',
              onclick: onForceDelete,
            },
            'Force Delete All Caches',
          )
        : '',
    ),
  );
};
