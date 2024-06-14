import { BattleSceneEventType, CandyUpgradeNotificationChangedEvent } from "#app/battle-scene-events.js";
import { pokemonPrevolutions } from "#app/data/pokemon-evolutions";
import { Variant, getVariantTint } from "#app/data/variant";
import { argbFromRgba } from "@material/material-color-utilities";
import i18next from "i18next";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import BattleScene, { starterColors } from "../battle-scene";
import { allAbilities } from "../data/ability";
import { speciesEggMoves } from "../data/egg-moves";
import { Moves } from "../data/enums/moves";
import { Species } from "../data/enums/species";
import { GrowthRate, getGrowthRateColor } from "../data/exp";
import { Gender, getGenderColor, getGenderSymbol } from "../data/gender";
import { allMoves } from "../data/move";
import { Nature, getNatureName } from "../data/nature";
import { pokemonFormChanges } from "../data/pokemon-forms";
import { LevelMoves, pokemonFormLevelMoves, pokemonSpeciesLevelMoves } from "../data/pokemon-level-moves";
import PokemonSpecies, { allSpecies, getPokemonSpecies, getPokemonSpeciesForm, getStarterValueFriendshipCap, speciesStarters, starterPassiveAbilities } from "../data/pokemon-species";
import { Type } from "../data/type";
import { Button } from "../enums/buttons";
import { GameModes } from "../game-mode";
import { SelectChallengePhase, TitlePhase } from "../phases";
import { AbilityAttr, DexAttr, DexAttrProps, DexEntry, StarterFormMoveData, StarterMoveset } from "../system/game-data";
import { Passive as PassiveAttr } from "#app/data/enums/passive";
import { Tutorial, handleTutorial } from "../tutorial";
import * as Utils from "../utils";
import { OptionSelectItem } from "./abstact-option-select-ui-handler";
import MessageUiHandler from "./message-ui-handler";
import PokemonIconAnimHandler, { PokemonIconAnimMode } from "./pokemon-icon-anim-handler";
import { StatsContainer } from "./stats-container";
import { TextStyle, addBBCodeTextObject, addTextObject } from "./text";
import { Mode } from "./ui";
import { addWindow } from "./ui-theme";
import {SettingKeyboard} from "#app/system/settings/settings-keyboard";
import {Device} from "#app/enums/devices";
import * as Challenge from "../data/challenge";
import MoveInfoOverlay from "./move-info-overlay";

export type StarterSelectCallback = (starters: Starter[]) => void;

export interface Starter {
  species: PokemonSpecies;
  dexAttr: bigint;
  abilityIndex: integer,
  passive: boolean;
  nature: Nature;
  moveset?: StarterMoveset;
  pokerus: boolean;
}

interface LanguageSetting {
  starterInfoTextSize: string,
  instructionTextSize: string,
  starterInfoXPos?: integer,
  starterInfoYOffset?: integer
}

const languageSettings: { [key: string]: LanguageSetting } = {
  "en":{
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
  "de":{
    starterInfoTextSize: "56px",
    instructionTextSize: "35px",
  },
  "es":{
    starterInfoTextSize: "56px",
    instructionTextSize: "35px",
  },
  "fr":{
    starterInfoTextSize: "54px",
    instructionTextSize: "42px",
  },
  "it":{
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
  "pt_BR":{
    starterInfoTextSize: "47px",
    instructionTextSize: "38px",
    starterInfoXPos: 33,
  },
  "zh":{
    starterInfoTextSize: "40px",
    instructionTextSize: "42px",
    starterInfoYOffset: 2
  },
  "pt":{
    starterInfoTextSize: "48px",
    instructionTextSize: "42px",
    starterInfoXPos: 33,
  },
  "ko":{
    starterInfoTextSize: "52px",
    instructionTextSize: "38px",
  }
};

const starterCandyCosts: { passive: integer, costReduction: [integer, integer] }[] = [
  { passive: 50, costReduction: [30, 75] }, // 1
  { passive: 45, costReduction: [25, 60] }, // 2
  { passive: 40, costReduction: [20, 50] }, // 3
  { passive: 30, costReduction: [15, 40] }, // 4
  { passive: 25, costReduction: [12, 35] }, // 5
  { passive: 20, costReduction: [10, 30] }, // 6
  { passive: 15, costReduction: [8, 20] },  // 7
  { passive: 10, costReduction: [5, 15] },  // 8
  { passive: 10, costReduction: [3, 10] },  // 9
  { passive: 10, costReduction: [3, 10] },  // 10
];

function getPassiveCandyCount(baseValue: integer): integer {
  return starterCandyCosts[baseValue - 1].passive;
}

function getValueReductionCandyCounts(baseValue: integer): [integer, integer] {
  return starterCandyCosts[baseValue - 1].costReduction;
}

/**
 * Calculates the icon position for a Pokemon of a given UI index
 * @param index UI index to calculate the icon position of
 * @returns An interface with an x and y property
 */
function calcIconPosition(index: number): {x: number, y: number} {
  const x = (index % 9) * 18;
  const y = Math.floor(index / 9) * 18;

  return {x: x, y: y};
}

/**
 * Calculates the {@linkcode Phaser.GameObjects.Sprite} position for a Pokemon of a given UI index
 * @param index UI index to calculate the icon position of
 * @returns An interface with an x and y property
 */
function calcSpritePosition(index: number): {x: number, y: number} {
  const position = calcIconPosition(index);

  return {x: position.x - 2, y: position.y + 2};
}

const gens = [
  i18next.t("starterSelectUiHandler:gen1"),
  i18next.t("starterSelectUiHandler:gen2"),
  i18next.t("starterSelectUiHandler:gen3"),
  i18next.t("starterSelectUiHandler:gen4"),
  i18next.t("starterSelectUiHandler:gen5"),
  i18next.t("starterSelectUiHandler:gen6"),
  i18next.t("starterSelectUiHandler:gen7"),
  i18next.t("starterSelectUiHandler:gen8"),
  i18next.t("starterSelectUiHandler:gen9")
];

export default class StarterSelectUiHandler extends MessageUiHandler {
  private starterSelectContainer: Phaser.GameObjects.Container;
  private shinyOverlay: Phaser.GameObjects.Image;
  private starterSelectGenIconContainers: Phaser.GameObjects.Container[];
  private pokemonNumberText: Phaser.GameObjects.Text;
  private pokemonSprite: Phaser.GameObjects.Sprite;
  private pokemonNameText: Phaser.GameObjects.Text;
  private pokemonGrowthRateLabelText: Phaser.GameObjects.Text;
  private pokemonGrowthRateText: Phaser.GameObjects.Text;
  private type1Icon: Phaser.GameObjects.Sprite;
  private type2Icon: Phaser.GameObjects.Sprite;
  private pokemonLuckLabelText: Phaser.GameObjects.Text;
  private pokemonLuckText: Phaser.GameObjects.Text;
  private pokemonGenderText: Phaser.GameObjects.Text;
  private pokemonUncaughtText: Phaser.GameObjects.Text;
  private pokemonAbilityLabelText: Phaser.GameObjects.Text;
  private pokemonAbilityText: Phaser.GameObjects.Text;
  private pokemonPassiveLabelText: Phaser.GameObjects.Text;
  private pokemonPassiveText: Phaser.GameObjects.Text;
  private pokemonNatureLabelText: Phaser.GameObjects.Text;
  private pokemonNatureText: BBCodeText;
  private pokemonMovesContainer: Phaser.GameObjects.Container;
  private pokemonMoveContainers: Phaser.GameObjects.Container[];
  private pokemonMoveBgs: Phaser.GameObjects.NineSlice[];
  private pokemonMoveLabels: Phaser.GameObjects.Text[];
  private pokemonAdditionalMoveCountLabel: Phaser.GameObjects.Text;
  private pokemonEggMovesContainer: Phaser.GameObjects.Container;
  private pokemonEggMoveContainers: Phaser.GameObjects.Container[];
  private pokemonEggMoveBgs: Phaser.GameObjects.NineSlice[];
  private pokemonEggMoveLabels: Phaser.GameObjects.Text[];
  private pokemonCandyIcon: Phaser.GameObjects.Sprite;
  private pokemonCandyDarknessOverlay: Phaser.GameObjects.Sprite;
  private pokemonCandyOverlayIcon: Phaser.GameObjects.Sprite;
  private pokemonCandyCountText: Phaser.GameObjects.Text;
  private pokemonCaughtHatchedContainer: Phaser.GameObjects.Container;
  private pokemonCaughtCountText: Phaser.GameObjects.Text;
  private pokemonHatchedCountText: Phaser.GameObjects.Text;
  private genOptionsText: Phaser.GameObjects.Text;
  private instructionsContainer: Phaser.GameObjects.Container;
  private instructionsText: Phaser.GameObjects.Text;
  private starterSelectMessageBox: Phaser.GameObjects.NineSlice;
  private starterSelectMessageBoxContainer: Phaser.GameObjects.Container;
  private statsContainer: StatsContainer;
  private pokemonFormText: Phaser.GameObjects.Text;
  private moveInfoOverlay : MoveInfoOverlay;

  private genMode: boolean;
  private statsMode: boolean;
  private dexAttrCursor: bigint = 0n;
  private abilityCursor: integer = -1;
  private natureCursor: integer = -1;
  private genCursor: integer = 0;
  private genScrollCursor: integer = 0;
  private starterMoveset: StarterMoveset;

  private genSpecies: PokemonSpecies[][] = [];
  private lastSpecies: PokemonSpecies;
  private speciesLoaded: Map<Species, boolean> = new Map<Species, boolean>();
  public starterGens: integer[] = [];
  public starterCursors: integer[] = [];
  private pokerusGens: integer[] = [];
  private pokerusCursors: integer[] = [];
  private starterAttr: bigint[] = [];
  private starterAbilityIndexes: integer[] = [];
  private starterNatures: Nature[] = [];
  private starterMovesets: StarterMoveset[] = [];
  private speciesStarterDexEntry: DexEntry;
  private speciesStarterMoves: Moves[];
  private canCycleShiny: boolean;
  private canCycleForm: boolean;
  private canCycleGender: boolean;
  private canCycleAbility: boolean;
  private canCycleNature: boolean;
  private canCycleVariant: boolean;
  private value: integer = 0;
  private canAddParty: boolean;

  private assetLoadCancelled: Utils.BooleanHolder;
  public cursorObj: Phaser.GameObjects.Image;
  private starterCursorObjs: Phaser.GameObjects.Image[];
  private pokerusCursorObjs: Phaser.GameObjects.Image[];
  private starterIcons: Phaser.GameObjects.Sprite[];
  private genCursorObj: Phaser.GameObjects.Image;
  private genCursorHighlightObj: Phaser.GameObjects.Image;
  private valueLimitLabel: Phaser.GameObjects.Text;
  private startCursorObj: Phaser.GameObjects.NineSlice;
  private starterValueLabels: Phaser.GameObjects.Text[];
  private shinyIcons: Phaser.GameObjects.Image[][];
  private hiddenAbilityIcons: Phaser.GameObjects.Image[];
  private classicWinIcons: Phaser.GameObjects.Image[];
  private candyUpgradeIcon: Phaser.GameObjects.Image[];
  private candyUpgradeOverlayIcon: Phaser.GameObjects.Image[];

  private iconAnimHandler: PokemonIconAnimHandler;

  //variables to keep track of the dynamically rendered list of instruction prompts for starter select
  private instructionRowX = 0;
  private instructionRowY = 0;
  private instructionRowTextOffset = 12;

  private starterSelectCallback: StarterSelectCallback;

  protected blockInput: boolean = false;

  constructor(scene: BattleScene) {
    super(scene, Mode.STARTER_SELECT);
  }

  setup() {
    const ui = this.getUi();
    const currentLanguage = i18next.resolvedLanguage;
    const langSettingKey = Object.keys(languageSettings).find(lang => currentLanguage.includes(lang));
    const textSettings = languageSettings[langSettingKey];

    this.starterSelectContainer = this.scene.add.container(0, -this.scene.game.canvas.height / 6);
    this.starterSelectContainer.setVisible(false);
    ui.add(this.starterSelectContainer);

    const bgColor = this.scene.add.rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6, 0x006860);
    bgColor.setOrigin(0, 0);
    this.starterSelectContainer.add(bgColor);

    const starterSelectBg = this.scene.add.image(0, 0, "starter_select_bg");
    starterSelectBg.setOrigin(0, 0);
    this.starterSelectContainer.add(starterSelectBg);

    this.shinyOverlay = this.scene.add.image(6, 6, "summary_overlay_shiny");
    this.shinyOverlay.setOrigin(0, 0);
    this.shinyOverlay.setVisible(false);
    this.starterSelectContainer.add(this.shinyOverlay);

    const starterContainerWindow = addWindow(this.scene, 141, 1, 178, 178);

    this.starterSelectContainer.add(addWindow(this.scene, 107, 1, 34, 58));
    this.starterSelectContainer.add(addWindow(this.scene, 107, 59, 34, 91));
    this.starterSelectContainer.add(addWindow(this.scene, 107, 145, 34, 34, true));
    this.starterSelectContainer.add(starterContainerWindow);

    if (!this.scene.uiTheme) {
      starterContainerWindow.setVisible(false);
    }

    this.iconAnimHandler = new PokemonIconAnimHandler();
    this.iconAnimHandler.setup(this.scene);

    this.pokemonNumberText = addTextObject(this.scene, 17, 1, "0000", TextStyle.SUMMARY);
    this.pokemonNumberText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonNumberText);

    this.pokemonNameText = addTextObject(this.scene, 6, 112, "", TextStyle.SUMMARY);
    this.pokemonNameText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonNameText);

    this.pokemonGrowthRateLabelText = addTextObject(this.scene, 8, 106, i18next.t("starterSelectUiHandler:growthRate"), TextStyle.SUMMARY_ALT, { fontSize: "36px" });
    this.pokemonGrowthRateLabelText.setOrigin(0, 0);
    this.pokemonGrowthRateLabelText.setVisible(false);
    this.starterSelectContainer.add(this.pokemonGrowthRateLabelText);

    this.pokemonGrowthRateText = addTextObject(this.scene, 34, 106, "", TextStyle.SUMMARY_PINK, { fontSize: "36px" });
    this.pokemonGrowthRateText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonGrowthRateText);

    this.pokemonGenderText = addTextObject(this.scene, 96, 112, "", TextStyle.SUMMARY_ALT);
    this.pokemonGenderText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonGenderText);

    this.pokemonUncaughtText = addTextObject(this.scene, 6, 127, i18next.t("starterSelectUiHandler:uncaught"), TextStyle.SUMMARY_ALT, { fontSize: "56px" });
    this.pokemonUncaughtText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonUncaughtText);


    // The position should be set per language
    const starterInfoXPos = textSettings?.starterInfoXPos || 31;
    const starterInfoYOffset = textSettings?.starterInfoYOffset || 0;

    // The font size should be set per language
    const starterInfoTextSize = textSettings?.starterInfoTextSize || 56;

    this.pokemonAbilityLabelText = addTextObject(this.scene, 6, 127 + starterInfoYOffset, i18next.t("starterSelectUiHandler:ability"), TextStyle.SUMMARY_ALT, { fontSize: starterInfoTextSize });
    this.pokemonAbilityLabelText.setOrigin(0, 0);
    this.pokemonAbilityLabelText.setVisible(false);
    this.starterSelectContainer.add(this.pokemonAbilityLabelText);

    this.pokemonAbilityText = addTextObject(this.scene, starterInfoXPos, 127 + starterInfoYOffset, "", TextStyle.SUMMARY_ALT, { fontSize: starterInfoTextSize });
    this.pokemonAbilityText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonAbilityText);

    this.pokemonPassiveLabelText = addTextObject(this.scene, 6, 136 + starterInfoYOffset, i18next.t("starterSelectUiHandler:passive"), TextStyle.SUMMARY_ALT, { fontSize: starterInfoTextSize });
    this.pokemonPassiveLabelText.setOrigin(0, 0);
    this.pokemonPassiveLabelText.setVisible(false);
    this.starterSelectContainer.add(this.pokemonPassiveLabelText);

    this.pokemonPassiveText = addTextObject(this.scene, starterInfoXPos, 136 + starterInfoYOffset, "", TextStyle.SUMMARY_ALT, { fontSize: starterInfoTextSize });
    this.pokemonPassiveText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonPassiveText);

    this.pokemonNatureLabelText = addTextObject(this.scene, 6, 145 + starterInfoYOffset, i18next.t("starterSelectUiHandler:nature"), TextStyle.SUMMARY_ALT, { fontSize: starterInfoTextSize });
    this.pokemonNatureLabelText.setOrigin(0, 0);
    this.pokemonNatureLabelText.setVisible(false);
    this.starterSelectContainer.add(this.pokemonNatureLabelText);

    this.pokemonNatureText = addBBCodeTextObject(this.scene, starterInfoXPos, 145 + starterInfoYOffset, "", TextStyle.SUMMARY_ALT, { fontSize: starterInfoTextSize });
    this.pokemonNatureText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonNatureText);

    this.pokemonMoveContainers = [];
    this.pokemonMoveBgs = [];
    this.pokemonMoveLabels = [];

    this.pokemonEggMoveContainers = [];
    this.pokemonEggMoveBgs = [];
    this.pokemonEggMoveLabels = [];

    this.genOptionsText = addTextObject(this.scene, 124, 7, "", TextStyle.WINDOW, { fontSize: 72, lineSpacing: 39, align: "center" });
    this.genOptionsText.setShadowOffset(4.5, 4.5);
    this.genOptionsText.setOrigin(0.5, 0);
    this.starterSelectContainer.add(this.genOptionsText);

    this.updateGenOptions();

    this.starterSelectGenIconContainers = new Array(gens.length).fill(null).map((_, i) => {
      const container = this.scene.add.container(151, 9);
      if (i) {
        container.setVisible(false);
      }
      this.starterSelectContainer.add(container);
      return container;
    });

    this.pokerusCursorObjs = new Array(3).fill(null).map(() => {
      const cursorObj = this.scene.add.image(0, 0, "select_cursor_pokerus");
      cursorObj.setVisible(false);
      cursorObj.setOrigin(0, 0);
      this.starterSelectContainer.add(cursorObj);
      return cursorObj;
    });

    this.starterCursorObjs = new Array(6).fill(null).map(() => {
      const cursorObj = this.scene.add.image(0, 0, "select_cursor_highlight");
      cursorObj.setVisible(false);
      cursorObj.setOrigin(0, 0);
      this.starterSelectContainer.add(cursorObj);
      return cursorObj;
    });

    this.cursorObj = this.scene.add.image(0, 0, "select_cursor");
    this.cursorObj.setOrigin(0, 0);
    this.starterSelectContainer.add(this.cursorObj);

    this.genCursorHighlightObj = this.scene.add.image(111, 5, "select_gen_cursor_highlight");
    this.genCursorHighlightObj.setOrigin(0, 0);
    this.starterSelectContainer.add(this.genCursorHighlightObj);

    this.genCursorObj = this.scene.add.image(111, 5, "select_gen_cursor");
    this.genCursorObj.setVisible(false);
    this.genCursorObj.setOrigin(0, 0);
    this.starterSelectContainer.add(this.genCursorObj);

    this.valueLimitLabel = addTextObject(this.scene, 124, 150, "0/10", TextStyle.TOOLTIP_CONTENT);
    this.valueLimitLabel.setOrigin(0.5, 0);
    this.starterSelectContainer.add(this.valueLimitLabel);

    const startLabel = addTextObject(this.scene, 124, 162, i18next.t("starterSelectUiHandler:start"), TextStyle.TOOLTIP_CONTENT);
    startLabel.setOrigin(0.5, 0);
    this.starterSelectContainer.add(startLabel);

    this.startCursorObj = this.scene.add.nineslice(111, 160, "select_cursor", null, 26, 15, 6, 6, 6, 6);
    this.startCursorObj.setVisible(false);
    this.startCursorObj.setOrigin(0, 0);
    this.starterSelectContainer.add(this.startCursorObj);

    const starterSpecies: Species[] = [];

    for (let g = 0; g < this.starterSelectGenIconContainers.length; g++) {
      let s = 0;
      this.genSpecies.push([]);

      for (const species of allSpecies) {
        if (!speciesStarters.hasOwnProperty(species.speciesId) || species.generation !== g + 1 || !species.isObtainable()) {
          continue;
        }
        starterSpecies.push(species.speciesId);
        this.speciesLoaded.set(species.speciesId, false);
        this.genSpecies[g].push(species);
        const defaultDexAttr = this.scene.gameData.getSpeciesDefaultDexAttr(species, false, true);
        const defaultProps = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
        const position = calcIconPosition(s);
        const icon = this.scene.add.sprite(position.x - 2, position.y + 2, species.getIconAtlasKey(defaultProps.formIndex, defaultProps.shiny, defaultProps.variant));
        icon.setScale(0.5);
        icon.setOrigin(0, 0);
        icon.setFrame(species.getIconId(defaultProps.female, defaultProps.formIndex, defaultProps.shiny, defaultProps.variant));
        this.checkIconId(icon, species, defaultProps.female, defaultProps.formIndex, defaultProps.shiny, defaultProps.variant);
        icon.setTint(0);
        this.starterSelectGenIconContainers[g].add(icon);
        this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.NONE);
        s++;
      }
    }

    this.starterIcons = new Array(6).fill(null).map((_, i) => {
      const icon = this.scene.add.sprite(113, 63 + 13 * i, "pokemon_icons_0");
      icon.setScale(0.5);
      icon.setOrigin(0, 0);
      icon.setFrame("unknown");
      this.starterSelectContainer.add(icon);
      this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.PASSIVE);
      return icon;
    });

    this.starterValueLabels = new Array(81).fill(null).map((_, i) => {
      const position = calcIconPosition(i);
      const ret = addTextObject(this.scene, position.x + 152, position.y + 11, "0", TextStyle.WINDOW, { fontSize: "32px" });
      ret.setShadowOffset(2, 2);
      ret.setOrigin(0, 0);
      ret.setVisible(false);
      this.starterSelectContainer.add(ret);
      return ret;
    });

    const getShinyStar = (i: integer, v: integer): Phaser.GameObjects.Image => {
      const position = calcIconPosition(i);
      const ret = this.scene.add.image((position.x - v * 3) + 163, position.y + 11, "shiny_star_small");
      ret.setOrigin(0, 0);
      ret.setScale(0.5);
      ret.setVisible(false);
      this.starterSelectContainer.add(ret);
      return ret;
    };

    this.shinyIcons = new Array(81).fill(null).map((_, i) => {
      return new Array(3).fill(null).map((_, v) => getShinyStar(i, v));
    });

    this.hiddenAbilityIcons = new Array(81).fill(null).map((_, i) => {
      const position = calcIconPosition(i);
      const ret = this.scene.add.image(position.x + 163, position.y + 16, "ha_capsule");
      ret.setOrigin(0, 0);
      ret.setScale(0.5);
      ret.setVisible(false);
      this.starterSelectContainer.add(ret);
      return ret;
    });

    this.classicWinIcons = new Array(81).fill(null).map((_, i) => {
      const position = calcIconPosition(i);
      const ret = this.scene.add.image(position.x + 153, position.y + 21, "champion_ribbon");
      ret.setOrigin(0, 0);
      ret.setScale(0.5);
      ret.setVisible(false);
      this.starterSelectContainer.add(ret);
      return ret;
    });

    this.candyUpgradeIcon = new Array(81).fill(null).map((_, i) => {
      const position = calcIconPosition(i);
      const ret = this.scene.add.image(position.x + 163, position.y + 21, "candy");
      ret.setOrigin(0, 0);
      ret.setScale(0.25);
      ret.setVisible(false);
      this.starterSelectContainer.add(ret);
      return ret;
    });

    this.candyUpgradeOverlayIcon = new Array(81).fill(null).map((_, i) => {
      const position = calcIconPosition(i);
      const ret = this.scene.add.image(position.x + 163, position.y + 21, "candy_overlay");
      ret.setOrigin(0, 0);
      ret.setScale(0.25);
      ret.setVisible(false);
      this.starterSelectContainer.add(ret);
      return ret;
    });

    this.pokemonSprite = this.scene.add.sprite(53, 63, "pkmn__sub");
    this.pokemonSprite.setPipeline(this.scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], ignoreTimeTint: true });
    this.starterSelectContainer.add(this.pokemonSprite);

    this.type1Icon = this.scene.add.sprite(8, 98, `types${Utils.verifyLang(i18next.resolvedLanguage) ? `_${i18next.resolvedLanguage}` : ""}`);    this.type1Icon.setScale(0.5);
    this.type1Icon.setOrigin(0, 0);
    this.starterSelectContainer.add(this.type1Icon);

    this.type2Icon = this.scene.add.sprite(26, 98, `types${Utils.verifyLang(i18next.resolvedLanguage) ? `_${i18next.resolvedLanguage}` : ""}`);    this.type2Icon.setScale(0.5);
    this.type2Icon.setOrigin(0, 0);
    this.starterSelectContainer.add(this.type2Icon);

    this.pokemonLuckLabelText = addTextObject(this.scene, 8, 89, "Luck:", TextStyle.WINDOW_ALT, { fontSize: "56px" });
    this.pokemonLuckLabelText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonLuckLabelText);

    this.pokemonLuckText = addTextObject(this.scene, 8 + this.pokemonLuckLabelText.displayWidth + 2, 89, "0", TextStyle.WINDOW, { fontSize: "56px" });
    this.pokemonLuckText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonLuckText);

    this.pokemonCandyIcon = this.scene.add.sprite(4.5, 18, "candy");
    this.pokemonCandyIcon.setScale(0.5);
    this.pokemonCandyIcon.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonCandyIcon);

    this.pokemonFormText = addTextObject(this.scene, 6, 42, "Form", TextStyle.WINDOW_ALT, { fontSize: "42px" });
    this.pokemonFormText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonFormText);

    this.pokemonCandyOverlayIcon = this.scene.add.sprite(4.5, 18, "candy_overlay");
    this.pokemonCandyOverlayIcon.setScale(0.5);
    this.pokemonCandyOverlayIcon.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonCandyOverlayIcon);

    this.pokemonCandyDarknessOverlay = this.scene.add.sprite(4.5, 18, "candy");
    this.pokemonCandyDarknessOverlay.setScale(0.5);
    this.pokemonCandyDarknessOverlay.setOrigin(0, 0);
    this.pokemonCandyDarknessOverlay.setTint(0x000000);
    this.pokemonCandyDarknessOverlay.setAlpha(0.50);
    this.pokemonCandyDarknessOverlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, 16, 16), Phaser.Geom.Rectangle.Contains);
    this.starterSelectContainer.add(this.pokemonCandyDarknessOverlay);

    this.pokemonCandyCountText = addTextObject(this.scene, 14, 18, "x0", TextStyle.WINDOW_ALT, { fontSize: "56px" });
    this.pokemonCandyCountText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonCandyCountText);

    this.pokemonCaughtHatchedContainer = this.scene.add.container(2, 25);
    this.pokemonCaughtHatchedContainer.setScale(0.5);
    this.starterSelectContainer.add(this.pokemonCaughtHatchedContainer);

    const pokemonCaughtIcon = this.scene.add.sprite(1, 0, "items", "pb");
    pokemonCaughtIcon.setOrigin(0, 0);
    pokemonCaughtIcon.setScale(0.75);
    this.pokemonCaughtHatchedContainer.add(pokemonCaughtIcon);

    this.pokemonCaughtCountText = addTextObject(this.scene, 24, 4, "0", TextStyle.SUMMARY_ALT);
    this.pokemonCaughtCountText.setOrigin(0, 0);
    this.pokemonCaughtHatchedContainer.add(this.pokemonCaughtCountText);

    const pokemonHatchedIcon = this.scene.add.sprite(1, 14, "items", "mystery_egg");
    pokemonHatchedIcon.setOrigin(0, 0);
    pokemonHatchedIcon.setScale(0.75);
    this.pokemonCaughtHatchedContainer.add(pokemonHatchedIcon);

    this.pokemonHatchedCountText = addTextObject(this.scene, 24, 19, "0", TextStyle.SUMMARY_ALT);
    this.pokemonHatchedCountText.setOrigin(0, 0);
    this.pokemonCaughtHatchedContainer.add(this.pokemonHatchedCountText);

    this.pokemonMovesContainer = this.scene.add.container(102, 16);
    this.pokemonMovesContainer.setScale(0.5);

    for (let m = 0; m < 4; m++) {
      const moveContainer = this.scene.add.container(0, 14 * m);

      const moveBg = this.scene.add.nineslice(0, 0, "type_bgs", "unknown", 92, 14, 2, 2, 2, 2);
      moveBg.setOrigin(1, 0);

      const moveLabel = addTextObject(this.scene, -moveBg.width / 2, 0, "-", TextStyle.PARTY);
      moveLabel.setOrigin(0.5, 0);

      this.pokemonMoveBgs.push(moveBg);
      this.pokemonMoveLabels.push(moveLabel);

      moveContainer.add(moveBg);
      moveContainer.add(moveLabel);

      this.pokemonMoveContainers.push(moveContainer);
      this.pokemonMovesContainer.add(moveContainer);
    }

    this.pokemonAdditionalMoveCountLabel = addTextObject(this.scene, -this.pokemonMoveBgs[0].width / 2, 56, "(+0)", TextStyle.PARTY);
    this.pokemonAdditionalMoveCountLabel.setOrigin(0.5, 0);

    this.pokemonMovesContainer.add(this.pokemonAdditionalMoveCountLabel);

    this.starterSelectContainer.add(this.pokemonMovesContainer);

    this.pokemonEggMovesContainer = this.scene.add.container(102, 85);
    this.pokemonEggMovesContainer.setScale(0.375);

    const eggMovesLabel = addTextObject(this.scene, -46, 0, i18next.t("starterSelectUiHandler:eggMoves"), TextStyle.WINDOW_ALT);
    eggMovesLabel.setOrigin(0.5, 0);

    this.pokemonEggMovesContainer.add(eggMovesLabel);

    for (let m = 0; m < 4; m++) {
      const eggMoveContainer = this.scene.add.container(0, 16 + 14 * m);

      const eggMoveBg = this.scene.add.nineslice(0, 0, "type_bgs", "unknown", 92, 14, 2, 2, 2, 2);
      eggMoveBg.setOrigin(1, 0);

      const eggMoveLabel = addTextObject(this.scene, -eggMoveBg.width / 2, 0, "???", TextStyle.PARTY);
      eggMoveLabel.setOrigin(0.5, 0);

      this.pokemonEggMoveBgs.push(eggMoveBg);
      this.pokemonEggMoveLabels.push(eggMoveLabel);

      eggMoveContainer.add(eggMoveBg);
      eggMoveContainer.add(eggMoveLabel);

      this.pokemonEggMoveContainers.push(eggMoveContainer);

      this.pokemonEggMovesContainer.add(eggMoveContainer);
    }

    this.starterSelectContainer.add(this.pokemonEggMovesContainer);

    // The font size should be set per language
    this.instructionsContainer = this.scene.add.container(4, 156);
    this.instructionsContainer.setVisible(true);
    this.starterSelectContainer.add(this.instructionsContainer);

    this.starterSelectMessageBoxContainer = this.scene.add.container(0, this.scene.game.canvas.height / 6);
    this.starterSelectMessageBoxContainer.setVisible(false);
    this.starterSelectContainer.add(this.starterSelectMessageBoxContainer);

    this.starterSelectMessageBox = addWindow(this.scene, 1, -1, 318, 28);
    this.starterSelectMessageBox.setOrigin(0, 1);
    this.starterSelectMessageBoxContainer.add(this.starterSelectMessageBox);

    this.message = addTextObject(this.scene, 8, 8, "", TextStyle.WINDOW, { maxLines: 2 });
    this.message.setOrigin(0, 0);
    this.starterSelectMessageBoxContainer.add(this.message);

    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);

    this.scene.executeWithSeedOffset(() => {
      for (let c = 0; c < 3; c++) {
        let randomSpeciesId: Species;
        let species: PokemonSpecies;
        let pokerusCursor: integer;

        const generateSpecies = () => {
          randomSpeciesId = Utils.randSeedItem(starterSpecies);
          species = getPokemonSpecies(randomSpeciesId);
          pokerusCursor = this.genSpecies[species.generation - 1].indexOf(species);
        };

        let dupe = false;

        do {
          dupe = false;

          generateSpecies();

          for (let pc = 0; pc < c; pc++) {
            if (this.pokerusGens[pc] === species.generation -1 && this.pokerusCursors[pc] === pokerusCursor) {
              dupe = true;
              break;
            }
          }
        } while (dupe);

        this.pokerusGens.push(species.generation - 1);
        this.pokerusCursors.push(pokerusCursor);
        this.pokerusCursorObjs[c].setPosition(150 + 18 * (pokerusCursor % 9), 10 + 18 * Math.floor(pokerusCursor / 9));
      }
    }, 0, date.getTime().toString());

    this.statsContainer = new StatsContainer(this.scene, 6, 16);

    this.scene.add.existing(this.statsContainer);

    this.statsContainer.setVisible(false);

    this.starterSelectContainer.add(this.statsContainer);

    // add the info overlay last to be the top most ui element and prevent the IVs from overlaying this
    const overlayScale = 1;
    this.moveInfoOverlay = new MoveInfoOverlay(this.scene, {
      scale: overlayScale,
      top: true,
      x: 1,
      y: this.scene.game.canvas.height / 6 - MoveInfoOverlay.getHeight(overlayScale) - 29,
    });
    this.starterSelectContainer.add(this.moveInfoOverlay);

    this.scene.eventTarget.addEventListener(BattleSceneEventType.CANDY_UPGRADE_NOTIFICATION_CHANGED, (e) => this.onCandyUpgradeDisplayChanged(e));

    this.updateInstructions();
  }

  show(args: any[]): boolean {
    this.moveInfoOverlay.clear(); // clear this when removing a menu; the cancel button doesn't seem to trigger this automatically on controllers
    if (args.length >= 1 && args[0] instanceof Function) {
      super.show(args);
      this.starterSelectCallback = args[0] as StarterSelectCallback;

      this.starterSelectContainer.setVisible(true);

      this.setGenMode(false);
      this.setCursor(0);
      this.setGenMode(true);
      this.setCursor(0);
      this.tryUpdateValue(0);

      for (let g = 0; g < this.genSpecies.length; g++) {
        this.genSpecies[g].forEach((species, s) => {
          const icon = this.starterSelectGenIconContainers[g].getAt(s) as Phaser.GameObjects.Sprite;
          const dexEntry = this.scene.gameData.dexData[species.speciesId];

          if (dexEntry.caughtAttr) {
            icon.clearTint();
          } else if (dexEntry.seenAttr) {
            icon.setTint(0x808080);
          }

          this.setUpgradeAnimation(icon, species);
        });
      }

      handleTutorial(this.scene, Tutorial.Starter_Select);

      return true;
    }

    return false;
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);

    if (text?.indexOf("\n") === -1) {
      this.starterSelectMessageBox.setSize(318, 28);
      this.message.setY(-22);
    } else {
      this.starterSelectMessageBox.setSize(318, 42);
      this.message.setY(-37);
    }

    this.starterSelectMessageBoxContainer.setVisible(!!text?.length);
  }

  /**
   * Determines if 'Icon' based upgrade notifications should be shown
   * @returns true if upgrade notifications are enabled and set to display an 'Icon'
   */
  isUpgradeIconEnabled(): boolean {
    return this.scene.candyUpgradeNotification !== 0 && this.scene.candyUpgradeDisplay === 0;
  }
  /**
   * Determines if 'Animation' based upgrade notifications should be shown
   * @returns true if upgrade notifications are enabled and set to display an 'Animation'
   */
  isUpgradeAnimationEnabled(): boolean {
    return this.scene.candyUpgradeNotification !== 0 && this.scene.candyUpgradeDisplay === 1;
  }

  /**
   * Determines if a passive upgrade is available for the given species ID
   * @param speciesId The ID of the species to check the passive of
   * @returns true if the user has enough candies and a passive has not been unlocked already
   */
  isPassiveAvailable(speciesId: number): boolean {
    // Get this species ID's starter data
    const starterData = this.scene.gameData.starterData[speciesId];

    return starterData.candyCount >= getPassiveCandyCount(speciesStarters[speciesId])
      && !(starterData.passiveAttr & PassiveAttr.UNLOCKED);
  }

  /**
   * Determines if a value reduction upgrade is available for the given species ID
   * @param speciesId The ID of the species to check the value reduction of
   * @returns true if the user has enough candies and all value reductions have not been unlocked already
   */
  isValueReductionAvailable(speciesId: number): boolean {
    // Get this species ID's starter data
    const starterData = this.scene.gameData.starterData[speciesId];

    return starterData.candyCount >= getValueReductionCandyCounts(speciesStarters[speciesId])[starterData.valueReduction]
        && starterData.valueReduction < 2;
  }

  /**
   * Sets a bounce animation if enabled and the Pokemon has an upgrade
   * @param icon {@linkcode Phaser.GameObjects.GameObject} to animate
   * @param species {@linkcode PokemonSpecies} of the icon used to check for upgrades
   * @param startPaused Should this animation be paused after it is added?
   */
  setUpgradeAnimation(icon: Phaser.GameObjects.Sprite, species: PokemonSpecies, startPaused: boolean = false): void {
    this.scene.tweens.killTweensOf(icon);
    // Skip animations if they are disabled
    if (this.scene.candyUpgradeDisplay === 0 || species.speciesId !== species.getRootSpeciesId(false)) {
      return;
    }

    const position = calcSpritePosition(this.genSpecies[species.generation - 1].indexOf(species));
    icon.y = position.y;

    const tweenChain: Phaser.Types.Tweens.TweenChainBuilderConfig = {
      targets: icon,
      loop: -1,
      // Make the initial bounce a little randomly delayed
      delay: Utils.randIntRange(0, 50) * 5,
      loopDelay: 1000,
      tweens: [
        {
          targets: icon,
          y: position.y - 5,
          duration: Utils.fixedInt(125),
          ease: "Cubic.easeOut",
          yoyo: true
        },
        {
          targets: icon,
          y: position.y - 3,
          duration: Utils.fixedInt(150),
          ease: "Cubic.easeOut",
          yoyo: true
        }
      ],};

    const passiveAvailable = this.isPassiveAvailable(species.speciesId);
    // 'Only Passives' mode
    if (this.scene.candyUpgradeNotification === 1) {
      if (passiveAvailable) {
        this.scene.tweens.chain(tweenChain).paused = startPaused;
      }
    // 'On' mode
    } else if (this.scene.candyUpgradeNotification === 2) {
      if (passiveAvailable || this.isValueReductionAvailable(species.speciesId)) {
        this.scene.tweens.chain(tweenChain).paused = startPaused;
      }
    }
  }

  /**
   * Sets the visibility of a Candy Upgrade Icon given an index
   * @param index The UI index of the icon within this generation container
   */
  setUpgradeIcon(index: number): void {
    const species = this.genSpecies[this.getGenCursorWithScroll()][index];
    const slotVisible = !!species?.speciesId;

    if (!species // No Pokemon exists at that UI index
      || this.scene.candyUpgradeNotification === 0 // Notification setting is 'Off'
      || species.speciesId !== species.getRootSpeciesId(false)) { // Pokemon is not the base evolution and can't use candy
      // Set all icons as hidden and exit early
      this.candyUpgradeIcon[index].setVisible(false);
      this.candyUpgradeOverlayIcon[index].setVisible(false);

      return;
    }

    const passiveAvailable = this.isPassiveAvailable(species.speciesId);
    // 'Only Passive Unlocks' mode
    if (this.scene.candyUpgradeNotification === 1) {
      this.candyUpgradeIcon[index].setVisible(slotVisible && passiveAvailable);
      this.candyUpgradeOverlayIcon[index].setVisible(slotVisible && this.candyUpgradeIcon[index].visible);

      // 'On' mode
    } else if (this.scene.candyUpgradeNotification === 2) {
      this.candyUpgradeIcon[index].setVisible(
        slotVisible && ( passiveAvailable || this.isValueReductionAvailable(species.speciesId)));
      this.candyUpgradeOverlayIcon[index].setVisible(slotVisible && this.candyUpgradeIcon[index].visible);
    }
  }

  /**
   * Processes an {@linkcode CandyUpgradeNotificationChangedEvent} sent when the corresponding setting changes
   * @param event {@linkcode Event} sent by the callback
   */
  onCandyUpgradeDisplayChanged(event: Event): void {
    const candyUpgradeDisplayEvent = event as CandyUpgradeNotificationChangedEvent;
    if (!candyUpgradeDisplayEvent) {
      return;
    }

    // Loop through all visible candy icons when set to 'Icon' mode
    if (this.scene.candyUpgradeDisplay === 0) {
      this.genSpecies[this.getGenCursorWithScroll()].forEach((_species, s) => {
        this.setUpgradeIcon(s);
      });

      return;
    }

    // Loop through all animations when set to 'Animation' mode
    for (let g = 0; g < this.genSpecies.length; g++) {
      this.genSpecies[g].forEach((species, s) => {
        const icon = this.starterSelectGenIconContainers[g].getAt(s) as Phaser.GameObjects.Sprite;

        this.setUpgradeAnimation(icon, species);
      });
    }
  }

  processInput(button: Button): boolean {
    if (this.blockInput) {
      return false;
    }

    const ui = this.getUi();

    let success = false;
    let error = false;

    if (button === Button.SUBMIT) {
      if (this.tryStart(true)) {
        success = true;
      } else {
        error = true;
      }
    } else if (button === Button.CANCEL) {
      if (this.statsMode) {
        this.toggleStatsMode(false);
        success = true;
      } else if (this.starterCursors.length) {
        this.popStarter();
        success = true;
        this.updateInstructions();
      } else {
        this.blockInput = true;
        this.scene.clearPhaseQueue();
        if (this.scene.gameMode.isChallenge) {
          this.scene.pushPhase(new SelectChallengePhase(this.scene));
        } else {
          this.scene.pushPhase(new TitlePhase(this.scene));
        }
        this.scene.getCurrentPhase().end();
        success = true;
      }
    } else if (this.startCursorObj.visible) {
      switch (button) {
      case Button.ACTION:
        if (this.tryStart(true)) {
          success = true;
        } else {
          error = true;
        }
        break;
      case Button.UP:
        this.startCursorObj.setVisible(false);
        this.setGenMode(true);
        success = true;
        break;
      case Button.LEFT:
        this.startCursorObj.setVisible(false);
        this.setGenMode(false);
        this.setCursor(this.cursor + 8);
        success = true;
        break;
      case Button.RIGHT:
        this.startCursorObj.setVisible(false);
        this.setGenMode(false);
        success = true;
        break;
      }
    } else if (this.genMode) {
      switch (button) {
      case Button.UP:
        if (this.genCursor) {
          success = this.setCursor(this.genCursor - 1);
        }
        break;
      case Button.DOWN:
        if (this.genCursor < 2) {
          success = this.setCursor(this.genCursor + 1);
        } else {
          this.startCursorObj.setVisible(true);
          this.setGenMode(true);
          success = true;
        }
        break;
      case Button.LEFT:
        success = this.setGenMode(false);
        this.setCursor(this.cursor + 8);
        break;
      case Button.RIGHT:
        success = this.setGenMode(false);
        break;
      }
    } else {
      if (button === Button.ACTION) {
        if (!this.speciesStarterDexEntry?.caughtAttr) {
          error = true;
        } else if (this.starterCursors.length < 6) {
          const options = [
            {
              label: i18next.t("starterSelectUiHandler:addToParty"),
              handler: () => {
                ui.setMode(Mode.STARTER_SELECT);
                let isDupe = false;
                for (let s = 0; s < this.starterCursors.length; s++) {
                  if (this.starterGens[s] === this.getGenCursorWithScroll() && this.starterCursors[s] === this.cursor) {
                    isDupe = true;
                    break;
                  }
                }
                const species = this.genSpecies[this.getGenCursorWithScroll()][this.cursor];

                const isValidForChallenge = new Utils.BooleanHolder(true);
                Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, species, isValidForChallenge);

                if (!isDupe && isValidForChallenge.value && this.tryUpdateValue(this.scene.gameData.getSpeciesStarterValue(species.speciesId))) {
                  const cursorObj = this.starterCursorObjs[this.starterCursors.length];
                  cursorObj.setVisible(true);
                  cursorObj.setPosition(this.cursorObj.x, this.cursorObj.y);
                  const props = this.scene.gameData.getSpeciesDexAttrProps(species, this.dexAttrCursor);
                  this.starterIcons[this.starterCursors.length].setTexture(species.getIconAtlasKey(props.formIndex, props.shiny, props.variant));
                  this.starterIcons[this.starterCursors.length].setFrame(species.getIconId(props.female, props.formIndex, props.shiny, props.variant));
                  this.checkIconId(this.starterIcons[this.starterCursors.length], species, props.female, props.formIndex, props.shiny, props.variant);
                  this.starterGens.push(this.getGenCursorWithScroll());
                  this.starterCursors.push(this.cursor);
                  this.starterAttr.push(this.dexAttrCursor);
                  this.starterAbilityIndexes.push(this.abilityCursor);
                  this.starterNatures.push(this.natureCursor as unknown as Nature);
                  this.starterMovesets.push(this.starterMoveset.slice(0) as StarterMoveset);
                  if (this.speciesLoaded.get(species.speciesId)) {
                    getPokemonSpeciesForm(species.speciesId, props.formIndex).cry(this.scene);
                  }
                  if (this.starterCursors.length === 6 || this.value === this.getValueLimit()) {
                    this.tryStart();
                  }
                  this.updateInstructions();

                  /**
                   * If the user can't select a pokemon anymore,
                   * go to start button.
                   */
                  if (!this.canAddParty) {
                    this.startCursorObj.setVisible(true);
                    this.setGenMode(true);
                  }

                  ui.playSelect();
                } else {
                  ui.playError();
                }
                return true;
              },
              overrideSound: true
            },
            {
              label: i18next.t("starterSelectUiHandler:toggleIVs"),
              handler: () => {
                this.toggleStatsMode();
                ui.setMode(Mode.STARTER_SELECT);
                return true;
              }
            }
          ];
          if (this.speciesStarterMoves.length > 1) {
            const showSwapOptions = (moveset: StarterMoveset) => {
              ui.setMode(Mode.STARTER_SELECT).then(() => {
                ui.showText(i18next.t("starterSelectUiHandler:selectMoveSwapOut"), null, () => {
                  this.moveInfoOverlay.show(allMoves[moveset[0]]);

                  ui.setModeWithoutClear(Mode.OPTION_SELECT, {
                    options: moveset.map((m: Moves, i: number) => {
                      const option: OptionSelectItem = {
                        label: allMoves[m].name,
                        handler: () => {
                          ui.setMode(Mode.STARTER_SELECT).then(() => {
                            ui.showText(`${i18next.t("starterSelectUiHandler:selectMoveSwapWith")} ${allMoves[m].name}.`, null, () => {
                              const possibleMoves = this.speciesStarterMoves.filter((sm: Moves) => sm !== m);
                              this.moveInfoOverlay.show(allMoves[possibleMoves[0]]);

                              ui.setModeWithoutClear(Mode.OPTION_SELECT, {
                                options: possibleMoves.map(sm => {
                                  // make an option for each available starter move
                                  const option = {
                                    label: allMoves[sm].name,
                                    handler: () => {
                                      this.switchMoveHandler(i, sm, m);
                                      showSwapOptions(this.starterMoveset);
                                      return true;
                                    },
                                    onHover: () => {
                                      this.moveInfoOverlay.show(allMoves[sm]);
                                    },
                                  };
                                  return option;
                                }).concat({
                                  label: i18next.t("menu:cancel"),
                                  handler: () => {
                                    showSwapOptions(this.starterMoveset);
                                    return true;
                                  },
                                  onHover: () => {
                                    this.moveInfoOverlay.clear();
                                  },
                                }),
                                supportHover: true,
                                maxOptions: 8,
                                yOffset: 19
                              });
                            });
                          });
                          return true;
                        },
                        onHover: () => {
                          this.moveInfoOverlay.show(allMoves[m]);
                        },
                      };
                      return option;
                    }).concat({
                      label: i18next.t("menu:cancel"),
                      handler: () => {
                        this.moveInfoOverlay.clear();
                        this.clearText();
                        ui.setMode(Mode.STARTER_SELECT);
                        return true;
                      },
                      onHover: () => {
                        this.moveInfoOverlay.clear();
                      },
                    }),
                    supportHover: true,
                    maxOptions: 8,
                    yOffset: 19
                  });
                });
              });
            };
            options.push({
              label: i18next.t("starterSelectUiHandler:manageMoves"),
              handler: () => {
                showSwapOptions(this.starterMoveset);
                return true;
              }
            });
          }
          const starterData = this.scene.gameData.starterData[this.lastSpecies.speciesId];
          const candyCount = starterData.candyCount;
          const passiveAttr = starterData.passiveAttr;
          if (passiveAttr & PassiveAttr.UNLOCKED) {
            if (!(passiveAttr & PassiveAttr.ENABLED)) {
              options.push({
                label: i18next.t("starterSelectUiHandler:enablePassive"),
                handler: () => {
                  starterData.passiveAttr |= PassiveAttr.ENABLED;
                  ui.setMode(Mode.STARTER_SELECT);
                  this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, undefined, undefined);
                  return true;
                }
              });
            } else {
              options.push({
                label: i18next.t("starterSelectUiHandler:disablePassive"),
                handler: () => {
                  starterData.passiveAttr ^= PassiveAttr.ENABLED;
                  ui.setMode(Mode.STARTER_SELECT);
                  this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, undefined, undefined);
                  return true;
                }
              });
            }
          }
          const showUseCandies = () => {
            const options = [];
            if (!(passiveAttr & PassiveAttr.UNLOCKED)) {
              const passiveCost = getPassiveCandyCount(speciesStarters[this.lastSpecies.speciesId]);
              options.push({
                label: `x${passiveCost} ${i18next.t("starterSelectUiHandler:unlockPassive")} (${allAbilities[starterPassiveAbilities[this.lastSpecies.speciesId]].name})`,
                handler: () => {
                  if (candyCount >= passiveCost) {
                    starterData.passiveAttr |= PassiveAttr.UNLOCKED | PassiveAttr.ENABLED;
                    starterData.candyCount -= passiveCost;
                    this.pokemonCandyCountText.setText(`x${starterData.candyCount}`);
                    this.scene.gameData.saveSystem().then(success => {
                      if (!success) {
                        return this.scene.reset(true);
                      }
                    });
                    ui.setMode(Mode.STARTER_SELECT);
                    this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, undefined, undefined);

                    // Update the candy upgrade display
                    if (this.isUpgradeIconEnabled() ) {
                      this.setUpgradeIcon(this.cursor);
                    }
                    if (this.isUpgradeAnimationEnabled()) {
                      const genSpecies = this.genSpecies[this.lastSpecies.generation - 1];
                      this.setUpgradeAnimation(this.starterSelectGenIconContainers[this.lastSpecies.generation - 1].getAt(genSpecies.indexOf(this.lastSpecies)), this.lastSpecies, true);
                    }

                    return true;
                  }
                  return false;
                },
                item: "candy",
                itemArgs: starterColors[this.lastSpecies.speciesId]
              });
            }
            const valueReduction = starterData.valueReduction;
            if (valueReduction < 2) {
              const reductionCost = getValueReductionCandyCounts(speciesStarters[this.lastSpecies.speciesId])[valueReduction];
              options.push({
                label: `x${reductionCost} ${i18next.t("starterSelectUiHandler:reduceCost")}`,
                handler: () => {
                  if (candyCount >= reductionCost) {
                    starterData.valueReduction++;
                    starterData.candyCount -= reductionCost;
                    this.pokemonCandyCountText.setText(`x${starterData.candyCount}`);
                    this.scene.gameData.saveSystem().then(success => {
                      if (!success) {
                        return this.scene.reset(true);
                      }
                    });
                    this.updateStarterValueLabel(this.cursor);
                    this.tryUpdateValue(0);
                    ui.setMode(Mode.STARTER_SELECT);
                    this.scene.playSound("buy");

                    // If the notification setting is set to 'On', update the candy upgrade display
                    if (this.scene.candyUpgradeNotification === 2) {
                      if (this.isUpgradeIconEnabled() ) {
                        this.setUpgradeIcon(this.cursor);
                      }
                      if (this.isUpgradeAnimationEnabled()) {
                        const genSpecies = this.genSpecies[this.lastSpecies.generation - 1];
                        this.setUpgradeAnimation(this.starterSelectGenIconContainers[this.lastSpecies.generation - 1].getAt(genSpecies.indexOf(this.lastSpecies)), this.lastSpecies, true);
                      }
                    }

                    return true;
                  }
                  return false;
                },
                item: "candy",
                itemArgs: starterColors[this.lastSpecies.speciesId]
              });
            }
            options.push({
              label: i18next.t("menu:cancel"),
              handler: () => {
                ui.setMode(Mode.STARTER_SELECT);
                return true;
              }
            });
            ui.setModeWithoutClear(Mode.OPTION_SELECT, {
              options: options,
              yOffset: 47
            });
          };
          if (!pokemonPrevolutions.hasOwnProperty(this.lastSpecies.speciesId)) {
            options.push({
              label: i18next.t("starterSelectUiHandler:useCandies"),
              handler: () => {
                ui.setMode(Mode.STARTER_SELECT).then(() => showUseCandies());
                return true;
              }
            });
          }
          options.push({
            label: i18next.t("menu:cancel"),
            handler: () => {
              ui.setMode(Mode.STARTER_SELECT);
              return true;
            }
          });
          ui.setModeWithoutClear(Mode.OPTION_SELECT, {
            options: options,
            yOffset: 47
          });
          success = true;
        }
      } else {
        const genStarters = this.starterSelectGenIconContainers[this.getGenCursorWithScroll()].getAll().length;
        const rows = Math.ceil(genStarters / 9);
        const row = Math.floor(this.cursor / 9);
        const props = this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, this.dexAttrCursor);
        switch (button) {
        case Button.CYCLE_SHINY:
          if (this.canCycleShiny) {
            this.setSpeciesDetails(this.lastSpecies, !props.shiny, undefined, undefined, props.shiny ? 0 : undefined, undefined, undefined);
            if (this.dexAttrCursor & DexAttr.SHINY) {
              this.scene.playSound("sparkle");
            } else {
              success = true;
            }
          }
          break;
        case Button.CYCLE_FORM:
          if (this.canCycleForm) {
            const formCount = this.lastSpecies.forms.length;
            let newFormIndex = props.formIndex;
            do {
              newFormIndex = (newFormIndex + 1) % formCount;
              if (this.lastSpecies.forms[newFormIndex].isStarterSelectable && this.speciesStarterDexEntry.caughtAttr & this.scene.gameData.getFormAttr(newFormIndex)) {
                break;
              }
            } while (newFormIndex !== props.formIndex);
            this.setSpeciesDetails(this.lastSpecies, undefined, newFormIndex, undefined, undefined, undefined, undefined);
            success = true;
          }
          break;
        case Button.CYCLE_GENDER:
          if (this.canCycleGender) {
            this.setSpeciesDetails(this.lastSpecies, undefined, undefined, !props.female, undefined, undefined, undefined);
            success = true;
          }
          break;
        case Button.CYCLE_ABILITY:
          if (this.canCycleAbility) {
            const abilityCount = this.lastSpecies.getAbilityCount();
            const abilityAttr = this.scene.gameData.starterData[this.lastSpecies.speciesId].abilityAttr;
            let newAbilityIndex = this.abilityCursor;
            do {
              newAbilityIndex = (newAbilityIndex + 1) % abilityCount;
              if (!newAbilityIndex) {
                if (abilityAttr & AbilityAttr.ABILITY_1) {
                  break;
                }
              } else if (newAbilityIndex === 1) {
                if (abilityAttr & (this.lastSpecies.ability2 ? AbilityAttr.ABILITY_2 : AbilityAttr.ABILITY_HIDDEN)) {
                  break;
                }
              } else {
                if (abilityAttr & AbilityAttr.ABILITY_HIDDEN) {
                  break;
                }
              }
            } while (newAbilityIndex !== this.abilityCursor);
            this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, newAbilityIndex, undefined);
            success = true;
          }
          break;
        case Button.CYCLE_NATURE:
          if (this.canCycleNature) {
            const natures = this.scene.gameData.getNaturesForAttr(this.speciesStarterDexEntry.natureAttr);
            const natureIndex = natures.indexOf(this.natureCursor);
            const newNature = natures[natureIndex < natures.length - 1 ? natureIndex + 1 : 0];
            this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, undefined, newNature, undefined);
            success = true;
          }
          break;
        case Button.V:
          if (this.canCycleVariant) {
            let newVariant = props.variant;
            do {
              newVariant = (newVariant + 1) % 3;
              if (!newVariant) {
                if (this.speciesStarterDexEntry.caughtAttr & DexAttr.DEFAULT_VARIANT) {
                  break;
                }
              } else if (newVariant === 1) {
                if (this.speciesStarterDexEntry.caughtAttr & DexAttr.VARIANT_2) {
                  break;
                }
              } else {
                if (this.speciesStarterDexEntry.caughtAttr & DexAttr.VARIANT_3) {
                  break;
                }
              }
            } while (newVariant !== props.variant);
            this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, newVariant, undefined, undefined);
            success = true;
          }
          break;
        case Button.UP:
          if (row) {
            success = this.setCursor(this.cursor - 9);
          } else {
            // when strictly opposite starter based on rows length
            // does not exits, set cursor on the second to last row
            if (this.cursor + (rows - 1) * 9 > genStarters - 1) {
              success = this.setCursor(this.cursor + (rows - 2) * 9);
            } else {
              success = this.setCursor(this.cursor + (rows - 1) * 9);
            }
          }
          break;
        case Button.DOWN:
          if (row < rows - 2 || (row < rows - 1 && this.cursor % 9 <= (genStarters - 1) % 9)) {
            success = this.setCursor(this.cursor + 9);
          } else {
            // if there is no starter below while being on the second to
            // last row, adjust cursor position with one line less
            if (row === rows - 2 && this.cursor + 9 > genStarters - 1) {
              success = this.setCursor(this.cursor - (rows - 2) * 9);
            } else {
              success = this.setCursor(this.cursor - (rows - 1) * 9);
            }
          }
          break;
        case Button.LEFT:
          if (this.cursor % 9) {
            success = this.setCursor(this.cursor - 1);
          } else {
            if (row >= Math.min(5, rows - 1)) {
              this.startCursorObj.setVisible(true);
            }
            success = this.setGenMode(true);
          }
          break;
        case Button.RIGHT:
          if (this.cursor % 9 < (row < rows - 1 ? 8 : (genStarters - 1) % 9)) {
            success = this.setCursor(this.cursor + 1);
          } else {
            if (row >= Math.min(5, rows - 1)) {
              this.startCursorObj.setVisible(true);
            }
            success = this.setGenMode(true);
          }
          break;
        }
      }
    }

    if (success) {
      ui.playSelect();
    } else if (error) {
      ui.playError();
    }

    return success || error;
  }

  switchMoveHandler(i: number, newMove: Moves, move: Moves) {
    const speciesId = this.lastSpecies.speciesId;
    const existingMoveIndex = this.starterMoveset.indexOf(newMove);
    this.starterMoveset[i] = newMove;
    if (existingMoveIndex > -1) {
      this.starterMoveset[existingMoveIndex] = move;
    }
    const props: DexAttrProps = this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, this.dexAttrCursor);
    // species has different forms
    if (pokemonFormLevelMoves.hasOwnProperty(speciesId)) {
      // starterMoveData doesn't have base form moves or is using the single form format
      if (!this.scene.gameData.starterData[speciesId].moveset || Array.isArray(this.scene.gameData.starterData[speciesId].moveset)) {
        this.scene.gameData.starterData[speciesId].moveset = { [props.formIndex]: this.starterMoveset.slice(0) as StarterMoveset };
      }
      const starterMoveData = this.scene.gameData.starterData[speciesId].moveset;

      // starterMoveData doesn't have active form moves
      if (!starterMoveData.hasOwnProperty(props.formIndex)) {
        this.scene.gameData.starterData[speciesId].moveset[props.formIndex] = this.starterMoveset.slice(0) as StarterMoveset;
      }

      // does the species' starter move data have its form's starter moves and has it been updated
      if (starterMoveData.hasOwnProperty(props.formIndex)) {
        // active form move hasn't been updated
        if (starterMoveData[props.formIndex][existingMoveIndex] !== newMove) {
          this.scene.gameData.starterData[speciesId].moveset[props.formIndex] = this.starterMoveset.slice(0) as StarterMoveset;
        }
      }
    } else {
      this.scene.gameData.starterData[speciesId].moveset = this.starterMoveset.slice(0) as StarterMoveset;
    }
    this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, undefined, undefined, false);
  }

  createButtonFromIconText(iconSetting, gamepadType, translatedText, instructionTextSize): void {
    let iconPath;
    // touch controls cannot be rebound as is, and are just emulating a keyboard event.
    // Additionally, since keyboard controls can be rebound (and will be displayed when they are), we need to have special handling for the touch controls
    if (gamepadType === "touch") {
      gamepadType = "keyboard";
      switch (iconSetting) {
      case SettingKeyboard.Button_Cycle_Shiny:
        iconPath = "R.png";
        break;
      case SettingKeyboard.Button_Cycle_Form:
        iconPath = "F.png";
        break;
      case SettingKeyboard.Button_Cycle_Gender:
        iconPath = "G.png";
        break;
      case SettingKeyboard.Button_Cycle_Ability:
        iconPath = "E.png";
        break;
      case SettingKeyboard.Button_Cycle_Nature:
        iconPath = "N.png";
        break;
      case SettingKeyboard.Button_Cycle_Variant:
        iconPath = "V.png";
        break;
      default:
        break;
      }
    } else {
      iconPath = this.scene.inputController?.getIconForLatestInputRecorded(iconSetting);
    }
    const iconElement = this.scene.add.sprite(this.instructionRowX, this.instructionRowY, gamepadType, iconPath);
    iconElement.setScale(0.675);
    iconElement.setOrigin(0.0, 0.0);
    const controlLabel = addTextObject(this.scene, this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY, translatedText, TextStyle.PARTY, { fontSize: instructionTextSize });
    this.instructionsContainer.add([iconElement, controlLabel]);
    this.instructionRowY += 8;
    if (this.instructionRowY >= 24) {
      this.instructionRowY = 0;
      this.instructionRowX += 50;
    }
  }

  updateInstructions(): void {
    const currentLanguage = i18next.resolvedLanguage;
    const langSettingKey = Object.keys(languageSettings).find(lang => currentLanguage.includes(lang));
    const textSettings = languageSettings[langSettingKey];
    const instructionTextSize = textSettings.instructionTextSize;
    this.instructionRowX = 0;
    this.instructionRowY = 0;
    this.instructionsContainer.removeAll();
    let gamepadType;
    if (this.scene.inputMethod === "gamepad") {
      gamepadType = this.scene.inputController.getConfig(this.scene.inputController.selectedDevice[Device.GAMEPAD]).padType;
    } else {
      gamepadType = this.scene.inputMethod;
    }

    if (this.speciesStarterDexEntry?.caughtAttr) {
      if (this.canCycleShiny) {
        this.createButtonFromIconText(SettingKeyboard.Button_Cycle_Shiny, gamepadType, i18next.t("starterSelectUiHandler:cycleShiny"), instructionTextSize);
      }
      if (this.canCycleForm) {
        this.createButtonFromIconText(SettingKeyboard.Button_Cycle_Form, gamepadType, i18next.t("starterSelectUiHandler:cycleForm"), instructionTextSize);
      }
      if (this.canCycleGender) {
        this.createButtonFromIconText(SettingKeyboard.Button_Cycle_Gender, gamepadType, i18next.t("starterSelectUiHandler:cycleGender"), instructionTextSize);
      }
      if (this.canCycleAbility) {
        this.createButtonFromIconText(SettingKeyboard.Button_Cycle_Ability, gamepadType, i18next.t("starterSelectUiHandler:cycleAbility"), instructionTextSize);
      }
      if (this.canCycleNature) {
        this.createButtonFromIconText(SettingKeyboard.Button_Cycle_Nature, gamepadType, i18next.t("starterSelectUiHandler:cycleNature"), instructionTextSize);
      }
      if (this.canCycleVariant) {
        this.createButtonFromIconText(SettingKeyboard.Button_Cycle_Variant, gamepadType, i18next.t("starterSelectUiHandler:cycleVariant"), instructionTextSize);
      }
    }
  }

  getValueLimit(): integer {
    const valueLimit = new Utils.IntegerHolder(0);
    switch (this.scene.gameMode.modeId) {
    case GameModes.ENDLESS:
    case GameModes.SPLICED_ENDLESS:
      valueLimit.value = 15;
      break;
    default:
      valueLimit.value = 10;
    }

    Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_POINTS, valueLimit);

    return valueLimit.value;
  }

  setCursor(cursor: integer): boolean {
    let changed = false;

    if (this.genMode) {
      changed = this.genCursor !== cursor;

      let genCursorWithScroll = this.getGenCursorWithScroll();

      if (!cursor && this.genScrollCursor) {
        this.genScrollCursor--;
        cursor++;
        this.updateGenOptions();
      } else if (cursor === 2 && this.genScrollCursor < gens.length - 3) {
        this.genScrollCursor++;
        cursor--;
        this.updateGenOptions();
      }

      if (genCursorWithScroll !== undefined) {
        this.starterSelectGenIconContainers[genCursorWithScroll].setVisible(false);
      }
      this.cursor = 0;
      this.genCursor = cursor;
      genCursorWithScroll = this.getGenCursorWithScroll();
      this.genCursorObj.setY(5 + 17 * this.genCursor);
      this.genCursorHighlightObj.setY(this.genCursorObj.y);
      this.starterSelectGenIconContainers[genCursorWithScroll].setVisible(true);

      for (let s = 0; s < this.starterCursorObjs.length; s++) {
        this.starterCursorObjs[s].setVisible(this.starterGens[s] === genCursorWithScroll);
      }
      for (let s = 0; s < this.pokerusCursorObjs.length; s++) {
        this.pokerusCursorObjs[s].setVisible(this.pokerusGens[s] === genCursorWithScroll);
      }

      const genLimit = this.genSpecies[genCursorWithScroll].length;
      for (let s = 0; s < 81; s++) {
        const speciesId = s < genLimit ? this.genSpecies[genCursorWithScroll][s].speciesId : 0 as Species;
        const slotVisible = !!speciesId;
        if (slotVisible) {
          this.updateStarterValueLabel(s);
        }
        this.starterValueLabels[s].setVisible(slotVisible);
        const speciesVariants = speciesId && this.scene.gameData.dexData[speciesId].caughtAttr & DexAttr.SHINY
          ? [ DexAttr.DEFAULT_VARIANT, DexAttr.VARIANT_2, DexAttr.VARIANT_3 ].filter(v => !!(this.scene.gameData.dexData[speciesId].caughtAttr & v))
          : [];
        for (let v = 0; v < 3; v++) {
          const hasVariant = speciesVariants.length > v;
          this.shinyIcons[s][v].setVisible(slotVisible && hasVariant);
          if (hasVariant) {
            this.shinyIcons[s][v].setTint(getVariantTint(speciesVariants[v] === DexAttr.DEFAULT_VARIANT ? 0 : speciesVariants[v] === DexAttr.VARIANT_2 ? 1 : 2));
          }
        }
        this.hiddenAbilityIcons[s].setVisible(slotVisible && !!this.scene.gameData.dexData[speciesId].caughtAttr && !!(this.scene.gameData.starterData[speciesId].abilityAttr & 4));
        this.classicWinIcons[s].setVisible(slotVisible && this.scene.gameData.starterData[speciesId].classicWinCount > 0);

        // 'Candy Icon' mode
        if (this.scene.candyUpgradeDisplay === 0) {

          if (!starterColors[speciesId]) {
            // Default to white if no colors are found
            starterColors[speciesId] = [ "ffffff", "ffffff" ];
          }

          // Set the candy colors
          this.candyUpgradeIcon[s].setTint(argbFromRgba(Utils.rgbHexToRgba(starterColors[speciesId][0])));
          this.candyUpgradeOverlayIcon[s].setTint(argbFromRgba(Utils.rgbHexToRgba(starterColors[speciesId][1])));

          this.setUpgradeIcon(s);
        } else if (this.scene.candyUpgradeDisplay === 1) {
          this.candyUpgradeIcon[s].setVisible(false);
          this.candyUpgradeOverlayIcon[s].setVisible(false);
        }
      }
    } else {
      changed = super.setCursor(cursor);

      this.cursorObj.setPosition(150 + 18 * (cursor % 9), 10 + 18 * Math.floor(cursor / 9));

      this.setSpecies(this.genSpecies[this.getGenCursorWithScroll()][cursor]);

      this.updateInstructions();
    }

    return changed;
  }

  getGenCursorWithScroll(): integer {
    return this.genCursor !== undefined
      ? this.genCursor + this.genScrollCursor
      : undefined;
  }

  updateGenOptions(): void {
    let text = "";
    for (let g = this.genScrollCursor; g <= this.genScrollCursor + 2; g++) {
      let optionText = "";
      if (g === this.genScrollCursor && this.genScrollCursor) {
        optionText = "↑";
      } else if (g === this.genScrollCursor + 2 && this.genScrollCursor < gens.length - 3) {
        optionText = "↓";
      } else {
        optionText = i18next.t(`starterSelectUiHandler:gen${g + 1}`);
      }
      text += `${text ? "\n" : ""}${optionText}`;
    }
    this.genOptionsText.setText(text);
  }

  setGenMode(genMode: boolean): boolean {
    this.genCursorObj.setVisible(genMode && !this.startCursorObj.visible);
    this.cursorObj.setVisible(!genMode && !this.startCursorObj.visible);

    if (genMode !== this.genMode) {
      this.genMode = genMode;

      this.setCursor(genMode ? this.genCursor : this.cursor);
      if (genMode) {
        this.setSpecies(null);
      }

      return true;
    }

    return false;
  }

  setSpecies(species: PokemonSpecies) {
    this.speciesStarterDexEntry = species ? this.scene.gameData.dexData[species.speciesId] : null;
    this.dexAttrCursor = species ? this.scene.gameData.getSpeciesDefaultDexAttr(species, false, true) : 0n;
    this.abilityCursor = species ? this.scene.gameData.getStarterSpeciesDefaultAbilityIndex(species) : 0;
    this.natureCursor = species ? this.scene.gameData.getSpeciesDefaultNature(species) : 0;

    if (this.statsMode) {
      if (this.speciesStarterDexEntry?.caughtAttr) {
        this.statsContainer.setVisible(true);
        this.showStats();
      } else {
        this.statsContainer.setVisible(false);
        this.statsContainer.updateIvs(null);
      }
    }

    if (this.lastSpecies) {
      const dexAttr = this.scene.gameData.getSpeciesDefaultDexAttr(this.lastSpecies, false, true);
      const props = this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, dexAttr);
      const lastSpeciesIcon = (this.starterSelectGenIconContainers[this.lastSpecies.generation - 1].getAt(this.genSpecies[this.lastSpecies.generation - 1].indexOf(this.lastSpecies)) as Phaser.GameObjects.Sprite);
      lastSpeciesIcon.setTexture(this.lastSpecies.getIconAtlasKey(props.formIndex, props.shiny, props.variant), this.lastSpecies.getIconId(props.female, props.formIndex, props.shiny, props.variant));
      this.checkIconId(lastSpeciesIcon, this.lastSpecies, props.female, props.formIndex, props.shiny, props.variant);
      this.iconAnimHandler.addOrUpdate(lastSpeciesIcon, PokemonIconAnimMode.NONE);

      // Resume the animation for the previously selected species
      const speciesIndex = this.genSpecies[this.lastSpecies.generation - 1].indexOf(this.lastSpecies);
      const icon = this.starterSelectGenIconContainers[this.lastSpecies.generation - 1].getAt(speciesIndex) as Phaser.GameObjects.Sprite;
      this.scene.tweens.getTweensOf(icon).forEach(tween => tween.resume());
    }

    this.lastSpecies = species;

    if (species && (this.speciesStarterDexEntry?.seenAttr || this.speciesStarterDexEntry?.caughtAttr)) {
      this.pokemonNumberText.setText(Utils.padInt(species.speciesId, 4));
      this.pokemonNameText.setText(species.name);

      if (this.speciesStarterDexEntry?.caughtAttr) {
        const colorScheme = starterColors[species.speciesId];

        const luck = this.scene.gameData.getDexAttrLuck(this.speciesStarterDexEntry.caughtAttr);
        this.pokemonLuckText.setVisible(!!luck);
        this.pokemonLuckText.setText(luck.toString());
        this.pokemonLuckText.setTint(getVariantTint(Math.min(luck - 1, 2) as Variant));
        this.pokemonLuckLabelText.setVisible(this.pokemonLuckText.visible);

        //Growth translate
        let growthReadable = Utils.toReadableString(GrowthRate[species.growthRate]);
        const growthAux = growthReadable.replace(" ", "_");
        if (i18next.exists("growth:" + growthAux)) {
          growthReadable = i18next.t("growth:"+ growthAux as any);
        }
        this.pokemonGrowthRateText.setText(growthReadable);

        this.pokemonGrowthRateText.setColor(getGrowthRateColor(species.growthRate));
        this.pokemonGrowthRateText.setShadowColor(getGrowthRateColor(species.growthRate, true));
        this.pokemonGrowthRateLabelText.setVisible(true);
        this.pokemonUncaughtText.setVisible(false);
        this.pokemonAbilityLabelText.setVisible(true);
        this.pokemonPassiveLabelText.setVisible(true);
        this.pokemonNatureLabelText.setVisible(true);
        this.pokemonCaughtCountText.setText(`${this.speciesStarterDexEntry.caughtCount}`);
        this.pokemonHatchedCountText.setText(`${this.speciesStarterDexEntry.hatchedCount}`);
        this.pokemonCaughtHatchedContainer.setVisible(true);
        if (pokemonPrevolutions.hasOwnProperty(species.speciesId)) {
          this.pokemonCaughtHatchedContainer.setY(16);
          [ this.pokemonCandyIcon, this.pokemonCandyOverlayIcon, this.pokemonCandyDarknessOverlay, this.pokemonCandyCountText ].map(c => c.setVisible(false));
        } else {
          this.pokemonCaughtHatchedContainer.setY(25);
          this.pokemonCandyIcon.setTint(argbFromRgba(Utils.rgbHexToRgba(colorScheme[0])));
          this.pokemonCandyIcon.setVisible(true);
          this.pokemonCandyOverlayIcon.setTint(argbFromRgba(Utils.rgbHexToRgba(colorScheme[1])));
          this.pokemonCandyOverlayIcon.setVisible(true);
          this.pokemonCandyDarknessOverlay.setVisible(true);
          this.pokemonCandyCountText.setText(`x${this.scene.gameData.starterData[species.speciesId].candyCount}`);
          this.pokemonCandyCountText.setVisible(true);
          this.pokemonFormText.setVisible(true);

          let currentFriendship = this.scene.gameData.starterData[this.lastSpecies.speciesId].friendship;
          if (!currentFriendship || currentFriendship === undefined) {
            currentFriendship = 0;
          }

          const friendshipCap = getStarterValueFriendshipCap(speciesStarters[this.lastSpecies.speciesId]);
          const candyCropY = 16 - (16 * (currentFriendship / friendshipCap));

          if (this.pokemonCandyDarknessOverlay.visible) {
            this.pokemonCandyDarknessOverlay.on("pointerover", () => (this.scene as BattleScene).ui.showTooltip(null, `${currentFriendship}/${friendshipCap}`, true));
            this.pokemonCandyDarknessOverlay.on("pointerout", () => (this.scene as BattleScene).ui.hideTooltip());
          }

          this.pokemonCandyDarknessOverlay.setCrop(0,0,16, candyCropY);
        }


        // Pause the animation when the species is selected
        const speciesIndex = this.genSpecies[species.generation - 1].indexOf(species);
        const icon = this.starterSelectGenIconContainers[species.generation - 1].getAt(speciesIndex) as Phaser.GameObjects.Sprite;

        if (this.isUpgradeAnimationEnabled()) {
          this.scene.tweens.getTweensOf(icon).forEach(tween => tween.pause());
          // Reset the position of the icon
          const position = calcSpritePosition(speciesIndex);
          icon.x = position.x;
          icon.y = position.y;
        }

        // Initiates the small up and down idle animation
        this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.PASSIVE);

        let starterIndex = -1;

        this.starterGens.every((g, i) => {
          const starterSpecies = this.genSpecies[g][this.starterCursors[i]];
          if (starterSpecies.speciesId === species.speciesId) {
            starterIndex = i;
            return false;
          }
          return true;
        });

        let props: DexAttrProps;

        if (starterIndex > -1) {
          props = this.scene.gameData.getSpeciesDexAttrProps(species, this.starterAttr[starterIndex]);
          this.setSpeciesDetails(species, props.shiny, props.formIndex, props.female, props.variant, this.starterAbilityIndexes[starterIndex], this.starterNatures[starterIndex]);
        } else {
          const defaultDexAttr = this.scene.gameData.getSpeciesDefaultDexAttr(species, false, true);
          const defaultAbilityIndex = this.scene.gameData.getStarterSpeciesDefaultAbilityIndex(species);
          const defaultNature = this.scene.gameData.getSpeciesDefaultNature(species);
          props = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);

          this.setSpeciesDetails(species, props.shiny, props.formIndex, props.female, props.variant, defaultAbilityIndex, defaultNature);
        }

        const speciesForm = getPokemonSpeciesForm(species.speciesId, props.formIndex);
        this.setTypeIcons(speciesForm.type1, speciesForm.type2);

        this.pokemonSprite.clearTint();
        if (this.pokerusCursors.find((cursor: integer, i: integer) => cursor === this.cursor && this.pokerusGens[i] === this.getGenCursorWithScroll())) {
          handleTutorial(this.scene, Tutorial.Pokerus);
        }
      } else {
        this.pokemonGrowthRateText.setText("");
        this.pokemonGrowthRateLabelText.setVisible(false);
        this.type1Icon.setVisible(false);
        this.type2Icon.setVisible(false);
        this.pokemonLuckLabelText.setVisible(false);
        this.pokemonLuckText.setVisible(false);
        this.pokemonUncaughtText.setVisible(true);
        this.pokemonAbilityLabelText.setVisible(false);
        this.pokemonPassiveLabelText.setVisible(false);
        this.pokemonNatureLabelText.setVisible(false);
        this.pokemonCaughtHatchedContainer.setVisible(false);
        this.pokemonCandyIcon.setVisible(false);
        this.pokemonCandyOverlayIcon.setVisible(false);
        this.pokemonCandyDarknessOverlay.setVisible(false);
        this.pokemonCandyCountText.setVisible(false);
        this.pokemonFormText.setVisible(false);

        const defaultDexAttr = this.scene.gameData.getSpeciesDefaultDexAttr(species, true, true);
        const defaultAbilityIndex = this.scene.gameData.getStarterSpeciesDefaultAbilityIndex(species);
        const defaultNature = this.scene.gameData.getSpeciesDefaultNature(species);
        const props = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);

        this.setSpeciesDetails(species, props.shiny, props.formIndex, props.female, props.variant, defaultAbilityIndex, defaultNature, true);
        this.pokemonSprite.setTint(0x808080);
      }
    } else {
      this.pokemonNumberText.setText(Utils.padInt(0, 4));
      this.pokemonNameText.setText(species ? "???" : "");
      this.pokemonGrowthRateText.setText("");
      this.pokemonGrowthRateLabelText.setVisible(false);
      this.type1Icon.setVisible(false);
      this.type2Icon.setVisible(false);
      this.pokemonLuckLabelText.setVisible(false);
      this.pokemonLuckText.setVisible(false);
      this.pokemonUncaughtText.setVisible(!!species);
      this.pokemonAbilityLabelText.setVisible(false);
      this.pokemonPassiveLabelText.setVisible(false);
      this.pokemonNatureLabelText.setVisible(false);
      this.pokemonCaughtHatchedContainer.setVisible(false);
      this.pokemonCandyIcon.setVisible(false);
      this.pokemonCandyOverlayIcon.setVisible(false);
      this.pokemonCandyDarknessOverlay.setVisible(false);
      this.pokemonCandyCountText.setVisible(false);
      this.pokemonFormText.setVisible(false);

      this.setSpeciesDetails(species, false, 0, false, 0, 0, 0);
      this.pokemonSprite.clearTint();
    }
  }

  setSpeciesDetails(species: PokemonSpecies, shiny: boolean, formIndex: integer, female: boolean, variant: Variant, abilityIndex: integer, natureIndex: integer, forSeen: boolean = false): void {
    const oldProps = species ? this.scene.gameData.getSpeciesDexAttrProps(species, this.dexAttrCursor) : null;
    const oldAbilityIndex = this.abilityCursor > -1 ? this.abilityCursor : this.scene.gameData.getStarterSpeciesDefaultAbilityIndex(species);
    const oldNatureIndex = this.natureCursor > -1 ? this.natureCursor : this.scene.gameData.getSpeciesDefaultNature(species);
    this.dexAttrCursor = 0n;
    this.abilityCursor = -1;
    this.natureCursor = -1;

    if (species?.forms?.find(f => f.formKey === "female")) {
      if (female !== undefined) {
        formIndex = female ? 1 : 0;
      } else if (formIndex !== undefined) {
        female = formIndex === 1;
      }
    }

    if (species) {
      this.dexAttrCursor |= (shiny !== undefined ? !shiny : !(shiny = oldProps.shiny)) ? DexAttr.NON_SHINY : DexAttr.SHINY;
      this.dexAttrCursor |= (female !== undefined ? !female : !(female = oldProps.female)) ? DexAttr.MALE : DexAttr.FEMALE;
      this.dexAttrCursor |= (variant !== undefined ? !variant : !(variant = oldProps.variant)) ? DexAttr.DEFAULT_VARIANT : variant === 1 ? DexAttr.VARIANT_2 : DexAttr.VARIANT_3;
      this.dexAttrCursor |= this.scene.gameData.getFormAttr(formIndex !== undefined ? formIndex : (formIndex = oldProps.formIndex));
      this.abilityCursor = abilityIndex !== undefined ? abilityIndex : (abilityIndex = oldAbilityIndex);
      this.natureCursor = natureIndex !== undefined ? natureIndex : (natureIndex = oldNatureIndex);
    }

    this.pokemonSprite.setVisible(false);

    if (this.assetLoadCancelled) {
      this.assetLoadCancelled.value = true;
      this.assetLoadCancelled = null;
    }

    this.starterMoveset = null;
    this.speciesStarterMoves = [];

    if (species) {
      const dexEntry = this.scene.gameData.dexData[species.speciesId];
      const abilityAttr = this.scene.gameData.starterData[species.speciesId].abilityAttr;
      if (!dexEntry.caughtAttr) {
        const props = this.scene.gameData.getSpeciesDexAttrProps(species, this.scene.gameData.getSpeciesDefaultDexAttr(species, forSeen, !forSeen));
        const defaultAbilityIndex = this.scene.gameData.getStarterSpeciesDefaultAbilityIndex(species);
        const defaultNature = this.scene.gameData.getSpeciesDefaultNature(species);
        if (shiny === undefined || shiny !== props.shiny) {
          shiny = props.shiny;
        }
        if (formIndex === undefined || formIndex !== props.formIndex) {
          formIndex = props.formIndex;
        }
        if (female === undefined || female !== props.female) {
          female = props.female;
        }
        if (variant === undefined || variant !== props.variant) {
          variant = props.variant;
        }
        if (abilityIndex === undefined || abilityIndex !== defaultAbilityIndex) {
          abilityIndex = defaultAbilityIndex;
        }
        if (natureIndex === undefined || natureIndex !== defaultNature) {
          natureIndex = defaultNature;
        }
      }

      this.shinyOverlay.setVisible(shiny);
      this.pokemonNumberText.setColor(this.getTextColor(shiny ? TextStyle.SUMMARY_GOLD : TextStyle.SUMMARY, false));
      this.pokemonNumberText.setShadowColor(this.getTextColor(shiny ? TextStyle.SUMMARY_GOLD : TextStyle.SUMMARY, true));

      if (forSeen ? this.speciesStarterDexEntry?.seenAttr : this.speciesStarterDexEntry?.caughtAttr) {
        let starterIndex = -1;

        this.starterGens.every((g, i) => {
          const starterSpecies = this.genSpecies[g][this.starterCursors[i]];
          if (starterSpecies.speciesId === species.speciesId) {
            starterIndex = i;
            return false;
          }
          return true;
        });

        if (starterIndex > -1) {
          this.starterAttr[starterIndex] = this.dexAttrCursor;
          this.starterAbilityIndexes[starterIndex] = this.abilityCursor;
          this.starterNatures[starterIndex] = this.natureCursor;
        }

        const assetLoadCancelled = new Utils.BooleanHolder(false);
        this.assetLoadCancelled = assetLoadCancelled;

        species.loadAssets(this.scene, female, formIndex, shiny, variant, true).then(() => {
          if (assetLoadCancelled.value) {
            return;
          }
          this.assetLoadCancelled = null;
          this.speciesLoaded.set(species.speciesId, true);
          this.pokemonSprite.play(species.getSpriteKey(female, formIndex, shiny, variant));
          this.pokemonSprite.setPipelineData("shiny", shiny);
          this.pokemonSprite.setPipelineData("variant", variant);
          this.pokemonSprite.setPipelineData("spriteKey", species.getSpriteKey(female, formIndex, shiny, variant));
          this.pokemonSprite.setVisible(!this.statsMode);
        });

        (this.starterSelectGenIconContainers[this.getGenCursorWithScroll()].getAt(this.cursor) as Phaser.GameObjects.Sprite)
          .setTexture(species.getIconAtlasKey(formIndex, shiny, variant), species.getIconId(female, formIndex, shiny, variant));
        this.checkIconId((this.starterSelectGenIconContainers[this.getGenCursorWithScroll()].getAt(this.cursor) as Phaser.GameObjects.Sprite), species, female, formIndex, shiny, variant);
        this.canCycleShiny = !!(dexEntry.caughtAttr & DexAttr.NON_SHINY && dexEntry.caughtAttr & DexAttr.SHINY);
        this.canCycleGender = !!(dexEntry.caughtAttr & DexAttr.MALE && dexEntry.caughtAttr & DexAttr.FEMALE);
        this.canCycleAbility = [ abilityAttr & AbilityAttr.ABILITY_1, (abilityAttr & AbilityAttr.ABILITY_2) && species.ability2, abilityAttr & AbilityAttr.ABILITY_HIDDEN ].filter(a => a).length > 1;
        this.canCycleForm = species.forms.filter(f => f.isStarterSelectable || !pokemonFormChanges[species.speciesId]?.find(fc => fc.formKey))
          .map((_, f) => dexEntry.caughtAttr & this.scene.gameData.getFormAttr(f)).filter(f => f).length > 1;
        this.canCycleNature = this.scene.gameData.getNaturesForAttr(dexEntry.natureAttr).length > 1;
        this.canCycleVariant = shiny && [ dexEntry.caughtAttr & DexAttr.DEFAULT_VARIANT, dexEntry.caughtAttr & DexAttr.VARIANT_2, dexEntry.caughtAttr & DexAttr.VARIANT_3].filter(v => v).length > 1;
      }

      if (dexEntry.caughtAttr && species.malePercent !== null) {
        const gender = !female ? Gender.MALE : Gender.FEMALE;
        this.pokemonGenderText.setText(getGenderSymbol(gender));
        this.pokemonGenderText.setColor(getGenderColor(gender));
        this.pokemonGenderText.setShadowColor(getGenderColor(gender, true));
      } else {
        this.pokemonGenderText.setText("");
      }

      if (dexEntry.caughtAttr) {
        const ability = this.lastSpecies.getAbility(abilityIndex);
        this.pokemonAbilityText.setText(allAbilities[ability].name);

        const isHidden = abilityIndex === (this.lastSpecies.ability2 ? 2 : 1);
        this.pokemonAbilityText.setColor(this.getTextColor(!isHidden ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GOLD));
        this.pokemonAbilityText.setShadowColor(this.getTextColor(!isHidden ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GOLD, true));

        const passiveAttr = this.scene.gameData.starterData[species.speciesId].passiveAttr;
        this.pokemonPassiveText.setText(passiveAttr & PassiveAttr.UNLOCKED ? passiveAttr & PassiveAttr.ENABLED ? allAbilities[starterPassiveAbilities[this.lastSpecies.speciesId]].name : i18next.t("starterSelectUiHandler:disabled") : i18next.t("starterSelectUiHandler:locked"));
        this.pokemonPassiveText.setColor(this.getTextColor(passiveAttr === (PassiveAttr.UNLOCKED | PassiveAttr.ENABLED) ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GRAY));
        this.pokemonPassiveText.setShadowColor(this.getTextColor(passiveAttr === (PassiveAttr.UNLOCKED | PassiveAttr.ENABLED) ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GRAY, true));

        this.pokemonNatureText.setText(getNatureName(natureIndex as unknown as Nature, true, true, false, this.scene.uiTheme));

        let levelMoves: LevelMoves;
        if (pokemonFormLevelMoves.hasOwnProperty(species.speciesId) && pokemonFormLevelMoves[species.speciesId].hasOwnProperty(formIndex)) {
          levelMoves = pokemonFormLevelMoves[species.speciesId][formIndex];
        } else {
          levelMoves = pokemonSpeciesLevelMoves[species.speciesId];
        }
        this.speciesStarterMoves.push(...levelMoves.filter(lm => lm[0] <= 5).map(lm => lm[1]));
        if (speciesEggMoves.hasOwnProperty(species.speciesId)) {
          for (let em = 0; em < 4; em++) {
            if (this.scene.gameData.starterData[species.speciesId].eggMoves & Math.pow(2, em)) {
              this.speciesStarterMoves.push(speciesEggMoves[species.speciesId][em]);
            }
          }
        }

        const speciesMoveData = this.scene.gameData.starterData[species.speciesId].moveset;
        const moveData: StarterMoveset = speciesMoveData
          ? Array.isArray(speciesMoveData)
            ? speciesMoveData as StarterMoveset
            : (speciesMoveData as StarterFormMoveData)[formIndex]
          : null;
        const availableStarterMoves = this.speciesStarterMoves.concat(speciesEggMoves.hasOwnProperty(species.speciesId) ? speciesEggMoves[species.speciesId].filter((_, em: integer) => this.scene.gameData.starterData[species.speciesId].eggMoves & Math.pow(2, em)) : []);
        this.starterMoveset = (moveData || (this.speciesStarterMoves.slice(0, 4) as StarterMoveset)).filter(m => availableStarterMoves.find(sm => sm === m)) as StarterMoveset;
        // Consolidate move data if it contains an incompatible move
        if (this.starterMoveset.length < 4 && this.starterMoveset.length < availableStarterMoves.length) {
          this.starterMoveset.push(...availableStarterMoves.filter(sm => this.starterMoveset.indexOf(sm) === -1).slice(0, 4 - this.starterMoveset.length));
        }

        // Remove duplicate moves
        this.starterMoveset = this.starterMoveset.filter(
          (move, i) => {
            return this.starterMoveset.indexOf(move) === i;
          }) as StarterMoveset;

        const speciesForm = getPokemonSpeciesForm(species.speciesId, formIndex);

        const formText = species?.forms[formIndex]?.formKey.split("-");
        for (let i = 0; i < formText?.length; i++) {
          formText[i] = formText[i].charAt(0).toUpperCase() + formText[i].substring(1);
        }

        this.pokemonFormText.setText(formText?.join(" "));

        this.setTypeIcons(speciesForm.type1, speciesForm.type2);
      } else {
        this.pokemonAbilityText.setText("");
        this.pokemonPassiveText.setText("");
        this.pokemonNatureText.setText("");
        this.setTypeIcons(null, null);
      }
    } else {
      this.shinyOverlay.setVisible(false);
      this.pokemonNumberText.setColor(this.getTextColor(TextStyle.SUMMARY));
      this.pokemonNumberText.setShadowColor(this.getTextColor(TextStyle.SUMMARY, true));
      this.pokemonGenderText.setText("");
      this.pokemonAbilityText.setText("");
      this.pokemonPassiveText.setText("");
      this.pokemonNatureText.setText("");
      this.setTypeIcons(null, null);
    }

    if (!this.starterMoveset) {
      this.starterMoveset = this.speciesStarterMoves.slice(0, 4) as StarterMoveset;
    }

    for (let m = 0; m < 4; m++) {
      const move = m < this.starterMoveset.length ? allMoves[this.starterMoveset[m]] : null;
      this.pokemonMoveBgs[m].setFrame(Type[move ? move.type : Type.UNKNOWN].toString().toLowerCase());
      this.pokemonMoveLabels[m].setText(move ? move.name : "-");
      this.pokemonMoveContainers[m].setVisible(!!move);
    }

    const hasEggMoves = species && speciesEggMoves.hasOwnProperty(species.speciesId);

    for (let em = 0; em < 4; em++) {
      const eggMove = hasEggMoves ? allMoves[speciesEggMoves[species.speciesId][em]] : null;
      const eggMoveUnlocked = eggMove && this.scene.gameData.starterData[species.speciesId].eggMoves & Math.pow(2, em);
      this.pokemonEggMoveBgs[em].setFrame(Type[eggMove ? eggMove.type : Type.UNKNOWN].toString().toLowerCase());
      this.pokemonEggMoveLabels[em].setText(eggMove && eggMoveUnlocked ? eggMove.name : "???");
    }

    this.pokemonEggMovesContainer.setVisible(this.speciesStarterDexEntry?.caughtAttr && hasEggMoves);

    this.pokemonAdditionalMoveCountLabel.setText(`(+${Math.max(this.speciesStarterMoves.length - 4, 0)})`);
    this.pokemonAdditionalMoveCountLabel.setVisible(this.speciesStarterMoves.length > 4);

    this.updateInstructions();
  }

  setTypeIcons(type1: Type, type2: Type): void {
    if (type1 !== null) {
      this.type1Icon.setVisible(true);
      this.type1Icon.setFrame(Type[type1].toLowerCase());
    } else {
      this.type1Icon.setVisible(false);
    }
    if (type2 !== null) {
      this.type2Icon.setVisible(true);
      this.type2Icon.setFrame(Type[type2].toLowerCase());
    } else {
      this.type2Icon.setVisible(false);
    }
  }

  popStarter(): void {
    this.starterGens.pop();
    this.starterCursors.pop();
    this.starterAttr.pop();
    this.starterAbilityIndexes.pop();
    this.starterNatures.pop();
    this.starterMovesets.pop();
    this.starterCursorObjs[this.starterCursors.length].setVisible(false);
    this.starterIcons[this.starterCursors.length].setTexture("pokemon_icons_0");
    this.starterIcons[this.starterCursors.length].setFrame("unknown");
    this.tryUpdateValue();
  }

  updateStarterValueLabel(cursor: integer): void {
    const speciesId = this.genSpecies[this.getGenCursorWithScroll()][cursor].speciesId;
    const baseStarterValue = speciesStarters[speciesId];
    const starterValue = this.scene.gameData.getSpeciesStarterValue(speciesId);
    let valueStr = starterValue.toString();
    if (valueStr.startsWith("0.")) {
      valueStr = valueStr.slice(1);
    }
    this.starterValueLabels[cursor].setText(valueStr);
    let textStyle: TextStyle;
    switch (baseStarterValue - starterValue) {
    case 0:
      textStyle = TextStyle.WINDOW;
      break;
    case 1:
    case 0.5:
      textStyle = TextStyle.SUMMARY_BLUE;
      break;
    default:
      textStyle = TextStyle.SUMMARY_GOLD;
      break;
    }
    this.starterValueLabels[cursor].setColor(this.getTextColor(textStyle));
    this.starterValueLabels[cursor].setShadowColor(this.getTextColor(textStyle, true));
  }

  tryUpdateValue(add?: integer): boolean {
    const value = this.starterGens.reduce((total: integer, gen: integer, i: integer) => total += this.scene.gameData.getSpeciesStarterValue(this.genSpecies[gen][this.starterCursors[i]].speciesId), 0);
    const newValue = value + (add || 0);
    const valueLimit = this.getValueLimit();
    const overLimit = newValue > valueLimit;
    let newValueStr = newValue.toString();
    if (newValueStr.startsWith("0.")) {
      newValueStr = newValueStr.slice(1);
    }
    this.valueLimitLabel.setText(`${newValueStr}/${valueLimit}`);
    this.valueLimitLabel.setColor(this.getTextColor(!overLimit ? TextStyle.TOOLTIP_CONTENT : TextStyle.SUMMARY_PINK));
    this.valueLimitLabel.setShadowColor(this.getTextColor(!overLimit ? TextStyle.TOOLTIP_CONTENT : TextStyle.SUMMARY_PINK, true));
    if (overLimit) {
      this.scene.time.delayedCall(Utils.fixedInt(500), () => this.tryUpdateValue());
      return false;
    }

    /**
     * this loop is used to set the Sprite's alpha value and check if the user can select other pokemon more.
     */
    this.canAddParty = false;
    const remainValue = valueLimit - newValue;
    for (let g = 0; g < this.genSpecies.length; g++) {
      for (let s = 0; s < this.genSpecies[g].length; s++) {
        /** Cost of pokemon species */
        const speciesStarterValue = this.scene.gameData.getSpeciesStarterValue(this.genSpecies[g][s].speciesId);
        /** Used to detect if this pokemon is registered in starter */
        const speciesStarterDexEntry = this.scene.gameData.dexData[this.genSpecies[g][s].speciesId];
        /** {@linkcode Phaser.GameObjects.Sprite} object of Pokémon for setting the alpha value */
        const speciesSprite = this.starterSelectGenIconContainers[g].getAt(s) as Phaser.GameObjects.Sprite;

        /**
         * If remainValue greater than or equal pokemon species and the pokemon is legal for this challenge, the user can select.
         * so that the alpha value of pokemon sprite set 1.
         *
         * If speciesStarterDexEntry?.caughtAttr is true, this species registered in stater.
         * we change to can AddParty value to true since the user has enough cost to choose this pokemon and this pokemon registered too.
         */
        const isValidForChallenge = new Utils.BooleanHolder(true);
        Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, this.genSpecies[g][s], isValidForChallenge);

        const canBeChosen = remainValue >= speciesStarterValue && isValidForChallenge.value;

        if (canBeChosen) {
          speciesSprite.setAlpha(1);
          if (speciesStarterDexEntry?.caughtAttr) {
            this.canAddParty = true;
          }
        } else {
          /**
           * If it can't be chosen, the user can't select.
           * so that the alpha value of pokemon sprite set 0.375.
           */
          speciesSprite.setAlpha(0.375);
        }
      }
    }

    this.value = newValue;
    return true;
  }

  tryStart(manualTrigger: boolean = false): boolean {
    if (!this.starterGens.length) {
      return false;
    }

    const ui = this.getUi();

    const cancel = () => {
      ui.setMode(Mode.STARTER_SELECT);
      if (!manualTrigger) {
        this.popStarter();
      }
      this.clearText();
    };

    ui.showText(i18next.t("starterSelectUiHandler:confirmStartTeam"), null, () => {
      ui.setModeWithoutClear(Mode.CONFIRM, () => {
        const startRun = () => {
          this.scene.money = this.scene.gameMode.getStartingMoney();
          ui.setMode(Mode.STARTER_SELECT);
          const thisObj = this;
          const originalStarterSelectCallback = this.starterSelectCallback;
          this.starterSelectCallback = null;
          originalStarterSelectCallback(new Array(this.starterGens.length).fill(0).map(function (_, i) {
            const starterSpecies = thisObj.genSpecies[thisObj.starterGens[i]][thisObj.starterCursors[i]];
            return {
              species: starterSpecies,
              dexAttr: thisObj.starterAttr[i],
              abilityIndex: thisObj.starterAbilityIndexes[i],
              passive: !(thisObj.scene.gameData.starterData[starterSpecies.speciesId].passiveAttr ^ (PassiveAttr.ENABLED | PassiveAttr.UNLOCKED)),
              nature: thisObj.starterNatures[i] as Nature,
              moveset: thisObj.starterMovesets[i],
              pokerus: !![ 0, 1, 2 ].filter(n => thisObj.pokerusGens[n] === starterSpecies.generation - 1 && thisObj.pokerusCursors[n] === thisObj.genSpecies[starterSpecies.generation - 1].indexOf(starterSpecies)).length
            };
          }));
        };
        startRun();
      }, cancel, null, null, 19);
    });

    return true;
  }

  toggleStatsMode(on?: boolean): void {
    if (on === undefined) {
      on = !this.statsMode;
    }
    if (on) {
      this.showStats();
      this.statsMode = true;
      this.pokemonSprite.setVisible(false);
    } else {
      this.statsMode = false;
      this.statsContainer.setVisible(false);
      this.pokemonSprite.setVisible(!!this.speciesStarterDexEntry?.caughtAttr);
      this.statsContainer.updateIvs(null);
    }
  }

  showStats(): void {
    if (!this.speciesStarterDexEntry) {
      return;
    }

    this.statsContainer.setVisible(true);

    this.statsContainer.updateIvs(this.speciesStarterDexEntry.ivs);
  }

  clearText() {
    this.starterSelectMessageBoxContainer.setVisible(false);
    super.clearText();
  }

  clear(): void {
    super.clear();
    this.cursor = -1;
    this.starterSelectContainer.setVisible(false);
    this.blockInput = false;

    while (this.starterCursors.length) {
      this.popStarter();
    }

    if (this.statsMode) {
      this.toggleStatsMode(false);
    }
  }

  checkIconId(icon: Phaser.GameObjects.Sprite, species: PokemonSpecies, female, formIndex, shiny, variant) {
    if (icon.frame.name !== species.getIconId(female, formIndex, shiny, variant)) {
      console.log(`${species.name}'s variant icon does not exist. Replacing with default.`);
      icon.setTexture(species.getIconAtlasKey(formIndex, false, variant));
      icon.setFrame(species.getIconId(female, formIndex, false, variant));
    }
  }
}
