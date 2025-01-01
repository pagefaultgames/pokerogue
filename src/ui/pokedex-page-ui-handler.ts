import { pokemonPrevolutions } from "#app/data/balance/pokemon-evolutions";
import { Variant, getVariantTint, getVariantIcon } from "#app/data/variant";
import { argbFromRgba } from "@material/material-color-utilities";
import i18next from "i18next";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import BattleScene, { starterColors } from "#app/battle-scene";
import { allAbilities } from "#app/data/ability";
import { speciesEggMoves } from "#app/data/balance/egg-moves";
import { GrowthRate, getGrowthRateColor } from "#app/data/exp";
import { Gender, getGenderColor, getGenderSymbol } from "#app/data/gender";
import { allMoves } from "#app/data/move";
import { getNatureName } from "#app/data/nature";
import { pokemonFormChanges } from "#app/data/pokemon-forms";
import { LevelMoves, pokemonFormLevelMoves, pokemonSpeciesLevelMoves } from "#app/data/balance/pokemon-level-moves";
import PokemonSpecies, { allSpecies, getPokemonSpeciesForm, getPokerusStarters } from "#app/data/pokemon-species";
import { getStarterValueFriendshipCap, speciesStarterCosts } from "#app/data/balance/starters";
import { starterPassiveAbilities } from "#app/data/balance/passives";
import { Type } from "#enums/type";
import { GameModes } from "#app/game-mode";
import { AbilityAttr, DexAttr, DexAttrProps, DexEntry, StarterMoveset, StarterAttributes, StarterPreferences, StarterPrefs } from "#app/system/game-data";
import { Tutorial, handleTutorial } from "#app/tutorial";
import { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import MessageUiHandler from "#app/ui/message-ui-handler";
import PokemonIconAnimHandler, { PokemonIconAnimMode } from "#app/ui/pokemon-icon-anim-handler";
import { StatsContainer } from "#app/ui/stats-container";
import { TextStyle, addBBCodeTextObject, addTextObject, getTextStyleOptions } from "#app/ui/text";
import { Mode } from "#app/ui/ui";
import { addWindow } from "#app/ui/ui-theme";
import { Egg } from "#app/data/egg";
import Overrides from "#app/overrides";
import { SettingKeyboard } from "#app/system/settings/settings-keyboard";
import { Passive as PassiveAttr } from "#enums/passive";
import * as Challenge from "#app/data/challenge";
import MoveInfoOverlay from "#app/ui/move-info-overlay";
import { getEggTierForSpecies } from "#app/data/egg";
import { Device } from "#enums/devices";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Button } from "#enums/buttons";
import { EggSourceType } from "#enums/egg-source-types";
import { StarterContainer } from "#app/ui/starter-container";
import { getPassiveCandyCount, getValueReductionCandyCounts, getSameSpeciesEggCandyCounts } from "#app/data/balance/starters";
import { BooleanHolder, capitalizeString, fixedInt, getLocalizedSpriteKey, isNullOrUndefined, NumberHolder, padInt, randIntRange, rgbHexToRgba, toReadableString } from "#app/utils";
import type { Nature } from "#enums/nature";
import BgmBar from "./bgm-bar";
import * as Utils from "../utils";
import { speciesTmMoves } from "#app/data/balance/tms";

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
  "es-ES":{
    starterInfoTextSize: "56px",
    instructionTextSize: "35px",
  },
  "fr":{
    starterInfoTextSize: "54px",
    instructionTextSize: "38px",
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

const valueReductionMax = 2;

// Position of UI elements
const speciesContainerX = 109; // if team on the RIGHT: 109 / if on the LEFT: 143

interface SpeciesDetails {
  shiny?: boolean,
  formIndex?: integer
  female?: boolean,
  variant?: Variant,
  abilityIndex?: integer,
  natureIndex?: integer,
  forSeen?: boolean, // default = false
}

enum MenuOptions {
  BASE_STATS,
  ABILITIES,
  LEVEL_MOVES,
  EGG_MOVES,
  TM_MOVES,
  BIOMES,
  NATURES,
  TOGGLE_IVS,
  EVOLUTIONS
}


export default class PokedexPageUiHandler extends MessageUiHandler {
  private starterSelectContainer: Phaser.GameObjects.Container;
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
  private pokemonCandyContainer: Phaser.GameObjects.Container;
  private pokemonCandyIcon: Phaser.GameObjects.Sprite;
  private pokemonCandyDarknessOverlay: Phaser.GameObjects.Sprite;
  private pokemonCandyOverlayIcon: Phaser.GameObjects.Sprite;
  private pokemonCandyCountText: Phaser.GameObjects.Text;
  private pokemonCaughtHatchedContainer: Phaser.GameObjects.Container;
  private pokemonCaughtCountText: Phaser.GameObjects.Text;
  private pokemonFormText: Phaser.GameObjects.Text;
  private pokemonHatchedIcon : Phaser.GameObjects.Sprite;
  private pokemonHatchedCountText: Phaser.GameObjects.Text;
  private pokemonShinyIcon: Phaser.GameObjects.Sprite;
  private pokemonPassiveDisabledIcon: Phaser.GameObjects.Sprite;
  private pokemonPassiveLockedIcon: Phaser.GameObjects.Sprite;

  private activeTooltip: "ABILITY" | "PASSIVE" | "CANDY" | undefined;
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
  private moveInfoOverlay : MoveInfoOverlay;

  private statsMode: boolean;
  private starterIconsCursorXOffset: number = -3;
  private starterIconsCursorYOffset: number = 1;
  private starterIconsCursorIndex: number;
  private filterMode: boolean;
  private dexAttrCursor: bigint = 0n;
  private abilityCursor: number = -1;
  private natureCursor: number = -1;
  private starterMoveset: StarterMoveset | null;

  private allSpecies: PokemonSpecies[] = [];
  private lastSpecies: PokemonSpecies;
  private speciesLoaded: Map<Species, boolean> = new Map<Species, boolean>();
  public starterSpecies: PokemonSpecies[] = [];
  private pokerusSpecies: PokemonSpecies[] = [];
  private starterAttr: bigint[] = [];
  private starterAbilityIndexes: integer[] = [];
  private starterNatures: Nature[] = [];
  private starterMovesets: StarterMoveset[] = [];
  private levelMoves: LevelMoves;
  private eggMoves: Moves[] = [];
  private hasEggMoves: boolean[] = [];
  private tmMoves: Moves[] = [];
  private speciesStarterDexEntry: DexEntry | null;
  private speciesStarterMoves: Moves[];
  private canCycleShiny: boolean;
  private canCycleForm: boolean;
  private canCycleGender: boolean;
  private canCycleAbility: boolean;
  private canCycleNature: boolean;
  private canCycleVariant: boolean;

  private assetLoadCancelled: BooleanHolder | null;
  public cursorObj: Phaser.GameObjects.Image;

  private iconAnimHandler: PokemonIconAnimHandler;

  // variables to keep track of the dynamically rendered list of instruction prompts for starter select
  private instructionRowX = 0;
  private instructionRowY = 0;
  private instructionRowTextOffset = 9;
  private filterInstructionRowX = 0;
  private filterInstructionRowY = 0;

  private starterSelectCallback: StarterSelectCallback | null;

  private starterPreferences: StarterPreferences;

  protected blockInput: boolean = false;

  // Menu
  private menuContainer: Phaser.GameObjects.Container;
  private menuBg: Phaser.GameObjects.NineSlice;
  protected optionSelectText: Phaser.GameObjects.Text;
  public bgmBar: BgmBar;
  private menuOptions: MenuOptions[];
  protected scale: number = 0.1666666667;


  constructor(scene: BattleScene) {
    super(scene, Mode.POKEDEX_PAGE);
  }

  setup() {
    const ui = this.getUi();
    const currentLanguage = i18next.resolvedLanguage ?? "en";
    const langSettingKey = Object.keys(languageSettings).find(lang => currentLanguage.includes(lang)) ?? "en";
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
    this.pokemonAbilityText.setInteractive(new Phaser.Geom.Rectangle(0, 0, 250, 55), Phaser.Geom.Rectangle.Contains);

    this.starterSelectContainer.add(this.pokemonAbilityText);

    this.pokemonPassiveLabelText = addTextObject(this.scene, 6, 136 + starterInfoYOffset, i18next.t("starterSelectUiHandler:passive"), TextStyle.SUMMARY_ALT, { fontSize: starterInfoTextSize });
    this.pokemonPassiveLabelText.setOrigin(0, 0);
    this.pokemonPassiveLabelText.setVisible(false);
    this.starterSelectContainer.add(this.pokemonPassiveLabelText);

    this.pokemonPassiveText = addTextObject(this.scene, starterInfoXPos, 136 + starterInfoYOffset, "", TextStyle.SUMMARY_ALT, { fontSize: starterInfoTextSize });
    this.pokemonPassiveText.setOrigin(0, 0);
    this.pokemonPassiveText.setInteractive(new Phaser.Geom.Rectangle(0, 0, 250, 55), Phaser.Geom.Rectangle.Contains);
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

    const starterSpecies: Species[] = [];

    const starterBoxContainer = this.scene.add.container(speciesContainerX + 6, 9); //115

    for (const species of allSpecies) {
      if (!speciesStarterCosts.hasOwnProperty(species.speciesId) || !species.isObtainable()) {
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

    this.pokemonSprite = this.scene.add.sprite(53, 63, "pkmn__sub");
    this.pokemonSprite.setPipeline(this.scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], ignoreTimeTint: true });
    this.starterSelectContainer.add(this.pokemonSprite);

    this.type1Icon = this.scene.add.sprite(8, 98, getLocalizedSpriteKey("types"));
    this.type1Icon.setScale(0.5);
    this.type1Icon.setOrigin(0, 0);
    this.starterSelectContainer.add(this.type1Icon);

    this.type2Icon = this.scene.add.sprite(26, 98, getLocalizedSpriteKey("types"));
    this.type2Icon.setScale(0.5);
    this.type2Icon.setOrigin(0, 0);
    this.starterSelectContainer.add(this.type2Icon);

    this.pokemonLuckLabelText = addTextObject(this.scene, 8, 89, i18next.t("common:luckIndicator"), TextStyle.WINDOW_ALT, { fontSize: "56px" });
    this.pokemonLuckLabelText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonLuckLabelText);

    this.pokemonLuckText = addTextObject(this.scene, 8 + this.pokemonLuckLabelText.displayWidth + 2, 89, "0", TextStyle.WINDOW, { fontSize: "56px" });
    this.pokemonLuckText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonLuckText);

    // Candy icon and count
    this.pokemonCandyContainer = this.scene.add.container(4.5, 18);

    this.pokemonCandyIcon = this.scene.add.sprite(0, 0, "candy");
    this.pokemonCandyIcon.setScale(0.5);
    this.pokemonCandyIcon.setOrigin(0, 0);
    this.pokemonCandyContainer.add(this.pokemonCandyIcon);

    this.pokemonCandyOverlayIcon = this.scene.add.sprite(0, 0, "candy_overlay");
    this.pokemonCandyOverlayIcon.setScale(0.5);
    this.pokemonCandyOverlayIcon.setOrigin(0, 0);
    this.pokemonCandyContainer.add(this.pokemonCandyOverlayIcon);

    this.pokemonCandyDarknessOverlay = this.scene.add.sprite(0, 0, "candy");
    this.pokemonCandyDarknessOverlay.setScale(0.5);
    this.pokemonCandyDarknessOverlay.setOrigin(0, 0);
    this.pokemonCandyDarknessOverlay.setTint(0x000000);
    this.pokemonCandyDarknessOverlay.setAlpha(0.50);
    this.pokemonCandyContainer.add(this.pokemonCandyDarknessOverlay);

    this.pokemonCandyCountText = addTextObject(this.scene, 9.5, 0, "x0", TextStyle.WINDOW_ALT, { fontSize: "56px" });
    this.pokemonCandyCountText.setOrigin(0, 0);
    this.pokemonCandyContainer.add(this.pokemonCandyCountText);

    this.pokemonCandyContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, 30, 20), Phaser.Geom.Rectangle.Contains);
    this.starterSelectContainer.add(this.pokemonCandyContainer);

    this.pokemonFormText = addTextObject(this.scene, 6, 42, "Form", TextStyle.WINDOW_ALT, { fontSize: "42px" });
    this.pokemonFormText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonFormText);

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
    this.pokemonMovesContainer.setScale(0.375);

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

    // arrow icon for the message box
    this.initPromptSprite(this.starterSelectMessageBoxContainer);

    this.statsContainer = new StatsContainer(this.scene, 6, 16);

    this.scene.add.existing(this.statsContainer);

    this.statsContainer.setVisible(false);

    this.starterSelectContainer.add(this.statsContainer);


    // Adding menu container
    this.menuContainer = this.scene.add.container(-130, 0);
    this.menuContainer.setName("menu");
    this.menuContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    this.bgmBar = new BgmBar(this.scene);
    this.bgmBar.setup();

    ui.bgmBar = this.bgmBar;

    this.menuContainer.add(this.bgmBar);

    this.menuContainer.setVisible(false);


    this.menuOptions = Utils.getEnumKeys(MenuOptions).map(m => parseInt(MenuOptions[m]) as MenuOptions);

    this.optionSelectText = addTextObject(this.scene, 0, 0, this.menuOptions.map(o => `${i18next.t(`pokedexUiHandler:${MenuOptions[o]}`)}`).join("\n"), TextStyle.WINDOW, { maxLines: this.menuOptions.length });
    this.optionSelectText.setLineSpacing(12);

    this.scale = getTextStyleOptions(TextStyle.WINDOW, (this.scene as BattleScene).uiTheme).scale;
    this.menuBg = addWindow(this.scene,
      (this.scene.game.canvas.width / 6) - (this.optionSelectText.displayWidth + 25),
      0,
      this.optionSelectText.displayWidth + 19 + 24 * this.scale,
      (this.scene.game.canvas.height / 6) - 2
    );
    console.log("Logging sizes", this.optionSelectText.displayWidth + 25, this.scene.game.canvas.width / 6);
    this.menuBg.setOrigin(0, 0);

    this.optionSelectText.setPositionRelative(this.menuBg, 10 + 24 * this.scale, 6);

    this.menuContainer.add(this.menuBg);

    this.menuContainer.add(this.optionSelectText);

    ui.add(this.menuContainer);

    this.starterSelectContainer.add(this.menuContainer);


    // add the info overlay last to be the top most ui element and prevent the IVs from overlaying this
    const overlayScale = 1;
    this.moveInfoOverlay = new MoveInfoOverlay(this.scene, {
      scale: overlayScale,
      top: true,
      x: 1,
      y: this.scene.game.canvas.height / 6 - MoveInfoOverlay.getHeight(overlayScale) - 29,
    });
    this.starterSelectContainer.add(this.moveInfoOverlay);

    // Filter bar sits above everything, except the tutorial overlay and message box
    this.initTutorialOverlay(this.starterSelectContainer);
    this.starterSelectContainer.bringToTop(this.starterSelectMessageBoxContainer);

    this.updateInstructions();
  }

  show(args: any[]): boolean {

    console.log("POKEDEX PAGE calling show");

    if (args.length >= 1 && args[0] === "refresh") {
      console.log("this.lastSpecies", this.lastSpecies);
      return false;
    } else {
      this.lastSpecies = args[0];
      this.starterSetup(this.lastSpecies);
      console.log("this.lastSpecies", this.lastSpecies);
    }

    // We want the normal appearence here
    if (!this.starterPreferences) {
      this.starterPreferences = StarterPrefs.load();
    }
    this.moveInfoOverlay.clear(); // clear this when removing a menu; the cancel button doesn't seem to trigger this automatically on controllers
    this.pokerusSpecies = getPokerusStarters(this.scene);


    super.show(args);

    this.starterSelectContainer.setVisible(true);
    this.getUi().bringToTop(this.starterSelectContainer);

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


    this.menuOptions = Utils.getEnumKeys(MenuOptions).map(m => parseInt(MenuOptions[m]) as MenuOptions);

    this.menuContainer.setVisible(true);

    this.setCursor(0);


    this.setSpecies(this.lastSpecies);
    this.updateInstructions();

    return true;

  }


  starterSetup(species): void {
    // TODO: Make sure this takes into account all of pokemonFormLevelMoves properly! Should change when toggling forms.
    this.levelMoves = pokemonSpeciesLevelMoves[species.speciesId];
    this.eggMoves = speciesEggMoves[species.speciesId] ?? [];
    this.hasEggMoves = Array.from({ length: 4 }, (_, em) => (this.scene.gameData.starterData[species.speciesId].eggMoves & (1 << em)) !== 0);
    this.tmMoves =  speciesTmMoves[species.speciesId].sort() ?? [];
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

    if (starterAttributes.variant !== undefined) {
      const unlockedVariants = [
        hasShiny && caughtAttr & DexAttr.DEFAULT_VARIANT,
        hasShiny && caughtAttr & DexAttr.VARIANT_2,
        hasShiny && caughtAttr & DexAttr.VARIANT_3
      ];
      if (isNaN(starterAttributes.variant) || starterAttributes.variant < 0 || !unlockedVariants[starterAttributes.variant]) {
        // variant value is invalid or requested variant wasn't unlocked, purging setting
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

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer, moveToTop?: boolean) {
    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);

    const singleLine = text?.indexOf("\n") === -1;

    this.starterSelectMessageBox.setSize(318, singleLine ? 28 : 42);

    if (moveToTop) {
      this.starterSelectMessageBox.setOrigin(0, 0);
      this.starterSelectMessageBoxContainer.setY(0);
      this.message.setY(4);
    } else {
      this.starterSelectMessageBoxContainer.setY(this.scene.game.canvas.height / 6);
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

    return starterData.candyCount >= getPassiveCandyCount(speciesStarterCosts[speciesId])
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

    return starterData.candyCount >= getValueReductionCandyCounts(speciesStarterCosts[speciesId])[starterData.valueReduction]
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

    return starterData.candyCount >= getSameSpeciesEggCandyCounts(speciesStarterCosts[speciesId]);
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
      delay: randIntRange(0, 50) * 5,
      loopDelay: 1000,
      tweens: [
        {
          targets: icon,
          y: 2 - 5,
          duration: fixedInt(125),
          ease: "Cubic.easeOut",
          yoyo: true
        },
        {
          targets: icon,
          y: 2 - 3,
          duration: fixedInt(150),
          ease: "Cubic.easeOut",
          yoyo: true
        }
      ], };

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
   * Update the display of candy upgrade icons or animations for the given StarterContainer
   * @param starterContainer the container for the Pokemon to update
   */
  updateCandyUpgradeDisplay(starterContainer: StarterContainer) {
    if (this.isUpgradeIconEnabled() ) {
      this.setUpgradeIcon(starterContainer);
    }
    if (this.isUpgradeAnimationEnabled()) {
      this.setUpgradeAnimation(starterContainer.icon, this.lastSpecies, true);
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
      success = true;
    } else if (button === Button.CANCEL) {
      if (this.statsMode) {
        this.toggleStatsMode(false);
        success = true;
      } else {
        console.log(this.getUi().getModeChain());
        this.getUi().revertMode();
        console.log(this.getUi().getModeChain());
        success = true;
      }
    } else {

      let starterContainer;
      const starterData = this.scene.gameData.starterData[this.lastSpecies.speciesId];
      // prepare persistent starter data to store changes
      let starterAttributes = this.starterPreferences[this.lastSpecies.speciesId];

      if (button === Button.ACTION) {

        console.log("Cursor", this.cursor);

        switch (this.cursor) {
          case MenuOptions.LEVEL_MOVES:

            this.blockInput = true;
            console.log("level moves", MenuOptions.LEVEL_MOVES);

            ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => {
              ui.showText(i18next.t("pokedexUiHandler:movesLearntOnLevelUp"), null, () => {

                console.log(this.levelMoves);
                console.log(this.levelMoves[0]);
                this.moveInfoOverlay.show(allMoves[this.levelMoves[0][1]]);

                ui.setModeWithoutClear(Mode.OPTION_SELECT, {
                  options: this.levelMoves.map(m => {
                    const option: OptionSelectItem = {
                      label: String(m[0]).padEnd(4, " ") + allMoves[m[1]].name,
                      handler: () => {
                        return false;
                      },
                      onHover: () => {
                        this.moveInfoOverlay.show(allMoves[m[1]]);
                      },
                    };
                    return option;
                  }).concat({
                    label: i18next.t("menu:cancel"),
                    handler: () => {
                      this.moveInfoOverlay.clear();
                      this.clearText();
                      ui.setMode(Mode.POKEDEX_PAGE, "refresh");
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
                console.log("We did the thing");
                this.blockInput = false;
              });
            });
            break;

          case MenuOptions.EGG_MOVES:

            this.blockInput = true;

            ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => {

              if (this.eggMoves.length === 0) {
                ui.showText(i18next.t("pokedexUiHandler:noEggMoves"));
                this.blockInput = false;
                return true;
              }

              ui.showText(i18next.t("pokedexUiHandler:movesLearntFromEgg"), null, () => {

                this.moveInfoOverlay.show(allMoves[this.eggMoves[0]]);

                ui.setModeWithoutClear(Mode.LOCKABLE_SELECT, {
                  options: [
                    // Add the "Common" title option
                    {
                      label: "Common",
                      title: true, // Marks it as a title
                      locked: false, // Titles are not lockable
                      handler: () => false, // Non-selectable, but handler is required
                      onHover: () => {} // No hover behavior for titles
                    },
                    // Add the first 3 egg moves
                    ...this.eggMoves.slice(0, 3).map((m, i) => ({
                      label: allMoves[m].name,
                      locked: !this.hasEggMoves[i],
                      handler: () => false,
                      onHover: () => this.moveInfoOverlay.show(allMoves[m])
                    })),
                    // Add the "Rare" title option
                    {
                      label: "Rare",
                      title: true,
                      locked: false,
                      handler: () => false,
                      onHover: () => {}
                    },
                    // Add the remaining egg moves (4th onwards)
                    {
                      label: allMoves[this.eggMoves[3]].name,
                      locked: !this.hasEggMoves[3],
                      handler: () => false,
                      onHover: () => this.moveInfoOverlay.show(allMoves[this.eggMoves[3]])
                    },
                    // Add the "Cancel" option at the end
                    {
                      label: i18next.t("menu:cancel"),
                      handler: () => {
                        this.moveInfoOverlay.clear();
                        this.clearText();
                        ui.setMode(Mode.POKEDEX_PAGE, "refresh");
                        return true;
                      },
                      onHover: () => this.moveInfoOverlay.clear()
                    }
                  ],
                  supportHover: true,
                  maxOptions: 8,
                  yOffset: 19
                });

                this.blockInput = false;
              });
            });
            break;

          case MenuOptions.TM_MOVES:

            this.blockInput = true;

            ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => {
              ui.showText(i18next.t("pokedexUiHandler:movesLearntFromTM"), null, () => {

                this.moveInfoOverlay.show(allMoves[this.tmMoves[0]]);

                ui.setModeWithoutClear(Mode.OPTION_SELECT, {
                  options: this.tmMoves.map(m => {
                    const option: OptionSelectItem = {
                      label: allMoves[m].name,
                      handler: () => {
                        return false;
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
                      ui.setMode(Mode.POKEDEX_PAGE, "refresh");
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
            break;

          case MenuOptions.TOGGLE_IVS:
            this.toggleStatsMode();
            ui.setMode(Mode.POKEDEX_PAGE, "refresh");
            return true;

          default:
            return true;
        }

        return true;

        if (!this.speciesStarterDexEntry?.caughtAttr) {
          error = true;
        } else if (this.starterSpecies.length <= 6) { // checks to see if the party has 6 or fewer pokemon
          const ui = this.getUi();
          let options: any[] = []; // TODO: add proper type

          options = [];

          options.push( // this shows the IVs for the pokemon
            {
              label: i18next.t("starterSelectUiHandler:toggleIVs"),
              handler: () => {
                this.toggleStatsMode();
                ui.setMode(Mode.POKEDEX_PAGE, "refresh");
                return true;
              }
            });

          if (this.canCycleNature) {
            // if we could cycle natures, enable the improved nature menu
            const showNatureOptions = () => {

              this.blockInput = true;

              ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => {
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
                          starterAttributes.nature = n;
                          this.clearText();
                          ui.setMode(Mode.POKEDEX_PAGE, "refresh");
                          // set nature for starter
                          this.setSpeciesDetails(this.lastSpecies, { natureIndex: n });
                          this.blockInput = false;
                          return true;
                        }
                      };
                      return option;
                    }).concat({
                      label: i18next.t("menu:cancel"),
                      handler: () => {
                        this.clearText();
                        ui.setMode(Mode.POKEDEX_PAGE, "refresh");
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

          const passiveAttr = starterData.passiveAttr;

          // Purchases with Candy
          const candyCount = starterData.candyCount;
          const showUseCandies = () => {
            const options: any[] = []; // TODO: add proper type

            // Unlock passive option
            if (!(passiveAttr & PassiveAttr.UNLOCKED)) {
              const passiveCost = getPassiveCandyCount(speciesStarterCosts[this.lastSpecies.speciesId]);
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
                    ui.setMode(Mode.POKEDEX_PAGE, "refresh");
                    this.setSpeciesDetails(this.lastSpecies);
                    this.scene.playSound("se/buy");

                    // update the passive background and icon/animation for available upgrade
                    if (starterContainer) {
                      this.updateCandyUpgradeDisplay(starterContainer);
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

            // Reduce cost option
            const valueReduction = starterData.valueReduction;
            if (valueReduction < valueReductionMax) {
              const reductionCost = getValueReductionCandyCounts(speciesStarterCosts[this.lastSpecies.speciesId])[valueReduction];
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
                    ui.setMode(Mode.POKEDEX_PAGE, "refresh");
                    this.scene.playSound("se/buy");

                    // update the value label and icon/animation for available upgrade
                    if (starterContainer) {
                      this.updateCandyUpgradeDisplay(starterContainer);
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
            const sameSpeciesEggCost = getSameSpeciesEggCandyCounts(speciesStarterCosts[this.lastSpecies.speciesId]);
            options.push({
              label: `x${sameSpeciesEggCost} ${i18next.t("starterSelectUiHandler:sameSpeciesEgg")}`,
              handler: () => {
                if (Overrides.FREE_CANDY_UPGRADE_OVERRIDE || candyCount >= sameSpeciesEggCost) {
                  if (this.scene.gameData.eggs.length >= 99 && !Overrides.UNLIMITED_EGG_COUNT_OVERRIDE) {
                    // Egg list full, show error message at the top of the screen and abort
                    this.showText(i18next.t("egg:tooManyEggs"), undefined, () => this.showText("", 0, () => this.tutorialActive = false), 2000, false, undefined, true);
                    return false;
                  }
                  if (!Overrides.FREE_CANDY_UPGRADE_OVERRIDE) {
                    starterData.candyCount -= sameSpeciesEggCost;
                  }
                  this.pokemonCandyCountText.setText(`x${starterData.candyCount}`);

                  const egg = new Egg({ scene: this.scene, species: this.lastSpecies.speciesId, sourceType: EggSourceType.SAME_SPECIES_EGG });
                  egg.addEggToGameData(this.scene);

                  this.scene.gameData.saveSystem().then(success => {
                    if (!success) {
                      return this.scene.reset(true);
                    }
                  });
                  ui.setMode(Mode.POKEDEX_PAGE, "refresh");
                  this.scene.playSound("se/buy");

                  // update the icon/animation for available upgrade
                  if (starterContainer) {
                    this.updateCandyUpgradeDisplay(starterContainer);
                  }

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
                ui.setMode(Mode.POKEDEX_PAGE, "refresh");
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
                ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => showUseCandies());
                return true;
              }
            });
          }
          options.push({
            label: i18next.t("menu:cancel"),
            handler: () => {
              ui.setMode(Mode.POKEDEX_PAGE, "refresh");
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
            console.log("Pressing Button.CYCLE_SHINY");
            if (this.canCycleShiny) {
              starterAttributes.shiny = starterAttributes.shiny !== undefined ? !starterAttributes.shiny : false;

              if (starterAttributes.shiny) {
              // Change to shiny, we need to get the proper default variant
                const newProps = this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, this.getCurrentDexProps(this.lastSpecies.speciesId));
                const newVariant = starterAttributes.variant ? starterAttributes.variant as Variant : newProps.variant;
                this.setSpeciesDetails(this.lastSpecies, { shiny: true, variant: newVariant });

                this.scene.playSound("se/sparkle");
                // Set the variant label to the shiny tint
                const tint = getVariantTint(newVariant);
                this.pokemonShinyIcon.setFrame(getVariantIcon(newVariant));
                this.pokemonShinyIcon.setTint(tint);
                this.pokemonShinyIcon.setVisible(true);
              } else {
                this.setSpeciesDetails(this.lastSpecies, { shiny: false, variant: 0 });
                this.pokemonShinyIcon.setVisible(false);
                success = true;
              }
            }
            break;
          case Button.V:
            if (this.canCycleVariant) {
              let newVariant = props.variant;
              do {
                newVariant = (newVariant + 1) % 3;
                if (newVariant === 0) {
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
              this.setSpeciesDetails(this.lastSpecies, { variant: newVariant as Variant });
              // Cycle tint based on current sprite tint
              const tint = getVariantTint(newVariant as Variant);
              this.pokemonShinyIcon.setFrame(getVariantIcon(newVariant as Variant));
              this.pokemonShinyIcon.setTint(tint);
              success = true;
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
              this.setSpeciesDetails(this.lastSpecies, { formIndex: newFormIndex });
              success = true;
            }
            break;
          case Button.CYCLE_GENDER:
            if (this.canCycleGender) {
              starterAttributes.female = !props.female;
              this.setSpeciesDetails(this.lastSpecies, { female: !props.female });
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

              const { visible: tooltipVisible } = this.scene.ui.getTooltip();

              if (tooltipVisible && this.activeTooltip === "ABILITY") {
                const newAbility = allAbilities[this.lastSpecies.getAbility(newAbilityIndex)];
                this.scene.ui.editTooltip(`${newAbility.name}`, `${newAbility.description}`);
              }

              this.setSpeciesDetails(this.lastSpecies, { abilityIndex: newAbilityIndex });
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
              this.setSpeciesDetails(this.lastSpecies, { natureIndex: newNature });
              success = true;
            }
            break;
          case Button.UP:
            if (this.cursor) {
              success = this.setCursor(this.cursor - 1);
            } else {
              success = this.setCursor(this.menuOptions.length - 1);
            }
            break;
          case Button.DOWN:
            if (this.cursor + 1 < this.menuOptions.length) {
              success = this.setCursor(this.cursor + 1);
            } else {
              success = this.setCursor(0);
            }
            break;
          case Button.LEFT:
            break;
          case Button.RIGHT:
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
    this.setSpeciesDetails(this.lastSpecies, { forSeen: false });

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
    this.instructionsContainer.add([ iconElement, controlLabel ]);
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
    this.filterInstructionsContainer.add([ iconElement, controlLabel ]);
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

  getValueLimit(): number {
    const valueLimit = new NumberHolder(0);
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
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, "cursor");
      this.cursorObj.setOrigin(0, 0);
      this.menuContainer.add(this.cursorObj);
    }

    this.cursorObj.setScale(this.scale * 6);
    this.cursorObj.setPositionRelative(this.menuBg, 7, 6 + (18 + this.cursor * 96) * this.scale);

    return ret;
  }


  getFriendship(speciesId: number) {
    let currentFriendship = this.scene.gameData.starterData[speciesId].friendship;
    if (!currentFriendship || currentFriendship === undefined) {
      currentFriendship = 0;
    }

    const friendshipCap = getStarterValueFriendshipCap(speciesStarterCosts[speciesId]);

    return { currentFriendship, friendshipCap };
  }

  setSpecies(species: PokemonSpecies | null) {
    this.speciesStarterDexEntry = species ? this.scene.gameData.dexData[species.speciesId] : null;
    this.dexAttrCursor = species ? this.getCurrentDexProps(species.speciesId) : 0n;
    this.abilityCursor = species ? this.scene.gameData.getStarterSpeciesDefaultAbilityIndex(species) : 0;
    this.natureCursor = species ? this.scene.gameData.getSpeciesDefaultNature(species) : 0;

    if (!species && this.scene.ui.getTooltip().visible) {
      this.scene.ui.hideTooltip();
    }

    this.pokemonAbilityText.off("pointerover");
    this.pokemonPassiveText.off("pointerover");

    const starterAttributes : StarterAttributes | null = species ? { ...this.starterPreferences[species.speciesId] } : null;

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
      this.pokemonNumberText.setText(padInt(species.speciesId, 4));
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
        let growthReadable = toReadableString(GrowthRate[species.growthRate]);
        const growthAux = growthReadable.replace(" ", "_");
        if (i18next.exists("growth:" + growthAux)) {
          growthReadable = i18next.t("growth:" + growthAux as any);
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
        this.pokemonFormText.setVisible(true);

        if (pokemonPrevolutions.hasOwnProperty(species.speciesId)) {
          this.pokemonCaughtHatchedContainer.setY(16);
          this.pokemonShinyIcon.setY(135);
          this.pokemonShinyIcon.setFrame(getVariantIcon(variant));
          [
            this.pokemonCandyContainer,
            this.pokemonHatchedIcon,
            this.pokemonHatchedCountText
          ].map(c => c.setVisible(false));
          this.pokemonFormText.setY(25);
        } else {
          this.pokemonCaughtHatchedContainer.setY(25);
          this.pokemonShinyIcon.setY(117);
          this.pokemonCandyIcon.setTint(argbFromRgba(rgbHexToRgba(colorScheme[0])));
          this.pokemonCandyOverlayIcon.setTint(argbFromRgba(rgbHexToRgba(colorScheme[1])));
          this.pokemonCandyCountText.setText(`x${this.scene.gameData.starterData[species.speciesId].candyCount}`);
          this.pokemonCandyContainer.setVisible(true);
          this.pokemonFormText.setY(42);
          this.pokemonHatchedIcon.setVisible(true);
          this.pokemonHatchedCountText.setVisible(true);

          const { currentFriendship, friendshipCap } = this.getFriendship(this.lastSpecies.speciesId);
          const candyCropY = 16 - (16 * (currentFriendship / friendshipCap));
          this.pokemonCandyDarknessOverlay.setCrop(0, 0, 16, candyCropY);

          this.pokemonCandyContainer.on("pointerover", () => {
            this.scene.ui.showTooltip("", `${currentFriendship}/${friendshipCap}`, true);
            this.activeTooltip = "CANDY";
          });
          this.pokemonCandyContainer.on("pointerout", () => {
            this.scene.ui.hideTooltip();
            this.activeTooltip = undefined;
          });

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
          this.setSpeciesDetails(species, {
            shiny: props.shiny,
            formIndex: props.formIndex,
            female: props.female,
            variant: props.variant,
            abilityIndex: this.starterAbilityIndexes[starterIndex],
            natureIndex: this.starterNatures[starterIndex]
          });
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

          this.setSpeciesDetails(species, {
            shiny: props.shiny,
            formIndex: props.formIndex,
            female: props.female,
            variant: props.variant,
            abilityIndex: defaultAbilityIndex,
            natureIndex: defaultNature
          });
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
        this.pokemonCandyContainer.setVisible(false);
        this.pokemonFormText.setVisible(false);

        const defaultDexAttr = this.scene.gameData.getSpeciesDefaultDexAttr(species, true, true);
        const defaultAbilityIndex = this.scene.gameData.getStarterSpeciesDefaultAbilityIndex(species);
        const defaultNature = this.scene.gameData.getSpeciesDefaultNature(species);
        const props = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);

        this.setSpeciesDetails(species, {
          shiny: props.shiny,
          formIndex: props.formIndex,
          female: props.female,
          variant: props.variant,
          abilityIndex: defaultAbilityIndex,
          natureIndex: defaultNature,
          forSeen: true
        });
        this.pokemonSprite.setTint(0x808080);
      }
    } else {
      this.pokemonNumberText.setText(padInt(0, 4));
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
      this.pokemonCandyContainer.setVisible(false);
      this.pokemonFormText.setVisible(false);

      this.setSpeciesDetails(species!, { // TODO: is this bang correct?
        shiny: false,
        formIndex: 0,
        female: false,
        variant: 0,
        abilityIndex: 0,
        natureIndex: 0
      });
      this.pokemonSprite.clearTint();
    }
  }

  setSpeciesDetails(species: PokemonSpecies, options: SpeciesDetails = {}): void {
    let { shiny, formIndex, female, variant, abilityIndex, natureIndex } = options;
    const forSeen: boolean = options.forSeen ?? false;
    const oldProps = species ? this.scene.gameData.getSpeciesDexAttrProps(species, this.dexAttrCursor) : null;
    const oldAbilityIndex = this.abilityCursor > -1 ? this.abilityCursor : this.scene.gameData.getStarterSpeciesDefaultAbilityIndex(species);
    const oldNatureIndex = this.natureCursor > -1 ? this.natureCursor : this.scene.gameData.getSpeciesDefaultNature(species);
    this.dexAttrCursor = 0n;
    this.abilityCursor = -1;
    this.natureCursor = -1;

    // We will only update the sprite if there is a change to form, shiny/variant
    // or gender for species with gender sprite differences
    const shouldUpdateSprite = (species?.genderDiffs && !isNullOrUndefined(female))
     || !isNullOrUndefined(formIndex) || !isNullOrUndefined(shiny) || !isNullOrUndefined(variant);

    if (this.activeTooltip === "CANDY") {
      if (this.lastSpecies && this.pokemonCandyContainer.visible) {
        const { currentFriendship, friendshipCap } = this.getFriendship(this.lastSpecies.speciesId);
        this.scene.ui.editTooltip("", `${currentFriendship}/${friendshipCap}`);
      } else {
        this.scene.ui.hideTooltip();
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
      this.dexAttrCursor |= (shiny !== undefined ? !shiny : !(shiny = oldProps?.shiny)) ? DexAttr.NON_SHINY : DexAttr.SHINY;
      this.dexAttrCursor |= (female !== undefined ? !female : !(female = oldProps?.female)) ? DexAttr.MALE : DexAttr.FEMALE;
      this.dexAttrCursor |= (variant !== undefined ? !variant : !(variant = oldProps?.variant)) ? DexAttr.DEFAULT_VARIANT : variant === 1 ? DexAttr.VARIANT_2 : DexAttr.VARIANT_3;
      this.dexAttrCursor |= this.scene.gameData.getFormAttr(formIndex !== undefined ? formIndex : (formIndex = oldProps!.formIndex)); // TODO: is this bang correct?
      this.abilityCursor = abilityIndex !== undefined ? abilityIndex : (abilityIndex = oldAbilityIndex);
      this.natureCursor = natureIndex !== undefined ? natureIndex : (natureIndex = oldNatureIndex);
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

        const assetLoadCancelled = new BooleanHolder(false);
        this.assetLoadCancelled = assetLoadCancelled;

        if (shouldUpdateSprite) {
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
        } else {
          this.pokemonSprite.setVisible(!this.statsMode);
        }

        const isValidForChallenge = new BooleanHolder(true);
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
        this.canCycleVariant = !!shiny && [ isVariant1Caught, isVariant2Caught, isVariant3Caught ].filter(v => v).length > 1;

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
        const ability = allAbilities[this.lastSpecies.getAbility(abilityIndex!)]; // TODO: is this bang correct?
        this.pokemonAbilityText.setText(ability.name);

        const isHidden = abilityIndex === (this.lastSpecies.ability2 ? 2 : 1);
        this.pokemonAbilityText.setColor(this.getTextColor(!isHidden ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GOLD));
        this.pokemonAbilityText.setShadowColor(this.getTextColor(!isHidden ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GOLD, true));

        const passiveAttr = this.scene.gameData.starterData[species.speciesId].passiveAttr;
        const passiveAbility = allAbilities[starterPassiveAbilities[this.lastSpecies.speciesId]];

        if (this.pokemonAbilityText.visible) {
          if (this.activeTooltip === "ABILITY") {
            this.scene.ui.editTooltip(`${ability.name}`, `${ability.description}`);
          }

          this.pokemonAbilityText.on("pointerover", () => {
            this.scene.ui.showTooltip(`${ability.name}`, `${ability.description}`, true);
            this.activeTooltip = "ABILITY";
          });
          this.pokemonAbilityText.on("pointerout", () => {
            this.scene.ui.hideTooltip();
            this.activeTooltip = undefined;
          });
        }

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

          if (this.activeTooltip === "PASSIVE") {
            this.scene.ui.editTooltip(`${passiveAbility.name}`, `${passiveAbility.description}`);
          }

          if (this.pokemonPassiveText.visible) {
            this.pokemonPassiveText.on("pointerover", () => {
              this.scene.ui.showTooltip(`${passiveAbility.name}`, `${passiveAbility.description}`, true);
              this.activeTooltip = "PASSIVE";
            });
            this.pokemonPassiveText.on("pointerout", () => {
              this.scene.ui.hideTooltip();
              this.activeTooltip = undefined;
            });
          }

          const iconPosition = {
            x: this.pokemonPassiveText.x + this.pokemonPassiveText.displayWidth + 1,
            y: this.pokemonPassiveText.y + this.pokemonPassiveText.displayHeight / 2
          };
          this.pokemonPassiveDisabledIcon.setVisible(isUnlocked && !isEnabled);
          this.pokemonPassiveDisabledIcon.setPosition(iconPosition.x, iconPosition.y);
          this.pokemonPassiveLockedIcon.setVisible(!isUnlocked);
          this.pokemonPassiveLockedIcon.setPosition(iconPosition.x, iconPosition.y);

        } else if (this.activeTooltip === "PASSIVE") {
          // No passive and passive tooltip is active > hide it
          this.scene.ui.hideTooltip();
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
        const formText = capitalizeString(species?.forms[formIndex!]?.formKey, "-", false, false); // TODO: is the bang correct?

        const speciesName = capitalizeString(Species[species.speciesId], "_", true, false);

        if (species.speciesId === Species.ARCEUS) {
          this.pokemonFormText.setText(i18next.t(`pokemonInfo:Type.${formText?.toUpperCase()}`));
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
      const eggMoveUnlocked = eggMove && this.scene.gameData.starterData[species.speciesId].eggMoves & (1 << em);
      this.pokemonEggMoveBgs[em].setFrame(Type[eggMove ? eggMove.type : Type.UNKNOWN].toString().toLowerCase());
      this.pokemonEggMoveLabels[em].setText(eggMove && eggMoveUnlocked ? eggMove.name : "???");
    }

    this.pokemonEggMovesContainer.setVisible(!!this.speciesStarterDexEntry?.caughtAttr && hasEggMoves);

    this.pokemonAdditionalMoveCountLabel.setText(`(+${Math.max(this.speciesStarterMoves.length - 4, 0)})`);
    this.pokemonAdditionalMoveCountLabel.setVisible(this.speciesStarterMoves.length > 4);

    this.updateInstructions();
  }

  setTypeIcons(type1: Type | null, type2: Type | null): void {
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

    //    StarterPrefs.save(this.starterPreferences);
    this.cursor = -1;
    this.hideInstructions();
    this.activeTooltip = undefined;
    this.scene.ui.hideTooltip();

    this.starterSelectContainer.setVisible(false);
    this.blockInput = false;

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
