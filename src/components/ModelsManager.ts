import { tags } from '@twiqjs/twiq';
import { WllamaService } from '../wllama';

const { div, button, ul, li } = tags;

type ModelsManagerProps = {
  modal: {
    show: (content: HTMLElement) => void;
    close: () => void;
  };
};

export const createModelsManager = (props: ModelsManagerProps) => {
  const wllamaService = new WllamaService();

  const render = () => {
    return button(
      {
        class: 'button-primary',
        onclick: async () => {
          const models = await wllamaService.listCachedModels();

          const content = div(
            {},
            div(
              {},
              button({
                class: 'button-primary',
                onclick: props.modal.close
              }, 'Close'),
            ),
            ul(
              {},
              ...models.map((m) => li({ class: 'text-base' }, m)),
            ),
          );

          props.modal.show(content);
        },
      },
      'Models',
    );
  };

  return render;
};
