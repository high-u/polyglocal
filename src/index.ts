import './style.css';
import { mount, tags } from '@twiqjs/twiq';
import { createModalWindow } from './components/ModalWindow';
import { createPresetButtons } from './components/PresetButtons';
import { createReasoningManager } from './components/ReasoningManager';
import { createReasoningManagerButton } from './components/ReasoningManagerButton';
import { createTranslationInput } from './components/TranslationInput';
import { createTranslationOutput } from './components/TranslationOutput';

const { div, main } = tags;

const translationInput = createTranslationInput();
const translationOutput = createTranslationOutput();

const presetButtons = createPresetButtons({
  getInput: () => translationInput.getValue(),
  setOutput: (text) => translationOutput.setValue(text),
});

const reasoningModal = createModalWindow();
const reasoningManagerFactory = createReasoningManager();

const reasoningManagerButton = createReasoningManagerButton({
  modal: reasoningModal,
  getReasoningContent: reasoningManagerFactory,
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
        class: 'grow flex-col gap-s height-100 p-m',
      },
      div(
        {
          class: 'flex gap-s',
        },
        div(
          {
            class: 'grow text-base p-y-s',
          },
          'POLYGLOCAL',
        ),
        reasoningManagerButton(),
      ),
      div({ id: 'preset-buttons-root' }, presetButtons()),
      div(
        {
          class: 'flex gap-s grow',
        },
        translationInput(),
        translationOutput(),
      ),

      reasoningModal(),
    ),
  );
};

mount('app', App());
