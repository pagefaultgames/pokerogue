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
import { RunEntry } from "../system/game-data";
import { PlayerGender } from "#enums/player-gender";

export type RunSelectCallback = (cursor: integer) => void;

export default class RunHistoryUiHandler extends MessageUiHandler {

  private runSelectContainer: Phaser.GameObjects.Container;
  private runsContainer: Phaser.GameObjects.Container;
  private runSelectMessageBox: Phaser.GameObjects.NineSlice;
  private runSelectMessageBoxContainer: Phaser.GameObjects.Container;
  private runs: RunEntryContainer[];

  private runSelectCallback: RunSelectCallback | null;

  private scrollCursor: integer = 0;

  private cursorObj: Phaser.GameObjects.NineSlice | null;

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

    this.runs = [];

    this.scene.loadImage("hall_of_fame_red", "ui");
    this.scene.loadImage("hall_of_fame_blue", "ui");
    this.scene.loadAtlas("rival_f", "trainer");
    this.scene.loadAtlas("rival_m", "trainer");
  }

  show(args: any[]): boolean {
    super.show(args);

    this.getUi().bringToTop(this.runSelectContainer);
    this.runSelectContainer.setVisible(true);
    this.populateRuns(this.scene);

    this.setScrollCursor(0);
    this.setCursor(0);

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    const error = false;

    if ([Button.ACTION, Button.CANCEL].includes(button)) {
      if (button === Button.ACTION) {
        const cursor = this.cursor + this.scrollCursor;
        if (this.runs[cursor]) {
          this.scene.ui.setOverlayMode(Mode.RUN_INFO, this.runs[cursor].entryData, true);
        } else {
          return false;
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
        } else if (this.scrollCursor < this.runs.length - 3) {
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


  async populateRuns(scene: BattleScene) {
    const response = await this.scene.gameData.getRunHistoryData(this.scene);
    const timestamps = Object.keys(response);
    if (timestamps.length === 0) {
      return;
    }
    const timestampsNo = timestamps.map(Number);
    if (timestamps.length > 1) {
      timestampsNo.sort((a, b) => b - a);
    }
    const entryCount = timestamps.length;
    for (let s = 0; s < entryCount; s++) {
      const entry = new RunEntryContainer(this.scene, response[timestampsNo[s]], s);
      this.scene.add.existing(entry);
      this.runsContainer.add(entry);
      this.runs.push(entry);
    }
  }

  setCursor(cursor: number): boolean {
    const changed = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.nineslice(0, 0, "select_cursor_highlight_thick", undefined, 308, 56, 6, 6, 6, 6);
      this.cursorObj.setOrigin(0, 0);
      this.runsContainer.add(this.cursorObj);
    }
    this.cursorObj.setPosition(-2, -2 + (cursor + this.scrollCursor) * 56);
    return changed;
  }

  setScrollCursor(scrollCursor: number): boolean {
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
    this.clearCursor();
    this.runSelectCallback = null;
    this.clearRuns();
  }

  clearCursor() {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }

  clearRuns() {
    this.runs.splice(0, this.runs.length);
    this.runsContainer.removeAll(true);
  }
}

class RunEntryContainer extends Phaser.GameObjects.Container {
  public slotId: number;
  public hasData: boolean;
  public entryData: RunEntry;
  private loadingLabel: Phaser.GameObjects.Text;

  constructor(scene: BattleScene, entryData: RunEntry, slotId: number) {
    super(scene, 0, slotId*56);

    this.slotId = slotId;
    this.hasData = true;
    this.entryData = entryData;

    this.setup(this.entryData);

  }

  setup(run: RunEntry) {

    const victory = run.isVictory;
    const data = this.scene.gameData.parseSessionData(JSON.stringify(run.entry));

    const slotWindow = addWindow(this.scene, 0, 0, 304, 52);
    this.add(slotWindow);

    if (victory) {
      const gameOutcomeLabel = addTextObject(this.scene, 8, 5, `${i18next.t("runHistory:victory")}`, TextStyle.WINDOW);
      this.add(gameOutcomeLabel);
    } else {
      const genderLabel = (this.scene.gameData.gender === PlayerGender.FEMALE) ? "F" : "M";
      if (data.battleType === BattleType.WILD) {
        const enemyContainer = this.scene.add.container(8, 5);
        const gameOutcomeLabel = addTextObject(this.scene, 0, 0, `${i18next.t("runHistory:defeatedWild"+genderLabel)}`, TextStyle.WINDOW);
        enemyContainer.add(gameOutcomeLabel);
        data.enemyParty.forEach((enemyData, e) => {
          // This allows the enemyParty to be shown - doubles or singles -> 58+(e*8)
          const enemyIconContainer = this.scene.add.container(65+(e*25),-8);
          enemyIconContainer.setScale(0.75);
          enemyData.boss = false;
          enemyData["player"] = true;
          const enemy = enemyData.toPokemon(this.scene);
          const enemyIcon = this.scene.addPokemonIcon(enemy, 0, 0, 0, 0);
          const enemyLevel = addTextObject(this.scene, 32, 20, `${i18next.t("saveSlotSelectUiHandler:lv")}${Utils.formatLargeNumber(enemy.level, 1000)}`, TextStyle.PARTY, { fontSize: "54px", color: "#f8f8f8" });
          enemyLevel.setShadow(0, 0, undefined);
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
        const RIVAL_TRAINER_ID_THRESHOLD = 375;
        if (data.trainer.trainerType >= RIVAL_TRAINER_ID_THRESHOLD) {
          const gameOutcomeLabel = addTextObject(this.scene, 8, 5, `${i18next.t("runHistory:defeatedRival"+genderLabel)}`, TextStyle.WINDOW);
          // otherwise it becomes Rival_5 in Ivy's case
          this.add(gameOutcomeLabel);
        } else {
          const gameOutcomeLabel = addTextObject(this.scene, 8, 5, `${i18next.t("runHistory:defeatedTrainer"+genderLabel)}${tObj.getName(0, true)}`, TextStyle.WINDOW);
          this.add(gameOutcomeLabel);
        }
      }
    }

    const gameModeLabel = addTextObject(this.scene, 8, 19, "", TextStyle.WINDOW);
    let mode = "";
    switch (data.gameMode) {
    case GameModes.DAILY:
      mode = i18next.t("gameMode:dailyRun");
      break;
    case GameModes.SPLICED_ENDLESS:
    case GameModes.ENDLESS:
      mode = i18next.t("gameMode:endless");
      break;
    case GameModes.CLASSIC:
      mode = i18next.t("gameMode:classic");
      break;
    case GameModes.CHALLENGE:
      mode = i18next.t("gameMode:challenge");
      break;
    }
    gameModeLabel.appendText(mode, false);
    if (data.gameMode === GameModes.SPLICED_ENDLESS) {
      const splicedIcon = this.scene.add.image(0, 0, "icon_spliced");
      splicedIcon.setScale(0.75);
      const coords = gameModeLabel.getTopRight();
      splicedIcon.setPosition(coords.x+5, 27);
      this.add(splicedIcon);
      gameModeLabel.appendText("    - ", false);
    } else {
      gameModeLabel.appendText(" - ", false);
    }
    gameModeLabel.appendText(i18next.t("saveSlotSelectUiHandler:wave")+" "+data.waveIndex, false);
    this.add(gameModeLabel);

    const timestampLabel = addTextObject(this.scene, 8, 33, new Date(data.timestamp).toLocaleString(), TextStyle.WINDOW);
    this.add(timestampLabel);

    const pokemonIconsContainer = this.scene.add.container(140, 17);

    data.party.forEach((p: PokemonData, i: integer) => {
      const iconContainer = this.scene.add.container(26 * i, 0);
      iconContainer.setScale(0.75);
      const pokemon = p.toPokemon(this.scene);
      const icon = this.scene.addPokemonIcon(pokemon, 0, 0, 0, 0);

      const text = addTextObject(this.scene, 32, 20, `${i18next.t("saveSlotSelectUiHandler:lv")}${Utils.formatLargeNumber(pokemon.level, 1000)}`, TextStyle.PARTY, { fontSize: "54px", color: "#f8f8f8" });
      text.setShadow(0, 0, undefined);
      text.setStroke("#424242", 14);
      text.setOrigin(1, 0);

      iconContainer.add(icon);
      iconContainer.add(text);

      pokemonIconsContainer.add(iconContainer);

      pokemon.destroy();
    });

    this.add(pokemonIconsContainer);
  }
}


interface RunEntryContainer {
  scene: BattleScene;
}

