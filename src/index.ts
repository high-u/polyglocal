import './style.css';
import { mount, tags } from '@twiqjs/twiq';
import { createModalWindow } from './components/ModalWindow';
import { createPresetButtons } from './components/PresetButtons';
import { createPresetManager } from './components/PresetManager';
import { createPresetManagerButton } from './components/PresetManagerButton';
import { createTranslationInput } from './components/TranslationInput';
import { createTranslationOutput } from './components/TranslationOutput';

const { div, main } = tags;

const translationInput = createTranslationInput();
const translationOutput = createTranslationOutput();

const presetButtons = createPresetButtons({
  getInput: () => translationInput.getValue(),
  setOutput: (text) => translationOutput.setValue(text),
});

const presetModal = createModalWindow();
const presetManagerFactory = createPresetManager();

const presetManagerButton = createPresetManagerButton({
  modal: presetModal,
  getPresetContent: presetManagerFactory,
  onModalClose: () => {
    presetButtons.refresh();
  },
});

const App = () => {
  return div(
    {
      class: 'flex-col height-100',
    },
    main(
      {
        id: 'app-container',
        class: 'grow flex-col gap-m height-100 p-m',
      },
      div(
        {
          class: 'flex gap-s',
        },
        div(
          {
            class: 'text-yin-2 grow p-y-xs',
          },
          'POLYGLOCAL',
        ),
        presetManagerButton(),
      ),
      div({ id: 'preset-buttons-root' }, presetButtons()),
      div(
        {
          class: 'flex-col gap-s grow',
        },
        translationInput(),
        translationOutput(),
      ),

      presetModal(),
    ),
  );
};

mount('app', App());
