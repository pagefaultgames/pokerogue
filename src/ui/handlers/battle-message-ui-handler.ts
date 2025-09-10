import { globalScene } from "#app/global-scene";
import { Button } from "#enums/buttons";
import { getStatKey, PERMANENT_STATS } from "#enums/stat";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import { MessageUiHandler } from "#ui/handlers/message-ui-handler";
import { addBBCodeTextObject, addTextObject, getTextColor } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import i18next from "i18next";
import type BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";

export class BattleMessageUiHandler extends MessageUiHandler {
  private levelUpStatsContainer: Phaser.GameObjects.Container;
  private levelUpStatsIncrContent: Phaser.GameObjects.Text;
  private levelUpStatsValuesContent: BBCodeText;
  private nameBox: Phaser.GameObjects.NineSlice;
  private nameText: Phaser.GameObjects.Text;

  public bg: Phaser.GameObjects.Sprite;
  public commandWindow: Phaser.GameObjects.NineSlice;
  public movesWindowContainer: Phaser.GameObjects.Container;
  public nameBoxContainer: Phaser.GameObjects.Container;

  public readonly wordWrapWidth: number = 1780;

  constructor() {
    super(UiMode.MESSAGE);
  }

  setup(): void {
    const ui = this.getUi();

    this.textTimer = null;
    this.textCallbackTimer = null;

    this.bg = globalScene.add.sprite(0, 0, "bg", globalScene.windowType);
    this.bg.setName("sprite-battle-msg-bg");
    this.bg.setOrigin(0, 1);
    ui.add(this.bg);

    this.commandWindow = addWindow(202, 0, 118, 48);
    this.commandWindow.setName("window-command");
    this.commandWindow.setOrigin(0, 1);
    this.commandWindow.setVisible(false);
    ui.add(this.commandWindow);

    this.movesWindowContainer = globalScene.add.container(0, 0);
    this.movesWindowContainer.setName("moves-bg");
    this.movesWindowContainer.setVisible(false);

    const movesWindow = addWindow(0, 0, 243, 48);
    movesWindow.setName("moves-window");
    movesWindow.setOrigin(0, 1);

    const moveDetailsWindow = addWindow(240, 0, 80, 48, false, false, -1, 132);
    moveDetailsWindow.setName("move-details-window");
    moveDetailsWindow.setOrigin(0, 1);

    this.movesWindowContainer.add([movesWindow, moveDetailsWindow]);
    ui.add(this.movesWindowContainer);

    const messageContainer = globalScene.add.container(12, -39);
    ui.add(messageContainer);

    const message = addTextObject(0, 0, "", TextStyle.MESSAGE, {
      maxLines: 2,
      wordWrap: {
        width: this.wordWrapWidth,
      },
    });
    messageContainer.add(message);

    this.message = message;

    this.nameBoxContainer = globalScene.add.container(0, -16);
    this.nameBoxContainer.setVisible(false);

    this.nameBox = globalScene.add.nineslice(0, 0, "namebox", globalScene.windowType, 72, 16, 8, 8, 5, 5);
    this.nameBox.setOrigin(0, 0);

    this.nameText = addTextObject(8, 0, "Rival", TextStyle.MESSAGE, {
      maxLines: 1,
    });

    this.nameBoxContainer.add(this.nameBox);
    this.nameBoxContainer.add(this.nameText);
    messageContainer.add(this.nameBoxContainer);

    this.initPromptSprite(messageContainer);

    const levelUpStatsContainer = globalScene.add.container(0, 0);
    levelUpStatsContainer.setVisible(false);
    ui.add(levelUpStatsContainer);

    this.levelUpStatsContainer = levelUpStatsContainer;

    const levelUpStatsLabelsContent = addTextObject(globalScene.scaledCanvas.width - 73, -94, "", TextStyle.WINDOW, {
      maxLines: 6,
    });
    let levelUpStatsLabelText = "";

    for (const s of PERMANENT_STATS) {
      levelUpStatsLabelText += `${i18next.t(getStatKey(s))}\n`;
    }
    levelUpStatsLabelsContent.text = levelUpStatsLabelText;
    levelUpStatsLabelsContent.x -= levelUpStatsLabelsContent.displayWidth;

    const levelUpStatsBg = addWindow(
      globalScene.scaledCanvas.width,
      -100,
      80 + levelUpStatsLabelsContent.displayWidth,
      100,
    );
    levelUpStatsBg.setOrigin(1, 0);
    levelUpStatsContainer.add(levelUpStatsBg);

    levelUpStatsContainer.add(levelUpStatsLabelsContent);

    const levelUpStatsIncrContent = addTextObject(
      globalScene.scaledCanvas.width - 50,
      -94,
      "+\n+\n+\n+\n+\n+",
      TextStyle.WINDOW,
      { maxLines: 6 },
    );
    levelUpStatsContainer.add(levelUpStatsIncrContent);

    this.levelUpStatsIncrContent = levelUpStatsIncrContent;

    const levelUpStatsValuesContent = addBBCodeTextObject(
      globalScene.scaledCanvas.width - 7,
      -94,
      "",
      TextStyle.WINDOW,
      { maxLines: 6, lineSpacing: 5 },
    );
    levelUpStatsValuesContent.setOrigin(1, 0);
    levelUpStatsValuesContent.setAlign("right");
    levelUpStatsContainer.add(levelUpStatsValuesContent);

    this.levelUpStatsValuesContent = levelUpStatsValuesContent;
  }

  show(args: any[]): boolean {
    super.show(args);

    this.commandWindow.setVisible(false);
    this.movesWindowContainer.setVisible(false);
    this.message.setWordWrapWidth(this.wordWrapWidth);

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();
    if (this.awaitingActionInput && (button === Button.CANCEL || button === Button.ACTION) && this.onActionInput) {
      ui.playSelect();
      const originalOnActionInput = this.onActionInput;
      this.onActionInput = null;
      originalOnActionInput();
      return true;
    }

    return false;
  }

  clear() {
    super.clear();
  }

  showText(
    text: string,
    delay?: number | null,
    callback?: Function | null,
    callbackDelay?: number | null,
    prompt?: boolean | null,
    promptDelay?: number | null,
  ) {
    this.hideNameText();
    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  showDialogue(
    text: string,
    name?: string,
    delay?: number | null,
    callback?: Function,
    callbackDelay?: number,
    prompt?: boolean,
    promptDelay?: number,
  ) {
    if (name) {
      this.showNameText(name);
    }
    super.showDialogue(text, name, delay, callback, callbackDelay, prompt, promptDelay);
  }

  promptLevelUpStats(partyMemberIndex: number, prevStats: number[], showTotals: boolean): Promise<void> {
    return new Promise(resolve => {
      if (!globalScene.showLevelUpStats) {
        return resolve();
      }
      const newStats = globalScene.getPlayerParty()[partyMemberIndex].stats;
      let levelUpStatsValuesText = "";
      for (const s of PERMANENT_STATS) {
        levelUpStatsValuesText += `${showTotals ? newStats[s] : newStats[s] - prevStats[s]}\n`;
      }
      this.levelUpStatsValuesContent.text = levelUpStatsValuesText;
      this.levelUpStatsIncrContent.setVisible(!showTotals);
      this.levelUpStatsContainer.setVisible(true);
      this.awaitingActionInput = true;
      this.onActionInput = () => {
        if (!showTotals) {
          return this.promptLevelUpStats(partyMemberIndex, [], true).then(() => resolve());
        }
        this.levelUpStatsContainer.setVisible(false);
        resolve();
      };
    });
  }

  promptIvs(pokemonId: number, ivs: number[]): Promise<void> {
    return new Promise(resolve => {
      globalScene.executeWithSeedOffset(() => {
        let levelUpStatsValuesText = "";
        for (const s of PERMANENT_STATS) {
          levelUpStatsValuesText += `${this.getIvDescriptor(ivs[s], s, pokemonId)}\n`;
        }
        this.levelUpStatsValuesContent.text = levelUpStatsValuesText;
        this.levelUpStatsIncrContent.setVisible(false);
        this.levelUpStatsContainer.setVisible(true);
        this.awaitingActionInput = true;
        this.onActionInput = () => {
          this.levelUpStatsContainer.setVisible(false);
          resolve();
        };
      }, pokemonId);
    });
  }

  getIvDescriptor(value: number, typeIv: number, pokemonId: number): string {
    const starterSpecies = globalScene.getPokemonById(pokemonId)!.species.getRootSpeciesId(); // we are using getRootSpeciesId() here because we want to check against the baby form, not the mid form if it exists
    const starterIvs: number[] = globalScene.gameData.dexData[starterSpecies].ivs;

    // Function to wrap text in color based on comparison
    const coloredText = (text: string, isBetter: boolean, ivValue) => {
      let textStyle: TextStyle;
      if (isBetter) {
        if (ivValue === 31) {
          textStyle = TextStyle.PERFECT_IV;
        } else {
          textStyle = TextStyle.SUMMARY_GREEN;
        }
      } else {
        textStyle = TextStyle.WINDOW;
      }
      const color = getTextColor(textStyle, false);
      return `[color=${color}][shadow=${getTextColor(textStyle, true)}]${text}[/shadow][/color]`;
    };

    if (value > 30) {
      return coloredText(i18next.t("battleMessageUiHandler:ivBest"), value > starterIvs[typeIv], value);
    }
    if (value === 30) {
      return coloredText(i18next.t("battleMessageUiHandler:ivFantastic"), value > starterIvs[typeIv], value);
    }
    if (value > 20) {
      return coloredText(i18next.t("battleMessageUiHandler:ivVeryGood"), value > starterIvs[typeIv], value);
    }
    if (value > 10) {
      return coloredText(i18next.t("battleMessageUiHandler:ivPrettyGood"), value > starterIvs[typeIv], value);
    }
    if (value > 0) {
      return coloredText(i18next.t("battleMessageUiHandler:ivDecent"), value > starterIvs[typeIv], value);
    }

    return coloredText(i18next.t("battleMessageUiHandler:ivNoGood"), value > starterIvs[typeIv], value);
  }

  showNameText(name: string): void {
    this.nameBoxContainer.setVisible(true);
    this.nameText.setText(name);
    this.nameBox.width = this.nameText.displayWidth + 16;
  }

  hideNameText(): void {
    this.nameBoxContainer.setVisible(false);
  }
}
