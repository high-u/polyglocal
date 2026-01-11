import { mount, tags } from '@twiqjs/twiq';

const { div } = tags;

export const createModalWindow = () => {
  const container = div({ class: 'none' });
  let onCloseCallback: (() => void) | undefined;

  const closeButton = tags.button(
    {
      class: 'button-primary',
      style: 'position: absolute; top: 16px; right: 16px;', // Generic positioning
      onclick: () => render.close(),
    },
    'Close',
  );

  const render = () => {
    return container;
  };

  render.show = (content: HTMLElement, attrs?: { onClose?: () => void }) => {
    onCloseCallback = attrs?.onClose;
    container.className = 'modal-window p-l'; // Added padding for better spacing
    // Mount content and the close button.
    // We place the close button inside the modal window container.
    // The content is mounted along with the button.
    // Note: If content is replaced, we need to ensure close button stays or is re-mounted.
    // Twiq mount replaces innerHTML. So we construct a wrapper.
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
