import type { Ability } from "#abilities/ability";
import { PLAYER_PARTY_MAX_SIZE, VALUE_REDUCTION_MAX } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { starterColors } from "#app/global-vars/starter-colors";
import Overrides from "#app/overrides";
import { handleTutorial, Tutorial } from "#app/tutorial";
import { speciesEggMoves } from "#balance/egg-moves";
import { pokemonPrevolutions } from "#balance/pokemon-evolutions";
import type { LevelMoves } from "#balance/pokemon-level-moves";
import { pokemonFormLevelMoves, pokemonSpeciesLevelMoves } from "#balance/pokemon-level-moves";
import {
  getPassiveCandyCount,
  getSameSpeciesEggCandyCounts,
  getStarterValueFriendshipCap,
  getValueReductionCandyCounts,
  POKERUS_STARTER_COUNT,
  speciesStarterCosts,
} from "#balance/starters";
import { allAbilities, allMoves, allSpecies } from "#data/data-lists";
import { Egg, getEggTierForSpecies } from "#data/egg";
import { GrowthRate, getGrowthRateColor } from "#data/exp";
import { Gender, getGenderColor, getGenderSymbol } from "#data/gender";
import { getNatureName } from "#data/nature";
import { pokemonFormChanges } from "#data/pokemon-forms";
import type { PokemonSpecies } from "#data/pokemon-species";
import { AbilityAttr } from "#enums/ability-attr";
import { AbilityId } from "#enums/ability-id";
import { Button } from "#enums/buttons";
import { ChallengeType } from "#enums/challenge-type";
import { Challenges } from "#enums/challenges";
import { Device } from "#enums/devices";
import { DexAttr } from "#enums/dex-attr";
import { DropDownColumn } from "#enums/drop-down-column";
import { EggSourceType } from "#enums/egg-source-types";
import { GameModes } from "#enums/game-modes";
import type { MoveId } from "#enums/move-id";
import type { Nature } from "#enums/nature";
import { Passive as PassiveAttr } from "#enums/passive";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import type { CandyUpgradeNotificationChangedEvent } from "#events/battle-scene";
import { BattleSceneEventType } from "#events/battle-scene";
import type { Variant } from "#sprites/variant";
import { getVariantIcon, getVariantTint } from "#sprites/variant";
import { achvs } from "#system/achv";
import type { DexAttrProps, StarterDataEntry, StarterMoveset, StarterPreferences } from "#system/game-data";
import { RibbonData } from "#system/ribbons/ribbon-data";
import { SettingKeyboard } from "#system/settings-keyboard";
import type { DexEntry } from "#types/dex-data";
import type { OptionSelectItem } from "#ui/abstract-option-select-ui-handler";
import { DropDown, DropDownLabel, DropDownOption, DropDownState, DropDownType, SortCriteria } from "#ui/dropdown";
import { FilterBar } from "#ui/filter-bar";
import { MessageUiHandler } from "#ui/message-ui-handler";
import { MoveInfoOverlay } from "#ui/move-info-overlay";
import { PokemonIconAnimHandler, PokemonIconAnimMode } from "#ui/pokemon-icon-anim-handler";
import { ScrollBar } from "#ui/scroll-bar";
import { StarterContainer } from "#ui/starter-container";
import { StatsContainer } from "#ui/stats-container";
import { addBBCodeTextObject, addTextObject } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import { applyChallenges, checkStarterValidForChallenge } from "#utils/challenge-utils";
import {
  BooleanHolder,
  fixedInt,
  getLocalizedSpriteKey,
  isNullOrUndefined,
  NumberHolder,
  padInt,
  randIntRange,
  rgbHexToRgba,
} from "#utils/common";
import type { AllStarterPreferences } from "#utils/data";
import { deepCopy, loadStarterPreferences, saveStarterPreferences } from "#utils/data";
import { getPokemonSpecies, getPokemonSpeciesForm, getPokerusStarters } from "#utils/pokemon-utils";
import { toCamelCase, toTitleCase } from "#utils/strings";
import { argbFromRgba } from "@material/material-color-utilities";
import i18next from "i18next";
import type { GameObjects } from "phaser";
import type BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import {
  isPassiveAvailable,
  isSameSpeciesEggAvailable,
  isStarterValidForChallenge,
  isValueReductionAvailable,
} from "./starter-select-ui-utils";

const COLUMNS = 9;
const ROWS = 9;

export type StarterSelectCallback = (starters: Starter[]) => void;

export interface Starter {
  species: PokemonSpecies;
  dexAttr: bigint;
  abilityIndex: number;
  passive: boolean;
  nature: Nature;
  moveset?: StarterMoveset;
  pokerus: boolean;
  nickname?: string;
  teraType?: PokemonType;
}

interface LanguageSetting {
  starterInfoTextSize: string;
  instructionTextSize: string;
  starterInfoXPos?: number;
  starterInfoYOffset?: number;
}

const languageSettings: { [key: string]: LanguageSetting } = {
  en: {
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
  de: {
    starterInfoTextSize: "54px",
    instructionTextSize: "35px",
    starterInfoXPos: 35,
  },
  "es-ES": {
    starterInfoTextSize: "50px",
    instructionTextSize: "38px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 38,
  },
  "es-MX": {
    starterInfoTextSize: "50px",
    instructionTextSize: "38px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 38,
  },
  fr: {
    starterInfoTextSize: "54px",
    instructionTextSize: "38px",
  },
  it: {
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
  "pt-BR": {
    starterInfoTextSize: "48px",
    instructionTextSize: "42px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 33,
  },
  zh: {
    starterInfoTextSize: "56px",
    instructionTextSize: "36px",
    starterInfoXPos: 26,
  },
  ko: {
    starterInfoTextSize: "60px",
    instructionTextSize: "38px",
    starterInfoYOffset: -0.5,
    starterInfoXPos: 30,
  },
  ja: {
    starterInfoTextSize: "48px",
    instructionTextSize: "40px",
    starterInfoYOffset: 1,
    starterInfoXPos: 32,
  },
  ca: {
    starterInfoTextSize: "48px",
    instructionTextSize: "38px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 29,
  },
  da: {
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
  tr: {
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
  ro: {
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
  ru: {
    starterInfoTextSize: "46px",
    instructionTextSize: "38px",
    starterInfoYOffset: 0.5,
    starterInfoXPos: 26,
  },
  tl: {
    starterInfoTextSize: "56px",
    instructionTextSize: "38px",
  },
};

// Position of UI elements
const filterBarHeight = 17;
const speciesContainerX = 109; // if team on the RIGHT: 109 / if on the LEFT: 143
const teamWindowX = 285; // if team on the RIGHT: 285 / if on the LEFT: 109
const teamWindowY = 38;
const teamWindowWidth = 34;
const teamWindowHeight = 107;
const randomSelectionWindowHeight = 20;

/**
 * Calculates the starter position for a Pokemon of a given UI index
 * @param index UI index to calculate the starter position of
 * @returns An interface with an x and y property
 */
function calcStarterContainerPosition(index: number): { x: number; y: number } {
  const yOffset = 13;
  const height = 17;
  const x = (index % 9) * 18;
  const y = yOffset + Math.floor(index / 9) * height;

  return { x: x, y: y };
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
function findClosestStarterIndex(y: number, teamSize = 6): number {
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

interface SpeciesDetails {
  shiny?: boolean;
  formIndex?: number;
  female?: boolean;
  variant?: Variant;
  abilityIndex?: number;
  natureIndex?: number;
  forSeen?: boolean; // default = false
  teraType?: PokemonType;
}

export class StarterSelectUiHandler extends MessageUiHandler {
  private starterSelectContainer: Phaser.GameObjects.Container;
  private starterSelectScrollBar: ScrollBar;
  private filterBar: FilterBar;
  private shinyOverlay: Phaser.GameObjects.Image;
  private starterContainers: StarterContainer[] = [];
  private filteredStarterIds: SpeciesId[] = [];
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
  private eggMovesLabel: Phaser.GameObjects.Text;
  private pokemonEggMovesContainer: Phaser.GameObjects.Container;
  private pokemonEggMoveContainers: Phaser.GameObjects.Container[];
  private pokemonEggMoveBgs: Phaser.GameObjects.NineSlice[];
  private pokemonEggMoveLabels: Phaser.GameObjects.Text[];
  private pokemonCandyContainer: Phaser.GameObjects.Container;
  private pokemonCandyIcon: Phaser.GameObjects.Sprite;
  private pokemonCandyDarknessOverlay: Phaser.GameObjects.Sprite;
  private pokemonCandyOverlayIcon: Phaser.GameObjects.Sprite;
  private pokemonCandyCountText: Phaser.GameObjects.Text;
  private pokemonCaughtHatchedContainer: Phaser.GameObjects.Container;
  private pokemonCaughtCountText: Phaser.GameObjects.Text;
  private pokemonFormText: Phaser.GameObjects.Text;
  private pokemonHatchedIcon: Phaser.GameObjects.Sprite;
  private pokemonHatchedCountText: Phaser.GameObjects.Text;
  private pokemonShinyIcon: Phaser.GameObjects.Sprite;
  private pokemonPassiveDisabledIcon: Phaser.GameObjects.Sprite;
  private pokemonPassiveLockedIcon: Phaser.GameObjects.Sprite;
  private teraIcon: Phaser.GameObjects.Sprite;

  private activeTooltip: "ABILITY" | "PASSIVE" | "CANDY" | undefined;
  private instructionsContainer: Phaser.GameObjects.Container;
  private filterInstructionsContainer: Phaser.GameObjects.Container;
  private shinyIconElement: Phaser.GameObjects.Sprite;
  private formIconElement: Phaser.GameObjects.Sprite;
  private abilityIconElement: Phaser.GameObjects.Sprite;
  private genderIconElement: Phaser.GameObjects.Sprite;
  private natureIconElement: Phaser.GameObjects.Sprite;
  private teraIconElement: Phaser.GameObjects.Sprite;
  private goFilterIconElement: Phaser.GameObjects.Sprite;
  private shinyLabel: Phaser.GameObjects.Text;
  private formLabel: Phaser.GameObjects.Text;
  private genderLabel: Phaser.GameObjects.Text;
  private abilityLabel: Phaser.GameObjects.Text;
  private natureLabel: Phaser.GameObjects.Text;
  private teraLabel: Phaser.GameObjects.Text;
  private goFilterLabel: Phaser.GameObjects.Text;
  /** Group holding the UI elements appearing in the instructionsContainer */
  /* TODO: Uncomment this once our testing infra supports mocks of `Phaser.GameObject.Group` 
  private instructionElemGroup: Phaser.GameObjects.Group;
  */

  private starterSelectMessageBox: Phaser.GameObjects.NineSlice;
  private starterSelectMessageBoxContainer: Phaser.GameObjects.Container;
  private statsContainer: StatsContainer;
  private moveInfoOverlay: MoveInfoOverlay;

  private statsMode: boolean;
  private starterIconsCursorXOffset = -3;
  private starterIconsCursorYOffset = 1;
  private starterIconsCursorIndex: number;
  private filterMode: boolean;
  private dexAttrCursor = 0n;
  private abilityCursor = -1;
  private natureCursor = -1;
  private teraCursor: PokemonType = PokemonType.UNKNOWN;
  private filterBarCursor = 0;
  private starterMoveset: StarterMoveset | null;
  private scrollCursor: number;

  private allStarterSpecies: PokemonSpecies[] = [];
  private lastSpecies: PokemonSpecies;
  private speciesLoaded: Map<SpeciesId, boolean> = new Map<SpeciesId, boolean>();
  public starterSpecies: PokemonSpecies[] = [];
  private pokerusSpecies: PokemonSpecies[] = [];
  private starterAttr: bigint[] = [];
  private starterAbilityIndexes: number[] = [];
  private starterNatures: Nature[] = [];
  private starterTeras: PokemonType[] = [];
  private starterMovesets: StarterMoveset[] = [];
  private speciesStarterDexEntry: DexEntry | null;
  private speciesStarterMoves: MoveId[];
  private canCycleShiny: boolean;
  private canCycleForm: boolean;
  private canCycleGender: boolean;
  private canCycleAbility: boolean;
  private canCycleNature: boolean;
  private canCycleTera: boolean;

  private assetLoadCancelled: BooleanHolder | null;
  public cursorObj: Phaser.GameObjects.Image;
  private starterCursorObjs: Phaser.GameObjects.Image[];
  private pokerusCursorObjs: Phaser.GameObjects.Image[];
  private starterIcons: Phaser.GameObjects.Sprite[];
  private starterIconsCursorObj: Phaser.GameObjects.Image;
  private valueLimitLabel: Phaser.GameObjects.Text;
  private startCursorObj: Phaser.GameObjects.NineSlice;
  private randomCursorObj: Phaser.GameObjects.NineSlice;

  private iconAnimHandler: PokemonIconAnimHandler;

  //variables to keep track of the dynamically rendered list of instruction prompts for starter select
  private instructionRowX = 0;
  private instructionRowY = 0;
  private instructionRowTextOffset = 9;
  private filterInstructionRowX = 0;
  private filterInstructionRowY = 0;

  private starterSelectCallback: StarterSelectCallback | null;

  private starterPreferences: AllStarterPreferences;
  private originalStarterPreferences: AllStarterPreferences;

  /**
   * Used to check whether any moves were swapped using the reorder menu, to decide
   * whether a save should be performed or not.
   */
  private hasSwappedMoves = false;

  protected blockInput = false;
  private allowTera: boolean;
  private pokemonPermanentInfoContainer: GameObjects.Container;
  private pokemonStatisticsContainer: GameObjects.Container;
  private pokemonPreferencesContainer: GameObjects.Container;
  private partyColumn: GameObjects.Container;
  private oldCursor = -1;

  constructor() {
    super(UiMode.STARTER_SELECT);
  }

  setup() {
    const ui = this.getUi();

    /** Scaled canvas height */
    const sHeight = globalScene.scaledCanvas.height;
    /** Scaled canvas width */
    const sWidth = globalScene.scaledCanvas.width;

    this.starterSelectContainer = globalScene.add.container(0, -sHeight).setVisible(false);
    ui.add(this.starterSelectContainer);

    const bgColor = globalScene.add.rectangle(0, 0, sWidth, sHeight, 0x006860).setOrigin(0);

    const starterSelectBg = globalScene.add.image(0, 0, "starter_select_bg").setOrigin(0);
    this.shinyOverlay = globalScene.add.image(6, 6, "summary_overlay_shiny").setOrigin(0).setVisible(false);

    const starterContainerBg = globalScene.add
      .image(speciesContainerX + 1, filterBarHeight + 2, "starter_container_bg")
      .setOrigin(0);

    // Create and initialise filter bar
    this.filterBar = this.setupFilterBar();

    this.iconAnimHandler = new PokemonIconAnimHandler();
    this.iconAnimHandler.setup();

    this.pokemonSprite = globalScene.add.sprite(53, 63, "pkmn__sub");
    this.pokemonSprite.setPipeline(globalScene.spritePipeline, {
      tone: [0.0, 0.0, 0.0, 0.0],
      ignoreTimeTint: true,
    });

    this.pokemonNumberText = addTextObject(17, 1, "0000", TextStyle.SUMMARY_DEX_NUM).setOrigin(0);

    this.pokemonNameText = addTextObject(6, 112, "", TextStyle.SUMMARY).setOrigin(0);

    this.pokemonUncaughtText = addTextObject(
      6,
      127,
      i18next.t("starterSelectUiHandler:uncaught"),
      TextStyle.SUMMARY_ALT,
      { fontSize: "56px" },
    ).setOrigin(0);

    this.partyColumn = this.setupPartyColumn();

    this.pokemonMoveContainers = [];
    this.pokemonMoveBgs = [];
    this.pokemonMoveLabels = [];

    this.pokemonEggMoveContainers = [];
    this.pokemonEggMoveBgs = [];
    this.pokemonEggMoveLabels = [];

    const starterBoxContainer = globalScene.add.container(speciesContainerX + 6, 9); //115

    this.starterSelectScrollBar = new ScrollBar(161, 12, 5, 155, 9);

    starterBoxContainer.add(this.starterSelectScrollBar);

    this.pokerusCursorObjs = [];
    for (let i = 0; i < POKERUS_STARTER_COUNT; i++) {
      const cursorObj = globalScene.add.image(0, 0, "select_cursor_pokerus");
      cursorObj.setVisible(false);
      cursorObj.setOrigin(0);
      starterBoxContainer.add(cursorObj);
      this.pokerusCursorObjs.push(cursorObj);
    }

    this.starterCursorObjs = [];
    for (let i = 0; i < 6; i++) {
      const cursorObj = globalScene.add.image(0, 0, "select_cursor_highlight");
      cursorObj.setVisible(false);
      cursorObj.setOrigin(0);
      starterBoxContainer.add(cursorObj);
      this.starterCursorObjs.push(cursorObj);
    }

    this.cursorObj = globalScene.add.image(0, 0, "select_cursor").setOrigin(0);

    starterBoxContainer.add(this.cursorObj);

    // TODO: Apply the same logic done in the pokedex to only have 81 containers whose sprites are cycled
    for (const species of allSpecies) {
      if (!speciesStarterCosts.hasOwnProperty(species.speciesId) || !species.isObtainable()) {
        continue;
      }
      this.speciesLoaded.set(species.speciesId, false);
      this.allStarterSpecies.push(species);
    }

    for (let i = 0; i < 81; i++) {
      const starterContainer = new StarterContainer(this.allStarterSpecies[i]).setVisible(false);
      const pos = calcStarterContainerPosition(i);
      starterContainer.setPosition(pos.x, pos.y);
      this.iconAnimHandler.addOrUpdate(starterContainer.icon, PokemonIconAnimMode.NONE);
      this.starterContainers.push(starterContainer);
      starterBoxContainer.add(starterContainer);
    }

    this.pokemonPreferencesContainer = this.setupPokemonPreferencesContainer();
    this.pokemonPermanentInfoContainer = this.setupPokemonPermanentInfoContainer();
    this.pokemonStatisticsContainer = this.setupPokemonStatisticsContainer();

    for (let m = 0; m < 4; m++) {
      const moveContainer = globalScene.add.container(0, 14 * m);

      const moveBg = globalScene.add.nineslice(0, 0, "type_bgs", "unknown", 92, 14, 2, 2, 2, 2);
      moveBg.setOrigin(1, 0);

      const moveLabel = addTextObject(-moveBg.width / 2, 0, "-", TextStyle.MOVE_LABEL);
      moveLabel.setOrigin(0.5, 0);

      this.pokemonMoveBgs.push(moveBg);
      this.pokemonMoveLabels.push(moveLabel);

      moveContainer.add([moveBg, moveLabel]);

      this.pokemonMoveContainers.push(moveContainer);
      this.pokemonMovesContainer.add(moveContainer);
    }

    this.pokemonAdditionalMoveCountLabel = addTextObject(
      -this.pokemonMoveBgs[0].width / 2,
      56,
      "(+0)",
      TextStyle.MOVE_LABEL,
    ).setOrigin(0.5, 0);

    this.pokemonMovesContainer.add(this.pokemonAdditionalMoveCountLabel);

    this.pokemonEggMovesContainer = globalScene.add.container(102, 85).setScale(0.375);

    this.eggMovesLabel = addTextObject(
      -46,
      0,
      i18next.t("starterSelectUiHandler:eggMoves"),
      TextStyle.WINDOW_ALT,
    ).setOrigin(0.5, 0);

    this.pokemonEggMovesContainer.add(this.eggMovesLabel);

    for (let m = 0; m < 4; m++) {
      const eggMoveContainer = globalScene.add.container(0, 16 + 14 * m);

      const eggMoveBg = globalScene.add.nineslice(0, 0, "type_bgs", "unknown", 92, 14, 2, 2, 2, 2);
      eggMoveBg.setOrigin(1, 0);

      const eggMoveLabel = addTextObject(-eggMoveBg.width / 2, 0, "???", TextStyle.MOVE_LABEL);
      eggMoveLabel.setOrigin(0.5, 0);

      this.pokemonEggMoveBgs.push(eggMoveBg);
      this.pokemonEggMoveLabels.push(eggMoveLabel);

      eggMoveContainer.add([eggMoveBg, eggMoveLabel]);

      this.pokemonEggMoveContainers.push(eggMoveContainer);

      this.pokemonEggMovesContainer.add(eggMoveContainer);
    }

    this.setupInstructionButtons();
    this.instructionsContainer = globalScene.add.container(4, 156).setVisible(true);

    /** TODO: Uncomment this and update `this.hideInstructions` once our testing infra supports mocks of `Phaser.GameObject.Group` */
    /*
    this.instructionElemGroup = globalScene.add.group([
      this.shinyIconElement,
      this.shinyLabel,
      this.formIconElement,
      this.formLabel,
      this.genderIconElement,
      this.genderLabel,
      this.abilityIconElement,
      this.abilityLabel,
      this.natureIconElement,
      this.natureLabel,
      this.teraIconElement,
      this.teraLabel,
      this.goFilterIconElement,
      this.goFilterLabel,
    ]);
    */

    this.hideInstructions();

    this.filterInstructionsContainer = globalScene.add.container(50, 5).setVisible(true);

    this.starterSelectMessageBoxContainer = globalScene.add.container(0, sHeight).setVisible(false);

    this.starterSelectMessageBox = addWindow(1, -1, 318, 28).setOrigin(0, 1);
    this.starterSelectMessageBoxContainer.add(this.starterSelectMessageBox);

    this.message = addTextObject(8, 8, "", TextStyle.WINDOW, { maxLines: 2 }).setOrigin(0);
    this.starterSelectMessageBoxContainer.add(this.message);

    // arrow icon for the message box
    this.initPromptSprite(this.starterSelectMessageBoxContainer);

    this.statsContainer = new StatsContainer(6, 16).setVisible(false);

    globalScene.add.existing(this.statsContainer);

    // add the info overlay last to be the top most ui element and prevent the IVs from overlaying this
    this.moveInfoOverlay = new MoveInfoOverlay({
      top: true,
      x: 1,
      y: globalScene.scaledCanvas.height - MoveInfoOverlay.getHeight() - 29,
    });

    this.starterSelectContainer.add([
      bgColor,
      starterSelectBg,
      this.shinyOverlay,
      starterContainerBg,
      this.partyColumn,
      this.pokemonSprite,
      this.pokemonNumberText,
      this.pokemonNameText,
      this.pokemonUncaughtText,
      starterBoxContainer,
      this.pokemonPreferencesContainer,
      this.pokemonPermanentInfoContainer,
      this.pokemonStatisticsContainer,
      this.pokemonMovesContainer,
      this.pokemonEggMovesContainer,
      this.instructionsContainer,
      this.filterInstructionsContainer,
      this.starterSelectMessageBoxContainer,
      this.statsContainer,
      this.moveInfoOverlay,
      // Filter bar sits above everything, except the tutorial overlay and message box.
      // Do not put anything below this unless it must appear below the filter bar.
      this.filterBar,
    ]);

    this.initTutorialOverlay(this.starterSelectContainer);
    this.starterSelectContainer.bringToTop(this.starterSelectMessageBoxContainer);

    globalScene.eventTarget.addEventListener(BattleSceneEventType.CANDY_UPGRADE_NOTIFICATION_CHANGED, e =>
      this.onCandyUpgradeDisplayChanged(e),
    );

    this.updateInstructions();
  }

  getCurrentTextSettings(): LanguageSetting {
    const currentLanguage = i18next.resolvedLanguage ?? "en";
    const langSettingKey = Object.keys(languageSettings).find(lang => currentLanguage.includes(lang)) ?? "en";
    const textSettings = languageSettings[langSettingKey];
    return textSettings;
  }

  setupFilterBar(): FilterBar {
    const filterBar = new FilterBar(Math.min(speciesContainerX, teamWindowX), 1, 210, filterBarHeight);

    // gen filter
    const genOptions: DropDownOption[] = Array.from(
      { length: 9 },
      (_, i) => new DropDownOption(i + 1, new DropDownLabel(i18next.t(`starterSelectUiHandler:gen${i + 1}`))),
    );
    const genDropDown: DropDown = new DropDown(0, 0, genOptions, this.updateStarters, DropDownType.HYBRID);
    filterBar.addFilter(DropDownColumn.GEN, i18next.t("filterBar:genFilter"), genDropDown);

    // type filter
    const typeKeys = Object.keys(PokemonType).filter(v => Number.isNaN(Number(v)));
    const typeOptions: DropDownOption[] = [];
    typeKeys.forEach((type, index) => {
      if (index === 0 || index === 19) {
        return;
      }
      const typeSprite = globalScene.add.sprite(0, 0, getLocalizedSpriteKey("types"));
      typeSprite.setScale(0.5);
      typeSprite.setFrame(type.toLowerCase());
      typeOptions.push(new DropDownOption(index, new DropDownLabel("", typeSprite)));
    });
    filterBar.addFilter(
      DropDownColumn.TYPES,
      i18next.t("filterBar:typeFilter"),
      new DropDown(0, 0, typeOptions, this.updateStarters, DropDownType.HYBRID, 0.5),
    );

    // caught filter
    const shiny1Sprite = globalScene.add
      .sprite(0, 0, "shiny_icons")
      .setOrigin(0.15, 0.2)
      .setScale(0.6)
      .setFrame(getVariantIcon(0))
      .setTint(getVariantTint(0));
    const shiny2Sprite = globalScene.add
      .sprite(0, 0, "shiny_icons")
      .setOrigin(0.15, 0.2)
      .setScale(0.6)
      .setFrame(getVariantIcon(1))
      .setTint(getVariantTint(1));
    const shiny3Sprite = globalScene.add
      .sprite(0, 0, "shiny_icons")
      .setOrigin(0.15, 0.2)
      .setScale(0.6)
      .setFrame(getVariantIcon(2))
      .setTint(getVariantTint(2));

    const caughtOptions = [
      new DropDownOption("SHINY3", new DropDownLabel("", shiny3Sprite)),
      new DropDownOption("SHINY2", new DropDownLabel("", shiny2Sprite)),
      new DropDownOption("SHINY", new DropDownLabel("", shiny1Sprite)),
      new DropDownOption("NORMAL", new DropDownLabel(i18next.t("filterBar:normal"))),
      new DropDownOption("UNCAUGHT", new DropDownLabel(i18next.t("filterBar:uncaught"))),
    ];

    filterBar.addFilter(
      DropDownColumn.CAUGHT,
      i18next.t("filterBar:caughtFilter"),
      new DropDown(0, 0, caughtOptions, this.updateStarters, DropDownType.HYBRID),
    );

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
      new DropDownLabel(i18next.t("filterBar:costReductionUnlockedOne"), undefined, DropDownState.ONE),
      new DropDownLabel(i18next.t("filterBar:costReductionUnlockedTwo"), undefined, DropDownState.TWO),
      new DropDownLabel(i18next.t("filterBar:costReductionUnlockable"), undefined, DropDownState.UNLOCKABLE),
      new DropDownLabel(i18next.t("filterBar:costReductionLocked"), undefined, DropDownState.EXCLUDE),
    ];

    const unlocksOptions = [
      new DropDownOption("PASSIVE", passiveLabels),
      new DropDownOption("COST_REDUCTION", costReductionLabels),
    ];

    filterBar.addFilter(
      DropDownColumn.UNLOCKS,
      i18next.t("filterBar:unlocksFilter"),
      new DropDown(0, 0, unlocksOptions, this.updateStarters, DropDownType.RADIAL),
    );

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
      new DropDownOption("FAVORITE", favoriteLabels),
      new DropDownOption("WIN", winLabels),
      new DropDownOption("HIDDEN_ABILITY", hiddenAbilityLabels),
      new DropDownOption("EGG", eggLabels),
      new DropDownOption("POKERUS", pokerusLabels),
    ];
    filterBar.addFilter(
      DropDownColumn.MISC,
      i18next.t("filterBar:miscFilter"),
      new DropDown(0, 0, miscOptions, this.updateStarters, DropDownType.RADIAL),
    );

    // sort filter
    const sortOptions = [
      new DropDownOption(
        SortCriteria.NUMBER,
        new DropDownLabel(i18next.t("filterBar:sortByNumber"), undefined, DropDownState.ON),
      ),
      new DropDownOption(SortCriteria.COST, new DropDownLabel(i18next.t("filterBar:sortByCost"))),
      new DropDownOption(SortCriteria.CANDY, new DropDownLabel(i18next.t("filterBar:sortByCandies"))),
      new DropDownOption(SortCriteria.IV, new DropDownLabel(i18next.t("filterBar:sortByIVs"))),
      new DropDownOption(SortCriteria.NAME, new DropDownLabel(i18next.t("filterBar:sortByName"))),
      new DropDownOption(SortCriteria.CAUGHT, new DropDownLabel(i18next.t("filterBar:sortByNumCaught"))),
      new DropDownOption(SortCriteria.HATCHED, new DropDownLabel(i18next.t("filterBar:sortByNumHatched"))),
    ];
    filterBar.addFilter(
      DropDownColumn.SORT,
      i18next.t("filterBar:sortFilter"),
      new DropDown(0, 0, sortOptions, this.updateStarters, DropDownType.SINGLE),
    );

    // Offset the generation filter dropdown to avoid covering the filtered pokemon
    filterBar.offsetHybridFilters();

    return filterBar;
  }

  setupPartyColumn(): GameObjects.Container {
    const partyColumn = globalScene.add.container(0, 0);

    const starterContainerWindow = addWindow(speciesContainerX, filterBarHeight + 1, 175, 161);

    if (!globalScene.uiTheme) {
      starterContainerWindow.setVisible(false);
    }

    this.valueLimitLabel = addTextObject(teamWindowX + 17, 150, "0/10", TextStyle.STARTER_VALUE_LIMIT).setOrigin(
      0.5,
      0,
    );

    const startLabel = addTextObject(
      teamWindowX + 17,
      162,
      i18next.t("common:start"),
      TextStyle.TOOLTIP_CONTENT,
    ).setOrigin(0.5, 0);

    this.startCursorObj = globalScene.add
      .nineslice(teamWindowX + 4, 160, "select_cursor", undefined, 26, 15, 6, 6, 6, 6)
      .setVisible(false)
      .setOrigin(0);

    const randomSelectLabel = addTextObject(
      teamWindowX + 17,
      23,
      i18next.t("starterSelectUiHandler:randomize"),
      TextStyle.TOOLTIP_CONTENT,
    ).setOrigin(0.5, 0);

    this.randomCursorObj = globalScene.add
      .nineslice(teamWindowX + 4, 21, "select_cursor", undefined, 26, 15, 6, 6, 6, 6)
      .setVisible(false)
      .setOrigin(0);

    this.starterIconsCursorObj = globalScene.add
      .image(289, 64, "select_gen_cursor")
      .setName("starter-icons-cursor")
      .setVisible(false)
      .setOrigin(0);

    this.starterIcons = [];
    for (let i = 0; i < 6; i++) {
      const icon = globalScene.add
        .sprite(teamWindowX + 7, calcStarterIconY(i), "pokemon_icons_0")
        .setScale(0.5)
        .setOrigin(0)
        .setFrame("unknown");
      this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.PASSIVE);
      this.starterIcons.push(icon);
    }

    partyColumn.add([
      addWindow(
        teamWindowX,
        teamWindowY - randomSelectionWindowHeight,
        teamWindowWidth,
        randomSelectionWindowHeight,
        true,
      ),
      addWindow(teamWindowX, teamWindowY, teamWindowWidth, teamWindowHeight),
      addWindow(teamWindowX, teamWindowY + teamWindowHeight, teamWindowWidth, teamWindowWidth, true),
      starterContainerWindow,
      this.valueLimitLabel,
      startLabel,
      this.startCursorObj,
      randomSelectLabel,
      this.randomCursorObj,
      this.starterIconsCursorObj,
      ...this.starterIcons,
    ]);

    return partyColumn;
  }

  setupInstructionButtons(): void {
    // The font size should be set per language
    const textSettings = this.getCurrentTextSettings();
    const instructionTextSize = textSettings.instructionTextSize;

    const iRowX = this.instructionRowX;
    const iRowY = this.instructionRowY;
    const iRowTextX = iRowX + this.instructionRowTextOffset;

    // instruction rows that will be pushed into the container dynamically based on need
    // creating new sprites since they will be added to the scene later
    this.shinyIconElement = new Phaser.GameObjects.Sprite(globalScene, iRowX, iRowY, "keyboard", "R.png")
      .setName("sprite-shiny-icon-element")
      .setScale(0.675)
      .setOrigin(0);
    this.shinyLabel = addTextObject(
      iRowTextX,
      iRowY,
      i18next.t("starterSelectUiHandler:cycleShiny"),
      TextStyle.INSTRUCTIONS_TEXT,
      {
        fontSize: instructionTextSize,
      },
    ).setName("text-shiny-label");

    this.formIconElement = new Phaser.GameObjects.Sprite(globalScene, iRowX, iRowY, "keyboard", "F.png")
      .setName("sprite-form-icon-element")
      .setScale(0.675)
      .setOrigin(0);
    this.formLabel = addTextObject(
      iRowTextX,
      iRowY,
      i18next.t("starterSelectUiHandler:cycleForm"),
      TextStyle.INSTRUCTIONS_TEXT,
      {
        fontSize: instructionTextSize,
      },
    ).setName("text-form-label");

    this.genderIconElement = new Phaser.GameObjects.Sprite(globalScene, iRowX, iRowY, "keyboard", "G.png")
      .setName("sprite-gender-icon-element")
      .setScale(0.675)
      .setOrigin(0);
    this.genderLabel = addTextObject(
      iRowTextX,
      iRowY,
      i18next.t("starterSelectUiHandler:cycleGender"),
      TextStyle.INSTRUCTIONS_TEXT,
      { fontSize: instructionTextSize },
    ).setName("text-gender-label");

    this.abilityIconElement = new Phaser.GameObjects.Sprite(globalScene, iRowX, iRowY, "keyboard", "E.png")
      .setName("sprite-ability-icon-element")
      .setScale(0.675)
      .setOrigin(0);
    this.abilityLabel = addTextObject(
      iRowTextX,
      iRowY,
      i18next.t("starterSelectUiHandler:cycleAbility"),
      TextStyle.INSTRUCTIONS_TEXT,
      { fontSize: instructionTextSize },
    ).setName("text-ability-label");

    this.natureIconElement = new Phaser.GameObjects.Sprite(globalScene, iRowX, iRowY, "keyboard", "N.png")
      .setName("sprite-nature-icon-element")
      .setScale(0.675)
      .setOrigin(0);
    this.natureLabel = addTextObject(
      iRowTextX,
      iRowY,
      i18next.t("starterSelectUiHandler:cycleNature"),
      TextStyle.INSTRUCTIONS_TEXT,
      { fontSize: instructionTextSize },
    ).setName("text-nature-label");

    this.teraIconElement = new Phaser.GameObjects.Sprite(globalScene, iRowX, iRowY, "keyboard", "V.png")
      .setName("sprite-tera-icon-element")
      .setScale(0.675)
      .setOrigin(0);
    this.teraLabel = addTextObject(
      iRowTextX,
      iRowY,
      i18next.t("starterSelectUiHandler:cycleTera"),
      TextStyle.INSTRUCTIONS_TEXT,
      {
        fontSize: instructionTextSize,
      },
    ).setName("text-tera-label");

    this.goFilterIconElement = new Phaser.GameObjects.Sprite(
      globalScene,
      this.filterInstructionRowX,
      this.filterInstructionRowY,
      "keyboard",
      "C.png",
    )
      .setName("sprite-goFilter-icon-element")
      .setScale(0.675)
      .setOrigin(0);
    this.goFilterLabel = addTextObject(
      this.filterInstructionRowX + this.instructionRowTextOffset,
      this.filterInstructionRowY,
      i18next.t("starterSelectUiHandler:goFilter"),
      TextStyle.INSTRUCTIONS_TEXT,
      { fontSize: instructionTextSize },
    ).setName("text-goFilter-label");
  }

  setupPokemonPreferencesContainer(): GameObjects.Container {
    const pokemonPreferencesContainer = globalScene.add.container(0, 0);

    const textSettings = this.getCurrentTextSettings();

    // The position should be set per language
    const starterInfoXPos = textSettings?.starterInfoXPos || 31;
    const starterInfoYOffset = textSettings?.starterInfoYOffset || 0;

    // The font size should be set per language
    const starterInfoTextSize = textSettings?.starterInfoTextSize || 56;

    this.pokemonGenderText = addTextObject(96, 112, "", TextStyle.SUMMARY_ALT).setOrigin(0);

    this.pokemonFormText = addTextObject(6, 42, "Form", TextStyle.WINDOW_ALT, {
      fontSize: "42px",
    }).setOrigin(0);

    this.pokemonAbilityLabelText = addTextObject(
      6,
      127 + starterInfoYOffset,
      i18next.t("starterSelectUiHandler:ability"),
      TextStyle.SUMMARY_ALT,
      { fontSize: starterInfoTextSize },
    )
      .setOrigin(0)
      .setVisible(false);

    this.pokemonAbilityText = addTextObject(starterInfoXPos, 127 + starterInfoYOffset, "", TextStyle.SUMMARY_ALT, {
      fontSize: starterInfoTextSize,
    })
      .setOrigin(0)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, 250, 55), Phaser.Geom.Rectangle.Contains);

    this.pokemonPassiveLabelText = addTextObject(
      6,
      136 + starterInfoYOffset,
      i18next.t("starterSelectUiHandler:passive"),
      TextStyle.SUMMARY_ALT,
      { fontSize: starterInfoTextSize },
    )
      .setOrigin(0)
      .setVisible(false);

    this.pokemonPassiveText = addTextObject(starterInfoXPos, 136 + starterInfoYOffset, "", TextStyle.SUMMARY_ALT, {
      fontSize: starterInfoTextSize,
    })
      .setOrigin(0)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, 250, 55), Phaser.Geom.Rectangle.Contains);

    this.pokemonPassiveDisabledIcon = globalScene.add
      .sprite(starterInfoXPos, 137 + starterInfoYOffset, "icon_stop")
      .setOrigin(0, 0.5)
      .setScale(0.35)
      .setVisible(false);

    this.pokemonPassiveLockedIcon = globalScene.add
      .sprite(starterInfoXPos, 137 + starterInfoYOffset, "icon_lock")
      .setOrigin(0, 0.5)
      .setScale(0.42, 0.38)
      .setVisible(false);

    this.pokemonNatureLabelText = addTextObject(
      6,
      145 + starterInfoYOffset,
      i18next.t("starterSelectUiHandler:nature"),
      TextStyle.SUMMARY_ALT,
      { fontSize: starterInfoTextSize },
    )
      .setOrigin(0)
      .setVisible(false);

    this.pokemonNatureText = addBBCodeTextObject(starterInfoXPos, 145 + starterInfoYOffset, "", TextStyle.SUMMARY_ALT, {
      fontSize: starterInfoTextSize,
    }).setOrigin(0);

    this.pokemonShinyIcon = globalScene.add.sprite(12, 0, "shiny_icons").setScale(0.5);

    this.teraIcon = globalScene.add.sprite(85, 63, "button_tera").setName("terastallize-icon").setFrame("fire");

    pokemonPreferencesContainer.add([
      this.pokemonGenderText,
      this.pokemonFormText,
      this.pokemonAbilityLabelText,
      this.pokemonAbilityText,
      this.pokemonPassiveLabelText,
      this.pokemonPassiveText,
      this.pokemonPassiveDisabledIcon,
      this.pokemonPassiveLockedIcon,
      this.pokemonNatureLabelText,
      this.pokemonNatureText,
      this.pokemonShinyIcon,
      this.teraIcon,
    ]);

    return pokemonPreferencesContainer;
  }

  setupPokemonPermanentInfoContainer(): GameObjects.Container {
    const pokemonPermanentInfoContainer = globalScene.add.container(0, 0);

    this.type1Icon = globalScene.add.sprite(8, 98, getLocalizedSpriteKey("types")).setScale(0.5).setOrigin(0);
    this.type2Icon = globalScene.add.sprite(26, 98, getLocalizedSpriteKey("types")).setScale(0.5).setOrigin(0);

    this.pokemonGrowthRateLabelText = addTextObject(
      8,
      106,
      i18next.t("starterSelectUiHandler:growthRate"),
      TextStyle.SUMMARY_ALT,
      { fontSize: "36px" },
    )
      .setOrigin(0)
      .setVisible(false);

    this.pokemonGrowthRateText = addTextObject(34, 106, "", TextStyle.GROWTH_RATE_TYPE, { fontSize: "36px" }).setOrigin(
      0,
    );

    this.pokemonLuckLabelText = addTextObject(8, 89, i18next.t("common:luckIndicator"), TextStyle.WINDOW_ALT, {
      fontSize: "56px",
    }).setOrigin(0);

    this.pokemonLuckText = addTextObject(
      8 + this.pokemonLuckLabelText.displayWidth + 2,
      89,
      "0",
      TextStyle.LUCK_VALUE,
      { fontSize: "56px" },
    ).setOrigin(0);

    pokemonPermanentInfoContainer.add([
      this.type1Icon,
      this.type2Icon,
      this.pokemonGrowthRateLabelText,
      this.pokemonGrowthRateText,
      this.pokemonLuckLabelText,
      this.pokemonLuckText,
    ]);

    return pokemonPermanentInfoContainer;
  }

  setupPokemonStatisticsContainer(): GameObjects.Container {
    const pokemonStatisticsContainer = globalScene.add.container(0, 0);

    // Candy icon and count
    this.pokemonCandyContainer = globalScene.add
      .container(4.5, 18)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, 30, 20), Phaser.Geom.Rectangle.Contains);
    this.pokemonCandyIcon = globalScene.add.sprite(0, 0, "candy").setScale(0.5).setOrigin(0);
    this.pokemonCandyOverlayIcon = globalScene.add.sprite(0, 0, "candy_overlay").setScale(0.5).setOrigin(0);
    this.pokemonCandyDarknessOverlay = globalScene.add
      .sprite(0, 0, "candy")
      .setScale(0.5)
      .setOrigin(0)
      .setTint(0x000000)
      .setAlpha(0.5);

    this.pokemonCandyCountText = addTextObject(9.5, 0, "x0", TextStyle.WINDOW_ALT, { fontSize: "56px" }).setOrigin(0);
    this.pokemonCandyContainer.add([
      this.pokemonCandyIcon,
      this.pokemonCandyOverlayIcon,
      this.pokemonCandyDarknessOverlay,
      this.pokemonCandyCountText,
    ]);

    this.pokemonCaughtHatchedContainer = globalScene.add.container(2, 25).setScale(0.5);

    const pokemonCaughtIcon = globalScene.add.sprite(1, 0, "items", "pb").setOrigin(0).setScale(0.75);

    this.pokemonCaughtCountText = addTextObject(24, 4, "0", TextStyle.SUMMARY_ALT).setOrigin(0);
    this.pokemonHatchedIcon = globalScene.add.sprite(1, 14, "egg_icons").setOrigin(0.15, 0.2).setScale(0.8);
    this.pokemonHatchedCountText = addTextObject(24, 19, "0", TextStyle.SUMMARY_ALT).setOrigin(0);
    this.pokemonMovesContainer = globalScene.add.container(102, 16).setScale(0.375);
    this.pokemonCaughtHatchedContainer.add([
      pokemonCaughtIcon,
      this.pokemonCaughtCountText,
      this.pokemonHatchedIcon,
      this.pokemonHatchedCountText,
    ]);

    pokemonStatisticsContainer.add([this.pokemonCandyContainer, this.pokemonCaughtHatchedContainer]);

    return pokemonStatisticsContainer;
  }

  show(args: any[]): boolean {
    this.moveInfoOverlay.clear(); // clear this when removing a menu; the cancel button doesn't seem to trigger this automatically on controllers
    this.pokerusSpecies = getPokerusStarters();

    this.allowTera = globalScene.gameData.achvUnlocks.hasOwnProperty(achvs.TERASTALLIZE.id);

    if (args.length >= 1 && args[0] instanceof Function) {
      super.show(args);
      this.starterSelectCallback = args[0] as StarterSelectCallback;

      this.starterSelectContainer.setVisible(true);

      this.starterPreferences = loadStarterPreferences();
      // Deep copy the JSON (avoid re-loading from disk)
      this.originalStarterPreferences = deepCopy(this.starterPreferences);

      this.allStarterSpecies.forEach(species => {
        // Initialize the StarterPreferences for this species
        this.starterPreferences[species.speciesId] = this.initStarterPrefs(species, this.starterPreferences);
        this.originalStarterPreferences[species.speciesId] = this.initStarterPrefs(
          species,
          this.originalStarterPreferences,
          true,
        );
      });

      this.starterContainers.forEach(container => {
        const icon = container.icon;
        const species = container.species;
        this.setUpgradeAnimation(icon, species);
      });

      const notFreshStart = !globalScene.gameMode.hasChallenge(Challenges.FRESH_START);

      for (const container of this.pokemonEggMoveContainers) {
        container.setVisible(notFreshStart);
      }
      this.eggMovesLabel.setVisible(notFreshStart);
      // This is not enough, we need individual checks in setStarterSpecies too! :)
      this.pokemonPassiveDisabledIcon.setVisible(notFreshStart);
      this.pokemonPassiveLabelText.setVisible(notFreshStart);
      this.pokemonPassiveLockedIcon.setVisible(notFreshStart);
      this.pokemonPassiveText.setVisible(notFreshStart);

      this.resetFilters();
      this.updateStarters();

      this.setFilterMode(false);
      this.filterBarCursor = 0;
      this.setCursor(0);
      this.tryUpdateValue(0);

      handleTutorial(Tutorial.Starter_Select);

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
   * @returns StarterPreferences for the species
   */
  initStarterPrefs(
    species: PokemonSpecies,
    preferences: AllStarterPreferences,
    ignoreChallenge = false,
  ): StarterPreferences {
    // if preferences for the species is undefined, set it to an empty object
    preferences[species.speciesId] ??= {};
    const starterPreferences = preferences[species.speciesId];
    const { dexEntry, starterDataEntry: starterData } = this.getSpeciesData(species.speciesId, !ignoreChallenge);

    // no preferences or Pokemon wasn't caught, return empty attribute
    if (!starterPreferences || !dexEntry.caughtAttr) {
      return {};
    }

    const caughtAttr = dexEntry.caughtAttr;

    const hasShiny = caughtAttr & DexAttr.SHINY;
    const hasNonShiny = caughtAttr & DexAttr.NON_SHINY;
    if (starterPreferences.shiny && !hasShiny) {
      // shiny form wasn't unlocked, purging shiny and variant setting
      starterPreferences.shiny = undefined;
      starterPreferences.variant = undefined;
    } else if (starterPreferences.shiny === false && !hasNonShiny) {
      // non shiny form wasn't unlocked, purging shiny setting
      starterPreferences.shiny = undefined;
    }

    if (starterPreferences.variant !== undefined) {
      const unlockedVariants = [
        hasShiny && caughtAttr & DexAttr.DEFAULT_VARIANT,
        hasShiny && caughtAttr & DexAttr.VARIANT_2,
        hasShiny && caughtAttr & DexAttr.VARIANT_3,
      ];
      if (
        Number.isNaN(starterPreferences.variant) ||
        starterPreferences.variant < 0 ||
        !unlockedVariants[starterPreferences.variant]
      ) {
        // variant value is invalid or requested variant wasn't unlocked, purging setting
        starterPreferences.variant = undefined;
      }
    }

    if (starterPreferences.female !== undefined) {
      if (!(starterPreferences.female ? caughtAttr & DexAttr.FEMALE : caughtAttr & DexAttr.MALE)) {
        // requested gender wasn't unlocked, purging setting
        starterPreferences.female = undefined;
      }
    }

    if (starterPreferences.ability !== undefined) {
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
        hasHiddenAbility,
      ];
      if (!unlockedAbilities[starterPreferences.ability]) {
        // requested ability wasn't unlocked, purging setting
        starterPreferences.ability = undefined;
      }
    }

    const selectedForm = starterPreferences.form;
    if (
      selectedForm !== undefined &&
      (!species.forms[selectedForm]?.isStarterSelectable ||
        !(caughtAttr & globalScene.gameData.getFormAttr(selectedForm)))
    ) {
      // requested form wasn't unlocked/isn't a starter form, purging setting
      starterPreferences.form = undefined;
    }

    if (starterPreferences.nature !== undefined) {
      const unlockedNatures = globalScene.gameData.getNaturesForAttr(dexEntry.natureAttr);
      if (unlockedNatures.indexOf(starterPreferences.nature as unknown as Nature) < 0) {
        // requested nature wasn't unlocked, purging setting
        starterPreferences.nature = undefined;
      }
    }

    if (starterPreferences.tera !== undefined) {
      // If somehow we have an illegal tera type, it is reset here
      if (!(starterPreferences.tera === species.type1 || starterPreferences.tera === species?.type2)) {
        starterPreferences.tera = species.type1;
      }
      // In fresh start challenge, the tera type is always reset to the first one
      if (globalScene.gameMode.hasChallenge(Challenges.FRESH_START) && !ignoreChallenge) {
        starterPreferences.tera = species.type1;
      }
    }

    return starterPreferences;
  }

  /**
   * Set the selections for all filters to their default starting value
   */
  public resetFilters(): void {
    this.filterBar.setValsToDefault();
    this.resetCaughtDropdown();
  }

  /**
   * Set default value for the caught dropdown, which only shows caught mons
   */
  public resetCaughtDropdown(): void {
    const caughtDropDown: DropDown = this.filterBar.getFilter(DropDownColumn.CAUGHT);

    caughtDropDown.resetToDefault();

    // initial setting, in caught filter, select the options excluding the uncaught option
    for (let i = 0; i < caughtDropDown.options.length; i++) {
      // if the option is not "ALL" or "UNCAUGHT", toggle it
      if (caughtDropDown.options[i].val !== "ALL" && caughtDropDown.options[i].val !== "UNCAUGHT") {
        caughtDropDown.toggleOptionState(i);
      }
    }
  }

  showText(
    text: string,
    delay?: number,
    callback?: Function,
    callbackDelay?: number,
    prompt?: boolean,
    promptDelay?: number,
    moveToTop?: boolean,
  ) {
    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);

    const singleLine = text?.indexOf("\n") === -1;

    this.starterSelectMessageBox.setSize(318, singleLine ? 28 : 42);

    if (moveToTop) {
      this.starterSelectMessageBox.setOrigin(0);
      this.starterSelectMessageBoxContainer.setY(0);
      this.message.setY(4);
    } else {
      this.starterSelectMessageBoxContainer.setY(globalScene.scaledCanvas.height);
      this.starterSelectMessageBox.setOrigin(0, 1);
      this.message.setY(singleLine ? -22 : -37);
    }

    this.starterSelectMessageBoxContainer.setVisible(!!text?.length);
  }

  /**
   * Determines if 'Icon' based upgrade notifications should be shown
   * @returns true if upgrade notifications are enabled and set to display an 'Icon'
   */
  isUpgradeIconEnabled(): boolean {
    return globalScene.candyUpgradeNotification !== 0 && globalScene.candyUpgradeDisplay === 0;
  }
  /**
   * Determines if 'Animation' based upgrade notifications should be shown
   * @returns true if upgrade notifications are enabled and set to display an 'Animation'
   */
  isUpgradeAnimationEnabled(): boolean {
    return globalScene.candyUpgradeNotification !== 0 && globalScene.candyUpgradeDisplay === 1;
  }

  /**
   * Sets a bounce animation if enabled and the Pokemon has an upgrade
   * @param icon {@linkcode Phaser.GameObjects.GameObject} to animate
   * @param species {@linkcode PokemonSpecies} of the icon used to check for upgrades
   * @param startPaused Should this animation be paused after it is added?
   */
  setUpgradeAnimation(icon: Phaser.GameObjects.Sprite, species: PokemonSpecies, startPaused = false): void {
    globalScene.tweens.killTweensOf(icon);
    // Skip animations if they are disabled
    if (globalScene.candyUpgradeDisplay === 0 || species.speciesId !== species.getRootSpeciesId(false)) {
      return;
    }

    icon.y = 2;

    const tweenChain: Phaser.Types.Tweens.TweenChainBuilderConfig = {
      targets: icon,
      paused: startPaused,
      loop: -1,
      // Make the initial bounce a little randomly delayed
      delay: randIntRange(0, 50) * 5,
      loopDelay: fixedInt(1000),
      tweens: [
        {
          targets: icon,
          y: "-=5",
          duration: fixedInt(125),
          ease: "Cubic.easeOut",
          yoyo: true,
        },
        {
          targets: icon,
          y: "-=3",
          duration: fixedInt(150),
          ease: "Cubic.easeOut",
          yoyo: true,
        },
      ],
    };

    if (
      isPassiveAvailable(species.speciesId) ||
      (globalScene.candyUpgradeNotification === 2 &&
        (isValueReductionAvailable(species.speciesId) || isSameSpeciesEggAvailable(species.speciesId)))
    ) {
      const chain = globalScene.tweens.chain(tweenChain);
      if (!startPaused) {
        chain.play();
      }
    }
  }

  /**
   * Sets the visibility of a Candy Upgrade Icon
   */
  setUpgradeIcon(starter: StarterContainer): void {
    const species = starter.species;
    const slotVisible = !!species?.speciesId;

    if (
      !species ||
      globalScene.candyUpgradeNotification === 0 ||
      species.speciesId !== species.getRootSpeciesId(false)
    ) {
      starter.candyUpgradeIcon.setVisible(false);
      starter.candyUpgradeOverlayIcon.setVisible(false);
      return;
    }

    const passiveAvailable = isPassiveAvailable(species.speciesId);
    const valueReductionAvailable = isValueReductionAvailable(species.speciesId);
    const sameSpeciesEggAvailable = isSameSpeciesEggAvailable(species.speciesId);

    // 'Passive Only' mode
    if (globalScene.candyUpgradeNotification === 1) {
      starter.candyUpgradeIcon.setVisible(slotVisible && passiveAvailable);
      starter.candyUpgradeOverlayIcon.setVisible(slotVisible && starter.candyUpgradeIcon.visible);

      // 'On' mode
    } else if (globalScene.candyUpgradeNotification === 2) {
      starter.candyUpgradeIcon.setVisible(
        slotVisible && (passiveAvailable || valueReductionAvailable || sameSpeciesEggAvailable),
      );
      starter.candyUpgradeOverlayIcon.setVisible(slotVisible && starter.candyUpgradeIcon.visible);
    }
  }

  /**
   * Update the display of candy upgrade icons or animations for the given StarterContainer
   * @param starterContainer the container for the Pokemon to update
   */
  updateCandyUpgradeDisplay(starterContainer: StarterContainer) {
    if (this.isUpgradeIconEnabled()) {
      this.setUpgradeIcon(starterContainer);
    }
    if (this.isUpgradeAnimationEnabled()) {
      this.setUpgradeAnimation(starterContainer.icon, this.lastSpecies, true);
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
    if (globalScene.candyUpgradeDisplay === 0) {
      this.filteredStarterIds.forEach((_, i) => {
        this.setUpgradeIcon(this.starterContainers[i]);
      });

      return;
    }

    // Loop through all animations when set to 'Animation' mode
    this.filteredStarterIds.forEach((id, i) => {
      const icon = this.starterContainers[i].icon;

      this.setUpgradeAnimation(icon, getPokemonSpecies(id));
    });
  }

  showRandomCursor() {
    this.randomCursorObj.setVisible(true);
    this.setNoSpecies();
  }

  toBoxCursor(cursor: number) {
    const numberOfStarters = this.filteredStarterIds.length;
    const numOfRows = Math.ceil(numberOfStarters / COLUMNS);
    return numOfRows < ROWS ? cursor : cursor - (numOfRows - ROWS) * COLUMNS;
  }

  processFilterModeInput(button: Button) {
    let success = false;

    const numberOfStarters = this.filteredStarterIds.length;
    const numOfRows = Math.ceil(numberOfStarters / COLUMNS);

    switch (button) {
      case Button.CANCEL:
        if (this.filterBar.openDropDown) {
          // CANCEL with a filter menu open > close it
          this.filterBar.toggleDropDown(this.filterBarCursor);
          success = true;
        } else if (!this.filterBar.getFilter(this.filterBar.getColumn(this.filterBarCursor)).hasDefaultValues()) {
          if (this.filterBar.getColumn(this.filterBarCursor) === DropDownColumn.CAUGHT) {
            this.resetCaughtDropdown();
          } else {
            this.filterBar.resetSelection(this.filterBarCursor);
          }
          this.updateStarters();
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
        break;
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
        } else if (this.filterBarCursor === this.filterBar.numFilters - 1) {
          // UP from the last filter, move to start button
          this.setFilterMode(false);
          this.cursorObj.setVisible(false);
          if (this.starterSpecies.length > 0) {
            this.startCursorObj.setVisible(true);
          } else {
            this.showRandomCursor();
          }
          success = true;
        } else if (numberOfStarters > 0) {
          // UP from filter bar to bottom of Pokemon list
          this.setFilterMode(false);
          this.scrollCursor = Math.max(0, numOfRows - 9);
          this.updateScroll();
          const proportion = (this.filterBarCursor + 0.5) / this.filterBar.numFilters;
          const targetCol = Math.min(8, Math.floor(proportion * 11));
          if (numberOfStarters % 9 > targetCol) {
            this.setCursor(numberOfStarters - (numberOfStarters % 9) + targetCol - this.scrollCursor * 9);
          } else {
            this.setCursor(
              Math.max(numberOfStarters - (numberOfStarters % 9) + targetCol - 9 - this.scrollCursor * 9, 0),
            );
          }
          success = true;
        }
        break;
      case Button.DOWN:
        if (this.filterBar.openDropDown) {
          success = this.filterBar.incDropDownCursor();
        } else if (this.filterBarCursor === this.filterBar.numFilters - 1) {
          // DOWN from the last filter, move to random selection label
          this.setFilterMode(false);
          this.cursorObj.setVisible(false);
          this.showRandomCursor();
          success = true;
        } else if (numberOfStarters > 0) {
          // DOWN from filter bar to top of Pokemon list
          this.setFilterMode(false);
          this.scrollCursor = 0;
          this.updateScroll();
          const proportion = this.filterBarCursor / Math.max(1, this.filterBar.numFilters - 1);
          const targetCol = Math.min(8, Math.floor(proportion * 11));
          this.setCursor(Math.min(targetCol, numberOfStarters - 1));
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

    return success;
  }

  processStartCursorInput(button: Button) {
    let success = false;
    let error = false;

    const numberOfStarters = this.filteredStarterIds.length;
    const onScreenFirstIndex = this.scrollCursor * COLUMNS;
    const onScreenLastIndex = Math.min(this.filteredStarterIds.length - onScreenFirstIndex - 1, ROWS * COLUMNS - 1); // this is the last starter index on the screen
    const onScreenNumberOfRows = Math.ceil(onScreenLastIndex / COLUMNS);

    switch (button) {
      case Button.ACTION:
        if (this.tryStart(true)) {
          success = true;
        } else {
          error = true;
        }
        break;
      case Button.UP:
        // UP from start button: go to pokemon in team if any, otherwise filter
        this.startCursorObj.setVisible(false);
        if (this.starterSpecies.length > 0) {
          this.starterIconsCursorIndex = this.starterSpecies.length - 1;
          this.moveStarterIconsCursor(this.starterIconsCursorIndex);
        } else {
          // TODO: how can we get here if start button can't be selected? this appears to be redundant
          this.startCursorObj.setVisible(false);
          this.showRandomCursor();
          this.setNoSpecies();
        }
        success = true;
        break;
      case Button.DOWN:
        // DOWN from start button: Go to filters
        this.startCursorObj.setVisible(false);
        this.filterBarCursor = Math.max(1, this.filterBar.numFilters - 1);
        this.setFilterMode(true);
        success = true;
        break;
      case Button.LEFT:
        if (numberOfStarters > 0) {
          this.startCursorObj.setVisible(false);
          this.cursorObj.setVisible(true);
          this.setCursor(onScreenLastIndex); // set last column
          success = true;
        }
        break;
      case Button.RIGHT:
        if (numberOfStarters > 0) {
          this.startCursorObj.setVisible(false);
          this.cursorObj.setVisible(true);
          this.setCursor((onScreenNumberOfRows - 1) * 9); // set first column
          success = true;
        }
        break;
    }

    return [success, error];
  }

  processRandomCursorInput(button: Button) {
    let success = false;
    let error = false;

    const numberOfStarters = this.filteredStarterIds.length;

    switch (button) {
      case Button.ACTION: {
        if (this.starterSpecies.length >= 6) {
          error = true;
          break;
        }
        const currentPartyValue = this.starterSpecies
          .map(s => s.generation)
          .reduce(
            (total: number, _gen: number, i: number) =>
              total + globalScene.gameData.getSpeciesStarterValue(this.starterSpecies[i].speciesId),
            0,
          );
        // Filter valid starters
        const validStarters = this.filteredStarterIds.filter(speciesId => {
          const species = getPokemonSpecies(speciesId);
          const [isDupe] = this.isInParty(species);
          const starterCost = globalScene.gameData.getSpeciesStarterValue(species.speciesId);
          const isValidForChallenge = checkStarterValidForChallenge(
            species,
            globalScene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId)),
            this.isPartyValid(),
          );
          const isCaught = this.getSpeciesData(species.speciesId).dexEntry.caughtAttr;
          return !isDupe && isValidForChallenge && currentPartyValue + starterCost <= this.getValueLimit() && isCaught;
        });
        if (validStarters.length === 0) {
          error = true; // No valid starters available
          break;
        }
        // Select random starter
        const randomStarterId = validStarters[Math.floor(Math.random() * validStarters.length)];
        const randomSpecies = getPokemonSpecies(randomStarterId);
        // Set species and prepare attributes
        this.setSpecies(randomSpecies);
        const dexAttr = this.getCurrentDexProps(randomSpecies.speciesId);
        const props = globalScene.gameData.getSpeciesDexAttrProps(randomSpecies, dexAttr);
        const abilityIndex = this.abilityCursor;
        const nature = this.natureCursor as unknown as Nature;
        const teraType = this.teraCursor;
        const moveset = this.starterMoveset?.slice(0) as StarterMoveset;
        const starterCost = globalScene.gameData.getSpeciesStarterValue(randomSpecies.speciesId);
        const speciesForm = getPokemonSpeciesForm(randomSpecies.speciesId, props.formIndex);
        // Load assets and add to party
        speciesForm.loadAssets(props.female, props.formIndex, props.shiny, props.variant, true).then(() => {
          if (this.tryUpdateValue(starterCost, true)) {
            this.addToParty(randomSpecies, dexAttr, abilityIndex, nature, moveset, teraType, true);
            this.getUi().playSelect();
          }
        });
        break;
      }
      case Button.UP:
        this.randomCursorObj.setVisible(false);
        this.filterBarCursor = this.filterBar.numFilters - 1;
        this.setFilterMode(true);
        success = true;
        break;
      case Button.DOWN:
        this.randomCursorObj.setVisible(false);
        if (this.starterSpecies.length > 0) {
          this.starterIconsCursorIndex = 0;
          this.moveStarterIconsCursor(this.starterIconsCursorIndex);
        } else {
          this.filterBarCursor = this.filterBar.numFilters - 1;
          this.setFilterMode(true);
        }
        success = true;
        break;
      case Button.LEFT:
        if (numberOfStarters > 0) {
          this.randomCursorObj.setVisible(false);
          this.cursorObj.setVisible(true);
          this.setCursor(Math.min(8, numberOfStarters - 1)); // set last column
          success = true;
        }
        break;
      case Button.RIGHT:
        if (numberOfStarters > 0) {
          this.randomCursorObj.setVisible(false);
          this.cursorObj.setVisible(true);
          this.setCursor(0); // set first column
          success = true;
        }
        break;
    }

    return [success, error];
  }

  processCycleButtonsInput(button: Button) {
    let success = false;

    const props = globalScene.gameData.getSpeciesDexAttrProps(
      this.lastSpecies,
      this.getCurrentDexProps(this.lastSpecies.speciesId),
    );

    // The temporary, duplicated starter data to show info
    // The sanitized starter preferences
    const starterPreferences = (this.starterPreferences[this.lastSpecies.speciesId] ??= {});
    // The original starter preferences
    const originalStarterPreferences = (this.originalStarterPreferences[this.lastSpecies.speciesId] ??= {});

    switch (button) {
      case Button.CYCLE_SHINY:
        if (this.canCycleShiny) {
          if (starterPreferences.shiny === false) {
            // If not shiny, we change to shiny and get the proper default variant
            const newProps = globalScene.gameData.getSpeciesDexAttrProps(
              this.lastSpecies,
              this.getCurrentDexProps(this.lastSpecies.speciesId),
            );
            const newVariant = starterPreferences.variant ? (starterPreferences.variant as Variant) : newProps.variant;
            starterPreferences.shiny = true;
            originalStarterPreferences.shiny = true;
            starterPreferences.variant = newVariant;
            originalStarterPreferences.variant = newVariant;
            this.setSpeciesDetails(this.lastSpecies, {
              shiny: true,
              variant: newVariant,
            });

            globalScene.playSound("se/sparkle");
            // Cycle tint based on current sprite tint
            const tint = getVariantTint(newVariant);
            this.pokemonShinyIcon.setFrame(getVariantIcon(newVariant)).setTint(tint).setVisible(true);
          } else {
            // If shiny, we update the variant
            let newVariant = props.variant;
            do {
              newVariant = (newVariant + 1) % 3;
              if (newVariant === 0) {
                if (this.speciesStarterDexEntry!.caughtAttr & DexAttr.DEFAULT_VARIANT) {
                  // TODO: is this bang correct?
                  break;
                }
              } else if (newVariant === 1) {
                if (this.speciesStarterDexEntry!.caughtAttr & DexAttr.VARIANT_2) {
                  // TODO: is this bang correct?
                  break;
                }
              } else {
                if (this.speciesStarterDexEntry!.caughtAttr & DexAttr.VARIANT_3) {
                  // TODO: is this bang correct?
                  break;
                }
              }
            } while (newVariant !== props.variant);
            starterPreferences.variant = newVariant; // store the selected variant
            originalStarterPreferences.variant = newVariant;
            if (this.speciesStarterDexEntry!.caughtAttr & DexAttr.NON_SHINY && newVariant <= props.variant) {
              // If we have run out of variants, go back to non shiny
              starterPreferences.shiny = false;
              originalStarterPreferences.shiny = false;
              this.setSpeciesDetails(this.lastSpecies, {
                shiny: false,
                variant: 0,
              });
              this.pokemonShinyIcon.setVisible(false);
              success = true;
            } else {
              // If going to a higher variant, or only shiny forms are caught, go to next variant
              this.setSpeciesDetails(this.lastSpecies, {
                variant: newVariant as Variant,
              });
              // Cycle tint based on current sprite tint
              const tint = getVariantTint(newVariant as Variant);
              this.pokemonShinyIcon.setFrame(getVariantIcon(newVariant as Variant)).setTint(tint);
              success = true;
            }
          }
        }
        break;
      case Button.CYCLE_FORM:
        if (this.canCycleForm) {
          const formCount = this.lastSpecies.forms.length;
          let newFormIndex = props.formIndex;
          do {
            newFormIndex = (newFormIndex + 1) % formCount;
            if (
              this.lastSpecies.forms[newFormIndex].isStarterSelectable &&
              this.speciesStarterDexEntry!.caughtAttr! & globalScene.gameData.getFormAttr(newFormIndex)
            ) {
              // TODO: are those bangs correct?
              break;
            }
          } while (newFormIndex !== props.formIndex);
          starterPreferences.form = newFormIndex; // store the selected form
          originalStarterPreferences.form = newFormIndex;
          starterPreferences.tera = this.lastSpecies.forms[newFormIndex].type1;
          originalStarterPreferences.tera = starterPreferences.tera;
          this.setSpeciesDetails(this.lastSpecies, {
            formIndex: newFormIndex,
            teraType: starterPreferences.tera,
          });
          success = true;
        }
        break;
      case Button.CYCLE_GENDER:
        if (this.canCycleGender) {
          starterPreferences.female = !props.female;
          originalStarterPreferences.female = starterPreferences.female;
          this.setSpeciesDetails(this.lastSpecies, {
            female: !props.female,
          });
          success = true;
        }
        break;
      case Button.CYCLE_ABILITY:
        if (this.canCycleAbility) {
          const abilityCount = this.lastSpecies.getAbilityCount();
          const abilityAttr = this.getSpeciesData(this.lastSpecies.speciesId).starterDataEntry.abilityAttr;
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
          starterPreferences.ability = newAbilityIndex; // store the selected ability
          originalStarterPreferences.ability = newAbilityIndex;

          const { visible: tooltipVisible } = globalScene.ui.getTooltip();

          if (tooltipVisible && this.activeTooltip === "ABILITY") {
            const newAbility = allAbilities[this.lastSpecies.getAbility(newAbilityIndex)];
            globalScene.ui.editTooltip(`${newAbility.name}`, `${newAbility.description}`);
          }

          this.setSpeciesDetails(this.lastSpecies, {
            abilityIndex: newAbilityIndex,
          });
          success = true;
        }
        break;
      case Button.CYCLE_NATURE:
        if (this.canCycleNature) {
          const natures = globalScene.gameData.getNaturesForAttr(this.speciesStarterDexEntry?.natureAttr);
          const natureIndex = natures.indexOf(this.natureCursor);
          const newNature = natures[natureIndex < natures.length - 1 ? natureIndex + 1 : 0];
          // store cycled nature as default
          starterPreferences.nature = newNature as unknown as number;
          originalStarterPreferences.nature = starterPreferences.nature;
          this.setSpeciesDetails(this.lastSpecies, {
            natureIndex: newNature,
          });
          success = true;
        }
        break;
      case Button.CYCLE_TERA:
        if (this.canCycleTera) {
          const speciesForm = getPokemonSpeciesForm(this.lastSpecies.speciesId, starterPreferences.form ?? 0);
          if (speciesForm.type1 === this.teraCursor && !isNullOrUndefined(speciesForm.type2)) {
            starterPreferences.tera = speciesForm.type2;
            originalStarterPreferences.tera = starterPreferences.tera;
            this.setSpeciesDetails(this.lastSpecies, {
              teraType: speciesForm.type2,
            });
          } else {
            starterPreferences.tera = speciesForm.type1;
            originalStarterPreferences.tera = starterPreferences.tera;
            this.setSpeciesDetails(this.lastSpecies, {
              teraType: speciesForm.type1,
            });
          }
          success = true;
        }
        break;
    }

    return success;
  }

  processPartyIconInput(button: Button) {
    let success = false;

    const numberOfStarters = this.filteredStarterIds.length;
    const onScreenLastIndex = Math.min(this.filteredStarterIds.length - 1, ROWS * COLUMNS - 1); // this is the last starter index on the screen

    switch (button) {
      case Button.UP:
        if (this.starterIconsCursorIndex === 0) {
          // Up from first Pokemon in the team > go to Random selection
          this.starterIconsCursorObj.setVisible(false);
          this.showRandomCursor();
        } else {
          this.starterIconsCursorIndex--;
          this.moveStarterIconsCursor(this.starterIconsCursorIndex);
        }
        success = true;
        break;
      case Button.DOWN:
        if (this.starterIconsCursorIndex <= this.starterSpecies.length - 2) {
          this.starterIconsCursorIndex++;
          this.moveStarterIconsCursor(this.starterIconsCursorIndex);
        } else {
          this.starterIconsCursorObj.setVisible(false);
          this.setNoSpecies();
          this.startCursorObj.setVisible(true);
        }
        success = true;
        break;
      case Button.LEFT:
        if (numberOfStarters > 0) {
          // LEFT from team > Go to closest filtered Pokemon
          const closestRowIndex = this.starterIconsCursorIndex + 1;
          this.starterIconsCursorObj.setVisible(false);
          this.cursorObj.setVisible(true);
          this.setCursor(Math.min(closestRowIndex * 9 + 8, onScreenLastIndex));
          success = true;
        } else {
          // LEFT from team and no Pokemon in filter > do nothing
          success = false;
        }
        break;
      case Button.RIGHT:
        if (numberOfStarters > 0) {
          // RIGHT from team > Go to closest filtered Pokemon
          const closestRowIndex = this.starterIconsCursorIndex + 1;
          this.starterIconsCursorObj.setVisible(false);
          this.cursorObj.setVisible(true);
          this.setCursor(Math.min(closestRowIndex * 9, onScreenLastIndex - (onScreenLastIndex % 9)));
          success = true;
        } else {
          // RIGHT from team and no Pokemon in filter > do nothing
          success = false;
        }
        break;
    }

    return success;
  }

  openPokemonMenu() {
    const ui = this.getUi();
    let options: any[] = []; // TODO: add proper type

    let starterContainer: StarterContainer;
    // The temporary, duplicated starter data to show info
    const starterData = this.getSpeciesData(this.lastSpecies.speciesId).starterDataEntry;
    // The persistent starter data to apply e.g. candy upgrades
    const persistentStarterData = globalScene.gameData.starterData[this.lastSpecies.speciesId];
    // The sanitized starter preferences
    const starterPreferences = (this.starterPreferences[this.lastSpecies.speciesId] ??= {});
    // The original starter preferences
    const originalStarterPreferences = (this.originalStarterPreferences[this.lastSpecies.speciesId] ??= {});

    // this gets the correct pokemon cursor depending on whether you're in the starter screen or the party icons
    if (!this.starterIconsCursorObj.visible) {
      starterContainer = this.starterContainers[this.cursor];
    } else {
      // if species is in filtered starters, get the starter container from the filtered starters, it can be undefined if the species is not in the filtered starters
      starterContainer =
        this.starterContainers[this.starterContainers.findIndex(container => container.species === this.lastSpecies)];
    }

    const [isDupe, removeIndex]: [boolean, number] = this.isInParty(this.lastSpecies);

    const isPartyValid = this.isPartyValid();
    const isValidForChallenge = checkStarterValidForChallenge(
      this.lastSpecies,
      globalScene.gameData.getSpeciesDexAttrProps(
        this.lastSpecies,
        this.getCurrentDexProps(this.lastSpecies.speciesId),
      ),
      isPartyValid,
    );

    const currentPartyValue = this.starterSpecies
      .map(s => s.generation)
      .reduce(
        (total: number, _gen: number, i: number) =>
          (total += globalScene.gameData.getSpeciesStarterValue(this.starterSpecies[i].speciesId)),
        0,
      );
    const newCost = globalScene.gameData.getSpeciesStarterValue(this.lastSpecies.speciesId);
    if (
      !isDupe &&
      isValidForChallenge &&
      currentPartyValue + newCost <= this.getValueLimit() &&
      this.starterSpecies.length < PLAYER_PARTY_MAX_SIZE
    ) {
      options = [
        {
          label: i18next.t("starterSelectUiHandler:addToParty"),
          handler: () => {
            ui.setMode(UiMode.STARTER_SELECT);
            const isOverValueLimit = this.tryUpdateValue(
              globalScene.gameData.getSpeciesStarterValue(this.lastSpecies.speciesId),
              true,
            );
            if (!isDupe && isValidForChallenge && isOverValueLimit) {
              this.starterCursorObjs[this.starterSpecies.length]
                .setVisible(true)
                .setPosition(this.cursorObj.x, this.cursorObj.y);
              this.addToParty(
                this.lastSpecies,
                this.dexAttrCursor,
                this.abilityCursor,
                this.natureCursor as unknown as Nature,
                this.starterMoveset?.slice(0) as StarterMoveset,
                this.teraCursor,
              );
              ui.playSelect();
            } else {
              ui.playError(); // this should be redundant as there is now a trigger for when a pokemon can't be added to party
            }
            return true;
          },
          overrideSound: true,
        },
      ];
    } else if (isDupe) {
      // if it already exists in your party, it will give you the option to remove from your party
      options = [
        {
          label: i18next.t("starterSelectUiHandler:removeFromParty"),
          handler: () => {
            this.popStarter(removeIndex);
            ui.setMode(UiMode.STARTER_SELECT);
            return true;
          },
        },
      ];
    }

    options.push(
      // this shows the IVs for the pokemon
      {
        label: i18next.t("starterSelectUiHandler:toggleIVs"),
        handler: () => {
          this.toggleStatsMode();
          ui.setMode(UiMode.STARTER_SELECT);
          return true;
        },
      },
    );
    if (this.speciesStarterMoves.length > 1) {
      // this lets you change the pokemon moves
      const showSwapOptions = (moveset: StarterMoveset) => {
        this.blockInput = true;

        ui.setMode(UiMode.STARTER_SELECT).then(() => {
          ui.showText(i18next.t("starterSelectUiHandler:selectMoveSwapOut"), null, () => {
            this.moveInfoOverlay.show(allMoves[moveset[0]]);

            ui.setModeWithoutClear(UiMode.OPTION_SELECT, {
              options: moveset
                .map((m: MoveId, i: number) => {
                  const option: OptionSelectItem = {
                    label: allMoves[m].name,
                    handler: () => {
                      this.blockInput = true;
                      ui.setMode(UiMode.STARTER_SELECT).then(() => {
                        ui.showText(
                          `${i18next.t("starterSelectUiHandler:selectMoveSwapWith")} ${allMoves[m].name}.`,
                          null,
                          () => {
                            const possibleMoves = this.speciesStarterMoves.filter((sm: MoveId) => sm !== m);
                            this.moveInfoOverlay.show(allMoves[possibleMoves[0]]);

                            ui.setModeWithoutClear(UiMode.OPTION_SELECT, {
                              options: possibleMoves
                                .map(sm => {
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
                                })
                                .concat({
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
                              yOffset: 19,
                            });
                            this.blockInput = false;
                          },
                        );
                      });
                      return true;
                    },
                    onHover: () => {
                      this.moveInfoOverlay.show(allMoves[m]);
                    },
                  };
                  return option;
                })
                .concat({
                  label: i18next.t("menu:cancel"),
                  handler: () => {
                    this.moveInfoOverlay.clear();
                    this.clearText();
                    // Only saved if moves were actually swapped
                    if (this.hasSwappedMoves) {
                      globalScene.gameData.saveSystem().then(success => {
                        if (!success) {
                          return globalScene.reset(true);
                        }
                      });
                    }
                    ui.setMode(UiMode.STARTER_SELECT);
                    return true;
                  },
                  onHover: () => {
                    this.moveInfoOverlay.clear();
                  },
                }),
              supportHover: true,
              maxOptions: 8,
              yOffset: 19,
            });
            this.blockInput = false;
          });
        });
      };
      options.push({
        label: i18next.t("starterSelectUiHandler:manageMoves"),
        handler: () => {
          this.hasSwappedMoves = false;
          showSwapOptions(this.starterMoveset!); // TODO: is this bang correct?
          return true;
        },
      });
    }
    if (this.canCycleNature) {
      // if we could cycle natures, enable the improved nature menu
      const showNatureOptions = () => {
        this.blockInput = true;

        ui.setMode(UiMode.STARTER_SELECT).then(() => {
          ui.showText(i18next.t("starterSelectUiHandler:selectNature"), null, () => {
            const natures = globalScene.gameData.getNaturesForAttr(this.speciesStarterDexEntry?.natureAttr);
            ui.setModeWithoutClear(UiMode.OPTION_SELECT, {
              options: natures
                .map((n: Nature, _i: number) => {
                  const option: OptionSelectItem = {
                    label: getNatureName(n, true, true, true, globalScene.uiTheme),
                    handler: () => {
                      starterPreferences.nature = n;
                      originalStarterPreferences.nature = starterPreferences.nature;
                      this.clearText();
                      ui.setMode(UiMode.STARTER_SELECT);
                      // set nature for starter
                      this.setSpeciesDetails(this.lastSpecies, {
                        natureIndex: n,
                      });
                      this.blockInput = false;
                      return true;
                    },
                  };
                  return option;
                })
                .concat({
                  label: i18next.t("menu:cancel"),
                  handler: () => {
                    this.clearText();
                    ui.setMode(UiMode.STARTER_SELECT);
                    this.blockInput = false;
                    return true;
                  },
                }),
              maxOptions: 8,
              yOffset: 19,
            });
          });
        });
      };
      options.push({
        label: i18next.t("starterSelectUiHandler:manageNature"),
        handler: () => {
          showNatureOptions();
          return true;
        },
      });
    }

    const passiveAttr = starterData.passiveAttr;
    if (passiveAttr & PassiveAttr.UNLOCKED) {
      // this is for enabling and disabling the passive
      const label = i18next.t(
        passiveAttr & PassiveAttr.ENABLED
          ? "starterSelectUiHandler:disablePassive"
          : "starterSelectUiHandler:enablePassive",
      );
      options.push({
        label,
        handler: () => {
          starterData.passiveAttr ^= PassiveAttr.ENABLED;
          persistentStarterData.passiveAttr ^= PassiveAttr.ENABLED;
          ui.setMode(UiMode.STARTER_SELECT);
          this.setSpeciesDetails(this.lastSpecies);
          return true;
        },
      });
    }
    // if container.favorite is false, show the favorite option
    const isFavorite = starterPreferences?.favorite ?? false;
    if (!isFavorite) {
      options.push({
        label: i18next.t("starterSelectUiHandler:addToFavorites"),
        handler: () => {
          starterPreferences.favorite = true;
          originalStarterPreferences.favorite = true;
          // if the starter container not exists, it means the species is not in the filtered starters
          if (starterContainer) {
            starterContainer.favoriteIcon.setVisible(starterPreferences.favorite);
          }
          ui.setMode(UiMode.STARTER_SELECT);
          return true;
        },
      });
    } else {
      options.push({
        label: i18next.t("starterSelectUiHandler:removeFromFavorites"),
        handler: () => {
          starterPreferences.favorite = false;
          originalStarterPreferences.favorite = false;
          // if the starter container not exists, it means the species is not in the filtered starters
          if (starterContainer) {
            starterContainer.favoriteIcon.setVisible(starterPreferences.favorite);
          }
          ui.setMode(UiMode.STARTER_SELECT);
          return true;
        },
      });
    }
    options.push({
      label: i18next.t("menu:rename"),
      handler: () => {
        ui.playSelect();
        let nickname = starterPreferences.nickname ? String(starterPreferences.nickname) : "";
        nickname = decodeURIComponent(escape(atob(nickname)));
        ui.setModeWithoutClear(
          UiMode.RENAME_POKEMON,
          {
            buttonActions: [
              (sanitizedName: string) => {
                ui.playSelect();
                starterPreferences.nickname = sanitizedName;
                originalStarterPreferences.nickname = sanitizedName;
                const name = decodeURIComponent(escape(atob(starterPreferences.nickname)));
                if (name.length > 0) {
                  this.pokemonNameText.setText(name);
                } else {
                  this.pokemonNameText.setText(this.lastSpecies.name);
                }
                ui.setMode(UiMode.STARTER_SELECT);
              },
              () => {
                ui.setMode(UiMode.STARTER_SELECT);
              },
            ],
          },
          nickname,
        );
        return true;
      },
    });

    // Purchases with Candy
    const candyCount = starterData.candyCount;
    const showUseCandies = () => {
      const options: any[] = []; // TODO: add proper type

      // Unlock passive option
      if (!(passiveAttr & PassiveAttr.UNLOCKED) && !globalScene.gameMode.hasChallenge(Challenges.FRESH_START)) {
        const passiveCost = getPassiveCandyCount(speciesStarterCosts[this.lastSpecies.speciesId]);
        options.push({
          label: `×${passiveCost} ${i18next.t("starterSelectUiHandler:unlockPassive")}`,
          handler: () => {
            if (Overrides.FREE_CANDY_UPGRADE_OVERRIDE || candyCount >= passiveCost) {
              persistentStarterData.passiveAttr |= PassiveAttr.UNLOCKED | PassiveAttr.ENABLED;
              starterData.passiveAttr = persistentStarterData.passiveAttr;
              if (!Overrides.FREE_CANDY_UPGRADE_OVERRIDE) {
                persistentStarterData.candyCount -= passiveCost;
                starterData.candyCount = persistentStarterData.candyCount;
              }
              this.pokemonCandyCountText.setText(`×${starterData.candyCount}`);
              globalScene.gameData.saveSystem().then(success => {
                if (!success) {
                  return globalScene.reset(true);
                }
              });
              ui.setMode(UiMode.STARTER_SELECT);
              this.setSpeciesDetails(this.lastSpecies);
              globalScene.playSound("se/buy");

              // update the passive background and icon/animation for available upgrade
              if (starterContainer) {
                this.updateCandyUpgradeDisplay(starterContainer);
                starterContainer.starterPassiveBgs.setVisible(!!starterData.passiveAttr);
              }
              return true;
            }
            return false;
          },
          item: "candy",
          itemArgs: starterColors[this.lastSpecies.speciesId],
        });
      }

      // Reduce cost option
      const valueReduction = starterData.valueReduction;
      if (valueReduction < VALUE_REDUCTION_MAX && !globalScene.gameMode.hasChallenge(Challenges.FRESH_START)) {
        const reductionCost = getValueReductionCandyCounts(speciesStarterCosts[this.lastSpecies.speciesId])[
          valueReduction
        ];
        options.push({
          label: `×${reductionCost} ${i18next.t("starterSelectUiHandler:reduceCost")}`,
          handler: () => {
            if (Overrides.FREE_CANDY_UPGRADE_OVERRIDE || candyCount >= reductionCost) {
              persistentStarterData.valueReduction++;
              starterData.valueReduction = persistentStarterData.valueReduction;
              if (!Overrides.FREE_CANDY_UPGRADE_OVERRIDE) {
                persistentStarterData.candyCount -= reductionCost;
                starterData.candyCount = persistentStarterData.candyCount;
              }
              this.pokemonCandyCountText.setText(`×${starterData.candyCount}`);
              globalScene.gameData.saveSystem().then(success => {
                if (!success) {
                  return globalScene.reset(true);
                }
              });
              this.tryUpdateValue(0);
              ui.setMode(UiMode.STARTER_SELECT);
              globalScene.playSound("se/buy");

              // update the value label and icon/animation for available upgrade
              if (starterContainer) {
                this.updateStarterValueLabel(starterContainer);
                this.updateCandyUpgradeDisplay(starterContainer);
              }
              return true;
            }
            return false;
          },
          item: "candy",
          itemArgs: starterColors[this.lastSpecies.speciesId],
        });
      }

      // Same species egg menu option.
      const sameSpeciesEggCost = getSameSpeciesEggCandyCounts(speciesStarterCosts[this.lastSpecies.speciesId]);
      options.push({
        label: `×${sameSpeciesEggCost} ${i18next.t("starterSelectUiHandler:sameSpeciesEgg")}`,
        handler: () => {
          if (Overrides.FREE_CANDY_UPGRADE_OVERRIDE || candyCount >= sameSpeciesEggCost) {
            if (globalScene.gameData.eggs.length >= 99 && !Overrides.UNLIMITED_EGG_COUNT_OVERRIDE) {
              // Egg list full, show error message at the top of the screen and abort
              this.showText(
                i18next.t("egg:tooManyEggs"),
                undefined,
                () => this.showText("", 0, () => (this.tutorialActive = false)),
                2000,
                false,
                undefined,
                true,
              );
              return false;
            }
            if (!Overrides.FREE_CANDY_UPGRADE_OVERRIDE) {
              persistentStarterData.candyCount -= sameSpeciesEggCost;
              starterData.candyCount = persistentStarterData.candyCount;
            }
            this.pokemonCandyCountText.setText(`×${starterData.candyCount}`);

            const egg = new Egg({
              species: this.lastSpecies.speciesId,
              sourceType: EggSourceType.SAME_SPECIES_EGG,
            });
            egg.addEggToGameData();

            globalScene.gameData.saveSystem().then(success => {
              if (!success) {
                return globalScene.reset(true);
              }
            });
            ui.setMode(UiMode.STARTER_SELECT);
            globalScene.playSound("se/buy");

            // update the icon/animation for available upgrade
            if (starterContainer) {
              this.updateCandyUpgradeDisplay(starterContainer);
            }

            return true;
          }
          return false;
        },
        item: "candy",
        itemArgs: starterColors[this.lastSpecies.speciesId],
      });
      options.push({
        label: i18next.t("menu:cancel"),
        handler: () => {
          ui.setMode(UiMode.STARTER_SELECT);
          return true;
        },
      });
      ui.setModeWithoutClear(UiMode.OPTION_SELECT, {
        options: options,
        yOffset: 47,
      });
    };
    options.push({
      label: i18next.t("menuUiHandler:pokedex"),
      handler: () => {
        ui.setMode(UiMode.STARTER_SELECT).then(() => {
          const attributes = {
            shiny: starterPreferences.shiny,
            variant: starterPreferences.variant,
            form: starterPreferences.form,
            female: starterPreferences.female,
          };
          ui.setOverlayMode(UiMode.POKEDEX_PAGE, this.lastSpecies, attributes, null, null, () => {
            if (this.lastSpecies) {
              starterContainer = this.starterContainers[this.cursor];
              const persistentStarterData = globalScene.gameData.starterData[this.lastSpecies.speciesId];
              this.updateCandyUpgradeDisplay(starterContainer);
              this.updateStarterValueLabel(starterContainer);
              starterContainer.starterPassiveBgs.setVisible(
                !!persistentStarterData.passiveAttr && !globalScene.gameMode.hasChallenge(Challenges.FRESH_START),
              );
              this.setSpecies(this.lastSpecies);
            }
          });
        });
        return true;
      },
    });
    if (!pokemonPrevolutions.hasOwnProperty(this.lastSpecies.speciesId)) {
      options.push({
        label: i18next.t("starterSelectUiHandler:useCandies"),
        handler: () => {
          ui.setMode(UiMode.STARTER_SELECT).then(() => showUseCandies());
          return true;
        },
      });
    }
    options.push({
      label: i18next.t("menu:cancel"),
      handler: () => {
        ui.setMode(UiMode.STARTER_SELECT);
        return true;
      },
    });
    ui.setModeWithoutClear(UiMode.OPTION_SELECT, {
      options: options,
      yOffset: 47,
    });
  }

  processInput(button: Button): boolean {
    if (this.blockInput) {
      return false;
    }

    const numberOfStarters = this.filteredStarterIds.length;
    const numOfRows = Math.ceil(numberOfStarters / COLUMNS);
    const onScreenFirstIndex = this.scrollCursor * COLUMNS; // this is first starter index on the screen
    const onScreenLastIndex = Math.min(this.filteredStarterIds.length - onScreenFirstIndex - 1, ROWS * COLUMNS - 1); // this is the last starter index on the screen
    const currentRow = Math.floor((onScreenFirstIndex + this.cursor) / COLUMNS);
    const onScreenCurrentRow = Math.floor(this.cursor / COLUMNS);

    const ui = this.getUi();

    let success = false;
    let error = false;

    if (button === Button.SUBMIT) {
      if (this.tryStart(true)) {
        success = true;
      } else {
        error = true;
      }
    } else if (this.filterMode) {
      success = this.processFilterModeInput(button);
    } else if (button === Button.CANCEL) {
      if (this.statsMode) {
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
        this.setNoSpecies();
        this.filterBarCursor = 0;
        this.setFilterMode(true);
        this.filterBar.toggleDropDown(this.filterBarCursor);
      }
    } else if (this.starterIconsCursorObj.visible) {
      success = this.processPartyIconInput(button);
    } else if (this.startCursorObj.visible) {
      // this checks to see if the start button is selected
      [success, error] = this.processStartCursorInput(button);
    } else if (this.randomCursorObj.visible) {
      [success, error] = this.processRandomCursorInput(button);
    } else {
      if (button === Button.ACTION) {
        if (!this.speciesStarterDexEntry?.caughtAttr) {
          error = true;
        } else if (this.starterSpecies.length <= 6) {
          // checks to see if the party has 6 or fewer pokemon
          this.openPokemonMenu();
          success = true;
        }
      } else {
        if (
          [
            Button.CYCLE_SHINY,
            Button.CYCLE_FORM,
            Button.CYCLE_GENDER,
            Button.CYCLE_ABILITY,
            Button.CYCLE_NATURE,
            Button.CYCLE_TERA,
          ].includes(button)
        ) {
          success = this.processCycleButtonsInput(button);
        }

        switch (button) {
          case Button.UP:
            if (currentRow > 0) {
              if (this.scrollCursor > 0 && currentRow - this.scrollCursor === 0) {
                this.scrollCursor--;
                this.updateScroll();
                success = this.setCursor(this.cursor);
              } else {
                success = this.setCursor(this.cursor - 9);
              }
            } else {
              this.filterBarCursor = this.filterBar.getNearestFilter(this.starterContainers[this.cursor]);
              this.setFilterMode(true);
              success = true;
            }
            break;
          case Button.DOWN:
            if (currentRow < numOfRows - 1 && this.cursor + 9 < this.filteredStarterIds.length) {
              // not last row
              if (currentRow - this.scrollCursor === 8) {
                // last row of visible starters
                this.scrollCursor++;
                this.updateScroll();
                success = this.setCursor(this.cursor);
              } else {
                success = this.setCursor(this.cursor + 9);
              }
            } else if (numOfRows > 1) {
              // DOWN from last row of Pokemon > Wrap around to first row
              this.scrollCursor = 0;
              this.updateScroll();
              success = this.setCursor(this.cursor % 9);
            } else {
              // DOWN from single row of Pokemon > Go to filters
              this.filterBarCursor = this.filterBar.getNearestFilter(this.starterContainers[this.cursor]);
              this.setFilterMode(true);
              success = true;
            }
            break;
          case Button.LEFT:
            if (this.cursor % 9 !== 0) {
              success = this.setCursor(this.cursor - 1);
            } else {
              // LEFT from filtered Pokemon, on the left edge
              if (onScreenCurrentRow === 0) {
                // from the first row of starters we go to the random selection
                this.cursorObj.setVisible(false);
                this.showRandomCursor();
              } else if (this.starterSpecies.length === 0) {
                // no starter in team and not on first row > wrap around to the last column
                success = this.setCursor(this.cursor + Math.min(8, onScreenLastIndex - this.cursor));
              } else if (onScreenCurrentRow < 7) {
                // at least one pokemon in team > for the first 7 rows, go to closest starter
                this.cursorObj.setVisible(false);
                this.starterIconsCursorIndex = findClosestStarterIndex(
                  this.cursorObj.y - 1,
                  this.starterSpecies.length,
                );
                this.moveStarterIconsCursor(this.starterIconsCursorIndex);
              } else {
                // at least one pokemon in team > from the bottom 2 rows, go to start run button
                this.cursorObj.setVisible(false);
                this.setNoSpecies();
                this.startCursorObj.setVisible(true);
              }
              success = true;
            }
            break;
          case Button.RIGHT:
            // is not right edge
            if (this.cursor % 9 < (currentRow < numOfRows - 1 ? 8 : (numberOfStarters - 1) % 9)) {
              success = this.setCursor(this.cursor + 1);
            } else {
              // RIGHT from filtered Pokemon, on the right edge
              if (onScreenCurrentRow === 0) {
                // from the first row of starters we go to the random selection
                this.cursorObj.setVisible(false);
                this.showRandomCursor();
              } else if (this.starterSpecies.length === 0) {
                // no selected starter in team > wrap around to the first column
                success = this.setCursor(this.cursor - Math.min(8, this.cursor % 9));
              } else if (onScreenCurrentRow < 7) {
                // at least one pokemon in team > for the first 7 rows, go to closest starter
                this.cursorObj.setVisible(false);
                this.starterIconsCursorIndex = findClosestStarterIndex(
                  this.cursorObj.y - 1,
                  this.starterSpecies.length,
                );
                this.moveStarterIconsCursor(this.starterIconsCursorIndex);
              } else {
                // at least one pokemon in team > from the bottom 2 rows, go to start run button
                this.cursorObj.setVisible(false);
                this.setNoSpecies();
                this.startCursorObj.setVisible(true);
              }
              success = true;
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

  addToParty(
    species: PokemonSpecies,
    dexAttr: bigint,
    abilityIndex: number,
    nature: Nature,
    moveset: StarterMoveset,
    teraType: PokemonType,
    randomSelection = false,
  ) {
    const props = globalScene.gameData.getSpeciesDexAttrProps(species, dexAttr);
    this.starterIcons[this.starterSpecies.length].setTexture(
      species.getIconAtlasKey(props.formIndex, props.shiny, props.variant),
    );
    this.starterIcons[this.starterSpecies.length].setFrame(
      species.getIconId(props.female, props.formIndex, props.shiny, props.variant),
    );
    this.checkIconId(
      this.starterIcons[this.starterSpecies.length],
      species,
      props.female,
      props.formIndex,
      props.shiny,
      props.variant,
    );

    this.starterSpecies.push(species);
    this.starterAttr.push(dexAttr);
    this.starterAbilityIndexes.push(abilityIndex);
    this.starterNatures.push(nature);
    this.starterTeras.push(teraType);
    this.starterMovesets.push(moveset);
    if (this.speciesLoaded.get(species.speciesId) || randomSelection) {
      getPokemonSpeciesForm(species.speciesId, props.formIndex).cry();
    }
    this.updateInstructions();
  }

  updatePartyIcon(species: PokemonSpecies, index: number) {
    const props = globalScene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId));
    this.starterIcons[index].setTexture(species.getIconAtlasKey(props.formIndex, props.shiny, props.variant));
    this.starterIcons[index].setFrame(species.getIconId(props.female, props.formIndex, props.shiny, props.variant));
    this.checkIconId(this.starterIcons[index], species, props.female, props.formIndex, props.shiny, props.variant);
  }

  /**
   * Puts a move at the requested index in the current highlighted Pokemon's moveset.
   * If the move was already present in the moveset, swap its position with the one at the requested index.
   *
   * @remarks
   * ⚠️ {@linkcode starterMoveset | this.starterMoveset} **must not be null when this method is called**
   * @param targetIndex - The index to place the move
   * @param newMove - The move to place in the moveset
   * @param previousMove - The move that was previously in the spot
   */
  switchMoveHandler(targetIndex: number, newMove: MoveId, previousMove: MoveId) {
    const starterMoveset = this.starterMoveset;
    if (isNullOrUndefined(starterMoveset)) {
      console.warn("Trying to update a non-existing moveset");
      return;
    }

    const speciesId = this.lastSpecies.speciesId;
    const existingMoveIndex = starterMoveset.indexOf(newMove);
    starterMoveset[targetIndex] = newMove;
    if (existingMoveIndex !== -1) {
      starterMoveset[existingMoveIndex] = previousMove;
    }
    const updatedMoveset = starterMoveset.slice() as StarterMoveset;
    const formIndex = globalScene.gameData.getSpeciesDexAttrProps(this.lastSpecies, this.dexAttrCursor).formIndex;
    const starterDataEntry = globalScene.gameData.starterData[speciesId];
    // species has different forms
    if (pokemonFormLevelMoves.hasOwnProperty(speciesId)) {
      // Species has forms with different movesets
      if (!starterDataEntry.moveset || Array.isArray(starterDataEntry.moveset)) {
        starterDataEntry.moveset = {};
      }
      starterDataEntry.moveset[formIndex] = updatedMoveset;
    } else {
      starterDataEntry.moveset = updatedMoveset;
    }
    this.hasSwappedMoves = true;
    this.setSpeciesDetails(this.lastSpecies, { forSeen: false });
    this.updateSelectedStarterMoveset(speciesId);
  }

  /**
   * Update the starter moveset for the given species if it is part of the selected starters.
   *
   * @remarks
   * It is safe to call with a species that is not part of the selected starters.
   *
   * @param id - The species ID to update the moveset for
   */
  private updateSelectedStarterMoveset(id: SpeciesId): void {
    if (this.starterMoveset === null) {
      return;
    }

    for (const [index, species] of this.starterSpecies.entries()) {
      if (species.speciesId === id) {
        this.starterMovesets[index] = this.starterMoveset;
      }
    }
  }

  updateButtonIcon(
    iconSetting: SettingKeyboard,
    gamepadType: string,
    iconElement: GameObjects.Sprite,
    controlLabel: GameObjects.Text,
  ): void {
    let iconPath: string;
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
        case SettingKeyboard.Button_Cycle_Tera:
          iconPath = "V.png";
          break;
        case SettingKeyboard.Button_Stats:
          iconPath = "C.png";
          break;
        default:
          break;
      }
    } else {
      iconPath = globalScene.inputController?.getIconForLatestInputRecorded(iconSetting);
    }
    // The bang for iconPath is correct as long the cases in the above switch statement handle all `SettingKeyboard` values enabled in touch mode
    iconElement
      .setTexture(gamepadType, iconPath!)
      .setPosition(this.instructionRowX, this.instructionRowY)
      .setVisible(true);
    controlLabel
      .setPosition(this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY)
      .setVisible(true);
    this.instructionsContainer.add([iconElement, controlLabel]);
    this.instructionRowY += 8;
    if (this.instructionRowY >= 24) {
      this.instructionRowY = 0;
      this.instructionRowX += 50;
    }
  }

  updateFilterButtonIcon(
    iconSetting: SettingKeyboard,
    gamepadType: string,
    iconElement: GameObjects.Sprite,
    controlLabel: GameObjects.Text,
  ): void {
    let iconPath: string;
    // touch controls cannot be rebound as is, and are just emulating a keyboard event.
    // Additionally, since keyboard controls can be rebound (and will be displayed when they are), we need to have special handling for the touch controls
    if (gamepadType === "touch") {
      gamepadType = "keyboard";
      iconPath = "C.png";
    } else {
      iconPath = globalScene.inputController?.getIconForLatestInputRecorded(iconSetting);
    }
    iconElement
      .setTexture(gamepadType, iconPath)
      .setPosition(this.filterInstructionRowX, this.filterInstructionRowY)
      .setVisible(true);
    controlLabel
      .setPosition(this.filterInstructionRowX + this.instructionRowTextOffset, this.filterInstructionRowY)
      .setVisible(true);
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
    let gamepadType: string;
    if (globalScene.inputMethod === "gamepad") {
      gamepadType = globalScene.inputController.getConfig(
        globalScene.inputController.selectedDevice[Device.GAMEPAD],
      ).padType;
    } else {
      gamepadType = globalScene.inputMethod;
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
        this.updateButtonIcon(
          SettingKeyboard.Button_Cycle_Gender,
          gamepadType,
          this.genderIconElement,
          this.genderLabel,
        );
      }
      if (this.canCycleAbility) {
        this.updateButtonIcon(
          SettingKeyboard.Button_Cycle_Ability,
          gamepadType,
          this.abilityIconElement,
          this.abilityLabel,
        );
      }
      if (this.canCycleNature) {
        this.updateButtonIcon(
          SettingKeyboard.Button_Cycle_Nature,
          gamepadType,
          this.natureIconElement,
          this.natureLabel,
        );
      }
      if (this.canCycleTera) {
        this.updateButtonIcon(SettingKeyboard.Button_Cycle_Tera, gamepadType, this.teraIconElement, this.teraLabel);
      }
    }

    // if filter mode is inactivated and gamepadType is not undefined, update the button icons
    if (!this.filterMode) {
      this.updateFilterButtonIcon(
        SettingKeyboard.Button_Stats,
        gamepadType,
        this.goFilterIconElement,
        this.goFilterLabel,
      );
    }
  }

  getValueLimit(): number {
    const valueLimit = new NumberHolder(0);
    switch (globalScene.gameMode.modeId) {
      case GameModes.ENDLESS:
      case GameModes.SPLICED_ENDLESS:
        valueLimit.value = 15;
        break;
      default:
        valueLimit.value = 10;
    }

    applyChallenges(ChallengeType.STARTER_POINTS, valueLimit);

    return valueLimit.value;
  }

  updateStarters = () => {
    this.scrollCursor = 0;
    this.filteredStarterIds = [];

    // biome-ignore-start lint/nursery/useIterableCallbackReturn: benign
    this.pokerusCursorObjs.forEach(cursor => cursor.setVisible(false));
    this.starterCursorObjs.forEach(cursor => cursor.setVisible(false));
    // biome-ignore-end lint/nursery/useIterableCallbackReturn: benign

    this.filterBar.updateFilterLabels();

    // filter
    this.allStarterSpecies.forEach(species => {
      // Exclude starters which are not valid for the challenge
      if (globalScene.gameMode.modeId === GameModes.CHALLENGE && !isStarterValidForChallenge(species)) {
        // TODO: figure out what to put here
      }

      // First, ensure you have the caught attributes for the species else default to bigint 0
      const { dexEntry, starterDataEntry: starterData } = this.getSpeciesData(species.speciesId);
      const caughtAttr = dexEntry?.caughtAttr ?? BigInt(0);
      const isStarterProgressable = speciesEggMoves.hasOwnProperty(species.speciesId);

      // Gen filter
      const fitsGen = this.filterBar.getVals(DropDownColumn.GEN).includes(species.generation);

      // Type filter
      const fitsType = this.filterBar
        .getVals(DropDownColumn.TYPES)
        .some(type => species.isOfType((type as number) - 1));

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
        }
        if (caught === "SHINY2") {
          return isVariant2Caught && !isVariant3Caught;
        }
        if (caught === "SHINY") {
          return isVariant1Caught && !isVariant2Caught && !isVariant3Caught;
        }
        if (caught === "NORMAL") {
          return isNonShinyCaught && !isVariant1Caught && !isVariant2Caught && !isVariant3Caught;
        }
        if (caught === "UNCAUGHT") {
          return isUncaught;
        }
      });

      // Passive Filter
      const isPassiveUnlocked = starterData.passiveAttr > 0;
      const isPassiveUnlockable = isPassiveAvailable(species.speciesId) && !isPassiveUnlocked;
      const fitsPassive = this.filterBar.getVals(DropDownColumn.UNLOCKS).some(unlocks => {
        if (unlocks.val === "PASSIVE" && unlocks.state === DropDownState.ON) {
          return isPassiveUnlocked;
        }
        if (unlocks.val === "PASSIVE" && unlocks.state === DropDownState.EXCLUDE) {
          return isStarterProgressable && !isPassiveUnlocked;
        }
        if (unlocks.val === "PASSIVE" && unlocks.state === DropDownState.UNLOCKABLE) {
          return isPassiveUnlockable;
        }
        if (unlocks.val === "PASSIVE" && unlocks.state === DropDownState.OFF) {
          return true;
        }
      });

      // Cost Reduction Filter
      const isCostReducedByOne = starterData.valueReduction === 1;
      const isCostReducedByTwo = starterData.valueReduction === 2;
      const isCostReductionUnlockable = isValueReductionAvailable(species.speciesId);
      const fitsCostReduction = this.filterBar.getVals(DropDownColumn.UNLOCKS).some(unlocks => {
        if (unlocks.val === "COST_REDUCTION" && unlocks.state === DropDownState.ON) {
          return isCostReducedByOne || isCostReducedByTwo;
        }
        if (unlocks.val === "COST_REDUCTION" && unlocks.state === DropDownState.ONE) {
          return isCostReducedByOne;
        }
        if (unlocks.val === "COST_REDUCTION" && unlocks.state === DropDownState.TWO) {
          return isCostReducedByTwo;
        }
        if (unlocks.val === "COST_REDUCTION" && unlocks.state === DropDownState.EXCLUDE) {
          return isStarterProgressable && !(isCostReducedByOne || isCostReducedByTwo);
        }
        if (unlocks.val === "COST_REDUCTION" && unlocks.state === DropDownState.UNLOCKABLE) {
          return isCostReductionUnlockable;
        }
        if (unlocks.val === "COST_REDUCTION" && unlocks.state === DropDownState.OFF) {
          return true;
        }
      });

      // Favorite Filter
      const isFavorite = this.starterPreferences[species.speciesId]?.favorite ?? false;
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
        }
        if (misc.val === "WIN" && misc.state === DropDownState.EXCLUDE) {
          return hasNotWon || isUndefined;
        }
        if (misc.val === "WIN" && misc.state === DropDownState.OFF) {
          return true;
        }
      });

      // HA Filter
      const speciesHasHiddenAbility =
        species.abilityHidden !== species.ability1 && species.abilityHidden !== AbilityId.NONE;
      const hasHA = starterData.abilityAttr & AbilityAttr.ABILITY_HIDDEN;
      const fitsHA = this.filterBar.getVals(DropDownColumn.MISC).some(misc => {
        if (misc.val === "HIDDEN_ABILITY" && misc.state === DropDownState.ON) {
          return hasHA;
        }
        if (misc.val === "HIDDEN_ABILITY" && misc.state === DropDownState.EXCLUDE) {
          return speciesHasHiddenAbility && !hasHA;
        }
        if (misc.val === "HIDDEN_ABILITY" && misc.state === DropDownState.OFF) {
          return true;
        }
      });

      // Egg Purchasable Filter
      const isEggPurchasable = isSameSpeciesEggAvailable(species.speciesId);
      const fitsEgg = this.filterBar.getVals(DropDownColumn.MISC).some(misc => {
        if (misc.val === "EGG" && misc.state === DropDownState.ON) {
          return isEggPurchasable;
        }
        if (misc.val === "EGG" && misc.state === DropDownState.EXCLUDE) {
          return isStarterProgressable && !isEggPurchasable;
        }
        if (misc.val === "EGG" && misc.state === DropDownState.OFF) {
          return true;
        }
      });

      // Pokerus Filter
      const fitsPokerus = this.filterBar.getVals(DropDownColumn.MISC).some(misc => {
        if (misc.val === "POKERUS" && misc.state === DropDownState.ON) {
          return this.pokerusSpecies.includes(species);
        }
        if (misc.val === "POKERUS" && misc.state === DropDownState.EXCLUDE) {
          return !this.pokerusSpecies.includes(species);
        }
        if (misc.val === "POKERUS" && misc.state === DropDownState.OFF) {
          return true;
        }
      });

      if (
        fitsGen &&
        fitsType &&
        fitsCaught &&
        fitsPassive &&
        fitsCostReduction &&
        fitsFavorite &&
        fitsWin &&
        fitsHA &&
        fitsEgg &&
        fitsPokerus
      ) {
        this.filteredStarterIds.push(species.speciesId);
      }
    });

    this.starterSelectScrollBar.setTotalRows(Math.max(Math.ceil(this.filteredStarterIds.length / 9), 1));
    this.starterSelectScrollBar.setScrollCursor(0);

    // sort
    const sort = this.filterBar.getVals(DropDownColumn.SORT)[0];
    this.filteredStarterIds.sort((a, b) => {
      switch (sort.val) {
        case SortCriteria.NUMBER:
          return (a - b) * -sort.dir;
        case SortCriteria.COST:
          return (
            (globalScene.gameData.getSpeciesStarterValue(a) - globalScene.gameData.getSpeciesStarterValue(b)) *
            -sort.dir
          );
        case SortCriteria.CANDY: {
          const candyCountA = globalScene.gameData.starterData[a].candyCount;
          const candyCountB = globalScene.gameData.starterData[b].candyCount;
          return (candyCountA - candyCountB) * -sort.dir;
        }
        case SortCriteria.IV: {
          const avgIVsA =
            globalScene.gameData.dexData[a].ivs.reduce((a, b) => a + b, 0) / globalScene.gameData.dexData[a].ivs.length;
          const avgIVsB =
            globalScene.gameData.dexData[b].ivs.reduce((a, b) => a + b, 0) / globalScene.gameData.dexData[b].ivs.length;
          return (avgIVsA - avgIVsB) * -sort.dir;
        }
        case SortCriteria.NAME:
          return getPokemonSpecies(a).name.localeCompare(getPokemonSpecies(b).name) * -sort.dir;
        case SortCriteria.CAUGHT:
          return (
            (globalScene.gameData.dexData[a].caughtCount - globalScene.gameData.dexData[b].caughtCount) * -sort.dir
          );
        case SortCriteria.HATCHED:
          return (
            (globalScene.gameData.dexData[a].hatchedCount - globalScene.gameData.dexData[b].hatchedCount) * -sort.dir
          );
      }
      return 0;
    });

    this.updateScroll();
  };

  override destroy(): void {
    // Without this the reference gets hung up and no startercontainers get GCd
    this.starterContainers = [];
    /* TODO: Uncomment this once our testing infra supports mocks of `Phaser.GameObject.Group`
    this.instructionElemGroup.destroy(true);
    */
  }

  updateScroll = () => {
    const onScreenFirstIndex = this.scrollCursor * COLUMNS;

    this.starterSelectScrollBar.setScrollCursor(this.scrollCursor);

    let pokerusCursorIndex = 0;
    this.starterContainers.forEach((container, i) => {
      const offset_i = i + onScreenFirstIndex;
      if (offset_i >= this.filteredStarterIds.length) {
        container.setVisible(false);
      } else {
        container.setVisible(true);

        const speciesId = this.filteredStarterIds[offset_i];
        const species = getPokemonSpecies(speciesId);
        const { dexEntry, starterDataEntry } = this.getSpeciesData(species.speciesId);
        const props = globalScene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId));

        container.setSpecies(species, props);

        const starterSprite = container.icon as Phaser.GameObjects.Sprite;
        starterSprite.setTexture(
          species.getIconAtlasKey(props.formIndex, props.shiny, props.variant),
          container.species.getIconId(props.female!, props.formIndex, props.shiny, props.variant),
        );
        container.checkIconId(props.female, props.formIndex, props.shiny, props.variant);

        const caughtAttr = dexEntry.caughtAttr;

        if (caughtAttr & species.getFullUnlocksData() || globalScene.dexForDevs) {
          container.icon.clearTint();
        } else if (dexEntry.seenAttr) {
          container.icon.setTint(0x808080);
        } else {
          container.icon.setTint(0);
        }

        if (this.pokerusSpecies.includes(container.species)) {
          this.pokerusCursorObjs[pokerusCursorIndex].setPosition(container.x - 1, container.y + 1).setVisible(false);
          pokerusCursorIndex++;
        }

        if (this.starterSpecies.includes(container.species)) {
          this.starterCursorObjs[this.starterSpecies.indexOf(container.species)]
            .setPosition(container.x - 1, container.y + 1)
            .setVisible(false);
        }

        this.updateStarterValueLabel(container);

        container.label.setVisible(true);
        const speciesVariants =
          speciesId && dexEntry.caughtAttr & DexAttr.SHINY
            ? [DexAttr.DEFAULT_VARIANT, DexAttr.VARIANT_2, DexAttr.VARIANT_3].filter(v => !!(dexEntry.caughtAttr & v))
            : [];
        for (let v = 0; v < 3; v++) {
          const hasVariant = speciesVariants.length > v;
          container.shinyIcons[v].setVisible(hasVariant);
          if (hasVariant) {
            container.shinyIcons[v].setTint(
              getVariantTint(
                speciesVariants[v] === DexAttr.DEFAULT_VARIANT ? 0 : speciesVariants[v] === DexAttr.VARIANT_2 ? 1 : 2,
              ),
            );
          }
        }

        container.starterPassiveBgs.setVisible(!!starterDataEntry.passiveAttr);
        container.hiddenAbilityIcon.setVisible(!!dexEntry.caughtAttr && !!(starterDataEntry.abilityAttr & 4));
        container.classicWinIcon
          .setVisible(starterDataEntry.classicWinCount > 0)
          .setTexture(dexEntry.ribbons.has(RibbonData.NUZLOCKE) ? "champion_ribbon_emerald" : "champion_ribbon");
        container.favoriteIcon.setVisible(this.starterPreferences[speciesId]?.favorite ?? false);

        // 'Candy Icon' mode
        if (globalScene.candyUpgradeDisplay === 0) {
          if (!starterColors[speciesId]) {
            // Default to white if no colors are found
            starterColors[speciesId] = ["ffffff", "ffffff"];
          }

          // Set the candy colors
          container.candyUpgradeIcon.setTint(argbFromRgba(rgbHexToRgba(starterColors[speciesId][0])));
          container.candyUpgradeOverlayIcon.setTint(argbFromRgba(rgbHexToRgba(starterColors[speciesId][1])));

          this.setUpgradeIcon(container);
        } else if (globalScene.candyUpgradeDisplay === 1) {
          container.candyUpgradeIcon.setVisible(false);
          container.candyUpgradeOverlayIcon.setVisible(false);
        }
      }
    });
  };

  setCursor(cursor: number): boolean {
    let changed = false;
    this.oldCursor = this.cursor;

    if (this.filterMode) {
      changed = this.filterBarCursor !== cursor;
      this.filterBarCursor = cursor;

      this.filterBar.setCursor(cursor);
    } else {
      cursor = Math.max(Math.min(this.starterContainers.length - 1, cursor), 0);
      changed = super.setCursor(cursor);

      const pos = calcStarterContainerPosition(cursor);
      this.cursorObj.setPosition(pos.x - 1, pos.y + 1);

      const species = this.starterContainers[cursor]?.species; // TODO: why is there a "?"

      if (species) {
        // TODO: check if this is needed
        /**
        const defaultDexAttr = this.getCurrentDexProps(species.speciesId);
        const defaultProps = globalScene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
        // Bang is correct due to the `?` before variant
        const variant = this.starterPreferences[species.speciesId]?.variant
          ? (this.starterPreferences[species.speciesId]!.variant as Variant)
          : defaultProps.variant;
        const tint = getVariantTint(variant);
        this.pokemonShinyIcon.setFrame(getVariantIcon(variant)).setTint(tint);
         */
        this.setSpecies(species);
        this.updateInstructions();
      } else {
        this.setNoSpecies();
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
        this.setNoSpecies(); //TODO: this probably needs to go somewhere else
        this.updateInstructions();
      }

      return true;
    }

    return false;
  }

  moveStarterIconsCursor(index: number): void {
    this.starterIconsCursorObj.setPositionRelative(
      this.starterIcons[index],
      this.starterIconsCursorXOffset,
      this.starterIconsCursorYOffset,
    );
    if (this.starterSpecies.length > 0) {
      this.starterIconsCursorObj.setVisible(true);
      this.setSpecies(this.starterSpecies[index]);
    } else {
      this.starterIconsCursorObj.setVisible(false);
      this.setNoSpecies();
    }
  }

  getFriendship(speciesId: number) {
    let currentFriendship = globalScene.gameData.starterData[speciesId].friendship;
    if (!currentFriendship || currentFriendship === undefined) {
      currentFriendship = 0;
    }

    const friendshipCap = getStarterValueFriendshipCap(speciesStarterCosts[speciesId]);

    return { currentFriendship, friendshipCap };
  }

  setNoSpecies() {
    this.speciesStarterDexEntry = null;
    this.dexAttrCursor = 0n;
    this.abilityCursor = 0;
    this.natureCursor = 0;
    this.teraCursor = PokemonType.UNKNOWN;

    if (globalScene.ui.getTooltip().visible) {
      globalScene.ui.hideTooltip();
    }

    this.pokemonAbilityText.off("pointerover");
    this.pokemonPassiveText.off("pointerover");

    if (this.statsMode) {
      this.statsContainer.setVisible(false);
    }

    if (this.lastSpecies) {
      this.stopIconAnimation(this.oldCursor);
    }

    // TODO: check if we need to set lastSpecies to null or some other value here

    this.cleanStarterSprite();
  }

  setNameAndNumber(species: PokemonSpecies) {
    this.pokemonNumberText.setText(padInt(species.speciesId, 4));

    const starterPreferences = this.starterPreferences[species.speciesId];
    if (starterPreferences?.nickname) {
      const name = decodeURIComponent(escape(atob(starterPreferences.nickname)));
      this.pokemonNameText.setText(name);
    } else {
      this.pokemonNameText.setText(species.name);
    }
  }

  setSpecies(species: PokemonSpecies) {
    // First, we load from the dex entry to get defaults
    const { dexEntry } = this.getSpeciesData(species.speciesId);
    this.speciesStarterDexEntry = dexEntry;
    this.dexAttrCursor = this.getCurrentDexProps(species.speciesId);
    this.abilityCursor = globalScene.gameData.getStarterSpeciesDefaultAbilityIndex(species);
    this.natureCursor = globalScene.gameData.getSpeciesDefaultNature(species, dexEntry);
    this.teraCursor = species.type1;

    this.pokemonAbilityText.off("pointerover");
    this.pokemonPassiveText.off("pointerover");

    // Then, we override with preferences, if they exist
    const starterPreferences = this.starterPreferences[species.speciesId];
    if (starterPreferences?.nature) {
      this.natureCursor = starterPreferences.nature;
    }
    if (starterPreferences?.ability && !Number.isNaN(starterPreferences.ability)) {
      this.abilityCursor = starterPreferences.ability;
    }
    if (starterPreferences?.tera) {
      this.teraCursor = starterPreferences.tera;
    }

    // Hiding ivs container if the species is not caught
    if (this.statsMode) {
      if (this.speciesStarterDexEntry?.caughtAttr) {
        this.statsContainer.setVisible(true);
        this.showStats();
      } else {
        this.statsContainer.setVisible(false);
      }
    }

    if (this.lastSpecies) {
      this.stopIconAnimation(this.oldCursor);
    }

    this.lastSpecies = species;

    if (this.speciesStarterDexEntry?.caughtAttr) {
      this.setNameAndNumber(species);
      const colorScheme = starterColors[species.speciesId];

      this.pokemonPermanentInfoContainer.setVisible(true);
      this.pokemonStatisticsContainer.setVisible(true);

      const luck = globalScene.gameData.getDexAttrLuck(this.speciesStarterDexEntry.caughtAttr);
      this.pokemonLuckText
        .setVisible(!!luck)
        .setText(luck.toString())
        .setTint(getVariantTint(Math.min(luck - 1, 2) as Variant));
      this.pokemonLuckLabelText.setVisible(this.pokemonLuckText.visible);

      //Growth translate
      let growthReadable = toTitleCase(GrowthRate[species.growthRate]);
      const growthAux = toCamelCase(growthReadable);
      if (i18next.exists("growth:" + growthAux)) {
        growthReadable = i18next.t(("growth:" + growthAux) as any);
      }
      this.pokemonGrowthRateText
        .setText(growthReadable)
        .setColor(getGrowthRateColor(species.growthRate))
        .setShadowColor(getGrowthRateColor(species.growthRate, true));
      this.pokemonGrowthRateLabelText.setVisible(true);
      this.pokemonUncaughtText.setVisible(false);
      this.pokemonAbilityLabelText.setVisible(true);
      this.pokemonPassiveLabelText.setVisible(true);
      this.pokemonNatureLabelText.setVisible(true);
      this.pokemonCaughtCountText.setText(`${this.speciesStarterDexEntry.caughtCount}`);
      if (species.speciesId === SpeciesId.MANAPHY || species.speciesId === SpeciesId.PHIONE) {
        this.pokemonHatchedIcon.setFrame("manaphy");
      } else {
        this.pokemonHatchedIcon.setFrame(getEggTierForSpecies(species));
      }
      this.pokemonHatchedCountText.setText(`${this.speciesStarterDexEntry.hatchedCount}`);

      const defaultDexAttr = this.getCurrentDexProps(species.speciesId);
      const defaultProps = globalScene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
      const variant = defaultProps.variant;
      const tint = getVariantTint(variant);
      this.pokemonShinyIcon.setFrame(getVariantIcon(variant)).setTint(tint).setVisible(defaultProps.shiny);
      this.pokemonCaughtHatchedContainer.setVisible(true);
      this.pokemonFormText.setVisible(true);

      if (pokemonPrevolutions.hasOwnProperty(species.speciesId)) {
        this.pokemonCaughtHatchedContainer.setY(16);
        this.pokemonShinyIcon.setY(104).setFrame(getVariantIcon(variant));
        [this.pokemonCandyContainer, this.pokemonHatchedIcon, this.pokemonHatchedCountText].map(c =>
          c.setVisible(false),
        );
        this.pokemonFormText.setY(25);
      } else {
        this.pokemonCaughtHatchedContainer.setY(25);
        this.pokemonShinyIcon.setY(86);
        this.pokemonCandyIcon.setTint(argbFromRgba(rgbHexToRgba(colorScheme[0])));
        this.pokemonCandyOverlayIcon.setTint(argbFromRgba(rgbHexToRgba(colorScheme[1])));
        this.pokemonCandyCountText.setText(`×${globalScene.gameData.starterData[species.speciesId].candyCount}`);
        this.pokemonFormText.setY(42);
        this.pokemonHatchedIcon.setVisible(true);
        this.pokemonHatchedCountText.setVisible(true);

        const { currentFriendship, friendshipCap } = this.getFriendship(this.lastSpecies.speciesId);
        const candyCropY = 16 - 16 * (currentFriendship / friendshipCap);
        this.pokemonCandyDarknessOverlay.setCrop(0, 0, 16, candyCropY);

        this.pokemonCandyContainer
          .setVisible(true)
          .on("pointerover", () => {
            globalScene.ui.showTooltip("", `${currentFriendship}/${friendshipCap}`, true);
            this.activeTooltip = "CANDY";
          })
          .on("pointerout", () => {
            globalScene.ui.hideTooltip();
            this.activeTooltip = undefined;
          });
      }

      this.startIconAnimation(this.cursor);

      const starterIndex = this.starterSpecies.indexOf(species);

      let props: DexAttrProps;

      if (starterIndex > -1) {
        props = globalScene.gameData.getSpeciesDexAttrProps(species, this.starterAttr[starterIndex]);
        this.setSpeciesDetails(
          species,
          {
            shiny: props.shiny,
            formIndex: props.formIndex,
            female: props.female,
            variant: props.variant,
            abilityIndex: this.starterAbilityIndexes[starterIndex],
            natureIndex: this.starterNatures[starterIndex],
            teraType: this.starterTeras[starterIndex],
          },
          false,
        );
      } else {
        const defaultAbilityIndex =
          starterPreferences?.ability ?? globalScene.gameData.getStarterSpeciesDefaultAbilityIndex(species);
        // load default nature from stater save data, if set
        const { dexEntry } = this.getSpeciesData(species.speciesId);
        const defaultNature =
          starterPreferences?.nature || globalScene.gameData.getSpeciesDefaultNature(species, dexEntry);
        props = globalScene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
        if (starterPreferences?.variant && !Number.isNaN(starterPreferences.variant)) {
          if (props.shiny) {
            props.variant = starterPreferences.variant as Variant;
          }
        }
        props.formIndex = starterPreferences?.form ?? props.formIndex;
        props.female = starterPreferences?.female ?? props.female;

        this.setSpeciesDetails(
          species,
          {
            shiny: props.shiny,
            formIndex: props.formIndex,
            female: props.female,
            variant: props.variant,
            abilityIndex: defaultAbilityIndex,
            natureIndex: defaultNature,
            teraType: starterPreferences?.tera,
          },
          false,
        );
      }

      if (!isNullOrUndefined(props.formIndex)) {
        // If switching forms while the pokemon is in the team, update its moveset
        this.updateSelectedStarterMoveset(species.speciesId);
      }

      const speciesForm = getPokemonSpeciesForm(species.speciesId, props.formIndex);
      this.setTypeIcons(speciesForm.type1, speciesForm.type2);

      this.pokemonSprite.clearTint();
      if (this.pokerusSpecies.includes(species)) {
        handleTutorial(Tutorial.Pokerus);
      }
    } else if (this.speciesStarterDexEntry?.seenAttr) {
      this.cleanStarterSprite(species, true);

      const props = globalScene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId));

      const formIndex = props.formIndex;
      const female = props.female;
      const shiny = props.shiny;
      const variant = props.variant;

      this.updateSprite(species, female, formIndex, shiny, variant);
      this.pokemonSprite.setVisible(true);
      this.pokemonSprite.setTint(0x808080);
    } else {
      this.cleanStarterSprite(species);

      const props = globalScene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId));

      const formIndex = props.formIndex;
      const female = props.female;
      const shiny = props.shiny;
      const variant = props.variant;

      this.updateSprite(species, female, formIndex, shiny, variant);
      this.pokemonSprite.setVisible(true);
      this.pokemonSprite.setTint(0x000000);
    }
  }

  startIconAnimation(cursor: number) {
    const container = this.starterContainers[cursor];
    const icon = container.icon;
    if (this.isUpgradeAnimationEnabled()) {
      globalScene.tweens.getTweensOf(icon).forEach(tween => tween.pause());
      // Reset the position of the icon
      icon.x = -2;
      icon.y = 2;
    }
    // Initiates the small up and down idle animation
    this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.PASSIVE);
  }

  stopIconAnimation(cursor: number) {
    const container = this.starterContainers[cursor];
    if (container) {
      const lastSpeciesIcon = container.icon;
      const dexAttr = this.getCurrentDexProps(container.species.speciesId);
      const props = globalScene.gameData.getSpeciesDexAttrProps(container.species, dexAttr);
      this.checkIconId(lastSpeciesIcon, container.species, props.female, props.formIndex, props.shiny, props.variant);
      this.iconAnimHandler.addOrUpdate(lastSpeciesIcon, PokemonIconAnimMode.NONE);
      // Resume the animation for the previously selected species
      globalScene.tweens.getTweensOf(lastSpeciesIcon).forEach(tween => tween.resume());
    }
  }

  cleanStarterSprite(species?: PokemonSpecies, isSeen = false) {
    if (isSeen && species) {
      this.setNameAndNumber(species);
    } else {
      this.pokemonNumberText.setText(padInt(0, 4));
      this.pokemonNameText.setText(species ? "???" : "");
    }

    this.pokemonSprite.setVisible(!!species);
    this.pokemonUncaughtText.setVisible(!!species);

    this.pokemonPermanentInfoContainer.setVisible(false);
    this.pokemonStatisticsContainer.setVisible(false);
    this.setNoSpeciesDetails();
  }

  getSpeciesData(
    speciesId: SpeciesId,
    applyChallenge = true,
  ): { dexEntry: DexEntry; starterDataEntry: StarterDataEntry } {
    const dexEntry = globalScene.gameData.dexData[speciesId];
    const starterDataEntry = globalScene.gameData.starterData[speciesId];

    // Unpacking to make a copy by values, not references
    const copiedDexEntry = { ...dexEntry };
    copiedDexEntry.ivs = [...dexEntry.ivs];
    const copiedStarterDataEntry = { ...starterDataEntry };
    if (applyChallenge) {
      applyChallenges(ChallengeType.STARTER_SELECT_MODIFY, speciesId, copiedDexEntry, copiedStarterDataEntry);
    }
    return { dexEntry: { ...copiedDexEntry }, starterDataEntry: { ...copiedStarterDataEntry } };
  }

  setNoSpeciesDetails() {
    this.dexAttrCursor = 0n;
    this.abilityCursor = -1;
    this.natureCursor = -1;
    this.teraCursor = PokemonType.UNKNOWN;

    globalScene.ui.hideTooltip();

    this.pokemonPreferencesContainer.setVisible(false);

    if (this.assetLoadCancelled) {
      this.assetLoadCancelled.value = true;
      this.assetLoadCancelled = null;
    }

    this.starterMoveset = null;
    this.speciesStarterMoves = [];

    this.shinyOverlay.setVisible(false);
    this.pokemonNumberText
      .setColor(this.getTextColor(TextStyle.SUMMARY))
      .setShadowColor(this.getTextColor(TextStyle.SUMMARY, true));

    for (let m = 0; m < 4; m++) {
      this.pokemonMoveContainers[m].setVisible(false);
    }
    this.pokemonEggMovesContainer.setVisible(false);
    this.pokemonAdditionalMoveCountLabel.setVisible(false);

    this.tryUpdateValue();
    this.updateInstructions();
  }

  setSpeciesDetails(species: PokemonSpecies, options: SpeciesDetails = {}, save = true): void {
    // Here we pass some options to override everything else
    let { shiny, formIndex, female, variant, abilityIndex, natureIndex, teraType } = options;

    // Check whether we are setting details for a seen but not caught species
    const forSeen: boolean = options.forSeen ?? false;

    // Storing old cursor values...
    const oldProps = species ? globalScene.gameData.getSpeciesDexAttrProps(species, this.dexAttrCursor) : null;
    const oldAbilityIndex =
      this.abilityCursor > -1 ? this.abilityCursor : globalScene.gameData.getStarterSpeciesDefaultAbilityIndex(species);
    let oldNatureIndex = -1;
    if (species) {
      const { dexEntry } = this.getSpeciesData(species.speciesId);
      oldNatureIndex =
        this.natureCursor > -1 ? this.natureCursor : globalScene.gameData.getSpeciesDefaultNature(species, dexEntry);
    }
    const oldTeraType = this.teraCursor > -1 ? this.teraCursor : species ? species.type1 : PokemonType.UNKNOWN;

    // Before we reset them to null values
    this.dexAttrCursor = 0n;
    this.abilityCursor = -1;
    this.natureCursor = -1;
    this.teraCursor = PokemonType.UNKNOWN;

    // We will only update the sprite if there is a change to form, shiny/variant
    // or gender for species with gender sprite differences
    const shouldUpdateSprite =
      forSeen ||
      (species?.genderDiffs && !isNullOrUndefined(female)) ||
      !isNullOrUndefined(formIndex) ||
      !isNullOrUndefined(shiny) ||
      !isNullOrUndefined(variant);

    const isFreshStartChallenge = globalScene.gameMode.hasChallenge(Challenges.FRESH_START);

    if (this.activeTooltip === "CANDY") {
      if (this.lastSpecies && this.pokemonCandyContainer.visible) {
        const { currentFriendship, friendshipCap } = this.getFriendship(this.lastSpecies.speciesId);
        globalScene.ui.editTooltip("", `${currentFriendship}/${friendshipCap}`);
      } else {
        globalScene.ui.hideTooltip();
      }
    }

    if (species?.forms?.find(f => f.formKey === "female")) {
      if (female !== undefined) {
        formIndex = female ? 1 : 0;
      } else if (formIndex !== undefined) {
        female = formIndex === 1;
      }
    }

    if (species) {
      this.dexAttrCursor |= (shiny !== undefined ? !shiny : !(shiny = oldProps?.shiny))
        ? DexAttr.NON_SHINY
        : DexAttr.SHINY;
      this.dexAttrCursor |= (female !== undefined ? !female : !(female = oldProps?.female))
        ? DexAttr.MALE
        : DexAttr.FEMALE;
      this.dexAttrCursor |= (variant !== undefined ? !variant : !(variant = oldProps?.variant))
        ? DexAttr.DEFAULT_VARIANT
        : variant === 1
          ? DexAttr.VARIANT_2
          : DexAttr.VARIANT_3;
      this.dexAttrCursor |= globalScene.gameData.getFormAttr(
        formIndex !== undefined ? formIndex : (formIndex = oldProps!.formIndex),
      ); // TODO: is this bang correct?
      this.abilityCursor = abilityIndex !== undefined ? abilityIndex : (abilityIndex = oldAbilityIndex);
      this.natureCursor = natureIndex !== undefined ? natureIndex : (natureIndex = oldNatureIndex);
      this.teraCursor = !isNullOrUndefined(teraType) ? teraType : (teraType = oldTeraType);
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
    this.teraIcon.setVisible(false);

    if (this.assetLoadCancelled) {
      this.assetLoadCancelled.value = true;
      this.assetLoadCancelled = null;
    }

    this.starterMoveset = null;
    this.speciesStarterMoves = [];

    if (species) {
      this.pokemonPreferencesContainer.setVisible(true);

      const { dexEntry, starterDataEntry } = this.getSpeciesData(species.speciesId);
      const caughtAttr = dexEntry.caughtAttr || BigInt(0);
      const abilityAttr = starterDataEntry.abilityAttr;

      this.shinyOverlay.setVisible(shiny ?? false); // TODO: is false the correct default?
      this.pokemonNumberText.setColor(
        this.getTextColor(shiny ? TextStyle.SUMMARY_DEX_NUM_GOLD : TextStyle.SUMMARY_DEX_NUM, false),
      );
      this.pokemonNumberText.setShadowColor(
        this.getTextColor(shiny ? TextStyle.SUMMARY_DEX_NUM_GOLD : TextStyle.SUMMARY_DEX_NUM, true),
      );

      if (forSeen ? this.speciesStarterDexEntry?.seenAttr : this.speciesStarterDexEntry?.caughtAttr) {
        const starterIndex = this.starterSpecies.indexOf(species);

        if (starterIndex > -1) {
          this.starterAttr[starterIndex] = this.dexAttrCursor;
          this.starterAbilityIndexes[starterIndex] = this.abilityCursor;
          this.starterNatures[starterIndex] = this.natureCursor;
          this.starterTeras[starterIndex] = this.teraCursor;
        }

        const assetLoadCancelled = new BooleanHolder(false);
        this.assetLoadCancelled = assetLoadCancelled;

        female ??= false;
        if (shouldUpdateSprite) {
          this.updateSprite(species, female, formIndex, shiny, variant);
        } else {
          this.pokemonSprite.setVisible(!this.statsMode);
        }

        const currentContainer = this.starterContainers.find(p => p.species.speciesId === species.speciesId);
        if (currentContainer) {
          const starterSprite = currentContainer.icon as Phaser.GameObjects.Sprite;
          starterSprite.setTexture(
            species.getIconAtlasKey(formIndex, shiny, variant),
            species.getIconId(female, formIndex, shiny, variant),
          );
          currentContainer.checkIconId(female, formIndex, shiny, variant);
        }

        const isNonShinyCaught = !!(caughtAttr & DexAttr.NON_SHINY);
        const isShinyCaught = !!(caughtAttr & DexAttr.SHINY);

        const caughtVariants = [DexAttr.DEFAULT_VARIANT, DexAttr.VARIANT_2, DexAttr.VARIANT_3].filter(
          v => caughtAttr & v,
        );
        this.canCycleShiny = (isNonShinyCaught && isShinyCaught) || (isShinyCaught && caughtVariants.length > 1);

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

        this.canCycleAbility = [hasAbility1, hasAbility2, hasHiddenAbility].filter(a => a).length > 1;

        this.canCycleForm =
          species.forms
            .filter(f => f.isStarterSelectable || !pokemonFormChanges[species.speciesId]?.find(fc => fc.formKey))
            .map((_, f) => dexEntry.caughtAttr & globalScene.gameData.getFormAttr(f))
            .filter(f => f).length > 1;
        this.canCycleNature = globalScene.gameData.getNaturesForAttr(dexEntry.natureAttr).length > 1;
        this.canCycleTera =
          !this.statsMode &&
          this.allowTera &&
          !isNullOrUndefined(getPokemonSpeciesForm(species.speciesId, formIndex ?? 0).type2) &&
          !globalScene.gameMode.hasChallenge(Challenges.FRESH_START);
      }

      if (dexEntry.caughtAttr && species.malePercent !== null) {
        const gender = !female ? Gender.MALE : Gender.FEMALE;
        this.pokemonGenderText
          .setText(getGenderSymbol(gender))
          .setColor(getGenderColor(gender))
          .setShadowColor(getGenderColor(gender, true));
      } else {
        this.pokemonGenderText.setText("");
      }

      if (dexEntry.caughtAttr) {
        let ability: Ability;
        if (this.lastSpecies.forms?.length > 1) {
          ability = allAbilities[this.lastSpecies.forms[formIndex ?? 0].getAbility(abilityIndex!)];
        } else {
          ability = allAbilities[this.lastSpecies.getAbility(abilityIndex!)]; // TODO: is this bang correct?
        }

        const isHidden = abilityIndex === (this.lastSpecies.ability2 ? 2 : 1);
        this.pokemonAbilityText
          .setText(ability.name)
          .setColor(this.getTextColor(!isHidden ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GOLD))
          .setShadowColor(this.getTextColor(!isHidden ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GOLD, true));

        const passiveAttr = starterDataEntry.passiveAttr;
        const passiveAbility = allAbilities[this.lastSpecies.getPassiveAbility(formIndex)];

        if (this.pokemonAbilityText.visible) {
          if (this.activeTooltip === "ABILITY") {
            globalScene.ui.editTooltip(`${ability.name}`, `${ability.description}`);
          }

          this.pokemonAbilityText.on("pointerover", () => {
            globalScene.ui.showTooltip(`${ability.name}`, `${ability.description}`, true);
            this.activeTooltip = "ABILITY";
          });
          this.pokemonAbilityText.on("pointerout", () => {
            globalScene.ui.hideTooltip();
            this.activeTooltip = undefined;
          });
        }

        if (passiveAbility) {
          const isUnlocked = !!(passiveAttr & PassiveAttr.UNLOCKED);
          const isEnabled = !!(passiveAttr & PassiveAttr.ENABLED);

          const textStyle = isUnlocked && isEnabled ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GRAY;
          const textAlpha = isUnlocked && isEnabled ? 1 : 0.5;

          this.pokemonPassiveLabelText
            .setVisible(!isFreshStartChallenge)
            .setColor(this.getTextColor(TextStyle.SUMMARY_ALT))
            .setShadowColor(this.getTextColor(TextStyle.SUMMARY_ALT, true));
          this.pokemonPassiveText
            .setVisible(!isFreshStartChallenge)
            .setText(passiveAbility.name)
            .setColor(this.getTextColor(textStyle))
            .setAlpha(textAlpha)
            .setShadowColor(this.getTextColor(textStyle, true));

          if (this.activeTooltip === "PASSIVE") {
            globalScene.ui.editTooltip(`${passiveAbility.name}`, `${passiveAbility.description}`);
          }

          if (this.pokemonPassiveText.visible) {
            this.pokemonPassiveText.on("pointerover", () => {
              globalScene.ui.showTooltip(`${passiveAbility.name}`, `${passiveAbility.description}`, true);
              this.activeTooltip = "PASSIVE";
            });
            this.pokemonPassiveText.on("pointerout", () => {
              globalScene.ui.hideTooltip();
              this.activeTooltip = undefined;
            });
          }

          const iconPosition = {
            x: this.pokemonPassiveText.x + this.pokemonPassiveText.displayWidth + 1,
            y: this.pokemonPassiveText.y + this.pokemonPassiveText.displayHeight / 2,
          };
          this.pokemonPassiveDisabledIcon
            .setVisible(isUnlocked && !isEnabled && !isFreshStartChallenge)
            .setPosition(iconPosition.x, iconPosition.y);
          this.pokemonPassiveLockedIcon
            .setVisible(!isUnlocked && !isFreshStartChallenge)
            .setPosition(iconPosition.x, iconPosition.y);
        } else if (this.activeTooltip === "PASSIVE") {
          // No passive and passive tooltip is active > hide it
          globalScene.ui.hideTooltip();
        }

        this.pokemonNatureText.setText(
          getNatureName(natureIndex as unknown as Nature, true, true, false, globalScene.uiTheme),
        );

        let levelMoves: LevelMoves;
        if (
          pokemonFormLevelMoves.hasOwnProperty(species.speciesId) &&
          formIndex &&
          pokemonFormLevelMoves[species.speciesId].hasOwnProperty(formIndex)
        ) {
          levelMoves = pokemonFormLevelMoves[species.speciesId][formIndex];
        } else {
          levelMoves = pokemonSpeciesLevelMoves[species.speciesId];
        }
        this.speciesStarterMoves.push(...levelMoves.filter(lm => lm[0] > 0 && lm[0] <= 5).map(lm => lm[1]));
        if (speciesEggMoves.hasOwnProperty(species.speciesId)) {
          for (let em = 0; em < 4; em++) {
            if (starterDataEntry.eggMoves & (1 << em)) {
              this.speciesStarterMoves.push(speciesEggMoves[species.speciesId][em]);
            }
          }
        }

        const speciesMoveData = starterDataEntry.moveset;
        const moveData: StarterMoveset | null = speciesMoveData
          ? Array.isArray(speciesMoveData)
            ? speciesMoveData
            : speciesMoveData[formIndex!] // TODO: is this bang correct?
          : null;
        const availableStarterMoves = this.speciesStarterMoves.concat(
          speciesEggMoves.hasOwnProperty(species.speciesId)
            ? speciesEggMoves[species.speciesId].filter((_: any, em: number) => starterDataEntry.eggMoves & (1 << em))
            : [],
        );
        this.starterMoveset = (moveData || (this.speciesStarterMoves.slice(0, 4) as StarterMoveset)).filter(m =>
          availableStarterMoves.find(sm => sm === m),
        ) as StarterMoveset;
        // Consolidate move data if it contains an incompatible move
        if (this.starterMoveset.length < 4 && this.starterMoveset.length < availableStarterMoves.length) {
          this.starterMoveset.push(
            ...availableStarterMoves
              .filter(sm => this.starterMoveset?.indexOf(sm) === -1)
              .slice(0, 4 - this.starterMoveset.length),
          );
        }

        // Remove duplicate moves
        this.starterMoveset = this.starterMoveset.filter((move, i) => {
          return this.starterMoveset?.indexOf(move) === i;
        }) as StarterMoveset;

        const speciesForm = getPokemonSpeciesForm(species.speciesId, formIndex!); // TODO: is the bang correct?
        const formText = species.getFormNameToDisplay(formIndex);
        this.pokemonFormText.setText(formText);

        this.setTypeIcons(speciesForm.type1, speciesForm.type2);

        this.teraIcon.setFrame(PokemonType[this.teraCursor].toLowerCase());
        this.teraIcon.setVisible(!this.statsMode && this.allowTera);
      }
    }

    if (!this.starterMoveset) {
      this.starterMoveset = this.speciesStarterMoves.slice(0, 4) as StarterMoveset;
    }

    for (let m = 0; m < 4; m++) {
      const move = m < this.starterMoveset.length ? allMoves[this.starterMoveset[m]] : null;
      this.pokemonMoveBgs[m].setFrame(PokemonType[move ? move.type : PokemonType.UNKNOWN].toString().toLowerCase());
      this.pokemonMoveLabels[m].setText(move ? move.name : "-");
      this.pokemonMoveContainers[m].setVisible(!!move);
    }

    const hasEggMoves = species && speciesEggMoves.hasOwnProperty(species.speciesId);
    let eggMoves = 0;
    if (species) {
      const { starterDataEntry } = this.getSpeciesData(this.lastSpecies.speciesId);
      eggMoves = starterDataEntry.eggMoves;
    }

    for (let em = 0; em < 4; em++) {
      const eggMove = hasEggMoves ? allMoves[speciesEggMoves[species.speciesId][em]] : null;
      const eggMoveUnlocked = eggMove && eggMoves & (1 << em);
      this.pokemonEggMoveBgs[em].setFrame(
        PokemonType[eggMove ? eggMove.type : PokemonType.UNKNOWN].toString().toLowerCase(),
      );
      this.pokemonEggMoveLabels[em].setText(eggMove && eggMoveUnlocked ? eggMove.name : "???");
    }

    this.pokemonEggMovesContainer.setVisible(!!this.speciesStarterDexEntry?.caughtAttr && hasEggMoves);

    this.pokemonAdditionalMoveCountLabel
      .setText(`(+${Math.max(this.speciesStarterMoves.length - 4, 0)})`)
      .setVisible(this.speciesStarterMoves.length > 4);

    this.tryUpdateValue();

    this.updateInstructions();

    if (save) {
      saveStarterPreferences(this.originalStarterPreferences);
    }
  }

  updateSprite(
    species: PokemonSpecies,
    female: boolean,
    formIndex?: number | undefined,
    shiny?: boolean,
    variant?: Variant | undefined,
  ) {
    species.loadAssets(female, formIndex, shiny, variant, true).then(() => {
      if (this.assetLoadCancelled?.value) {
        return;
      }
      this.assetLoadCancelled = null;
      this.speciesLoaded.set(species.speciesId, true);
      // Note: Bangs are correct due to `female ??= false` above
      this.pokemonSprite
        .play(species.getSpriteKey(female!, formIndex, shiny, variant))
        .setPipelineData("shiny", shiny)
        .setPipelineData("variant", variant)
        .setPipelineData("spriteKey", species.getSpriteKey(female!, formIndex, shiny, variant))
        .setVisible(!this.statsMode);
    });
  }

  setTypeIcons(type1: PokemonType | null, type2: PokemonType | null): void {
    if (type1 !== null) {
      this.type1Icon.setVisible(true).setFrame(PokemonType[type1].toLowerCase());
    } else {
      this.type1Icon.setVisible(false);
    }
    if (type2 !== null) {
      this.type2Icon.setVisible(true).setFrame(PokemonType[type2].toLowerCase());
    } else {
      this.type2Icon.setVisible(false);
    }
  }

  popStarter(index: number): void {
    this.starterSpecies.splice(index, 1);
    this.starterAttr.splice(index, 1);
    this.starterAbilityIndexes.splice(index, 1);
    this.starterNatures.splice(index, 1);
    this.starterTeras.splice(index, 1);
    this.starterMovesets.splice(index, 1);

    for (let s = 0; s < this.starterSpecies.length; s++) {
      const species = this.starterSpecies[s];
      const currentDexAttr = this.getCurrentDexProps(species.speciesId);
      const props = globalScene.gameData.getSpeciesDexAttrProps(species, currentDexAttr);
      this.starterIcons[s]
        .setTexture(species.getIconAtlasKey(props.formIndex, props.shiny, props.variant))
        .setFrame(species.getIconId(props.female, props.formIndex, props.shiny, props.variant));
      this.checkIconId(this.starterIcons[s], species, props.female, props.formIndex, props.shiny, props.variant);
      if (s >= index) {
        this.starterCursorObjs[s]
          .setPosition(this.starterCursorObjs[s + 1].x, this.starterCursorObjs[s + 1].y)
          .setVisible(this.starterCursorObjs[s + 1].visible);
      }
    }
    this.starterCursorObjs[this.starterSpecies.length].setVisible(false);
    this.starterIcons[this.starterSpecies.length].setTexture("pokemon_icons_0").setFrame("unknown");

    if (this.starterIconsCursorObj.visible) {
      if (this.starterIconsCursorIndex === this.starterSpecies.length) {
        if (this.starterSpecies.length > 0) {
          this.starterIconsCursorIndex--;
        } else {
          // No more Pokemon selected, go back to filters
          this.starterIconsCursorObj.setVisible(false);
          this.setNoSpecies();
          this.filterBarCursor = Math.max(1, this.filterBar.numFilters - 1);
          this.setFilterMode(true);
        }
      }
      this.moveStarterIconsCursor(this.starterIconsCursorIndex);
    } else if (this.startCursorObj.visible && this.starterSpecies.length === 0) {
      // On the start button and no more Pokemon in party
      this.startCursorObj.setVisible(false);
      if (this.filteredStarterIds.length > 0) {
        // Back to the first Pokemon if there is one
        this.cursorObj.setVisible(true);
        this.setCursor(this.scrollCursor * 9);
      } else {
        // Back to filters
        this.filterBarCursor = Math.max(1, this.filterBar.numFilters - 1);
        this.setFilterMode(true);
      }
    }

    this.tryUpdateValue();
  }

  updateStarterValueLabel(starter: StarterContainer): void {
    const speciesId = starter.species.speciesId;
    const baseStarterValue = speciesStarterCosts[speciesId];
    const starterValue = globalScene.gameData.getSpeciesStarterValue(speciesId);
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
    starter.label.setColor(this.getTextColor(textStyle)).setShadowColor(this.getTextColor(textStyle, true));
  }

  tryUpdateValue(add?: number, addingToParty?: boolean): boolean {
    const value = this.starterSpecies
      .map(s => s.generation)
      .reduce(
        (total: number, _gen: number, i: number) =>
          (total += globalScene.gameData.getSpeciesStarterValue(this.starterSpecies[i].speciesId)),
        0,
      );
    const newValue = value + (add || 0);
    const valueLimit = this.getValueLimit();
    const overLimit = newValue > valueLimit;
    let newValueStr = newValue.toString();
    if (newValueStr.startsWith("0.")) {
      newValueStr = newValueStr.slice(1);
    }
    this.valueLimitLabel
      .setText(`${newValueStr}/${valueLimit}`)
      .setColor(this.getTextColor(!overLimit ? TextStyle.TOOLTIP_CONTENT : TextStyle.SUMMARY_PINK))
      .setShadowColor(this.getTextColor(!overLimit ? TextStyle.TOOLTIP_CONTENT : TextStyle.SUMMARY_PINK, true));
    if (overLimit) {
      globalScene.time.delayedCall(fixedInt(500), () => this.tryUpdateValue());
      return false;
    }
    let isPartyValid = this.isPartyValid();
    if (addingToParty) {
      const species = this.starterContainers[this.cursor].species;
      const isNewPokemonValid = checkStarterValidForChallenge(
        species,
        globalScene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId)),
        false,
      );
      isPartyValid ||= isNewPokemonValid;
    }

    /**
     * this loop is used to set the Sprite's alpha value and check if the user can select other pokemon more.
     */
    const remainValue = valueLimit - newValue;
    for (let s = 0; s < this.starterContainers.length; s++) {
      /** Cost of pokemon species */
      const speciesStarterValue = globalScene.gameData.getSpeciesStarterValue(this.allStarterSpecies[s].speciesId);
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
      const isValidForChallenge = checkStarterValidForChallenge(
        this.allStarterSpecies[s],
        globalScene.gameData.getSpeciesDexAttrProps(
          this.allStarterSpecies[s],
          this.getCurrentDexProps(this.allStarterSpecies[s].speciesId),
        ),
        isPartyValid,
      );

      const canBeChosen = remainValue >= speciesStarterValue && isValidForChallenge;

      const isPokemonInParty = this.isInParty(this.allStarterSpecies[s])[0]; // this will get the valud of isDupe from isInParty. This will let us see if the pokemon in question is in our party already so we don't grey out the sprites if they're invalid

      /* This code does a check to tell whether or not a sprite should be lit up or greyed out. There are 3 ways a pokemon's sprite should be lit up:
       * 1) If it's in your party, it's a valid pokemon (i.e. for challenge) and you have enough points to have it
       * 2) If it's in your party, it's not valid (i.e. for challenges), and you have enough points to have it
       * 3) If it's not in your party, but it's a valid pokemon and you have enough points for it
       * Any other time, the sprite should be greyed out.
       * For example, if it's in your party, valid, but costs too much, or if it's not in your party and not valid, regardless of cost
       */
      if (canBeChosen || (isPokemonInParty && remainValue >= speciesStarterValue)) {
        speciesSprite.setAlpha(1);
      } else {
        /**
         * If it can't be chosen, the user can't select.
         * so that the alpha value of pokemon sprite set 0.375.
         */
        speciesSprite.setAlpha(0.375);
      }
    }

    return true;
  }

  /**
   * Attempt to back out of the starter selection screen into the appropriate parent modal
   */
  tryExit(): void {
    this.blockInput = true;
    const ui = this.getUi();

    const cancel = () => {
      ui.setMode(UiMode.STARTER_SELECT);
      this.clearText();
      this.blockInput = false;
    };
    ui.showText(i18next.t("starterSelectUiHandler:confirmExit"), null, () => {
      ui.setModeWithoutClear(
        UiMode.CONFIRM,
        () => {
          ui.setMode(UiMode.STARTER_SELECT);
          // Non-challenge modes go directly back to title, while challenge modes go to the selection screen.
          if (!globalScene.gameMode.isChallenge) {
            globalScene.phaseManager.toTitleScreen();
          } else {
            globalScene.phaseManager.clearPhaseQueue();
            globalScene.phaseManager.pushNew("SelectChallengePhase");
            globalScene.phaseManager.pushNew("EncounterPhase");
          }
          this.clearText();
          globalScene.phaseManager.getCurrentPhase()?.end();
        },
        cancel,
        null,
        null,
        19,
      );
    });
  }

  tryStart(manualTrigger = false): boolean {
    if (!this.starterSpecies.length) {
      return false;
    }

    const ui = this.getUi();

    const cancel = () => {
      ui.setMode(UiMode.STARTER_SELECT);
      if (!manualTrigger) {
        this.popStarter(this.starterSpecies.length - 1);
      }
      this.clearText();
    };

    const canStart = this.isPartyValid();

    if (canStart) {
      ui.showText(i18next.t("starterSelectUiHandler:confirmStartTeam"), null, () => {
        ui.setModeWithoutClear(
          UiMode.CONFIRM,
          () => {
            const startRun = () => {
              globalScene.money = globalScene.gameMode.getStartingMoney();
              ui.setMode(UiMode.STARTER_SELECT);
              const thisObj = this;
              const originalStarterSelectCallback = this.starterSelectCallback;
              this.starterSelectCallback = null;
              originalStarterSelectCallback?.(
                new Array(this.starterSpecies.length).fill(0).map((_, i) => {
                  const starterSpecies = thisObj.starterSpecies[i];
                  const { starterDataEntry } = this.getSpeciesData(starterSpecies.speciesId);
                  return {
                    species: starterSpecies,
                    dexAttr: thisObj.starterAttr[i],
                    abilityIndex: thisObj.starterAbilityIndexes[i],
                    passive: !(starterDataEntry.passiveAttr ^ (PassiveAttr.ENABLED | PassiveAttr.UNLOCKED)),
                    nature: thisObj.starterNatures[i] as Nature,
                    teraType: thisObj.starterTeras[i] as PokemonType,
                    moveset: thisObj.starterMovesets[i],
                    pokerus: thisObj.pokerusSpecies.includes(starterSpecies),
                    nickname: thisObj.starterPreferences[starterSpecies.speciesId]?.nickname,
                  };
                }),
              );
            };
            startRun();
          },
          cancel,
          null,
          null,
          19,
        );
      });
    } else {
      this.tutorialActive = true;
      this.showText(
        i18next.t("starterSelectUiHandler:invalidParty"),
        undefined,
        () => this.showText("", 0, () => (this.tutorialActive = false)),
        undefined,
        true,
      );
    }
    return true;
  }

  /* This block checks to see if your party is valid
   * It checks each pokemon against the challenge - noting that due to monotype challenges it needs to check the pokemon while ignoring their evolutions/form change items
   */
  isPartyValid(): boolean {
    let canStart = false;
    for (let s = 0; s < this.starterSpecies.length; s++) {
      const species = this.starterSpecies[s];
      const isValidForChallenge = checkStarterValidForChallenge(
        species,
        globalScene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId)),
        false,
      );
      canStart ||= isValidForChallenge;
    }
    return canStart;
  }

  /**
   * Creates a temporary dex attr props that will be used to check whether a pokemon is valid for a challenge
   * and to display the correct shiny, variant, and form based on the AllStarterPreferences
   *
   * @param speciesId the id of the species to get props for
   * @returns the dex props
   */
  getCurrentDexProps(speciesId: number): bigint {
    let props = 0n;
    const { dexEntry } = this.getSpeciesData(speciesId);
    const caughtAttr = dexEntry.caughtAttr;

    /*  this checks the gender of the pokemon; this works by checking a) that the starter preferences for the species exist, and if so, is it female. If so, it'll add DexAttr.FEMALE to our temp props
     *  It then checks b) if the caughtAttr for the pokemon is female and NOT male - this means that the ONLY gender we've gotten is female, and we need to add DexAttr.FEMALE to our temp props
     *  If neither of these pass, we add DexAttr.MALE to our temp props
     */
    if (
      this.starterPreferences[speciesId]?.female ||
      ((caughtAttr & DexAttr.FEMALE) > 0n && (caughtAttr & DexAttr.MALE) === 0n)
    ) {
      props += DexAttr.FEMALE;
    } else {
      props += DexAttr.MALE;
    }
    /* This part is very similar to above, but instead of for gender, it checks for shiny within starter preferences.
     * If they're not there, it enables shiny state by default if any shiny was caught
     */
    if (
      this.starterPreferences[speciesId]?.shiny ||
      ((caughtAttr & DexAttr.SHINY) > 0n && this.starterPreferences[speciesId]?.shiny !== false)
    ) {
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
    if (this.starterPreferences[speciesId]?.form) {
      // this checks for the form of the pokemon
      props += BigInt(Math.pow(2, this.starterPreferences[speciesId]?.form)) * DexAttr.DEFAULT_FORM;
    } else {
      // Get the first unlocked form
      props += globalScene.gameData.getFormAttr(globalScene.gameData.getFormIndex(caughtAttr));
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
      this.teraIcon.setVisible(false);
      this.canCycleTera = false;
      this.updateInstructions();
    } else {
      this.statsMode = false;
      this.statsContainer.setVisible(false);
      this.pokemonSprite.setVisible(!!this.speciesStarterDexEntry?.caughtAttr);
      this.teraIcon.setVisible(this.allowTera);
      const props = globalScene.gameData.getSpeciesDexAttrProps(
        this.lastSpecies,
        this.getCurrentDexProps(this.lastSpecies.speciesId),
      );
      const formIndex = props.formIndex;
      this.canCycleTera =
        !this.statsMode &&
        this.allowTera &&
        !isNullOrUndefined(getPokemonSpeciesForm(this.lastSpecies.speciesId, formIndex ?? 0).type2) &&
        !globalScene.gameMode.hasChallenge(Challenges.FRESH_START);
      this.updateInstructions();
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
    // TODO: uncomment this and delete the rest of the method once our testing infra supports mocks of `Phaser.GameObject.Group`
    // this.instructionElemGroup.setVisible(false);
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
    this.teraIconElement.setVisible(false);
    this.teraLabel.setVisible(false);
    this.goFilterIconElement.setVisible(false);
    this.goFilterLabel.setVisible(false);
  }

  clear(): void {
    super.clear();

    saveStarterPreferences(this.originalStarterPreferences);

    this.clearStarterPreferences();
    this.cursor = -1;
    this.oldCursor = -1;
    this.hideInstructions();
    this.activeTooltip = undefined;
    globalScene.ui.hideTooltip();

    this.starterSelectContainer.setVisible(false);
    this.blockInput = false;

    while (this.starterSpecies.length) {
      this.popStarter(this.starterSpecies.length - 1);
    }

    if (this.statsMode) {
      this.toggleStatsMode(false);
    }
  }

  checkIconId(
    icon: Phaser.GameObjects.Sprite,
    species: PokemonSpecies,
    female: boolean,
    formIndex: number,
    shiny: boolean,
    variant: number,
  ) {
    if (icon.frame.name !== species.getIconId(female, formIndex, shiny, variant)) {
      console.log(
        `${species.name}'s icon ${icon.frame.name} does not match getIconId with female: ${female}, formIndex: ${formIndex}, shiny: ${shiny}, variant: ${variant}`,
      );
      icon
        .setTexture(species.getIconAtlasKey(formIndex, false, variant))
        .setFrame(species.getIconId(female, formIndex, false, variant));
    }
  }

  /**
   * Clears this UI's starter preferences.
   *
   * Designed to be used for unit tests that utilize this UI.
   */
  clearStarterPreferences() {
    this.starterPreferences = {};
    this.originalStarterPreferences = {};
  }
}
