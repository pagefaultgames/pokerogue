import { globalScene } from "#app/global-scene";
import { getBiomeName } from "#balance/biomes";
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
import type { SpeciesId } from "#enums/species-id";
import { TextStyle } from "#enums/text-style";
import { TrainerVariant } from "#enums/trainer-variant";
import { UiMode } from "#enums/ui-mode";
// biome-ignore lint/performance/noNamespaceImport: See `src/system/game-data.ts`
import * as Modifier from "#modifiers/modifier";
import { getLuckString, getLuckTextTint } from "#modifiers/modifier-type";
import { getVariantTint } from "#sprites/variant";
import type { SessionSaveData } from "#system/game-data";
import type { PokemonData } from "#system/pokemon-data";
import { SettingKeyboard } from "#system/settings-keyboard";
import { UiHandler } from "#ui/handlers/ui-handler";
import { addBBCodeTextObject, addTextObject, getTextColor } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import { formatFancyLargeNumber, formatLargeNumber, formatMoney, getPlayTimeString } from "#utils/common";
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

/**
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

  constructor() {
    super(UiMode.RUN_INFO);
  }

  override async setup() {
    this.runContainer = globalScene.add.container(1, -globalScene.scaledCanvas.height + 1);
    // The import of the modifiersModule is loaded here to sidestep async/await issues.
    this.modifiersModule = Modifier;
    this.runContainer.setVisible(false);
    globalScene.loadImage("encounter_exclaim", "mystery-encounters");
  }

  /**
   * This takes a run's RunEntry and uses the information provided to display essential information about the player's run.
   * @param args[0] : a RunEntry object
   *
   * show() creates these UI objects in order -
   * A solid-color background used to hide RunHistoryUiHandler
   * Header: Page Title + Option to Display Modifiers
   * Run Result Container:
   * Party Container:
   * this.isVictory === true --> Hall of Fame Container:
   */
  override show(args: any[]): boolean {
    super.show(args);

    const gameStatsBg = globalScene.add.rectangle(
      0,
      0,
      globalScene.game.canvas.width,
      globalScene.game.canvas.height,
      0x006860,
    );
    gameStatsBg.setOrigin(0, 0);
    this.runContainer.add(gameStatsBg);

    const run = args[0];
    this.runDisplayMode = args[1];
    if (this.runDisplayMode === RunDisplayMode.RUN_HISTORY) {
      this.runInfo = globalScene.gameData.parseSessionData(JSON.stringify(run.entry));
      this.isVictory = run.isVictory ?? false;
    } else if (this.runDisplayMode === RunDisplayMode.SESSION_PREVIEW) {
      this.runInfo = args[0];
    }
    // Assigning information necessary for the UI's creation

    this.pageMode = RunInfoUiMode.MAIN;

    // Creates Header and adds to this.runContainer
    this.addHeader();

    this.statsBgWidth = (globalScene.scaledCanvas.width - 2) / 3;

    // Creates Run Result Container
    this.runResultContainer = globalScene.add.container(0, 24);
    const runResultWindow = addWindow(0, 0, this.statsBgWidth - 11, 65);
    runResultWindow.setOrigin(0, 0);
    runResultWindow.setName("Run_Result_Window");
    this.runResultContainer.add(runResultWindow);
    if (this.runDisplayMode === RunDisplayMode.RUN_HISTORY) {
      this.parseRunResult();
    } else if (this.runDisplayMode === RunDisplayMode.SESSION_PREVIEW) {
      this.parseRunStatus();
    }

    // Creates Run Info Container
    this.runInfoContainer = globalScene.add.container(0, 89);
    const runInfoWindow = addWindow(0, 0, this.statsBgWidth - 11, 90);
    const runInfoWindowCoords = runInfoWindow.getBottomRight();
    this.runInfoContainer.add(runInfoWindow);
    this.parseRunInfo(runInfoWindowCoords.x, runInfoWindowCoords.y);

    // Creates Player Party Container
    this.partyContainer = globalScene.add.container(this.statsBgWidth - 10, 23);
    this.parsePartyInfo();
    this.showParty(true);

    this.runContainer.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, globalScene.scaledCanvas.width, globalScene.scaledCanvas.height),
      Phaser.Geom.Rectangle.Contains,
    );
    this.getUi().bringToTop(this.runContainer);
    this.runContainer.setVisible(true);

    // Creates Hall of Fame if the run entry contains a victory
    if (this.isVictory) {
      this.createHallofFame();
      this.getUi().bringToTop(this.hallofFameContainer);
    }

    this.setCursor(0);

    this.getUi().add(this.runContainer);

    this.getUi().hideTooltip();

    return true;
  }

  /**
   * Creates and adds the header background, title text, and important buttons to RunInfoUiHandler
   * It does check if the run has modifiers before adding a button for the user to display their party's held items
   * It does not check if the run has any PokemonHeldItemModifiers though.
   */
  private addHeader() {
    const headerBg = addWindow(0, 0, globalScene.scaledCanvas.width - 2, 24);
    headerBg.setOrigin(0, 0);
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
        abilityButtonElement = new Phaser.GameObjects.Sprite(
          globalScene,
          0,
          2,
          gamepadType,
          globalScene.inputController?.getIconForLatestInputRecorded(SettingKeyboard.Button_Cycle_Ability),
        );
      }
      abilityButtonContainer.add([abilityButtonText, abilityButtonElement]);
      abilityButtonContainer.setPosition(
        headerBgCoords.x - abilityButtonText.displayWidth - abilityButtonElement.displayWidth - 8,
        10,
      );
      this.runContainer.add(abilityButtonContainer);
    }
    const headerText = addTextObject(0, 0, i18next.t("runHistory:runInfo"), TextStyle.HEADER_LABEL);
    headerText.setOrigin(0, 0);
    headerText.setPositionRelative(headerBg, 8, 4);
    this.runContainer.add(headerText);
    const runName = addTextObject(0, 0, this.runInfo.name, TextStyle.WINDOW);
    runName.setOrigin(0, 0);
    const runNameX = headerText.width / 6 + headerText.x + 4;
    runName.setPositionRelative(headerBg, runNameX, 4);
    this.runContainer.add(runName);
  }

  /**
   * Shows the run's end result
   *
   * Victory : The run will display options to allow the player to view the Hall of Fame + Ending Art
   * Defeat : The run will show the opposing Pokemon (+ Trainer) that the trainer was defeated by.
   * Defeat can call either parseWildSingleDefeat(), parseWildDoubleDefeat(), or parseTrainerDefeat()
   *
   */
  private async parseRunResult() {
    const genderIndex = globalScene.gameData.gender ?? PlayerGender.UNSET;
    const genderStr = PlayerGender[genderIndex];
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
      const gamepadType = this.getUi().getGamepadType();
      let shinyButtonElement: Phaser.GameObjects.Sprite;
      let formButtonElement: Phaser.GameObjects.Sprite;
      if (gamepadType === "touch") {
        shinyButtonElement = new Phaser.GameObjects.Sprite(globalScene, 0, 4, "keyboard", "R.png");
        formButtonElement = new Phaser.GameObjects.Sprite(globalScene, 0, 16, "keyboard", "F.png");
      } else {
        shinyButtonElement = new Phaser.GameObjects.Sprite(
          globalScene,
          0,
          4,
          gamepadType,
          globalScene.inputController?.getIconForLatestInputRecorded(SettingKeyboard.Button_Cycle_Shiny),
        );
        formButtonElement = new Phaser.GameObjects.Sprite(
          globalScene,
          0,
          16,
          gamepadType,
          globalScene.inputController?.getIconForLatestInputRecorded(SettingKeyboard.Button_Cycle_Form),
        );
      }
      hallofFameInstructionContainer.add([shinyButtonText, shinyButtonElement]);

      hallofFameInstructionContainer.add([formButtonText, formButtonElement]);

      hallofFameInstructionContainer.setPosition(12, 25);
      this.runResultContainer.add(hallofFameInstructionContainer);
    }

    this.runResultContainer.add(runResultText);

    if (!this.isVictory) {
      const enemyContainer = globalScene.add.container(0, 0);
      // Wild - Single and Doubles
      if (
        this.runInfo.battleType === BattleType.WILD
        || (this.runInfo.battleType === BattleType.MYSTERY_ENCOUNTER && !this.runInfo.trainer)
      ) {
        switch (this.runInfo.enemyParty.length) {
          case 1:
            // Wild - Singles
            this.parseWildSingleDefeat(enemyContainer);
            break;
          case 2:
            //Wild - Doubles
            this.parseWildDoubleDefeat(enemyContainer);
            break;
        }
      } else if (
        this.runInfo.battleType === BattleType.TRAINER
        || (this.runInfo.battleType === BattleType.MYSTERY_ENCOUNTER && this.runInfo.trainer)
      ) {
        this.parseTrainerDefeat(enemyContainer);
      }
      this.runResultContainer.add(enemyContainer);
    }
    this.runContainer.add(this.runResultContainer);
  }

  /**
   * This function is used when the Run Info UI is used to preview a Session.
   * It edits {@linkcode runResultContainer}, but most importantly - does not display the negative results of a Mystery Encounter or any details of a trainer's party.
   * Trainer Parties are replaced with their sprites, names, and their party size.
   * Mystery Encounters contain sprites associated with MEs + the title of the specific ME.
   */
  private parseRunStatus() {
    const enemyContainer = globalScene.add.container(0, 0);
    this.runResultContainer.add(enemyContainer);
    if (this.runInfo.battleType === BattleType.WILD) {
      if (this.runInfo.enemyParty.length === 1) {
        this.parseWildSingleDefeat(enemyContainer);
      } else if (this.runInfo.enemyParty.length === 2) {
        this.parseWildDoubleDefeat(enemyContainer);
      }
    } else if (this.runInfo.battleType === BattleType.TRAINER) {
      this.showTrainerSprites(enemyContainer);
      const row_limit = 3;
      this.runInfo.enemyParty.forEach((p, i) => {
        const pokeball = globalScene.add.sprite(0, 0, "pb");
        pokeball.setFrame(getPokeballAtlasKey(p.pokeball));
        pokeball.setScale(0.5);
        pokeball.setPosition(58 + (i % row_limit) * 8, i <= 2 ? 18 : 25);
        enemyContainer.add(pokeball);
      });
      const trainerObj = this.runInfo.trainer.toTrainer();
      const RIVAL_TRAINER_ID_THRESHOLD = 375;
      let trainerName = "";
      if (this.runInfo.trainer.trainerType >= RIVAL_TRAINER_ID_THRESHOLD) {
        trainerName =
          trainerObj.variant === TrainerVariant.FEMALE
            ? i18next.t("trainerNames:rivalFemale")
            : i18next.t("trainerNames:rival");
      } else {
        trainerName = trainerObj.getName(0, true);
      }
      const boxString = i18next
        .t(trainerObj.variant !== TrainerVariant.DOUBLE ? "battle:trainerAppeared" : "battle:trainerAppearedDouble", {
          trainerName,
        })
        .replace(/\n/g, " ");
      const descContainer = globalScene.add.container(0, 0);
      const textBox = addTextObject(0, 0, boxString, TextStyle.WINDOW, {
        fontSize: "35px",
        wordWrap: { width: 200 },
      });
      descContainer.add(textBox);
      descContainer.setPosition(55, 32);
      this.runResultContainer.add(descContainer);
    } else if (this.runInfo.battleType === BattleType.MYSTERY_ENCOUNTER) {
      const encounterExclaim = globalScene.add.sprite(0, 0, "encounter_exclaim");
      encounterExclaim.setPosition(34, 26);
      encounterExclaim.setScale(0.65);
      const subSprite = globalScene.add.sprite(56, -106, "pkmn__sub");
      subSprite.setScale(0.65);
      subSprite.setPosition(34, 46);
      const mysteryEncounterTitle = i18next.t(
        globalScene.getMysteryEncounter(this.runInfo.mysteryEncounterType as MysteryEncounterType, true).localizationKey
          + ":title",
      );
      const descContainer = globalScene.add.container(0, 0);
      const textBox = addTextObject(0, 0, mysteryEncounterTitle, TextStyle.WINDOW, {
        fontSize: "45px",
        wordWrap: { width: 160 },
      });
      descContainer.add(textBox);
      descContainer.setPosition(47, 37);
      this.runResultContainer.add([encounterExclaim, subSprite, descContainer]);
    }

    const runResultWindow = this.runResultContainer.getByName("Run_Result_Window") as Phaser.GameObjects.Image;
    const windowCenterX = runResultWindow.getTopCenter().x;
    const windowBottomY = runResultWindow.getBottomCenter().y;

    const runStatusText = addTextObject(
      windowCenterX,
      5,
      `${i18next.t("saveSlotSelectUiHandler:wave")} ${this.runInfo.waveIndex}`,
      TextStyle.WINDOW,
      { fontSize: "60px", lineSpacing: 0.1 },
    );
    runStatusText.setOrigin(0.5, 0);

    const currentBiomeText = addTextObject(
      windowCenterX,
      windowBottomY - 5,
      `${getBiomeName(this.runInfo.arena.biome)}`,
      TextStyle.WINDOW,
      { fontSize: "60px" },
    );
    currentBiomeText.setOrigin(0.5, 1);

    this.runResultContainer.add([runStatusText, currentBiomeText]);
    this.runContainer.add(this.runResultContainer);
  }

  /**
   * This function is called to edit an enemyContainer to represent a loss from a defeat by a wild single Pokemon battle.
   * @param enemyContainer - container holding enemy visual and level information
   */
  private parseWildSingleDefeat(enemyContainer: Phaser.GameObjects.Container) {
    const enemyIconContainer = globalScene.add.container(0, 0);
    const enemyData = this.runInfo.enemyParty[0];
    const bossStatus = enemyData.boss;
    enemyData.boss = false;
    enemyData["player"] = true;
    //addPokemonIcon() throws an error if the Pokemon used is a boss
    const enemy = enemyData.toPokemon();
    const enemyIcon = globalScene.addPokemonIcon(enemy, 0, 0, 0, 0);
    const enemyLevelStyle = bossStatus ? TextStyle.PARTY_RED : TextStyle.PARTY;
    const enemyLevel = addTextObject(
      36,
      26,
      `${i18next.t("saveSlotSelectUiHandler:lv")}${formatLargeNumber(enemy.level, 1000)}`,
      enemyLevelStyle,
      { fontSize: "44px", color: "#f8f8f8" },
    );
    enemyLevel.setShadow(0, 0, undefined);
    enemyLevel.setStroke("#424242", 14);
    enemyLevel.setOrigin(1, 0);
    enemyIconContainer.add(enemyIcon);
    enemyIconContainer.add(enemyLevel);
    enemyContainer.add(enemyIconContainer);
    enemyContainer.setPosition(27, 12);
    enemy.destroy();
  }

  /**
   * This function is called to edit a container to represent a loss from a defeat by a wild double Pokemon battle.
   * This function and parseWildSingleDefeat can technically be merged, but I find it tricky to manipulate the different 'centers' a single battle / double battle container will hold.
   * @param enemyContainer - container holding enemy visuals and level information
   */
  private parseWildDoubleDefeat(enemyContainer: Phaser.GameObjects.Container) {
    this.runInfo.enemyParty.forEach((enemyData, e) => {
      const enemyIconContainer = globalScene.add.container(0, 0);
      const bossStatus = enemyData.boss;
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
      );
      enemyLevel.setShadow(0, 0, undefined);
      enemyLevel.setStroke("#424242", 14);
      enemyLevel.setOrigin(1, 0);
      enemyIconContainer.add(enemyIcon);
      enemyIconContainer.add(enemyLevel);
      enemyIconContainer.setPosition(e * 35, 0);
      enemyContainer.add(enemyIconContainer);
      enemy.destroy();
    });
    enemyContainer.setPosition(8, 14);
  }

  /**
   * This loads the enemy sprites, positions, and scales them according to the current display mode of the RunInfo UI and then adds them to the container parameter.
   * Used by {@linkcode parseRunStatus} and {@linkcode parseTrainerDefeat}
   * @param enemyContainer a Phaser Container that should hold enemy sprites
   */
  private showTrainerSprites(enemyContainer: Phaser.GameObjects.Container) {
    // Creating the trainer sprite and adding it to enemyContainer
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
          doubleContainer.add(tObjSprite);
          doubleContainer.add(tObjPartnerSprite);
          doubleContainer.setPosition(12, 38);
        } else {
          tObjSprite.setScale(0.55);
          tObjSprite.setPosition(-9, -3);
          tObjPartnerSprite.setScale(0.55);
          doubleContainer.add([tObjSprite, tObjPartnerSprite]);
          doubleContainer.setPosition(28, 34);
        }
        enemyContainer.add(doubleContainer);
      } else {
        const scale = this.runDisplayMode === RunDisplayMode.RUN_HISTORY ? 0.35 : 0.55;
        const position = this.runDisplayMode === RunDisplayMode.RUN_HISTORY ? [12, 28] : [30, 32];
        tObjSprite.setScale(scale, scale);
        tObjSprite.setPosition(position[0], position[1]);
        enemyContainer.add(tObjSprite);
      }
    });
  }

  /**
   * This edits a container to represent a loss from a defeat by a trainer battle.
   * The trainers are placed to the left of their party.
   * Depending on the trainer icon, there may be overlap between the edges of the box or their party. (Capes...)
   *
   * Party Pokemon have their icons, terastalization status, and level shown.
   * @param enemyContainer - container holding enemy visuals and level information
   */
  private parseTrainerDefeat(enemyContainer: Phaser.GameObjects.Container) {
    // Loads and adds trainer sprites to the UI
    this.showTrainerSprites(enemyContainer);

    // Creates the Pokemon icons + level information and adds it to enemyContainer
    // 2 Rows x 3 Columns
    const enemyPartyContainer = globalScene.add.container(0, 0);
    this.runInfo.enemyParty.forEach((enemyData, e) => {
      const pokemonRowHeight = Math.floor(e / 3);
      const enemyIconContainer = globalScene.add.container(0, 0);
      enemyIconContainer.setScale(0.6);
      const isBoss = enemyData.boss;
      enemyData.boss = false;
      enemyData["player"] = true;
      const enemy = enemyData.toPokemon();
      const enemyIcon = globalScene.addPokemonIcon(enemy, 0, 0, 0, 0);
      enemyIcon.setPosition(39 * (e % 3) + 5, 35 * pokemonRowHeight);
      const enemyLevel = addTextObject(
        43 * (e % 3),
        27 * (pokemonRowHeight + 1),
        `${i18next.t("saveSlotSelectUiHandler:lv")}${formatLargeNumber(enemy.level, 1000)}`,
        isBoss ? TextStyle.PARTY_RED : TextStyle.PARTY,
        { fontSize: "54px" },
      );
      enemyLevel.setShadow(0, 0, undefined);
      enemyLevel.setStroke("#424242", 14);
      enemyLevel.setOrigin(0, 0);

      enemyIconContainer.add(enemyIcon);
      enemyIconContainer.add(enemyLevel);
      enemyPartyContainer.add(enemyIconContainer);
      enemy.destroy();
    });
    enemyPartyContainer.setPosition(25, 15);
    enemyContainer.add(enemyPartyContainer);
  }

  /**
   * Shows information about the run like the run's mode, duration, luck, money, and player held items
   * The values for luck and money are from the end of the run, not the player's luck at the start of the run.
   * @param windowX
   * @param windowY These two params are the coordinates of the window's bottom right corner. This is used to dynamically position Luck based on its length, creating a nice layout regardless of language / luck value.
   */
  private async parseRunInfo(windowX: number, windowY: number) {
    // Parsing and displaying the mode.
    // In the future, parsing Challenges + Challenge Rules may have to be reworked as PokeRogue adds additional challenges and users can stack these challenges in various ways.
    const modeText = addBBCodeTextObject(7, 0, "", TextStyle.WINDOW, {
      fontSize: "50px",
      lineSpacing: 3,
    });
    modeText.setPosition(7, 5);
    modeText.appendText(i18next.t("runHistory:mode") + ": ", false);
    switch (this.runInfo.gameMode) {
      case GameModes.DAILY:
        modeText.appendText(`${i18next.t("gameMode:dailyRun")}`, false);
        break;
      case GameModes.SPLICED_ENDLESS:
        modeText.appendText(`${i18next.t("gameMode:endlessSpliced")}`, false);
        break;
      case GameModes.CHALLENGE: {
        modeText.appendText(`${i18next.t("gameMode:challenge")}`, false);
        modeText.appendText(`${i18next.t("runHistory:challengeRules")}: `);
        modeText.setWrapMode(1); // wrap by word
        modeText.setWrapWidth(500);
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

    // If the player achieves a personal best in Endless, the mode text will be tinted similarly to SSS luck to celebrate their achievement.
    if (
      (this.runInfo.gameMode === GameModes.ENDLESS || this.runInfo.gameMode === GameModes.SPLICED_ENDLESS)
      && this.runInfo.waveIndex === globalScene.gameData.gameStats.highestEndlessWave
    ) {
      modeText.appendText(` [${i18next.t("runHistory:personalBest")}]`);
      modeText.setTint(0xffef5c, 0x47ff69, 0x6b6bff, 0xff6969);
    }

    // Duration + Money
    const runInfoTextContainer = globalScene.add.container(0, 0);
    // Japanese is set to a greater line spacing of 35px in addBBCodeTextObject() if lineSpacing < 12.
    const lineSpacing = i18next.resolvedLanguage === "ja" ? 3 : 3;
    const runInfoText = addBBCodeTextObject(7, 0, "", TextStyle.WINDOW, {
      fontSize: "50px",
      lineSpacing,
    });
    const runTime = getPlayTimeString(this.runInfo.playTime);
    runInfoText.appendText(`${i18next.t("runHistory:runLength")}: ${runTime}`, false);
    const runMoney = formatMoney(globalScene.moneyFormat, this.runInfo.money);
    const moneyTextColor = getTextColor(TextStyle.MONEY_WINDOW, false);
    runInfoText.appendText(
      `[color=${moneyTextColor}]${i18next.t("battleScene:moneyOwned", { formattedMoney: runMoney })}[/color]`,
    );
    runInfoText.setPosition(7, 70);
    runInfoTextContainer.add(runInfoText);
    // Luck
    // Uses the parameters windowX and windowY to dynamically position the luck value neatly into the bottom right corner
    const luckText = addBBCodeTextObject(0, 0, "", TextStyle.WINDOW, {
      fontSize: "55px",
    });
    const luckValue = Phaser.Math.Clamp(
      this.runInfo.party
        .map(p => p.toPokemon().getLuck())
        .reduce((total: number, value: number) => (total += value), 0),
      0,
      14,
    );
    let luckInfo = i18next.t("runHistory:luck") + ": " + getLuckString(luckValue);
    if (luckValue < 14) {
      luckInfo = "[color=#" + getLuckTextTint(luckValue).toString(16) + "]" + luckInfo + "[/color]";
    } else {
      luckText.setTint(0xffef5c, 0x47ff69, 0x6b6bff, 0xff6969);
    }
    luckText.appendText("[align=right]" + luckInfo + "[/align]", false);
    luckText.setPosition(windowX - luckText.displayWidth - 5, windowY - 13);
    runInfoTextContainer.add(luckText);

    // Player Held Items
    // A max of 20 items can be displayed. A + sign will be added if the run's held items pushes past this maximum to show the user that there are more.
    if (this.runInfo.modifiers.length > 0) {
      let visibleModifierIndex = 0;

      const modifierIconsContainer = globalScene.add.container(
        8,
        this.runInfo.gameMode === GameModes.CHALLENGE ? 20 : 15,
      );
      modifierIconsContainer.setScale(0.45);
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
          const maxItems = addTextObject(45, 90, "+", TextStyle.WINDOW);
          maxItems.setPositionRelative(modifierIconsContainer, 70, 45);
          this.runInfoContainer.add(maxItems);
          break;
        }
      }
      this.runInfoContainer.add(modifierIconsContainer);
    }

    this.runInfoContainer.add(modeText);
    this.runInfoContainer.add(runInfoTextContainer);
    this.runContainer.add(this.runInfoContainer);
  }

  /**
   * This function parses the Challenges section of the Run Entry and returns a list of active challenge.
   * @return string[] of active challenge names
   */
  private challengeParser(): string[] {
    const rules: string[] = [];
    for (const chal of this.runInfo.challenges) {
      if (chal.value === 0) {
        continue;
      }

      switch (chal.id) {
        case Challenges.SINGLE_GENERATION:
          rules.push(i18next.t(`runHistory:challengeMonoGen${chal.value}`));
          break;
        case Challenges.SINGLE_TYPE: {
          const typeRule = PokemonType[chal.value - 1];
          const typeTextColor = `[color=${TypeColor[typeRule]}]`;
          const typeShadowColor = `[shadow=${TypeShadow[typeRule]}]`;
          const typeText =
            typeTextColor
            + typeShadowColor
            + i18next.t(`pokemonInfo:type.${toCamelCase(typeRule)}`)!
            + "[/color][/shadow]";
          rules.push(typeText);
          break;
        }
        case Challenges.INVERSE_BATTLE:
          rules.push(i18next.t("challenges:inverseBattle.shortName"));
          break;
        default: {
          const localizationKey = toCamelCase(Challenges[chal.id]);
          rules.push(i18next.t(`challenges:${localizationKey}.name`));
          break;
        }
      }
    }
    return rules;
  }

  /**
   * Parses and displays the run's player party.
   * Default Information: Icon, Level, Nature, Ability, Passive, Shiny Status, Fusion Status, Stats, and Moves.
   * B-Side Information: Icon + Held Items (Can be displayed to the user through pressing the abilityButton)
   */
  private parsePartyInfo(): void {
    const party = this.runInfo.party;
    const currentLanguage = i18next.resolvedLanguage ?? "en";
    const windowHeight = (globalScene.scaledCanvas.height - 23) / 6;

    party.forEach((p: PokemonData, i: number) => {
      const pokemonInfoWindow = new RoundRectangle(globalScene, 0, 14, this.statsBgWidth * 2 + 10, windowHeight - 2, 3);

      const pokemon = p.toPokemon();
      const pokemonInfoContainer = globalScene.add.container(this.statsBgWidth + 5, (windowHeight - 0.5) * i);

      const types = pokemon.getTypes();
      const type1 = getTypeRgb(types[0]);
      const type1Color = new Phaser.Display.Color(type1[0], type1[1], type1[2]);

      const bgColor = type1Color.clone().darken(45);
      pokemonInfoWindow.setFillStyle(bgColor.color);

      const iconContainer = globalScene.add.container(0, 0);
      const icon = globalScene.addPokemonIcon(pokemon, 0, 0, 0, 0);
      icon.setScale(0.75);
      icon.setPosition(-99, 1);
      const type2 = types[1] ? getTypeRgb(types[1]) : undefined;
      const type2Color = type2 ? new Phaser.Display.Color(type2[0], type2[1], type2[2]) : undefined;
      type2Color
        ? pokemonInfoWindow.setStrokeStyle(1, type2Color.color, 0.95)
        : pokemonInfoWindow.setStrokeStyle(1, type1Color.color, 0.95);

      this.getUi().bringToTop(icon);

      // Contains Name, Level + Nature, Ability, Passive
      const pokeInfoTextContainer = globalScene.add.container(-85, 3.5);
      const textContainerFontSize = "34px";
      // This checks if the Pokemon's nature has been overwritten during the run and displays the change accurately
      const pNature = pokemon.getNature();
      const pNatureName = getNatureName(pNature);
      const pName = pokemon.getNameToRender();
      //With the exception of Korean/Traditional Chinese/Simplified Chinese, the code shortens the terms for ability and passive to their first letter.
      //These languages are exempted because they are already short enough.
      const exemptedLanguages = ["ko", "zh_CN", "zh_TW"];
      let passiveLabel = i18next.t("starterSelectUiHandler:passive") ?? "-";
      let abilityLabel = i18next.t("starterSelectUiHandler:ability") ?? "-";
      if (!exemptedLanguages.includes(currentLanguage)) {
        passiveLabel = passiveLabel.charAt(0);
        abilityLabel = abilityLabel.charAt(0);
      }
      const pPassiveInfo = pokemon.passive ? passiveLabel + ": " + pokemon.getPassiveAbility().name : "";
      const pAbilityInfo = abilityLabel + ": " + pokemon.getAbility().name;
      // Japanese is set to a greater line spacing of 35px in addBBCodeTextObject() if lineSpacing < 12.
      const lineSpacing = i18next.resolvedLanguage === "ja" ? 3 : 3;
      const pokeInfoText = addBBCodeTextObject(0, 0, pName, TextStyle.SUMMARY, {
        fontSize: textContainerFontSize,
        lineSpacing,
      });
      pokeInfoText.appendText(
        `${i18next.t("saveSlotSelectUiHandler:lv")}${formatFancyLargeNumber(pokemon.level, 1)} - ${pNatureName}`,
      );
      pokeInfoText.appendText(pAbilityInfo);
      pokeInfoText.appendText(pPassiveInfo);
      pokeInfoTextContainer.add(pokeInfoText);

      // Pokemon Stats
      // Colored Arrows (Red/Blue) are placed by stats that are boosted from natures
      const pokeStatTextContainer = globalScene.add.container(-35, 6);
      const pStats: string[] = [];
      pokemon.stats.forEach(element => pStats.push(formatFancyLargeNumber(element, 1)));
      for (let i = 0; i < pStats.length; i++) {
        const isMult = getNatureStatMultiplier(pNature, i);
        pStats[i] = isMult < 1 ? pStats[i] + "[color=#40c8f8]↓[/color]" : pStats[i];
        pStats[i] = isMult > 1 ? pStats[i] + "[color=#f89890]↑[/color]" : pStats[i];
      }
      const hp = i18next.t("pokemonInfo:stat.hpShortened") + ": " + pStats[0];
      const atk = i18next.t("pokemonInfo:stat.atkShortened") + ": " + pStats[1];
      const def = i18next.t("pokemonInfo:stat.defShortened") + ": " + pStats[2];
      const spatk = i18next.t("pokemonInfo:stat.spatkShortened") + ": " + pStats[3];
      const spdef = i18next.t("pokemonInfo:stat.spdefShortened") + ": " + pStats[4];
      const speedLabel =
        currentLanguage === "es-ES" || currentLanguage === "pt_BR"
          ? i18next.t("runHistory:spdShortened")
          : i18next.t("pokemonInfo:stat.spdShortened");
      const speed = speedLabel + ": " + pStats[5];
      // Column 1: HP Atk Def
      const pokeStatText1 = addBBCodeTextObject(-5, 0, hp, TextStyle.SUMMARY, {
        fontSize: textContainerFontSize,
        lineSpacing,
      });
      pokeStatText1.appendText(atk);
      pokeStatText1.appendText(def);
      pokeStatTextContainer.add(pokeStatText1);
      // Column 2: SpAtk SpDef Speed
      const pokeStatText2 = addBBCodeTextObject(25, 0, spatk, TextStyle.SUMMARY, {
        fontSize: textContainerFontSize,
        lineSpacing,
      });
      pokeStatText2.appendText(spdef);
      pokeStatText2.appendText(speed);
      pokeStatTextContainer.add(pokeStatText2);

      // Shiny + Fusion Status
      const marksContainer = globalScene.add.container(0, 0);
      if (pokemon.fusionSpecies) {
        const splicedIcon = globalScene.add.image(0, 0, "icon_spliced");
        splicedIcon.setScale(0.35);
        splicedIcon.setOrigin(0, 0);
        pokemon.isShiny()
          ? splicedIcon.setPositionRelative(pokeInfoTextContainer, 35, 0)
          : splicedIcon.setPositionRelative(pokeInfoTextContainer, 28, 0);
        marksContainer.add(splicedIcon);
        this.getUi().bringToTop(splicedIcon);
      }
      if (pokemon.isShiny()) {
        const doubleShiny = pokemon.isFusion() && pokemon.shiny && pokemon.fusionShiny;
        const shinyStar = globalScene.add.image(0, 0, `shiny_star_small${doubleShiny ? "_1" : ""}`);
        shinyStar.setOrigin(0, 0);
        shinyStar.setScale(0.65);
        shinyStar.setPositionRelative(pokeInfoTextContainer, 28, 0);
        shinyStar.setTint(getVariantTint(!doubleShiny ? pokemon.getVariant() : pokemon.variant));
        marksContainer.add(shinyStar);
        this.getUi().bringToTop(shinyStar);
        if (doubleShiny) {
          const fusionShinyStar = globalScene.add.image(0, 0, "shiny_star_small_2");
          fusionShinyStar.setOrigin(0, 0);
          fusionShinyStar.setScale(0.5);
          fusionShinyStar.setPosition(shinyStar.x + 1, shinyStar.y + 1);
          fusionShinyStar.setTint(getVariantTint(pokemon.fusionVariant));
          marksContainer.add(fusionShinyStar);
          this.getUi().bringToTop(fusionShinyStar);
        }
      }

      // Pokemon Moveset
      // Need to check if dynamically typed moves
      const pokemonMoveset = pokemon.getMoveset();
      const movesetContainer = globalScene.add.container(70, -29);
      const pokemonMoveBgs: Phaser.GameObjects.NineSlice[] = [];
      const pokemonMoveLabels: Phaser.GameObjects.Text[] = [];
      const movePos = [
        [-6.5, 35.5],
        [37, 35.5],
        [-6.5, 43.5],
        [37, 43.5],
      ];
      for (let m = 0; m < pokemonMoveset?.length; m++) {
        const moveContainer = globalScene.add.container(movePos[m][0], movePos[m][1]);
        moveContainer.setScale(0.5);
        const moveBg = globalScene.add.nineslice(0, 0, "type_bgs", "unknown", 85, 15, 2, 2, 2, 2);
        moveBg.setOrigin(1, 0);
        const moveLabel = addTextObject(-moveBg.width / 2, 1, "-", TextStyle.MOVE_LABEL);
        moveLabel.setOrigin(0.5, 0);
        moveLabel.setName("text-move-label");
        pokemonMoveBgs.push(moveBg);
        pokemonMoveLabels.push(moveLabel);
        moveContainer.add(moveBg);
        moveContainer.add(moveLabel);
        movesetContainer.add(moveContainer);
        const move = pokemonMoveset[m]?.getMove();
        pokemonMoveBgs[m].setFrame(PokemonType[move ? move.type : PokemonType.UNKNOWN].toString().toLowerCase());
        pokemonMoveLabels[m].setText(move ? move.name : "-");
      }

      // Pokemon Held Items - not displayed by default
      // Endless/Endless Spliced have a different scale because Pokemon tend to accumulate more items in these runs.
      const heldItemsScale =
        this.runInfo.gameMode === GameModes.SPLICED_ENDLESS || this.runInfo.gameMode === GameModes.ENDLESS ? 0.25 : 0.5;
      const heldItemsContainer = globalScene.add.container(-82, 2);
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
            const itemIcon = item?.getIcon(true);
            if (
              item?.stackCount < item?.getMaxHeldItemCount(pokemon)
              && itemIcon.list[1] instanceof Phaser.GameObjects.BitmapText
            ) {
              itemIcon.list[1].clearTint();
            }
            itemIcon.setScale(heldItemsScale);
            itemIcon.setPosition((index % 19) * 10, row * 10);
            heldItemsContainer.add(itemIcon);
            if (index !== 0 && index % 18 === 0) {
              row++;
            }
          }
        }
      }
      heldItemsContainer.setName("heldItems");
      heldItemsContainer.setVisible(false);

      // Labels are applied for future differentiation in showParty()
      pokemonInfoContainer.add(pokemonInfoWindow);
      iconContainer.add(icon);
      pokemonInfoContainer.add(iconContainer);
      marksContainer.setName("PkmnMarks");
      pokemonInfoContainer.add(marksContainer);
      movesetContainer.setName("PkmnMoves");
      pokemonInfoContainer.add(movesetContainer);
      pokeInfoTextContainer.setName("PkmnInfoText");
      pokemonInfoContainer.add(pokeInfoTextContainer);
      pokeStatTextContainer.setName("PkmnStatsText");
      pokemonInfoContainer.add(pokeStatTextContainer);
      pokemonInfoContainer.add(heldItemsContainer);
      pokemonInfoContainer.setName("PkmnInfo");
      this.partyContainer.add(pokemonInfoContainer);
      pokemon.destroy();
    });
    this.runContainer.add(this.partyContainer);
  }

  /**
   * Changes what is displayed of the Pokemon's held items
   * @param partyVisible {boolean}
   * True -> Shows the Pokemon's default information and hides held items
   * False -> Shows the Pokemon's held items and hides default information
   */
  private showParty(partyVisible: boolean): void {
    const allContainers = this.partyContainer.getAll("name", "PkmnInfo");
    allContainers.forEach((c: Phaser.GameObjects.Container) => {
      c.getByName<Phaser.GameObjects.Container>("PkmnMoves").setVisible(partyVisible);
      c.getByName<Phaser.GameObjects.Container>("PkmnInfoText").setVisible(partyVisible);
      c.getByName<Phaser.GameObjects.Container>("PkmnStatsText").setVisible(partyVisible);
      c.getByName<Phaser.GameObjects.Container>("PkmnMarks").setVisible(partyVisible);
      c.getByName<Phaser.GameObjects.Container>("heldItems").setVisible(!partyVisible);
      this.partyVisibility = partyVisible;
    });
  }

  /**
   * Shows the ending art.
   */
  private createVictorySplash(): void {
    this.endCardContainer = globalScene.add.container(0, 0);
    const genderIndex = globalScene.gameData.gender ?? PlayerGender.UNSET;
    const isFemale = genderIndex === PlayerGender.FEMALE;
    const endCard = globalScene.add.image(0, 0, `end_${isFemale ? "f" : "m"}`);
    endCard.setOrigin(0);
    endCard.setScale(0.5);
    const text = addTextObject(
      globalScene.scaledCanvas.width / 2,
      globalScene.scaledCanvas.height - 16,
      i18next.t("battle:congratulations"),
      TextStyle.SUMMARY,
      { fontSize: "128px" },
    );
    text.setOrigin(0.5);
    this.endCardContainer.add(endCard);
    this.endCardContainer.add(text);
  }

  /** createHallofFame() - if the run is victorious, this creates a hall of fame image for the player to view
   * Overlay created by Koda (Thank you!)
   * This could be adapted into a public-facing method for victory screens. Perhaps.
   */
  private createHallofFame(): void {
    const genderIndex = globalScene.gameData.gender ?? PlayerGender.UNSET;
    const isFemale = genderIndex === PlayerGender.FEMALE;
    const genderStr = PlayerGender[genderIndex].toLowerCase();
    // Issue Note (08-05-2024): It seems as if fused pokemon do not appear with the averaged color b/c pokemonData's loadAsset requires there to be some active battle?
    // As an alternative, the icons of the second/bottom fused Pokemon have been placed next to their fellow fused Pokemon in Hall of Fame
    this.hallofFameContainer = globalScene.add.container(0, 0);
    // Thank you Hayuna for the code
    const endCard = globalScene.add.image(0, 0, `end_${isFemale ? "f" : "m"}`);
    endCard.setOrigin(0);
    endCard.setPosition(-1, -1);
    endCard.setScale(0.5);
    const endCardCoords = endCard.getBottomCenter();
    const overlayColor = isFemale ? "red" : "blue";
    const hallofFameBg = globalScene.add.image(0, 0, "hall_of_fame_" + overlayColor);
    hallofFameBg.setPosition(159, 89);
    hallofFameBg.setSize(globalScene.game.canvas.width, globalScene.game.canvas.height + 10);
    hallofFameBg.setAlpha(0.8);
    this.hallofFameContainer.add(endCard);
    this.hallofFameContainer.add(hallofFameBg);

    const hallofFameText = addTextObject(
      0,
      0,
      i18next.t("runHistory:hallofFameText", { context: genderStr }),
      TextStyle.WINDOW,
    );
    hallofFameText.setPosition(endCardCoords.x - hallofFameText.displayWidth / 2, 164);
    this.hallofFameContainer.add(hallofFameText);
    this.runInfo.party.forEach((p, i) => {
      const pkmn = p.toPokemon();
      const row = i % 2;
      const id = pkmn.id;
      const shiny = pkmn.shiny;
      const formIndex = pkmn.formIndex;
      const variant = pkmn.variant;
      const species = pkmn.getSpeciesForm();
      const pokemonSprite: Phaser.GameObjects.Sprite = globalScene.add.sprite(60 + 40 * i, 40 + row * 80, "pkmn__sub");
      pokemonSprite.setPipeline(globalScene.spritePipeline, {
        tone: [0.0, 0.0, 0.0, 0.0],
        ignoreTimeTint: true,
      });
      this.hallofFameContainer.add(pokemonSprite);
      const speciesLoaded: Map<SpeciesId, boolean> = new Map<SpeciesId, boolean>();
      speciesLoaded.set(id, false);

      const female = pkmn.gender === 1;
      species.loadAssets(female, formIndex, shiny, variant, true).then(() => {
        speciesLoaded.set(id, true);
        pokemonSprite.play(species.getSpriteKey(female, formIndex, shiny, variant));
        pokemonSprite.setPipelineData("shiny", shiny);
        pokemonSprite.setPipelineData("variant", variant);
        pokemonSprite.setPipelineData("spriteKey", species.getSpriteKey(female, formIndex, shiny, variant));
        pokemonSprite.setVisible(true);
      });
      if (pkmn.isFusion()) {
        const fusionIcon = globalScene.add.sprite(80 + 40 * i, 50 + row * 80, pkmn.getFusionIconAtlasKey());
        fusionIcon.setName("sprite-fusion-icon");
        fusionIcon.setOrigin(0.5, 0);
        fusionIcon.setFrame(pkmn.getFusionIconId(true));
        this.hallofFameContainer.add(fusionIcon);
      }
      pkmn.destroy();
    });
    this.hallofFameContainer.setVisible(false);
    this.runContainer.add(this.hallofFameContainer);
  }

  /**
   * Takes input from the user to perform a desired action.
   * @param button - Button object to be processed
   * Button.CANCEL, Button.LEFT - removes all containers related to RunInfo and returns the user to Run History
   * Button.CYCLE_FORM, Button.CYCLE_SHINY, Button.CYCLE_ABILITY - runs the function buttonCycleOption()
   */
  override processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    const error = false;

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
      case Button.DOWN:
      case Button.UP:
        break;
      case Button.CYCLE_FORM:
      case Button.CYCLE_SHINY:
      case Button.CYCLE_ABILITY:
        this.buttonCycleOption(button);
        break;
    }

    if (success) {
      ui.playSelect();
    } else if (error) {
      ui.playError();
    }
    return success || error;
  }

  /**
   * buttonCycleOption : takes a parameter button to execute different actions in the run-info page
   * The use of non-directional / A / B buttons is named in relation to functions used during starter-select.
   * Button.CYCLE_FORM (F key) --> displays ending art (victory only)
   * Button.CYCLE_SHINY (R key) --> displays hall of fame (victory only)
   * Button.CYCLE_ABILITY (E key) --> shows pokemon held items
   */
  private buttonCycleOption(button: Button) {
    switch (button) {
      case Button.CYCLE_FORM:
        if (this.isVictory && this.pageMode !== RunInfoUiMode.HALL_OF_FAME) {
          if (!this.endCardContainer || !this.endCardContainer.visible) {
            this.createVictorySplash();
            this.endCardContainer.setVisible(true);
            this.runContainer.add(this.endCardContainer);
            this.pageMode = RunInfoUiMode.ENDING_ART;
          } else {
            this.endCardContainer.setVisible(false);
            this.runContainer.remove(this.endCardContainer);
            this.pageMode = RunInfoUiMode.MAIN;
          }
        }
        break;
      case Button.CYCLE_SHINY:
        if (this.isVictory && this.pageMode !== RunInfoUiMode.ENDING_ART) {
          if (!this.hallofFameContainer.visible) {
            this.hallofFameContainer.setVisible(true);
            this.pageMode = RunInfoUiMode.HALL_OF_FAME;
          } else {
            this.hallofFameContainer.setVisible(false);
            this.pageMode = RunInfoUiMode.MAIN;
          }
        }
        break;
      case Button.CYCLE_ABILITY:
        if (this.runInfo.modifiers.length > 0 && this.pageMode === RunInfoUiMode.MAIN) {
          if (this.partyVisibility) {
            this.showParty(false);
          } else {
            this.showParty(true);
          }
        }
        break;
    }
  }
}
