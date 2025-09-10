import { globalScene } from "#app/global-scene";
import { starterColors } from "#app/global-vars/starter-colors";
import Overrides from "#app/overrides";
import type { BiomeTierTod } from "#balance/biomes";
import { BiomePoolTier, catchableSpecies } from "#balance/biomes";
import { speciesEggMoves } from "#balance/egg-moves";
import { starterPassiveAbilities } from "#balance/passives";
import type { SpeciesFormEvolution } from "#balance/pokemon-evolutions";
import { pokemonEvolutions, pokemonPrevolutions, pokemonStarters } from "#balance/pokemon-evolutions";
import type { LevelMoves } from "#balance/pokemon-level-moves";
import { pokemonFormLevelMoves, pokemonSpeciesLevelMoves } from "#balance/pokemon-level-moves";
import {
  getPassiveCandyCount,
  getSameSpeciesEggCandyCounts,
  getStarterValueFriendshipCap,
  getValueReductionCandyCounts,
  speciesStarterCosts,
} from "#balance/starters";
import { speciesTmMoves } from "#balance/tms";
import { allAbilities, allMoves, allSpecies } from "#data/data-lists";
import { Egg, getEggTierForSpecies } from "#data/egg";
import { GrowthRate, getGrowthRateColor } from "#data/exp";
import { Gender, getGenderColor, getGenderSymbol } from "#data/gender";
import { getNatureName } from "#data/nature";
import type { SpeciesFormChange } from "#data/pokemon-forms";
import { pokemonFormChanges } from "#data/pokemon-forms";
import type { PokemonSpecies } from "#data/pokemon-species";
import { normalForm } from "#data/pokemon-species";
import { AbilityAttr } from "#enums/ability-attr";
import type { AbilityId } from "#enums/ability-id";
import { BiomeId } from "#enums/biome-id";
import { Button } from "#enums/buttons";
import { Device } from "#enums/devices";
import { DexAttr } from "#enums/dex-attr";
import { EggSourceType } from "#enums/egg-source-types";
import type { MoveId } from "#enums/move-id";
import type { Nature } from "#enums/nature";
import { Passive as PassiveAttr } from "#enums/passive";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TextStyle } from "#enums/text-style";
import { TimeOfDay } from "#enums/time-of-day";
import { UiMode } from "#enums/ui-mode";
import type { Variant } from "#sprites/variant";
import { getVariantIcon, getVariantTint } from "#sprites/variant";
import type { StarterAttributes } from "#system/game-data";
import { SettingKeyboard } from "#system/settings-keyboard";
import type { DexEntry } from "#types/dex-data";
import { BaseStatsOverlay } from "#ui/containers/base-stats-overlay";
import { MoveInfoOverlay } from "#ui/containers/move-info-overlay";
import { PokedexInfoOverlay } from "#ui/containers/pokedex-info-overlay";
import { StatsContainer } from "#ui/containers/stats-container";
import type { OptionSelectItem } from "#ui/handlers/abstract-option-select-ui-handler";
import { MessageUiHandler } from "#ui/handlers/message-ui-handler";
import { addBBCodeTextObject, addTextObject, getTextColor, getTextStyleOptions } from "#ui/text";
import { addWindow } from "#ui/ui-theme";
import { BooleanHolder, getLocalizedSpriteKey, isNullOrUndefined, padInt, rgbHexToRgba } from "#utils/common";
import { getEnumValues } from "#utils/enums";
import { getPokemonSpecies, getPokemonSpeciesForm } from "#utils/pokemon-utils";
import { toCamelCase, toTitleCase } from "#utils/strings";
import { argbFromRgba } from "@material/material-color-utilities";
import i18next from "i18next";
import type BBCodeText from "phaser3-rex-plugins/plugins/gameobjects/tagtext/bbcodetext/BBCodeText";

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
};

const valueReductionMax = 2;

// Position of UI elements
const speciesContainerX = 109;

interface SpeciesDetails {
  shiny?: boolean;
  formIndex?: number;
  female?: boolean;
  variant?: number;
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
  EVOLUTIONS,
}

export class PokedexPageUiHandler extends MessageUiHandler {
  private starterSelectContainer: Phaser.GameObjects.Container;
  private shinyOverlay: Phaser.GameObjects.Image;
  private starterDexNoLabel: Phaser.GameObjects.Image;
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
  private pokemonCandyContainer: Phaser.GameObjects.Container;
  private pokemonCandyIcon: Phaser.GameObjects.Sprite;
  private pokemonCandyDarknessOverlay: Phaser.GameObjects.Sprite;
  private pokemonCandyOverlayIcon: Phaser.GameObjects.Sprite;
  private pokemonCandyCountText: Phaser.GameObjects.Text;
  private pokemonCaughtHatchedContainer: Phaser.GameObjects.Container;
  private pokemonCaughtCountText: Phaser.GameObjects.Text;
  private pokemonFormText: Phaser.GameObjects.Text;
  private pokemonCategoryText: Phaser.GameObjects.Text;
  private pokemonHatchedIcon: Phaser.GameObjects.Sprite;
  private pokemonHatchedCountText: Phaser.GameObjects.Text;
  private pokemonShinyIcons: Phaser.GameObjects.Sprite[];

  private activeTooltip: "ABILITY" | "PASSIVE" | "CANDY" | undefined;
  private instructionsContainer: Phaser.GameObjects.Container;
  private filterInstructionsContainer: Phaser.GameObjects.Container;
  private shinyIconElement: Phaser.GameObjects.Sprite;
  private formIconElement: Phaser.GameObjects.Sprite;
  private genderIconElement: Phaser.GameObjects.Sprite;
  private variantIconElement: Phaser.GameObjects.Sprite;
  private shinyLabel: Phaser.GameObjects.Text;
  private formLabel: Phaser.GameObjects.Text;
  private genderLabel: Phaser.GameObjects.Text;
  private variantLabel: Phaser.GameObjects.Text;
  private candyUpgradeIconElement: Phaser.GameObjects.Sprite;
  private candyUpgradeLabel: Phaser.GameObjects.Text;
  private showBackSpriteIconElement: Phaser.GameObjects.Sprite;
  private showBackSpriteLabel: Phaser.GameObjects.Text;

  private starterSelectMessageBox: Phaser.GameObjects.NineSlice;
  private starterSelectMessageBoxContainer: Phaser.GameObjects.Container;
  private statsContainer: StatsContainer;
  private moveInfoOverlay: MoveInfoOverlay;
  private infoOverlay: PokedexInfoOverlay;
  private baseStatsOverlay: BaseStatsOverlay;

  private statsMode: boolean;

  private allSpecies: PokemonSpecies[] = [];
  private species: PokemonSpecies;
  private starterId: number;
  private formIndex: number;
  private speciesLoaded: Map<SpeciesId, boolean> = new Map<SpeciesId, boolean>();
  private levelMoves: LevelMoves;
  private eggMoves: MoveId[] = [];
  private hasEggMoves: boolean[] = [];
  private tmMoves: MoveId[] = [];
  private ability1: AbilityId;
  private ability2: AbilityId | undefined;
  private abilityHidden: AbilityId | undefined;
  private passive: AbilityId;
  private hasPassive: boolean;
  private hasAbilities: number[];
  private biomes: BiomeTierTod[];
  private preBiomes: BiomeTierTod[];
  private baseStats: number[];
  private baseTotal: number;
  private evolutions: SpeciesFormEvolution[];
  private battleForms: SpeciesFormChange[];
  private prevolutions: SpeciesFormEvolution[];

  private speciesStarterDexEntry: DexEntry | null;
  private canCycleShiny: boolean;
  private canCycleForm: boolean;
  private canCycleGender: boolean;

  private assetLoadCancelled: BooleanHolder | null;
  public cursorObj: Phaser.GameObjects.Image;

  // variables to keep track of the dynamically rendered list of instruction prompts for starter select
  private instructionRowX = 0;
  private instructionRowY = 0;
  private instructionRowTextOffset = 9;

  private starterAttributes: StarterAttributes;
  private savedStarterAttributes: StarterAttributes;

  private previousSpecies: PokemonSpecies[];
  private previousStarterAttributes: StarterAttributes[];

  protected blockInput = false;
  protected blockInputOverlay = false;

  private showBackSprite = false;

  // Menu
  private menuContainer: Phaser.GameObjects.Container;
  private menuBg: Phaser.GameObjects.NineSlice;
  protected optionSelectText: BBCodeText;
  private menuOptions: MenuOptions[];
  protected scale = 0.1666666667;
  private menuDescriptions: string[];
  private isFormGender: boolean;
  private filteredIndices: SpeciesId[] | null = null;

  private availableVariants: number;
  private unlockedVariants: boolean[];

  private canUseCandies: boolean;
  private exitCallback;

  constructor() {
    super(UiMode.POKEDEX_PAGE);
  }

  setup() {
    const ui = this.getUi();
    const currentLanguage = i18next.resolvedLanguage ?? "en";
    const langSettingKey = Object.keys(languageSettings).find(lang => currentLanguage.includes(lang)) ?? "en";
    const textSettings = languageSettings[langSettingKey];

    this.starterSelectContainer = globalScene.add.container(0, -globalScene.scaledCanvas.height);
    this.starterSelectContainer.setVisible(false);
    ui.add(this.starterSelectContainer);

    const bgColor = globalScene.add.rectangle(
      0,
      0,
      globalScene.scaledCanvas.width,
      globalScene.scaledCanvas.height,
      0x006860,
    );
    bgColor.setOrigin(0, 0);
    this.starterSelectContainer.add(bgColor);

    const starterSelectBg = globalScene.add.image(0, 0, "pokedex_summary_bg");
    starterSelectBg.setOrigin(0, 0);
    this.starterSelectContainer.add(starterSelectBg);

    this.pokemonSprite = globalScene.add.sprite(53, 63, "pkmn__sub");
    this.pokemonSprite.setPipeline(globalScene.spritePipeline, {
      tone: [0.0, 0.0, 0.0, 0.0],
      ignoreTimeTint: true,
    });
    this.starterSelectContainer.add(this.pokemonSprite);

    this.starterDexNoLabel = globalScene.add.image(6, 14, getLocalizedSpriteKey("summary_dexnb_label")); // Pixel text 'No'
    this.starterDexNoLabel.setOrigin(0, 1);
    this.starterSelectContainer.add(this.starterDexNoLabel);

    this.shinyOverlay = globalScene.add.image(6, 111, getLocalizedSpriteKey("summary_dexnb_label_overlay_shiny")); // Pixel text 'No' shiny
    this.shinyOverlay.setOrigin(0, 1);
    this.shinyOverlay.setVisible(false);
    this.starterSelectContainer.add(this.shinyOverlay);

    this.pokemonNumberText = addTextObject(17, 1, "0000", TextStyle.SUMMARY_DEX_NUM);
    this.pokemonNumberText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonNumberText);

    this.pokemonNameText = addTextObject(6, 112, "", TextStyle.SUMMARY);
    this.pokemonNameText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonNameText);

    this.pokemonGrowthRateLabelText = addTextObject(
      8,
      106,
      i18next.t("pokedexUiHandler:growthRate"),
      TextStyle.SUMMARY_ALT,
      { fontSize: "36px" },
    );
    this.pokemonGrowthRateLabelText.setOrigin(0, 0);
    this.pokemonGrowthRateLabelText.setVisible(false);
    this.starterSelectContainer.add(this.pokemonGrowthRateLabelText);

    this.pokemonGrowthRateText = addTextObject(34, 106, "", TextStyle.GROWTH_RATE_TYPE, { fontSize: "36px" });
    this.pokemonGrowthRateText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonGrowthRateText);

    this.pokemonGenderText = addTextObject(96, 112, "", TextStyle.SUMMARY_ALT);
    this.pokemonGenderText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonGenderText);

    this.pokemonUncaughtText = addTextObject(6, 127, i18next.t("pokedexUiHandler:uncaught"), TextStyle.WINDOW, {
      fontSize: "56px",
    });
    this.pokemonUncaughtText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonUncaughtText);

    const starterBoxContainer = globalScene.add.container(speciesContainerX + 6, 9); //115

    for (const species of allSpecies) {
      if (!speciesStarterCosts.hasOwnProperty(species.speciesId) || !species.isObtainable()) {
        continue;
      }

      this.speciesLoaded.set(species.speciesId, false);
      this.allSpecies.push(species);
    }

    this.starterSelectContainer.add(starterBoxContainer);

    this.type1Icon = globalScene.add.sprite(8, 98, getLocalizedSpriteKey("types"));
    this.type1Icon.setScale(0.5);
    this.type1Icon.setOrigin(0, 0);
    this.starterSelectContainer.add(this.type1Icon);

    this.type2Icon = globalScene.add.sprite(26, 98, getLocalizedSpriteKey("types"));
    this.type2Icon.setScale(0.5);
    this.type2Icon.setOrigin(0, 0);
    this.starterSelectContainer.add(this.type2Icon);

    this.pokemonLuckLabelText = addTextObject(8, 89, i18next.t("common:luckIndicator"), TextStyle.WINDOW_ALT, {
      fontSize: "56px",
    });
    this.pokemonLuckLabelText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonLuckLabelText);

    this.pokemonLuckText = addTextObject(
      8 + this.pokemonLuckLabelText.displayWidth + 2,
      89,
      "0",
      TextStyle.LUCK_VALUE,
      {
        fontSize: "56px",
      },
    );
    this.pokemonLuckText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonLuckText);

    // Candy icon and count
    this.pokemonCandyContainer = globalScene.add.container(4.5, 18);

    this.pokemonCandyIcon = globalScene.add.sprite(0, 0, "candy");
    this.pokemonCandyIcon.setScale(0.5);
    this.pokemonCandyIcon.setOrigin(0, 0);
    this.pokemonCandyContainer.add(this.pokemonCandyIcon);

    this.pokemonCandyOverlayIcon = globalScene.add.sprite(0, 0, "candy_overlay");
    this.pokemonCandyOverlayIcon.setScale(0.5);
    this.pokemonCandyOverlayIcon.setOrigin(0, 0);
    this.pokemonCandyContainer.add(this.pokemonCandyOverlayIcon);

    this.pokemonCandyDarknessOverlay = globalScene.add.sprite(0, 0, "candy");
    this.pokemonCandyDarknessOverlay.setScale(0.5);
    this.pokemonCandyDarknessOverlay.setOrigin(0, 0);
    this.pokemonCandyDarknessOverlay.setTint(0x000000);
    this.pokemonCandyDarknessOverlay.setAlpha(0.5);
    this.pokemonCandyContainer.add(this.pokemonCandyDarknessOverlay);

    this.pokemonCandyCountText = addTextObject(9.5, 0, "x0", TextStyle.WINDOW_ALT, { fontSize: "56px" });
    this.pokemonCandyCountText.setOrigin(0, 0);
    this.pokemonCandyContainer.add(this.pokemonCandyCountText);

    this.pokemonCandyContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, 30, 20), Phaser.Geom.Rectangle.Contains);
    this.starterSelectContainer.add(this.pokemonCandyContainer);

    this.pokemonFormText = addTextObject(6, 42, "Form", TextStyle.WINDOW_ALT, {
      fontSize: "42px",
    });
    this.pokemonFormText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonFormText);

    this.pokemonCategoryText = addTextObject(100, 18, "Category", TextStyle.WINDOW_ALT, {
      fontSize: "42px",
    });
    this.pokemonCategoryText.setOrigin(1, 0);
    this.starterSelectContainer.add(this.pokemonCategoryText);

    this.pokemonCaughtHatchedContainer = globalScene.add.container(2, 25);
    this.pokemonCaughtHatchedContainer.setScale(0.5);
    this.starterSelectContainer.add(this.pokemonCaughtHatchedContainer);

    const pokemonCaughtIcon = globalScene.add.sprite(1, 0, "items", "pb");
    pokemonCaughtIcon.setOrigin(0, 0);
    pokemonCaughtIcon.setScale(0.75);
    this.pokemonCaughtHatchedContainer.add(pokemonCaughtIcon);

    this.pokemonCaughtCountText = addTextObject(24, 4, "0", TextStyle.SUMMARY_ALT);
    this.pokemonCaughtCountText.setOrigin(0, 0);
    this.pokemonCaughtHatchedContainer.add(this.pokemonCaughtCountText);

    this.pokemonHatchedIcon = globalScene.add.sprite(1, 14, "egg_icons");
    this.pokemonHatchedIcon.setOrigin(0.15, 0.2);
    this.pokemonHatchedIcon.setScale(0.8);
    this.pokemonCaughtHatchedContainer.add(this.pokemonHatchedIcon);

    this.pokemonShinyIcons = [];
    for (let i = 0; i < 3; i++) {
      const pokemonShinyIcon = globalScene.add.sprite(153 + i * 13, 160, "shiny_icons");
      pokemonShinyIcon.setOrigin(0.15, 0.2);
      pokemonShinyIcon.setScale(1);
      pokemonShinyIcon.setFrame(getVariantIcon(i as Variant));
      pokemonShinyIcon.setVisible(false);
      this.pokemonCaughtHatchedContainer.add(pokemonShinyIcon);
      this.pokemonShinyIcons.push(pokemonShinyIcon);
    }

    this.pokemonHatchedCountText = addTextObject(24, 19, "0", TextStyle.SUMMARY_ALT);
    this.pokemonHatchedCountText.setOrigin(0, 0);
    this.pokemonCaughtHatchedContainer.add(this.pokemonHatchedCountText);

    // The font size should be set per language
    const instructionTextSize = textSettings.instructionTextSize;

    this.instructionsContainer = globalScene.add.container(4, 128);
    this.instructionsContainer.setVisible(true);
    this.starterSelectContainer.add(this.instructionsContainer);

    this.candyUpgradeIconElement = new Phaser.GameObjects.Sprite(
      globalScene,
      this.instructionRowX,
      this.instructionRowY,
      "keyboard",
      "C.png",
    );
    this.candyUpgradeIconElement.setName("sprite-candyUpgrade-icon-element");
    this.candyUpgradeIconElement.setScale(0.675);
    this.candyUpgradeIconElement.setOrigin(0.0, 0.0);
    this.candyUpgradeLabel = addTextObject(
      this.instructionRowX + this.instructionRowTextOffset,
      this.instructionRowY,
      i18next.t("pokedexUiHandler:candyUpgrade"),
      TextStyle.INSTRUCTIONS_TEXT,
      { fontSize: instructionTextSize },
    );
    this.candyUpgradeLabel.setName("text-candyUpgrade-label");

    // instruction rows that will be pushed into the container dynamically based on need
    // creating new sprites since they will be added to the scene later
    this.shinyIconElement = new Phaser.GameObjects.Sprite(
      globalScene,
      this.instructionRowX,
      this.instructionRowY,
      "keyboard",
      "R.png",
    );
    this.shinyIconElement.setName("sprite-shiny-icon-element");
    this.shinyIconElement.setScale(0.675);
    this.shinyIconElement.setOrigin(0.0, 0.0);
    this.shinyLabel = addTextObject(
      this.instructionRowX + this.instructionRowTextOffset,
      this.instructionRowY,
      i18next.t("pokedexUiHandler:cycleShiny"),
      TextStyle.INSTRUCTIONS_TEXT,
      { fontSize: instructionTextSize },
    );
    this.shinyLabel.setName("text-shiny-label");

    this.formIconElement = new Phaser.GameObjects.Sprite(
      globalScene,
      this.instructionRowX,
      this.instructionRowY,
      "keyboard",
      "F.png",
    );
    this.formIconElement.setName("sprite-form-icon-element");
    this.formIconElement.setScale(0.675);
    this.formIconElement.setOrigin(0.0, 0.0);
    this.formLabel = addTextObject(
      this.instructionRowX + this.instructionRowTextOffset,
      this.instructionRowY,
      i18next.t("pokedexUiHandler:cycleForm"),
      TextStyle.INSTRUCTIONS_TEXT,
      { fontSize: instructionTextSize },
    );
    this.formLabel.setName("text-form-label");

    this.genderIconElement = new Phaser.GameObjects.Sprite(
      globalScene,
      this.instructionRowX,
      this.instructionRowY,
      "keyboard",
      "G.png",
    );
    this.genderIconElement.setName("sprite-gender-icon-element");
    this.genderIconElement.setScale(0.675);
    this.genderIconElement.setOrigin(0.0, 0.0);
    this.genderLabel = addTextObject(
      this.instructionRowX + this.instructionRowTextOffset,
      this.instructionRowY,
      i18next.t("pokedexUiHandler:cycleGender"),
      TextStyle.INSTRUCTIONS_TEXT,
      { fontSize: instructionTextSize },
    );
    this.genderLabel.setName("text-gender-label");

    this.variantIconElement = new Phaser.GameObjects.Sprite(
      globalScene,
      this.instructionRowX,
      this.instructionRowY,
      "keyboard",
      "V.png",
    );
    this.variantIconElement.setName("sprite-variant-icon-element");
    this.variantIconElement.setScale(0.675);
    this.variantIconElement.setOrigin(0.0, 0.0);
    this.variantLabel = addTextObject(
      this.instructionRowX + this.instructionRowTextOffset,
      this.instructionRowY,
      i18next.t("pokedexUiHandler:cycleVariant"),
      TextStyle.INSTRUCTIONS_TEXT,
      { fontSize: instructionTextSize },
    );
    this.variantLabel.setName("text-variant-label");

    this.showBackSpriteIconElement = new Phaser.GameObjects.Sprite(globalScene, 50, 7, "keyboard", "E.png");
    this.showBackSpriteIconElement.setName("show-backSprite-icon-element");
    this.showBackSpriteIconElement.setScale(0.675);
    this.showBackSpriteIconElement.setOrigin(0.0, 0.0);
    this.showBackSpriteLabel = addTextObject(
      60,
      7,
      i18next.t("pokedexUiHandler:showBackSprite"),
      TextStyle.INSTRUCTIONS_TEXT,
      {
        fontSize: instructionTextSize,
      },
    );
    this.showBackSpriteLabel.setName("show-backSprite-label");
    this.starterSelectContainer.add(this.showBackSpriteIconElement);
    this.starterSelectContainer.add(this.showBackSpriteLabel);

    this.hideInstructions();

    this.filterInstructionsContainer = globalScene.add.container(50, 5);
    this.filterInstructionsContainer.setVisible(true);
    this.starterSelectContainer.add(this.filterInstructionsContainer);

    this.starterSelectMessageBoxContainer = globalScene.add.container(0, globalScene.scaledCanvas.height);
    this.starterSelectMessageBoxContainer.setVisible(false);
    this.starterSelectContainer.add(this.starterSelectMessageBoxContainer);

    this.starterSelectMessageBox = addWindow(1, -1, 318, 28);
    this.starterSelectMessageBox.setOrigin(0, 1);
    this.starterSelectMessageBoxContainer.add(this.starterSelectMessageBox);

    this.message = addTextObject(8, 8, "", TextStyle.WINDOW, { maxLines: 2 });
    this.message.setOrigin(0, 0);
    this.starterSelectMessageBoxContainer.add(this.message);

    // arrow icon for the message box
    this.initPromptSprite(this.starterSelectMessageBoxContainer);

    this.statsContainer = new StatsContainer(6, 16);

    globalScene.add.existing(this.statsContainer);

    this.statsContainer.setVisible(false);

    this.starterSelectContainer.add(this.statsContainer);

    // Adding menu container
    this.menuContainer = globalScene.add.container(-130, 0);
    this.menuContainer.setName("menu");
    this.menuContainer.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, globalScene.scaledCanvas.width, globalScene.scaledCanvas.height),
      Phaser.Geom.Rectangle.Contains,
    );

    this.menuContainer.setVisible(false);

    this.menuOptions = getEnumValues(MenuOptions);

    this.optionSelectText = addBBCodeTextObject(
      0,
      0,
      this.menuOptions.map(o => `${i18next.t(`pokedexUiHandler:${toCamelCase(`menu${MenuOptions[o]}`)}`)}`).join("\n"),
      TextStyle.WINDOW,
      { maxLines: this.menuOptions.length, lineSpacing: 12 },
    );

    this.menuDescriptions = [
      i18next.t("pokedexUiHandler:showBaseStats"),
      i18next.t("pokedexUiHandler:showAbilities"),
      i18next.t("pokedexUiHandler:showLevelMoves"),
      i18next.t("pokedexUiHandler:showEggMoves"),
      i18next.t("pokedexUiHandler:showTmMoves"),
      i18next.t("pokedexUiHandler:showBiomes"),
      i18next.t("pokedexUiHandler:showNatures"),
      i18next.t("pokedexUiHandler:toggleIVs"),
      i18next.t("pokedexUiHandler:showEvolutions"),
    ];

    this.scale = getTextStyleOptions(TextStyle.WINDOW).scale;
    this.menuBg = addWindow(
      globalScene.scaledCanvas.width - 83,
      0,
      this.optionSelectText.displayWidth + 19 + 24 * this.scale,
      globalScene.scaledCanvas.height - 2,
    );
    this.menuBg.setOrigin(0, 0);

    this.optionSelectText.setPosition(this.menuBg.x + 10 + 24 * this.scale, this.menuBg.y + 6);

    this.menuContainer.add(this.menuBg);

    this.menuContainer.add(this.optionSelectText);

    ui.add(this.menuContainer);

    this.starterSelectContainer.add(this.menuContainer);

    // adding base stats
    this.baseStatsOverlay = new BaseStatsOverlay({ x: 317, y: 0, width: 133 });
    this.menuContainer.add(this.baseStatsOverlay);
    this.menuContainer.bringToTop(this.baseStatsOverlay);

    // add the info overlay last to be the top most ui element and prevent the IVs from overlaying this
    this.moveInfoOverlay = new MoveInfoOverlay({
      top: true,
      x: 1,
      y: globalScene.scaledCanvas.height - MoveInfoOverlay.getHeight() - 29,
    });
    this.starterSelectContainer.add(this.moveInfoOverlay);

    this.infoOverlay = new PokedexInfoOverlay({
      x: 1,
      y: globalScene.scaledCanvas.height - PokedexInfoOverlay.getHeight() - 29,
    });
    this.starterSelectContainer.add(this.infoOverlay);

    // Filter bar sits above everything, except the message box
    this.starterSelectContainer.bringToTop(this.starterSelectMessageBoxContainer);

    this.previousSpecies = [];
    this.previousStarterAttributes = [];
  }

  show(args: any[]): boolean {
    // Allow the use of candies if we are in one of the whitelisted phases
    this.canUseCandies = ["TitlePhase", "SelectStarterPhase", "CommandPhase"].includes(
      globalScene.phaseManager.getCurrentPhase().phaseName,
    );

    if (args.length > 0 && args[0] === "refresh") {
      return false;
    }
    this.species = args[0];
    this.savedStarterAttributes = args[1] ?? {
      shiny: false,
      female: true,
      variant: 0,
      form: 0,
    };
    this.formIndex = this.savedStarterAttributes.form ?? 0;
    this.filteredIndices = args[2] ?? null;
    this.starterSetup();

    if (args[4] instanceof Function) {
      this.exitCallback = args[4];
    }

    this.moveInfoOverlay.clear(); // clear this when removing a menu; the cancel button doesn't seem to trigger this automatically on controllers
    this.infoOverlay.clear();

    super.show(args);

    this.starterSelectContainer.setVisible(true);
    this.getUi().bringToTop(this.starterSelectContainer);

    this.starterAttributes = this.initStarterPrefs();

    this.menuOptions = getEnumValues(MenuOptions);

    this.menuContainer.setVisible(true);

    this.speciesStarterDexEntry = this.species ? globalScene.gameData.dexData[this.species.speciesId] : null;
    this.setSpecies();
    this.updateInstructions();

    this.optionSelectText.setText(this.getMenuText());

    this.setCursor(0);

    return true;
  }

  getMenuText(): string {
    const isSeen = this.isSeen();
    const isStarterCaught = !!this.isCaught(this.getStarterSpecies(this.species));

    return this.menuOptions
      .map(o => {
        const label = i18next.t(`pokedexUiHandler:${toCamelCase(`menu${MenuOptions[o]}`)}`);
        const isDark =
          !isSeen
          || (!isStarterCaught && (o === MenuOptions.TOGGLE_IVS || o === MenuOptions.NATURES))
          || (this.tmMoves.length === 0 && o === MenuOptions.TM_MOVES);
        const color = getTextColor(isDark ? TextStyle.SHADOW_TEXT : TextStyle.SETTINGS_VALUE, false);
        const shadow = getTextColor(isDark ? TextStyle.SHADOW_TEXT : TextStyle.SETTINGS_VALUE, true);
        return `[shadow=${shadow}][color=${color}]${label}[/color][/shadow]`;
      })
      .join("\n");
  }

  starterSetup(): void {
    this.evolutions = [];
    this.prevolutions = [];
    this.battleForms = [];

    const species = this.species;

    let formKey = this.species?.forms.length > 0 ? this.species.forms[this.formIndex].formKey : "";
    this.isFormGender = formKey === "male" || formKey === "female";
    if (
      this.isFormGender
      && ((this.savedStarterAttributes.female === true && formKey === "male")
        || (this.savedStarterAttributes.female === false && formKey === "female"))
    ) {
      this.formIndex = (this.formIndex + 1) % 2;
      formKey = this.species.forms[this.formIndex].formKey;
    }

    const formIndex = this.formIndex ?? 0;

    this.starterId = this.getStarterSpeciesId(this.species.speciesId);

    const allEvolutions = pokemonEvolutions.hasOwnProperty(species.speciesId)
      ? pokemonEvolutions[species.speciesId]
      : [];

    if (species.forms.length > 0) {
      const form = species.forms[formIndex];

      // If this form has a specific set of moves, we get them.
      this.levelMoves =
        formIndex > 0
        && pokemonFormLevelMoves.hasOwnProperty(species.speciesId)
        && pokemonFormLevelMoves[species.speciesId].hasOwnProperty(formIndex)
          ? pokemonFormLevelMoves[species.speciesId][formIndex]
          : pokemonSpeciesLevelMoves[species.speciesId];
      this.ability1 = form.ability1;
      this.ability2 = form.ability2 === form.ability1 ? undefined : form.ability2;
      this.abilityHidden = form.abilityHidden === form.ability1 ? undefined : form.abilityHidden;

      this.evolutions = allEvolutions.filter(e => e.preFormKey === form.formKey || e.preFormKey === null);
      this.baseStats = form.baseStats;
      this.baseTotal = form.baseTotal;
    } else {
      this.levelMoves = pokemonSpeciesLevelMoves[species.speciesId];
      this.ability1 = species.ability1;
      this.ability2 = species.ability2 === species.ability1 ? undefined : species.ability2;
      this.abilityHidden = species.abilityHidden === species.ability1 ? undefined : species.abilityHidden;

      this.evolutions = allEvolutions;
      this.baseStats = species.baseStats;
      this.baseTotal = species.baseTotal;
    }

    this.eggMoves = speciesEggMoves[this.starterId] ?? [];
    this.hasEggMoves = Array.from(
      { length: 4 },
      (_, em) => (globalScene.gameData.starterData[this.starterId].eggMoves & (1 << em)) !== 0,
    );

    this.tmMoves =
      speciesTmMoves[species.speciesId]
        ?.filter(m => (Array.isArray(m) ? m[0] === formKey : true))
        .map(m => (Array.isArray(m) ? m[1] : m))
        .sort((a, b) => (allMoves[a].name > allMoves[b].name ? 1 : -1)) ?? [];

    const passiveId = starterPassiveAbilities.hasOwnProperty(species.speciesId)
      ? species.speciesId
      : starterPassiveAbilities.hasOwnProperty(this.starterId)
        ? this.starterId
        : pokemonPrevolutions[this.starterId];
    const passives = starterPassiveAbilities[passiveId];
    this.passive = this.formIndex in passives ? passives[formIndex] : passives[0];

    const starterData = globalScene.gameData.starterData[this.starterId];
    const abilityAttr = starterData.abilityAttr;
    this.hasPassive = starterData.passiveAttr > 0;

    const hasAbility1 = abilityAttr & AbilityAttr.ABILITY_1;
    const hasAbility2 = abilityAttr & AbilityAttr.ABILITY_2;
    const hasHiddenAbility = abilityAttr & AbilityAttr.ABILITY_HIDDEN;

    this.hasAbilities = [hasAbility1, hasAbility2, hasHiddenAbility];

    const allBiomes = catchableSpecies[species.speciesId] ?? [];
    this.preBiomes = this.sanitizeBiomes(
      (catchableSpecies[this.starterId] ?? []).filter(
        b => !allBiomes.some(bm => b.biome === bm.biome && b.tier === bm.tier) && !(b.biome === BiomeId.TOWN),
      ),
      this.starterId,
    );
    this.biomes = this.sanitizeBiomes(allBiomes, species.speciesId);

    const allFormChanges = pokemonFormChanges.hasOwnProperty(species.speciesId)
      ? pokemonFormChanges[species.speciesId]
      : [];
    this.battleForms = allFormChanges.filter(f => f.preFormKey === this.species.forms[this.formIndex].formKey);

    const preSpecies = pokemonPrevolutions.hasOwnProperty(this.species.speciesId)
      ? allSpecies.find(sp => sp.speciesId === pokemonPrevolutions[this.species.speciesId])
      : null;
    if (preSpecies) {
      const preEvolutions = pokemonEvolutions.hasOwnProperty(preSpecies.speciesId)
        ? pokemonEvolutions[preSpecies.speciesId]
        : [];
      this.prevolutions = preEvolutions.filter(
        e =>
          e.speciesId === species.speciesId
          && (((e.evoFormKey === "" || e.evoFormKey === null) // This takes care of Cosplay Pikachu (Pichu is not shown)
            && (preSpecies.forms.some(form => form.formKey === species.forms[formIndex]?.formKey) // This takes care of Gholdengo
              || (preSpecies.forms.length > 0 && species.forms.length === 0) // This takes care of everything else
              || (preSpecies.forms.length === 0
                && (species.forms.length === 0 || species.forms[formIndex]?.formKey === "")))) // This takes care of Burmy, Shellos etc
            || e.evoFormKey === species.forms[formIndex]?.formKey),
      );
    }

    this.availableVariants = species.getFullUnlocksData() & DexAttr.VARIANT_3 ? 3 : 1;
  }

  // Function to ensure that forms appear in the appropriate biome and tod
  sanitizeBiomes(biomes: BiomeTierTod[], speciesId: number): BiomeTierTod[] {
    if (speciesId === SpeciesId.BURMY || speciesId === SpeciesId.WORMADAM) {
      return biomes.filter(b => {
        const formIndex = (() => {
          switch (b.biome) {
            case BiomeId.BEACH:
              return 1;
            case BiomeId.SLUM:
              return 2;
            default:
              return 0;
          }
        })();
        return this.formIndex === formIndex;
      });
    }
    if (speciesId === SpeciesId.ROTOM) {
      return biomes.filter(b => {
        const formIndex = (() => {
          switch (b.biome) {
            case BiomeId.VOLCANO:
              return 1;
            case BiomeId.SEA:
              return 2;
            case BiomeId.ICE_CAVE:
              return 3;
            case BiomeId.MOUNTAIN:
              return 4;
            case BiomeId.TALL_GRASS:
              return 5;
            default:
              return 0;
          }
        })();
        return this.formIndex === formIndex;
      });
    }
    if (speciesId === SpeciesId.LYCANROC) {
      return biomes.filter(b => {
        const formIndex = (() => {
          switch (b.tod[0]) {
            case TimeOfDay.DAY:
            case TimeOfDay.DAWN:
              return 0;
            case TimeOfDay.DUSK:
              return 2;
            case TimeOfDay.NIGHT:
              return 1;
            default:
              return 0;
          }
        })();
        return this.formIndex === formIndex;
      });
    }

    return biomes;
  }

  /**
   * Return the caughtAttr of a given species, sanitized.
   *
   * @param otherSpecies The species to check; defaults to current species
   * @returns caught DexAttr for the species
   */
  isCaught(otherSpecies?: PokemonSpecies): bigint {
    const species = otherSpecies ? otherSpecies : this.species;

    if (globalScene.dexForDevs) {
      species.getFullUnlocksData();
    }

    const dexEntry = globalScene.gameData.dexData[species.speciesId];

    return (dexEntry?.caughtAttr ?? 0n) & species.getFullUnlocksData();
  }

  /**
   * Check whether a given form is caught for a given species.
   * All forms that can be reached through a form change during battle are considered caught and show up in the dex as such.
   *
   * @param otherSpecies The species to check; defaults to current species
   * @param otherFormIndex The form index of the form to check; defaults to current form
   * @returns `true` if the form is caught
   */
  isFormCaught(otherSpecies?: PokemonSpecies, otherFormIndex?: number | undefined): boolean {
    if (globalScene.dexForDevs) {
      return true;
    }
    const species = otherSpecies ? otherSpecies : this.species;
    const formIndex = otherFormIndex !== undefined ? otherFormIndex : this.formIndex;
    const caughtAttr = this.isCaught(species);

    if (caughtAttr && (species.forms.length === 0 || species.forms.length === 1)) {
      return true;
    }

    const isFormCaught = (caughtAttr & globalScene.gameData.getFormAttr(formIndex ?? 0)) > 0n;

    return isFormCaught;
  }

  isSeen(): boolean {
    if (this.speciesStarterDexEntry?.seenAttr) {
      return true;
    }
    const starterCaughtAttr = this.isCaught(this.getStarterSpecies(this.species));
    return !!starterCaughtAttr;
  }

  /**
   * Get the starter attributes for the given PokemonSpecies, after sanitizing them.
   * If somehow a preference is set for a form, variant, gender, ability or nature
   * that wasn't actually unlocked or is invalid it will be cleared here
   *
   * @param species The species to get Starter Preferences for
   * @returns StarterAttributes for the species
   */
  initStarterPrefs(): StarterAttributes {
    const starterAttributes: StarterAttributes | null = this.species ? { ...this.savedStarterAttributes } : null;
    const caughtAttr = this.isCaught();

    // no preferences or Pokemon wasn't caught, return empty attribute
    if (!starterAttributes || !this.isSeen()) {
      return {};
    }

    const hasShiny = caughtAttr & DexAttr.SHINY;
    const hasNonShiny = caughtAttr & DexAttr.NON_SHINY;
    if (!hasShiny || (starterAttributes.shiny === undefined && hasNonShiny)) {
      // shiny form wasn't unlocked, purging shiny and variant setting
      starterAttributes.shiny = false;
      starterAttributes.variant = 0;
    } else if (!hasNonShiny || (starterAttributes.shiny === undefined && hasShiny)) {
      starterAttributes.shiny = true;
      starterAttributes.variant = 0;
    }

    this.unlockedVariants = [
      !!(hasShiny && caughtAttr & DexAttr.DEFAULT_VARIANT),
      !!(hasShiny && caughtAttr & DexAttr.VARIANT_2),
      !!(hasShiny && caughtAttr & DexAttr.VARIANT_3),
    ];
    if (
      starterAttributes.variant === undefined
      || Number.isNaN(starterAttributes.variant)
      || starterAttributes.variant < 0
    ) {
      starterAttributes.variant = 0;
    } else if (!this.unlockedVariants[starterAttributes.variant]) {
      let highestValidIndex = -1;
      for (let i = 0; i <= starterAttributes.variant && i < this.unlockedVariants.length; i++) {
        if (this.unlockedVariants[i]) {
          highestValidIndex = i;
        }
      }
      // Set to the highest valid index found or default to 0
      starterAttributes.variant = highestValidIndex !== -1 ? highestValidIndex : 0;
    }

    if (starterAttributes.female !== undefined) {
      if (
        (starterAttributes.female && !(caughtAttr & DexAttr.FEMALE))
        || (!starterAttributes.female && !(caughtAttr & DexAttr.MALE))
      ) {
        starterAttributes.female = !starterAttributes.female;
      }
    } else if (caughtAttr & DexAttr.FEMALE) {
      starterAttributes.female = true;
    } else if (caughtAttr & DexAttr.MALE) {
      starterAttributes.female = false;
    }

    return starterAttributes;
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
      this.starterSelectMessageBox.setOrigin(0, 0);
      this.starterSelectMessageBoxContainer.setY(0);
      this.message.setY(4);
    } else {
      this.starterSelectMessageBoxContainer.setY(globalScene.scaledCanvas.height);
      this.starterSelectMessageBox.setOrigin(0, 1);
      this.message.setY(singleLine ? -22 : -37);
    }

    this.starterSelectMessageBoxContainer.setVisible(text?.length > 0);
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
   * If the pokemon is an evolution, find speciesId of its starter.
   * @param speciesId the id of the species to check
   * @returns the id of the corresponding starter
   */
  getStarterSpeciesId(speciesId): number {
    if (speciesId === SpeciesId.PIKACHU) {
      if ([0, 1, 8].includes(this.formIndex)) {
        return SpeciesId.PICHU;
      }
      return SpeciesId.PIKACHU;
    }
    if (speciesStarterCosts.hasOwnProperty(speciesId)) {
      return speciesId;
    }
    return pokemonStarters[speciesId];
  }

  getStarterSpecies(species): PokemonSpecies {
    if (speciesStarterCosts.hasOwnProperty(species.speciesId)) {
      return species;
    }
    return allSpecies.find(sp => sp.speciesId === pokemonStarters[species.speciesId]) ?? species;
  }

  processInput(button: Button): boolean {
    if (this.blockInput) {
      return false;
    }

    const ui = this.getUi();

    let success = false;
    let error = false;

    const isCaught = this.isCaught();
    const isFormCaught = this.isFormCaught();
    const isSeen = this.isSeen();
    const isStarterCaught = !!this.isCaught(this.getStarterSpecies(this.species));

    if (this.blockInputOverlay) {
      if (button === Button.CANCEL || button === Button.ACTION) {
        this.blockInputOverlay = false;
        this.baseStatsOverlay.clear();
        ui.showText("");
        return true;
      }
      if (button === Button.UP || button === Button.DOWN) {
        this.blockInputOverlay = false;
        this.baseStatsOverlay.clear();
        ui.showText("");
      } else {
        return false;
      }
    }

    if (button === Button.SUBMIT) {
      success = true;
    } else if (button === Button.CANCEL) {
      if (this.statsMode) {
        this.toggleStatsMode(false);
        success = true;
      } else if (this.previousSpecies.length > 0) {
        this.blockInput = true;
        ui.setModeWithoutClear(UiMode.OPTION_SELECT).then(() => {
          const species = this.previousSpecies.pop();
          const starterAttributes = this.previousStarterAttributes.pop();
          this.moveInfoOverlay.clear();
          this.clearText();
          ui.setModeForceTransition(UiMode.POKEDEX_PAGE, species, starterAttributes);
          success = true;
        });
        this.blockInput = false;
      } else {
        ui.revertMode().then(() => {
          if (this.exitCallback instanceof Function) {
            const exitCallback = this.exitCallback;
            this.exitCallback = null;
            exitCallback();
          }
        });
        success = true;
      }
    } else {
      const starterData = globalScene.gameData.starterData[this.starterId];
      // prepare persistent starter data to store changes
      const starterAttributes = this.starterAttributes;

      if (button === Button.ACTION) {
        switch (this.cursor) {
          case MenuOptions.BASE_STATS:
            if (!isSeen) {
              error = true;
            } else {
              this.blockInput = true;

              ui.setMode(UiMode.POKEDEX_PAGE, "refresh").then(() => {
                ui.showText(i18next.t("pokedexUiHandler:showBaseStats"), null, () => {
                  this.baseStatsOverlay.show(this.baseStats, this.baseTotal);

                  this.blockInput = false;
                  this.blockInputOverlay = true;

                  return true;
                });
                success = true;
              });
            }
            break;

          case MenuOptions.LEVEL_MOVES:
            if (!isSeen) {
              error = true;
            } else {
              this.blockInput = true;

              ui.setMode(UiMode.POKEDEX_PAGE, "refresh").then(() => {
                ui.showText(i18next.t("pokedexUiHandler:showLevelMoves"), null, () => {
                  this.moveInfoOverlay.show(allMoves[this.levelMoves[0][1]]);

                  ui.setModeWithoutClear(UiMode.OPTION_SELECT, {
                    options: this.levelMoves
                      .map(m => {
                        const levelNumber = m[0] > 0 ? String(m[0]) : "";
                        const option: OptionSelectItem = {
                          label: levelNumber.padEnd(4, " ") + allMoves[m[1]].name,
                          handler: () => {
                            return false;
                          },
                          onHover: () => {
                            this.moveInfoOverlay.show(allMoves[m[1]]);
                            if (m[0] === 0) {
                              this.showText(i18next.t("pokedexUiHandler:onlyEvolutionMove"));
                            } else if (m[0] === -1) {
                              this.showText(i18next.t("pokedexUiHandler:onlyRecallMove"));
                            } else if (m[0] <= 5) {
                              this.showText(i18next.t("pokedexUiHandler:onStarterSelectMove"));
                            } else {
                              this.showText(i18next.t("pokedexUiHandler:byLevelUpMove"));
                            }
                          },
                        };
                        return option;
                      })
                      .concat({
                        label: i18next.t("menu:cancel"),
                        handler: () => {
                          this.moveInfoOverlay.clear();
                          this.clearText();
                          ui.setMode(UiMode.POKEDEX_PAGE, "refresh");
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
              success = true;
            }
            break;

          case MenuOptions.EGG_MOVES:
            if (!isSeen) {
              error = true;
            } else {
              this.blockInput = true;

              ui.setMode(UiMode.POKEDEX_PAGE, "refresh").then(() => {
                if (this.eggMoves.length === 0) {
                  ui.showText(i18next.t("pokedexUiHandler:noEggMoves"));
                  this.blockInput = false;
                  return true;
                }

                ui.showText(i18next.t("pokedexUiHandler:showEggMoves"), null, () => {
                  this.moveInfoOverlay.show(allMoves[this.eggMoves[0]]);

                  ui.setModeWithoutClear(UiMode.OPTION_SELECT, {
                    options: [
                      {
                        label: i18next.t("pokedexUiHandler:common"),
                        skip: true,
                        style: TextStyle.MONEY_WINDOW,
                        handler: () => false, // Non-selectable, but handler is required
                        onHover: () => this.moveInfoOverlay.clear(), // No hover behavior for titles
                      },
                      ...this.eggMoves.slice(0, 3).map((m, i) => ({
                        label: allMoves[m].name,
                        style: this.hasEggMoves[i] ? TextStyle.SETTINGS_VALUE : TextStyle.SHADOW_TEXT,
                        handler: () => false,
                        onHover: () => this.moveInfoOverlay.show(allMoves[m]),
                      })),
                      {
                        label: i18next.t("pokedexUiHandler:rare"),
                        skip: true,
                        style: TextStyle.MONEY_WINDOW,
                        handler: () => false,
                        onHover: () => this.moveInfoOverlay.clear(),
                      },
                      {
                        label: allMoves[this.eggMoves[3]].name,
                        style: this.hasEggMoves[3] ? TextStyle.SETTINGS_VALUE : TextStyle.SHADOW_TEXT,
                        handler: () => false,
                        onHover: () => this.moveInfoOverlay.show(allMoves[this.eggMoves[3]]),
                      },
                      {
                        label: i18next.t("menu:cancel"),
                        handler: () => {
                          this.moveInfoOverlay.clear();
                          this.clearText();
                          ui.setMode(UiMode.POKEDEX_PAGE, "refresh");
                          return true;
                        },
                        onHover: () => this.moveInfoOverlay.clear(),
                      },
                    ],
                    supportHover: true,
                    maxOptions: 8,
                    yOffset: 19,
                  });

                  this.blockInput = false;
                });
              });
              success = true;
            }
            break;

          case MenuOptions.TM_MOVES:
            if (!isSeen) {
              error = true;
            } else if (this.tmMoves.length === 0) {
              ui.showText(i18next.t("pokedexUiHandler:noTmMoves"));
              error = true;
            } else {
              this.blockInput = true;

              ui.setMode(UiMode.POKEDEX_PAGE, "refresh").then(() => {
                ui.showText(i18next.t("pokedexUiHandler:showTmMoves"), null, () => {
                  this.moveInfoOverlay.show(allMoves[this.tmMoves[0]]);

                  ui.setModeWithoutClear(UiMode.OPTION_SELECT, {
                    options: this.tmMoves
                      .map(m => {
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
                      })
                      .concat({
                        label: i18next.t("menu:cancel"),
                        handler: () => {
                          this.moveInfoOverlay.clear();
                          this.clearText();
                          ui.setMode(UiMode.POKEDEX_PAGE, "refresh");
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
              success = true;
            }
            break;

          case MenuOptions.ABILITIES:
            if (!isSeen) {
              error = true;
            } else {
              this.blockInput = true;

              ui.setMode(UiMode.POKEDEX_PAGE, "refresh").then(() => {
                ui.showText(i18next.t("pokedexUiHandler:showAbilities"), null, () => {
                  this.infoOverlay.show(allAbilities[this.ability1].description);

                  const options: any[] = [];

                  if (this.ability1) {
                    options.push({
                      label: allAbilities[this.ability1].name,
                      style: this.hasAbilities[0] > 0 ? TextStyle.SETTINGS_VALUE : TextStyle.SHADOW_TEXT,
                      handler: () => false,
                      onHover: () => this.infoOverlay.show(allAbilities[this.ability1].description),
                    });
                  }
                  if (this.ability2) {
                    const ability = allAbilities[this.ability2];
                    options.push({
                      label: ability?.name,
                      style: this.hasAbilities[1] > 0 ? TextStyle.SETTINGS_VALUE : TextStyle.SHADOW_TEXT,
                      handler: () => false,
                      onHover: () => this.infoOverlay.show(ability?.description),
                    });
                  }

                  if (this.abilityHidden) {
                    options.push({
                      label: i18next.t("pokedexUiHandler:hidden"),
                      skip: true,
                      style: TextStyle.MONEY_WINDOW,
                      handler: () => false,
                      onHover: () => this.infoOverlay.clear(),
                    });
                    const ability = allAbilities[this.abilityHidden];
                    options.push({
                      label: allAbilities[this.abilityHidden].name,
                      style: this.hasAbilities[2] > 0 ? TextStyle.SETTINGS_VALUE : TextStyle.SHADOW_TEXT,
                      handler: () => false,
                      onHover: () => this.infoOverlay.show(ability?.description),
                    });
                  }

                  if (this.passive) {
                    options.push({
                      label: i18next.t("pokedexUiHandler:passive"),
                      skip: true,
                      style: TextStyle.MONEY_WINDOW,
                      handler: () => false,
                      onHover: () => this.infoOverlay.clear(),
                    });
                    options.push({
                      label: allAbilities[this.passive].name,
                      style: this.hasPassive ? TextStyle.SETTINGS_VALUE : TextStyle.SHADOW_TEXT,
                      handler: () => false,
                      onHover: () => this.infoOverlay.show(allAbilities[this.passive].description),
                    });
                  }

                  options.push({
                    label: i18next.t("menu:cancel"),
                    handler: () => {
                      this.infoOverlay.clear();
                      this.clearText();
                      ui.setMode(UiMode.POKEDEX_PAGE, "refresh");
                      return true;
                    },
                    onHover: () => this.infoOverlay.clear(),
                  });

                  ui.setModeWithoutClear(UiMode.OPTION_SELECT, {
                    options,
                    supportHover: true,
                    maxOptions: 8,
                    yOffset: 19,
                  });

                  this.blockInput = false;
                });
              });
              success = true;
            }
            break;

          case MenuOptions.BIOMES:
            if (!isSeen) {
              error = true;
            } else {
              this.blockInput = true;

              ui.setMode(UiMode.POKEDEX_PAGE, "refresh").then(() => {
                if ((!this.biomes || this.biomes?.length === 0) && (!this.preBiomes || this.preBiomes?.length === 0)) {
                  ui.showText(i18next.t("pokedexUiHandler:noBiomes"));
                  ui.playError();
                  this.blockInput = false;
                  return true;
                }

                const options: any[] = [];

                ui.showText(i18next.t("pokedexUiHandler:showBiomes"), null, () => {
                  this.biomes.map(b => {
                    options.push({
                      label:
                        i18next.t(`biome:${toCamelCase(BiomeId[b.biome])}`)
                        + " - "
                        + i18next.t(`biome:${toCamelCase(BiomePoolTier[b.tier])}`)
                        + (b.tod.length === 1 && b.tod[0] === -1
                          ? ""
                          : " ("
                            + b.tod.map(tod => i18next.t(`biome:${toCamelCase(TimeOfDay[tod])}`)).join(", ")
                            + ")"),
                      handler: () => false,
                    });
                  });

                  if (this.preBiomes.length > 0) {
                    options.push({
                      label: i18next.t("pokedexUiHandler:preBiomes"),
                      skip: true,
                      handler: () => false,
                    });
                    this.preBiomes.map(b => {
                      options.push({
                        label:
                          i18next.t(`biome:${toCamelCase(BiomeId[b.biome])}`)
                          + " - "
                          + i18next.t(`biome:${toCamelCase(BiomePoolTier[b.tier])}`)
                          + (b.tod.length === 1 && b.tod[0] === -1
                            ? ""
                            : " ("
                              + b.tod.map(tod => i18next.t(`biome:${toCamelCase(TimeOfDay[tod])}`)).join(", ")
                              + ")"),
                        handler: () => false,
                      });
                    });
                  }

                  options.push({
                    label: i18next.t("menu:cancel"),
                    handler: () => {
                      this.moveInfoOverlay.clear();
                      this.clearText();
                      ui.setMode(UiMode.POKEDEX_PAGE, "refresh");
                      return true;
                    },
                    onHover: () => this.moveInfoOverlay.clear(),
                  });

                  ui.setModeWithoutClear(UiMode.OPTION_SELECT, {
                    options,
                    supportHover: true,
                    maxOptions: 8,
                    yOffset: 19,
                  });

                  this.blockInput = false;
                });
              });
              success = true;
            }
            break;

          case MenuOptions.EVOLUTIONS:
            if (!isSeen) {
              error = true;
            } else {
              this.blockInput = true;

              ui.setMode(UiMode.POKEDEX_PAGE, "refresh").then(() => {
                const options: any[] = [];

                if (
                  (!this.prevolutions || this.prevolutions?.length === 0)
                  && (!this.evolutions || this.evolutions?.length === 0)
                  && (!this.battleForms || this.battleForms?.length === 0)
                ) {
                  ui.showText(i18next.t("pokedexUiHandler:noEvolutions"));
                  ui.playError();
                  this.blockInput = false;
                  return true;
                }

                ui.showText(i18next.t("pokedexUiHandler:showEvolutions"), null, () => {
                  if (this.prevolutions?.length > 0) {
                    options.push({
                      label: i18next.t("pokedexUiHandler:prevolutions"),
                      style: TextStyle.MONEY_WINDOW,
                      skip: true,
                      handler: () => false,
                    });
                    this.prevolutions.map(pre => {
                      const preSpecies = allSpecies.find(
                        species => species.speciesId === pokemonPrevolutions[this.species.speciesId],
                      );
                      const preFormIndex: number =
                        preSpecies?.forms.find(f => f.formKey === pre.preFormKey)?.formIndex ?? 0;

                      const conditionText: string = pre.description;

                      options.push({
                        label: pre.preFormKey
                          ? (preSpecies ?? this.species).getFormNameToDisplay(preFormIndex, true)
                          : (preSpecies ?? this.species).getExpandedSpeciesName(),
                        handler: () => {
                          this.previousSpecies.push(this.species);
                          this.previousStarterAttributes.push({ ...this.savedStarterAttributes });
                          const newSpecies = allSpecies.find(
                            species => species.speciesId === pokemonPrevolutions[pre.speciesId],
                          );
                          // Attempts to find the formIndex of the prevolved species
                          const newFormKey = pre.preFormKey
                            ? pre.preFormKey
                            : this.species.forms.length > 0
                              ? this.species.forms[this.formIndex].formKey
                              : "";
                          const matchingForm = newSpecies?.forms.find(form => form.formKey === newFormKey);
                          const newFormIndex = matchingForm ? matchingForm.formIndex : 0;
                          this.starterAttributes.form = newFormIndex;
                          this.savedStarterAttributes.form = newFormIndex;
                          this.moveInfoOverlay.clear();
                          this.clearText();
                          ui.setMode(UiMode.POKEDEX_PAGE, newSpecies, this.savedStarterAttributes);
                          return true;
                        },
                        onHover: () => this.showText(conditionText),
                      });
                    });
                  }

                  if (this.evolutions.length > 0) {
                    options.push({
                      label: i18next.t("pokedexUiHandler:evolutions"),
                      style: TextStyle.MONEY_WINDOW,
                      skip: true,
                      handler: () => false,
                    });
                    this.evolutions.map(evo => {
                      const evoSpecies = allSpecies.find(species => species.speciesId === evo.speciesId);
                      const isCaughtEvo = !!this.isCaught(evoSpecies);
                      // Attempts to find the formIndex of the evolved species
                      const newFormKey = evo.evoFormKey
                        ? evo.evoFormKey
                        : this.species.forms.length > 0
                          ? this.species.forms[this.formIndex].formKey
                          : "";
                      const matchingForm = evoSpecies?.forms.find(form => form.formKey === newFormKey);
                      const newFormIndex = matchingForm ? matchingForm.formIndex : 0;
                      const isFormCaughtEvo = this.isFormCaught(evoSpecies, newFormIndex);

                      const conditionText: string = evo.description;

                      options.push({
                        label: evo.evoFormKey
                          ? (evoSpecies ?? this.species).getFormNameToDisplay(newFormIndex, true)
                          : (evoSpecies ?? this.species).getExpandedSpeciesName(),
                        style: isCaughtEvo && isFormCaughtEvo ? TextStyle.WINDOW : TextStyle.SHADOW_TEXT,
                        handler: () => {
                          this.previousSpecies.push(this.species);
                          this.previousStarterAttributes.push({ ...this.savedStarterAttributes });
                          this.starterAttributes.form = newFormIndex;
                          this.savedStarterAttributes.form = newFormIndex;
                          this.moveInfoOverlay.clear();
                          this.clearText();
                          ui.setMode(UiMode.POKEDEX_PAGE, evoSpecies, this.savedStarterAttributes);
                          return true;
                        },
                        onHover: () => this.showText(conditionText),
                      });
                    });
                  }

                  if (this.battleForms.length > 0) {
                    options.push({
                      label: i18next.t("pokedexUiHandler:forms"),
                      style: TextStyle.MONEY_WINDOW,
                      skip: true,
                      handler: () => false,
                    });
                    this.battleForms.map(bf => {
                      const matchingForm = this.species?.forms.find(form => form.formKey === bf.formKey);
                      const newFormIndex = matchingForm ? matchingForm.formIndex : 0;

                      let conditionText = "";
                      if (bf.trigger) {
                        conditionText = bf.trigger.description;
                      } else {
                        conditionText = "";
                      }
                      let label: string = this.species.getFormNameToDisplay(newFormIndex);
                      if (label === "") {
                        label = this.species.name;
                      }
                      const isFormCaught = this.isFormCaught(this.species, newFormIndex);

                      if (conditionText) {
                        options.push({
                          label,
                          style: isFormCaught ? TextStyle.WINDOW : TextStyle.SHADOW_TEXT,
                          handler: () => {
                            this.previousSpecies.push(this.species);
                            this.previousStarterAttributes.push({ ...this.savedStarterAttributes });
                            const newSpecies = this.species;
                            const newFormIndex = this.species.forms.find(f => f.formKey === bf.formKey)?.formIndex;
                            this.starterAttributes.form = newFormIndex;
                            this.savedStarterAttributes.form = newFormIndex;
                            this.moveInfoOverlay.clear();
                            this.clearText();
                            ui.setMode(
                              UiMode.POKEDEX_PAGE,
                              newSpecies,
                              this.savedStarterAttributes,
                              this.filteredIndices,
                            );
                            return true;
                          },
                          onHover: () => this.showText(conditionText),
                        });
                      }
                    });
                  }

                  options.push({
                    label: i18next.t("menu:cancel"),
                    handler: () => {
                      this.moveInfoOverlay.clear();
                      this.clearText();
                      ui.setMode(UiMode.POKEDEX_PAGE, "refresh");
                      return true;
                    },
                    onHover: () => this.moveInfoOverlay.clear(),
                  });

                  ui.setModeWithoutClear(UiMode.OPTION_SELECT, {
                    options,
                    supportHover: true,
                    maxOptions: 8,
                    yOffset: 19,
                  });

                  this.blockInput = false;
                });
              });
              success = true;
            }
            break;

          case MenuOptions.TOGGLE_IVS:
            if (!isStarterCaught) {
              error = true;
            } else {
              this.toggleStatsMode();
              ui.setMode(UiMode.POKEDEX_PAGE, "refresh");
              success = true;
            }
            break;

          case MenuOptions.NATURES:
            if (!isStarterCaught) {
              error = true;
            } else {
              this.blockInput = true;
              ui.setMode(UiMode.POKEDEX_PAGE, "refresh").then(() => {
                ui.showText(i18next.t("pokedexUiHandler:showNature"), null, () => {
                  const starterDexEntry =
                    globalScene.gameData.dexData[this.getStarterSpeciesId(this.species.speciesId)];
                  const natures = globalScene.gameData.getNaturesForAttr(starterDexEntry.natureAttr);
                  ui.setModeWithoutClear(UiMode.OPTION_SELECT, {
                    options: natures
                      .map((n: Nature, _i: number) => {
                        const option: OptionSelectItem = {
                          label: getNatureName(n, true, true, true),
                          handler: () => {
                            return false;
                          },
                        };
                        return option;
                      })
                      .concat({
                        label: i18next.t("menu:cancel"),
                        handler: () => {
                          this.clearText();
                          ui.setMode(UiMode.POKEDEX_PAGE, "refresh");
                          this.blockInput = false;
                          return true;
                        },
                      }),
                    maxOptions: 8,
                    yOffset: 19,
                  });
                });
              });
              success = true;
            }
            break;
        }
      } else {
        const props = globalScene.gameData.getSpeciesDexAttrProps(
          this.species,
          this.getCurrentDexProps(this.species.speciesId),
        );
        switch (button) {
          case Button.CYCLE_SHINY:
            if (this.canCycleShiny) {
              if (!starterAttributes.shiny) {
                // Change to shiny, we need to get the proper default variant
                const newVariant = starterAttributes.variant ? (starterAttributes.variant as Variant) : 0;
                this.setSpeciesDetails(this.species, {
                  shiny: true,
                  variant: newVariant,
                });

                globalScene.playSound("se/sparkle");

                starterAttributes.shiny = true;
                this.savedStarterAttributes.shiny = starterAttributes.shiny;
              } else {
                let newVariant = props.variant;
                do {
                  newVariant = (newVariant + 1) % 3;
                  if (newVariant === 0) {
                    if (this.isCaught() & DexAttr.DEFAULT_VARIANT) {
                      break;
                    }
                  } else if (newVariant === 1) {
                    if (this.isCaught() & DexAttr.VARIANT_2) {
                      break;
                    }
                  } else if (this.isCaught() & DexAttr.VARIANT_3) {
                    break;
                  }
                } while (newVariant !== props.variant);

                starterAttributes.variant = newVariant; // store the selected variant
                this.savedStarterAttributes.variant = starterAttributes.variant;
                if (this.isCaught() & DexAttr.NON_SHINY && newVariant <= props.variant) {
                  this.setSpeciesDetails(this.species, {
                    shiny: false,
                    variant: 0,
                  });
                  success = true;
                  starterAttributes.shiny = false;
                  this.savedStarterAttributes.shiny = starterAttributes.shiny;
                } else {
                  this.setSpeciesDetails(this.species, {
                    variant: newVariant as Variant,
                  });
                  success = true;
                }
              }
            }
            break;
          case Button.CYCLE_FORM:
            if (this.canCycleForm) {
              const formCount = this.species.forms.length;
              let newFormIndex = this.formIndex;
              do {
                newFormIndex = (newFormIndex + 1) % formCount;
                if (this.species.forms[newFormIndex].isStarterSelectable || globalScene.dexForDevs) {
                  // TODO: are those bangs correct?
                  break;
                }
              } while (newFormIndex !== props.formIndex || this.species.forms[newFormIndex].isUnobtainable);
              starterAttributes.form = newFormIndex; // store the selected form
              this.savedStarterAttributes.form = starterAttributes.form;
              this.formIndex = newFormIndex;
              // Some forms are tied to the gender and should change accordingly
              let newFemale = props.female;
              if (this.isFormGender) {
                newFemale = !props.female;
              }
              starterAttributes.female = newFemale;
              this.savedStarterAttributes.female = starterAttributes.female;
              this.starterSetup();
              this.setSpeciesDetails(this.species, {
                formIndex: newFormIndex,
                female: newFemale,
              });
              success = this.setCursor(this.cursor);
            }
            break;
          case Button.CYCLE_GENDER:
            if (this.canCycleGender) {
              starterAttributes.female = !props.female;
              this.savedStarterAttributes.female = starterAttributes.female;
              let newFormIndex = this.formIndex;
              // Some forms are tied to the gender and should change accordingly
              if (this.isFormGender) {
                newFormIndex = this.formIndex === 0 ? 1 : 0;
              }
              starterAttributes.form = newFormIndex; // store the selected form
              this.savedStarterAttributes.form = starterAttributes.form;
              this.formIndex = newFormIndex;
              this.starterSetup();
              this.setSpeciesDetails(this.species, {
                female: !props.female,
                formIndex: newFormIndex,
              });
              success = true;
            }
            break;
          case Button.STATS:
            if (!isCaught || !isFormCaught || !this.canUseCandies) {
              error = true;
            } else {
              const ui = this.getUi();
              ui.showText("");
              const options: any[] = []; // TODO: add proper type

              const passiveAttr = starterData.passiveAttr;
              const candyCount = starterData.candyCount;

              if (!(passiveAttr & PassiveAttr.UNLOCKED)) {
                const passiveCost = getPassiveCandyCount(speciesStarterCosts[this.starterId]);
                options.push({
                  label: `×${passiveCost} ${i18next.t("pokedexUiHandler:unlockPassive")}`,
                  handler: () => {
                    if (Overrides.FREE_CANDY_UPGRADE_OVERRIDE || candyCount >= passiveCost) {
                      starterData.passiveAttr |= PassiveAttr.UNLOCKED | PassiveAttr.ENABLED;
                      if (!Overrides.FREE_CANDY_UPGRADE_OVERRIDE) {
                        starterData.candyCount -= passiveCost;
                      }
                      this.pokemonCandyCountText.setText(`×${starterData.candyCount}`);
                      globalScene.gameData.saveSystem().then(success => {
                        if (!success) {
                          return globalScene.reset(true);
                        }
                      });
                      this.setSpeciesDetails(this.species);
                      globalScene.playSound("se/buy");
                      ui.setMode(UiMode.POKEDEX_PAGE, "refresh");

                      return true;
                    }
                    return false;
                  },
                  style: this.isPassiveAvailable() ? TextStyle.WINDOW : TextStyle.SHADOW_TEXT,
                  item: "candy",
                  itemArgs: this.isPassiveAvailable() ? starterColors[this.starterId] : ["808080", "808080"],
                });
              }

              // Reduce cost option
              const valueReduction = starterData.valueReduction;
              if (valueReduction < valueReductionMax) {
                const reductionCost = getValueReductionCandyCounts(speciesStarterCosts[this.starterId])[valueReduction];
                options.push({
                  label: `×${reductionCost} ${i18next.t("pokedexUiHandler:reduceCost")}`,
                  handler: () => {
                    if (Overrides.FREE_CANDY_UPGRADE_OVERRIDE || candyCount >= reductionCost) {
                      starterData.valueReduction++;
                      if (!Overrides.FREE_CANDY_UPGRADE_OVERRIDE) {
                        starterData.candyCount -= reductionCost;
                      }
                      this.pokemonCandyCountText.setText(`×${starterData.candyCount}`);
                      globalScene.gameData.saveSystem().then(success => {
                        if (!success) {
                          return globalScene.reset(true);
                        }
                      });
                      ui.setMode(UiMode.POKEDEX_PAGE, "refresh");
                      globalScene.playSound("se/buy");

                      return true;
                    }
                    return false;
                  },
                  style: this.isValueReductionAvailable() ? TextStyle.WINDOW : TextStyle.SHADOW_TEXT,
                  item: "candy",
                  itemArgs: this.isValueReductionAvailable() ? starterColors[this.starterId] : ["808080", "808080"],
                });
              }

              // Same species egg menu option.
              const sameSpeciesEggCost = getSameSpeciesEggCandyCounts(speciesStarterCosts[this.starterId]);
              options.push({
                label: `×${sameSpeciesEggCost} ${i18next.t("pokedexUiHandler:sameSpeciesEgg")}`,
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
                      starterData.candyCount -= sameSpeciesEggCost;
                    }
                    this.pokemonCandyCountText.setText(`×${starterData.candyCount}`);

                    const egg = new Egg({
                      scene: globalScene,
                      species: this.starterId,
                      sourceType: EggSourceType.SAME_SPECIES_EGG,
                    });
                    egg.addEggToGameData();

                    globalScene.gameData.saveSystem().then(success => {
                      if (!success) {
                        return globalScene.reset(true);
                      }
                    });
                    ui.setMode(UiMode.POKEDEX_PAGE, "refresh");
                    globalScene.playSound("se/buy");

                    return true;
                  }
                  return false;
                },
                style: this.isSameSpeciesEggAvailable() ? TextStyle.WINDOW : TextStyle.SHADOW_TEXT,
                item: "candy",
                itemArgs: this.isSameSpeciesEggAvailable() ? starterColors[this.starterId] : ["808080", "808080"],
              });
              options.push({
                label: i18next.t("menu:cancel"),
                handler: () => {
                  ui.setMode(UiMode.POKEDEX_PAGE, "refresh");
                  return true;
                },
              });
              ui.setModeWithoutClear(UiMode.OPTION_SELECT, {
                options,
                yOffset: 47,
              });
              success = true;
            }
            break;
          case Button.CYCLE_ABILITY:
            this.showBackSprite = !this.showBackSprite;
            if (this.showBackSprite) {
              this.showBackSpriteLabel.setText(i18next.t("pokedexUiHandler:showFrontSprite"));
            } else {
              this.showBackSpriteLabel.setText(i18next.t("pokedexUiHandler:showBackSprite"));
            }
            this.setSpeciesDetails(this.species, {}, true);
            success = true;
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
            if (this.filteredIndices && this.filteredIndices.length <= 1) {
              ui.playError();
              this.blockInput = false;
              return true;
            }
            this.blockInput = true;
            ui.setModeWithoutClear(UiMode.OPTION_SELECT).then(() => {
              // Always go back to first selection after scrolling around
              if (this.previousSpecies.length === 0) {
                this.previousSpecies.push(this.species);
                this.previousStarterAttributes.push({ ...this.savedStarterAttributes });
              }
              let newSpecies: PokemonSpecies;
              if (this.filteredIndices) {
                const index = this.filteredIndices.indexOf(this.species.speciesId);
                const newIndex = index <= 0 ? this.filteredIndices.length - 1 : index - 1;
                newSpecies = getPokemonSpecies(this.filteredIndices[newIndex]);
              } else {
                const index = allSpecies.findIndex(species => species.speciesId === this.species.speciesId);
                const newIndex = index <= 0 ? allSpecies.length - 1 : index - 1;
                newSpecies = allSpecies[newIndex];
              }
              const matchingForm = newSpecies?.forms.find(
                form => form.formKey === this.species?.forms[this.formIndex]?.formKey,
              );
              const newFormIndex = matchingForm ? matchingForm.formIndex : 0;
              this.starterAttributes.form = newFormIndex;
              this.savedStarterAttributes.form = newFormIndex;
              this.moveInfoOverlay.clear();
              this.clearText();
              ui.setModeForceTransition(
                UiMode.POKEDEX_PAGE,
                newSpecies,
                this.savedStarterAttributes,
                this.filteredIndices,
              );
            });
            this.blockInput = false;
            break;
          case Button.RIGHT:
            if (this.filteredIndices && this.filteredIndices.length <= 1) {
              ui.playError();
              this.blockInput = false;
              return true;
            }
            ui.setModeWithoutClear(UiMode.OPTION_SELECT).then(() => {
              // Always go back to first selection after scrolling around
              if (this.previousSpecies.length === 0) {
                this.previousSpecies.push(this.species);
                this.previousStarterAttributes.push({ ...this.savedStarterAttributes });
              }
              let newSpecies: PokemonSpecies;
              if (this.filteredIndices) {
                const index = this.filteredIndices.indexOf(this.species.speciesId);
                const newIndex = index >= this.filteredIndices.length - 1 ? 0 : index + 1;
                newSpecies = getPokemonSpecies(this.filteredIndices[newIndex]);
              } else {
                const index = allSpecies.findIndex(species => species.speciesId === this.species.speciesId);
                const newIndex = index >= allSpecies.length - 1 ? 0 : index + 1;
                newSpecies = allSpecies[newIndex];
              }
              const matchingForm = newSpecies?.forms.find(
                form => form.formKey === this.species?.forms[this.formIndex]?.formKey,
              );
              const newFormIndex = matchingForm ? matchingForm.formIndex : 0;
              this.starterAttributes.form = newFormIndex;
              this.savedStarterAttributes.form = newFormIndex;
              this.moveInfoOverlay.clear();
              this.clearText();
              ui.setModeForceTransition(
                UiMode.POKEDEX_PAGE,
                newSpecies,
                this.savedStarterAttributes,
                this.filteredIndices,
              );
            });
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

  updateButtonIcon(iconSetting, gamepadType, iconElement, controlLabel): void {
    // biome-ignore lint/suspicious/noImplicitAnyLet: TODO
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
        default:
          break;
      }
    } else {
      iconPath = globalScene.inputController?.getIconForLatestInputRecorded(iconSetting);
    }
    iconElement.setTexture(gamepadType, iconPath);
    iconElement.setPosition(this.instructionRowX, this.instructionRowY);
    controlLabel.setPosition(this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY);
    iconElement.setVisible(true);
    controlLabel.setVisible(true);
    this.instructionsContainer.add([iconElement, controlLabel]);
    this.instructionRowY += 8;
    if (this.instructionRowY >= 24) {
      this.instructionRowY = 8;
      this.instructionRowX += 50;
    }
  }

  updateInstructions(): void {
    this.instructionRowX = 0;
    this.instructionRowY = 0;
    this.hideInstructions();
    this.instructionsContainer.removeAll();
    this.filterInstructionsContainer.removeAll();

    // biome-ignore lint/suspicious/noImplicitAnyLet: TODO
    let gamepadType;
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

    const isFormCaught = this.isFormCaught();

    if (this.isCaught()) {
      if (isFormCaught) {
        if (this.canUseCandies) {
          this.updateButtonIcon(
            SettingKeyboard.Button_Stats,
            gamepadType,
            this.candyUpgradeIconElement,
            this.candyUpgradeLabel,
          );
        }
        if (this.canCycleShiny) {
          this.updateButtonIcon(
            SettingKeyboard.Button_Cycle_Shiny,
            gamepadType,
            this.shinyIconElement,
            this.shinyLabel,
          );
        }
        if (this.canCycleGender) {
          this.updateButtonIcon(
            SettingKeyboard.Button_Cycle_Gender,
            gamepadType,
            this.genderIconElement,
            this.genderLabel,
          );
        }
      } else {
        // Making space for "Uncaught" text
        this.instructionRowY += 8;
      }
      if (this.canCycleForm) {
        this.updateButtonIcon(SettingKeyboard.Button_Cycle_Form, gamepadType, this.formIconElement, this.formLabel);
      }
    }
  }

  setCursor(cursor: number): boolean {
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = globalScene.add.image(0, 0, "cursor");
      this.cursorObj.setOrigin(0, 0);
      this.menuContainer.add(this.cursorObj);
    }

    this.cursorObj.setScale(this.scale * 6);
    this.cursorObj.setPositionRelative(this.menuBg, 7, 6 + (18 + this.cursor * 96) * this.scale);

    const ui = this.getUi();

    if ((this.isCaught() && this.isFormCaught()) || this.isSeen()) {
      ui.showText(this.menuDescriptions[cursor]);
    } else {
      ui.showText("");
    }

    return ret;
  }

  getFriendship(_speciesId: number) {
    let currentFriendship = globalScene.gameData.starterData[this.starterId].friendship;
    if (!currentFriendship || currentFriendship === undefined) {
      currentFriendship = 0;
    }

    const friendshipCap = getStarterValueFriendshipCap(speciesStarterCosts[this.starterId]);

    return { currentFriendship, friendshipCap };
  }

  /**
   * Determines if a passive upgrade is available for the current species
   * @returns true if the user has enough candies and a passive has not been unlocked already
   */
  isPassiveAvailable(): boolean {
    // Get this species ID's starter data
    const starterData = globalScene.gameData.starterData[this.starterId];

    return (
      starterData.candyCount >= getPassiveCandyCount(speciesStarterCosts[this.starterId])
      && !(starterData.passiveAttr & PassiveAttr.UNLOCKED)
    );
  }

  /**
   * Determines if a value reduction upgrade is available for the current species
   * @returns true if the user has enough candies and all value reductions have not been unlocked already
   */
  isValueReductionAvailable(): boolean {
    // Get this species ID's starter data
    const starterData = globalScene.gameData.starterData[this.starterId];

    return (
      starterData.candyCount
        >= getValueReductionCandyCounts(speciesStarterCosts[this.starterId])[starterData.valueReduction]
      && starterData.valueReduction < valueReductionMax
    );
  }

  /**
   * Determines if an same species egg can be bought for the current species
   * @returns true if the user has enough candies
   */
  isSameSpeciesEggAvailable(): boolean {
    // Get this species ID's starter data
    const starterData = globalScene.gameData.starterData[this.starterId];

    return starterData.candyCount >= getSameSpeciesEggCandyCounts(speciesStarterCosts[this.starterId]);
  }

  setSpecies() {
    const species = this.species;
    const starterAttributes: StarterAttributes | null = species ? { ...this.starterAttributes } : null;

    if (!species && globalScene.ui.getTooltip().visible) {
      globalScene.ui.hideTooltip();
    }

    if (this.statsMode) {
      if (this.isCaught()) {
        this.statsContainer.setVisible(true);
        this.showStats();
      } else {
        this.statsContainer.setVisible(false);
        //@ts-expect-error
        this.statsContainer.updateIvs(null); // TODO: resolve ts-ignore. what. how? huh?
      }
    }

    if (species && (this.isSeen() || this.isCaught())) {
      this.pokemonNumberText.setText(padInt(species.speciesId, 4));

      if (this.isCaught()) {
        const defaultDexAttr = this.getCurrentDexProps(species.speciesId);
        // Set default attributes if for some reason starterAttributes does not exist or attributes missing
        const props: StarterAttributes = globalScene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
        if (starterAttributes?.variant && !Number.isNaN(starterAttributes.variant) && props.shiny) {
          props.variant = starterAttributes.variant as Variant;
        }
        props.form = starterAttributes?.form ?? props.form;
        props.female = starterAttributes?.female ?? props.female;

        this.setSpeciesDetails(species, {
          shiny: props.shiny,
          formIndex: props.form,
          female: props.female,
          variant: props.variant ?? 0,
        });
      } else {
        this.pokemonGrowthRateText.setText("");
        this.pokemonGrowthRateLabelText.setVisible(false);
        this.type1Icon.setVisible(true);
        this.type2Icon.setVisible(true);
        this.pokemonLuckLabelText.setVisible(false);
        this.pokemonLuckText.setVisible(false);
        for (const icon of this.pokemonShinyIcons) {
          icon.setVisible(false);
        }
        this.pokemonUncaughtText.setVisible(true);
        this.pokemonCaughtHatchedContainer.setVisible(true);
        this.pokemonCandyContainer.setVisible(false);
        this.pokemonFormText.setVisible(false);
        this.pokemonCategoryText.setVisible(false);

        const defaultDexAttr = globalScene.gameData.getSpeciesDefaultDexAttr(species, true, true);
        const props = globalScene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);

        this.setSpeciesDetails(species, {
          shiny: props.shiny,
          formIndex: props.formIndex,
          female: props.female,
          variant: props.variant,
        });
        this.pokemonSprite.setTint(0x808080);
      }
    } else {
      this.pokemonNumberText.setText(species ? padInt(species.speciesId, 4) : "");
      this.pokemonNameText.setText(species ? "???" : "");
      this.pokemonGrowthRateText.setText("");
      this.pokemonGrowthRateLabelText.setVisible(false);
      this.type1Icon.setVisible(false);
      this.type2Icon.setVisible(false);
      this.pokemonLuckLabelText.setVisible(false);
      this.pokemonLuckText.setVisible(false);
      for (const icon of this.pokemonShinyIcons) {
        icon.setVisible(false);
      }
      this.pokemonUncaughtText.setVisible(!!species);
      this.pokemonCaughtHatchedContainer.setVisible(false);
      this.pokemonCandyContainer.setVisible(false);
      this.pokemonFormText.setVisible(false);
      this.pokemonCategoryText.setVisible(false);

      this.setSpeciesDetails(species!, {
        // TODO: is this bang correct?
        shiny: false,
        formIndex: 0,
        female: false,
        variant: 0,
      });
      this.pokemonSprite.setTint(0x000000);
    }
  }

  setSpeciesDetails(species: PokemonSpecies, options: SpeciesDetails = {}, forceUpdate?: boolean): void {
    let { shiny, formIndex, female, variant } = options;
    const oldProps = species ? this.starterAttributes : null;

    // We will only update the sprite if there is a change to form, shiny/variant
    // or gender for species with gender sprite differences
    const shouldUpdateSprite =
      (species?.genderDiffs && !isNullOrUndefined(female))
      || !isNullOrUndefined(formIndex)
      || !isNullOrUndefined(shiny)
      || !isNullOrUndefined(variant)
      || forceUpdate;

    if (this.activeTooltip === "CANDY") {
      if (this.species && this.pokemonCandyContainer.visible) {
        const { currentFriendship, friendshipCap } = this.getFriendship(this.species.speciesId);
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
      // Only assign shiny, female, and variant if they are undefined
      if (shiny === undefined) {
        shiny = oldProps?.shiny ?? false;
      }
      if (female === undefined) {
        female = oldProps?.female ?? false;
      }
      if (variant === undefined) {
        variant = oldProps?.variant ?? 0;
      }
      if (formIndex === undefined) {
        formIndex = oldProps?.form ?? 0;
      }
    }

    this.pokemonSprite.setVisible(false);

    if (this.assetLoadCancelled) {
      this.assetLoadCancelled.value = true;
      this.assetLoadCancelled = null;
    }

    if (species) {
      const caughtAttr = this.isCaught(species);

      if (!caughtAttr) {
        const props = this.starterAttributes;

        if (shiny === undefined || shiny !== props.shiny) {
          shiny = props.shiny;
        }
        if (formIndex === undefined || formIndex !== props.form) {
          formIndex = props.form;
        }
        if (female === undefined || female !== props.female) {
          female = props.female;
        }
        if (variant === undefined || variant !== props.variant) {
          variant = props.variant;
        }
      }

      const isFormCaught = this.isFormCaught();
      const isFormSeen = this.isSeen();

      this.shinyOverlay.setVisible(shiny ?? false); // TODO: is false the correct default?
      this.pokemonNumberText.setColor(
        getTextColor(shiny ? TextStyle.SUMMARY_DEX_NUM_GOLD : TextStyle.SUMMARY_DEX_NUM, false),
      );
      this.pokemonNumberText.setShadowColor(
        getTextColor(shiny ? TextStyle.SUMMARY_DEX_NUM_GOLD : TextStyle.SUMMARY_DEX_NUM, true),
      );

      const assetLoadCancelled = new BooleanHolder(false);
      this.assetLoadCancelled = assetLoadCancelled;

      if (shouldUpdateSprite) {
        const back = !!this.showBackSprite;
        species.loadAssets(female!, formIndex, shiny, variant as Variant, true, back).then(() => {
          // TODO: is this bang correct?
          if (assetLoadCancelled.value) {
            return;
          }
          this.assetLoadCancelled = null;
          this.speciesLoaded.set(species.speciesId, true);
          this.pokemonSprite.play(species.getSpriteKey(female!, formIndex, shiny, variant, back)); // TODO: is this bang correct?
          this.pokemonSprite.setPipelineData("shiny", shiny);
          this.pokemonSprite.setPipelineData("variant", variant);
          this.pokemonSprite.setPipelineData(
            "spriteKey",
            species.getSpriteKey(female!, formIndex, shiny, variant, back),
          ); // TODO: is this bang correct?
          this.pokemonSprite.setVisible(!this.statsMode);
        });
      } else {
        this.pokemonSprite.setVisible(!this.statsMode);
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

      // If the dev option for the dex is selected, all forms can be cycled through
      this.canCycleForm = globalScene.dexForDevs
        ? species.forms.length > 1
        : species.forms.filter(f => f.isStarterSelectable).filter(f => f).length > 1;

      if (caughtAttr && species.malePercent !== null) {
        const gender = !female ? Gender.MALE : Gender.FEMALE;
        this.pokemonGenderText.setText(getGenderSymbol(gender));
        this.pokemonGenderText.setColor(getGenderColor(gender));
        this.pokemonGenderText.setShadowColor(getGenderColor(gender, true));
      } else {
        this.pokemonGenderText.setText("");
      }

      // Setting the name
      if (isFormCaught || isFormSeen) {
        this.pokemonNameText.setText(species.name);
      } else {
        this.pokemonNameText.setText(species ? "???" : "");
      }

      // Setting the category
      if (isFormCaught) {
        this.pokemonCategoryText.setText(species.category);
      } else {
        this.pokemonCategoryText.setText("");
      }

      // Setting tint of the sprite
      if (isFormCaught) {
        this.species.loadAssets(female!, formIndex, shiny, variant as Variant, true).then(() => {
          const crier =
            this.species.forms && this.species.forms.length > 0
              ? this.species.forms[formIndex ?? this.formIndex]
              : this.species;
          crier.cry();
        });
        this.pokemonSprite.clearTint();
      } else if (isFormSeen) {
        this.pokemonSprite.setTint(0x808080);
      } else {
        this.pokemonSprite.setTint(0);
      }

      // Setting luck text and sparks
      if (isFormCaught) {
        const luck = globalScene.gameData.getDexAttrLuck(this.isCaught());
        this.pokemonLuckText.setVisible(!!luck);
        this.pokemonLuckText.setText(luck.toString());
        this.pokemonLuckText.setTint(getVariantTint(Math.min(luck - 1, 2) as Variant));
        this.pokemonLuckLabelText.setVisible(this.pokemonLuckText.visible);
      } else {
        this.pokemonLuckText.setVisible(false);
        this.pokemonLuckLabelText.setVisible(false);
      }

      // Setting growth rate text
      if (isFormCaught) {
        let growthReadable = toTitleCase(GrowthRate[species.growthRate]);
        const growthAux = toCamelCase(growthReadable);
        if (i18next.exists("growth:" + growthAux)) {
          growthReadable = i18next.t(("growth:" + growthAux) as any);
        }
        this.pokemonGrowthRateText.setText(growthReadable);

        this.pokemonGrowthRateText.setColor(getGrowthRateColor(species.growthRate));
        this.pokemonGrowthRateText.setShadowColor(getGrowthRateColor(species.growthRate, true));
        this.pokemonGrowthRateLabelText.setVisible(true);
      } else {
        this.pokemonGrowthRateText.setText("");
        this.pokemonGrowthRateLabelText.setVisible(false);
      }

      // Caught and hatched
      if (isFormCaught) {
        const colorScheme = starterColors[this.starterId];

        this.pokemonUncaughtText.setVisible(false);
        this.pokemonCaughtCountText.setText(`${this.speciesStarterDexEntry?.caughtCount}`);
        if (species.speciesId === SpeciesId.MANAPHY || species.speciesId === SpeciesId.PHIONE) {
          this.pokemonHatchedIcon.setFrame("manaphy");
        } else {
          this.pokemonHatchedIcon.setFrame(getEggTierForSpecies(species));
        }
        this.pokemonHatchedCountText.setText(`${this.speciesStarterDexEntry?.hatchedCount}`);

        const defaultDexAttr = this.getCurrentDexProps(species.speciesId);
        const defaultProps = globalScene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);

        const variant = defaultProps.variant;
        for (let v = 0; v < 3; v++) {
          const icon = this.pokemonShinyIcons[v];
          if (v < this.availableVariants) {
            if (!this.unlockedVariants[v]) {
              icon.setTint(0x000000);
            } else if (shiny && v === variant) {
              const tint = getVariantTint(v as Variant);
              icon.setTint(tint);
            } else {
              icon.setTint(0x808080);
            }
            icon.setVisible(true);
          } else {
            icon.setVisible(false);
          }
        }

        this.pokemonCaughtHatchedContainer.setVisible(true);
        this.pokemonCaughtHatchedContainer.setY(25);
        this.pokemonCandyIcon.setTint(argbFromRgba(rgbHexToRgba(colorScheme[0])));
        this.pokemonCandyOverlayIcon.setTint(argbFromRgba(rgbHexToRgba(colorScheme[1])));
        this.pokemonCandyCountText.setText(
          `×${species.speciesId === SpeciesId.PIKACHU ? 0 : globalScene.gameData.starterData[this.starterId].candyCount}`,
        );
        this.pokemonCandyContainer.setVisible(true);

        if (pokemonPrevolutions.hasOwnProperty(species.speciesId)) {
          this.pokemonHatchedIcon.setVisible(false);
          this.pokemonHatchedCountText.setVisible(false);
          this.pokemonFormText.setY(36);
        } else {
          this.pokemonHatchedIcon.setVisible(true);
          this.pokemonHatchedCountText.setVisible(true);
          this.pokemonFormText.setY(42);

          const { currentFriendship, friendshipCap } = this.getFriendship(this.species.speciesId);
          const candyCropY = 16 - 16 * (currentFriendship / friendshipCap);
          this.pokemonCandyDarknessOverlay.setCrop(0, 0, 16, candyCropY);

          this.pokemonCandyContainer.on("pointerover", () => {
            globalScene.ui.showTooltip("", `${currentFriendship}/${friendshipCap}`, true);
            this.activeTooltip = "CANDY";
          });
          this.pokemonCandyContainer.on("pointerout", () => {
            globalScene.ui.hideTooltip();
            this.activeTooltip = undefined;
          });
        }
      } else {
        this.pokemonUncaughtText.setVisible(true);
        this.pokemonCaughtHatchedContainer.setVisible(false);
        this.pokemonCandyContainer.setVisible(false);
        for (const icon of this.pokemonShinyIcons) {
          icon.setVisible(false);
        }
      }

      // Setting type icons and form text
      if (isFormCaught || isFormSeen) {
        const speciesForm = getPokemonSpeciesForm(species.speciesId, formIndex!); // TODO: is the bang correct?
        this.setTypeIcons(speciesForm.type1, speciesForm.type2);
        // TODO: change this once forms are refactored
        if (normalForm.includes(species.speciesId) && !formIndex) {
          this.pokemonFormText.setText("");
        } else {
          this.pokemonFormText.setText(species.getFormNameToDisplay(formIndex));
        }
        this.pokemonFormText.setVisible(true);
        if (!isFormCaught) {
          this.pokemonFormText.setY(18);
        }
      } else {
        this.setTypeIcons(null, null);
        this.pokemonFormText.setText("");
        this.pokemonFormText.setVisible(false);
      }
    } else {
      this.shinyOverlay.setVisible(false);
      this.pokemonNumberText.setColor(getTextColor(TextStyle.SUMMARY));
      this.pokemonNumberText.setShadowColor(getTextColor(TextStyle.SUMMARY, true));
      this.pokemonGenderText.setText("");
      this.setTypeIcons(null, null);
    }

    this.updateInstructions();
  }

  setTypeIcons(type1: PokemonType | null, type2: PokemonType | null): void {
    if (type1 !== null) {
      this.type1Icon.setVisible(true);
      this.type1Icon.setFrame(PokemonType[type1].toLowerCase());
    } else {
      this.type1Icon.setVisible(false);
    }
    if (type2 !== null) {
      this.type2Icon.setVisible(true);
      this.type2Icon.setFrame(PokemonType[type2].toLowerCase());
    } else {
      this.type2Icon.setVisible(false);
    }
  }

  /**
   * Creates a temporary dex attr props that will be used to display the correct shiny, variant, and form based on this.starterAttributes
   *
   * @param speciesId the id of the species to get props for
   * @returns the dex props
   */
  getCurrentDexProps(speciesId: number): bigint {
    let props = 0n;
    const species = allSpecies.find(sp => sp.speciesId === speciesId);
    const caughtAttr =
      globalScene.gameData.dexData[speciesId].caughtAttr
      & globalScene.gameData.dexData[this.getStarterSpeciesId(speciesId)].caughtAttr
      & (species?.getFullUnlocksData() ?? 0n);

    /*  this checks the gender of the pokemon; this works by checking a) that the starter preferences for the species exist, and if so, is it female. If so, it'll add DexAttr.FEMALE to our temp props
     *  It then checks b) if the caughtAttr for the pokemon is female and NOT male - this means that the ONLY gender we've gotten is female, and we need to add DexAttr.FEMALE to our temp props
     *  If neither of these pass, we add DexAttr.MALE to our temp props
     */
    if (this.starterAttributes?.female || ((caughtAttr & DexAttr.FEMALE) > 0n && (caughtAttr & DexAttr.MALE) === 0n)) {
      props += DexAttr.FEMALE;
    } else {
      props += DexAttr.MALE;
    }
    /* This part is very similar to above, but instead of for gender, it checks for shiny within starter preferences.
     * If they're not there, it enables shiny state by default if any shiny was caught
     */
    if (
      this.starterAttributes?.shiny
      || ((caughtAttr & DexAttr.SHINY) > 0n && this.starterAttributes?.shiny !== false)
    ) {
      props += DexAttr.SHINY;
      if (this.starterAttributes?.variant !== undefined) {
        props += BigInt(Math.pow(2, this.starterAttributes?.variant)) * DexAttr.DEFAULT_VARIANT;
        /*  This chunk calculates the correct variant if there's no starter preferences for it.
         *  This gets the highest tier variant that you've caught and adds it to the temp props
         */
      } else if ((caughtAttr & DexAttr.VARIANT_3) > 0) {
        props += DexAttr.VARIANT_3;
      } else if ((caughtAttr & DexAttr.VARIANT_2) > 0) {
        props += DexAttr.VARIANT_2;
      } else {
        props += DexAttr.DEFAULT_VARIANT;
      }
    } else {
      props += DexAttr.NON_SHINY;
      props += DexAttr.DEFAULT_VARIANT; // we add the default variant here because non shiny versions are listed as default variant
    }
    if (this.starterAttributes?.form) {
      // this checks for the form of the pokemon
      props += BigInt(Math.pow(2, this.starterAttributes?.form)) * DexAttr.DEFAULT_FORM;
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
    } else {
      this.statsMode = false;
      this.statsContainer.setVisible(false);
      this.pokemonSprite.setVisible(true);
      //@ts-expect-error
      this.statsContainer.updateIvs(null); // TODO: resolve ts-ignore. !?!?
    }
  }

  showStats(): void {
    if (!this.speciesStarterDexEntry) {
      return;
    }

    this.statsContainer.setVisible(true);

    const ivs = globalScene.gameData.dexData[this.getStarterSpeciesId(this.species.speciesId)].ivs;
    this.statsContainer.updateIvs(ivs);
  }

  clearText() {
    this.starterSelectMessageBoxContainer.setVisible(false);
    super.clearText();
  }

  hideInstructions(): void {
    this.candyUpgradeIconElement.setVisible(false);
    this.candyUpgradeLabel.setVisible(false);
    this.shinyIconElement.setVisible(false);
    this.shinyLabel.setVisible(false);
    this.formIconElement.setVisible(false);
    this.formLabel.setVisible(false);
    this.genderIconElement.setVisible(false);
    this.genderLabel.setVisible(false);
    this.variantIconElement.setVisible(false);
    this.variantLabel.setVisible(false);
  }

  clear(): void {
    super.clear();

    this.cursor = -1;
    this.hideInstructions();
    this.activeTooltip = undefined;
    globalScene.ui.hideTooltip();

    this.starterSelectContainer.setVisible(false);
    this.blockInput = false;

    this.showBackSprite = false;
    this.showBackSpriteLabel.setText(i18next.t("pokedexUiHandler:showBackSprite"));

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
      icon.setTexture(species.getIconAtlasKey(formIndex, false, variant));
      icon.setFrame(species.getIconId(female, formIndex, false, variant));
    }
  }
}
