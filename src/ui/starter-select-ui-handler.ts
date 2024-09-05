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
import PokemonSpecies, { allSpecies, getPokemonSpeciesForm, getStarterValueFriendshipCap, speciesStarters, starterPassiveAbilities, getPokerusStarters } from "../data/pokemon-species";
import { Type } from "../data/type";
import { GameModes } from "../game-mode";
import { AbilityAttr, DexAttr, DexAttrProps, DexEntry, StarterMoveset, StarterAttributes, StarterPreferences, StarterPrefs } from "../system/game-data";
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
import { getEggTierForSpecies } from "#app/data/egg";
import { Device } from "#enums/devices";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import {Button} from "#enums/buttons";
import { EggSourceType } from "#app/enums/egg-source-types";
import AwaitableUiHandler from "./awaitable-ui-handler";
import { DropDown, DropDownLabel, DropDownOption, DropDownState, DropDownType, SortCriteria } from "./dropdown";
import { StarterContainer } from "./starter-container";
import { DropDownColumn, FilterBar } from "./filter-bar";
import { ScrollBar } from "./scroll-bar";
import { SelectChallengePhase } from "#app/phases/select-challenge-phase";
import { TitlePhase } from "#app/phases/title-phase";
import { Abilities } from "#app/enums/abilities";

export type StarterSelectCallback = (starters: Starter[]) => void;

export interface Starter {
  species: PokemonSpecies;
  dexAttr: bigint;
  abilityIndex: integer,
  passive: boolean;
  nature: Nature;
  moveset?: StarterMoveset;
  pokerus: boolean;
  nickname?: string;
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
    starterInfoTextSize: "48px",
    instructionTextSize: "35px",
    starterInfoXPos: 33,
  },
  "es":{
    starterInfoTextSize: "56px",
    instructionTextSize: "35px",
  },
  "fr":{
    starterInfoTextSize: "54px",
    instructionTextSize: "35px",
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
    starterInfoTextSize: "47px",
    instructionTextSize: "38px",
    starterInfoYOffset: 1,
    starterInfoXPos: 24,
  },
  "pt":{
    starterInfoTextSize: "48px",
    instructionTextSize: "42px",
    starterInfoXPos: 33,
  },
  "ko":{
    starterInfoTextSize: "52px",
    instructionTextSize: "38px",
  },
  "ja":{
    starterInfoTextSize: "51px",
    instructionTextSize: "38px",
  },
  "ca-ES":{
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
};

const starterCandyCosts: { passive: integer, costReduction: [integer, integer], egg: integer }[] = [
  { passive: 40, costReduction: [25, 60], egg: 30 }, // 1 Cost
  { passive: 40, costReduction: [25, 60], egg: 30 }, // 2 Cost
  { passive: 35, costReduction: [20, 50], egg: 25 }, // 3 Cost
  { passive: 30, costReduction: [15, 40], egg: 20 }, // 4 Cost
  { passive: 25, costReduction: [12, 35], egg: 18 }, // 5 Cost
  { passive: 20, costReduction: [10, 30], egg: 15 }, // 6 Cost
  { passive: 15, costReduction: [8, 20], egg: 12 },  // 7 Cost
  { passive: 10, costReduction: [5, 15], egg: 10 },  // 8 Cost
  { passive: 10, costReduction: [5, 15], egg: 10 },  // 9 Cost
  { passive: 10, costReduction: [5, 15], egg: 10 },  // 10 Cost
];

const valueReductionMax = 2;

// Position of UI elements
const filterBarHeight = 17;
const speciesContainerX = 109; // if team on the RIGHT: 109 / if on the LEFT: 143
const teamWindowX = 285; // if team on the RIGHT: 285 / if on the LEFT: 109
const teamWindowY = 18;
const teamWindowWidth = 34;
const teamWindowHeight = 132;

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

/**
 * Calculates the y position for the icon of stater pokemon selected for the team
 * @param index index of the Pokemon in the team (0-5)
 * @returns the y position to use for the icon
 */
function calcStarterIconY(index: number) {
  const starterSpacing = teamWindowHeight / 7;
  const firstStarterY = teamWindowY + starterSpacing / 2;
  return Math.round(firstStarterY + starterSpacing * index);
}

/**
 * Finds the index of the team Pokemon closest vertically to the given y position
 * @param y the y position to find closest starter Pokemon
 * @param teamSize how many Pokemon are in the team (0-6)
 * @returns index of the closest Pokemon in the team container
 */
function findClosestStarterIndex(y: number, teamSize: number = 6): number {
  let smallestDistance = teamWindowHeight;
  let closestStarterIndex = 0;
  for (let i = 0; i < teamSize; i++) {
    const distance = Math.abs(y - (calcStarterIconY(i) - 13));
    if (distance < smallestDistance) {
      closestStarterIndex = i;
      smallestDistance = distance;
    }
  }
  return closestStarterIndex;
}

/**
 * Finds the row of the filtered Pokemon closest vertically to the given Pokemon in the team
 * @param index index of the Pokemon in the team (0-5)
 * @param numberOfRows the number of rows to check against
 * @returns index of the row closest vertically to the given Pokemon
 */
function findClosestStarterRow(index: number, numberOfRows: number) {
  const currentY = calcStarterIconY(index) - 13;
  let smallestDistance = teamWindowHeight;
  let closestRowIndex = 0;
  for (let i=0; i < numberOfRows; i++) {
    const distance = Math.abs(currentY - calcStarterPosition(i * 9).y);
    if (distance < smallestDistance) {
      closestRowIndex = i;
      smallestDistance = distance;
    }
  }
  return closestRowIndex;
}


export default class StarterSelectUiHandler extends MessageUiHandler {
  private starterSelectContainer: Phaser.GameObjects.Container;
  private starterSelectScrollBar: ScrollBar;
  private filterBarContainer: Phaser.GameObjects.Container;
  private filterBar: FilterBar;
  private shinyOverlay: Phaser.GameObjects.Image;
  private starterContainers: StarterContainer[] = [];
  private filteredStarterContainers: StarterContainer[] = [];
  private validStarterContainers: StarterContainer[] = [];
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
  private pokemonPassiveDisabledIcon: Phaser.GameObjects.Sprite;
  private pokemonPassiveLockedIcon: Phaser.GameObjects.Sprite;

  private instructionsContainer: Phaser.GameObjects.Container;
  private filterInstructionsContainer: Phaser.GameObjects.Container;
  private shinyIconElement: Phaser.GameObjects.Sprite;
  private formIconElement: Phaser.GameObjects.Sprite;
  private abilityIconElement: Phaser.GameObjects.Sprite;
  private genderIconElement: Phaser.GameObjects.Sprite;
  private natureIconElement: Phaser.GameObjects.Sprite;
  private variantIconElement: Phaser.GameObjects.Sprite;
  private goFilterIconElement: Phaser.GameObjects.Sprite;
  private shinyLabel: Phaser.GameObjects.Text;
  private formLabel: Phaser.GameObjects.Text;
  private genderLabel: Phaser.GameObjects.Text;
  private abilityLabel: Phaser.GameObjects.Text;
  private natureLabel: Phaser.GameObjects.Text;
  private variantLabel: Phaser.GameObjects.Text;
  private goFilterLabel: Phaser.GameObjects.Text;

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
  private starterMoveset: StarterMoveset | null;
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
  private speciesStarterDexEntry: DexEntry | null;
  private speciesStarterMoves: Moves[];
  private canCycleShiny: boolean;
  private canCycleForm: boolean;
  private canCycleGender: boolean;
  private canCycleAbility: boolean;
  private canCycleNature: boolean;
  private canCycleVariant: boolean;
  private value: integer = 0;
  private canAddParty: boolean;

  private assetLoadCancelled: Utils.BooleanHolder | null;
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
  private instructionRowTextOffset = 9;
  private filterInstructionRowX = 0;
  private filterInstructionRowY = 0;

  private starterSelectCallback: StarterSelectCallback | null;

  private starterPreferences: StarterPreferences;

  protected blockInput: boolean = false;

  constructor(scene: BattleScene) {
    super(scene, Mode.STARTER_SELECT);
  }

  setup() {
    const ui = this.getUi();
    const currentLanguage = i18next.resolvedLanguage!; // TODO: is this bang correct?
    const langSettingKey = Object.keys(languageSettings).find(lang => currentLanguage.includes(lang))!; // TODO: is this bang correct?
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

    const starterContainerWindow = addWindow(this.scene, speciesContainerX, filterBarHeight + 1, 175, 161);
    const starterContainerBg = this.scene.add.image(speciesContainerX+1, filterBarHeight + 2, "starter_container_bg");
    starterContainerBg.setOrigin(0, 0);
    this.starterSelectContainer.add(starterContainerBg);

    this.starterSelectContainer.add(addWindow(this.scene, teamWindowX, teamWindowY, teamWindowWidth, teamWindowHeight));
    this.starterSelectContainer.add(addWindow(this.scene, teamWindowX, teamWindowY + teamWindowHeight - 5, teamWindowWidth, teamWindowWidth, true));
    this.starterSelectContainer.add(starterContainerWindow);

    // Create and initialise filter bar
    this.filterBarContainer = this.scene.add.container(0, 0);
    this.filterBar = new FilterBar(this.scene, Math.min(speciesContainerX, teamWindowX), 1, 210, filterBarHeight);

    // gen filter
    const genOptions: DropDownOption[] = [
      new DropDownOption(this.scene, 1, new DropDownLabel(i18next.t("starterSelectUiHandler:gen1"))),
      new DropDownOption(this.scene, 2, new DropDownLabel(i18next.t("starterSelectUiHandler:gen2"))),
      new DropDownOption(this.scene, 3, new DropDownLabel(i18next.t("starterSelectUiHandler:gen3"))),
      new DropDownOption(this.scene, 4, new DropDownLabel(i18next.t("starterSelectUiHandler:gen4"))),
      new DropDownOption(this.scene, 5, new DropDownLabel(i18next.t("starterSelectUiHandler:gen5"))),
      new DropDownOption(this.scene, 6, new DropDownLabel(i18next.t("starterSelectUiHandler:gen6"))),
      new DropDownOption(this.scene, 7, new DropDownLabel(i18next.t("starterSelectUiHandler:gen7"))),
      new DropDownOption(this.scene, 8, new DropDownLabel(i18next.t("starterSelectUiHandler:gen8"))),
      new DropDownOption(this.scene, 9, new DropDownLabel(i18next.t("starterSelectUiHandler:gen9"))),
    ];
    const genDropDown: DropDown = new DropDown(this.scene, 0, 0, genOptions, this.updateStarters, DropDownType.HYBRID);
    this.filterBar.addFilter(DropDownColumn.GEN, i18next.t("filterBar:genFilter"), genDropDown);

    // type filter
    const typeKeys = Object.keys(Type).filter(v => isNaN(Number(v)));
    const typeOptions: DropDownOption[] = [];
    typeKeys.forEach((type, index) => {
      if (index === 0 || index === 19) {
        return;
      }
      const typeSprite = this.scene.add.sprite(0, 0, Utils.getLocalizedSpriteKey("types"));
      typeSprite.setScale(0.5);
      typeSprite.setFrame(type.toLowerCase());
      typeOptions.push(new DropDownOption(this.scene, index, new DropDownLabel("", typeSprite)));
    });
    this.filterBar.addFilter(DropDownColumn.TYPES, i18next.t("filterBar:typeFilter"), new DropDown(this.scene, 0, 0, typeOptions, this.updateStarters, DropDownType.HYBRID, 0.5));

    // caught filter
    const shiny1Sprite = this.scene.add.sprite(0, 0, "shiny_icons");
    shiny1Sprite.setOrigin(0.15, 0.2);
    shiny1Sprite.setScale(0.6);
    shiny1Sprite.setFrame(getVariantIcon(0));
    shiny1Sprite.setTint(getVariantTint(0));
    const shiny2Sprite = this.scene.add.sprite(0, 0, "shiny_icons");
    shiny2Sprite.setOrigin(0.15, 0.2);
    shiny2Sprite.setScale(0.6);
    shiny2Sprite.setFrame(getVariantIcon(1));
    shiny2Sprite.setTint(getVariantTint(1));
    const shiny3Sprite = this.scene.add.sprite(0, 0, "shiny_icons");
    shiny3Sprite.setOrigin(0.15, 0.2);
    shiny3Sprite.setScale(0.6);
    shiny3Sprite.setFrame(getVariantIcon(2));
    shiny3Sprite.setTint(getVariantTint(2));

    const caughtOptions = [
      new DropDownOption(this.scene, "SHINY3", new DropDownLabel("", shiny3Sprite)),
      new DropDownOption(this.scene, "SHINY2", new DropDownLabel("", shiny2Sprite)),
      new DropDownOption(this.scene, "SHINY", new DropDownLabel("", shiny1Sprite)),
      new DropDownOption(this.scene, "NORMAL", new DropDownLabel(i18next.t("filterBar:normal"))),
      new DropDownOption(this.scene, "UNCAUGHT", new DropDownLabel(i18next.t("filterBar:uncaught")))
    ];

    this.filterBar.addFilter(DropDownColumn.CAUGHT, i18next.t("filterBar:caughtFilter"), new DropDown(this.scene, 0, 0, caughtOptions, this.updateStarters, DropDownType.HYBRID));

    // unlocks filter
    const passiveLabels = [
      new DropDownLabel(i18next.t("filterBar:passive"), undefined, DropDownState.OFF),
      new DropDownLabel(i18next.t("filterBar:passiveUnlocked"), undefined, DropDownState.ON),
      new DropDownLabel(i18next.t("filterBar:passiveUnlockable"), undefined, DropDownState.UNLOCKABLE),
      new DropDownLabel(i18next.t("filterBar:passiveLocked"), undefined, DropDownState.EXCLUDE),
    ];

    const costReductionLabels = [
      new DropDownLabel(i18next.t("filterBar:costReduction"), undefined, DropDownState.OFF),
      new DropDownLabel(i18next.t("filterBar:costReductionUnlocked"), undefined, DropDownState.ON),
      new DropDownLabel(i18next.t("filterBar:costReductionUnlockable"), undefined, DropDownState.UNLOCKABLE),
      new DropDownLabel(i18next.t("filterBar:costReductionLocked"), undefined, DropDownState.EXCLUDE),
    ];

    const unlocksOptions = [
      new DropDownOption(this.scene, "PASSIVE", passiveLabels),
      new DropDownOption(this.scene, "COST_REDUCTION", costReductionLabels),
    ];

    this.filterBar.addFilter(DropDownColumn.UNLOCKS, i18next.t("filterBar:unlocksFilter"), new DropDown(this.scene, 0, 0, unlocksOptions, this.updateStarters, DropDownType.RADIAL));

    // misc filter
    const favoriteLabels = [
      new DropDownLabel(i18next.t("filterBar:favorite"), undefined, DropDownState.OFF),
      new DropDownLabel(i18next.t("filterBar:isFavorite"), undefined, DropDownState.ON),
      new DropDownLabel(i18next.t("filterBar:notFavorite"), undefined, DropDownState.EXCLUDE),
    ];
    const winLabels = [
      new DropDownLabel(i18next.t("filterBar:ribbon"), undefined, DropDownState.OFF),
      new DropDownLabel(i18next.t("filterBar:hasWon"), undefined, DropDownState.ON),
      new DropDownLabel(i18next.t("filterBar:hasNotWon"), undefined, DropDownState.EXCLUDE),
    ];
    const hiddenAbilityLabels = [
      new DropDownLabel(i18next.t("filterBar:hiddenAbility"), undefined, DropDownState.OFF),
      new DropDownLabel(i18next.t("filterBar:hasHiddenAbility"), undefined, DropDownState.ON),
      new DropDownLabel(i18next.t("filterBar:noHiddenAbility"), undefined, DropDownState.EXCLUDE),
    ];
    const eggLabels = [
      new DropDownLabel(i18next.t("filterBar:egg"), undefined, DropDownState.OFF),
      new DropDownLabel(i18next.t("filterBar:eggPurchasable"), undefined, DropDownState.ON),
    ];
    const pokerusLabels = [
      new DropDownLabel(i18next.t("filterBar:pokerus"), undefined, DropDownState.OFF),
      new DropDownLabel(i18next.t("filterBar:hasPokerus"), undefined, DropDownState.ON),
    ];
    const miscOptions = [
      new DropDownOption(this.scene, "FAVORITE", favoriteLabels),
      new DropDownOption(this.scene, "WIN", winLabels),
      new DropDownOption(this.scene, "HIDDEN_ABILITY", hiddenAbilityLabels),
      new DropDownOption(this.scene, "EGG", eggLabels),
      new DropDownOption(this.scene, "POKERUS", pokerusLabels),
    ];
    this.filterBar.addFilter(DropDownColumn.MISC, i18next.t("filterBar:miscFilter"), new DropDown(this.scene, 0, 0, miscOptions, this.updateStarters, DropDownType.RADIAL));

    // sort filter
    const sortOptions = [
      new DropDownOption(this.scene, SortCriteria.NUMBER, new DropDownLabel(i18next.t("filterBar:sortByNumber"), undefined, DropDownState.ON)),
      new DropDownOption(this.scene, SortCriteria.COST, new DropDownLabel(i18next.t("filterBar:sortByCost"))),
      new DropDownOption(this.scene, SortCriteria.CANDY, new DropDownLabel(i18next.t("filterBar:sortByCandies"))),
      new DropDownOption(this.scene, SortCriteria.IV, new DropDownLabel(i18next.t("filterBar:sortByIVs"))),
      new DropDownOption(this.scene, SortCriteria.NAME, new DropDownLabel(i18next.t("filterBar:sortByName")))
    ];
    this.filterBar.addFilter(DropDownColumn.SORT, i18next.t("filterBar:sortFilter"), new DropDown(this.scene, 0, 0, sortOptions, this.updateStarters, DropDownType.SINGLE));
    this.filterBarContainer.add(this.filterBar);

    this.starterSelectContainer.add(this.filterBarContainer);

    // Offset the generation filter dropdown to avoid covering the filtered pokemon
    this.filterBar.offsetHybridFilters();

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

    this.pokemonPassiveDisabledIcon = this.scene.add.sprite(starterInfoXPos, 137 + starterInfoYOffset, "icon_stop");
    this.pokemonPassiveDisabledIcon.setOrigin(0, 0.5);
    this.pokemonPassiveDisabledIcon.setScale(0.35);
    this.pokemonPassiveDisabledIcon.setVisible(false);
    this.starterSelectContainer.add(this.pokemonPassiveDisabledIcon);

    this.pokemonPassiveLockedIcon = this.scene.add.sprite(starterInfoXPos, 137 + starterInfoYOffset, "icon_lock");
    this.pokemonPassiveLockedIcon.setOrigin(0, 0.5);
    this.pokemonPassiveLockedIcon.setScale(0.42, 0.38);
    this.pokemonPassiveLockedIcon.setVisible(false);
    this.starterSelectContainer.add(this.pokemonPassiveLockedIcon);

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

    this.valueLimitLabel = addTextObject(this.scene, teamWindowX+17, 150, "0/10", TextStyle.TOOLTIP_CONTENT);
    this.valueLimitLabel.setOrigin(0.5, 0);
    this.starterSelectContainer.add(this.valueLimitLabel);

    const startLabel = addTextObject(this.scene, teamWindowX+17, 162, i18next.t("common:start"), TextStyle.TOOLTIP_CONTENT);
    startLabel.setOrigin(0.5, 0);
    this.starterSelectContainer.add(startLabel);

    this.startCursorObj = this.scene.add.nineslice(teamWindowX+4, 160, "select_cursor", undefined, 26, 15, 6, 6, 6, 6);
    this.startCursorObj.setVisible(false);
    this.startCursorObj.setOrigin(0, 0);
    this.starterSelectContainer.add(this.startCursorObj);

    const starterSpecies: Species[] = [];

    const starterBoxContainer = this.scene.add.container(speciesContainerX + 6, 9); //115

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
      this.starterContainers.push(starterContainer);
      starterBoxContainer.add(starterContainer);
    }

    this.starterSelectContainer.add(starterBoxContainer);

    this.starterIcons = new Array(6).fill(null).map((_, i) => {
      const icon = this.scene.add.sprite(teamWindowX + 7, calcStarterIconY(i), "pokemon_icons_0");
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

    this.type1Icon = this.scene.add.sprite(8, 98, Utils.getLocalizedSpriteKey("types"));
    this.type1Icon.setScale(0.5);
    this.type1Icon.setOrigin(0, 0);
    this.starterSelectContainer.add(this.type1Icon);

    this.type2Icon = this.scene.add.sprite(26, 98, Utils.getLocalizedSpriteKey("types"));
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
    this.pokemonCaughtHatchedContainer.add(this.pokemonShinyIcon);

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

    this.goFilterIconElement = new Phaser.GameObjects.Sprite(this.scene, this.filterInstructionRowX, this.filterInstructionRowY, "keyboard", "C.png");
    this.goFilterIconElement.setName("sprite-goFilter-icon-element");
    this.goFilterIconElement.setScale(0.675);
    this.goFilterIconElement.setOrigin(0.0, 0.0);
    this.goFilterLabel = addTextObject(this.scene, this.filterInstructionRowX + this.instructionRowTextOffset, this.filterInstructionRowY, i18next.t("starterSelectUiHandler:goFilter"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.goFilterLabel.setName("text-goFilter-label");

    this.hideInstructions();

    this.filterInstructionsContainer = this.scene.add.container(50, 5);
    this.filterInstructionsContainer.setVisible(true);
    this.starterSelectContainer.add(this.filterInstructionsContainer);

    this.starterSelectMessageBoxContainer = this.scene.add.container(0, this.scene.game.canvas.height / 6);
    this.starterSelectMessageBoxContainer.setVisible(false);
    this.starterSelectContainer.add(this.starterSelectMessageBoxContainer);

    this.starterSelectMessageBox = addWindow(this.scene, 1, -1, 318, 28);
    this.starterSelectMessageBox.setOrigin(0, 1);
    this.starterSelectMessageBoxContainer.add(this.starterSelectMessageBox);

    this.message = addTextObject(this.scene, 8, 8, "", TextStyle.WINDOW, { maxLines: 2 });
    this.message.setOrigin(0, 0);
    this.starterSelectMessageBoxContainer.add(this.message);

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
    this.pokerusSpecies = getPokerusStarters(this.scene);

    if (args.length >= 1 && args[0] instanceof Function) {
      super.show(args);
      this.starterSelectCallback = args[0] as StarterSelectCallback;

      this.starterSelectContainer.setVisible(true);

      this.allSpecies.forEach((species, s) => {
        const icon = this.starterContainers[s].icon;
        const dexEntry = this.scene.gameData.dexData[species.speciesId];

        // Initialize the StarterAttributes for this species
        this.starterPreferences[species.speciesId] = this.initStarterPrefs(species);

        if (dexEntry.caughtAttr) {
          icon.clearTint();
        } else if (dexEntry.seenAttr) {
          icon.setTint(0x808080);
        }

        this.setUpgradeAnimation(icon, species);
      });

      this.resetFilters();
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

  /**
   * Get the starter attributes for the given PokemonSpecies, after sanitizing them.
   * If somehow a preference is set for a form, variant, gender, ability or nature
   * that wasn't actually unlocked or is invalid it will be cleared here
   *
   * @param species The species to get Starter Preferences for
   * @returns StarterAttributes for the species
   */
  initStarterPrefs(species: PokemonSpecies): StarterAttributes {
    const starterAttributes = this.starterPreferences[species.speciesId];
    const dexEntry = this.scene.gameData.dexData[species.speciesId];
    const starterData = this.scene.gameData.starterData[species.speciesId];

    // no preferences or Pokemon wasn't caught, return empty attribute
    if (!starterAttributes || !dexEntry.caughtAttr) {
      return {};
    }

    const caughtAttr = dexEntry.caughtAttr;

    const hasShiny = caughtAttr & DexAttr.SHINY;
    const hasNonShiny = caughtAttr & DexAttr.NON_SHINY;
    if (starterAttributes.shiny && !hasShiny) {
      // shiny form wasn't unlocked, purging shiny and variant setting
      delete starterAttributes.shiny;
      delete starterAttributes.variant;
    } else if (starterAttributes.shiny === false && !hasNonShiny) {
      // non shiny form wasn't unlocked, purging shiny setting
      delete starterAttributes.shiny;
    }

    if (starterAttributes.variant !== undefined && !isNaN(starterAttributes.variant)) {
      const unlockedVariants = [
        hasNonShiny,
        hasShiny && caughtAttr & DexAttr.DEFAULT_VARIANT,
        hasShiny && caughtAttr & DexAttr.VARIANT_2,
        hasShiny && caughtAttr & DexAttr.VARIANT_3
      ];
      if (!unlockedVariants[starterAttributes.variant + 1]) { // add 1 as -1 = non-shiny
        // requested variant wasn't unlocked, purging setting
        delete starterAttributes.variant;
      }
    }

    if (starterAttributes.female !== undefined) {
      if (!(starterAttributes.female ? caughtAttr & DexAttr.FEMALE : caughtAttr & DexAttr.MALE)) {
        // requested gender wasn't unlocked, purging setting
        delete starterAttributes.female;
      }
    }

    if (starterAttributes.ability !== undefined) {
      const speciesHasSingleAbility = species.ability2 === species.ability1;
      const abilityAttr = starterData.abilityAttr;
      const hasAbility1 = abilityAttr & AbilityAttr.ABILITY_1;
      const hasAbility2 = abilityAttr & AbilityAttr.ABILITY_2;
      const hasHiddenAbility = abilityAttr & AbilityAttr.ABILITY_HIDDEN;
      // Due to a past bug it is possible that some Pokemon with a single ability have the ability2 flag
      // In this case, we only count ability2 as valid if ability1 was not unlocked, otherwise we ignore it
      const unlockedAbilities = [
        hasAbility1,
        speciesHasSingleAbility ? hasAbility2 && !hasAbility1 : hasAbility2,
        hasHiddenAbility
      ];
      if (!unlockedAbilities[starterAttributes.ability]) {
        // requested ability wasn't unlocked, purging setting
        delete starterAttributes.ability;
      }
    }

    const selectedForm = starterAttributes.form;
    if (selectedForm !== undefined && (!species.forms[selectedForm]?.isStarterSelectable || !(caughtAttr & this.scene.gameData.getFormAttr(selectedForm)))) {
      // requested form wasn't unlocked/isn't a starter form, purging setting
      delete starterAttributes.form;
    }

    if (starterAttributes.nature !== undefined) {
      const unlockedNatures = this.scene.gameData.getNaturesForAttr(dexEntry.natureAttr);
      if (unlockedNatures.indexOf(starterAttributes.nature as unknown as Nature) < 0) {
        // requested nature wasn't unlocked, purging setting
        delete starterAttributes.nature;
      }
    }

    return starterAttributes;
  }

  /**
   * Set the selections for all filters to their default starting value
   */
  resetFilters() : void {
    const caughtDropDown: DropDown = this.filterBar.getFilter(DropDownColumn.CAUGHT);

    this.filterBar.setValsToDefault();

    // initial setting, in caught filter, select the options excluding the uncaught option
    for (let i = 0; i < caughtDropDown.options.length; i++) {
      // if the option is not "ALL" or "UNCAUGHT", toggle it
      if (caughtDropDown.options[i].val !== "ALL" && caughtDropDown.options[i].val !== "UNCAUGHT") {
        caughtDropDown.toggleOptionState(i);
      }
    }
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
        && starterData.valueReduction < valueReductionMax;
  }

  /**
   * Determines if an same species egg can be bought for the given species ID
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

    const isPassiveAvailable = this.isPassiveAvailable(species.speciesId);
    const isValueReductionAvailable = this.isValueReductionAvailable(species.speciesId);
    const isSameSpeciesEggAvailable = this.isSameSpeciesEggAvailable(species.speciesId);

    // 'Passives Only' mode
    if (this.scene.candyUpgradeNotification === 1) {
      if (isPassiveAvailable) {
        this.scene.tweens.chain(tweenChain).paused = startPaused;
      }
    // 'On' mode
    } else if (this.scene.candyUpgradeNotification === 2) {
      if (isPassiveAvailable || isValueReductionAvailable || isSameSpeciesEggAvailable) {
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

    const isPassiveAvailable = this.isPassiveAvailable(species.speciesId);
    const isValueReductionAvailable = this.isValueReductionAvailable(species.speciesId);
    const isSameSpeciesEggAvailable = this.isSameSpeciesEggAvailable(species.speciesId);

    // 'Passive Only' mode
    if (this.scene.candyUpgradeNotification === 1) {
      starter.candyUpgradeIcon.setVisible(slotVisible && isPassiveAvailable);
      starter.candyUpgradeOverlayIcon.setVisible(slotVisible && starter.candyUpgradeIcon.visible);

      // 'On' mode
    } else if (this.scene.candyUpgradeNotification === 2) {
      starter.candyUpgradeIcon.setVisible(
        slotVisible && ( isPassiveAvailable || isValueReductionAvailable || isSameSpeciesEggAvailable ));
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

    const maxColumns = 9;
    const maxRows = 9;
    const numberOfStarters = this.filteredStarterContainers.length;
    const numOfRows = Math.ceil(numberOfStarters / maxColumns);
    const currentRow = Math.floor(this.cursor / maxColumns);
    const onScreenFirstIndex = this.scrollCursor * maxColumns; // this is first starter index on the screen
    const onScreenLastIndex = Math.min(this.filteredStarterContainers.length - 1, onScreenFirstIndex + maxRows * maxColumns - 1); // this is the last starter index on the screen
    const onScreenNumberOfStarters = onScreenLastIndex - onScreenFirstIndex + 1;
    const onScreenNumberOfRows = Math.ceil(onScreenNumberOfStarters / maxColumns);
    const onScreenCurrentRow = Math.floor((this.cursor - onScreenFirstIndex) / maxColumns);

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
        // CANCEL with a filter menu open > close it
        this.filterBar.toggleDropDown(this.filterBarCursor);

        // if there are possible starters go the first one of the list
        if (numberOfStarters > 0) {
          this.setFilterMode(false);
          this.scrollCursor = 0;
          this.updateScroll();
          this.setCursor(0);
        }
        success = true;

      } else if (this.statsMode) {
        this.toggleStatsMode(false);
        success = true;
      } else if (this.starterSpecies.length) {
        this.popStarter(this.starterSpecies.length - 1);
        success = true;
        this.updateInstructions();
      } else {
        this.tryExit();
        success = true;
      }
    } else if (button === Button.STATS) {
      // if stats button is pressed, go to filter directly
      if (!this.filterMode) {
        this.startCursorObj.setVisible(false);
        this.starterIconsCursorObj.setVisible(false);
        this.setSpecies(null);
        this.filterBarCursor = 0;
        this.setFilterMode(true);
        this.filterBar.toggleDropDown(this.filterBarCursor);
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
          // up from start button with no Pokemon in the team > go to filter
          this.startCursorObj.setVisible(false);
          this.filterBarCursor = Math.max(1, this.filterBar.numFilters - 1);
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
          // down from start button with no Pokemon in the team > go to filter
          this.startCursorObj.setVisible(false);
          this.filterBarCursor = Math.max(1, this.filterBar.numFilters - 1);
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
          // UP from filter bar to bottom of Pokemon list
          this.setFilterMode(false);
          this.scrollCursor = Math.max(0, numOfRows - 9);
          this.updateScroll();
          const proportion = (this.filterBarCursor + 0.5) / this.filterBar.numFilters;
          const targetCol = Math.min(8, Math.floor(proportion * 11));
          if (numberOfStarters % 9 > targetCol) {
            this.setCursor(numberOfStarters - (numberOfStarters) % 9 + targetCol);
          } else {
            this.setCursor(Math.max(numberOfStarters - (numberOfStarters) % 9 + targetCol - 9, 0));
          }
          success = true;
        }
        break;
      case Button.DOWN:
        if (this.filterBar.openDropDown) {
          success = this.filterBar.incDropDownCursor();
        } else if (numberOfStarters > 0) {
          // DOWN from filter bar to top of Pokemon list
          this.setFilterMode(false);
          this.scrollCursor = 0;
          this.updateScroll();
          const proportion = this.filterBarCursor / Math.max(1, this.filterBar.numFilters - 1);
          const targetCol = Math.min(8, Math.floor(proportion * 11));
          this.setCursor(Math.min(targetCol, numberOfStarters));
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

      let starterContainer;
      const starterData = this.scene.gameData.starterData[this.lastSpecies.speciesId];
      // prepare persistent starter data to store changes
      let starterAttributes = this.starterPreferences[this.lastSpecies.speciesId];

      // this gets the correct pokemon cursor depending on whether you're in the starter screen or the party icons
      if (!this.starterIconsCursorObj.visible) {
        starterContainer = this.filteredStarterContainers[this.cursor];
      } else {
        // if species is in filtered starters, get the starter container from the filtered starters, it can be undefined if the species is not in the filtered starters
        starterContainer = this.filteredStarterContainers[this.filteredStarterContainers.findIndex(container => container.species === this.lastSpecies)];
      }

      if (button === Button.ACTION) {
        if (!this.speciesStarterDexEntry?.caughtAttr) {
          error = true;
        } else if (this.starterSpecies.length <= 6) { // checks to see if the party has 6 or fewer pokemon
          const ui = this.getUi();
          let options: any[] = []; // TODO: add proper type

          const [isDupe, removeIndex]: [boolean, number] = this.isInParty(this.lastSpecies); // checks to see if the pokemon is a duplicate; if it is, returns the index that will be removed

          const isPartyValid = this.isPartyValid();
          const isValidForChallenge = new Utils.BooleanHolder(true);

          Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, this.lastSpecies, isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, this.getCurrentDexProps(this.lastSpecies.speciesId)), isPartyValid);

          const currentPartyValue = this.starterSpecies.map(s => s.generation).reduce((total: number, gen: number, i: number) => total += this.scene.gameData.getSpeciesStarterValue(this.starterSpecies[i].speciesId), 0);
          const newCost = this.scene.gameData.getSpeciesStarterValue(this.lastSpecies.speciesId);
          if (!isDupe && isValidForChallenge.value && currentPartyValue + newCost <= this.getValueLimit() && this.starterSpecies.length < 6) { // this checks to make sure the pokemon doesn't exist in your party, it's valid for the challenge and that it won't go over the cost limit; if it meets all these criteria it will add it to your party
            options = [
              {
                label: i18next.t("starterSelectUiHandler:addToParty"),
                handler: () => {
                  ui.setMode(Mode.STARTER_SELECT);
                  const isOverValueLimit = this.tryUpdateValue(this.scene.gameData.getSpeciesStarterValue(this.lastSpecies.speciesId), true);
                  if (!isDupe && isValidForChallenge.value && isOverValueLimit) {
                    const cursorObj = this.starterCursorObjs[this.starterSpecies.length];
                    cursorObj.setVisible(true);
                    cursorObj.setPosition(this.cursorObj.x, this.cursorObj.y);
                    this.addToParty(this.lastSpecies, this.dexAttrCursor, this.abilityCursor, this.natureCursor as unknown as Nature, this.starterMoveset?.slice(0) as StarterMoveset);
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

              this.blockInput = true;

              ui.setMode(Mode.STARTER_SELECT).then(() => {
                ui.showText(i18next.t("starterSelectUiHandler:selectMoveSwapOut"), null, () => {
                  this.moveInfoOverlay.show(allMoves[moveset[0]]);

                  ui.setModeWithoutClear(Mode.OPTION_SELECT, {
                    options: moveset.map((m: Moves, i: number) => {
                      const option: OptionSelectItem = {
                        label: allMoves[m].name,
                        handler: () => {
                          this.blockInput = true;
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
                                      showSwapOptions(this.starterMoveset!); // TODO: is this bang correct?
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
                                    showSwapOptions(this.starterMoveset!); // TODO: is this bang correct?
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
                              this.blockInput = false;
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
                  this.blockInput = false;
                });
              });
            };
            options.push({
              label: i18next.t("starterSelectUiHandler:manageMoves"),
              handler: () => {
                showSwapOptions(this.starterMoveset!); // TODO: is this bang correct?
                return true;
              }
            });
          }
          if (this.canCycleNature) {
            // if we could cycle natures, enable the improved nature menu
            const showNatureOptions = () => {

              this.blockInput = true;

              ui.setMode(Mode.STARTER_SELECT).then(() => {
                ui.showText(i18next.t("starterSelectUiHandler:selectNature"), null, () => {
                  const natures = this.scene.gameData.getNaturesForAttr(this.speciesStarterDexEntry?.natureAttr);
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
                          this.blockInput = false;
                          return true;
                        }
                      };
                      return option;
                    }).concat({
                      label: i18next.t("menu:cancel"),
                      handler: () => {
                        this.clearText();
                        ui.setMode(Mode.STARTER_SELECT);
                        this.blockInput = false;
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
          // if container.favorite is false, show the favorite option
          const isFavorite = starterAttributes?.favorite ?? false;
          if (!isFavorite) {
            options.push({
              label: i18next.t("starterSelectUiHandler:addToFavorites"),
              handler: () => {
                starterAttributes.favorite = true;
                // if the starter container not exists, it means the species is not in the filtered starters
                if (starterContainer) {
                  starterContainer.favoriteIcon.setVisible(starterAttributes.favorite);
                }
                ui.setMode(Mode.STARTER_SELECT);
                return true;
              }
            });
          } else {
            options.push({
              label: i18next.t("starterSelectUiHandler:removeFromFavorites"),
              handler: () => {
                starterAttributes.favorite = false;
                // if the starter container not exists, it means the species is not in the filtered starters
                if (starterContainer) {
                  starterContainer.favoriteIcon.setVisible(starterAttributes.favorite);
                }
                ui.setMode(Mode.STARTER_SELECT);
                return true;
              }
            });
          }
          options.push({
            label: i18next.t("menu:rename"),
            handler: () => {
              ui.playSelect();
              let nickname = starterAttributes.nickname ? String(starterAttributes.nickname) : "";
              nickname = decodeURIComponent(escape(atob(nickname)));
              ui.setModeWithoutClear(Mode.RENAME_POKEMON, {
                buttonActions: [
                  (sanitizedName: string) => {
                    ui.playSelect();
                    starterAttributes.nickname = sanitizedName;
                    const name = decodeURIComponent(escape(atob(starterAttributes.nickname)));
                    if (name.length > 0) {
                      this.pokemonNameText.setText(name);
                    } else {
                      this.pokemonNameText.setText(this.lastSpecies.name);
                    }
                    ui.setMode(Mode.STARTER_SELECT);
                  },
                  () => {
                    ui.setMode(Mode.STARTER_SELECT);
                  }
                ]
              }, nickname);
              return true;
            }
          });
          const showUseCandies = () => { // this lets you use your candies
            const options: any[] = []; // TODO: add proper type
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

                    // if starterContainer exists, update the passive background
                    if (starterContainer) {
                      // Update the candy upgrade display
                      if (this.isUpgradeIconEnabled() ) {
                        this.setUpgradeIcon(starterContainer);
                      }
                      if (this.isUpgradeAnimationEnabled()) {
                        this.setUpgradeAnimation(starterContainer.icon, this.lastSpecies, true);
                      }

                      starterContainer.starterPassiveBgs.setVisible(!!this.scene.gameData.starterData[this.lastSpecies.speciesId].passiveAttr);
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
            if (valueReduction < valueReductionMax) {
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
                    this.tryUpdateValue(0);
                    ui.setMode(Mode.STARTER_SELECT);
                    this.scene.playSound("se/buy");

                    // if starterContainer exists, update the value reduction background
                    if (starterContainer) {
                      this.updateStarterValueLabel(starterContainer);

                      // If the notification setting is set to 'On', update the candy upgrade display
                      if (this.scene.candyUpgradeNotification === 2) {
                        if (this.isUpgradeIconEnabled() ) {
                          this.setUpgradeIcon(starterContainer);
                        }
                        if (this.isUpgradeAnimationEnabled()) {
                          this.setUpgradeAnimation(starterContainer.icon, this.lastSpecies, true);
                        }
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

            // Same species egg menu option.
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
                  this.scene.playSound("se/buy");

                  return true;
                }
                return false;
              },
              item: "candy",
              itemArgs: starterColors[this.lastSpecies.speciesId]
            });
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
        const props = this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, this.getCurrentDexProps(this.lastSpecies.speciesId));
        switch (button) {
        case Button.CYCLE_SHINY:
          if (this.canCycleShiny) {
            starterAttributes.shiny = starterAttributes.shiny !== undefined ? !starterAttributes.shiny : false;

            if (starterAttributes.shiny) {
              // Change to shiny, we need to get the proper default variant
              const newProps = this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, this.getCurrentDexProps(this.lastSpecies.speciesId));
              const newVariant = starterAttributes.variant ? starterAttributes.variant as Variant : newProps.variant;
              this.setSpeciesDetails(this.lastSpecies, true, undefined, undefined, newVariant, undefined, undefined);

              this.scene.playSound("se/sparkle");
              // Set the variant label to the shiny tint
              const tint = getVariantTint(newVariant);
              this.pokemonShinyIcon.setFrame(getVariantIcon(newVariant));
              this.pokemonShinyIcon.setTint(tint);
              this.pokemonShinyIcon.setVisible(true);
            } else {
              this.setSpeciesDetails(this.lastSpecies, false, undefined, undefined, 0, undefined, undefined);
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
              if (this.lastSpecies.forms[newFormIndex].isStarterSelectable && this.speciesStarterDexEntry!.caughtAttr! & this.scene.gameData.getFormAttr(newFormIndex)) { // TODO: are those bangs correct?
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
            const hasAbility1 = abilityAttr & AbilityAttr.ABILITY_1;
            let newAbilityIndex = this.abilityCursor;
            do {
              newAbilityIndex = (newAbilityIndex + 1) % abilityCount;
              if (newAbilityIndex === 0) {
                if (hasAbility1) {
                  break;
                }
              } else if (newAbilityIndex === 1) {
                // If ability 1 and 2 are the same and ability 1 is unlocked, skip over ability 2
                if (this.lastSpecies.ability1 === this.lastSpecies.ability2 && hasAbility1) {
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
            const natures = this.scene.gameData.getNaturesForAttr(this.speciesStarterDexEntry?.natureAttr);
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
                if (this.speciesStarterDexEntry!.caughtAttr & DexAttr.DEFAULT_VARIANT) { // TODO: is this bang correct?
                  break;
                }
              } else if (newVariant === 1) {
                if (this.speciesStarterDexEntry!.caughtAttr & DexAttr.VARIANT_2) { // TODO: is this bang correct?
                  break;
                }
              } else {
                if (this.speciesStarterDexEntry!.caughtAttr & DexAttr.VARIANT_3) { // TODO: is this bang correct?
                  break;
                }
              }
            } while (newVariant !== props.variant);
            starterAttributes.variant = newVariant; // store the selected variant
            this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, newVariant as Variant, undefined, undefined);
            // Cycle tint based on current sprite tint
            const tint = getVariantTint(newVariant as Variant);
            this.pokemonShinyIcon.setFrame(getVariantIcon(newVariant as Variant));
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
              // Up from first Pokemon in the team > go to filter
              this.starterIconsCursorObj.setVisible(false);
              this.setSpecies(null);
              this.filterBarCursor = Math.max(1, this.filterBar.numFilters - 1);
              this.setFilterMode(true);
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
            } else if (numOfRows > 1) {
              // DOWN from last row of Pokemon > Wrap around to first row
              this.scrollCursor = 0;
              this.updateScroll();
              success = this.setCursor(this.cursor % 9);
            } else {
              // DOWN from single row of Pokemon > Go to filters
              this.filterBarCursor = this.filterBar.getNearestFilter(this.filteredStarterContainers[this.cursor]);
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
              // LEFT from filtered Pokemon, on the left edge

              if (this.starterSpecies.length === 0) {
                // no starter in team > wrap around to the last column
                success = this.setCursor(this.cursor + Math.min(8, numberOfStarters - this.cursor));

              } else if (onScreenCurrentRow < 7) {
                // at least one pokemon in team > for the first 7 rows, go to closest starter
                this.cursorObj.setVisible(false);
                this.starterIconsCursorIndex = findClosestStarterIndex(this.cursorObj.y - 1, this.starterSpecies.length);
                this.moveStarterIconsCursor(this.starterIconsCursorIndex);

              } else {
                // at least one pokemon in team > from the bottom 2 rows, go to start run button
                this.cursorObj.setVisible(false);
                this.setSpecies(null);
                this.startCursorObj.setVisible(true);
              }
              success = true;
            }
          } else if (numberOfStarters > 0) {
            // LEFT from team > Go to closest filtered Pokemon
            const closestRowIndex = findClosestStarterRow(this.starterIconsCursorIndex, onScreenNumberOfRows);
            this.starterIconsCursorObj.setVisible(false);
            this.cursorObj.setVisible(true);
            this.setCursor(Math.min(onScreenFirstIndex + closestRowIndex * 9 + 8, onScreenLastIndex));
            success = true;
          } else {
            // LEFT from team and no Pokemon in filter > do nothing
            success = false;
          }
          break;
        case Button.RIGHT:
          if (!this.starterIconsCursorObj.visible) {
            // is not right edge
            if (this.cursor % 9 < (currentRow < numOfRows - 1 ? 8 : (numberOfStarters - 1) % 9)) {
              success = this.setCursor(this.cursor + 1);
            } else {
              // RIGHT from filtered Pokemon, on the right edge
              if (this.starterSpecies.length === 0) {
                // no selected starter in team > wrap around to the first column
                success = this.setCursor(this.cursor - Math.min(8, this.cursor % 9));

              } else if (onScreenCurrentRow < 7) {
                // at least one pokemon in team > for the first 7 rows, go to closest starter
                this.cursorObj.setVisible(false);
                this.starterIconsCursorIndex = findClosestStarterIndex(this.cursorObj.y - 1, this.starterSpecies.length);
                this.moveStarterIconsCursor(this.starterIconsCursorIndex);

              } else {
                // at least one pokemon in team > from the bottom 2 rows, go to start run button
                this.cursorObj.setVisible(false);
                this.setSpecies(null);
                this.startCursorObj.setVisible(true);
              }
              success = true;
            }
          } else if (numberOfStarters > 0) {
            // RIGHT from team > Go to closest filtered Pokemon
            const closestRowIndex = findClosestStarterRow(this.starterIconsCursorIndex, onScreenNumberOfRows);
            this.starterIconsCursorObj.setVisible(false);
            this.cursorObj.setVisible(true);
            this.setCursor(Math.min(onScreenFirstIndex + closestRowIndex * 9, onScreenLastIndex - (onScreenLastIndex % 9)));
            success = true;
          } else {
            // RIGHT from team and no Pokemon in filter > do nothing
            success = false;
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

  addToParty(species: PokemonSpecies, dexAttr: bigint, abilityIndex: integer, nature: Nature, moveset: StarterMoveset) {
    const props = this.scene.gameData.getSpeciesDexAttrProps(species, dexAttr);
    this.starterIcons[this.starterSpecies.length].setTexture(species.getIconAtlasKey(props.formIndex, props.shiny, props.variant));
    this.starterIcons[this.starterSpecies.length].setFrame(species.getIconId(props.female, props.formIndex, props.shiny, props.variant));
    this.checkIconId(this.starterIcons[this.starterSpecies.length], species, props.female, props.formIndex, props.shiny, props.variant);

    this.starterSpecies.push(species);
    this.starterAttr.push(dexAttr);
    this.starterAbilityIndexes.push(abilityIndex);
    this.starterNatures.push(nature);
    this.starterMovesets.push(moveset);
    if (this.speciesLoaded.get(species.speciesId)) {
      getPokemonSpeciesForm(species.speciesId, props.formIndex).cry(this.scene);
    }
    this.updateInstructions();
  }

  updatePartyIcon(species: PokemonSpecies, index: number) {
    const props = this.scene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId));
    this.starterIcons[index].setTexture(species.getIconAtlasKey(props.formIndex, props.shiny, props.variant));
    this.starterIcons[index].setFrame(species.getIconId(props.female, props.formIndex, props.shiny, props.variant));
    this.checkIconId(this.starterIcons[index], species, props.female, props.formIndex, props.shiny, props.variant);
  }

  switchMoveHandler(i: number, newMove: Moves, move: Moves) {
    const speciesId = this.lastSpecies.speciesId;
    const existingMoveIndex = this.starterMoveset?.indexOf(newMove)!; // TODO: is this bang correct?
    this.starterMoveset![i] = newMove; // TODO: is this bang correct?
    if (existingMoveIndex > -1) {
      this.starterMoveset![existingMoveIndex] = move; // TODO: is this bang correct?
    }
    const props: DexAttrProps = this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, this.dexAttrCursor);
    // species has different forms
    if (pokemonFormLevelMoves.hasOwnProperty(speciesId)) {
      // starterMoveData doesn't have base form moves or is using the single form format
      if (!this.scene.gameData.starterData[speciesId].moveset || Array.isArray(this.scene.gameData.starterData[speciesId].moveset)) {
        this.scene.gameData.starterData[speciesId].moveset = { [props.formIndex]: this.starterMoveset?.slice(0) as StarterMoveset };
      }
      const starterMoveData = this.scene.gameData.starterData[speciesId].moveset;

      // starterMoveData doesn't have active form moves
      if (!starterMoveData.hasOwnProperty(props.formIndex)) {
        this.scene.gameData.starterData[speciesId].moveset[props.formIndex] = this.starterMoveset?.slice(0) as StarterMoveset;
      }

      // does the species' starter move data have its form's starter moves and has it been updated
      if (starterMoveData.hasOwnProperty(props.formIndex)) {
        // active form move hasn't been updated
        if (starterMoveData[props.formIndex][existingMoveIndex] !== newMove) {
          this.scene.gameData.starterData[speciesId].moveset[props.formIndex] = this.starterMoveset?.slice(0) as StarterMoveset;
        }
      }
    } else {
      this.scene.gameData.starterData[speciesId].moveset = this.starterMoveset?.slice(0) as StarterMoveset;
    }
    this.setSpeciesDetails(this.lastSpecies, undefined, undefined, undefined, undefined, undefined, undefined, false);

    // switch moves of starter if exists
    if (this.starterMovesets.length) {
      Array.from({ length: this.starterSpecies.length }, (_, i) => {
        const starterSpecies = this.starterSpecies[i];
        if (starterSpecies.speciesId === speciesId) {
          this.starterMovesets[i] = this.starterMoveset!; // TODO: is this bang correct?
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
      case SettingKeyboard.Button_Stats:
        iconPath = "C.png";
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

  updateFilterButtonIcon(iconSetting, gamepadType, iconElement, controlLabel): void {
    let iconPath;
    // touch controls cannot be rebound as is, and are just emulating a keyboard event.
    // Additionally, since keyboard controls can be rebound (and will be displayed when they are), we need to have special handling for the touch controls
    if (gamepadType === "touch") {
      gamepadType = "keyboard";
      iconPath = "C.png";
    } else {
      iconPath = this.scene.inputController?.getIconForLatestInputRecorded(iconSetting);
    }
    iconElement.setTexture(gamepadType, iconPath);
    iconElement.setPosition(this.filterInstructionRowX, this.filterInstructionRowY);
    controlLabel.setPosition(this.filterInstructionRowX + this.instructionRowTextOffset, this.filterInstructionRowY);
    iconElement.setVisible(true);
    controlLabel.setVisible(true);
    this.filterInstructionsContainer.add([iconElement, controlLabel]);
    this.filterInstructionRowY += 8;
    if (this.filterInstructionRowY >= 24) {
      this.filterInstructionRowY = 0;
      this.filterInstructionRowX += 50;
    }
  }
  updateInstructions(): void {
    this.instructionRowX = 0;
    this.instructionRowY = 0;
    this.filterInstructionRowX = 0;
    this.filterInstructionRowY = 0;
    this.hideInstructions();
    this.instructionsContainer.removeAll();
    this.filterInstructionsContainer.removeAll();
    let gamepadType;
    if (this.scene.inputMethod === "gamepad") {
      gamepadType = this.scene.inputController.getConfig(this.scene.inputController.selectedDevice[Device.GAMEPAD]).padType;
    } else {
      gamepadType = this.scene.inputMethod;
    }

    if (!gamepadType) {
      return;
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

    // if filter mode is inactivated and gamepadType is not undefined, update the button icons
    if (!this.filterMode) {
      this.updateFilterButtonIcon(SettingKeyboard.Button_Stats, gamepadType, this.goFilterIconElement, this.goFilterLabel);
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
    this.validStarterContainers = [];

    this.pokerusCursorObjs.forEach(cursor => cursor.setVisible(false));
    this.starterCursorObjs.forEach(cursor => cursor.setVisible(false));

    this.filterBar.updateFilterLabels();

    // pre filter for challenges
    if (this.scene.gameMode.modeId === GameModes.CHALLENGE) {
      this.starterContainers.forEach(container => {
        const species = container.species;
        let allFormsValid = false;
        if (species.forms?.length > 0) {
          for (let i = 0; i < species.forms.length; i++) {
            /* Here we are making a fake form index dex props for challenges
              * Since some pokemon rely on forms to be valid (i.e. blaze tauros for fire challenges), we make a fake form and dex props to use in the challenge
              */
            const tempFormProps = BigInt(Math.pow(2, i)) * DexAttr.DEFAULT_FORM;
            const isValidForChallenge = new Utils.BooleanHolder(true);
            Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, container.species, isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(species, tempFormProps), true);
            allFormsValid = allFormsValid || isValidForChallenge.value;
          }
        } else {
          const isValidForChallenge = new Utils.BooleanHolder(true);
          Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, container.species, isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(species, this.scene.gameData.getSpeciesDefaultDexAttr(container.species, false, true)), true);
          allFormsValid = isValidForChallenge.value;
        }
        if (allFormsValid) {
          this.validStarterContainers.push(container);
        } else {
          container.setVisible(false);
        }
      });
    } else {
      this.validStarterContainers = this.starterContainers;
    }

    // this updates icons for previously saved pokemon
    for (let i = 0; i < this.validStarterContainers.length; i++) {
      const currentFilteredContainer = this.validStarterContainers[i];
      const starterSprite = currentFilteredContainer.icon as Phaser.GameObjects.Sprite;

      const currentDexAttr = this.getCurrentDexProps(currentFilteredContainer.species.speciesId);
      const props = this.scene.gameData.getSpeciesDexAttrProps(currentFilteredContainer.species, currentDexAttr);

      starterSprite.setTexture(currentFilteredContainer.species.getIconAtlasKey(props.formIndex, props.shiny, props.variant), currentFilteredContainer.species.getIconId(props.female!, props.formIndex, props.shiny, props.variant));
      currentFilteredContainer.checkIconId(props.female, props.formIndex, props.shiny, props.variant);
    }

    // filter
    this.validStarterContainers.forEach(container => {
      container.setVisible(false);

      container.cost = this.scene.gameData.getSpeciesStarterValue(container.species.speciesId);

      // First, ensure you have the caught attributes for the species else default to bigint 0
      const caughtAttr = this.scene.gameData.dexData[container.species.speciesId]?.caughtAttr || BigInt(0);
      const starterData = this.scene.gameData.starterData[container.species.speciesId];
      const isStarterProgressable = speciesEggMoves.hasOwnProperty(container.species.speciesId);

      // Gen filter
      const fitsGen =   this.filterBar.getVals(DropDownColumn.GEN).includes(container.species.generation);

      // Type filter
      const fitsType =  this.filterBar.getVals(DropDownColumn.TYPES).some(type => container.species.isOfType((type as number) - 1));

      // Caught / Shiny filter
      const isNonShinyCaught = !!(caughtAttr & DexAttr.NON_SHINY);
      const isShinyCaught = !!(caughtAttr & DexAttr.SHINY);
      const isVariant1Caught = isShinyCaught && !!(caughtAttr & DexAttr.DEFAULT_VARIANT);
      const isVariant2Caught = isShinyCaught && !!(caughtAttr & DexAttr.VARIANT_2);
      const isVariant3Caught = isShinyCaught && !!(caughtAttr & DexAttr.VARIANT_3);
      const isUncaught = !isNonShinyCaught && !isVariant1Caught && !isVariant2Caught && !isVariant3Caught;
      const fitsCaught = this.filterBar.getVals(DropDownColumn.CAUGHT).some(caught => {
        if (caught === "SHINY3") {
          return isVariant3Caught;
        } else if (caught === "SHINY2") {
          return isVariant2Caught && !isVariant3Caught;
        } else if (caught === "SHINY") {
          return isVariant1Caught && !isVariant2Caught && !isVariant3Caught;
        } else if (caught === "NORMAL") {
          return isNonShinyCaught && !isVariant1Caught && !isVariant2Caught && !isVariant3Caught;
        } else if (caught === "UNCAUGHT") {
          return isUncaught;
        }
      });

      // Passive Filter
      const isPassiveUnlocked = starterData.passiveAttr > 0;
      const isPassiveUnlockable = this.isPassiveAvailable(container.species.speciesId) && !isPassiveUnlocked;
      const fitsPassive = this.filterBar.getVals(DropDownColumn.UNLOCKS).some(unlocks => {
        if (unlocks.val === "PASSIVE" && unlocks.state === DropDownState.ON) {
          return isPassiveUnlocked;
        } else if (unlocks.val === "PASSIVE" && unlocks.state === DropDownState.EXCLUDE) {
          return isStarterProgressable && !isPassiveUnlocked;
        } else if (unlocks.val === "PASSIVE" && unlocks.state === DropDownState.UNLOCKABLE) {
          return isPassiveUnlockable;
        } else if (unlocks.val === "PASSIVE" && unlocks.state === DropDownState.OFF) {
          return true;
        }
      });

      // Cost Reduction Filter
      const isCostReduced = starterData.valueReduction > 0;
      const isCostReductionUnlockable = this.isValueReductionAvailable(container.species.speciesId);
      const fitsCostReduction = this.filterBar.getVals(DropDownColumn.UNLOCKS).some(unlocks => {
        if (unlocks.val === "COST_REDUCTION" && unlocks.state === DropDownState.ON) {
          return isCostReduced;
        } else if (unlocks.val === "COST_REDUCTION" && unlocks.state === DropDownState.EXCLUDE) {
          return isStarterProgressable && !isCostReduced;
        } else if (unlocks.val === "COST_REDUCTION" && unlocks.state === DropDownState.UNLOCKABLE) {
          return isCostReductionUnlockable;
        } else if (unlocks.val === "COST_REDUCTION" && unlocks.state === DropDownState.OFF) {
          return true;
        }
      });

      // Favorite Filter
      const isFavorite = this.starterPreferences[container.species.speciesId]?.favorite ?? false;
      const fitsFavorite = this.filterBar.getVals(DropDownColumn.MISC).some(misc => {
        if (misc.val === "FAVORITE" && misc.state === DropDownState.ON) {
          return isFavorite;
        }
        if (misc.val === "FAVORITE" && misc.state === DropDownState.EXCLUDE) {
          return !isFavorite;
        }
        if (misc.val === "FAVORITE" && misc.state === DropDownState.OFF) {
          return true;
        }
      });

      // Ribbon / Classic Win Filter
      const hasWon = starterData.classicWinCount > 0;
      const hasNotWon = starterData.classicWinCount === 0;
      const isUndefined = starterData.classicWinCount === undefined;
      const fitsWin = this.filterBar.getVals(DropDownColumn.MISC).some(misc => {
        if (misc.val === "WIN" && misc.state === DropDownState.ON) {
          return hasWon;
        } else if (misc.val === "WIN" && misc.state === DropDownState.EXCLUDE) {
          return hasNotWon || isUndefined;
        } else if (misc.val === "WIN" && misc.state === DropDownState.OFF) {
          return true;
        }
      });

      // HA Filter
      const speciesHasHiddenAbility = container.species.abilityHidden !== container.species.ability1 && container.species.abilityHidden !== Abilities.NONE;
      const hasHA = starterData.abilityAttr & AbilityAttr.ABILITY_HIDDEN;
      const fitsHA = this.filterBar.getVals(DropDownColumn.MISC).some(misc => {
        if (misc.val === "HIDDEN_ABILITY" && misc.state === DropDownState.ON) {
          return hasHA;
        } else if (misc.val === "HIDDEN_ABILITY" && misc.state === DropDownState.EXCLUDE) {
          return speciesHasHiddenAbility && !hasHA;
        } else if (misc.val === "HIDDEN_ABILITY" && misc.state === DropDownState.OFF) {
          return true;
        }
      });

      // Egg Purchasable Filter
      const isEggPurchasable = this.isSameSpeciesEggAvailable(container.species.speciesId);
      const fitsEgg = this.filterBar.getVals(DropDownColumn.MISC).some(misc => {
        if (misc.val === "EGG" && misc.state === DropDownState.ON) {
          return isEggPurchasable;
        } else if (misc.val === "EGG" && misc.state === DropDownState.EXCLUDE) {
          return isStarterProgressable && !isEggPurchasable;
        } else if (misc.val === "EGG" && misc.state === DropDownState.OFF) {
          return true;
        }
      });

      // Pokerus Filter
      const fitsPokerus = this.filterBar.getVals(DropDownColumn.MISC).some(misc => {
        if (misc.val === "POKERUS" && misc.state === DropDownState.ON) {
          return this.pokerusSpecies.includes(container.species);
        } else if (misc.val === "POKERUS" && misc.state === DropDownState.EXCLUDE) {
          return !this.pokerusSpecies.includes(container.species);
        } else if (misc.val === "POKERUS" && misc.state === DropDownState.OFF) {
          return true;
        }
      });

      if (fitsGen && fitsType && fitsCaught && fitsPassive && fitsCostReduction && fitsFavorite && fitsWin && fitsHA && fitsEgg && fitsPokerus) {
        this.filteredStarterContainers.push(container);
      }
    });

    this.starterSelectScrollBar.setPages(Math.max(Math.ceil(this.filteredStarterContainers.length / 9), 1));
    this.starterSelectScrollBar.setPage(0);

    // sort
    const sort = this.filterBar.getVals(DropDownColumn.SORT)[0];
    this.filteredStarterContainers.sort((a, b) => {
      switch (sort.val) {
      default:
        break;
      case SortCriteria.NUMBER:
        return (a.species.speciesId - b.species.speciesId) * -sort.dir;
      case SortCriteria.COST:
        return (a.cost - b.cost) * -sort.dir;
      case SortCriteria.CANDY:
        const candyCountA = this.scene.gameData.starterData[a.species.speciesId].candyCount;
        const candyCountB = this.scene.gameData.starterData[b.species.speciesId].candyCount;
        return (candyCountA - candyCountB) * -sort.dir;
      case SortCriteria.IV:
        const avgIVsA = this.scene.gameData.dexData[a.species.speciesId].ivs.reduce((a, b) => a + b, 0) / this.scene.gameData.dexData[a.species.speciesId].ivs.length;
        const avgIVsB = this.scene.gameData.dexData[b.species.speciesId].ivs.reduce((a, b) => a + b, 0) / this.scene.gameData.dexData[b.species.speciesId].ivs.length;
        return (avgIVsA - avgIVsB) * -sort.dir;
      case SortCriteria.NAME:
        return a.species.name.localeCompare(b.species.name) * -sort.dir;
      }
      return 0;
    });

    this.updateScroll();
  };

  updateScroll = () => {
    const maxColumns = 9;
    const maxRows = 9;
    const onScreenFirstIndex = this.scrollCursor * maxColumns;
    const onScreenLastIndex = Math.min(this.filteredStarterContainers.length - 1, onScreenFirstIndex + maxRows * maxColumns -1);

    this.starterSelectScrollBar.setPage(this.scrollCursor);

    let pokerusCursorIndex = 0;
    this.filteredStarterContainers.forEach((container, i) => {
      const pos = calcStarterPosition(i, this.scrollCursor);
      container.setPosition(pos.x, pos.y);
      if (i < onScreenFirstIndex || i > onScreenLastIndex) {
        container.setVisible(false);

        if (this.pokerusSpecies.includes(container.species)) {
          this.pokerusCursorObjs[pokerusCursorIndex].setPosition(pos.x - 1, pos.y + 1);
          this.pokerusCursorObjs[pokerusCursorIndex].setVisible(false);
          pokerusCursorIndex++;
        }

        if (this.starterSpecies.includes(container.species)) {
          this.starterCursorObjs[this.starterSpecies.indexOf(container.species)].setPosition(pos.x - 1, pos.y + 1);
          this.starterCursorObjs[this.starterSpecies.indexOf(container.species)].setVisible(false);
        }
        return;
      } else {
        container.setVisible(true);

        if (this.pokerusSpecies.includes(container.species)) {
          this.pokerusCursorObjs[pokerusCursorIndex].setPosition(pos.x - 1, pos.y + 1);
          this.pokerusCursorObjs[pokerusCursorIndex].setVisible(true);
          pokerusCursorIndex++;
        }

        if (this.starterSpecies.includes(container.species)) {
          this.starterCursorObjs[this.starterSpecies.indexOf(container.species)].setPosition(pos.x - 1, pos.y + 1);
          this.starterCursorObjs[this.starterSpecies.indexOf(container.species)].setVisible(true);
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
        container.favoriteIcon.setVisible(this.starterPreferences[speciesId]?.favorite ?? false);

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
      cursor = Math.max(Math.min(this.filteredStarterContainers.length - 1, cursor), 0);
      changed = super.setCursor(cursor);

      const pos = calcStarterPosition(cursor, this.scrollCursor);
      this.cursorObj.setPosition(pos.x - 1, pos.y + 1);

      const species = this.filteredStarterContainers[cursor]?.species;

      if (species) {
        const defaultDexAttr = this.getCurrentDexProps(species.speciesId);
        const defaultProps = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
        const variant = this.starterPreferences[species.speciesId]?.variant ? this.starterPreferences[species.speciesId].variant as Variant : defaultProps.variant;
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

  setFilterMode(filterMode: boolean): boolean {
    this.cursorObj.setVisible(!filterMode);
    this.filterBar.cursorObj.setVisible(filterMode);

    if (filterMode !== this.filterMode) {
      this.filterMode = filterMode;
      this.setCursor(filterMode ? this.filterBarCursor : this.cursor);
      if (filterMode) {
        this.setSpecies(null);
        this.updateInstructions();
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

  setSpecies(species: PokemonSpecies | null) {
    this.speciesStarterDexEntry = species ? this.scene.gameData.dexData[species.speciesId] : null;
    this.dexAttrCursor = species ? this.getCurrentDexProps(species.speciesId) : 0n;
    this.abilityCursor = species ? this.scene.gameData.getStarterSpeciesDefaultAbilityIndex(species) : 0;
    this.natureCursor = species ? this.scene.gameData.getSpeciesDefaultNature(species) : 0;

    const starterAttributes : StarterAttributes | null = species ? {...this.starterPreferences[species.speciesId]} : null;

    if (starterAttributes?.nature) {
      // load default nature from stater save data, if set
      this.natureCursor = starterAttributes.nature;
    }
    if (starterAttributes?.ability && !isNaN(starterAttributes.ability)) {
      // load default ability from stater save data, if set
      this.abilityCursor = starterAttributes.ability;
    }

    if (this.statsMode) {
      if (this.speciesStarterDexEntry?.caughtAttr) {
        this.statsContainer.setVisible(true);
        this.showStats();
      } else {
        this.statsContainer.setVisible(false);
        //@ts-ignore
        this.statsContainer.updateIvs(null); // TODO: resolve ts-ignore. what. how? huh?
      }
    }

    if (this.lastSpecies) {
      const dexAttr = this.getCurrentDexProps(this.lastSpecies.speciesId);
      const props = this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, dexAttr);
      const speciesIndex = this.allSpecies.indexOf(this.lastSpecies);
      const lastSpeciesIcon = this.starterContainers[speciesIndex].icon;
      this.checkIconId(lastSpeciesIcon, this.lastSpecies, props.female, props.formIndex, props.shiny, props.variant);
      this.iconAnimHandler.addOrUpdate(lastSpeciesIcon, PokemonIconAnimMode.NONE);

      // Resume the animation for the previously selected species
      const icon = this.starterContainers[speciesIndex].icon;
      this.scene.tweens.getTweensOf(icon).forEach(tween => tween.resume());
    }

    this.lastSpecies = species!; // TODO: is this bang correct?

    if (species && (this.speciesStarterDexEntry?.seenAttr || this.speciesStarterDexEntry?.caughtAttr)) {
      this.pokemonNumberText.setText(Utils.padInt(species.speciesId, 4));
      if (starterAttributes?.nickname) {
        const name = decodeURIComponent(escape(atob(starterAttributes.nickname)));
        this.pokemonNameText.setText(name);
      } else {
        this.pokemonNameText.setText(species.name);
      }

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
        if (species.speciesId === Species.MANAPHY || species.speciesId === Species.PHIONE) {
          this.pokemonHatchedIcon.setFrame("manaphy");
        } else {
          this.pokemonHatchedIcon.setFrame(getEggTierForSpecies(species));
        }
        this.pokemonHatchedCountText.setText(`${this.speciesStarterDexEntry.hatchedCount}`);

        const defaultDexAttr = this.getCurrentDexProps(species.speciesId);
        const defaultProps = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
        const variant = defaultProps.variant;
        const tint = getVariantTint(variant);
        this.pokemonShinyIcon.setFrame(getVariantIcon(variant));
        this.pokemonShinyIcon.setTint(tint);
        this.pokemonShinyIcon.setVisible(defaultProps.shiny);
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
            this.pokemonCandyDarknessOverlay.on("pointerover", () => (this.scene as BattleScene).ui.showTooltip("", `${currentFriendship}/${friendshipCap}`, true));
            this.pokemonCandyDarknessOverlay.on("pointerout", () => (this.scene as BattleScene).ui.hideTooltip());
          }

          this.pokemonCandyDarknessOverlay.setCrop(0, 0, 16, candyCropY);
        }


        // Pause the animation when the species is selected
        const speciesIndex = this.allSpecies.indexOf(species);
        const icon = this.starterContainers[speciesIndex].icon;

        if (this.isUpgradeAnimationEnabled()) {
          this.scene.tweens.getTweensOf(icon).forEach(tween => tween.pause());
          // Reset the position of the icon
          icon.x = -2;
          icon.y = 2;
        }

        // Initiates the small up and down idle animation
        this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.PASSIVE);

        const starterIndex = this.starterSpecies.indexOf(species);

        let props: DexAttrProps;

        if (starterIndex > -1) {
          props = this.scene.gameData.getSpeciesDexAttrProps(species, this.starterAttr[starterIndex]);
          this.setSpeciesDetails(species, props.shiny, props.formIndex, props.female, props.variant, this.starterAbilityIndexes[starterIndex], this.starterNatures[starterIndex]);
        } else {
          const defaultDexAttr = this.getCurrentDexProps(species.speciesId);
          const defaultAbilityIndex = starterAttributes?.ability ?? this.scene.gameData.getStarterSpeciesDefaultAbilityIndex(species);
          // load default nature from stater save data, if set
          const defaultNature = starterAttributes?.nature || this.scene.gameData.getSpeciesDefaultNature(species);
          props = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
          if (starterAttributes?.variant && !isNaN(starterAttributes.variant)) {
            if (props.shiny) {
              props.variant = starterAttributes.variant as Variant;
            }
          }
          props.formIndex = starterAttributes?.form ?? props.formIndex;
          props.female = starterAttributes?.female ?? props.female;

          this.setSpeciesDetails(species, props.shiny, props.formIndex, props.female, props.variant, defaultAbilityIndex, defaultNature);
        }

        const speciesForm = getPokemonSpeciesForm(species.speciesId, props.formIndex);
        this.setTypeIcons(speciesForm.type1, speciesForm!.type2!); // TODO: are those bangs correct?

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

      this.setSpeciesDetails(species!, false, 0, false, 0, 0, 0); // TODO: is this bang correct?
      this.pokemonSprite.clearTint();
    }
  }



  setSpeciesDetails(species: PokemonSpecies, shiny?: boolean, formIndex?: integer, female?: boolean, variant?: Variant, abilityIndex?: integer, natureIndex?: integer, forSeen: boolean = false): void {
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
      this.dexAttrCursor |= (shiny !== undefined ? !shiny : !(shiny = oldProps?.shiny)) ? DexAttr.NON_SHINY : DexAttr.SHINY;
      this.dexAttrCursor |= (female !== undefined ? !female : !(female = oldProps?.female)) ? DexAttr.MALE : DexAttr.FEMALE;
      this.dexAttrCursor |= (variant !== undefined ? !variant : !(variant = oldProps?.variant)) ? DexAttr.DEFAULT_VARIANT : variant === 1 ? DexAttr.VARIANT_2 : DexAttr.VARIANT_3;
      this.dexAttrCursor |= this.scene.gameData.getFormAttr(formIndex !== undefined ? formIndex : (formIndex = oldProps!.formIndex)); // TODO: is this bang correct?
      this.abilityCursor = abilityIndex !== undefined ? abilityIndex : (abilityIndex = oldAbilityIndex);
      this.natureCursor = natureIndex !== undefined ? natureIndex : (natureIndex = oldNatureIndex);
      const [isInParty, partyIndex]: [boolean, number] = this.isInParty(species); // we use this to firstly check if the pokemon is in the party, and if so, to get the party index in order to update the icon image
      if (isInParty) {
        this.updatePartyIcon(species, partyIndex);
      }
    }

    this.pokemonSprite.setVisible(false);
    this.pokemonPassiveLabelText.setVisible(false);
    this.pokemonPassiveText.setVisible(false);
    this.pokemonPassiveDisabledIcon.setVisible(false);
    this.pokemonPassiveLockedIcon.setVisible(false);

    if (this.assetLoadCancelled) {
      this.assetLoadCancelled.value = true;
      this.assetLoadCancelled = null;
    }

    this.starterMoveset = null;
    this.speciesStarterMoves = [];

    if (species) {
      const dexEntry = this.scene.gameData.dexData[species.speciesId];
      const abilityAttr = this.scene.gameData.starterData[species.speciesId].abilityAttr;

      const caughtAttr = this.scene.gameData.dexData[species.speciesId]?.caughtAttr || BigInt(0);

      if (!dexEntry.caughtAttr) {
        const props = this.scene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId));
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

      this.shinyOverlay.setVisible(shiny ?? false); // TODO: is false the correct default?
      this.pokemonNumberText.setColor(this.getTextColor(shiny ? TextStyle.SUMMARY_GOLD : TextStyle.SUMMARY, false));
      this.pokemonNumberText.setShadowColor(this.getTextColor(shiny ? TextStyle.SUMMARY_GOLD : TextStyle.SUMMARY, true));

      if (forSeen ? this.speciesStarterDexEntry?.seenAttr : this.speciesStarterDexEntry?.caughtAttr) {
        const starterIndex = this.starterSpecies.indexOf(species);

        if (starterIndex > -1) {
          this.starterAttr[starterIndex] = this.dexAttrCursor;
          this.starterAbilityIndexes[starterIndex] = this.abilityCursor;
          this.starterNatures[starterIndex] = this.natureCursor;
        }

        const assetLoadCancelled = new Utils.BooleanHolder(false);
        this.assetLoadCancelled = assetLoadCancelled;

        species.loadAssets(this.scene, female!, formIndex, shiny, variant, true).then(() => { // TODO: is this bang correct?
          if (assetLoadCancelled.value) {
            return;
          }
          this.assetLoadCancelled = null;
          this.speciesLoaded.set(species.speciesId, true);
          this.pokemonSprite.play(species.getSpriteKey(female!, formIndex, shiny, variant)); // TODO: is this bang correct?
          this.pokemonSprite.setPipelineData("shiny", shiny);
          this.pokemonSprite.setPipelineData("variant", variant);
          this.pokemonSprite.setPipelineData("spriteKey", species.getSpriteKey(female!, formIndex, shiny, variant)); // TODO: is this bang correct?
          this.pokemonSprite.setVisible(!this.statsMode);
        });


        const isValidForChallenge = new Utils.BooleanHolder(true);
        Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, species, isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(species, this.dexAttrCursor), !!this.starterSpecies.length);
        const currentFilteredContainer = this.filteredStarterContainers.find(p => p.species.speciesId === species.speciesId);
        if (currentFilteredContainer) {
          const starterSprite = currentFilteredContainer.icon as Phaser.GameObjects.Sprite;
          starterSprite.setTexture(species.getIconAtlasKey(formIndex, shiny, variant), species.getIconId(female!, formIndex, shiny, variant));
          currentFilteredContainer.checkIconId(female, formIndex, shiny, variant);
        }

        const isNonShinyCaught = !!(caughtAttr & DexAttr.NON_SHINY);
        const isShinyCaught = !!(caughtAttr & DexAttr.SHINY);
        const isVariant1Caught = isShinyCaught && !!(caughtAttr & DexAttr.DEFAULT_VARIANT);
        const isVariant2Caught = isShinyCaught && !!(caughtAttr & DexAttr.VARIANT_2);
        const isVariant3Caught = isShinyCaught && !!(caughtAttr & DexAttr.VARIANT_3);

        this.canCycleShiny = isNonShinyCaught && isShinyCaught;
        this.canCycleVariant = !!shiny && [ isVariant1Caught, isVariant2Caught, isVariant3Caught].filter(v => v).length > 1;

        const isMaleCaught = !!(caughtAttr & DexAttr.MALE);
        const isFemaleCaught = !!(caughtAttr & DexAttr.FEMALE);
        this.canCycleGender = isMaleCaught && isFemaleCaught;

        const hasAbility1 = abilityAttr & AbilityAttr.ABILITY_1;
        let hasAbility2 = abilityAttr & AbilityAttr.ABILITY_2;
        const hasHiddenAbility = abilityAttr & AbilityAttr.ABILITY_HIDDEN;

        /*
         * Check for Pokemon with a single ability (at some point it was possible to catch them with their ability 2 attribute)
         * This prevents cycling between ability 1 and 2 if they are both unlocked and the same
         * but we still need to account for the possibility ability 1 was never unlocked and fallback on ability 2 in this case
         */
        if (hasAbility1 && hasAbility2 && species.ability1 === species.ability2) {
          hasAbility2 = 0;
        }

        this.canCycleAbility = [ hasAbility1, hasAbility2, hasHiddenAbility ].filter(a => a).length > 1;

        this.canCycleForm = species.forms.filter(f => f.isStarterSelectable || !pokemonFormChanges[species.speciesId]?.find(fc => fc.formKey))
          .map((_, f) => dexEntry.caughtAttr & this.scene.gameData.getFormAttr(f)).filter(f => f).length > 1;
        this.canCycleNature = this.scene.gameData.getNaturesForAttr(dexEntry.natureAttr).length > 1;

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
        const ability = this.lastSpecies.getAbility(abilityIndex!); // TODO: is this bang correct?
        this.pokemonAbilityText.setText(allAbilities[ability].name);

        const isHidden = abilityIndex === (this.lastSpecies.ability2 ? 2 : 1);
        this.pokemonAbilityText.setColor(this.getTextColor(!isHidden ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GOLD));
        this.pokemonAbilityText.setShadowColor(this.getTextColor(!isHidden ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GOLD, true));

        const passiveAttr = this.scene.gameData.starterData[species.speciesId].passiveAttr;
        const passiveAbility = allAbilities[starterPassiveAbilities[this.lastSpecies.speciesId]];

        if (passiveAbility) {
          const isUnlocked = !!(passiveAttr & PassiveAttr.UNLOCKED);
          const isEnabled = !!(passiveAttr & PassiveAttr.ENABLED);

          const textStyle = isUnlocked && isEnabled ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GRAY;
          const textAlpha = isUnlocked && isEnabled ? 1 : 0.5;

          this.pokemonPassiveLabelText.setVisible(true);
          this.pokemonPassiveLabelText.setColor(this.getTextColor(TextStyle.SUMMARY_ALT));
          this.pokemonPassiveLabelText.setShadowColor(this.getTextColor(TextStyle.SUMMARY_ALT, true));
          this.pokemonPassiveText.setVisible(true);
          this.pokemonPassiveText.setText(passiveAbility.name);
          this.pokemonPassiveText.setColor(this.getTextColor(textStyle));
          this.pokemonPassiveText.setAlpha(textAlpha);
          this.pokemonPassiveText.setShadowColor(this.getTextColor(textStyle, true));

          const iconPosition = {
            x: this.pokemonPassiveText.x + this.pokemonPassiveText.displayWidth + 1,
            y: this.pokemonPassiveText.y + this.pokemonPassiveText.displayHeight / 2
          };
          this.pokemonPassiveDisabledIcon.setVisible(isUnlocked && !isEnabled);
          this.pokemonPassiveDisabledIcon.setPosition(iconPosition.x, iconPosition.y);
          this.pokemonPassiveLockedIcon.setVisible(!isUnlocked);
          this.pokemonPassiveLockedIcon.setPosition(iconPosition.x, iconPosition.y);

        }

        this.pokemonNatureText.setText(getNatureName(natureIndex as unknown as Nature, true, true, false, this.scene.uiTheme));

        let levelMoves: LevelMoves;
        if (pokemonFormLevelMoves.hasOwnProperty(species.speciesId) && formIndex && pokemonFormLevelMoves[species.speciesId].hasOwnProperty(formIndex)) {
          levelMoves = pokemonFormLevelMoves[species.speciesId][formIndex];
        } else {
          levelMoves = pokemonSpeciesLevelMoves[species.speciesId];
        }
        this.speciesStarterMoves.push(...levelMoves.filter(lm => lm[0] > 0 && lm[0] <= 5).map(lm => lm[1]));
        if (speciesEggMoves.hasOwnProperty(species.speciesId)) {
          for (let em = 0; em < 4; em++) {
            if (this.scene.gameData.starterData[species.speciesId].eggMoves & (1 << em)) {
              this.speciesStarterMoves.push(speciesEggMoves[species.speciesId][em]);
            }
          }
        }

        const speciesMoveData = this.scene.gameData.starterData[species.speciesId].moveset;
        const moveData: StarterMoveset | null = speciesMoveData
          ? Array.isArray(speciesMoveData)
            ? speciesMoveData
            : speciesMoveData[formIndex!] // TODO: is this bang correct?
          : null;
        const availableStarterMoves = this.speciesStarterMoves.concat(speciesEggMoves.hasOwnProperty(species.speciesId) ? speciesEggMoves[species.speciesId].filter((_, em: integer) => this.scene.gameData.starterData[species.speciesId].eggMoves & (1 << em)) : []);
        this.starterMoveset = (moveData || (this.speciesStarterMoves.slice(0, 4) as StarterMoveset)).filter(m => availableStarterMoves.find(sm => sm === m)) as StarterMoveset;
        // Consolidate move data if it contains an incompatible move
        if (this.starterMoveset.length < 4 && this.starterMoveset.length < availableStarterMoves.length) {
          this.starterMoveset.push(...availableStarterMoves.filter(sm => this.starterMoveset?.indexOf(sm) === -1).slice(0, 4 - this.starterMoveset.length));
        }

        // Remove duplicate moves
        this.starterMoveset = this.starterMoveset.filter(
          (move, i) => {
            return this.starterMoveset?.indexOf(move) === i;
          }) as StarterMoveset;

        const speciesForm = getPokemonSpeciesForm(species.speciesId, formIndex!); // TODO: is the bang correct?
        const formText = Utils.capitalizeString(species?.forms[formIndex!]?.formKey, "-", false, false); // TODO: is the bang correct?

        const speciesName = Utils.capitalizeString(Species[species.speciesId], "_", true, false);

        if (species.speciesId === Species.ARCEUS) {
          this.pokemonFormText.setText(i18next.t(`pokemonInfo:Type.${formText?.toUpperCase()}`));
        } else {
          this.pokemonFormText.setText(formText ? i18next.t(`pokemonForm:${speciesName}${formText}`) : "");
        }

        this.setTypeIcons(speciesForm.type1, speciesForm.type2!); // TODO: is this bang correct?
      } else {
        this.pokemonAbilityText.setText("");
        this.pokemonPassiveText.setText("");
        this.pokemonNatureText.setText("");
        // @ts-ignore
        this.setTypeIcons(null, null); // TODO: resolve ts-ignore.. huh!?
      }
    } else {
      this.shinyOverlay.setVisible(false);
      this.pokemonNumberText.setColor(this.getTextColor(TextStyle.SUMMARY));
      this.pokemonNumberText.setShadowColor(this.getTextColor(TextStyle.SUMMARY, true));
      this.pokemonGenderText.setText("");
      this.pokemonAbilityText.setText("");
      this.pokemonPassiveText.setText("");
      this.pokemonNatureText.setText("");
      // @ts-ignore
      this.setTypeIcons(null, null); // TODO: resolve ts-ignore.. huh!?
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
      const eggMoveUnlocked = eggMove && this.scene.gameData.starterData[species.speciesId].eggMoves & (1 << em);
      this.pokemonEggMoveBgs[em].setFrame(Type[eggMove ? eggMove.type : Type.UNKNOWN].toString().toLowerCase());
      this.pokemonEggMoveLabels[em].setText(eggMove && eggMoveUnlocked ? eggMove.name : "???");
    }

    this.pokemonEggMovesContainer.setVisible(!!this.speciesStarterDexEntry?.caughtAttr && hasEggMoves);

    this.pokemonAdditionalMoveCountLabel.setText(`(+${Math.max(this.speciesStarterMoves.length - 4, 0)})`);
    this.pokemonAdditionalMoveCountLabel.setVisible(this.speciesStarterMoves.length > 4);

    this.tryUpdateValue();

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
      const currentDexAttr = this.getCurrentDexProps(species.speciesId);
      const props = this.scene.gameData.getSpeciesDexAttrProps(species, currentDexAttr);
      this.starterIcons[s].setTexture(species.getIconAtlasKey(props.formIndex, props.shiny, props.variant));
      this.starterIcons[s].setFrame(species.getIconId(props.female, props.formIndex, props.shiny, props.variant));
      this.checkIconId(this.starterIcons[s], species, props.female, props.formIndex, props.shiny, props.variant);
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
          // No more Pokemon selected, go back to filters
          this.starterIconsCursorObj.setVisible(false);
          this.setSpecies(null);
          this.filterBarCursor = Math.max(1, this.filterBar.numFilters - 1);
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
      Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, species, isNewPokemonValid, this.scene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId)), false);
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
      const speciesSprite = this.starterContainers[s].icon;

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
      Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, this.allSpecies[s], isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(this.allSpecies[s], this.getCurrentDexProps(this.allSpecies[s].speciesId)), isPartyValid);

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

  tryExit(): boolean {
    this.blockInput = true;
    const ui = this.getUi();

    const cancel = () => {
      ui.setMode(Mode.STARTER_SELECT);
      this.clearText();
      this.blockInput = false;
    };
    ui.showText(i18next.t("starterSelectUiHandler:confirmExit"), null, () => {
      ui.setModeWithoutClear(Mode.CONFIRM, () => {
        ui.setMode(Mode.STARTER_SELECT);
        this.scene.clearPhaseQueue();
        if (this.scene.gameMode.isChallenge) {
          this.scene.pushPhase(new SelectChallengePhase(this.scene));
        } else {
          this.scene.pushPhase(new TitlePhase(this.scene));
        }
        this.clearText();
        this.scene.getCurrentPhase()?.end();
      }, cancel, null, null, 19);
    });

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
            originalStarterSelectCallback && originalStarterSelectCallback(new Array(this.starterSpecies.length).fill(0).map(function (_, i) {
              const starterSpecies = thisObj.starterSpecies[i];
              return {
                species: starterSpecies,
                dexAttr: thisObj.starterAttr[i],
                abilityIndex: thisObj.starterAbilityIndexes[i],
                passive: !(thisObj.scene.gameData.starterData[starterSpecies.speciesId].passiveAttr ^ (PassiveAttr.ENABLED | PassiveAttr.UNLOCKED)),
                nature: thisObj.starterNatures[i] as Nature,
                moveset: thisObj.starterMovesets[i],
                pokerus: thisObj.pokerusSpecies.includes(starterSpecies),
                nickname: thisObj.starterPreferences[starterSpecies.speciesId]?.nickname,
              };
            }));
          };
          startRun();
        }, cancel, null, null, 19);
      });
    } else {
      const handler = this.scene.ui.getHandler() as AwaitableUiHandler;
      handler.tutorialActive = true;
      this.scene.ui.showText(i18next.t("starterSelectUiHandler:invalidParty"), null, () => this.scene.ui.showText("", 0, () => handler.tutorialActive = false), null, true);
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
      Challenge.applyChallenges(this.scene.gameMode, Challenge.ChallengeType.STARTER_CHOICE, species, isValidForChallenge, this.scene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId)), false);
      canStart = canStart || isValidForChallenge.value;
    }
    return canStart;
  }

  /**
   * Creates a temporary dex attr props that will be used to check whether a pokemon is valid for a challenge
   * and to display the correct shiny, variant, and form based on the StarterPreferences
   *
   * @param speciesId the id of the species to get props for
   * @returns the dex props
   */
  getCurrentDexProps(speciesId: number): bigint {
    let props = 0n;
    const caughtAttr = this.scene.gameData.dexData[speciesId].caughtAttr;

    /*  this checks the gender of the pokemon; this works by checking a) that the starter preferences for the species exist, and if so, is it female. If so, it'll add DexAttr.FEMALE to our temp props
     *  It then checks b) if the caughtAttr for the pokemon is female and NOT male - this means that the ONLY gender we've gotten is female, and we need to add DexAttr.FEMALE to our temp props
     *  If neither of these pass, we add DexAttr.MALE to our temp props
     */
    if (this.starterPreferences[speciesId]?.female || ((caughtAttr & DexAttr.FEMALE) > 0n && (caughtAttr & DexAttr.MALE) === 0n)) {
      props += DexAttr.FEMALE;
    } else {
      props += DexAttr.MALE;
    }
    /* This part is very similar to above, but instead of for gender, it checks for shiny within starter preferences.
     * If they're not there, it enables shiny state by default if any shiny was caught
     */
    if (this.starterPreferences[speciesId]?.shiny || ((caughtAttr & DexAttr.SHINY) > 0n && this.starterPreferences[speciesId]?.shiny !== false)) {
      props += DexAttr.SHINY;
      if (this.starterPreferences[speciesId]?.variant !== undefined) {
        props += BigInt(Math.pow(2, this.starterPreferences[speciesId]?.variant)) * DexAttr.DEFAULT_VARIANT;
      } else {
        /*  This calculates the correct variant if there's no starter preferences for it.
         *  This gets the highest tier variant that you've caught and adds it to the temp props
         */
        if ((caughtAttr & DexAttr.VARIANT_3) > 0) {
          props += DexAttr.VARIANT_3;
        } else if ((caughtAttr & DexAttr.VARIANT_2) > 0) {
          props += DexAttr.VARIANT_2;
        } else {
          props += DexAttr.DEFAULT_VARIANT;
        }
      }
    } else {
      props += DexAttr.NON_SHINY;
      props += DexAttr.DEFAULT_VARIANT; // we add the default variant here because non shiny versions are listed as default variant
    }
    if (this.starterPreferences[speciesId]?.form) { // this checks for the form of the pokemon
      props += BigInt(Math.pow(2, this.starterPreferences[speciesId]?.form)) * DexAttr.DEFAULT_FORM;
    } else {
      // Get the first unlocked form
      props += this.scene.gameData.getFormAttr(this.scene.gameData.getFormIndex(caughtAttr));
    }

    return props;
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
      //@ts-ignore
      this.statsContainer.updateIvs(null); // TODO: resolve ts-ignore. !?!?
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
    this.goFilterIconElement.setVisible(false);
    this.goFilterLabel.setVisible(false);
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

  checkIconId(icon: Phaser.GameObjects.Sprite, species: PokemonSpecies, female: boolean, formIndex: number, shiny: boolean, variant: number) {
    if (icon.frame.name !== species.getIconId(female, formIndex, shiny, variant)) {
      console.log(`${species.name}'s icon ${icon.frame.name} does not match getIconId with female: ${female}, formIndex: ${formIndex}, shiny: ${shiny}, variant: ${variant}`);
      icon.setTexture(species.getIconAtlasKey(formIndex, false, variant));
      icon.setFrame(species.getIconId(female, formIndex, false, variant));
    }
  }
}
