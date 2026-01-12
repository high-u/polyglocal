import { mount, tags } from '@twiqjs/twiq';
import { getPresets, type ReasoningPreset } from '../services/reasoningPreset';
import { completion } from '../services/wllama';

const { div, button } = tags;

type PresetButtonsProps = {
  getInput: () => string;
  setOutput: (text: string) => void;
};

// Pure Helper
const renderButtons = (
  presets: ReasoningPreset[],
  props: PresetButtonsProps,
) => {
  const handleClick = async (preset: ReasoningPreset) => {
    const input = props.getInput();
    if (!input) return;

    props.setOutput('');

    try {
      await completion(
        preset.prompt,
        input,
        preset.model,
        preset.contextLength,
        preset.config || '',
        (text: string) => props.setOutput(text),
      );
    } catch (e) {
      console.error(e);
      props.setOutput(`Error: ${String(e)}`);
    }
  };

  return div(
    { class: 'preset-buttons' },
    ...presets.map((p) =>
      button(
        {
          class: 'button-primary',
          onclick: () => handleClick(p),
        },
        p.name,
      ),
    ),
  );
};

export const createPresetButtons = (props: PresetButtonsProps) => {
  const container = div({});
  let presets: ReasoningPreset[] = [];

  const refresh = () => {
    presets = getPresets();
    mount(container, renderButtons(presets, props));
  };

  // Initial render
  refresh();

  const render = () => container;

  render.refresh = refresh;

  return render;
};
