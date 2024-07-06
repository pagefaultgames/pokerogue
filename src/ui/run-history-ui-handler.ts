import BattleScene from "../battle-scene";
import { GameModes } from "../game-mode";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import { addWindow } from "./ui-theme";
import * as Utils from "../utils";
import PokemonData from "../system/pokemon-data";
import MessageUiHandler from "./message-ui-handler";
import i18next from "i18next";
import {Button} from "../enums/buttons";
import { BattleType } from "../battle";
import { TrainerVariant } from "../field/trainer";
import { Challenges } from "#enums/challenges";
import { Type } from "../data/type";
import { RunHistoryData, RunEntries } from "../system/game-data";


export const runCount = 25;

export type RunSelectCallback = (cursor: integer) => void;

export default class RunHistoryUiHandler extends MessageUiHandler {

  private runSelectContainer: Phaser.GameObjects.Container;
  private runsContainer: Phaser.GameObjects.Container;
  private runSelectMessageBox: Phaser.GameObjects.NineSlice;
  private runSelectMessageBoxContainer: Phaser.GameObjects.Container;
  private runs: RunEntry[];

  private runSelectCallback: RunSelectCallback;

  private scrollCursor: integer = 0;

  private cursorObj: Phaser.GameObjects.NineSlice;

  private runContainerInitialY: number;

  constructor(scene: BattleScene) {
    super(scene, Mode.RUN_HISTORY);
  }

  setup() {
    const ui = this.getUi();

    this.runSelectContainer = this.scene.add.container(0, 0);
    this.runSelectContainer.setVisible(false);
    ui.add(this.runSelectContainer);

    const loadSessionBg = this.scene.add.rectangle(0, 0, this.scene.game.canvas.width / 6, -this.scene.game.canvas.height / 6, 0x006860);
    loadSessionBg.setOrigin(0, 0);
    this.runSelectContainer.add(loadSessionBg);

    this.runContainerInitialY = -this.scene.game.canvas.height / 6 + 8;

    this.runsContainer = this.scene.add.container(8, this.runContainerInitialY);
    this.runSelectContainer.add(this.runsContainer);

    this.runSelectMessageBoxContainer = this.scene.add.container(0, 0);
    this.runSelectMessageBoxContainer.setVisible(false);
    this.runSelectContainer.add(this.runSelectMessageBoxContainer);

    this.runSelectMessageBox = addWindow(this.scene, 1, -1, 318, 28);
    this.runSelectMessageBox.setOrigin(0, 1);
    this.runSelectMessageBoxContainer.add(this.runSelectMessageBox);

    this.message = addTextObject(this.scene, 8, 8, "", TextStyle.WINDOW, { maxLines: 2 });
    this.message.setOrigin(0, 0);
    this.runSelectMessageBoxContainer.add(this.message);

    this.runs = [];
  }

  show(args: any[]): boolean {
    super.show(args);

    this.getUi().bringToTop(this.runSelectContainer);
    this.runSelectContainer.setVisible(true);
    this.populateruns(this.scene);

    this.setScrollCursor(0);
    this.setCursor(0);

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    const error = false;

    if (button === Button.ACTION || button === Button.CANCEL) {
      if (button === Button.ACTION) {
        const cursor = this.cursor + this.scrollCursor;
        if (this.runs[cursor].hasData) {
          this.scene.ui.setOverlayMode(Mode.RUN_INFO, this.runs[cursor].entryData, true);
        }
        success = true;
        return success;
      } else {
        this.runSelectCallback = null;
        success = true;
        this.scene.ui.revertMode();
      }
    } else {
      switch (button) {
      case Button.UP:
        if (this.cursor) {
          success = this.setCursor(this.cursor - 1);
        } else if (this.scrollCursor) {
          success = this.setScrollCursor(this.scrollCursor - 1);
        }
        break;
      case Button.DOWN:
        if (this.cursor < 2) {
          success = this.setCursor(this.cursor + 1);
        } else if (this.scrollCursor < runCount - 3) {
          success = this.setScrollCursor(this.scrollCursor + 1);
        }
        break;
      }
    }

    if (success) {
      ui.playSelect();
    } else if (error) {
      ui.playError();
    }
    return success || error;
  }


  async populateruns(scene: BattleScene) {
    const response = await this.scene.gameData.getRunHistoryData(this.scene);
    const timestamps = Object.keys(response);
    if (timestamps.length > 1) {
      timestamps.sort((a, b) => a - b);
    }
    const entryCount = timestamps.length;
    for (let s = 0; s < entryCount; s++) {
      const entry = new RunEntry(this.scene, response, timestamps[s], s);
      this.scene.add.existing(entry);
      this.runsContainer.add(entry);
      this.runs.push(entry);
    }
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);

    if (text?.indexOf("\n") === -1) {
      this.runSelectMessageBox.setSize(318, 28);
      this.message.setY(-22);
    } else {
      this.runSelectMessageBox.setSize(318, 42);
      this.message.setY(-37);
    }

    this.runSelectMessageBoxContainer.setVisible(!!text?.length);
  }

  setCursor(cursor: integer): boolean {
    const changed = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.nineslice(0, 0, "select_cursor_highlight_thick", null, 296, 44, 6, 6, 6, 6);
      this.cursorObj.setOrigin(0, 0);
      this.runsContainer.add(this.cursorObj);
    }
    this.cursorObj.setPosition(4, 4 + (cursor + this.scrollCursor) * 56);

    return changed;
  }

  setScrollCursor(scrollCursor: integer): boolean {
    const changed = scrollCursor !== this.scrollCursor;

    if (changed) {
      this.scrollCursor = scrollCursor;
      this.setCursor(this.cursor);
      this.scene.tweens.add({
        targets: this.runsContainer,
        y: this.runContainerInitialY - 56 * scrollCursor,
        duration: Utils.fixedInt(325),
        ease: "Sine.easeInOut"
      });
    }

    return changed;
  }

  clear() {
    super.clear();
    this.runSelectContainer.setVisible(false);
    this.eraseCursor();
    this.runSelectCallback = null;
    this.clearruns();
  }

  eraseCursor() {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }

  clearruns() {
    this.runs.splice(0, this.runs.length);
    this.runsContainer.removeAll(true);
  }
}

class RunEntry extends Phaser.GameObjects.Container {
  public slotId: integer;
  public hasData: boolean;
  public entryData: RunHistoryData;
  private loadingLabel: Phaser.GameObjects.Text;

  constructor(scene: BattleScene, runHistory: RunHistoryData, timestamp: string, slotId: integer) {
    super(scene, 0, slotId*56);

    this.slotId = slotId;
    this.hasData = true;
    this.entryData = runHistory[timestamp];

    this.setup(this.entryData);

  }

  setup(run: RunEntries) {

    const victory = run.victory;
    const data = this.scene.gameData.parseSessionData(JSON.stringify(run.entry));

    const slotWindow = addWindow(this.scene, 0, 0, 304, 52);
    this.add(slotWindow);


    if (victory) {
      const gameOutcomeLabel = addTextObject(this.scene, 8, 5, `${i18next.t("runHistory:victory")}`, TextStyle.WINDOW);
      this.add(gameOutcomeLabel);
    } else {
      if (data.battleType === BattleType.WILD) {
        const enemyContainer = this.scene.add.container(8, 5);
        const gameOutcomeLabel = addTextObject(this.scene, 0, 0, `${i18next.t("runHistory:defeatedWild")}`, TextStyle.WINDOW);
        enemyContainer.add(gameOutcomeLabel);
        data.enemyParty.forEach((enemyData, e) => {
          //This allows the enemyParty to be shown - doubles or sings -> 58+(e*8)
          const enemyIconContainer = this.scene.add.container(65+(e*25),-8);
          enemyIconContainer.setScale(0.75);
          enemyData.boss = false;
          const enemy = enemyData.toPokemon(this.scene);
          const enemyIcon = this.scene.addPokemonIcon(enemy, 0, 0, 0, 0);
          const enemyLevel = addTextObject(this.scene, 32, 20, `${i18next.t("saveSlotSelectUiHandler:lv")}${Utils.formatLargeNumber(enemy.level, 1000)}`, TextStyle.PARTY, { fontSize: "54px", color: "#f8f8f8" });
          enemyLevel.setShadow(0, 0, null);
          enemyLevel.setStroke("#424242", 14);
          enemyLevel.setOrigin(1, 0);
          enemyIconContainer.add(enemyIcon);
          enemyIconContainer.add(enemyLevel);
          enemyContainer.add(enemyIconContainer);
          enemy.destroy();
        });
        this.add(enemyContainer);
      } else if (data.battleType === BattleType.TRAINER) {
        const tObj = data.trainer.toTrainer(this.scene);
        if (data.trainer.trainerType >= 375) {
          const gameOutcomeLabel = addTextObject(this.scene, 8, 5, `${i18next.t("runHistory:defeatedRival")}`, TextStyle.WINDOW);
          //otherwise it becomes Rival_5 in Ivy's case
          this.add(gameOutcomeLabel);
        } else if (data.trainer.variant === TrainerVariant.DOUBLE) {
          const gameOutcomeLabel = addTextObject(this.scene, 8, 5, `${i18next.t("runHistory:defeatedTrainer")+tObj.config.nameDouble+" "+tObj.getName(0, false)}`, TextStyle.WINDOW);
          this.add(gameOutcomeLabel);
        } else {
          const gameOutcomeLabel = addTextObject(this.scene, 8, 5, `${i18next.t("runHistory:defeatedTrainer")+tObj.getName(0, true)}`, TextStyle.WINDOW);
          this.add(gameOutcomeLabel);
        }
      }
    }


    switch (data.gameMode) {
    case GameModes.DAILY:
      const dailyModeLabel = addTextObject(this.scene, 8, 19, `${i18next.t("gameMode:dailyRun") || i18next.t("gameMode:unknown")} - ${i18next.t("saveSlotSelectUiHandler:wave")} ${data.waveIndex}`, TextStyle.WINDOW);
      this.add(dailyModeLabel);
      break;
    case GameModes.SPLICED_ENDLESS:
      const endlessSplicedLabel = addTextObject(this.scene, 8, 19, `${i18next.t("gameMode:endlessSpliced") || i18next.t("gameMode:unknown")} - ${i18next.t("saveSlotSelectUiHandler:wave")} ${data.waveIndex}`, TextStyle.WINDOW);
      this.add(endlessSplicedLabel);
      break;
    case GameModes.ENDLESS:
    case GameModes.CLASSIC:
    case GameModes.CHALLENGE:
      const gameModeLabel = addTextObject(this.scene, 8, 19, `${i18next.t("gameMode:"+GameModes[data.gameMode].toLowerCase()) || i18next.t("gameMode:unknown")} - ${i18next.t("saveSlotSelectUiHandler:wave")} ${data.waveIndex}`, TextStyle.WINDOW);
      this.add(gameModeLabel);
      break;
    }

    const timestampLabel = addTextObject(this.scene, 8, 33, new Date(data.timestamp).toLocaleString(), TextStyle.WINDOW);
    this.add(timestampLabel);

    const pokemonIconsContainer = this.scene.add.container(125, 17);

    data.party.forEach((p: PokemonData, i: integer) => {
      const iconContainer = this.scene.add.container(26 * i, 0);
      iconContainer.setScale(0.75);
      const pokemon = p.toPokemon(this.scene);
      const icon = this.scene.addPokemonIcon(pokemon, 0, 0, 0, 0);

      const text = addTextObject(this.scene, 32, 20, `${i18next.t("saveSlotSelectUiHandler:lv")}${Utils.formatLargeNumber(pokemon.level, 1000)}`, TextStyle.PARTY, { fontSize: "54px", color: "#f8f8f8" });
      text.setShadow(0, 0, null);
      text.setStroke("#424242", 14);
      text.setOrigin(1, 0);

      iconContainer.add(icon);
      iconContainer.add(text);

      pokemonIconsContainer.add(iconContainer);

      pokemon.destroy();
    });

    this.add(pokemonIconsContainer);

    //Display Score - only visible for Daily Mode
    //Display Personal Best - only visible for Endless Modes
    switch (data.gameMode) {
    case GameModes.ENDLESS:
    case GameModes.SPLICED_ENDLESS:
      if (this.scene.gameData.gameStats.highestEndlessWave === data.waveIndex) {
        const personalBestText = addTextObject(this.scene, 255, 5, `${i18next.t("runHistory:personalBest")}`, TextStyle.WINDOW, {fontSize: "44px"});
        personalBestText.setTint(0xffef5c, 0x47ff69, 0x6b6bff, 0xff6969);
        this.add(personalBestText);
      }
      break;
    case GameModes.CHALLENGE:
      const runChallenges = data.challenges;
      for (let i = 0; i < runChallenges.length; i++) {
        const challengeLabel = addTextObject(this.scene, 270, 5, "", TextStyle.WINDOW, {fontSize: "40px"});
        if (runChallenges[i].id === Challenges.SINGLE_GENERATION && runChallenges[i].value !== 0) {
          challengeLabel.appendText(`${i18next.t("runHistory:challengeMonoGen"+runChallenges[i].value)}`, false);
        }
        if (runChallenges[i].id === Challenges.SINGLE_TYPE && runChallenges[i].value !== 0) {
          if (challengeLabel.text) {
            challengeLabel.appendText(i18next.t("pokemonInfo:Type."+Type[runChallenges[i].value-1]));
          } else {
            challengeLabel.appendText(i18next.t("pokemonInfo:Type."+Type[runChallenges[i].value-1]));
          }
        }
        this.add(challengeLabel);
      }
      break;
    }
  }
}


interface RunEntry {
  scene: BattleScene;
}

