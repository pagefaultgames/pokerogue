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
import AutoCompleteUiHandler, { OptionSelectConfigAC } from "./autocomplete-ui-handler";
import emojisAvailable from "#app/data/emoji";
import { emojiRegex } from "#app/data/emoji";

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
  protected autocomplete: AutoCompleteUiHandler;

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

    const helpEmojiListText = addTextObject(this.scene, 8, 8, i18next.t("menu:renameHelpEmoji"), TextStyle.TOOLTIP_CONTENT, {
      fontSize: "80px",
    });
    helpEmojiListText.setWordWrapWidth(this.modalContainer.getBounds().width * 0.95);
    const height = ((Math.min((helpEmojiListText.getWrappedText(helpEmojiListText.text) || []).length, 99)) * 96 * scale) + helpEmojiListText.y;
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
        if (ui.getMode() === Mode.RENAME_POKEMON) {
          this.sanitizeInputs();
          const sanitizedName = btoa(unescape(encodeURIComponent(this.inputs[0].text)));
          config.buttonActions[0](sanitizedName);
          return true;
        }
      };
      const originalCancel = config.buttonActions[1];
      config.buttonActions[1] = ()=>{
        if (ui.getMode() === Mode.RENAME_POKEMON) {
          originalCancel();
        }
      };

      // emoji list config
      const maxEmojis = 6;

      const modalOptions: OptionSelectConfigAC = {
        options: emojisAvailable.map((emoji, index): OptionSelectItem => {
          return {
            label: `${emoji} /${index + 1}`,
            handler: ()=> {
              // Retrieve the exact command, as it can be either "/", or "/n"
              const command = input.text.split("").filter((_, i) => i >= (input.text.split("").filter((_, i) => i < input.cursorPosition).lastIndexOf("/")) && i < input.cursorPosition).join("");

              const texto = input.text;
              const textBeforeCursor = texto.substring(0, input.cursorPosition);
              const textAfterCursor = texto.substring(input.cursorPosition);

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
        // If deleting and currently positioned at "/", display the list of emojis
        if (
          !evt.data &&
          input.text.split("").filter((char) => emojisAvailable.some((em) => em === char)).length < maxEmojis &&
          input.text.split("").some((char, i) => char === "/" && i + 1 === input.cursorPosition)
        ) {
          ui.setOverlayMode(Mode.AUTO_COMPLETE, modalOptions);
        }

        // Remove disallowed emojis.
        if (textArrayWithEmojis(input.text).filter((char) => {
          // const isEmoji = !char.match(/[\u0000-\u00ff]/); // Emojis, special characters and kaomojis
          const isEmoji = char.match(emojiRegex); // Only Emojis
          const isAllowedEmoji = emojisAvailable.includes(char);
          return isEmoji && !isAllowedEmoji;
        }).length) {
          const regex = emojiRegex;
          let totalLength: number = 0;
          const newText = input.text.replace(regex, (match) => {
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
          const charactersWithEmojis = textArrayWithEmojis(input.text);
          const emojis = charactersWithEmojis.filter((char, i, arr) => {
            if (emojisAvailable.includes(char)) {
              let totalLength = 0;
              for (let j = 0; j <= i; j++) {
                totalLength += arr[j].length;
              }
              return totalLength < input.cursorPosition + 1;
            }
            return false;
          });
          const cursorPosition = input.cursorPosition;
          const lastEmoji = emojis[emojis.length - 1];
          const lastEmojiIndex = charactersWithEmojis.filter((char, i, arr) => {
            let totalLength = 0;
            for (let j = 0; j <= i; j++) {
              totalLength += arr[j].length;
            }
            return totalLength < input.cursorPosition + 1;
          }).lastIndexOf(lastEmoji);

          if (lastEmojiIndex !== -1) {
            const textBeforeCursor = charactersWithEmojis.slice(0, lastEmojiIndex).join("");
            const textAfterCursor = charactersWithEmojis.slice(lastEmojiIndex + 1).join("");
            const newText = textBeforeCursor + textAfterCursor;

            if (newText !== input.text) {
              input.setText(newText);
              input.setCursorPosition(cursorPosition - lastEmoji.length);
            }
          }
        }

        // If the number of available emojis has been reached, do not display the list of emojis
        if (evt.data && input.text.split("").filter((char) => emojisAvailable.some((em) => em === char)).length < maxEmojis) {

          // Retrieve the exact command, as it can be either "/", or "/n"
          const command = input.text.split("").filter((_, i, arr) => i >= (input.text.split("").filter((_, i) => i < input.cursorPosition).lastIndexOf("/")) && i < input.cursorPosition).join("");

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
