import { BattleSceneEventType, CandyUpgradeNotificationChangedEvent } from "../events/battle-scene";
import { pokemonPrevolutions } from "#app/data/pokemon-evolutions";
import { Variant, getVariantTint, getVariantIcon } from "#app/data/variant";
import { argbFromRgba } from "@material/material-color-utilities";
import i18next from "i18next";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import BattleScene, { starterColors } from "../battle-scene";
import { allAbilities } from "../data/ability";
import { speciesEggMoves } from "../data/egg-moves";
import { GrowthRate, getGrowthRateColor } from "../data/exp";
import { Gender, getGenderColor, getGenderSymbol } from "../data/gender";
import { allMoves } from "../data/move";
import { Nature, getNatureName } from "../data/nature";
import { pokemonFormChanges } from "../data/pokemon-forms";
import { LevelMoves, pokemonFormLevelMoves, pokemonSpeciesLevelMoves } from "../data/pokemon-level-moves";
import PokemonSpecies, { allSpecies, getPokemonSpecies, getPokemonSpeciesForm, getStarterValueFriendshipCap, speciesStarters, starterPassiveAbilities } from "../data/pokemon-species";
import { Type } from "../data/type";
import { GameModes } from "../game-mode";
import { SelectChallengePhase, TitlePhase } from "../phases";
import { AbilityAttr, DexAttr, DexAttrProps, DexEntry, StarterFormMoveData, StarterMoveset, StarterAttributes, StarterPreferences, StarterPrefs } from "../system/game-data";
import { Tutorial, handleTutorial } from "../tutorial";
import * as Utils from "../utils";
import { OptionSelectItem } from "./abstact-option-select-ui-handler";
import MessageUiHandler from "./message-ui-handler";
import PokemonIconAnimHandler, { PokemonIconAnimMode } from "./pokemon-icon-anim-handler";
import { StatsContainer } from "./stats-container";
import { TextStyle, addBBCodeTextObject, addTextObject } from "./text";
import { Mode } from "./ui";
import { addWindow } from "./ui-theme";
import { Egg } from "#app/data/egg";
import Overrides from "#app/overrides";
import {SettingKeyboard} from "#app/system/settings/settings-keyboard";
import {Passive as PassiveAttr} from "#enums/passive";
import * as Challenge from "../data/challenge";
import MoveInfoOverlay from "./move-info-overlay";
import { getEggTierForSpecies } from "#app/data/egg.js";
import { Device } from "#enums/devices";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import {Button} from "#enums/buttons";
import { EggSourceType } from "#app/enums/egg-source-types.js";
import AwaitableUiHandler from "./awaitable-ui-handler";
import { DropDown, DropDownOption, DropDownState, DropDownType } from "./dropdown";
import { StarterContainer } from "./starter-container";
import { DropDownColumn, FilterBar } from "./filter-bar";
import { ScrollBar } from "./scroll-bar";

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

const starterCandyCosts: { passive: integer, costReduction: [integer, integer], egg: integer }[] = [
  { passive: 50, costReduction: [30, 75], egg: 35 }, // 1
  { passive: 45, costReduction: [25, 60], egg: 35 }, // 2
  { passive: 40, costReduction: [20, 50], egg: 35 }, // 3
  { passive: 30, costReduction: [15, 40], egg: 30 }, // 4
  { passive: 25, costReduction: [12, 35], egg: 25 }, // 5
  { passive: 20, costReduction: [10, 30], egg: 20 }, // 6
  { passive: 15, costReduction: [8, 20], egg: 15 },  // 7
  { passive: 10, costReduction: [5, 15], egg: 10 },  // 8
  { passive: 10, costReduction: [3, 10], egg: 10 },  // 9
  { passive: 10, costReduction: [3, 10], egg: 10 },  // 10
];

function getPassiveCandyCount(baseValue: integer): integer {
  return starterCandyCosts[baseValue - 1].passive;
}

function getValueReductionCandyCounts(baseValue: integer): [integer, integer] {
  return starterCandyCosts[baseValue - 1].costReduction;
}

function getSameSpeciesEggCandyCounts(baseValue: integer): integer {
  return starterCandyCosts[baseValue - 1].egg;
}

/**
 * Calculates the starter position for a Pokemon of a given UI index
 * @param index UI index to calculate the starter position of
 * @returns An interface with an x and y property
 */
function calcStarterPosition(index: number, scrollCursor:number = 0): {x: number, y: number} {
  const yOffset = 13;
  const height = 17;
  const x = (index % 9) * 18;
  const y = yOffset + (Math.floor(index / 9) - scrollCursor) * height;

  return {x: x, y: y};
}

export default class StarterSelectUiHandler extends MessageUiHandler {
  private starterSelectContainer: Phaser.GameObjects.Container;
  private starterSelectScrollBar: ScrollBar;
  private filterBarContainer: Phaser.GameObjects.Container;
  private filterBar: FilterBar;
  private shinyOverlay: Phaser.GameObjects.Image;
  private starterContainer: StarterContainer[] = [];
  private filteredStarterContainers: StarterContainer[] = [];
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
  private pokemonHatchedIcon : Phaser.GameObjects.Sprite;
  private pokemonHatchedCountText: Phaser.GameObjects.Text;
  private pokemonShinyIcon: Phaser.GameObjects.Sprite;

  private instructionsContainer: Phaser.GameObjects.Container;
  private shinyIconElement: Phaser.GameObjects.Sprite;
  private formIconElement: Phaser.GameObjects.Sprite;
  private abilityIconElement: Phaser.GameObjects.Sprite;
  private genderIconElement: Phaser.GameObjects.Sprite;
  private natureIconElement: Phaser.GameObjects.Sprite;
  private variantIconElement: Phaser.GameObjects.Sprite;
  private shinyLabel: Phaser.GameObjects.Text;
  private formLabel: Phaser.GameObjects.Text;
  private genderLabel: Phaser.GameObjects.Text;
  private abilityLabel: Phaser.GameObjects.Text;
  private natureLabel: Phaser.GameObjects.Text;
  private variantLabel: Phaser.GameObjects.Text;

  private starterSelectMessageBox: Phaser.GameObjects.NineSlice;
  private starterSelectMessageBoxContainer: Phaser.GameObjects.Container;
  private statsContainer: StatsContainer;
  private pokemonFormText: Phaser.GameObjects.Text;
  private moveInfoOverlay : MoveInfoOverlay;

  private statsMode: boolean;
  private starterIconsCursorXOffset: number = -3;
  private starterIconsCursorYOffset: number = 1;
  private starterIconsCursorIndex: number;
  private filterMode: boolean;
  private dexAttrCursor: bigint = 0n;
  private abilityCursor: number = -1;
  private natureCursor: number = -1;
  private filterBarCursor: integer = 0;
  private starterMoveset: StarterMoveset;
  private scrollCursor: number;

  private allSpecies: PokemonSpecies[] = [];
  private lastSpecies: PokemonSpecies;
  private speciesLoaded: Map<Species, boolean> = new Map<Species, boolean>();
  public starterSpecies: PokemonSpecies[] = [];
  private pokerusSpecies: PokemonSpecies[] = [];
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
  private starterIconsCursorObj: Phaser.GameObjects.Image;
  private valueLimitLabel: Phaser.GameObjects.Text;
  private startCursorObj: Phaser.GameObjects.NineSlice;
  // private starterValueLabels: Phaser.GameObjects.Text[];
  // private shinyIcons: Phaser.GameObjects.Image[][];
  // private hiddenAbilityIcons: Phaser.GameObjects.Image[];
  // private classicWinIcons: Phaser.GameObjects.Image[];
  // private candyUpgradeIcon: Phaser.GameObjects.Image[];
  // private candyUpgradeOverlayIcon: Phaser.GameObjects.Image[];
  //
  private iconAnimHandler: PokemonIconAnimHandler;

  //variables to keep track of the dynamically rendered list of instruction prompts for starter select
  private instructionRowX = 0;
  private instructionRowY = 0;
  private instructionRowTextOffset = 12;

  private starterSelectCallback: StarterSelectCallback;

  private starterPreferences: StarterPreferences;

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

    const starterContainerWindow = addWindow(this.scene, 109, 18, 175, 161);
    const starterContainerBg = this.scene.add.image(110, 19, "starter_container_bg");
    starterContainerBg.setOrigin(0, 0);
    this.starterSelectContainer.add(starterContainerBg);

    this.starterSelectContainer.add(addWindow(this.scene, 285, 59, 34, 91));
    this.starterSelectContainer.add(addWindow(this.scene, 285, 145, 34, 34, true));
    this.starterSelectContainer.add(starterContainerWindow);

    this.filterBarContainer = this.scene.add.container(0, 0);

    // this.filterBar = new FilterBar(this.scene, 143, 1, 175, 17);
    this.filterBar = new FilterBar(this.scene, 109, 1, 175, 17);

    // gen filter
    const genOptions: DropDownOption[] = [
      new DropDownOption(this.scene, 1, i18next.t("starterSelectUiHandler:gen1"), null, DropDownState.ON),
      new DropDownOption(this.scene, 2, i18next.t("starterSelectUiHandler:gen2"), null, DropDownState.ON),
      new DropDownOption(this.scene, 3, i18next.t("starterSelectUiHandler:gen3"), null, DropDownState.ON),
      new DropDownOption(this.scene, 4, i18next.t("starterSelectUiHandler:gen4"), null, DropDownState.ON),
      new DropDownOption(this.scene, 5, i18next.t("starterSelectUiHandler:gen5"), null, DropDownState.ON),
      new DropDownOption(this.scene, 6, i18next.t("starterSelectUiHandler:gen6"), null, DropDownState.ON),
      new DropDownOption(this.scene, 7, i18next.t("starterSelectUiHandler:gen7"), null, DropDownState.ON),
      new DropDownOption(this.scene, 8, i18next.t("starterSelectUiHandler:gen8"), null, DropDownState.ON),
      new DropDownOption(this.scene, 9, i18next.t("starterSelectUiHandler:gen9"), null, DropDownState.ON),
    ];
    this.filterBar.addFilter("Gen", new DropDown(this.scene, 0, 0, genOptions, this.updateStarters, DropDownType.MULTI));
    this.filterBar.defaultGenVals = this.filterBar.getVals(DropDownColumn.GEN);
    // set gen filter to all off except for the I GEN
    for (const option of genOptions) {
      if (option.val !== 1) {
        option.setOptionState(DropDownState.OFF);
      }
    }

    // type filter
    const typeKeys = Object.keys(Type).filter(v => isNaN(Number(v)));
    const typeOptions: DropDownOption[] = [];
    typeKeys.forEach((type, index) => {
      if (index === 0 || index === 19) {
        return;
      }
      const typeSprite = this.scene.add.sprite(0, 0, `types${Utils.verifyLang(i18next.resolvedLanguage) ? `_${i18next.resolvedLanguage}` : ""}`);
      typeSprite.setScale(0.5);
      typeSprite.setFrame(type.toLowerCase());
      typeOptions.push(new DropDownOption(this.scene, index, null, typeSprite));
    });
    this.filterBar.addFilter("Type", new DropDown(this.scene, 0, 0, typeOptions, this.updateStarters, DropDownType.MULTI, 0.5));
    this.filterBar.defaultTypeVals = this.filterBar.getVals(DropDownColumn.TYPES);

    // Unlocks filter
    const shiny1Sprite = this.scene.add.sprite(0, 0, "shiny_star_small");
    shiny1Sprite.setTint(getVariantTint(0));
    const shiny2Sprite = this.scene.add.sprite(0, 0, "shiny_star_small");
    shiny2Sprite.setTint(getVariantTint(1));
    const shiny3Sprite = this.scene.add.sprite(0, 0, "shiny_star_small");
    shiny3Sprite.setTint(getVariantTint(2));

    const unlocksOptions = [
      new DropDownOption(this.scene, "SHINY3", null, shiny3Sprite),
      new DropDownOption(this.scene, "SHINY2", null, shiny2Sprite),
      new DropDownOption(this.scene, "SHINY", null, shiny1Sprite),
      new DropDownOption(this.scene, "NORMAL", "Normal"),
      new DropDownOption(this.scene, "UNCAUGHT", "Not Caught"),
      new DropDownOption(this.scene, "PASSIVEUNLOCKED", "Passive Unlocked"),
      new DropDownOption(this.scene, "PASSIVELOCKED", "Passive Locked"),];

    this.filterBar.addFilter("Unlocks", new DropDown(this.scene, 0, 0, unlocksOptions, this.updateStarters, DropDownType.MULTI));
    this.filterBar.defaultUnlockVals = this.filterBar.getVals(DropDownColumn.UNLOCKS);

    // win filter
    const winOptions = [
      new DropDownOption(this.scene, "WIN", "has won"),
      new DropDownOption(this.scene, "NOTWIN", "hasn't won yet")];
    this.filterBar.addFilter("Win", new DropDown(this.scene, 0, 0, winOptions, this.updateStarters, DropDownType.MULTI));
    this.filterBar.defaultWinVals = this.filterBar.getVals(DropDownColumn.WIN);

    // sort filter
    const sortOptions = [
      new DropDownOption(this.scene, 0, "No."),
      new DropDownOption(this.scene, 1, "Cost", null, DropDownState.OFF),
      new DropDownOption(this.scene, 2, "# Candies", null, DropDownState.OFF),
      new DropDownOption(this.scene, 3, "IVs", null, DropDownState.OFF),
      new DropDownOption(this.scene, 4, "Name", null, DropDownState.OFF)];
    this.filterBar.addFilter("Sort", new DropDown(this.scene, 0, 0, sortOptions, this.updateStarters, DropDownType.SINGLE));
    this.filterBarContainer.add(this.filterBar);
    this.filterBar.defaultSortVals = this.filterBar.getVals(DropDownColumn.SORT);

    this.starterSelectContainer.add(this.filterBarContainer);

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

    this.valueLimitLabel = addTextObject(this.scene, 302, 150, "0/10", TextStyle.TOOLTIP_CONTENT);
    this.valueLimitLabel.setOrigin(0.5, 0);
    this.starterSelectContainer.add(this.valueLimitLabel);

    const startLabel = addTextObject(this.scene, 302, 162, i18next.t("common:start"), TextStyle.TOOLTIP_CONTENT);
    startLabel.setOrigin(0.5, 0);
    this.starterSelectContainer.add(startLabel);

    this.startCursorObj = this.scene.add.nineslice(289, 160, "select_cursor", null, 26, 15, 6, 6, 6, 6);
    this.startCursorObj.setVisible(false);
    this.startCursorObj.setOrigin(0, 0);
    this.starterSelectContainer.add(this.startCursorObj);

    const starterSpecies: Species[] = [];

    const starterBoxContainer = this.scene.add.container(115, 9);

    this.starterSelectScrollBar = new ScrollBar(this.scene, 161, 12, 0);

    starterBoxContainer.add(this.starterSelectScrollBar);

    this.pokerusCursorObjs = new Array(3).fill(null).map(() => {
      const cursorObj = this.scene.add.image(0, 0, "select_cursor_pokerus");
      cursorObj.setVisible(false);
      cursorObj.setOrigin(0, 0);
      starterBoxContainer.add(cursorObj);
      return cursorObj;
    });

    this.starterCursorObjs = new Array(6).fill(null).map(() => {
      const cursorObj = this.scene.add.image(0, 0, "select_cursor_highlight");
      cursorObj.setVisible(false);
      cursorObj.setOrigin(0, 0);
      starterBoxContainer.add(cursorObj);
      return cursorObj;
    });

    this.cursorObj = this.scene.add.image(0, 0, "select_cursor");
    this.cursorObj.setOrigin(0, 0);
    this.starterIconsCursorObj = this.scene.add.image(289, 64, "select_gen_cursor");
    this.starterIconsCursorObj.setName("starter-icons-cursor");
    this.starterIconsCursorObj.setVisible(false);
    this.starterIconsCursorObj.setOrigin(0, 0);
    this.starterSelectContainer.add(this.starterIconsCursorObj);

    starterBoxContainer.add(this.cursorObj);

    for (const species of allSpecies) {
      if (!speciesStarters.hasOwnProperty(species.speciesId) || !species.isObtainable()) {
        continue;
      }

      starterSpecies.push(species.speciesId);
      this.speciesLoaded.set(species.speciesId, false);
      this.allSpecies.push(species);

      const starterContainer = new StarterContainer(this.scene, species).setVisible(false);
      this.iconAnimHandler.addOrUpdate(starterContainer.icon, PokemonIconAnimMode.NONE);
      this.starterContainer.push(starterContainer);
      starterBoxContainer.add(starterContainer);
    }

    this.starterSelectContainer.add(starterBoxContainer);

    this.starterIcons = new Array(6).fill(null).map((_, i) => {
      const icon = this.scene.add.sprite(292, 63 + 13 * i, "pokemon_icons_0");
      icon.setScale(0.5);
      icon.setOrigin(0, 0);
      icon.setFrame("unknown");
      this.starterSelectContainer.add(icon);
      this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.PASSIVE);
      return icon;
    });

    this.pokemonSprite = this.scene.add.sprite(53, 63, "pkmn__sub");
    this.pokemonSprite.setPipeline(this.scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], ignoreTimeTint: true });
    this.starterSelectContainer.add(this.pokemonSprite);

    this.type1Icon = this.scene.add.sprite(8, 98, `types${Utils.verifyLang(i18next.resolvedLanguage) ? `_${i18next.resolvedLanguage}` : ""}`);
    this.type1Icon.setScale(0.5);
    this.type1Icon.setOrigin(0, 0);
    this.starterSelectContainer.add(this.type1Icon);

    this.type2Icon = this.scene.add.sprite(26, 98, `types${Utils.verifyLang(i18next.resolvedLanguage) ? `_${i18next.resolvedLanguage}` : ""}`);
    this.type2Icon.setScale(0.5);
    this.type2Icon.setOrigin(0, 0);
    this.starterSelectContainer.add(this.type2Icon);

    this.pokemonLuckLabelText = addTextObject(this.scene, 8, 89, i18next.t("common:luckIndicator"), TextStyle.WINDOW_ALT, { fontSize: "56px" });
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

    this.pokemonHatchedIcon = this.scene.add.sprite(1, 14, "egg_icons");
    this.pokemonHatchedIcon.setOrigin(0.15, 0.2);
    this.pokemonHatchedIcon.setScale(0.8);
    this.pokemonCaughtHatchedContainer.add(this.pokemonHatchedIcon);

    this.pokemonShinyIcon = this.scene.add.sprite(14, 76, "shiny_icons");
    this.pokemonShinyIcon.setOrigin(0.15, 0.2);
    this.pokemonShinyIcon.setScale(1);
    this.pokemonCaughtHatchedContainer.add ((this.pokemonShinyIcon));

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
    const instructionTextSize = textSettings.instructionTextSize;

    this.instructionsContainer = this.scene.add.container(4, 156);
    this.instructionsContainer.setVisible(true);
    this.starterSelectContainer.add(this.instructionsContainer);

    // instruction rows that will be pushed into the container dynamically based on need
    // creating new sprites since they will be added to the scene later
    this.shinyIconElement = new Phaser.GameObjects.Sprite(this.scene, this.instructionRowX, this.instructionRowY, "keyboard", "R.png");
    this.shinyIconElement.setName("sprite-shiny-icon-element");
    this.shinyIconElement.setScale(0.675);
    this.shinyIconElement.setOrigin(0.0, 0.0);
    this.shinyLabel = addTextObject(this.scene, this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY, i18next.t("starterSelectUiHandler:cycleShiny"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.shinyLabel.setName("text-shiny-label");

    this.formIconElement = new Phaser.GameObjects.Sprite(this.scene, this.instructionRowX, this.instructionRowY, "keyboard", "F.png");
    this.formIconElement.setName("sprite-form-icon-element");
    this.formIconElement.setScale(0.675);
    this.formIconElement.setOrigin(0.0, 0.0);
    this.formLabel = addTextObject(this.scene, this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY, i18next.t("starterSelectUiHandler:cycleForm"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.formLabel.setName("text-form-label");

    this.genderIconElement = new Phaser.GameObjects.Sprite(this.scene, this.instructionRowX, this.instructionRowY, "keyboard", "G.png");
    this.genderIconElement.setName("sprite-gender-icon-element");
    this.genderIconElement.setScale(0.675);
    this.genderIconElement.setOrigin(0.0, 0.0);
    this.genderLabel = addTextObject(this.scene, this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY, i18next.t("starterSelectUiHandler:cycleGender"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.genderLabel.setName("text-gender-label");

    this.abilityIconElement = new Phaser.GameObjects.Sprite(this.scene, this.instructionRowX, this.instructionRowY, "keyboard", "E.png");
    this.abilityIconElement.setName("sprite-ability-icon-element");
    this.abilityIconElement.setScale(0.675);
    this.abilityIconElement.setOrigin(0.0, 0.0);
    this.abilityLabel = addTextObject(this.scene, this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY, i18next.t("starterSelectUiHandler:cycleAbility"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.abilityLabel.setName("text-ability-label");

    this.natureIconElement = new Phaser.GameObjects.Sprite(this.scene, this.instructionRowX, this.instructionRowY, "keyboard", "N.png");
    this.natureIconElement.setName("sprite-nature-icon-element");
    this.natureIconElement.setScale(0.675);
    this.natureIconElement.setOrigin(0.0, 0.0);
    this.natureLabel = addTextObject(this.scene, this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY, i18next.t("starterSelectUiHandler:cycleNature"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.natureLabel.setName("text-nature-label");

    this.variantIconElement = new Phaser.GameObjects.Sprite(this.scene, this.instructionRowX, this.instructionRowY, "keyboard", "V.png");
    this.variantIconElement.setName("sprite-variant-icon-element");
    this.variantIconElement.setScale(0.675);
    this.variantIconElement.setOrigin(0.0, 0.0);
    this.variantLabel = addTextObject(this.scene, this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY, i18next.t("starterSelectUiHandler:cycleVariant"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.variantLabel.setName("text-variant-label");

    this.hideInstructions();

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

        const generateSpecies = () => {
          randomSpeciesId = Utils.randSeedItem(starterSpecies);
          species = getPokemonSpecies(randomSpeciesId);
        };

        let dupe = false;

        do {
          dupe = false;

          generateSpecies();

          for (let ps = 0; ps < c; ps++) {
            if (this.pokerusSpecies[ps] === species) {
              dupe = true;
              break;
            }
          }
        } while (dupe);

        this.pokerusSpecies.push(species);
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
    this.starterSelectContainer.bringToTop(this.filterBarContainer);

    this.scene.eventTarget.addEventListener(BattleSceneEventType.CANDY_UPGRADE_NOTIFICATION_CHANGED, (e) => this.onCandyUpgradeDisplayChanged(e));

    this.updateInstructions();
  }

  show(args: any[]): boolean {
    if (!this.starterPreferences) {
      // starterPreferences haven't been loaded yet
      this.starterPreferences = StarterPrefs.load();
    }
    this.moveInfoOverlay.clear(); // clear this when removing a menu; the cancel button doesn't seem to trigger this automatically on controllers
    if (args.length >= 1 && args[0] instanceof Function) {
      super.show(args);
      this.starterSelectCallback = args[0] as StarterSelectCallback;

      this.starterSelectContainer.setVisible(true);

      this.allSpecies.forEach((species, s) => {
        const icon = this.starterContainer[s].icon;
        const dexEntry = this.scene.gameData.dexData[species.speciesId];

        if (dexEntry.caughtAttr) {
          icon.clearTint();
        } else if (dexEntry.seenAttr) {
          icon.setTint(0x808080);
        }

        this.setUpgradeAnimation(icon, species);
      });

      this.updateStarters();

      this.setFilterMode(false);
      this.filterBarCursor = 0;
      this.setCursor(0);
      this.tryUpdateValue(0);

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
   * Determines if an same species egg can be baught for the given species ID
   * @param speciesId The ID of the species to check the value reduction of
   * @returns true if the user has enough candies
   */
  isSameSpeciesEggAvailable(speciesId: number): boolean {
    // Get this species ID's starter data
    const starterData = this.scene.gameData.starterData[speciesId];

    return starterData.candyCount >= getSameSpeciesEggCandyCounts(speciesStarters[speciesId]);
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

    icon.y = 2;

    const tweenChain: Phaser.Types.Tweens.TweenChainBuilderConfig = {
      targets: icon,
      loop: -1,
      // Make the initial bounce a little randomly delayed
      delay: Utils.randIntRange(0, 50) * 5,
      loopDelay: 1000,
      tweens: [
        {
          targets: icon,
          y: 2 - 5,
          duration: Utils.fixedInt(125),
          ease: "Cubic.easeOut",
          yoyo: true
        },
        {
          targets: icon,
          y: 2 - 3,
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
   * Sets the visibility of a Candy Upgrade Icon
   */
  setUpgradeIcon(starter: StarterContainer): void {
    const species = starter.species;
    const slotVisible = !!species?.speciesId;

    if (!species || this.scene.candyUpgradeNotification === 0 || species.speciesId !== species.getRootSpeciesId(false)) {
      starter.candyUpgradeIcon.setVisible(false);
      starter.candyUpgradeOverlayIcon.setVisible(false);
      return;
    }

    const passiveAvailable = this.isPassiveAvailable(species.speciesId);
    // 'Only Passive Unlocks' mode
    if (this.scene.candyUpgradeNotification === 1) {
      starter.candyUpgradeIcon.setVisible(slotVisible && passiveAvailable);
      starter.candyUpgradeOverlayIcon.setVisible(slotVisible && starter.candyUpgradeIcon.visible);

      // 'On' mode
    } else if (this.scene.candyUpgradeNotification === 2) {
      starter.candyUpgradeIcon.setVisible(
        slotVisible && ( passiveAvailable || this.isValueReductionAvailable(species.speciesId)));
      starter.candyUpgradeOverlayIcon.setVisible(slotVisible && starter.candyUpgradeIcon.visible);
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
      this.filteredStarterContainers.forEach((starter) => {
        this.setUpgradeIcon(starter);
      });

      return;
    }

    // Loop through all animations when set to 'Animation' mode
    this.filteredStarterContainers.forEach((starter, s) => {
      const icon = this.filteredStarterContainers[s].icon;

      this.setUpgradeAnimation(icon, starter.species);
    });
  }

  processInput(button: Button): boolean {
    if (this.blockInput) {
      return false;
    }

    const numberOfStarters = this.filteredStarterContainers.length;
    const numOfRows = Math.ceil(numberOfStarters / 9);
    const currentRow = Math.floor(this.cursor / 9);
    const onScreenFirstIndex = this.scrollCursor * 9; // this is first starter index on the screen
    const onScreenLastIndex = Math.min(onScreenFirstIndex + 9*9, numberOfStarters) - 1; // this is the last starter index on the screen
    const onScreenNumberOfStarters = onScreenLastIndex - onScreenFirstIndex + 1;
    const onScreenNumberOfRows = Math.ceil(onScreenNumberOfStarters / 9);
    // const onScreenFirstRow = Math.floor(onScreenFirstIndex / 9);
    const onScreenCurrentRow = Math.floor((this.cursor - onScreenFirstIndex) / 9);


    // console.log("this.cursor: ", this.cursor, "this.scrollCursor" , this.scrollCursor, "numberOfStarters: ", numberOfStarters, "numOfRows: ", numOfRows, "currentRow: ", currentRow, "onScreenFirstIndex: ", onScreenFirstIndex, "onScreenLastIndex: ", onScreenLastIndex, "onScreenNumberOfStarters: ", onScreenNumberOfStarters, "onScreenNumberOfRow: ", onScreenNumberOfRows, "onScreenCurrentRow: ", onScreenCurrentRow);

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
      if (this.filterMode && this.filterBar.openDropDown) {
        this.filterBar.toggleDropDown(this.filterBarCursor);
        success = true;
      } else if (this.statsMode) {
        this.toggleStatsMode(false);
        success = true;
      } else if (this.starterSpecies.length) {
        this.popStarter(this.starterSpecies.length - 1);
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
    } else if (this.startCursorObj.visible) { // this checks to see if the start button is selected
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
        if (this.starterSpecies.length > 0) {
          this.starterIconsCursorIndex = this.starterSpecies.length - 1;
          this.moveStarterIconsCursor(this.starterIconsCursorIndex);
        } else {
          this.setFilterMode(true);
        }
        success = true;
        break;
      case Button.DOWN:
        this.startCursorObj.setVisible(false);
        if (this.starterSpecies.length > 0) {
          this.starterIconsCursorIndex = 0;
          this.moveStarterIconsCursor(this.starterIconsCursorIndex);
        } else {
          this.setFilterMode(true);
        }
        success = true;
        break;
      case Button.LEFT:
        this.startCursorObj.setVisible(false);
        this.cursorObj.setVisible(true);
        success = this.setCursor(onScreenFirstIndex + (onScreenNumberOfRows-1) * 9 + 8); // set last column
        success = true;
        break;
      case Button.RIGHT:
        this.startCursorObj.setVisible(false);
        this.cursorObj.setVisible(true);
        success = this.setCursor(onScreenFirstIndex + (onScreenNumberOfRows-1) * 9); // set first column
        success = true;
        break;
      }
    } else if (this.filterMode) {
      switch (button) {
      case Button.LEFT:
        if (this.filterBarCursor > 0) {
          success = this.setCursor(this.filterBarCursor - 1);
        } else {
          success = this.setCursor(this.filterBar.numFilters - 1);
        }
        break;
      case Button.RIGHT:
        if (this.filterBarCursor < this.filterBar.numFilters - 1) {
          success = this.setCursor(this.filterBarCursor + 1);
        } else {
          success = this.setCursor(0);
        }
        break;
      case Button.UP:
        if (this.filterBar.openDropDown) {
          success = this.filterBar.decDropDownCursor();
        // else if there is filtered starters
        } else if (numberOfStarters > 0) {
          this.setFilterMode(false);
          this.scrollCursor = Math.max(0,numOfRows - 9);
          this.updateScroll();
          const proportion = (this.filterBarCursor + 0.5) / this.filterBar.numFilters;
          const targetCol = Math.floor(proportion * 9);
          if (numberOfStarters % 9 > targetCol) {
            success = this.setCursor(numberOfStarters - (numberOfStarters) % 9 + targetCol);
          } else {
            success = this.setCursor(Math.max(numberOfStarters - (numberOfStarters) % 9 + targetCol - 9,0));
          }
        }
        break;
      case Button.DOWN:
        if (this.filterBar.openDropDown) {
          success = this.filterBar.incDropDownCursor();
        } else if (numberOfStarters > 0) {
          this.setFilterMode(false);
          this.scrollCursor = 0;
          this.updateScroll();
          const proportion = this.filterBarCursor / Math.max(1, this.filterBar.numFilters - 1);
          this.setCursor(Math.round(proportion * (Math.min(9, numberOfStarters) - 1)));
          success = true;
        }
        break;
      case Button.ACTION:
        if (!this.filterBar.openDropDown) {
          this.filterBar.toggleDropDown(this.filterBarCursor);
        } else {
          this.filterBar.toggleOptionState();
        }
        success = true;
        break;
      }
    } else {
      if (button === Button.ACTION) {
        if (!this.speciesStarterDexEntry?.caughtAttr) {
          error = true;
        } else if (this.starterSpecies.length < 6) { // checks to see you have less than 6 pokemon in your party

          let species;

          // this gets the correct generation and pokemon cursor depending on whether you're in the starter screen or the party icons
          if (!this.starterIconsCursorObj.visible) {
            species = this.filteredStarterContainers[this.cursor].species;
          } else {
            species = this.starterSpecies[this.starterIconsCursorIndex];
          }
          const ui = this.getUi();
          let options = [];

          const [isDupe, removeIndex]: [boolean, number] = this.isInParty(species); // checks to see if the pokemon is a duplicate; if it is, returns the index that will be removed


          const isPartyValid = this.isPartyValid();
          const isValidForChallenge = new Utils.BooleanHolder(true);
          if (isPartyValid) {
            Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, species, isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(species, this.scene.gameData.getSpeciesDefaultDexAttr(species, false, true)), !!(this.starterSpecies.length));
          } else {
            Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, species, isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(species, this.scene.gameData.getSpeciesDefaultDexAttr(species, false, true)), !!(this.starterSpecies.length), false, false);
          }

          const currentPartyValue = this.starterSpecies.map(s => s.generation).reduce((total: number, gen: number, i: number) => total += this.scene.gameData.getSpeciesStarterValue(this.starterSpecies[i].speciesId), 0);
          const newCost = this.scene.gameData.getSpeciesStarterValue(species.speciesId);
          if (!isDupe && isValidForChallenge.value && currentPartyValue + newCost <= this.getValueLimit()) { // this checks to make sure the pokemon doesn't exist in your party, it's valid for the challenge and that it won't go over the cost limit; if it meets all these criteria it will add it to your party
            options = [
              {
                label: i18next.t("starterSelectUiHandler:addToParty"),
                handler: () => {
                  ui.setMode(Mode.STARTER_SELECT);

                  if (!isDupe && isValidForChallenge.value && this.tryUpdateValue(this.scene.gameData.getSpeciesStarterValue(species.speciesId), true)) {
                    this.addToParty(species);
                    ui.playSelect();
                  } else {
                    ui.playError(); // this should be redundant as there is now a trigger for when a pokemon can't be added to party
                  }
                  return true;
                },
                overrideSound: true
              }];
          } else if (isDupe) { // if it already exists in your party, it will give you the option to remove from your party
            options = [{
              label: i18next.t("starterSelectUiHandler:removeFromParty"),
              handler: () => {
                this.popStarter(removeIndex);
                ui.setMode(Mode.STARTER_SELECT);
                return true;
              }
            }];
          }

          options.push( // this shows the IVs for the pokemon
            {
              label: i18next.t("starterSelectUiHandler:toggleIVs"),
              handler: () => {
                this.toggleStatsMode();
                ui.setMode(Mode.STARTER_SELECT);
                return true;
              }
            });
          if (this.speciesStarterMoves.length > 1) { // this lets you change the pokemon moves
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
          const starterContainer = this.filteredStarterContainers[this.cursor];
          const starterData = this.scene.gameData.starterData[this.lastSpecies.speciesId];
          let starterAttributes = this.starterPreferences[this.lastSpecies.speciesId];
          if (this.canCycleNature) {
            // if we could cycle natures, enable the improved nature menu
            const showNatureOptions = () => {
              ui.setMode(Mode.STARTER_SELECT).then(() => {
                ui.showText(i18next.t("starterSelectUiHandler:selectNature"), null, () => {
                  const natures = this.scene.gameData.getNaturesForAttr(this.speciesStarterDexEntry.natureAttr);
                  ui.setModeWithoutClear(Mode.OPTION_SELECT, {
                    options: natures.map((n: Nature, i: number) => {
                      const option: OptionSelectItem = {
                        label: getNatureName(n, true, true, true, this.scene.uiTheme),
                        handler: () => {
                          // update default nature in starter save data
                          if (!starterAttributes) {
                            starterAttributes = this.starterPreferences[this.lastSpecies.speciesId] = {};
                          }
                          starterAttributes.nature = n as unknown as integer;
                          this.clearText();
                          ui.setMode(Mode.STARTER_SELECT);
                          // set nature for starter
                          this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, undefined, n, undefined);
                          return true;
                        }
                      };
                      return option;
                    }).concat({
                      label: i18next.t("menu:cancel"),
                      handler: () => {
                        this.clearText();
                        ui.setMode(Mode.STARTER_SELECT);
                        return true;
                      }
                    }),
                    maxOptions: 8,
                    yOffset: 19
                  });
                });
              });
            };
            options.push({
              label: i18next.t("starterSelectUiHandler:manageNature"),
              handler: () => {
                showNatureOptions();
                return true;
              }
            });
          }
          const candyCount = starterData.candyCount;
          const passiveAttr = starterData.passiveAttr;
          if (passiveAttr & PassiveAttr.UNLOCKED) { // this is for enabling and disabling the passive
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
          const showUseCandies = () => { // this lets you use your candies
            const options = [];
            if (!(passiveAttr & PassiveAttr.UNLOCKED)) {
              const passiveCost = getPassiveCandyCount(speciesStarters[this.lastSpecies.speciesId]);
              options.push({
                label: `x${passiveCost} ${i18next.t("starterSelectUiHandler:unlockPassive")} (${allAbilities[starterPassiveAbilities[this.lastSpecies.speciesId]].name})`,
                handler: () => {
                  if (Overrides.FREE_CANDY_UPGRADE_OVERRIDE || candyCount >= passiveCost) {
                    starterData.passiveAttr |= PassiveAttr.UNLOCKED | PassiveAttr.ENABLED;
                    if (!Overrides.FREE_CANDY_UPGRADE_OVERRIDE) {
                      starterData.candyCount -= passiveCost;
                    }
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
                      this.setUpgradeIcon(starterContainer);
                    }
                    if (this.isUpgradeAnimationEnabled()) {
                      this.setUpgradeAnimation(starterContainer.icon, this.lastSpecies, true);
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
                  if (Overrides.FREE_CANDY_UPGRADE_OVERRIDE || candyCount >= reductionCost) {
                    starterData.valueReduction++;
                    if (!Overrides.FREE_CANDY_UPGRADE_OVERRIDE) {
                      starterData.candyCount -= reductionCost;
                    }
                    this.pokemonCandyCountText.setText(`x${starterData.candyCount}`);
                    this.scene.gameData.saveSystem().then(success => {
                      if (!success) {
                        return this.scene.reset(true);
                      }
                    });
                    this.updateStarterValueLabel(starterContainer);
                    this.tryUpdateValue(0);
                    ui.setMode(Mode.STARTER_SELECT);
                    this.scene.playSound("buy");

                    // If the notification setting is set to 'On', update the candy upgrade display
                    if (this.scene.candyUpgradeNotification === 2) {
                      if (this.isUpgradeIconEnabled() ) {
                        this.setUpgradeIcon(starterContainer);
                      }
                      if (this.isUpgradeAnimationEnabled()) {
                        this.setUpgradeAnimation(starterContainer.icon, this.lastSpecies, true);
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

            // Same species egg menu option. Only visible if passive is bought
            if (passiveAttr & PassiveAttr.UNLOCKED) {
              const sameSpeciesEggCost = getSameSpeciesEggCandyCounts(speciesStarters[this.lastSpecies.speciesId]);
              options.push({
                label: `x${sameSpeciesEggCost} ${i18next.t("starterSelectUiHandler:sameSpeciesEgg")}`,
                handler: () => {
                  if (this.scene.gameData.eggs.length < 99 && (Overrides.FREE_CANDY_UPGRADE_OVERRIDE || candyCount >= sameSpeciesEggCost)) {
                    if (!Overrides.FREE_CANDY_UPGRADE_OVERRIDE) {
                      starterData.candyCount -= sameSpeciesEggCost;
                    }
                    this.pokemonCandyCountText.setText(`x${starterData.candyCount}`);

                    const egg = new Egg({scene: this.scene, species: this.lastSpecies.speciesId, sourceType: EggSourceType.SAME_SPECIES_EGG});
                    egg.addEggToGameData(this.scene);

                    this.scene.gameData.saveSystem().then(success => {
                      if (!success) {
                        return this.scene.reset(true);
                      }
                    });
                    ui.setMode(Mode.STARTER_SELECT);
                    this.scene.playSound("buy");

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
        const props = this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, this.dexAttrCursor);
        // prepare persistent starter data to store changes
        let starterAttributes = this.starterPreferences[this.lastSpecies.speciesId];
        if (!starterAttributes) {
          starterAttributes = this.starterPreferences[this.lastSpecies.speciesId] = {};
        }
        switch (button) {
        case Button.CYCLE_SHINY:
          if (this.canCycleShiny) {
            const newVariant = props.variant;
            this.setSpeciesDetails(this.lastSpecies, !props.shiny, undefined, undefined, props.shiny ? 0 : undefined, undefined, undefined);
            if (this.dexAttrCursor & DexAttr.SHINY) {
              this.scene.playSound("sparkle");
              // Set the variant label to the shiny tint
              const tint = getVariantTint(newVariant);
              this.pokemonShinyIcon.setFrame(getVariantIcon(newVariant));
              this.pokemonShinyIcon.setTint(tint);
              this.pokemonShinyIcon.setVisible(true);
            } else {
              this.pokemonShinyIcon.setVisible(false);
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
            starterAttributes.form = newFormIndex; // store the selected form
            this.setSpeciesDetails(this.lastSpecies, undefined, newFormIndex, undefined, undefined, undefined, undefined);
            success = true;
          }
          break;
        case Button.CYCLE_GENDER:
          if (this.canCycleGender) {
            starterAttributes.female = !props.female;
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
                if (this.lastSpecies.ability1 === this.lastSpecies.ability2) {
                  newAbilityIndex = (newAbilityIndex + 1) % abilityCount;
                }
                break;
              } else {
                if (abilityAttr & AbilityAttr.ABILITY_HIDDEN) {
                  break;
                }
              }
            } while (newAbilityIndex !== this.abilityCursor);
            starterAttributes.ability = newAbilityIndex; // store the selected ability
            this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, newAbilityIndex, undefined);
            success = true;
          }
          break;
        case Button.CYCLE_NATURE:
          if (this.canCycleNature) {
            const natures = this.scene.gameData.getNaturesForAttr(this.speciesStarterDexEntry.natureAttr);
            const natureIndex = natures.indexOf(this.natureCursor);
            const newNature = natures[natureIndex < natures.length - 1 ? natureIndex + 1 : 0];
            // store cycled nature as default
            starterAttributes.nature = newNature as unknown as integer;
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
            starterAttributes.variant = newVariant; // store the selected variant
            this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, newVariant, undefined, undefined);
            // Cycle tint based on current sprite tint
            const tint = getVariantTint(newVariant);
            this.pokemonShinyIcon.setFrame(getVariantIcon(newVariant));
            this.pokemonShinyIcon.setTint(tint);
            success = true;
          }
          break;
        case Button.UP:
          if (!this.starterIconsCursorObj.visible) {
            if (currentRow > 0) {
              if (this.scrollCursor > 0 && currentRow - this.scrollCursor === 0) {
                this.scrollCursor--;
                this.updateScroll();
              }
              success = this.setCursor(this.cursor - 9);
            } else {
              this.filterBarCursor = this.filterBar.getNearestFilter(this.filteredStarterContainers[this.cursor]);
              this.setFilterMode(true);
              success = true;
            }
          } else {
            if (this.starterIconsCursorIndex === 0) {
              this.starterIconsCursorObj.setVisible(false);
              this.setSpecies(null);
              this.startCursorObj.setVisible(true);
            } else {
              this.starterIconsCursorIndex--;
              this.moveStarterIconsCursor(this.starterIconsCursorIndex);
            }
            success = true;
          }
          break;
        case Button.DOWN:
          if (!this.starterIconsCursorObj.visible) {
            if (currentRow < numOfRows - 1) { // not last row
              if (currentRow - this.scrollCursor === 8) { // last row of visible starters
                this.scrollCursor++;
              }
              success = this.setCursor(this.cursor + 9);
              this.updateScroll();
            } else { // last row
              this.setFilterMode(true);
              success = true;
            }
          } else {
            if (this.starterIconsCursorIndex <= this.starterSpecies.length - 2) {
              this.starterIconsCursorIndex++;
              this.moveStarterIconsCursor(this.starterIconsCursorIndex);
            } else {
              this.starterIconsCursorObj.setVisible(false);
              this.setSpecies(null);
              this.startCursorObj.setVisible(true);
            }
            success = true;
          }
          break;
        case Button.LEFT:
          if (!this.starterIconsCursorObj.visible) {
            if (this.cursor % 9 !== 0) {
              success = this.setCursor(this.cursor - 1);
            } else {
              if (this.starterSpecies.length === 0) {
                // just wrap around to the last column
                success = this.setCursor(this.cursor + Math.min(8, numberOfStarters - this.cursor));
              } else if (onScreenCurrentRow < 3) {
                // always to the first starter
                this.cursorObj.setVisible(false);
                this.starterIconsCursorIndex = 0;
                this.moveStarterIconsCursor(this.starterIconsCursorIndex);
              } else if (onScreenCurrentRow < 7) {
                this.cursorObj.setVisible(false);
                this.starterIconsCursorIndex = Math.min(onScreenCurrentRow-2, this.starterSpecies.length - 1);
                this.moveStarterIconsCursor(this.starterIconsCursorIndex);
              } else {
                this.cursorObj.setVisible(false);
                this.setSpecies(null);
                this.startCursorObj.setVisible(true);
              }
              success = true;
            }
          } else {
            this.starterIconsCursorObj.setVisible(false);
            this.cursorObj.setVisible(true);
            success = this.setCursor(Math.min(onScreenFirstIndex + (this.starterIconsCursorIndex + 2) * 9 + 8,onScreenLastIndex)); // set last column
          }
          break;
        case Button.RIGHT:
          if (!this.starterIconsCursorObj.visible) {
            // is not right edge
            if (this.cursor % 9 < (currentRow < numOfRows - 1 ? 8 : (numberOfStarters - 1) % 9)) {
              success = this.setCursor(this.cursor + 1);
            } else {
              // in right edge
              if (this.starterSpecies.length === 0) {
                // just wrap around to the first column
                success = this.setCursor(this.cursor - Math.min(8, this.cursor % 9));
              } else if (onScreenCurrentRow < 3) {
                // always to the first starter
                this.cursorObj.setVisible(false);
                this.starterIconsCursorIndex = 0;
                this.moveStarterIconsCursor(this.starterIconsCursorIndex);
              } else if (onScreenCurrentRow < 7) {
                this.cursorObj.setVisible(false);
                this.starterIconsCursorIndex = Math.min(onScreenCurrentRow-2, this.starterSpecies.length - 1);
                this.moveStarterIconsCursor(this.starterIconsCursorIndex);
              } else {
                this.cursorObj.setVisible(false);
                this.setSpecies(null);
                this.startCursorObj.setVisible(true);
              }
              success = true;
            }
            break;
          } else {
            this.starterIconsCursorObj.setVisible(false);
            this.cursorObj.setVisible(true);
            success = this.setCursor(Math.min(onScreenFirstIndex + (this.starterIconsCursorIndex + 2) * 9, onScreenLastIndex - (onScreenLastIndex % 9))); // set first column
            break;
          }
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

  isInParty(species: PokemonSpecies): [boolean, number] {
    let removeIndex = 0;
    let isDupe = false;
    for (let s = 0; s < this.starterSpecies.length; s++) {
      if (this.starterSpecies[s] === species) {
        isDupe = true;
        removeIndex = s;
        break;
      }
    }
    return [isDupe, removeIndex];
  }

  addToParty(species: PokemonSpecies) {
    const cursorObj = this.starterCursorObjs[this.starterSpecies.length];
    cursorObj.setVisible(true);
    cursorObj.setPosition(this.cursorObj.x, this.cursorObj.y);
    const props = this.scene.gameData.getSpeciesDexAttrProps(species, this.dexAttrCursor);
    this.starterIcons[this.starterSpecies.length].setTexture(species.getIconAtlasKey(props.formIndex, props.shiny, props.variant));
    this.starterIcons[this.starterSpecies.length].setFrame(species.getIconId(props.female, props.formIndex, props.shiny, props.variant));
    this.checkIconId(this.starterIcons[this.starterSpecies.length], species, props.female, props.formIndex, props.shiny, props.variant);
    this.starterSpecies.push(species);
    this.starterAttr.push(this.dexAttrCursor);
    this.starterAbilityIndexes.push(this.abilityCursor);
    this.starterNatures.push(this.natureCursor as unknown as Nature);
    this.starterMovesets.push(this.starterMoveset.slice(0) as StarterMoveset);
    if (this.speciesLoaded.get(species.speciesId)) {
      getPokemonSpeciesForm(species.speciesId, props.formIndex).cry(this.scene);
    }
    this.updateInstructions();
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

    // switch moves of starter if exists
    if (this.starterMovesets.length) {
      Array.from({ length: this.starterSpecies.length }, (_, i) => {
        const starterSpecies = this.starterSpecies[i];
        if (starterSpecies.speciesId === speciesId) {
          this.starterMovesets[i] = this.starterMoveset;
        }
      });
    }
  }

  updateButtonIcon(iconSetting, gamepadType, iconElement, controlLabel): void {
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
    iconElement.setTexture(gamepadType, iconPath);
    iconElement.setPosition(this.instructionRowX, this.instructionRowY);
    controlLabel.setPosition(this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY);
    iconElement.setVisible(true);
    controlLabel.setVisible(true);
    this.instructionsContainer.add([iconElement, controlLabel]);
    this.instructionRowY += 8;
    if (this.instructionRowY >= 24) {
      this.instructionRowY = 0;
      this.instructionRowX += 50;
    }
  }

  updateInstructions(): void {
    this.instructionRowX = 0;
    this.instructionRowY = 0;
    this.hideInstructions();
    this.instructionsContainer.removeAll();
    let gamepadType;
    if (this.scene.inputMethod === "gamepad") {
      gamepadType = this.scene.inputController.getConfig(this.scene.inputController.selectedDevice[Device.GAMEPAD]).padType;
    } else {
      gamepadType = this.scene.inputMethod;
    }

    if (this.speciesStarterDexEntry?.caughtAttr) {
      if (this.canCycleShiny) {
        this.updateButtonIcon(SettingKeyboard.Button_Cycle_Shiny, gamepadType, this.shinyIconElement, this.shinyLabel);
      }
      if (this.canCycleForm) {
        this.updateButtonIcon(SettingKeyboard.Button_Cycle_Form, gamepadType, this.formIconElement, this.formLabel);
      }
      if (this.canCycleGender) {
        this.updateButtonIcon(SettingKeyboard.Button_Cycle_Gender, gamepadType, this.genderIconElement, this.genderLabel);
      }
      if (this.canCycleAbility) {
        this.updateButtonIcon(SettingKeyboard.Button_Cycle_Ability, gamepadType, this.abilityIconElement, this.abilityLabel);
      }
      if (this.canCycleNature) {
        this.updateButtonIcon(SettingKeyboard.Button_Cycle_Nature, gamepadType, this.natureIconElement, this.natureLabel);
      }
      if (this.canCycleVariant) {
        this.updateButtonIcon(SettingKeyboard.Button_Cycle_Variant, gamepadType, this.variantIconElement, this.variantLabel);
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

  updateStarters = () => {
    this.scrollCursor = 0;
    this.filteredStarterContainers = [];

    this.pokerusCursorObjs.forEach(cursor => cursor.setVisible(false));
    this.starterCursorObjs.forEach(cursor => cursor.setVisible(false));

    this.filterBar.updateFilterLabels();

    // filter
    this.starterContainer.forEach(container => {
      container.setVisible(false);

      // First, ensure you have the caught attributes for the species else default to bigint 0
      const caughtVariants = this.scene.gameData.dexData[container.species.speciesId]?.caughtAttr || BigInt(0);

      // Define the variables based on whether their respective variants have been caught
      const isVariant3Caught = !!(caughtVariants & DexAttr.VARIANT_3);
      const isVariant2Caught = !!(caughtVariants & DexAttr.VARIANT_2);
      const isVariantCaught = !!(caughtVariants & DexAttr.SHINY);
      const isCaught = !!(caughtVariants & DexAttr.NON_SHINY);
      const isUncaught = !isCaught && !isVariantCaught && !isVariant2Caught && !isVariant3Caught;
      const isPassiveUnlocked = this.scene.gameData.starterData[container.species.speciesId].passiveAttr > 0;


      const fitsGen =   this.filterBar.getVals(DropDownColumn.GEN).includes(container.species.generation);
      const fitsType =  this.filterBar.getVals(DropDownColumn.TYPES).some(type => container.species.isOfType((type as number) - 1));
      const fitsShiny = this.filterBar.getVals(DropDownColumn.UNLOCKS).some(variant => {
        if (variant === "SHINY3") {
          return isVariant3Caught;
        } else if (variant === "SHINY2") {
          return isVariant2Caught && !isVariant3Caught;
        } else if (variant === "SHINY") {
          return isVariantCaught && !isVariant2Caught && !isVariant3Caught;
        } else if (variant === "NORMAL") {
          return isCaught && !isVariantCaught && !isVariant2Caught && !isVariant3Caught;
        } else if (variant === "UNCAUGHT") {
          return isUncaught;
        }
      });
      const fitsPassive = this.filterBar.getVals(DropDownColumn.UNLOCKS).some(variant => {
        if (variant === "PASSIVEUNLOCKED") {
          return isPassiveUnlocked;
        } else if (variant === "PASSIVELOCKED") {
          return !isPassiveUnlocked;
        }
      });
      const isWin = this.scene.gameData.starterData[container.species.speciesId].classicWinCount > 0;
      const isNotWin = this.scene.gameData.starterData[container.species.speciesId].classicWinCount === 0;
      const isUndefined = this.scene.gameData.starterData[container.species.speciesId].classicWinCount === undefined;

      const fitsWin = this.filterBar.getVals(DropDownColumn.WIN).some(win => {
        if (win === "WIN") {
          return isWin;
        } else if (win === "NOTWIN") {
          return isNotWin || isUndefined;
        }
      });

      if (fitsGen && fitsType && fitsShiny && fitsPassive && fitsWin) {
        this.filteredStarterContainers.push(container);
      }
    });

    this.starterSelectScrollBar.setPages(Math.ceil((this.filteredStarterContainers.length - 81) / 9) + 1);
    this.starterSelectScrollBar.setPage(0);

    // sort
    const sort = this.filterBar.getVals(DropDownColumn.SORT)[0];
    this.filteredStarterContainers.sort((a, b) => {
      switch (sort.val) {
      default:
        break;
      case 0:
        return (a.species.speciesId - b.species.speciesId) * -sort.dir;
      case 1:
        return (a.cost - b.cost) * -sort.dir;
      case 2:
        const candyCountA = this.scene.gameData.starterData[a.species.speciesId].candyCount;
        const candyCountB = this.scene.gameData.starterData[b.species.speciesId].candyCount;
        return (candyCountA - candyCountB) * -sort.dir;
      case 3:
        const avgIVsA = this.scene.gameData.dexData[a.species.speciesId].ivs.reduce((a, b) => a + b, 0) / this.scene.gameData.dexData[a.species.speciesId].ivs.length;
        const avgIVsB = this.scene.gameData.dexData[b.species.speciesId].ivs.reduce((a, b) => a + b, 0) / this.scene.gameData.dexData[b.species.speciesId].ivs.length;
        return (avgIVsA - avgIVsB) * -sort.dir;
      case 4:
        return a.species.name.localeCompare(b.species.name) * -sort.dir;
      }
      return 0;
    });

    this.updateScroll();
  };

  updateScroll = () => {
    const perRow = 9;
    const maxRows = 9;

    this.starterSelectScrollBar.setPage(this.scrollCursor);

    let pokerusCursorIndex = 0;
    this.filteredStarterContainers.forEach((container, i) => {
      const pos = calcStarterPosition(i, this.scrollCursor);
      container.setPosition(pos.x, pos.y);

      if (i < (maxRows + this.scrollCursor) * perRow && i >= this.scrollCursor * perRow) {
        container.setVisible(true);
      } else {
        container.setVisible(false);
      }

      if (this.pokerusSpecies.includes(container.species)) {
        this.pokerusCursorObjs[pokerusCursorIndex].setPosition(pos.x - 1, pos.y + 1);

        if (i < (maxRows + this.scrollCursor) * perRow && i >= this.scrollCursor * perRow) {
          this.pokerusCursorObjs[pokerusCursorIndex].setVisible(true);
        } else {
          this.pokerusCursorObjs[pokerusCursorIndex].setVisible(false);
        }
        pokerusCursorIndex++;
      }

      if (this.starterSpecies.includes(container.species)) {
        this.starterCursorObjs[this.starterSpecies.indexOf(container.species)].setPosition(pos.x - 1, pos.y + 1);

        if (i < (maxRows + this.scrollCursor) * perRow && i >= this.scrollCursor * perRow) {
          this.starterCursorObjs[this.starterSpecies.indexOf(container.species)].setVisible(true);
        } else {
          this.starterCursorObjs[this.starterSpecies.indexOf(container.species)].setVisible(false);
        }
      }

      const speciesId = container.species.speciesId;
      this.updateStarterValueLabel(container);

      container.label.setVisible(true);
      const speciesVariants = speciesId && this.scene.gameData.dexData[speciesId].caughtAttr & DexAttr.SHINY
        ? [ DexAttr.DEFAULT_VARIANT, DexAttr.VARIANT_2, DexAttr.VARIANT_3 ].filter(v => !!(this.scene.gameData.dexData[speciesId].caughtAttr & v))
        : [];
      for (let v = 0; v < 3; v++) {
        const hasVariant = speciesVariants.length > v;
        container.shinyIcons[v].setVisible(hasVariant);
        if (hasVariant) {
          container.shinyIcons[v].setTint(getVariantTint(speciesVariants[v] === DexAttr.DEFAULT_VARIANT ? 0 : speciesVariants[v] === DexAttr.VARIANT_2 ? 1 : 2));
        }
      }

      container.starterPassiveBgs.setVisible(!!this.scene.gameData.starterData[speciesId].passiveAttr);
      container.hiddenAbilityIcon.setVisible(!!this.scene.gameData.dexData[speciesId].caughtAttr && !!(this.scene.gameData.starterData[speciesId].abilityAttr & 4));
      container.classicWinIcon.setVisible(this.scene.gameData.starterData[speciesId].classicWinCount > 0);

      // 'Candy Icon' mode
      if (this.scene.candyUpgradeDisplay === 0) {

        if (!starterColors[speciesId]) {
          // Default to white if no colors are found
          starterColors[speciesId] = [ "ffffff", "ffffff" ];
        }

        // Set the candy colors
        container.candyUpgradeIcon.setTint(argbFromRgba(Utils.rgbHexToRgba(starterColors[speciesId][0])));
        container.candyUpgradeOverlayIcon.setTint(argbFromRgba(Utils.rgbHexToRgba(starterColors[speciesId][1])));

        this.setUpgradeIcon(container);
      } else if (this.scene.candyUpgradeDisplay === 1) {
        container.candyUpgradeIcon.setVisible(false);
        container.candyUpgradeOverlayIcon.setVisible(false);
      }
    });
  };

  setCursor(cursor: integer): boolean {
    let changed = false;

    if (this.filterMode) {
      changed = this.filterBarCursor !== cursor;
      this.filterBarCursor = cursor;

      this.filterBar.setCursor(cursor);
    } else {
      cursor = Math.max(Math.min(this.filteredStarterContainers.length - 1, cursor),0);
      changed = super.setCursor(cursor);

      const pos = calcStarterPosition(cursor, this.scrollCursor);
      this.cursorObj.setPosition(pos.x - 1, pos.y + 1);

      const species = this.filteredStarterContainers[cursor]?.species;

      if (species) {
        const defaultDexAttr = this.scene.gameData.getSpeciesDefaultDexAttr(species, false, true);
        const defaultProps = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
        const variant = defaultProps.variant;
        const tint = getVariantTint(variant);
        this.pokemonShinyIcon.setFrame(getVariantIcon(variant));
        this.pokemonShinyIcon.setTint(tint);
        this.setSpecies(species);
        this.updateInstructions();
      } else {
        console.warn("Species is undefined for cursor position", cursor);
        this.setFilterMode(true);
      }
    }

    return changed;
  }

  getGenCursorWithScroll(): integer {
    return undefined;
    // return this.genCursor !== undefined
    //   ? this.genCursor + this.genScrollCursor
    //   : undefined;
  }

  updateGenOptions(): void {
    // let text = "";
    // for (let g = this.genScrollCursor; g <= this.genScrollCursor + 2; g++) {
    //   let optionText = "";
    //   if (g === this.genScrollCursor && this.genScrollCursor) {
    //     optionText = "↑";
    //   } else if (g === this.genScrollCursor + 2 && this.genScrollCursor < gens.length - 3) {
    //     optionText = "↓";
    //   } else {
    //     optionText = i18next.t(`starterSelectUiHandler:gen${g + 1}`);
    //   }
    //   text += `${text ? "\n" : ""}${optionText}`;
    // }
    // this.genOptionsText.setText(text);
  }

  setFilterMode(filterMode: boolean): boolean {
    // this.genCursorObj.setVisible(!filterMode);
    this.cursorObj.setVisible(!filterMode);
    this.filterBar.cursorObj.setVisible(filterMode);

    if (filterMode !== this.filterMode) {
      this.filterMode = filterMode;
      this.setCursor(filterMode ? this.filterBarCursor : this.cursor);
      if (filterMode) {
        this.setSpecies(null);
      }

      return true;
    }

    return false;
  }

  moveStarterIconsCursor(index: number): void {
    this.starterIconsCursorObj.x = this.starterIcons[index].x + this.starterIconsCursorXOffset;
    this.starterIconsCursorObj.y = this.starterIcons[index].y + this.starterIconsCursorYOffset;
    if (this.starterSpecies.length > 0) {
      this.starterIconsCursorObj.setVisible(true);
      this.setSpecies(this.starterSpecies[index]);
    } else {
      this.starterIconsCursorObj.setVisible(false);
      this.setSpecies(null);
    }
  }

  setSpecies(species: PokemonSpecies) {
    this.speciesStarterDexEntry = species ? this.scene.gameData.dexData[species.speciesId] : null;
    this.dexAttrCursor = species ? this.scene.gameData.getSpeciesDefaultDexAttr(species, false, true) : 0n;
    this.abilityCursor = species ? this.scene.gameData.getStarterSpeciesDefaultAbilityIndex(species) : 0;
    this.natureCursor = species ? this.scene.gameData.getSpeciesDefaultNature(species) : 0;

    const starterAttributes : StarterAttributes = species ? {...this.starterPreferences[species.speciesId]} : null;
    // validate starterAttributes
    if (starterAttributes) {
      // this may cause changes so we created a copy of the attributes before
      if (!isNaN(starterAttributes.variant)) {
        if (![
          this.speciesStarterDexEntry.caughtAttr & DexAttr.NON_SHINY,
          this.speciesStarterDexEntry.caughtAttr & DexAttr.DEFAULT_VARIANT,
          this.speciesStarterDexEntry.caughtAttr & DexAttr.VARIANT_2,
          this.speciesStarterDexEntry.caughtAttr & DexAttr.VARIANT_3
        ][starterAttributes.variant+1]) { // add 1 as -1 = non-shiny
          // requested variant wasn't unlocked, purging setting
          delete starterAttributes.variant;
        }
      }

      if (typeof starterAttributes.female !== "boolean" || !(starterAttributes.female ?
        this.speciesStarterDexEntry.caughtAttr & DexAttr.FEMALE :
        this.speciesStarterDexEntry.caughtAttr & DexAttr.MALE
      )) {
        // requested gender wasn't unlocked, purging setting
        delete starterAttributes.female;
      }

      const abilityAttr = this.scene.gameData.starterData[species.speciesId].abilityAttr;
      if (![
        abilityAttr & AbilityAttr.ABILITY_1,
        species.ability2 ? (abilityAttr & AbilityAttr.ABILITY_2) : abilityAttr & AbilityAttr.ABILITY_HIDDEN,
        species.ability2 && abilityAttr & AbilityAttr.ABILITY_HIDDEN
      ][starterAttributes.ability]) {
        // requested ability wasn't unlocked, purging setting
        delete starterAttributes.ability;
      }

      if (!(species.forms[starterAttributes.form]?.isStarterSelectable && this.speciesStarterDexEntry.caughtAttr & this.scene.gameData.getFormAttr(starterAttributes.form))) {
        // requested form wasn't unlocked/isn't a starter form, purging setting
        delete starterAttributes.form;
      }

      if (this.scene.gameData.getNaturesForAttr(this.speciesStarterDexEntry.natureAttr).indexOf(starterAttributes.nature as unknown as Nature) < 0) {
        // requested nature wasn't unlocked, purging setting
        delete starterAttributes.nature;
      }
    }

    if (starterAttributes?.nature) {
      // load default nature from stater save data, if set
      this.natureCursor = starterAttributes.nature;
    }
    if (!isNaN(starterAttributes?.ability)) {
      // load default nature from stater save data, if set
      this.abilityCursor = starterAttributes.ability;
    }

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
      const speciesIndex = this.allSpecies.indexOf(this.lastSpecies);
      const lastSpeciesIcon = this.starterContainer[speciesIndex].icon;
      this.checkIconId(lastSpeciesIcon, this.lastSpecies, props.female, props.formIndex, props.shiny, props.variant);
      this.iconAnimHandler.addOrUpdate(lastSpeciesIcon, PokemonIconAnimMode.NONE);

      // Resume the animation for the previously selected species
      const icon = this.starterContainer[speciesIndex].icon;
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
        this.pokemonShinyIcon.setVisible(this.pokemonLuckText.visible);

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
        if (species.speciesId === Species.MANAPHY || species.speciesId === Species.PHIONE) {
          this.pokemonHatchedIcon.setFrame("manaphy");
        } else {
          this.pokemonHatchedIcon.setFrame(getEggTierForSpecies(species));
        }
        this.pokemonHatchedCountText.setText(`${this.speciesStarterDexEntry.hatchedCount}`);
        const defaultDexAttr = this.scene.gameData.getSpeciesDefaultDexAttr(species, false, true);
        const defaultProps = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
        const variant = defaultProps.variant;
        const tint = getVariantTint(variant);
        this.pokemonShinyIcon.setFrame(getVariantIcon(variant));
        this.pokemonShinyIcon.setTint(tint);
        this.pokemonCaughtHatchedContainer.setVisible(true);
        if (pokemonPrevolutions.hasOwnProperty(species.speciesId)) {
          this.pokemonCaughtHatchedContainer.setY(16);
          this.pokemonShinyIcon.setY(135);
          this.pokemonShinyIcon.setFrame(getVariantIcon(variant));
          [
            this.pokemonCandyIcon,
            this.pokemonCandyOverlayIcon,
            this.pokemonCandyDarknessOverlay,
            this.pokemonCandyCountText,
            this.pokemonHatchedIcon,
            this.pokemonHatchedCountText
          ].map(c => c.setVisible(false));
          this.pokemonFormText.setY(25);
        } else {
          this.pokemonCaughtHatchedContainer.setY(25);
          this.pokemonShinyIcon.setY(117);
          this.pokemonCandyIcon.setTint(argbFromRgba(Utils.rgbHexToRgba(colorScheme[0])));
          this.pokemonCandyIcon.setVisible(true);
          this.pokemonCandyOverlayIcon.setTint(argbFromRgba(Utils.rgbHexToRgba(colorScheme[1])));
          this.pokemonCandyOverlayIcon.setVisible(true);
          this.pokemonCandyDarknessOverlay.setVisible(true);
          this.pokemonCandyCountText.setText(`x${this.scene.gameData.starterData[species.speciesId].candyCount}`);
          this.pokemonCandyCountText.setVisible(true);
          this.pokemonFormText.setVisible(true);
          this.pokemonFormText.setY(42);
          this.pokemonHatchedIcon.setVisible(true);
          this.pokemonHatchedCountText.setVisible(true);

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
        const speciesIndex = this.allSpecies.indexOf(species);
        const icon = this.starterContainer[speciesIndex].icon;

        if (this.isUpgradeAnimationEnabled()) {
          this.scene.tweens.getTweensOf(icon).forEach(tween => tween.pause());
          // Reset the position of the icon
          icon.x = -2;
          icon.y = 2;
        }

        // Initiates the small up and down idle animation
        this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.PASSIVE);

        let starterIndex = -1;
        starterIndex = this.starterSpecies.indexOf(species);

        let props: DexAttrProps;

        if (starterIndex > -1) {
          props = this.scene.gameData.getSpeciesDexAttrProps(species, this.starterAttr[starterIndex]);
          this.setSpeciesDetails(species, props.shiny, props.formIndex, props.female, props.variant, this.starterAbilityIndexes[starterIndex], this.starterNatures[starterIndex]);
        } else {
          const defaultDexAttr = this.scene.gameData.getSpeciesDefaultDexAttr(species, false, true);
          const defaultAbilityIndex = starterAttributes?.ability ?? this.scene.gameData.getStarterSpeciesDefaultAbilityIndex(species);
          // load default nature from stater save data, if set
          const defaultNature = starterAttributes?.nature || this.scene.gameData.getSpeciesDefaultNature(species);
          props = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
          if (!isNaN(starterAttributes?.variant)) {
            if (props.shiny = (starterAttributes.variant >= 0)) {
              props.variant = starterAttributes.variant as Variant;
            }
          }
          props.formIndex = starterAttributes?.form ?? props.formIndex;
          props.female = starterAttributes?.female ?? props.female;

          this.setSpeciesDetails(species, props.shiny, props.formIndex, props.female, props.variant, defaultAbilityIndex, defaultNature);
        }

        const speciesForm = getPokemonSpeciesForm(species.speciesId, props.formIndex);
        this.setTypeIcons(speciesForm.type1, speciesForm.type2);

        this.pokemonSprite.clearTint();
        if (this.pokerusSpecies.includes(species)) {
          handleTutorial(this.scene, Tutorial.Pokerus);
        }
      } else {
        this.pokemonGrowthRateText.setText("");
        this.pokemonGrowthRateLabelText.setVisible(false);
        this.type1Icon.setVisible(false);
        this.type2Icon.setVisible(false);
        this.pokemonLuckLabelText.setVisible(false);
        this.pokemonLuckText.setVisible(false);
        this.pokemonShinyIcon.setVisible(false);
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
      this.pokemonShinyIcon.setVisible(false);
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
        starterIndex = this.starterSpecies.indexOf(species);

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


        const isValidForChallenge = new Utils.BooleanHolder(true);
        Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, species, isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(species, this.dexAttrCursor), !!this.starterSpecies.length);
        const starterSprite = this.filteredStarterContainers[this.cursor].icon as Phaser.GameObjects.Sprite;
        starterSprite.setTexture(species.getIconAtlasKey(formIndex, shiny, variant), species.getIconId(female, formIndex, shiny, variant));
        this.filteredStarterContainers[this.cursor].checkIconId(female, formIndex, shiny, variant);
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
        this.speciesStarterMoves.push(...levelMoves.filter(lm => lm[0] > 0 && lm[0] <= 5).map(lm => lm[1]));
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
        const formText = Utils.capitalizeString(species?.forms[formIndex]?.formKey, "-", false, false);

        const speciesName = Utils.capitalizeString(Species[species.speciesId], "_", true, false);

        if (species.speciesId === Species.ARCEUS) {
          this.pokemonFormText.setText(i18next.t(`pokemonInfo:Type.${formText.toUpperCase()}`));
        } else {
          this.pokemonFormText.setText(formText ? i18next.t(`pokemonForm:${speciesName}${formText}`) : "");
        }

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

  popStarter(index: number): void {
    this.starterSpecies.splice(index, 1);
    this.starterAttr.splice(index, 1);
    this.starterAbilityIndexes.splice(index, 1);
    this.starterNatures.splice(index, 1);
    this.starterMovesets.splice(index, 1);

    for (let s = 0; s < this.starterSpecies.length; s++) {
      const species = this.starterSpecies[s];
      const currentDexAttr = this.scene.gameData.getSpeciesDefaultDexAttr(species, false, true);
      const props = this.scene.gameData.getSpeciesDexAttrProps(species, currentDexAttr);
      this.starterIcons[s].setTexture(species.getIconAtlasKey(props.formIndex, props.shiny, props.variant));
      this.starterIcons[s].setFrame(species.getIconId(props.female, props.formIndex, props.shiny, props.variant));
      if (s >= index) {
        this.starterCursorObjs[s].setPosition(this.starterCursorObjs[s + 1].x, this.starterCursorObjs[s + 1].y);
        this.starterCursorObjs[s].setVisible(this.starterCursorObjs[s + 1].visible);
      }
    }
    this.starterCursorObjs[this.starterSpecies.length].setVisible(false);
    this.starterIcons[this.starterSpecies.length].setTexture("pokemon_icons_0");
    this.starterIcons[this.starterSpecies.length].setFrame("unknown");

    if (this.starterIconsCursorObj.visible) {
      if (this.starterIconsCursorIndex === this.starterSpecies.length) {
        if (this.starterSpecies.length > 0) {
          this.starterIconsCursorIndex--;
        } else {
          this.starterIconsCursorObj.setVisible(false);
          this.setSpecies(null);
          this.setFilterMode(true);
        }
      }
      this.moveStarterIconsCursor(this.starterIconsCursorIndex);
    }

    this.tryUpdateValue();
  }

  updateStarterValueLabel(starter: StarterContainer): void {
    const speciesId = starter.species.speciesId;
    const baseStarterValue = speciesStarters[speciesId];
    const starterValue = this.scene.gameData.getSpeciesStarterValue(speciesId);
    starter.cost = starterValue;
    let valueStr = starterValue.toString();
    if (valueStr.startsWith("0.")) {
      valueStr = valueStr.slice(1);
    }
    starter.label.setText(valueStr);
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
    if (baseStarterValue - starterValue > 0) {
      starter.label.setColor(this.getTextColor(textStyle));
      starter.label.setShadowColor(this.getTextColor(textStyle, true));
    }
  }

  tryUpdateValue(add?: integer, addingToParty?: boolean): boolean {
    const value = this.starterSpecies.map(s => s.generation).reduce((total: integer, gen: integer, i: integer) => total += this.scene.gameData.getSpeciesStarterValue(this.starterSpecies[i].speciesId), 0);
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
    let isPartyValid: boolean = this.isPartyValid(); // this checks to see if the party is valid
    if (addingToParty) { // this does a check to see if the pokemon being added is valid; if so, it will update the isPartyValid boolean
      const isNewPokemonValid = new Utils.BooleanHolder(true);
      const species = this.filteredStarterContainers[this.cursor].species;
      Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, species, isNewPokemonValid, this.scene.gameData.getSpeciesDexAttrProps(species, this.scene.gameData.getSpeciesDefaultDexAttr(species, false, true)), !!(this.starterSpecies.length), false, false);
      isPartyValid = isPartyValid || isNewPokemonValid.value;
    }

    /**
     * this loop is used to set the Sprite's alpha value and check if the user can select other pokemon more.
     */
    this.canAddParty = false;
    const remainValue = valueLimit - newValue;
    for (let s = 0; s < this.allSpecies.length; s++) {
      /** Cost of pokemon species */
      const speciesStarterValue = this.scene.gameData.getSpeciesStarterValue(this.allSpecies[s].speciesId);
      /** Used to detect if this pokemon is registered in starter */
      const speciesStarterDexEntry = this.scene.gameData.dexData[this.allSpecies[s].speciesId];
      /** {@linkcode Phaser.GameObjects.Sprite} object of Pokémon for setting the alpha value */
      const speciesSprite = this.starterContainer[s].icon;

      /**
       * If remainValue greater than or equal pokemon species and the pokemon is legal for this challenge, the user can select.
       * so that the alpha value of pokemon sprite set 1.
       *
       * However, if isPartyValid is false, that means none of the party members are valid for the run. In this case, we should
       * check the challenge to make sure evolutions and forms aren't being checked for mono type runs.
       * This will let us set the sprite's alpha to show it can't be selected
       *
       * If speciesStarterDexEntry?.caughtAttr is true, this species registered in stater.
       * we change to can AddParty value to true since the user has enough cost to choose this pokemon and this pokemon registered too.
       */
      const isValidForChallenge = new Utils.BooleanHolder(true);
      if (isPartyValid) { // we have two checks here - one for the party being valid and one for not. This comes from mono type challenges - if the party is valid it will check pokemon's evolutions and forms, and if it's not valid it won't check their evolutions and forms
        Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, this.allSpecies[s], isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(this.allSpecies[s], this.scene.gameData.getSpeciesDefaultDexAttr(this.allSpecies[s], false, true)), !!(this.starterSpecies.length + (add ? 1 : 0)));
      } else {
        Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, this.allSpecies[s], isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(this.allSpecies[s], this.scene.gameData.getSpeciesDefaultDexAttr(this.allSpecies[s], false, true)), !!(this.starterSpecies.length + (add ? 1 : 0)), false, false);
      }

      const canBeChosen = remainValue >= speciesStarterValue && isValidForChallenge.value;

      const isPokemonInParty = this.isInParty(this.allSpecies[s])[0]; // this will get the valud of isDupe from isInParty. This will let us see if the pokemon in question is in our party already so we don't grey out the sprites if they're invalid

      /* This code does a check to tell whether or not a sprite should be lit up or greyed out. There are 3 ways a pokemon's sprite should be lit up:
        * 1) If it's in your party, it's a valid pokemon (i.e. for challenge) and you have enough points to have it
        * 2) If it's in your party, it's not valid (i.e. for challenges), and you have enough points to have it
        * 3) If it's not in your party, but it's a valid pokemon and you have enough points for it
        * Any other time, the sprite should be greyed out.
        * For example, if it's in your party, valid, but costs too much, or if it's not in your party and not valid, regardless of cost
      */
      if (canBeChosen || (isPokemonInParty && remainValue >= speciesStarterValue)) {
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

    this.value = newValue;
    return true;
  }

  tryStart(manualTrigger: boolean = false): boolean {
    if (!this.starterSpecies.length) {
      return false;
    }

    const ui = this.getUi();

    const cancel = () => {
      ui.setMode(Mode.STARTER_SELECT);
      if (!manualTrigger) {
        this.popStarter(this.starterSpecies.length - 1);
      }
      this.clearText();
    };

    const canStart = this.isPartyValid();

    if (canStart) {
      ui.showText(i18next.t("starterSelectUiHandler:confirmStartTeam"), null, () => {
        ui.setModeWithoutClear(Mode.CONFIRM, () => {
          const startRun = () => {
            this.scene.money = this.scene.gameMode.getStartingMoney();
            ui.setMode(Mode.STARTER_SELECT);
            const thisObj = this;
            const originalStarterSelectCallback = this.starterSelectCallback;
            this.starterSelectCallback = null;
            originalStarterSelectCallback(new Array(this.starterSpecies.length).fill(0).map(function (_, i) {
              const starterSpecies = thisObj.starterSpecies[i];
              return {
                species: starterSpecies,
                dexAttr: thisObj.starterAttr[i],
                abilityIndex: thisObj.starterAbilityIndexes[i],
                passive: !(thisObj.scene.gameData.starterData[starterSpecies.speciesId].passiveAttr ^ (PassiveAttr.ENABLED | PassiveAttr.UNLOCKED)),
                nature: thisObj.starterNatures[i] as Nature,
                moveset: thisObj.starterMovesets[i],
                pokerus: thisObj.pokerusSpecies.includes(starterSpecies)
              };
            }));
          };
          startRun();
        }, cancel, null, null, 19);
      });
    } else {
      const handler = this.scene.ui.getHandler() as AwaitableUiHandler;
      handler.tutorialActive = true;
      this.scene.ui.showText(i18next.t("starterSelectUiHandler:invalidParty"), null, () => this.scene.ui.showText(null, 0, () => handler.tutorialActive = false), null, true);
    }
    return true;
  }

  /* This block checks to see if your party is valid
   * It checks each pokemon against the challenge - noting that due to monotype challenges it needs to check the pokemon while ignoring their evolutions/form change items
  */
  isPartyValid(): boolean {
    let canStart = false;
    for (let s = 0; s < this.starterSpecies.length; s++) {
      const isValidForChallenge = new Utils.BooleanHolder(true);
      const species = this.starterSpecies[s];
      Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, species, isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(species, this.dexAttrCursor), !!(this.starterSpecies.length), false, false);
      canStart = canStart || isValidForChallenge.value;
    }
    return canStart;
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

  hideInstructions(): void {
    this.shinyIconElement.setVisible(false);
    this.shinyLabel.setVisible(false);
    this.formIconElement.setVisible(false);
    this.formLabel.setVisible(false);
    this.genderIconElement.setVisible(false);
    this.genderLabel.setVisible(false);
    this.abilityIconElement.setVisible(false);
    this.abilityLabel.setVisible(false);
    this.natureIconElement.setVisible(false);
    this.natureLabel.setVisible(false);
    this.variantIconElement.setVisible(false);
    this.variantLabel.setVisible(false);
  }

  clear(): void {
    super.clear();

    StarterPrefs.save(this.starterPreferences);
    this.cursor = -1;
    this.hideInstructions();
    this.starterSelectContainer.setVisible(false);
    this.blockInput = false;

    while (this.starterSpecies.length) {
      this.popStarter(this.starterSpecies.length - 1);
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
