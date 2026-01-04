import { tags } from '@twiqjs/twiq';

const { button, span } = tags;

export interface ModelButtonProps {
  onClick: () => void;
  isOpen?: boolean;
  disabled?: boolean;
}

export const ModelButton = (props: ModelButtonProps) => {
  return button(
    {
      class: 'flex center gap-s button-primary p-x-m p-y-s',
      onclick: props.onClick,
      disabled: props.disabled ? true : undefined,
    },
    span({}, 'Model'),
  );
};
