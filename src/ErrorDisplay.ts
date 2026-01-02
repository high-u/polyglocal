import { tags } from '@twiqjs/twiq';

const { div } = tags;

export const ErrorDisplay = ({
  message,
  warning,
}: {
  message: string | null;
  warning?: string | null;
}) => {
  if (message) return div({ class: 'snackbar error active' }, message);
  if (warning) return div({ class: 'snackbar warning active' }, warning);
  return div();
};
