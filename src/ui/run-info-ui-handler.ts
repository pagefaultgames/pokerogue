import BattleScene from "../battle-scene";
import { GameModes } from "../game-mode";
import UiHandler from "./ui-handler";
import { SessionSaveData } from "../system/game-data";
import { TextStyle, addTextObject, addBBCodeTextObject, getTextColor } from "./text";
import { Mode } from "./ui";
import { addWindow } from "./ui-theme";
import * as Utils from "../utils";
import PokemonData from "../system/pokemon-data";
import i18next from "i18next";
import {Button} from "../enums/buttons";
import { BattleType } from "../battle";
import { TrainerVariant } from "../field/trainer";
import { Challenges } from "#enums/challenges";
import { getLuckString, getLuckTextTint } from "../modifier/modifier-type";
import RoundRectangle from "phaser3-rex-plugins/plugins/roundrectangle";
import { Type, getTypeRgb } from "../data/type";
import { TypeColor, TypeShadow } from "#app/enums/color";
import { getNatureStatMultiplier, getNatureName } from "../data/nature";
import { getVariantTint } from "#app/data/variant";
import { PokemonHeldItemModifier, TerastallizeModifier } from "../modifier/modifier";
import {modifierSortFunc} from "../modifier/modifier";
import { Species } from "#enums/species";
import { PlayerGender } from "#enums/player-gender";

/**
 * RunInfoUiMode indicates possible overlays of RunInfoUiHandler.
 * MAIN <-- default overlay that can return back to RunHistoryUiHandler + should eventually have its own enum once more pages are added to RunInfoUiHandler
 * HALL_OF_FAME, ENDING_ART, etc. <-- overlays that should return back to MAIN
 */
enum RunInfoUiMode {
  MAIN,
  HALL_OF_FAME,
  ENDING_ART
}

/**
 * Some variables are protected because this UI class will most likely be extended in the future to display more information.
 * These variables will most likely be shared across 'classes' aka pages.
 * I believe that it is possible that the contents/methods of the first page will be placed in their own class that is an extension of RunInfoUiHandler as more pages are added.
 * For now, I leave as is.
 */
export default class RunInfoUiHandler extends UiHandler {
  protected runInfo: SessionSaveData;
  protected isVictory: boolean;
  protected pageMode: RunInfoUiMode;
  protected runContainer: Phaser.GameObjects.Container;

  private runResultContainer: Phaser.GameObjects.Container;
  private runInfoContainer: Phaser.GameObjects.Container;
  private partyContainer: Phaser.GameObjects.Container;
  private partyHeldItemsContainer: Phaser.GameObjects.Container;
  private statsBgWidth: integer;
  private partyContainerHeight: integer;
  private partyContainerWidth: integer;

  private hallofFameContainer: Phaser.GameObjects.Container;
  private endCardContainer: Phaser.GameObjects.Container;

  private partyInfo: Phaser.GameObjects.Container[];
  private partyVisibility: Boolean;
  private modifiersModule: any;

  constructor(scene: BattleScene) {
    super(scene, Mode.RUN_INFO);
  }

  override async setup() {
 		this.runContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);
    // The import of the modifiersModule is loaded here to sidestep async/await issues.
    this.modifiersModule = await import("../modifier/modifier");
    this.runContainer.setVisible(false);
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

    const gameStatsBg = this.scene.add.rectangle(0, 0, this.scene.game.canvas.width, this.scene.game.canvas.height, 0x006860);
    gameStatsBg.setOrigin(0, 0);
    this.runContainer.add(gameStatsBg);

    const run = args[0];
    // Assigning information necessary for the UI's creation
    this.runInfo = this.scene.gameData.parseSessionData(JSON.stringify(run.entry));
    this.isVictory = run.isVictory;
    this.pageMode = RunInfoUiMode.MAIN;

    // Creates Header and adds to this.runContainer
    this.addHeader();

    this.statsBgWidth = ((this.scene.game.canvas.width / 6) - 2) / 3;

    // Creates Run Result Container
    this.runResultContainer = this.scene.add.container(0, 24);
    const runResultWindow = addWindow(this.scene, 0, 0, this.statsBgWidth-11, 65);
    runResultWindow.setOrigin(0, 0);
    this.runResultContainer.add(runResultWindow);
    this.parseRunResult();

    // Creates Run Info Container
    this.runInfoContainer = this.scene.add.container(0, 89);
    const runInfoWindow = addWindow(this.scene, 0, 0, this.statsBgWidth-11, 90);
    const runInfoWindowCoords = runInfoWindow.getBottomRight();
    this.runInfoContainer.add(runInfoWindow);
 		this.parseRunInfo(runInfoWindowCoords.x, runInfoWindowCoords.y);

    // Creates Player Party Container
    this.partyContainer = this.scene.add.container(this.statsBgWidth-10, 23);
    this.parsePartyInfo();
    this.showParty(true);

    this.runContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);
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
    const headerBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 6) - 2, 24);
    headerBg.setOrigin(0, 0);
    this.runContainer.add(headerBg);
    if (this.runInfo.modifiers.length !== 0) {
      const headerBgCoords = headerBg.getTopRight();
      const abilityButtonContainer = this.scene.add.container(0, 0);
      const abilityButtonText = addTextObject(this.scene, 8, 0, i18next.t("runHistory:viewHeldItems"), TextStyle.WINDOW, {fontSize:"34px"});
      const abilityButtonElement = new Phaser.GameObjects.Sprite(this.scene, 0, 2, "keyboard", "E.png");
      abilityButtonContainer.add([abilityButtonText, abilityButtonElement]);
      abilityButtonContainer.setPosition(headerBgCoords.x - abilityButtonText.displayWidth - abilityButtonElement.displayWidth - 8, 10);
      this.runContainer.add(abilityButtonContainer);
    }
    const headerText = addTextObject(this.scene, 0, 0, i18next.t("runHistory:runInfo"), TextStyle.SETTINGS_LABEL);
    headerText.setOrigin(0, 0);
    headerText.setPositionRelative(headerBg, 8, 4);
    this.runContainer.add(headerText);
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
    const genderIndex = this.scene.gameData.gender ?? PlayerGender.UNSET;
    const genderStr = PlayerGender[genderIndex];
    const runResultTextStyle = this.isVictory ? TextStyle.SUMMARY : TextStyle.SUMMARY_RED;
    const runResultTitle = this.isVictory ? i18next.t("runHistory:victory") : i18next.t("runHistory:defeated", { context: genderStr });
    const runResultText = addBBCodeTextObject(this.scene, 6, 5, `${runResultTitle} - ${i18next.t("saveSlotSelectUiHandler:wave")} ${this.runInfo.waveIndex}`, runResultTextStyle, {fontSize : "65px", lineSpacing: 0.1});

    if (this.isVictory) {
      const hallofFameInstructionContainer = this.scene.add.container(0, 0);
      const shinyButtonText = addTextObject(this.scene, 8, 0, i18next.t("runHistory:viewHallOfFame"), TextStyle.WINDOW, {fontSize:"65px"});
      const shinyButtonElement = new Phaser.GameObjects.Sprite(this.scene, 0, 4, "keyboard", "R.png");
      hallofFameInstructionContainer.add([shinyButtonText, shinyButtonElement]);

      const formButtonText = addTextObject(this.scene, 8, 12, i18next.t("runHistory:viewEndingSplash"), TextStyle.WINDOW, {fontSize:"65px"});
      const formButtonElement = new Phaser.GameObjects.Sprite(this.scene, 0, 16, "keyboard", "F.png");
      hallofFameInstructionContainer.add([formButtonText, formButtonElement]);

      hallofFameInstructionContainer.setPosition(12, 25);
      this.runResultContainer.add(hallofFameInstructionContainer);
    }

    this.runResultContainer.add(runResultText);

    if (!this.isVictory) {
      const enemyContainer = this.scene.add.container(0, 0);
      // Wild - Single and Doubles
      if (this.runInfo.battleType === BattleType.WILD) {
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
      } else if (this.runInfo.battleType === BattleType.TRAINER) {
        this.parseTrainerDefeat(enemyContainer);
      }
      this.runResultContainer.add(enemyContainer);
    }
    this.runContainer.add(this.runResultContainer);
  }

  /**
   * This function is called to edit an enemyContainer to represent a loss from a defeat by a wild single Pokemon battle.
   * @param enemyContainer - container holding enemy visual and level information
   */
  private parseWildSingleDefeat(enemyContainer: Phaser.GameObjects.Container) {
    const enemyIconContainer = this.scene.add.container(0, 0);
    const enemyData = this.runInfo.enemyParty[0];
    const bossStatus = enemyData.boss;
    enemyData.boss = false;
    enemyData["player"] = true;
    //addPokemonIcon() throws an error if the Pokemon used is a boss
    const enemy = enemyData.toPokemon(this.scene);
    const enemyIcon = this.scene.addPokemonIcon(enemy, 0, 0, 0, 0);
    const enemyLevelStyle = bossStatus ? TextStyle.PARTY_RED : TextStyle.PARTY;
    const enemyLevel = addTextObject(this.scene, 36, 26, `${i18next.t("saveSlotSelectUiHandler:lv")}${Utils.formatLargeNumber(enemy.level, 1000)}`, enemyLevelStyle, { fontSize: "44px", color: "#f8f8f8" });
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
      const enemyIconContainer = this.scene.add.container(0, 0);
      const bossStatus = enemyData.boss;
      enemyData.boss = false;
      enemyData["player"] = true;
      const enemy = enemyData.toPokemon(this.scene);
      const enemyIcon = this.scene.addPokemonIcon(enemy, 0, 0, 0, 0);
      const enemyLevel = addTextObject(this.scene, 36, 26, `${i18next.t("saveSlotSelectUiHandler:lv")}${Utils.formatLargeNumber(enemy.level, 1000)}`, bossStatus ? TextStyle.PARTY_RED : TextStyle.PARTY, { fontSize: "44px", color: "#f8f8f8" });
      enemyLevel.setShadow(0, 0, undefined);
      enemyLevel.setStroke("#424242", 14);
      enemyLevel.setOrigin(1, 0);
      enemyIconContainer.add(enemyIcon);
      enemyIconContainer.add(enemyLevel);
      enemyIconContainer.setPosition(e*35, 0);
      enemyContainer.add(enemyIconContainer);
      enemy.destroy();
    });
    enemyContainer.setPosition(8, 14);
  }

  /**
   * This edits a container to represent a loss from a defeat by a trainer battle.
   * @param enemyContainer - container holding enemy visuals and level information
   * The trainers are placed to the left of their party.
   * Depending on the trainer icon, there may be overlap between the edges of the box or their party. (Capes...)
   *
   * Party Pokemon have their icons, terastalization status, and level shown.
   */
  private parseTrainerDefeat(enemyContainer: Phaser.GameObjects.Container) {
    // Creating the trainer sprite and adding it to enemyContainer
    const tObj = this.runInfo.trainer.toTrainer(this.scene);
    const tObjSpriteKey = tObj.config.getSpriteKey(this.runInfo.trainer.variant === TrainerVariant.FEMALE, false);
    const tObjSprite = this.scene.add.sprite(0, 5, tObjSpriteKey);
    if (this.runInfo.trainer.variant === TrainerVariant.DOUBLE) {
      const doubleContainer = this.scene.add.container(5, 8);
      tObjSprite.setPosition(-3, -3);
      const tObjPartnerSpriteKey = tObj.config.getSpriteKey(true, true);
      const tObjPartnerSprite = this.scene.add.sprite(5, -3, tObjPartnerSpriteKey);
      // Double Trainers have smaller sprites than Single Trainers
      tObjPartnerSprite.setScale(0.20);
      tObjSprite.setScale(0.20);
      doubleContainer.add(tObjSprite);
      doubleContainer.add(tObjPartnerSprite);
      doubleContainer.setPosition(12, 38);
      enemyContainer.add(doubleContainer);
    } else {
      tObjSprite.setScale(0.35, 0.35);
      tObjSprite.setPosition(12, 28);
      enemyContainer.add(tObjSprite);
    }

    // Determining which Terastallize Modifier belongs to which Pokemon
    // Creates a dictionary {PokemonId: TeraShardType}
    const teraPokemon = {};
    this.runInfo.enemyModifiers.forEach((m) => {
      const modifier = m.toModifier(this.scene, this.modifiersModule[m.className]);
      if (modifier instanceof TerastallizeModifier) {
        const teraDetails = modifier?.getArgs();
        const pkmnId = teraDetails[0];
        teraPokemon[pkmnId] = teraDetails[1];
      }
    });

    // Creates the Pokemon icons + level information and adds it to enemyContainer
    // 2 Rows x 3 Columns
    const enemyPartyContainer = this.scene.add.container(0, 0);
    this.runInfo.enemyParty.forEach((enemyData, e) => {
      const pokemonRowHeight = Math.floor(e/3);
      const enemyIconContainer = this.scene.add.container(0, 0);
      enemyIconContainer.setScale(0.6);
      const isBoss = enemyData.boss;
      enemyData.boss = false;
      enemyData["player"] = true;
      const enemy = enemyData.toPokemon(this.scene);
      const enemyIcon = this.scene.addPokemonIcon(enemy, 0, 0, 0, 0);
      // Applying Terastallizing Type tint to Pokemon icon
      // If the Pokemon is a fusion, it has two sprites and so, the tint has to be applied to each icon separately
      const enemySprite1 = enemyIcon.list[0] as Phaser.GameObjects.Sprite;
      const enemySprite2 = (enemyIcon.list.length > 1) ? enemyIcon.list[1] as Phaser.GameObjects.Sprite : undefined;
      if (teraPokemon[enemyData.id]) {
        const teraTint = getTypeRgb(teraPokemon[enemyData.id]);
        const teraColor = new Phaser.Display.Color(teraTint[0], teraTint[1], teraTint[2]);
        enemySprite1.setTint(teraColor.color);
        if (enemySprite2) {
          enemySprite2.setTint(teraColor.color);
        }
      }
      enemyIcon.setPosition(39*(e%3)+5, (35*pokemonRowHeight));
      const enemyLevel = addTextObject(this.scene, 43*(e%3), (27*(pokemonRowHeight+1)), `${i18next.t("saveSlotSelectUiHandler:lv")}${Utils.formatLargeNumber(enemy.level, 1000)}`, isBoss ? TextStyle.PARTY_RED : TextStyle.PARTY, { fontSize: "54px" });
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
    const modeText = addBBCodeTextObject(this.scene, 7, 0, "", TextStyle.WINDOW, {fontSize : "50px", lineSpacing:3});
    modeText.setPosition(7, 5);
    modeText.appendText(i18next.t("runHistory:mode")+": ", false);
    switch (this.runInfo.gameMode) {
    case GameModes.DAILY:
      modeText.appendText(`${i18next.t("gameMode:dailyRun")}`, false);
      break;
    case GameModes.SPLICED_ENDLESS:
      modeText.appendText(`${i18next.t("gameMode:endlessSpliced")}`, false);
      if (this.runInfo.waveIndex === this.scene.gameData.gameStats.highestEndlessWave) {
        modeText.appendText(` [${i18next.t("runHistory:personalBest")}]`, false);
        modeText.setTint(0xffef5c, 0x47ff69, 0x6b6bff, 0xff6969);
      }
      break;
    case GameModes.CHALLENGE:
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
    case GameModes.ENDLESS:
      modeText.appendText(`${i18next.t("gameMode:endless")}`, false);
      // If the player achieves a personal best in Endless, the mode text will be tinted similarly to SSS luck to celebrate their achievement.
      if (this.runInfo.waveIndex === this.scene.gameData.gameStats.highestEndlessWave) {
        modeText.appendText(` [${i18next.t("runHistory:personalBest")}]`, false);
        modeText.setTint(0xffef5c, 0x47ff69, 0x6b6bff, 0xff6969);
      }
      break;
    case GameModes.CLASSIC:
      modeText.appendText(`${i18next.t("gameMode:classic")}`, false);
      break;
    }

    // Duration + Money
    const runInfoTextContainer = this.scene.add.container(0, 0);
    // Japanese is set to a greater line spacing of 35px in addBBCodeTextObject() if lineSpacing < 12.
    const lineSpacing = (i18next.resolvedLanguage === "ja") ? 12 : 3;
    const runInfoText = addBBCodeTextObject(this.scene, 7, 0, "", TextStyle.WINDOW, {fontSize: "50px", lineSpacing: lineSpacing});
    const runTime = Utils.getPlayTimeString(this.runInfo.playTime);
    runInfoText.appendText(`${i18next.t("runHistory:runLength")}: ${runTime}`, false);
    const runMoney = Utils.formatMoney(this.scene.moneyFormat, this.runInfo.money);
    runInfoText.appendText(`[color=${getTextColor(TextStyle.MONEY)}]${i18next.t("battleScene:moneyOwned", {formattedMoney : runMoney})}[/color]`);
    runInfoText.setPosition(7, 70);
    runInfoTextContainer.add(runInfoText);
    // Luck
    // Uses the parameters windowX and windowY to dynamically position the luck value neatly into the bottom right corner
    const luckText = addBBCodeTextObject(this.scene, 0, 0, "", TextStyle.WINDOW, {fontSize: "55px"});
    const luckValue = Phaser.Math.Clamp(this.runInfo.party.map(p => p.toPokemon(this.scene).getLuck()).reduce((total: integer, value: integer) => total += value, 0), 0, 14);
    let luckInfo = i18next.t("runHistory:luck")+": "+getLuckString(luckValue);
    if (luckValue < 14) {
      luckInfo = "[color=#"+(getLuckTextTint(luckValue)).toString(16)+"]"+luckInfo+"[/color]";
    } else {
      luckText.setTint(0xffef5c, 0x47ff69, 0x6b6bff, 0xff6969);
    }
    luckText.appendText("[align=right]"+luckInfo+"[/align]", false);
    luckText.setPosition(windowX-luckText.displayWidth-5, windowY-13);
    runInfoTextContainer.add(luckText);

    // Player Held Items
    // A max of 20 items can be displayed. A + sign will be added if the run's held items pushes past this maximum to show the user that there are more.
    if (this.runInfo.modifiers.length) {
      let visibleModifierIndex = 0;

      const modifierIconsContainer = this.scene.add.container(8, (this.runInfo.gameMode === GameModes.CHALLENGE) ? 20 : 15);
      modifierIconsContainer.setScale(0.45);
      for (const m of this.runInfo.modifiers) {
        const modifier = m.toModifier(this.scene, this.modifiersModule[m.className]);
        if (modifier instanceof PokemonHeldItemModifier) {
          continue;
        }
        const icon = modifier?.getIcon(this.scene, false);
        if (icon) {
          const rowHeightModifier = Math.floor(visibleModifierIndex/7);
          icon.setPosition(24 * (visibleModifierIndex%7), 20 + (35 * rowHeightModifier));
          modifierIconsContainer.add(icon);
        }

        if (++visibleModifierIndex === 20) {
          const maxItems = addTextObject(this.scene, 45, 90, "+", TextStyle.WINDOW);
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
    for (let i = 0; i < this.runInfo.challenges.length; i++) {
      if (this.runInfo.challenges[i].value !== 0) {
        switch (this.runInfo.challenges[i].id) {
        case Challenges.SINGLE_GENERATION:
          rules.push(i18next.t(`runHistory:challengeMonoGen${this.runInfo.challenges[i].value}`));
          break;
        case Challenges.SINGLE_TYPE:
          const typeRule = Type[this.runInfo.challenges[i].value-1];
          const typeTextColor = `[color=${TypeColor[typeRule]}]`;
          const typeShadowColor = `[shadow=${TypeShadow[typeRule]}]`;
          const typeText = typeTextColor + typeShadowColor + i18next.t(`pokemonInfo:Type.${typeRule}`)!+"[/color]"+"[/shadow]";
          rules.push(typeText);
          break;
        case Challenges.FRESH_START:
          rules.push(i18next.t("challenges:freshStart.name"));
          break;
        case Challenges.INVERSE_BATTLE:
          //
          rules.push(i18next.t("challenges:inverseBattle.shortName"));
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
 		const windowHeight = ((this.scene.game.canvas.height / 6) - 23)/6;

 		party.forEach((p: PokemonData, i: integer) => {
      const pokemonInfoWindow = new RoundRectangle(this.scene, 0, 14, (this.statsBgWidth*2)+10, windowHeight-2, 3);

 			const pokemon = p.toPokemon(this.scene);
 			const pokemonInfoContainer = this.scene.add.container(this.statsBgWidth+5, (windowHeight-0.5)*i);

 			const types = pokemon.getTypes();
 			const type1 = getTypeRgb(types[0]);
 			const type1Color = new Phaser.Display.Color(type1[0], type1[1], type1[2]);

 			const bgColor = type1Color.clone().darken(45);
      pokemonInfoWindow.setFillStyle(bgColor.color);

      const iconContainer = this.scene.add.container(0, 0);
      const icon = this.scene.addPokemonIcon(pokemon, 0, 0, 0, 0);
      icon.setScale(0.75);
      icon.setPosition(-99, 1);
      const type2 = types[1] ? getTypeRgb(types[1]) : undefined;
      const type2Color = type2 ? new Phaser.Display.Color(type2[0], type2[1], type2[2]) : undefined;
      type2Color ? pokemonInfoWindow.setStrokeStyle(1, type2Color.color, 0.95) : pokemonInfoWindow.setStrokeStyle(1, type1Color.color, 0.95);

      this.getUi().bringToTop(icon);

      // Contains Name, Level + Nature, Ability, Passive
      const pokeInfoTextContainer = this.scene.add.container(-85, 3.5);
      const textContainerFontSize = "34px";
      const pNature = getNatureName(pokemon.nature);
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
      const pPassiveInfo = pokemon.passive ? passiveLabel+": "+pokemon.getPassiveAbility().name : "";
      const pAbilityInfo = abilityLabel + ": " + pokemon.getAbility().name;
      // Japanese is set to a greater line spacing of 35px in addBBCodeTextObject() if lineSpacing < 12.
      const lineSpacing = (i18next.resolvedLanguage === "ja") ? 12 : 3;
      const pokeInfoText = addBBCodeTextObject(this.scene, 0, 0, pName, TextStyle.SUMMARY, {fontSize: textContainerFontSize, lineSpacing: lineSpacing});
      pokeInfoText.appendText(`${i18next.t("saveSlotSelectUiHandler:lv")}${Utils.formatFancyLargeNumber(pokemon.level, 1)} - ${pNature}`);
      pokeInfoText.appendText(pAbilityInfo);
      pokeInfoText.appendText(pPassiveInfo);
      pokeInfoTextContainer.add(pokeInfoText);

      // Pokemon Stats
      // Colored Arrows (Red/Blue) are placed by stats that are boosted from natures
      const pokeStatTextContainer = this.scene.add.container(-35, 6);
      const pStats : string[]= [];
      pokemon.stats.forEach((element) => pStats.push(Utils.formatFancyLargeNumber(element, 1)));
      for (let i = 0; i < pStats.length; i++) {
        const isMult = getNatureStatMultiplier(pokemon.nature, i);
        pStats[i] = (isMult < 1) ? pStats[i] + "[color=#40c8f8]↓[/color]" : pStats[i];
        pStats[i] = (isMult > 1) ? pStats[i] + "[color=#f89890]↑[/color]" : pStats[i];
      }
      const hp = i18next.t("pokemonInfo:Stat.HPshortened")+": "+pStats[0];
      const atk = i18next.t("pokemonInfo:Stat.ATKshortened")+": "+pStats[1];
      const def = i18next.t("pokemonInfo:Stat.DEFshortened")+": "+pStats[2];
      const spatk = i18next.t("pokemonInfo:Stat.SPATKshortened")+": "+pStats[3];
      const spdef = i18next.t("pokemonInfo:Stat.SPDEFshortened")+": "+pStats[4];
      const speedLabel = (currentLanguage==="es"||currentLanguage==="pt_BR") ? i18next.t("runHistory:SPDshortened") : i18next.t("pokemonInfo:Stat.SPDshortened");
      const speed = speedLabel+": "+pStats[5];
      // Column 1: HP Atk Def
      const pokeStatText1 = addBBCodeTextObject(this.scene, -5, 0, hp, TextStyle.SUMMARY, {fontSize: textContainerFontSize, lineSpacing: lineSpacing});
      pokeStatText1.appendText(atk);
      pokeStatText1.appendText(def);
      pokeStatTextContainer.add(pokeStatText1);
      // Column 2: SpAtk SpDef Speed
      const pokeStatText2 = addBBCodeTextObject(this.scene, 25, 0, spatk, TextStyle.SUMMARY, {fontSize: textContainerFontSize, lineSpacing: lineSpacing});
      pokeStatText2.appendText(spdef);
      pokeStatText2.appendText(speed);
      pokeStatTextContainer.add(pokeStatText2);

      // Shiny + Fusion Status
      const marksContainer = this.scene.add.container(0, 0);
      if (pokemon.fusionSpecies) {
        const splicedIcon = this.scene.add.image(0, 0, "icon_spliced");
        splicedIcon.setScale(0.35);
        splicedIcon.setOrigin(0, 0);
        pokemon.isShiny() ? splicedIcon.setPositionRelative(pokeInfoTextContainer, 35, 0) : splicedIcon.setPositionRelative(pokeInfoTextContainer, 28, 0);
        marksContainer.add(splicedIcon);
        this.getUi().bringToTop(splicedIcon);
      }
      if (pokemon.isShiny()) {
        const doubleShiny = pokemon.isFusion() && pokemon.shiny && pokemon.fusionShiny;
        const shinyStar = this.scene.add.image(0, 0, `shiny_star_small${doubleShiny ? "_1" : ""}`);
        shinyStar.setOrigin(0, 0);
        shinyStar.setScale(0.65);
        shinyStar.setPositionRelative(pokeInfoTextContainer, 28, 0);
        shinyStar.setTint(getVariantTint(!doubleShiny ? pokemon.getVariant() : pokemon.variant));
        marksContainer.add(shinyStar);
        this.getUi().bringToTop(shinyStar);
        if (doubleShiny) {
          const fusionShinyStar = this.scene.add.image(0, 0, "shiny_star_small_2");
          fusionShinyStar.setOrigin(0, 0);
          fusionShinyStar.setScale(0.5);
          fusionShinyStar.setPosition(shinyStar.x+1, shinyStar.y+1);
          fusionShinyStar.setTint(getVariantTint(pokemon.fusionVariant));
          marksContainer.add(fusionShinyStar);
          this.getUi().bringToTop(fusionShinyStar);
        }
      }

      // Pokemon Moveset
      // Need to check if dynamically typed moves
      const pokemonMoveset = pokemon.getMoveset();
      const movesetContainer = this.scene.add.container(70, -29);
      const pokemonMoveBgs : Phaser.GameObjects.NineSlice[] = [];
      const pokemonMoveLabels : Phaser.GameObjects.Text[] = [];
      const movePos = [[-6.5, 35.5], [37, 35.5], [-6.5, 43.5], [37, 43.5]];
      for (let m = 0; m < pokemonMoveset?.length; m++) {
      	const moveContainer = this.scene.add.container(movePos[m][0], movePos[m][1]);
        moveContainer.setScale(0.5);
      	const moveBg = this.scene.add.nineslice(0, 0, "type_bgs", "unknown", 85, 15, 2, 2, 2, 2);
      	moveBg.setOrigin(1, 0);
      	const moveLabel = addTextObject(this.scene, -moveBg.width / 2, 2, "-", TextStyle.PARTY);
      	moveLabel.setOrigin(0.5, 0);
      	moveLabel.setName("text-move-label");
      	pokemonMoveBgs.push(moveBg);
      	pokemonMoveLabels.push(moveLabel);
      	moveContainer.add(moveBg);
      	moveContainer.add(moveLabel);
      	movesetContainer.add(moveContainer);
      	const move = pokemonMoveset[m]?.getMove();
        pokemonMoveBgs[m].setFrame(Type[move ? move.type : Type.UNKNOWN].toString().toLowerCase());
        pokemonMoveLabels[m].setText(move ? move.name : "-");
    	}

      // Pokemon Held Items - not displayed by default
      // Endless/Endless Spliced have a different scale because Pokemon tend to accumulate more items in these runs.
      const heldItemsScale = (this.runInfo.gameMode === GameModes.SPLICED_ENDLESS || this.runInfo.gameMode === GameModes.ENDLESS) ? 0.25 : 0.5;
      const heldItemsContainer = this.scene.add.container(-82, 2);
      const heldItemsList : PokemonHeldItemModifier[] = [];
      if (this.runInfo.modifiers.length) {
        for (const m of this.runInfo.modifiers) {
          const modifier = m.toModifier(this.scene, this.modifiersModule[m.className]);
          if (modifier instanceof PokemonHeldItemModifier && modifier.pokemonId === pokemon.id) {
            modifier.stackCount = m["stackCount"];
            heldItemsList.push(modifier);
          }
        }
        if (heldItemsList.length > 0) {
          (heldItemsList as PokemonHeldItemModifier[]).sort(modifierSortFunc);
          let row = 0;
          for (const [index, item] of heldItemsList.entries()) {
            if ( index > 36 ) {
              const overflowIcon = addTextObject(this.scene, 182, 4, "+", TextStyle.WINDOW);
              heldItemsContainer.add(overflowIcon);
              break;
            }
            const itemIcon = item?.getIcon(this.scene, true);
            if (item?.stackCount < item?.getMaxHeldItemCount(pokemon) && itemIcon.list[1] instanceof Phaser.GameObjects.BitmapText) {
              itemIcon.list[1].clearTint();
            }
            itemIcon.setScale(heldItemsScale);
            itemIcon.setPosition((index%19) * 10, row * 10);
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
    this.endCardContainer = this.scene.add.container(0, 0);
    const genderIndex = this.scene.gameData.gender ?? PlayerGender.UNSET;
    const isFemale = genderIndex === PlayerGender.FEMALE;
    const endCard = this.scene.add.image(0, 0, `end_${isFemale ? "f" : "m"}`);
    endCard.setOrigin(0);
    endCard.setScale(0.5);
    const text = addTextObject(this.scene, this.scene.game.canvas.width / 12, (this.scene.game.canvas.height / 6) - 16, i18next.t("battle:congratulations"), TextStyle.SUMMARY, { fontSize: "128px" });
    text.setOrigin(0.5);
    this.endCardContainer.add(endCard);
    this.endCardContainer.add(text);
  }

  /** createHallofFame() - if the run is victorious, this creates a hall of fame image for the player to view
   * Overlay created by Koda (Thank you!)
   * This could be adapted into a public-facing method for victory screens. Perhaps.
   */
  private createHallofFame(): void {
    const genderIndex = this.scene.gameData.gender ?? PlayerGender.UNSET;
    const isFemale = genderIndex === PlayerGender.FEMALE;
    const genderStr = PlayerGender[genderIndex].toLowerCase();
    // Issue Note (08-05-2024): It seems as if fused pokemon do not appear with the averaged color b/c pokemonData's loadAsset requires there to be some active battle?
    // As an alternative, the icons of the second/bottom fused Pokemon have been placed next to their fellow fused Pokemon in Hall of Fame
    this.hallofFameContainer = this.scene.add.container(0, 0);
    // Thank you Hayuna for the code
    const endCard = this.scene.add.image(0, 0, `end_${isFemale ? "f" : "m"}`);
    endCard.setOrigin(0);
    endCard.setPosition(-1, -1);
    endCard.setScale(0.5);
    const endCardCoords = endCard.getBottomCenter();
    const overlayColor = isFemale ? "red" : "blue";
    const hallofFameBg = this.scene.add.image(0, 0, "hall_of_fame_"+overlayColor);
    hallofFameBg.setPosition(159, 89);
    hallofFameBg.setSize(this.scene.game.canvas.width, this.scene.game.canvas.height+10);
    hallofFameBg.setAlpha(0.8);
    this.hallofFameContainer.add(endCard);
    this.hallofFameContainer.add(hallofFameBg);

    const hallofFameText = addTextObject(this.scene, 0, 0, i18next.t("runHistory:hallofFameText", { context: genderStr }), TextStyle.WINDOW);
    hallofFameText.setPosition(endCardCoords.x-(hallofFameText.displayWidth/2), 164);
    this.hallofFameContainer.add(hallofFameText);
    this.runInfo.party.forEach((p, i) => {
      const pkmn = p.toPokemon(this.scene);
      const row = i % 2;
      const id = pkmn.id;
      const shiny = pkmn.shiny;
      const formIndex = pkmn.formIndex;
      const variant = pkmn.variant;
      const species = pkmn.getSpeciesForm();
      const pokemonSprite: Phaser.GameObjects.Sprite = this.scene.add.sprite(60 + 40 * i, 40 + row  * 80, "pkmn__sub");
      pokemonSprite.setPipeline(this.scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], ignoreTimeTint: true });
      this.hallofFameContainer.add(pokemonSprite);
      const speciesLoaded: Map<Species, boolean> = new Map<Species, boolean>();
      speciesLoaded.set(id, false);

      const female = pkmn.gender === 1;
      species.loadAssets(this.scene, female, formIndex, shiny, variant, true).then(() => {
        speciesLoaded.set(id, true);
        pokemonSprite.play(species.getSpriteKey(female, formIndex, shiny, variant));
        pokemonSprite.setPipelineData("shiny", shiny);
        pokemonSprite.setPipelineData("variant", variant);
        pokemonSprite.setPipelineData("spriteKey", species.getSpriteKey(female, formIndex, shiny, variant));
        pokemonSprite.setVisible(true);
      });
      if (pkmn.isFusion()) {
        const fusionIcon = this.scene.add.sprite(80 + 40 * i, 50 + row  * 80, pkmn.getFusionIconAtlasKey());
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
   * Button.CANCEL - removes all containers related to RunInfo and returns the user to Run History
   * Button.CYCLE_FORM, Button.CYCLE_SHINY, Button.CYCLE_ABILITY - runs the function buttonCycleOption()
   */
 	override processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    const error = false;

    switch (button) {
    case Button.CANCEL:
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
      if (this.isVictory) {
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
      if (this.isVictory) {
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
      if (this.partyVisibility) {
        this.showParty(false);
      } else {
        this.showParty(true);
      }
      break;
    }
  }
}

