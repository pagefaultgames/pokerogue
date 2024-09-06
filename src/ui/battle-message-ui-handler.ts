import BattleScene from "../battle-scene";
import { addBBCodeTextObject, addTextObject, getTextColor, TextStyle } from "./text";
import { Mode } from "./ui";
import MessageUiHandler from "./message-ui-handler";
import { addWindow } from "./ui-theme";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import {Button} from "#enums/buttons";
import i18next from "i18next";
import { Stat, PERMANENT_STATS, getStatKey } from "#app/enums/stat";

export default class BattleMessageUiHandler extends MessageUiHandler {
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

  constructor(scene: BattleScene) {
    super(scene, Mode.MESSAGE);
  }

  setup(): void {
    const ui = this.getUi();

    this.textTimer = null;
    this.textCallbackTimer = null;

    this.bg = this.scene.add.sprite(0, 0, "bg", this.scene.windowType);
    this.bg.setName("sprite-battle-msg-bg");
    this.bg.setOrigin(0, 1);
    ui.add(this.bg);

    this.commandWindow = addWindow(this.scene, 202, 0, 118, 48);
    this.commandWindow.setName("window-command");
    this.commandWindow.setOrigin(0, 1);
    this.commandWindow.setVisible(false);
    ui.add(this.commandWindow);

    this.movesWindowContainer = this.scene.add.container(0, 0);
    this.movesWindowContainer.setName("moves-bg");
    this.movesWindowContainer.setVisible(false);

    const movesWindow = addWindow(this.scene, 0, 0, 243, 48);
    movesWindow.setName("moves-window");
    movesWindow.setOrigin(0, 1);

    const moveDetailsWindow = addWindow(this.scene, 240, 0, 80, 48, false, false, -1, 132);
    moveDetailsWindow.setName("move-details-window");
    moveDetailsWindow.setOrigin(0, 1);

    this.movesWindowContainer.add([movesWindow, moveDetailsWindow]);
    ui.add(this.movesWindowContainer);

    const messageContainer = this.scene.add.container(12, -39);
    ui.add(messageContainer);

    const message = addTextObject(this.scene, 0, 0, "", TextStyle.MESSAGE, {
      maxLines: 2,
      wordWrap: {
        width: this.wordWrapWidth
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

    for (const s of PERMANENT_STATS) {
      levelUpStatsLabelText += `${i18next.t(getStatKey(s))}\n`;
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

    const levelUpStatsValuesContent = addBBCodeTextObject(this.scene, (this.scene.game.canvas.width / 6) - 7, -94, "", TextStyle.WINDOW, { maxLines: 6, lineSpacing: 5});
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

    return false;
  }

  clear() {
    super.clear();
  }

  showText(text: string, delay?: integer | null, callback?: Function | null, callbackDelay?: integer | null, prompt?: boolean | null, promptDelay?: integer | null) {
    this.hideNameText();
    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  showDialogue(text: string, name?: string, delay?: integer | null, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    if (name) {
      this.showNameText(name);
    }
    super.showDialogue(text, name, delay, callback, callbackDelay, prompt, promptDelay);
  }

  promptLevelUpStats(partyMemberIndex: integer, prevStats: integer[], showTotals: boolean): Promise<void> {
    return new Promise(resolve => {
      if (!this.scene.showLevelUpStats) {
        return resolve();
      }
      const newStats = (this.scene as BattleScene).getParty()[partyMemberIndex].stats;
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
        const shownStats = this.getTopIvs(ivs, shownIvsCount);
        for (const s of PERMANENT_STATS) {
          levelUpStatsValuesText += `${shownStats.includes(s) ? this.getIvDescriptor(ivs[s], s, pokemonId) : "???"}\n`;
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

  getTopIvs(ivs: integer[], shownIvsCount: integer): Stat[] {
    let shownStats: Stat[] = [];
    if (shownIvsCount < 6) {
      const statsPool = PERMANENT_STATS.slice();
      // Sort the stats from highest to lowest iv
      statsPool.sort((s1, s2) => ivs[s2] - ivs[s1]);
      for (let i = 0; i < shownIvsCount; i++) {
        shownStats.push(statsPool[i]);
      }
    } else {
      shownStats = PERMANENT_STATS.slice();
    }
    return shownStats;
  }

  getIvDescriptor(value: integer, typeIv: integer, pokemonId: integer): string {
    const starterSpecies = this.scene.getPokemonById(pokemonId)!.species.getRootSpeciesId(); // we are using getRootSpeciesId() here because we want to check against the baby form, not the mid form if it exists
    const starterIvs: number[] = this.scene.gameData.dexData[starterSpecies].ivs;
    const uiTheme = (this.scene as BattleScene).uiTheme; // Assuming uiTheme is accessible

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
      const color = getTextColor(textStyle, false, uiTheme);
      return `[color=${color}][shadow=${getTextColor(textStyle, true, uiTheme)}]${text}[/shadow][/color]`;
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
