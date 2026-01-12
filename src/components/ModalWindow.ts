import { mount, tags } from '@twiqjs/twiq';

const { div, button } = tags;

export const createModalWindow = () => {
  const container = div({ class: 'display-contents' });
  let onCloseCallback: (() => void) | undefined;

  const render = () => container;

  render.show = (content: HTMLElement, attrs?: { onClose?: () => void }) => {
    onCloseCallback = attrs?.onClose;
    mount(
      container,
      div(
        { class: 'modal-window p-m bg-yin-9' },
        div(
          {},
          button(
            {
              class: 'text-yin-1 bg-yin-8 border-yin-7 pointer round-s',
              onclick: () => render.close(),
            },
            'Close',
          ),
          content,
        ),
      ),
    );
  };

  render.close = () => {
    mount(container, '');
    if (onCloseCallback) {
      onCloseCallback();
      onCloseCallback = undefined;
    }
  };

  return render;
};
