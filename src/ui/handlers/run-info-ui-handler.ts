import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import { getNatureName, getNatureStatMultiplier } from "#data/nature";
import { getPokeballAtlasKey } from "#data/pokeball";
import { getTypeRgb } from "#data/type";
import { BattleType } from "#enums/battle-type";
import { Button } from "#enums/buttons";
import { Challenges } from "#enums/challenges";
import { TypeColor, TypeShadow } from "#enums/color";
import { GameModes } from "#enums/game-modes";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PlayerGender } from "#enums/player-gender";
import { PokemonType } from "#enums/pokemon-type";
import { TextStyle } from "#enums/text-style";
import { TrainerVariant } from "#enums/trainer-variant";
// biome-ignore lint/performance/noNamespaceImport: See `src/system/game-data.ts`
import * as Modifier from "#modifiers/modifier";
import { getLuckString, getLuckTextTint } from "#modifiers/modifier-type";
import { getVariantTint } from "#sprites/variant";
import type { PokemonData } from "#system/pokemon-data";
import { SettingKeyboard } from "#system/settings-keyboard";
import type { RunEntry, SessionSaveData } from "#types/save-data";
import { addBBCodeTextObject, addTextObject, getTextColor, RAINBOW_TINT } from "#ui/text";
import { UiHandler } from "#ui/ui-handler";
import { addWindow } from "#ui/ui-theme";
import { formatFancyLargeNumber, formatLargeNumber, formatMoney, getBiomeName, getPlayTimeString } from "#utils/common";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle";

/**
 * RunInfoUiMode indicates possible overlays of RunInfoUiHandler.
 * MAIN <-- default overlay that can return back to RunHistoryUiHandler + should eventually have its own enum once more pages are added to RunInfoUiHandler
 * HALL_OF_FAME, ENDING_ART, etc. <-- overlays that should return back to MAIN
 */
enum RunInfoUiMode {
  MAIN,
  HALL_OF_FAME,
  ENDING_ART,
}

export enum RunDisplayMode {
  RUN_HISTORY,
  SESSION_PREVIEW,
}

/*
 * Some variables are protected because this UI class will most likely be extended in the future to display more information.
 * These variables will most likely be shared across 'classes' aka pages.
 * I believe that it is possible that the contents/methods of the first page will be placed in their own class that is an extension of RunInfoUiHandler as more pages are added.
 * For now, I leave as is.
 */
export class RunInfoUiHandler extends UiHandler {
  protected runDisplayMode: RunDisplayMode;
  protected runInfo: SessionSaveData;
  protected isVictory: boolean;
  protected pageMode: RunInfoUiMode;
  protected runContainer: Phaser.GameObjects.Container;

  private runResultContainer: Phaser.GameObjects.Container;
  private runInfoContainer: Phaser.GameObjects.Container;
  private partyContainer: Phaser.GameObjects.Container;
  private statsBgWidth: number;

  private hallofFameContainer: Phaser.GameObjects.Container;
  private endCardContainer: Phaser.GameObjects.Container;

  private partyVisibility: boolean;
  private modifiersModule: any;

  public override setup(): void {
    this.runContainer = globalScene.add.container(1, -globalScene.scaledCanvas.height + 1);
    // The import of the modifiers module is loaded here to sidestep `async`/`await` issues.
    this.modifiersModule = Modifier;
    this.runContainer.setVisible(false);
    globalScene.loadImage("encounter_exclaim", "mystery-encounters");
  }

  /**
   * This takes a run's RunEntry and uses the information provided to display essential information about the player's run.
   *
   * This creates these UI objects in order:
   * - A solid-color background used to hide `RunHistoryUiHandler`
   * - Header: Page Title + Option to display items
   * - Run Result Container
   * - Party Container
   * - `this.isVictory === true` --> Hall of Fame Container
   */
  public override show(args: [RunEntry | SessionSaveData, ...any[]]): boolean {
    super.show(args);

    const ui = this.getUi();

    const { height, width } = globalScene.game.canvas;
    const { height: scaledHeight, width: scaledWidth } = globalScene.scaledCanvas;

    const gameStatsBg = globalScene.add //
      .rectangle(0, 0, width, height, 0x006860)
      .setOrigin(0);
    this.runContainer.add(gameStatsBg);

    this.runDisplayMode = args[1];
    if (this.runDisplayMode === RunDisplayMode.RUN_HISTORY) {
      const run = args[0] as RunEntry;
      this.runInfo = globalScene.gameData.parseSessionData(JSON.stringify(run.entry));
      this.isVictory = run.isVictory ?? false; // TODO: is this `??` necessary?
    } else if (this.runDisplayMode === RunDisplayMode.SESSION_PREVIEW) {
      this.runInfo = args[0] as SessionSaveData;
    }

    this.pageMode = RunInfoUiMode.MAIN;

    this.addHeader();

    this.statsBgWidth = (globalScene.scaledCanvas.width - 2) / 3;

    this.runResultContainer = globalScene.add.container(0, 24);
    const runResultWindow = addWindow(0, 0, this.statsBgWidth - 11, 65)
      .setOrigin(0)
      .setName("Run_Result_Window");
    this.runResultContainer.add(runResultWindow);
    if (this.runDisplayMode === RunDisplayMode.RUN_HISTORY) {
      this.parseRunResult();
    } else if (this.runDisplayMode === RunDisplayMode.SESSION_PREVIEW) {
      this.parseRunStatus();
    }

    this.runInfoContainer = globalScene.add.container(0, 89);
    const runInfoWindow = addWindow(0, 0, this.statsBgWidth - 11, 90);
    const runInfoWindowCoords = runInfoWindow.getBottomRight();
    this.runInfoContainer.add(runInfoWindow);
    this.parseRunInfo(runInfoWindowCoords.x, runInfoWindowCoords.y);

    this.partyContainer = globalScene.add.container(this.statsBgWidth - 10, 23);
    this.parsePartyInfo();
    this.showParty(true);

    this.runContainer.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, scaledWidth, scaledHeight),
      Phaser.Geom.Rectangle.Contains,
    );
    ui.bringToTop(this.runContainer);
    this.runContainer.setVisible(true);

    if (this.isVictory) {
      this.createHallofFame();
      ui.bringToTop(this.hallofFameContainer);
    }

    this.setCursor(0);

    ui.add(this.runContainer);

    ui.hideTooltip();

    return true;
  }

  /**
   * Creates and adds the header background, title text, and important buttons to `RunInfoUiHandler`.
   *
   * It checks if the run has items before adding a button for the user to display their party's held items.
   *
   * It does not check if the run has any `PokemonHeldItemModifiers`.
   */
  private addHeader(): void {
    const headerBg = addWindow(0, 0, globalScene.scaledCanvas.width - 2, 24) //
      .setOrigin(0);
    this.runContainer.add(headerBg);

    if (this.runInfo.modifiers.length > 0) {
      const headerBgCoords = headerBg.getTopRight();
      const abilityButtonContainer = globalScene.add.container(0, 0);
      const abilityButtonText = addTextObject(8, 0, i18next.t("runHistory:viewHeldItems"), TextStyle.WINDOW, {
        fontSize: "34px",
      });
      const gamepadType = this.getUi().getGamepadType();
      let abilityButtonElement: Phaser.GameObjects.Sprite;
      if (gamepadType === "touch") {
        abilityButtonElement = new Phaser.GameObjects.Sprite(globalScene, 0, 2, "keyboard", "E.png");
      } else {
        const buttonImage = globalScene.inputController?.getIconForLatestInputRecorded(
          SettingKeyboard.BUTTON_CYCLE_ABILITY,
        );
        abilityButtonElement = new Phaser.GameObjects.Sprite(globalScene, 0, 2, gamepadType, buttonImage);
      }
      abilityButtonContainer
        .add([abilityButtonText, abilityButtonElement])
        .setPosition(headerBgCoords.x - abilityButtonText.displayWidth - abilityButtonElement.displayWidth - 8, 10);
      this.runContainer.add(abilityButtonContainer);
    }
    const headerText = addTextObject(0, 0, i18next.t("runHistory:runInfo"), TextStyle.HEADER_LABEL)
      .setOrigin(0)
      .setPositionRelative(headerBg, 8, 4);
    this.runContainer.add(headerText);
    const runName = addTextObject(0, 0, this.runInfo.name, TextStyle.WINDOW) //
      .setOrigin(0);
    const runNameX = headerText.width / 6 + headerText.x + 4;
    runName.setPositionRelative(headerBg, runNameX, 4);
    this.runContainer.add(runName);
  }

  /**
   * Shows the run's end result.
   * - Victory: The run will display options to allow the player to view the Hall of Fame + Ending Art.
   * - Defeat: The run will show the opposing Pokemon (+ Trainer) that the trainer was defeated by.
   */
  private async parseRunResult(): Promise<void> {
    const genderStr = PlayerGender[settings.general.playerGender];
    const runResultTextStyle = this.isVictory ? TextStyle.PERFECT_IV : TextStyle.SUMMARY_RED;
    const runResultTitle = this.isVictory
      ? i18next.t("runHistory:victory")
      : i18next.t("runHistory:defeated", { context: genderStr });
    const runResultText = addTextObject(
      6,
      5,
      `${runResultTitle} - ${i18next.t("saveSlotSelectUiHandler:wave")} ${this.runInfo.waveIndex}`,
      runResultTextStyle,
      { fontSize: "65px", lineSpacing: 0.1 },
    );

    if (this.isVictory) {
      const hallofFameInstructionContainer = globalScene.add.container(0, 0);
      const shinyButtonText = addTextObject(8, 0, i18next.t("runHistory:viewHallOfFame"), TextStyle.WINDOW, {
        fontSize: "65px",
      });
      const formButtonText = addTextObject(8, 12, i18next.t("runHistory:viewEndingSplash"), TextStyle.WINDOW, {
        fontSize: "65px",
      });

      let gamepadType = this.getUi().getGamepadType();
      let shinyButtonImage = globalScene.inputController?.getIconForLatestInputRecorded(
        SettingKeyboard.BUTTON_CYCLE_SHINY,
      );
      let cycleFormButtonImage = globalScene.inputController?.getIconForLatestInputRecorded(
        SettingKeyboard.BUTTON_CYCLE_FORM,
      );
      if (gamepadType === "touch") {
        gamepadType = "keyboard";
        shinyButtonImage = "R.png";
        cycleFormButtonImage = "F.png";
      }

      const shinyButtonElement = new Phaser.GameObjects.Sprite(globalScene, 0, 4, gamepadType, shinyButtonImage);
      const formButtonElement = new Phaser.GameObjects.Sprite(globalScene, 0, 16, gamepadType, cycleFormButtonImage);

      hallofFameInstructionContainer
        .add([shinyButtonText, shinyButtonElement, formButtonText, formButtonElement])
        .setPosition(12, 25);
      this.runResultContainer.add(hallofFameInstructionContainer);
    }

    this.runResultContainer.add(runResultText);

    if (!this.isVictory) {
      const enemyContainer = globalScene.add.container(0, 0);
      const { battleType, enemyParty, trainer } = this.runInfo;

      if (battleType === BattleType.WILD || (battleType === BattleType.MYSTERY_ENCOUNTER && !trainer)) {
        if (enemyParty.length === 1) {
          this.parseWildSingleDefeat(enemyContainer);
        } else if (enemyParty.length === 2) {
          this.parseWildDoubleDefeat(enemyContainer);
        }
      } else if (battleType === BattleType.TRAINER || (battleType === BattleType.MYSTERY_ENCOUNTER && trainer)) {
        this.parseTrainerDefeat(enemyContainer);
      }
      this.runResultContainer.add(enemyContainer);
    }
    this.runContainer.add(this.runResultContainer);
  }

  /**
   * This function is used when the Run Info UI is used to preview a Session.
   *
   * It edits {@linkcode runResultContainer}, but most importantly it does not display
   * the negative results of a Mystery Encounter or any details of a trainer's party.
   *
   * Trainer Parties are replaced with their sprites, names, and their party size.
   *
   * Mystery Encounters contain sprites associated with MEs + the title of the specific ME.
   */
  private parseRunStatus(): void {
    const { arena, battleType, enemyParty, mysteryEncounterType, trainer, waveIndex } = this.runInfo;

    const enemyContainer = globalScene.add.container(0, 0);
    this.runResultContainer.add(enemyContainer);
    if (battleType === BattleType.WILD) {
      if (enemyParty.length === 1) {
        this.parseWildSingleDefeat(enemyContainer);
      } else if (enemyParty.length === 2) {
        this.parseWildDoubleDefeat(enemyContainer);
      }
    } else if (battleType === BattleType.TRAINER) {
      this.showTrainerSprites(enemyContainer);
      const row_limit = 3;
      enemyParty.forEach((p, i) => {
        const pokeball = globalScene.add
          .sprite(0, 0, "pb")
          .setFrame(getPokeballAtlasKey(p.pokeball))
          .setScale(0.5)
          .setPosition(58 + (i % row_limit) * 8, i <= 2 ? 18 : 25);
        enemyContainer.add(pokeball);
      });
      const trainerObj = trainer.toTrainer();
      const RIVAL_TRAINER_ID_THRESHOLD = 375;
      let trainerName = "";
      if (trainer.trainerType >= RIVAL_TRAINER_ID_THRESHOLD) {
        trainerName =
          trainerObj.variant === TrainerVariant.FEMALE
            ? i18next.t("trainerNames:rivalFemale")
            : i18next.t("trainerNames:rival");
      } else {
        trainerName = trainerObj.getName(0, true);
      }
      const variantKey =
        trainerObj.variant === TrainerVariant.DOUBLE ? "battle:trainerAppearedDouble" : "battle:trainerAppeared";
      const boxString = i18next.t(variantKey, { trainerName }).replace(/\n/g, " ");
      const textBox = addTextObject(0, 0, boxString, TextStyle.WINDOW, { fontSize: "35px", wordWrap: { width: 200 } });
      const descContainer = globalScene.add //
        .container(0, 0)
        .add(textBox)
        .setPosition(55, 32);
      this.runResultContainer.add(descContainer);
    } else if (battleType === BattleType.MYSTERY_ENCOUNTER) {
      const encounterExclaim = globalScene.add //
        .sprite(0, 0, "encounter_exclaim")
        .setPosition(34, 26)
        .setScale(0.65);

      const subSprite = globalScene.add //
        .sprite(56, -106, "pkmn__sub")
        .setScale(0.65)
        .setPosition(34, 46);

      const mysteryEncounterTitle = i18next.t(
        globalScene.getMysteryEncounter(mysteryEncounterType as MysteryEncounterType, true).localizationKey + ":title",
      );
      const textBox = addTextObject(0, 0, mysteryEncounterTitle, TextStyle.WINDOW, {
        fontSize: "45px",
        wordWrap: { width: 160 },
      });
      const descContainer = globalScene.add //
        .container(0, 0)
        .add(textBox)
        .setPosition(47, 37);

      this.runResultContainer.add([encounterExclaim, subSprite, descContainer]);
    }

    const runResultWindow = this.runResultContainer.getByName("Run_Result_Window") as Phaser.GameObjects.Image;
    const windowCenterX = runResultWindow.getTopCenter().x;
    const windowBottomY = runResultWindow.getBottomCenter().y;

    const runStatusText = addTextObject(
      windowCenterX,
      5,
      `${i18next.t("saveSlotSelectUiHandler:wave")} ${waveIndex}`,
      TextStyle.WINDOW,
      { fontSize: "60px", lineSpacing: 0.1 },
    ) //
      .setOrigin(0.5, 0);

    const currentBiomeText = addTextObject(
      windowCenterX,
      windowBottomY - 5,
      `${getBiomeName(arena.biome)}`,
      TextStyle.WINDOW,
      { fontSize: "60px" },
    ) //
      .setOrigin(0.5, 1);

    this.runResultContainer.add([runStatusText, currentBiomeText]);
    this.runContainer.add(this.runResultContainer);
  }

  /**
   * This function is called to edit an enemyContainer to represent a loss from a defeat by a wild single Pokemon battle.
   * @param enemyContainer - container holding enemy visual and level information
   */
  private parseWildSingleDefeat(enemyContainer: Phaser.GameObjects.Container): void {
    const enemyIconContainer = globalScene.add.container(0, 0);
    const enemyData = this.runInfo.enemyParty[0];
    const bossStatus = enemyData.boss;
    // `BattleScene#addPokemonIcon` throws an error if the Pokemon used is a boss (or an enemy?)
    enemyData.boss = false;
    enemyData["player"] = true;
    const enemy = enemyData.toPokemon();
    const enemyIcon = globalScene.addPokemonIcon(enemy, 0, 0, 0, 0);
    const enemyLevel = addTextObject(
      36,
      26,
      `${i18next.t("saveSlotSelectUiHandler:lv")}${formatLargeNumber(enemy.level, 1000)}`,
      bossStatus ? TextStyle.PARTY_RED : TextStyle.PARTY,
      { fontSize: "44px", color: "#f8f8f8" },
    )
      .setShadow()
      .setStroke("#424242", 14)
      .setOrigin(1, 0);
    enemyIconContainer.add([enemyIcon, enemyLevel]);
    enemyContainer //
      .add(enemyIconContainer)
      .setPosition(27, 12);
    enemy.destroy();
  }

  /**
   * This function is called to edit a container to represent a loss from a defeat by a wild double Pokemon battle.
   * @privateRemarks
   * This function and `parseWildSingleDefeat` can technically be merged,
   * but I find it tricky to manipulate the different 'centers' a single battle / double battle container will hold.
   * @param enemyContainer - container holding enemy visuals and level information
   */
  private parseWildDoubleDefeat(enemyContainer: Phaser.GameObjects.Container): void {
    this.runInfo.enemyParty.forEach((enemyData, e) => {
      const enemyIconContainer = globalScene.add.container(0, 0);
      const bossStatus = enemyData.boss;
      // `BattleScene#addPokemonIcon` throws an error if the Pokemon used is a boss (or an enemy?)
      enemyData.boss = false;
      enemyData["player"] = true;
      const enemy = enemyData.toPokemon();
      const enemyIcon = globalScene.addPokemonIcon(enemy, 0, 0, 0, 0);
      const enemyLevel = addTextObject(
        36,
        26,
        `${i18next.t("saveSlotSelectUiHandler:lv")}${formatLargeNumber(enemy.level, 1000)}`,
        bossStatus ? TextStyle.PARTY_RED : TextStyle.PARTY,
        { fontSize: "44px", color: "#f8f8f8" },
      )
        .setShadow()
        .setStroke("#424242", 14)
        .setOrigin(1, 0);
      enemyIconContainer //
        .add([enemyIcon, enemyLevel])
        .setPosition(e * 35, 0);
      enemyContainer.add(enemyIconContainer);
      enemy.destroy();
    });
    enemyContainer.setPosition(8, 14);
  }

  /**
   * This loads the enemy sprites, positions, and scales them according to the current display mode
   * of the `RunInfo` UI and then adds them to the container parameter.
   *
   * Used by {@linkcode parseRunStatus} and {@linkcode parseTrainerDefeat}
   * @param enemyContainer - a Phaser Container that should hold enemy sprites
   */
  private showTrainerSprites(enemyContainer: Phaser.GameObjects.Container): void {
    const tObj = this.runInfo.trainer.toTrainer();
    // Loads trainer assets on demand, as they are not loaded by default in the scene
    tObj.config.loadAssets(this.runInfo.trainer.variant).then(() => {
      const tObjSpriteKey = tObj.config.getSpriteKey(this.runInfo.trainer.variant === TrainerVariant.FEMALE, false);
      const tObjSprite = globalScene.add.sprite(0, 5, tObjSpriteKey);
      if (this.runInfo.trainer.variant === TrainerVariant.DOUBLE && !tObj.config.doubleOnly) {
        const doubleContainer = globalScene.add.container(5, 8);
        tObjSprite.setPosition(-3, -3);
        const tObjPartnerSpriteKey = tObj.config.getSpriteKey(true, true);
        const tObjPartnerSprite = globalScene.add.sprite(5, -3, tObjPartnerSpriteKey);
        // Double Trainers have smaller sprites than Single Trainers
        if (this.runDisplayMode === RunDisplayMode.RUN_HISTORY) {
          tObjPartnerSprite.setScale(0.2);
          tObjSprite.setScale(0.2);
          doubleContainer //
            .add([tObjSprite, tObjPartnerSprite])
            .setPosition(12, 38);
        } else {
          tObjSprite //
            .setScale(0.55)
            .setPosition(-9, -3);
          tObjPartnerSprite.setScale(0.55);
          doubleContainer //
            .add([tObjSprite, tObjPartnerSprite])
            .setPosition(28, 34);
        }
        enemyContainer.add(doubleContainer);
      } else {
        const scale = this.runDisplayMode === RunDisplayMode.RUN_HISTORY ? 0.35 : 0.55;
        const position = this.runDisplayMode === RunDisplayMode.RUN_HISTORY ? [12, 28] : [30, 32];
        tObjSprite //
          .setScale(scale)
          .setPosition(position[0], position[1]);
        enemyContainer.add(tObjSprite);
      }
    });
  }

  /**
   * This edits a container to represent a loss from a defeat by a trainer battle. \
   * The trainers are placed to the left of their party. \
   * Depending on the trainer icon, there may be overlap between the edges of the box or their party.
   *
   * Party Pokemon have their icons, terastalization status, and level shown.
   * @param enemyContainer - container holding enemy visuals and level information
   */
  private parseTrainerDefeat(enemyContainer: Phaser.GameObjects.Container) {
    this.showTrainerSprites(enemyContainer);

    // Creates the Pokemon icons + level information and adds it to enemyContainer
    // 2 Rows x 3 Columns
    const enemyPartyContainer = globalScene.add //
      .container(0, 0)
      .setPosition(25, 15);
    this.runInfo.enemyParty.forEach((enemyData, e) => {
      const pokemonRowHeight = Math.floor(e / 3);
      const enemyIconContainer = globalScene.add.container(0, 0);
      enemyIconContainer.setScale(0.6);
      const isBoss = enemyData.boss;
      // `BattleScene#addPokemonIcon` throws an error if the Pokemon used is a boss (or an enemy?)
      enemyData.boss = false;
      enemyData["player"] = true;
      const enemy = enemyData.toPokemon();
      const enemyIcon = globalScene
        .addPokemonIcon(enemy, 0, 0, 0, 0)
        .setPosition(39 * (e % 3) + 5, 35 * pokemonRowHeight);
      const enemyLevel = addTextObject(
        43 * (e % 3),
        27 * (pokemonRowHeight + 1),
        `${i18next.t("saveSlotSelectUiHandler:lv")}${formatLargeNumber(enemy.level, 1000)}`,
        isBoss ? TextStyle.PARTY_RED : TextStyle.PARTY,
        { fontSize: "54px" },
      )
        .setShadow()
        .setStroke("#424242", 14)
        .setOrigin(0);

      enemyIconContainer.add([enemyIcon, enemyLevel]);
      enemyPartyContainer.add(enemyIconContainer);
      enemy.destroy();
    });
    enemyContainer.add(enemyPartyContainer);
  }

  /**
   * Shows information about the run like the run's mode, duration, luck, money, and player held items.
   *
   * The values for luck and money are from the end of the run, not the player's luck at the start of the run.
   * @privateRemarks
   * Window coordinates used to dynamically position Luck based on its length.
   * @param windowX - X coordinate of the window's bottom right corner
   * @param windowY - Y coordinate of the window's bottom right corner
   */
  private async parseRunInfo(windowX: number, windowY: number) {
    // In the future, parsing Challenges + Challenge Rules may have to be reworked
    // as PokeRogue adds additional challenges and users can stack these challenges in various ways.
    const modeText = addBBCodeTextObject(7, 0, "", TextStyle.WINDOW, { fontSize: "50px", lineSpacing: 3 })
      .setPosition(7, 5)
      .appendText(i18next.t("runHistory:mode") + ": ", false);
    switch (this.runInfo.gameMode) {
      case GameModes.DAILY:
        modeText.appendText(`${i18next.t("gameMode:dailyRun")}`, false);
        break;
      case GameModes.SPLICED_ENDLESS:
        modeText.appendText(`${i18next.t("gameMode:endlessSpliced")}`, false);
        break;
      case GameModes.CHALLENGE: {
        modeText
          .appendText(`${i18next.t("gameMode:challenge")}`, false)
          .appendText(`${i18next.t("runHistory:challengeRules")}: `)
          .setWrapMode("word")
          .setWrapWidth(500);
        const rules: string[] = this.challengeParser();
        if (rules) {
          for (let i = 0; i < rules.length; i++) {
            if (i > 0) {
              modeText.appendText(" + ", false);
            }
            modeText.appendText(rules[i], false);
          }
        }
        break;
      }
      case GameModes.ENDLESS:
        modeText.appendText(`${i18next.t("gameMode:endless")}`, false);
        break;
      case GameModes.CLASSIC:
        modeText.appendText(`${i18next.t("gameMode:classic")}`, false);
        break;
    }

    // If the player achieves a personal best in Endless,
    // the mode text will be tinted similarly to SSS luck to celebrate their achievement.
    if (
      (this.runInfo.gameMode === GameModes.ENDLESS || this.runInfo.gameMode === GameModes.SPLICED_ENDLESS)
      && this.runInfo.waveIndex === globalScene.gameData.gameStats.highestEndlessWave
    ) {
      modeText.appendText(` [${i18next.t("runHistory:personalBest")}]`);
      modeText.setTint(...RAINBOW_TINT);
    }

    const runTime = getPlayTimeString(this.runInfo.playTime);
    const runMoney = formatMoney(settings.display.moneyFormat, this.runInfo.money);
    const moneyTextColor = getTextColor(TextStyle.MONEY_WINDOW, false);
    const runInfoText = addBBCodeTextObject(7, 0, "", TextStyle.WINDOW, { fontSize: "50px", lineSpacing: 3 }) //
      .appendText(`${i18next.t("runHistory:runLength")}: ${runTime}`, false)
      .appendText(
        `[color=${moneyTextColor}]${i18next.t("battleScene:moneyOwned", { formattedMoney: runMoney })}[/color]`,
      )
      .setPosition(7, 70);
    const runInfoTextContainer = globalScene.add //
      .container(0, 0)
      .add(runInfoText);

    const luckText = addBBCodeTextObject(0, 0, "", TextStyle.WINDOW, { fontSize: "55px" });
    const luckValue = Phaser.Math.Clamp(
      this.runInfo.party.map(p => p.toPokemon().getLuck()).reduce((total, v) => total + v, 0),
      0,
      14,
    );
    let luckInfo = i18next.t("runHistory:luck") + ": " + getLuckString(luckValue);
    if (luckValue < 14) {
      luckInfo = "[color=#" + getLuckTextTint(luckValue).toString(16) + "]" + luckInfo + "[/color]";
    } else {
      luckText.setTint(...RAINBOW_TINT);
    }
    luckText
      .appendText("[align=right]" + luckInfo + "[/align]", false)
      .setPosition(windowX - luckText.displayWidth - 5, windowY - 13);
    runInfoTextContainer.add(luckText);

    // A max of 20 items can be displayed. A + sign will be added
    // if the run's held items pushes past this maximum to show the user that there are more.
    if (this.runInfo.modifiers.length > 0) {
      let visibleModifierIndex = 0;

      const modifierIconsContainer = globalScene.add
        .container(8, this.runInfo.gameMode === GameModes.CHALLENGE ? 20 : 15)
        .setScale(0.45);
      for (const m of this.runInfo.modifiers) {
        const modifier = m.toModifier(this.modifiersModule[m.className]);
        if (modifier instanceof Modifier.PokemonHeldItemModifier) {
          continue;
        }

        const icon = modifier?.getIcon(false);
        if (icon) {
          const rowHeightModifier = Math.floor(visibleModifierIndex / 7);
          icon.setPosition(24 * (visibleModifierIndex % 7), 20 + 35 * rowHeightModifier);
          modifierIconsContainer.add(icon);
        }

        if (++visibleModifierIndex === 20) {
          const maxItems = addTextObject(45, 90, "+", TextStyle.WINDOW) //
            .setPositionRelative(modifierIconsContainer, 70, 45);
          this.runInfoContainer.add(maxItems);
          break;
        }
      }
      this.runInfoContainer.add(modifierIconsContainer);
    }

    this.runInfoContainer.add([modeText, runInfoTextContainer]);
    this.runContainer.add(this.runInfoContainer);
  }

  /**
   * This function parses the Challenges section of the Run Entry and returns a list of active challenge.
   * @returns An array of active challenge names
   */
  private challengeParser(): string[] {
    const challenges: string[] = [];
    for (const chal of this.runInfo.challenges) {
      if (chal.value === 0) {
        continue;
      }

      switch (chal.id) {
        case Challenges.SINGLE_GENERATION:
          challenges.push(i18next.t(`runHistory:challengeMonoGen${chal.value}`));
          break;
        case Challenges.SINGLE_TYPE: {
          const pokemonTypeName = PokemonType[chal.value - 1];
          const typeText =
            `[color=${TypeColor[pokemonTypeName]}]`
            + `[shadow=${TypeShadow[pokemonTypeName]}]`
            + i18next.t(`pokemonInfo:type.${toCamelCase(pokemonTypeName)}`)
            + "[/color][/shadow]";
          challenges.push(typeText);
          break;
        }
        case Challenges.INVERSE_BATTLE:
          challenges.push(i18next.t("challenges:inverseBattle.shortName"));
          break;
        default:
          challenges.push(i18next.t(`challenges:${toCamelCase(Challenges[chal.id])}.name`));
          break;
      }
    }
    return challenges;
  }

  /**
   * Parses and displays the run's player party.
   *
   * Default Information: Icon, Level, Nature, Ability, Passive, Shiny Status, Fusion Status, Stats, and Moves.
   *
   * B-Side Information: Icon + Held Items (Can be displayed to the user through pressing the abilityButton)
   */
  private parsePartyInfo(): void {
    const ui = this.getUi();

    const party = this.runInfo.party;
    const currentLanguage = i18next.resolvedLanguage ?? "en";
    const windowHeight = (globalScene.scaledCanvas.height - 23) / 6;

    party.forEach((p: PokemonData, idx: number) => {
      const pokemonInfoWindow = new RoundRectangle(globalScene, 0, 14, this.statsBgWidth * 2 + 10, windowHeight - 2, 3);

      const pokemon = p.toPokemon();
      const pokemonInfoContainer = globalScene.add.container(this.statsBgWidth + 5, (windowHeight - 0.5) * idx);

      const types = pokemon.getTypes();
      const type1 = getTypeRgb(types[0]);
      const type1Color = new Phaser.Display.Color(type1[0], type1[1], type1[2]);

      const bgColor = type1Color.clone().darken(45);
      pokemonInfoWindow.setFillStyle(bgColor.color);

      const icon = globalScene
        .addPokemonIcon(pokemon, 0, 0, 0, 0) //
        .setScale(0.75)
        .setPosition(-99, 1);
      const iconContainer = globalScene.add //
        .container(0, 0)
        .add(icon);

      if (types[1]) {
        const type2 = getTypeRgb(types[1]);
        const type2Color = new Phaser.Display.Color(type2[0], type2[1], type2[2]);
        pokemonInfoWindow.setStrokeStyle(1, type2Color.color, 0.95);
      } else {
        pokemonInfoWindow.setStrokeStyle(1, type1Color.color, 0.95);
      }

      ui.bringToTop(icon);

      // Contains Name, Level + Nature, Ability, Passive
      const pokeInfoTextContainer = globalScene.add //
        .container(-85, 3.5)
        .setName("PkmnInfoText");
      const fontSize = "34px";
      const lineSpacing = 3;
      // This checks if the Pokemon's nature has been overwritten during the run and displays the change accurately
      const pNature = pokemon.getNature();
      const pNatureName = getNatureName(pNature);
      const pName = pokemon.getNameToRender();
      // With the exception of Korean and Traditional/Simplified Chinese,
      // the code shortens the terms for ability and passive to their first letter.
      // These languages are exempted because they are already short enough.
      const exemptedLanguages = ["ko", "zh_CN", "zh_TW"];
      let passiveLabel = i18next.t("starterSelectUiHandler:passive");
      let abilityLabel = i18next.t("starterSelectUiHandler:ability");
      if (!exemptedLanguages.includes(currentLanguage)) {
        passiveLabel = passiveLabel.charAt(0);
        abilityLabel = abilityLabel.charAt(0);
      }
      const pPassiveInfo = pokemon.passive ? `${passiveLabel}: ${pokemon.getPassiveAbility().name}` : "";
      const pAbilityInfo = `${abilityLabel}: ${pokemon.getAbility(true).name}`;
      const pokeInfoText = addBBCodeTextObject(0, 0, pName, TextStyle.SUMMARY, { fontSize, lineSpacing: 3 })
        .appendText(
          `${i18next.t("saveSlotSelectUiHandler:lv")}${formatFancyLargeNumber(pokemon.level, 1)} - ${pNatureName}`,
        )
        .appendText(pAbilityInfo)
        .appendText(pPassiveInfo);
      pokeInfoTextContainer.add(pokeInfoText);

      // Pokemon Stats
      // Colored Arrows (Red/Blue) are placed by stats that are boosted from natures
      const pokeStatTextContainer = globalScene.add //
        .container(-35, 6)
        .setName("PkmnStatsText");
      const pStats: string[] = [];
      pokemon.stats.forEach(element => pStats.push(formatFancyLargeNumber(element, 1)));
      for (let i = 0; i < pStats.length; i++) {
        const statMult = getNatureStatMultiplier(pNature, i);
        if (statMult < 1) {
          pStats[i] += "[color=#40c8f8]↓[/color]";
        } else if (statMult > 1) {
          pStats[i] += "[color=#f89890]↑[/color]";
        }
      }
      const hp = i18next.t("pokemonInfo:stat.hpShortened") + ": " + pStats[0];
      const atk = i18next.t("pokemonInfo:stat.atkShortened") + ": " + pStats[1];
      const def = i18next.t("pokemonInfo:stat.defShortened") + ": " + pStats[2];
      const spatk = i18next.t("pokemonInfo:stat.spatkShortened") + ": " + pStats[3];
      const spdef = i18next.t("pokemonInfo:stat.spdefShortened") + ": " + pStats[4];
      const speed = i18next.t("pokemonInfo:stat.spdShortened") + ": " + pStats[5];
      // Column 1: HP Atk Def
      const pokeStatText1 = addBBCodeTextObject(-5, 0, hp, TextStyle.SUMMARY, { fontSize, lineSpacing })
        .appendText(atk)
        .appendText(def);
      pokeStatTextContainer.add(pokeStatText1);
      // Column 2: SpAtk SpDef Speed
      const pokeStatText2 = addBBCodeTextObject(25, 0, spatk, TextStyle.SUMMARY, { fontSize, lineSpacing })
        .appendText(spdef)
        .appendText(speed);
      pokeStatTextContainer.add(pokeStatText2);

      // Shiny + Fusion Status
      const marksContainer = globalScene.add //
        .container(0, 0)
        .setName("PkmnMarks");
      if (pokemon.fusionSpecies) {
        const splicedIcon = globalScene.add
          .image(0, 0, "icon_spliced")
          .setScale(0.35)
          .setOrigin(0, 0)
          .setPositionRelative(pokeInfoTextContainer, pokemon.isShiny() ? 35 : 28, 0);
        marksContainer.add(splicedIcon);
        ui.bringToTop(splicedIcon);
      }
      if (pokemon.isShiny()) {
        const doubleShiny = pokemon.isFusion() && pokemon.shiny && pokemon.fusionShiny;
        const shinyStar = globalScene.add
          .image(0, 0, `shiny_star_small${doubleShiny ? "_1" : ""}`)
          .setOrigin(0)
          .setScale(0.65)
          .setPositionRelative(pokeInfoTextContainer, 28, 0)
          .setTint(getVariantTint(doubleShiny ? pokemon.variant : pokemon.getVariant()));
        marksContainer.add(shinyStar);
        ui.bringToTop(shinyStar);
        if (doubleShiny) {
          const fusionShinyStar = globalScene.add
            .image(0, 0, "shiny_star_small_2")
            .setOrigin(0)
            .setScale(0.5)
            .setPosition(shinyStar.x + 1, shinyStar.y + 1)
            .setTint(getVariantTint(pokemon.fusionVariant));
          marksContainer.add(fusionShinyStar);
          ui.bringToTop(fusionShinyStar);
        }
      }

      // Need to check for dynamically typed moves <-- is this a "todo"??
      const pokemonMoveset = pokemon.getMoveset(true);
      const movesetContainer = globalScene.add //
        .container(70, -29)
        .setName("PkmnMoves");
      const pokemonMoveBgs: Phaser.GameObjects.NineSlice[] = [];
      const pokemonMoveLabels: Phaser.GameObjects.Text[] = [];
      const movePos = [
        [-6.5, 35.5],
        [37, 35.5],
        [-6.5, 43.5],
        [37, 43.5],
      ];
      for (let m = 0; m < pokemonMoveset.length; m++) {
        const moveContainer = globalScene.add //
          .container(movePos[m][0], movePos[m][1])
          .setScale(0.5);
        const moveBg = globalScene.add //
          .nineslice(0, 0, "type_bgs", "unknown", 85, 15, 2, 2, 2, 2)
          .setOrigin(1, 0);
        const moveLabel = addTextObject(-moveBg.width / 2, 1, "-", TextStyle.MOVE_LABEL)
          .setOrigin(0.5, 0)
          .setName("text-move-label");
        pokemonMoveBgs.push(moveBg);
        pokemonMoveLabels.push(moveLabel);
        moveContainer.add([moveBg, moveLabel]);
        movesetContainer.add(moveContainer);
        const move = pokemonMoveset[m].getMove();
        pokemonMoveBgs[m].setFrame(PokemonType[move.type].toString().toLowerCase());
        pokemonMoveLabels[m].setText(move.name);
      }

      // Pokemon Held Items - not displayed by default
      // Endless/Endless Spliced have a different scale because Pokemon tend to accumulate more items in these runs.
      const heldItemsScale =
        this.runInfo.gameMode === GameModes.SPLICED_ENDLESS || this.runInfo.gameMode === GameModes.ENDLESS ? 0.25 : 0.5;
      const heldItemsContainer = globalScene.add //
        .container(-82, 2)
        .setName("heldItems")
        .setVisible(false);
      const heldItemsList: Modifier.PokemonHeldItemModifier[] = [];
      if (this.runInfo.modifiers.length > 0) {
        for (const m of this.runInfo.modifiers) {
          const modifier = m.toModifier(this.modifiersModule[m.className]);
          if (modifier instanceof Modifier.PokemonHeldItemModifier && modifier.pokemonId === pokemon.id) {
            modifier.stackCount = m["stackCount"];
            heldItemsList.push(modifier);
          }
        }
        if (heldItemsList.length > 0) {
          (heldItemsList as Modifier.PokemonHeldItemModifier[]).sort(Modifier.modifierSortFunc);
          let row = 0;
          for (const [index, item] of heldItemsList.entries()) {
            if (index > 36) {
              const overflowIcon = addTextObject(182, 4, "+", TextStyle.WINDOW);
              heldItemsContainer.add(overflowIcon);
              break;
            }
            const itemIcon = item //
              .getIcon(true)
              .setScale(heldItemsScale)
              .setPosition((index % 19) * 10, row * 10);
            if (
              item.stackCount < item.getMaxHeldItemCount(pokemon)
              && itemIcon.list[1] instanceof Phaser.GameObjects.BitmapText
            ) {
              itemIcon.list[1].clearTint();
            }
            heldItemsContainer.add(itemIcon);
            if (index !== 0 && index % 18 === 0) {
              row++;
            }
          }
        }
      }

      pokemonInfoContainer
        .add([
          pokemonInfoWindow,
          iconContainer,
          marksContainer,
          movesetContainer,
          pokeInfoTextContainer,
          pokeStatTextContainer,
          heldItemsContainer,
        ])
        .setName("PkmnInfo");
      this.partyContainer.add(pokemonInfoContainer);
      pokemon.destroy();
    });
    this.runContainer.add(this.partyContainer);
  }

  /**
   * Changes what is displayed of the Pokemon's held items
   * @param defaultInfo - Whether to show the Pokemon's default information (`true`) or held items (`false`)
   */
  private showParty(defaultInfo: boolean): void {
    const partyContainers = this.partyContainer.getAll<Phaser.GameObjects.Container>("name", "PkmnInfo");
    const objects = ["PkmnMoves", "PkmnInfoText", "PkmnStatsText", "PkmnMarks"] as const;
    for (const c of partyContainers) {
      for (const obj of objects) {
        c.getByName<Phaser.GameObjects.Container>(obj).setVisible(defaultInfo);
      }
      c.getByName<Phaser.GameObjects.Container>("heldItems").setVisible(!defaultInfo);
    }
    this.partyVisibility = defaultInfo;
  }

  /** Shows the ending art. */
  private createVictorySplash(): void {
    this.endCardContainer = globalScene.add.container(0, 0);
    const endCard = globalScene.add //
      .image(0, 0, `end_${settings.isPlayerFemale ? "f" : "m"}`)
      .setOrigin(0)
      .setScale(0.5);
    const text = addTextObject(
      globalScene.scaledCanvas.width / 2,
      globalScene.scaledCanvas.height - 16,
      i18next.t("battle:congratulations"),
      TextStyle.SUMMARY,
      { fontSize: "128px" },
    ) //
      .setOrigin(0.5);
    this.endCardContainer.add([endCard, text]);
  }

  /** This creates a hall of fame image for the player to view. */
  private createHallofFame(): void {
    const genderStr = PlayerGender[settings.general.playerGender].toLowerCase();
    // Issue Note (08-05-2024): It seems as if fused pokemon do not appear with the averaged color b/c pokemonData's loadAsset requires there to be some active battle?
    // As an alternative, the icons of the second/bottom fused Pokemon have been placed next to their fellow fused Pokemon in Hall of Fame
    const endCard = globalScene.add
      .image(0, 0, `end_${settings.isPlayerFemale ? "f" : "m"}`)
      .setOrigin(0)
      .setPosition(-1, -1)
      .setScale(0.5);
    const endCardCoords = endCard.getBottomCenter();
    const hallofFameBg = globalScene.add
      .image(0, 0, "hall_of_fame_" + settings.isPlayerFemale ? "red" : "blue")
      .setPosition(159, 89)
      .setSize(globalScene.game.canvas.width, globalScene.game.canvas.height + 10)
      .setAlpha(0.8);
    this.hallofFameContainer = globalScene.add //
      .container(0, 0)
      .add([endCard, hallofFameBg]);

    const hallofFameText = addTextObject(
      0,
      0,
      i18next.t("runHistory:hallofFameText", { context: genderStr }),
      TextStyle.WINDOW,
    );
    hallofFameText.setPosition(endCardCoords.x - hallofFameText.displayWidth / 2, 164);
    this.runInfo.party.forEach((p, i) => {
      const pkmn = p.toPokemon();
      const species = pkmn.getSpeciesForm();
      const row = i % 2;
      const { formIndex, shiny, variant } = pkmn;
      const pokemonSprite = globalScene.add
        .sprite(60 + 40 * i, 40 + row * 80, "pkmn__sub")
        .setPipeline(globalScene.spritePipeline, { tone: [0.0, 0.0, 0.0, 0.0], ignoreTimeTint: true });
      this.hallofFameContainer.add([hallofFameText, pokemonSprite]);

      const female = pkmn.gender === 1;
      species.loadAssets(female, formIndex, shiny, variant, true).then(() => {
        pokemonSprite
          .play(species.getSpriteKey(female, formIndex, shiny, variant))
          .setPipelineData("shiny", shiny)
          .setPipelineData("variant", variant)
          .setPipelineData("spriteKey", species.getSpriteKey(female, formIndex, shiny, variant))
          .setVisible(true);
      });
      if (pkmn.isFusion()) {
        const fusionIcon = globalScene.add
          .sprite(80 + 40 * i, 50 + row * 80, pkmn.getFusionIconAtlasKey())
          .setName("sprite-fusion-icon")
          .setOrigin(0.5, 0)
          .setFrame(pkmn.getFusionIconId(true));
        this.hallofFameContainer.add(fusionIcon);
      }
      pkmn.destroy();
    });
    this.hallofFameContainer.setVisible(false);
    this.runContainer.add(this.hallofFameContainer);
  }

  public override processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    switch (button) {
      case Button.CANCEL:
      case Button.LEFT:
        success = true;
        if (this.pageMode === RunInfoUiMode.MAIN) {
          this.runInfoContainer.removeAll(true);
          this.runResultContainer.removeAll(true);
          this.partyContainer.removeAll(true);
          this.runContainer.removeAll(true);
          if (this.isVictory) {
            this.hallofFameContainer.removeAll(true);
          }
          super.clear();
          this.runContainer.setVisible(false);
          ui.revertMode();
        } else if (this.pageMode === RunInfoUiMode.HALL_OF_FAME) {
          this.hallofFameContainer.setVisible(false);
          this.pageMode = RunInfoUiMode.MAIN;
        } else if (this.pageMode === RunInfoUiMode.ENDING_ART) {
          this.endCardContainer.setVisible(false);
          this.runContainer.remove(this.endCardContainer);
          this.pageMode = RunInfoUiMode.MAIN;
        }
        break;
      case Button.CYCLE_FORM:
        this.inputCycleForm();
        break;
      case Button.CYCLE_SHINY:
        this.inputCycleShiny();
        break;
      case Button.CYCLE_ABILITY:
        this.inputCycleAbility();
        break;
    }

    if (success) {
      ui.playSelect();
    }
    return success;
  }

  private inputCycleForm(): void {
    if (this.isVictory && this.pageMode !== RunInfoUiMode.HALL_OF_FAME) {
      if (this.endCardContainer.visible) {
        this.endCardContainer.setVisible(false);
        this.runContainer.remove(this.endCardContainer);
        this.pageMode = RunInfoUiMode.MAIN;
      } else {
        this.createVictorySplash();
        this.endCardContainer.setVisible(true);
        this.runContainer.add(this.endCardContainer);
        this.pageMode = RunInfoUiMode.ENDING_ART;
      }
    }
  }

  private inputCycleShiny(): void {
    if (this.isVictory && this.pageMode !== RunInfoUiMode.ENDING_ART) {
      if (this.hallofFameContainer.visible) {
        this.hallofFameContainer.setVisible(false);
        this.pageMode = RunInfoUiMode.MAIN;
      } else {
        this.hallofFameContainer.setVisible(true);
        this.pageMode = RunInfoUiMode.HALL_OF_FAME;
      }
    }
  }

  private inputCycleAbility(): void {
    if (this.runInfo.modifiers.length > 0 && this.pageMode === RunInfoUiMode.MAIN) {
      if (this.partyVisibility) {
        this.showParty(false);
      } else {
        this.showParty(true);
      }
    }
  }
}
