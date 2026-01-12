import { mount, tags } from '@twiqjs/twiq';

const { div } = tags;

export const createModalWindow = () => {
  const container = div({ class: 'none' });
  let onCloseCallback: (() => void) | undefined;

  const closeButton = tags.button(
    {
      class: 'button-primary',
      onclick: () => render.close(),
    },
    'Close',
  );

  const render = () => {
    return container;
  };

  render.show = (content: HTMLElement, attrs?: { onClose?: () => void }) => {
    onCloseCallback = attrs?.onClose;
    container.className = 'modal-window p-l';

    const wrapper = div({}, closeButton, content);
    mount(container, wrapper);
  };

  render.close = () => {
    container.className = 'none';
    mount(container, '');
    if (onCloseCallback) {
      onCloseCallback();
      onCloseCallback = undefined;
    }
  };

  return render;
};
