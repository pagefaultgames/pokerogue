import BattleScene from "../battle-scene";
import { addBBCodeTextObject, addTextObject, getTextColor, TextStyle } from "./text";
import { Mode } from "./ui";
import * as Utils from "../utils";
import MessageUiHandler from "./message-ui-handler";
import { getStatName, Stat } from "../data/pokemon-stat";
import { addWindow } from "./ui-theme";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import {Button} from "#enums/buttons";
import i18next from "i18next";

export default class BattleMessageUiHandler extends MessageUiHandler {
  private levelUpStatsContainer: Phaser.GameObjects.Container;
  private levelUpStatsIncrContent: Phaser.GameObjects.Text;
  private levelUpStatsValuesContent: BBCodeText;
  private nameBox: Phaser.GameObjects.NineSlice;
  private nameText: Phaser.GameObjects.Text;

  public bg: Phaser.GameObjects.Image;
  public commandWindow: Phaser.GameObjects.NineSlice;
  public movesWindowContainer: Phaser.GameObjects.Container;
  public nameBoxContainer: Phaser.GameObjects.Container;

  constructor(scene: BattleScene) {
    super(scene, Mode.MESSAGE);
  }

  setup(): void {
    const ui = this.getUi();

    this.textTimer = null;
    this.textCallbackTimer = null;

    const bg = this.scene.add.sprite(0, 0, "bg", this.scene.windowType);
    bg.setOrigin(0, 1);
    ui.add(bg);

    this.bg = bg;

    this.commandWindow = addWindow(this.scene, 201, -1, 118, 46);
    this.commandWindow.setOrigin(0, 1);
    this.commandWindow.setVisible(false);
    ui.add(this.commandWindow);

    this.movesWindowContainer = this.scene.add.container(1, -1);
    this.movesWindowContainer.setVisible(false);

    const movesWindow = addWindow(this.scene, 0, 0, 243, 46);
    movesWindow.setOrigin(0, 1);
    this.movesWindowContainer.add(movesWindow);

    const moveDetailsWindow = addWindow(this.scene, 238, 0, 80, 46, false, true, 2, 133);
    moveDetailsWindow.setOrigin(0, 1);
    this.movesWindowContainer.add(moveDetailsWindow);

    // TODO: Maybe remove this asset definitively if it's no longer needed?
    // const commandFightLabels = this.scene.add.image(246, -10, 'command_fight_labels');
    // commandFightLabels.setOrigin(0, 1);
    // this.movesWindowContainer.add(commandFightLabels);

    ui.add(this.movesWindowContainer);

    const messageContainer = this.scene.add.container(12, -39);
    ui.add(messageContainer);

    const message = addTextObject(this.scene, 0, 0, "", TextStyle.MESSAGE, {
      maxLines: 2,
      wordWrap: {
        width: 1780
      }
    });
    messageContainer.add(message);

    this.message = message;

    this.nameBoxContainer = this.scene.add.container(0, -16);
    this.nameBoxContainer.setVisible(false);

    this.nameBox = this.scene.add.nineslice(0, 0, "namebox", this.scene.windowType, 72, 16, 8, 8, 5, 5);
    this.nameBox.setOrigin(0, 0);

    this.nameText = addTextObject(this.scene, 8, 0, "Rival", TextStyle.MESSAGE, { maxLines: 1 });

    this.nameBoxContainer.add(this.nameBox);
    this.nameBoxContainer.add(this.nameText);
    messageContainer.add(this.nameBoxContainer);

    const prompt = this.scene.add.sprite(0, 0, "prompt");
    prompt.setVisible(false);
    prompt.setOrigin(0, 0);
    messageContainer.add(prompt);

    this.prompt = prompt;

    const levelUpStatsContainer = this.scene.add.container(0, 0);
    levelUpStatsContainer.setVisible(false);
    ui.add(levelUpStatsContainer);

    this.levelUpStatsContainer = levelUpStatsContainer;

    const levelUpStatsLabelsContent = addTextObject(this.scene, (this.scene.game.canvas.width / 6) - 73, -94, "", TextStyle.WINDOW, { maxLines: 6 });
    let levelUpStatsLabelText = "";

    const stats = Utils.getEnumValues(Stat);
    for (const s of stats) {
      levelUpStatsLabelText += `${getStatName(s)}\n`;
    }
    levelUpStatsLabelsContent.text = levelUpStatsLabelText;
    levelUpStatsLabelsContent.x -= levelUpStatsLabelsContent.displayWidth;

    const levelUpStatsBg = addWindow(this.scene, (this.scene.game.canvas.width / 6), -100, 80 + levelUpStatsLabelsContent.displayWidth, 100);
    levelUpStatsBg.setOrigin(1, 0);
    levelUpStatsContainer.add(levelUpStatsBg);

    levelUpStatsContainer.add(levelUpStatsLabelsContent);

    const levelUpStatsIncrContent = addTextObject(this.scene, (this.scene.game.canvas.width / 6) - 50, -94, "+\n+\n+\n+\n+\n+", TextStyle.WINDOW, { maxLines: 6 });
    levelUpStatsContainer.add(levelUpStatsIncrContent);

    this.levelUpStatsIncrContent = levelUpStatsIncrContent;

    const levelUpStatsValuesContent = addBBCodeTextObject(this.scene, (this.scene.game.canvas.width / 6) - 7, -94, "", TextStyle.WINDOW, { maxLines: 6 , lineSpacing: 5});
    levelUpStatsValuesContent.setOrigin(1, 0);
    levelUpStatsValuesContent.setAlign("right");
    levelUpStatsContainer.add(levelUpStatsValuesContent);

    this.levelUpStatsValuesContent = levelUpStatsValuesContent;
  }

  show(args: any[]): boolean {
    super.show(args);

    this.commandWindow.setVisible(false);
    this.movesWindowContainer.setVisible(false);
    this.message.setWordWrapWidth(1780);

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();
    if (this.awaitingActionInput) {
      if (button === Button.CANCEL || button === Button.ACTION) {
        if (this.onActionInput) {
          ui.playSelect();
          const originalOnActionInput = this.onActionInput;
          this.onActionInput = null;
          originalOnActionInput();
          return true;
        }
      }
    }
  }

  clear() {
    super.clear();
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    this.hideNameText();
    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  showDialogue(text: string, name: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    this.showNameText(name);
    super.showDialogue(text, name, delay, callback, callbackDelay, prompt, promptDelay);
  }

  promptLevelUpStats(partyMemberIndex: integer, prevStats: integer[], showTotals: boolean): Promise<void> {
    return new Promise(resolve => {
      if (!this.scene.showLevelUpStats) {
        return resolve();
      }
      const newStats = (this.scene as BattleScene).getParty()[partyMemberIndex].stats;
      let levelUpStatsValuesText = "";
      const stats = Utils.getEnumValues(Stat);
      for (const s of stats) {
        levelUpStatsValuesText += `${showTotals ? newStats[s] : newStats[s] - prevStats[s]}\n`;
      }
      this.levelUpStatsValuesContent.text = levelUpStatsValuesText;
      this.levelUpStatsIncrContent.setVisible(!showTotals);
      this.levelUpStatsContainer.setVisible(true);
      this.awaitingActionInput = true;
      this.onActionInput = () => {
        if (!showTotals) {
          return this.promptLevelUpStats(partyMemberIndex, null, true).then(() => resolve());
        } else {
          this.levelUpStatsContainer.setVisible(false);
          resolve();
        }
      };
    });
  }

  promptIvs(pokemonId: integer, ivs: integer[], shownIvsCount: integer): Promise<void> {
    return new Promise(resolve => {
      this.scene.executeWithSeedOffset(() => {
        let levelUpStatsValuesText = "";
        const stats = Utils.getEnumValues(Stat);
        let shownStats: Stat[] = [];
        if (shownIvsCount < 6) {
          const statsPool = stats.slice(0);
          for (let i = 0; i < shownIvsCount; i++) {
            let shownStat: Stat;
            let highestIv = -1;
            statsPool.map(s => {
              if (ivs[s] > highestIv) {
                shownStat = s as Stat;
                highestIv = ivs[s];
              }
            });
            shownStats.push(shownStat);
            statsPool.splice(statsPool.indexOf(shownStat), 1);
          }
        } else {
          shownStats = stats;
        }
        for (const s of stats) {
          levelUpStatsValuesText += `${shownStats.indexOf(s) > -1 ? this.getIvDescriptor(ivs[s], s, pokemonId) : "???"}\n`;
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

  getIvDescriptor(value: integer, typeIv: integer, pokemonId: integer): string {
    const starterSpecies = this.scene.getPokemonById(pokemonId).species.getRootSpeciesId(true);
    const starterIvs: number[] = this.scene.gameData.dexData[starterSpecies].ivs;
    const uiTheme = (this.scene as BattleScene).uiTheme; // Assuming uiTheme is accessible

    // Function to wrap text in color based on comparison
    const coloredText = (text: string, isBetter: boolean) => {
      const textStyle: TextStyle = isBetter ? TextStyle.SUMMARY_GREEN : TextStyle.SUMMARY;
      const color = getTextColor(textStyle, false, uiTheme);
      return `[color=${color}][shadow=${getTextColor(textStyle, true, uiTheme)}]${text}[/shadow][/color]`;
    };

    if (value > 30) {
      return coloredText(i18next.t("battleMessageUiHandler:ivBest"), value > starterIvs[typeIv]);
    }
    if (value === 30) {
      return coloredText(i18next.t("battleMessageUiHandler:ivFantastic"), value > starterIvs[typeIv]);
    }
    if (value > 20) {
      return coloredText(i18next.t("battleMessageUiHandler:ivVeryGood"), value > starterIvs[typeIv]);
    }
    if (value > 10) {
      return coloredText(i18next.t("battleMessageUiHandler:ivPrettyGood"), value > starterIvs[typeIv]);
    }
    if (value > 0) {
      return coloredText(i18next.t("battleMessageUiHandler:ivDecent"), value > starterIvs[typeIv]);
    }

    return coloredText(i18next.t("battleMessageUiHandler:ivNoGood"), value > starterIvs[typeIv]);
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
