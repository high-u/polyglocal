import { tags } from '@twiqjs/twiq';

const { button } = tags;

type PresetManagerButtonProps = {
  modal: {
    show: (content: HTMLElement, options?: { onClose?: () => void }) => void;
  };
  getPresetContent: () => HTMLElement;
  onModalClose?: () => void;
};

export const createPresetManagerButton = (props: PresetManagerButtonProps) => {
  const handleClick = () => {
    const content = props.getPresetContent();
    props.modal.show(content, {
      onClose: props.onModalClose,
    });
  };

  const render = () => {
    return button(
      {
        class: 'bg-yin-7 pointer border-yin-7 text-yin-2 round-s p-x-s',
        onclick: handleClick,
      },
      'Presets',
    );
  };

  return render;
};
