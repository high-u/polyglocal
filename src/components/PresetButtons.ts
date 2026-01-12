import { mount, tags } from '@twiqjs/twiq';
import { getPresets, type ReasoningPreset } from '../services/reasoningPreset';
import { completion, isModelCached } from '../services/wllama';

const { div, button } = tags;

type PresetButtonsProps = {
  getInput: () => string;
  setOutput: (text: string) => void;
};

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
    { class: 'flex gap-s' },
    ...presets.map((p) =>
      button(
        {
          class:
            'grow text-yin-2 bg-yin-7 border-yin-6 pointer round-s p-x-m p-y-xs',
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

  const refresh = async () => {
    const allPresets = getPresets();
    const cachedResults = await Promise.all(
      allPresets.map((p) => isModelCached(p.model)),
    );
    presets = allPresets.filter((_, i) => cachedResults[i]);
    mount(container, renderButtons(presets, props));
  };

  refresh();

  const render = () => container;

  render.refresh = refresh;

  return render;
};
