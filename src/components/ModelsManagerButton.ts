import { tags } from '@twiqjs/twiq';

const { button } = tags;

type ModelsManagerButtonProps = {
  modal: {
    show: (content: HTMLElement, options?: { onClose?: () => void }) => void;
  };
  getContent: () => HTMLElement;
  onModalClose?: () => void;
};

export const createModelsManagerButton = (props: ModelsManagerButtonProps) => {
  const handleClick = () => {
    const content = props.getContent();
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
      'Models',
    );
  };

  return render;
};
