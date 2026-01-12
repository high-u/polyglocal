import { tags } from '@twiqjs/twiq';

const { button } = tags;

type ReasoningManagerButtonProps = {
  modal: {
    show: (content: HTMLElement, options?: { onClose?: () => void }) => void;
  };
  getReasoningContent: () => HTMLElement;
  onModalClose?: () => void;
};

export const createReasoningManagerButton = (
  props: ReasoningManagerButtonProps,
) => {
  const handleClick = () => {
    const content = props.getReasoningContent();
    props.modal.show(content, {
      onClose: props.onModalClose,
    });
  };

  const render = () => {
    return button(
      {
        class: 'button-primary',
        onclick: handleClick,
      },
      'Reasoning',
    );
  };

  return render;
};
