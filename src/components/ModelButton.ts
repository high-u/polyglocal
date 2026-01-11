import { tags } from '@twiqjs/twiq';

const { span, button } = tags;

type ModelButtonDeps = {
  toggleSettings: () => void;
};

export const createModelButton = (deps: ModelButtonDeps) => {
  const el = button(
    {
      class: 'flex center gap-s button-primary p-x-m p-y-s',
      onclick: deps.toggleSettings,
    },
    span({}, 'Model'),
  ) as HTMLButtonElement;

  const render = () => {
    return el;
  };

  render.setOpen = (_isOpen: boolean) => {
    // Current design doesn't visually change on open, but we could add active class here if needed.
    // e.g. if(isOpen) el.classList.add('active'); else el.classList.remove('active');
  };

  render.setDisabled = (disabled: boolean) => {
    el.disabled = disabled;
  };

  return render;
};
