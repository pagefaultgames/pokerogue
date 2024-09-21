import { FormModalUiHandler } from "./form-modal-ui-handler";
import { ModalConfig } from "./modal-ui-handler";
import i18next from "i18next";
import { PlayerPokemon } from "#app/field/pokemon";
import { Mode } from "./ui";
import { OptionSelectItem } from "./abstact-option-select-ui-handler";
import { addWindow } from "./ui-theme";
import { addTextObject, getTextStyleOptions, TextStyle } from "./text";
import InputText from "phaser3-rex-plugins/plugins/inputtext";
import BattleScene from "#app/battle-scene";
import { OptionSelectConfigAC } from "./autocomplete-ui-handler";
import emojisAvailable from "#app/data/emoji";
import { emojiRegex } from "#app/data/emoji";

/**
 * Split string with emojis, since emojis length is longer and native split doesn't work.
 * @param str
 * @returns string[]
 */
function textArrayWithEmojis(str: string): string[] {
  const result: string[] = [];
  let match;
  let lastIndex = 0;

  while ((match = emojiRegex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      result.push(...str.slice(lastIndex, match.index).split(""));
    }
    result.push(match[0]);
    lastIndex = emojiRegex.lastIndex;
  }

  if (lastIndex < str.length) {
    result.push(...str.slice(lastIndex).split(""));
  }

  return result;
}

export default class RenameFormUiHandler extends FormModalUiHandler {

  constructor (scene, mode: Mode | null = Mode.RENAME_POKEMON) {
    super(scene, mode);
  }

  getModalTitle(config?: ModalConfig): string {
    return i18next.t("menu:renamePokemon");
  }

  getFields(config?: ModalConfig): string[] {
    return [ i18next.t("menu:nickname") ];
  }

  getWidth(config?: ModalConfig): number {
    return 160;
  }

  getMargin(config?: ModalConfig): [number, number, number, number] {
    return [ 0, 0, 48, 0 ];
  }

  getButtonLabels(config?: ModalConfig): string[] {
    return [ i18next.t("menu:rename"), i18next.t("menu:cancel") ];
  }

  getReadableErrorMessage(error: string): string {
    const colonIndex = error?.indexOf(":");
    if (colonIndex > 0) {
      error = error.slice(0, colonIndex);
    }

    return super.getReadableErrorMessage(error);
  }

  setup(): void {
    super.setup();
    const helpEmojiListContainer = this.scene.add.container(0, this.getHeight());
    const helpEmojiListBg = addWindow(this.scene, 0, 0, this.getWidth(), 52);
    helpEmojiListContainer.add(helpEmojiListBg);
    const scale = getTextStyleOptions(TextStyle.WINDOW, (this.scene as BattleScene).uiTheme).scale ?? 0.1666666667;

    const helpEmojiListText = addTextObject(this.scene, 8, 4, i18next.t("menu:renameHelpEmoji"), TextStyle.TOOLTIP_CONTENT, {
      fontSize: "80px",
    });
    helpEmojiListText.setWordWrapWidth(890);
    const height = ((Math.min((helpEmojiListText.getWrappedText(helpEmojiListText.text)).length, 99)) * (80 + helpEmojiListText.y) * scale) + helpEmojiListText.y;
    helpEmojiListBg.setSize(helpEmojiListBg.width, height);

    helpEmojiListContainer.add(helpEmojiListText);

    this.modalContainer.add(helpEmojiListContainer);
  }

  show(args: any[]): boolean {
    if (super.show(args)) {
      const ui = this.getUi();
      const input = this.inputs[0];

      // rename config
      const config = args[0] as ModalConfig;
      if (args[1] && typeof (args[1] as PlayerPokemon).getNameToRender === "function") {
        this.inputs[0].text = (args[1] as PlayerPokemon).getNameToRender();
      } else {
        this.inputs[0].text = args[1];
      }
      this.submitAction = (_) => {
        this.sanitizeInputs();
        const sanitizedName = btoa(unescape(encodeURIComponent(this.inputs[0].text)));
        config.buttonActions[0](sanitizedName);
        return true;
      };

      // emoji list config
      const maxEmojis = 6;

      const modalOptions: OptionSelectConfigAC = {
        options: emojisAvailable.map((emoji, index): OptionSelectItem => {
          return {
            label: `${emoji} /${index + 1}`,
            handler: ()=> {
              // Retrieve the exact command, as it can be either "/", or "/n"
              const command = textArrayWithEmojis(input.text).filter((_, i) => i >= (textArrayWithEmojis(input.text).filter((_, i) => i < input.cursorPosition).lastIndexOf("/")) && i < input.cursorPosition).join("");

              const text = input.text;
              const textBeforeCursor = text.substring(0, input.cursorPosition);
              const textAfterCursor = text.substring(input.cursorPosition);

              const exactlyCommand = textBeforeCursor.lastIndexOf(command);
              if (exactlyCommand !== -1) {
                const textReplace = textBeforeCursor.substring(0, exactlyCommand) + emoji + textAfterCursor;
                input.setText(textReplace);
                input.setCursorPosition(exactlyCommand + emoji.length);
                return true;
              }
              return false;
            },
          };
        }),
        modalContainer: this.modalContainer,
        inputContainer: this.inputContainers[0],
        maxOptions: 5
      };

      input.on("textchange", (inputObject:InputText, evt:InputEvent) => {
        const text = input.text;
        const arrayText = textArrayWithEmojis(text);

        // Remove disallowed emojis.
        if (arrayText.filter((char) => {
          // const isEmoji = !char.match(/[\u0000-\u00ff]/); // Emojis, special characters and kaomojis, technically
          const isEmoji = char.match(emojiRegex); // Only Emojis
          const isAllowedEmoji = emojisAvailable.includes(char);
          return isEmoji && !isAllowedEmoji;
        }).length) {
          const regex = emojiRegex;
          let totalLength: number = 0;
          const newText = text.replace(regex, (match) => {
            if (emojisAvailable.includes(match)) {
              return match;
            }
            totalLength += match.length;
            return  "";
          });

          const cursorPosition = input.cursorPosition;
          input.setText(newText);
          input.setCursorPosition(cursorPosition - totalLength);

        }

        // If the number of available emojis exceeds the maximum allowed number of emojis..
        //.. Delete any attempt to insert another one.
        while (textArrayWithEmojis(input.text).filter((char) => emojisAvailable.includes(char)).length > maxEmojis) {
          const splitWithEmojis = textArrayWithEmojis(input.text);

          // Retrieve only the emojis that are trying to be inserted
          const emojis = splitWithEmojis.filter((char, i, arr) => {
            if (emojisAvailable.includes(char)) {
              // The length of the emojis is usually greater than one
              // And many can also be inserted by pasting
              let totalLength = 0;
              for (let j = 0; j <= i; j++) {
                totalLength += arr[j].length;
              }
              return totalLength < input.cursorPosition + 1;
            }
            return false;
          });
          const lastEmoji = emojis[emojis.length - 1];

          // Retrieve only the position before the cursorInput of the last available emoji that you want to insert
          const lastEmojiIndex = splitWithEmojis.filter((char, i, arr) => {
            let totalLength = 0;
            for (let j = 0; j <= i; j++) {
              totalLength += arr[j].length;
            }
            return totalLength < input.cursorPosition + 1;
          }).lastIndexOf(lastEmoji);

          if (lastEmojiIndex !== -1) {
            const textBeforeCursor = splitWithEmojis.slice(0, lastEmojiIndex).join("");
            const textAfterCursor = splitWithEmojis.slice(lastEmojiIndex + 1).join("");
            const newText = textBeforeCursor + textAfterCursor;

            if (newText !== text) {
              const previousCursor = input.cursorPosition;
              input.setText(newText);
              input.setCursorPosition(previousCursor - lastEmoji.length);
            }
          }
        }

        // If the number of available emojis has been reached, do not display the list of emojis
        if (arrayText.filter((char) => emojisAvailable.some((em) => em === char)).length < maxEmojis) {

          // Retrieve the exact command, as it can be either "/", or "/n"
          const command = arrayText.filter((_, i) => i >= (arrayText.filter((_, i) => i < input.cursorPosition).lastIndexOf("/")) && i < input.cursorPosition).join("");

          if (evt.data === "/") {
            ui.setOverlayMode(Mode.AUTO_COMPLETE, modalOptions);
          } else if (command.includes("/") && modalOptions.options.some((opt) => opt.label.includes(command))) {
            const filterOptions = {
              ...modalOptions,
              options: modalOptions.options.filter((opt) => opt.label.includes(command))
            };

            this.scene.ui.setOverlayMode(Mode.AUTO_COMPLETE, filterOptions);
          }
        }
      });

      return true;
    }
    return false;
  }
}
