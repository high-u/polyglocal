import { mount, tags } from '@twiqjs/twiq';

const { div } = tags;

export const createModalWindow = () => {
  const container = div({ class: 'none' });

  const render = () => {
    return container;
  };

  render.show = (content: HTMLElement) => {
    container.className = 'modal-window';
    mount(container, content);
  };

  render.close = () => {
    container.className = 'none';
    mount(container, '');
  };

  return render;
};
