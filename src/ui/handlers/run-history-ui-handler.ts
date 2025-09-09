import { globalScene } from "#app/global-scene";
import { BattleType } from "#enums/battle-type";
import { Button } from "#enums/buttons";
import { GameModes } from "#enums/game-modes";
import { PlayerGender } from "#enums/player-gender";
import { TextStyle } from "#enums/text-style";
import { TrainerVariant } from "#enums/trainer-variant";
import { UiMode } from "#enums/ui-mode";
import type { RunEntry } from "#system/game-data";
import type { PokemonData } from "#system/pokemon-data";
import { MessageUiHandler } from "#ui/handlers/message-ui-handler";
import { RunDisplayMode } from "#ui/handlers/run-info-ui-handler";
import { addTextObject } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import { fixedInt, formatLargeNumber } from "#utils/common";
import i18next from "i18next";

export type RunSelectCallback = (cursor: number) => void;

export const RUN_HISTORY_LIMIT: number = 25;

/**
 * RunHistoryUiHandler handles the UI of the Run History Menu
 * Run History itself is broken into an array of RunEntryContainer objects that can show the user basic details about their run and allow them to access more details about their run through cursor action.
 * It navigates similarly to the UI of the save slot select menu.
 * The only valid input buttons are Button.ACTION and Button.CANCEL.
 */
export class RunHistoryUiHandler extends MessageUiHandler {
  private readonly maxRows = 3;

  private runSelectContainer: Phaser.GameObjects.Container;
  private runsContainer: Phaser.GameObjects.Container;
  private runs: RunEntryContainer[];

  private scrollCursor = 0;

  private cursorObj: Phaser.GameObjects.NineSlice | null;

  private runContainerInitialY: number;

  constructor() {
    super(UiMode.RUN_HISTORY);
  }

  override setup() {
    const ui = this.getUi();

    this.runSelectContainer = globalScene.add.container(0, 0);
    this.runSelectContainer.setVisible(false);
    ui.add(this.runSelectContainer);

    const loadSessionBg = globalScene.add.rectangle(
      0,
      0,
      globalScene.scaledCanvas.width,
      -globalScene.scaledCanvas.height,
      0x006860,
    );
    loadSessionBg.setOrigin(0, 0);
    this.runSelectContainer.add(loadSessionBg);

    this.runContainerInitialY = -globalScene.scaledCanvas.height + 8;

    this.runsContainer = globalScene.add.container(8, this.runContainerInitialY);
    this.runSelectContainer.add(this.runsContainer);

    this.runs = [];

    globalScene.loadImage("hall_of_fame_red", "ui");
    globalScene.loadImage("hall_of_fame_blue", "ui");
    // For some reason, the game deletes/unloads the rival sprites. As a result, Run Info cannot access the rival sprites.
    // The rivals are loaded here to have some way of accessing those sprites.
    globalScene.loadAtlas("rival_f", "trainer");
    globalScene.loadAtlas("rival_m", "trainer");
  }

  override show(args: any[]): boolean {
    super.show(args);

    this.getUi().bringToTop(this.runSelectContainer);
    this.runSelectContainer.setVisible(true);
    this.populateRuns().then(() => {
      this.setScrollCursor(0);
      this.setCursor(0);

      //Destroys the cursor if there are no runs saved so far.
      if (this.runs.length === 0) {
        this.clearCursor();
      }
    });

    return true;
  }

  /**
   * Performs a certain action based on the button pressed by the user
   * @param button
   * The user can navigate through the runs with Button.UP/Button.DOWN.
   * Button.ACTION allows the user to access more information about their runs.
   * Button.CANCEL allows the user to go back.
   */
  override processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    const error = false;

    if ([Button.ACTION, Button.CANCEL].includes(button)) {
      if (button === Button.ACTION) {
        const cursor = this.cursor + this.scrollCursor;
        if (this.runs[cursor]) {
          globalScene.ui.setOverlayMode(UiMode.RUN_INFO, this.runs[cursor].entryData, RunDisplayMode.RUN_HISTORY, true);
        } else {
          return false;
        }
        success = true;
        return success;
      }
      success = true;
      globalScene.ui.revertMode();
    } else if (this.runs.length > 0) {
      switch (button) {
        case Button.UP:
          if (this.cursor) {
            success = this.setCursor(this.cursor - 1);
          } else if (this.scrollCursor) {
            success = this.setScrollCursor(this.scrollCursor - 1);
          } else if (this.runs.length > 1) {
            // wrap around to the bottom
            success = this.setCursor(Math.min(this.runs.length - 1, this.maxRows - 1));
            success = this.setScrollCursor(Math.max(0, this.runs.length - this.maxRows)) || success;
          }
          break;
        case Button.DOWN:
          if (this.cursor < Math.min(this.maxRows - 1, this.runs.length - this.scrollCursor - 1)) {
            success = this.setCursor(this.cursor + 1);
          } else if (this.scrollCursor < this.runs.length - this.maxRows) {
            success = this.setScrollCursor(this.scrollCursor + 1);
          } else if (this.runs.length > 1) {
            // wrap around to the top
            success = this.setCursor(0);
            success = this.setScrollCursor(0) || success;
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

  /**
   * This retrieves the player's run history and facilitates the processes necessary for the output display.
   * Runs are displayed from newest --> oldest in descending order.
   * In the for loop, each run is processed to create an RunEntryContainer used to display and store the run's unique information
   */
  private async populateRuns() {
    const response = await globalScene.gameData.getRunHistoryData();
    const timestamps = Object.keys(response);
    if (timestamps.length === 0) {
      this.showEmpty();
      return;
    }
    const timestampsNo = timestamps.map(Number);
    if (timestamps.length > 1) {
      timestampsNo.sort((a, b) => b - a);
    }
    const entryCount = timestamps.length;
    for (let s = 0; s < entryCount; s++) {
      const entry = new RunEntryContainer(response[timestampsNo[s]], s);
      globalScene.add.existing(entry);
      this.runsContainer.add(entry);
      this.runs.push(entry);
    }
    if (this.cursorObj && timestamps.length > 0) {
      this.runsContainer.bringToTop(this.cursorObj);
    }
  }

  /**
   * If the player has no runs saved so far, this creates a giant window labeled empty instead.
   */
  private async showEmpty() {
    const emptyWindow = addWindow(0, 0, 304, 165);
    this.runsContainer.add(emptyWindow);
    const emptyWindowCoordinates = emptyWindow.getCenter();
    const emptyText = addTextObject(0, 0, i18next.t("saveSlotSelectUiHandler:empty"), TextStyle.WINDOW, {
      fontSize: "128px",
    });
    emptyText.setPosition(emptyWindowCoordinates.x - 18, emptyWindowCoordinates.y - 15);
    this.runsContainer.add(emptyText);
  }

  override setCursor(cursor: number): boolean {
    const changed = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = globalScene.add.nineslice(0, 0, "select_cursor_highlight_thick", undefined, 296, 46, 6, 6, 6, 6);
      this.cursorObj.setOrigin(0, 0);
      this.runsContainer.add(this.cursorObj);
    }
    this.cursorObj.setPosition(4, 4 + (cursor + this.scrollCursor) * 56);
    return changed;
  }

  private setScrollCursor(scrollCursor: number): boolean {
    const changed = scrollCursor !== this.scrollCursor;

    if (changed) {
      this.scrollCursor = scrollCursor;
      this.setCursor(this.cursor);
      globalScene.tweens.add({
        targets: this.runsContainer,
        y: this.runContainerInitialY - 56 * scrollCursor,
        duration: fixedInt(325),
        ease: "Sine.easeInOut",
      });
    }
    return changed;
  }

  /**
   * Called when the player returns back to the menu
   * Uses the functions clearCursor() and clearRuns()
   */
  override clear() {
    super.clear();
    this.runSelectContainer.setVisible(false);
    this.setScrollCursor(0);
    this.clearCursor();
    this.clearRuns();
  }

  private clearCursor() {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }

  private clearRuns() {
    this.runs.splice(0, this.runs.length);
    this.runsContainer.removeAll(true);
  }
}

/**
 * RunEntryContainer : stores/displays an individual run
 * slotId: necessary for positioning
 * entryData: the data of an individual run
 */
class RunEntryContainer extends Phaser.GameObjects.Container {
  public entryData: RunEntry;

  constructor(entryData: RunEntry, slotId: number) {
    super(globalScene, 0, slotId * 56);

    this.entryData = entryData;

    this.setup(this.entryData);
  }

  /**
   * This processes the individual run's data for display.
   *
   * Each RunEntryContainer displayed should have the following information:
   * Run Result: Victory || Defeat
   * Game Mode + Final Wave
   * Time Stamp
   *
   * The player's party and their levels at the time of the last wave of the run are also displayed.
   */
  private setup(run: RunEntry) {
    const victory = run.isVictory;
    const data = globalScene.gameData.parseSessionData(JSON.stringify(run.entry));

    const slotWindow = addWindow(0, 0, 304, 52);
    this.add(slotWindow);

    // Run Result: Victory
    if (victory) {
      const gameOutcomeLabel = addTextObject(8, 5, `${i18next.t("runHistory:victory")}`, TextStyle.WINDOW);
      this.add(gameOutcomeLabel);
    } else {
      // Run Result: Defeats
      const genderIndex = globalScene.gameData.gender ?? PlayerGender.UNSET;
      const genderStr = PlayerGender[genderIndex].toLowerCase();
      // Defeats from wild Pokemon battles will show the Pokemon responsible by the text of the run result.
      if (data.battleType === BattleType.WILD || (data.battleType === BattleType.MYSTERY_ENCOUNTER && !data.trainer)) {
        const enemyContainer = globalScene.add.container(8, 5);
        const gameOutcomeLabel = addTextObject(
          0,
          0,
          `${i18next.t("runHistory:defeatedWild", { context: genderStr })}`,
          TextStyle.WINDOW,
        );
        enemyContainer.add(gameOutcomeLabel);
        data.enemyParty.forEach((enemyData, e) => {
          const enemyIconContainer = globalScene.add.container(65 + e * 25, -8);
          enemyIconContainer.setScale(0.75);
          enemyData.boss = false;
          enemyData["player"] = true;
          const enemy = enemyData.toPokemon();
          const enemyIcon = globalScene.addPokemonIcon(enemy, 0, 0, 0, 0);
          const enemyLevel = addTextObject(
            32,
            20,
            `${i18next.t("saveSlotSelectUiHandler:lv")}${formatLargeNumber(enemy.level, 1000)}`,
            TextStyle.PARTY,
            { fontSize: "54px", color: "#f8f8f8" },
          );
          enemyLevel.setShadow(0, 0, undefined);
          enemyLevel.setStroke("#424242", 14);
          enemyLevel.setOrigin(1, 0);
          enemyIconContainer.add(enemyIcon);
          enemyIconContainer.add(enemyLevel);
          enemyContainer.add(enemyIconContainer);
          enemy.destroy();
        });
        this.add(enemyContainer);
      } else if (
        data.battleType === BattleType.TRAINER
        || (data.battleType === BattleType.MYSTERY_ENCOUNTER && data.trainer)
      ) {
        // Defeats from Trainers show the trainer's title and name
        const tObj = data.trainer.toTrainer();
        // Because of the interesting mechanics behind rival names, the rival name and title have to be retrieved differently
        const RIVAL_TRAINER_ID_THRESHOLD = 375;
        if (data.trainer.trainerType >= RIVAL_TRAINER_ID_THRESHOLD) {
          const rivalName = tObj.variant === TrainerVariant.FEMALE ? "trainerNames:rivalFemale" : "trainerNames:rival";
          const gameOutcomeLabel = addTextObject(
            8,
            5,
            `${i18next.t("runHistory:defeatedRival", { context: genderStr })} ${i18next.t(rivalName)}`,
            TextStyle.WINDOW,
          );
          this.add(gameOutcomeLabel);
        } else {
          const gameOutcomeLabel = addTextObject(
            8,
            5,
            `${i18next.t("runHistory:defeatedTrainer", { context: genderStr })}${tObj.getName(0, true)}`,
            TextStyle.WINDOW,
          );
          this.add(gameOutcomeLabel);
        }
      }
    }

    // Game Mode + Waves
    // Because Endless (Spliced) tends to have the longest name across languages, the line tends to spill into the party icons.
    // To fix this, the Spliced icon is used to indicate an Endless Spliced run
    const gameModeLabel = addTextObject(8, 19, "", TextStyle.WINDOW);
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
      const splicedIcon = globalScene.add.image(0, 0, "icon_spliced");
      splicedIcon.setScale(0.75);
      const coords = gameModeLabel.getTopRight();
      splicedIcon.setPosition(coords.x + 5, 27);
      this.add(splicedIcon);
      // 4 spaces of room for the Spliced icon
      gameModeLabel.appendText("    - ", false);
    } else {
      gameModeLabel.appendText(" - ", false);
    }
    gameModeLabel.appendText(i18next.t("saveSlotSelectUiHandler:wave") + " " + data.waveIndex, false);
    this.add(gameModeLabel);

    const timestampLabel = addTextObject(8, 33, new Date(data.timestamp).toLocaleString(), TextStyle.WINDOW);
    this.add(timestampLabel);

    // pokemonIconsContainer holds the run's party Pokemon icons and levels
    // Icons should be level with each other here, but there are significant number of icons that have a center axis / position far from the norm.
    // The code here does not account for icon weirdness.
    const pokemonIconsContainer = globalScene.add.container(140, 17);

    data.party.forEach((p: PokemonData, i: number) => {
      const iconContainer = globalScene.add.container(26 * i, 0);
      iconContainer.setScale(0.75);
      const pokemon = p.toPokemon();
      const icon = globalScene.addPokemonIcon(pokemon, 0, 0, 0, 0);

      const text = addTextObject(
        32,
        20,
        `${i18next.t("saveSlotSelectUiHandler:lv")}${formatLargeNumber(pokemon.level, 1000)}`,
        TextStyle.PARTY,
        { fontSize: "54px", color: "#f8f8f8" },
      );
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
