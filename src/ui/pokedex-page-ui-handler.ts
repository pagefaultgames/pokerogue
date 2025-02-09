import type { SpeciesFormEvolution } from "#app/data/balance/pokemon-evolutions";
import { pokemonEvolutions, pokemonPrevolutions, pokemonStarters } from "#app/data/balance/pokemon-evolutions";
import type { Variant } from "#app/data/variant";
import { getVariantTint, getVariantIcon } from "#app/data/variant";
import { argbFromRgba } from "@material/material-color-utilities";
import i18next from "i18next";
import { starterColors } from "#app/battle-scene";
import { allAbilities } from "#app/data/ability";
import { speciesEggMoves } from "#app/data/balance/egg-moves";
import { GrowthRate, getGrowthRateColor } from "#app/data/exp";
import { Gender, getGenderColor, getGenderSymbol } from "#app/data/gender";
import { allMoves } from "#app/data/move";
import { getNatureName } from "#app/data/nature";
import type { SpeciesFormChange } from "#app/data/pokemon-forms";
import { pokemonFormChanges } from "#app/data/pokemon-forms";
import type { LevelMoves } from "#app/data/balance/pokemon-level-moves";
import { pokemonFormLevelMoves, pokemonSpeciesLevelMoves } from "#app/data/balance/pokemon-level-moves";
import type { PokemonForm } from "#app/data/pokemon-species";
import type PokemonSpecies from "#app/data/pokemon-species";
import { allSpecies, getPokemonSpeciesForm } from "#app/data/pokemon-species";
import { getStarterValueFriendshipCap, speciesStarterCosts } from "#app/data/balance/starters";
import { starterPassiveAbilities } from "#app/data/balance/passives";
import { Type } from "#enums/type";
import { GameModes } from "#app/game-mode";
import type { DexEntry, StarterAttributes  } from "#app/system/game-data";
import { AbilityAttr, DexAttr  } from "#app/system/game-data";
import type { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import MessageUiHandler from "#app/ui/message-ui-handler";
import { StatsContainer } from "#app/ui/stats-container";
import { TextStyle, addTextObject, getTextStyleOptions } from "#app/ui/text";
import { Mode } from "#app/ui/ui";
import { addWindow } from "#app/ui/ui-theme";
import { Egg } from "#app/data/egg";
import Overrides from "#app/overrides";
import { SettingKeyboard } from "#app/system/settings/settings-keyboard";
import { Passive as PassiveAttr } from "#enums/passive";
import * as Challenge from "#app/data/challenge";
import MoveInfoOverlay from "#app/ui/move-info-overlay";
import PokedexInfoOverlay from "#app/ui/pokedex-info-overlay";
import { getEggTierForSpecies } from "#app/data/egg";
import { Device } from "#enums/devices";
import type { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Button } from "#enums/buttons";
import { EggSourceType } from "#enums/egg-source-types";
import { StarterContainer } from "#app/ui/starter-container";
import { getPassiveCandyCount, getValueReductionCandyCounts, getSameSpeciesEggCandyCounts } from "#app/data/balance/starters";
import { BooleanHolder, capitalizeString, getLocalizedSpriteKey, isNullOrUndefined, NumberHolder, padInt, rgbHexToRgba, toReadableString } from "#app/utils";
import type { Nature } from "#enums/nature";
import BgmBar from "./bgm-bar";
import * as Utils from "../utils";
import { speciesTmMoves } from "#app/data/balance/tms";
import type { BiomeTierTod } from "#app/data/balance/biomes";
import { BiomePoolTier, catchableSpecies } from "#app/data/balance/biomes";
import { Biome } from "#app/enums/biome";
import { TimeOfDay } from "#app/enums/time-of-day";
import type { Abilities } from "#app/enums/abilities";
import { BaseStatsOverlay } from "#app/ui/base-stats-overlay";
import { globalScene } from "#app/global-scene";


interface LanguageSetting {
  starterInfoTextSize: string,
  instructionTextSize: string,
  starterInfoXPos?: number,
  starterInfoYOffset?: number
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
const speciesContainerX = 109;

interface SpeciesDetails {
  shiny?: boolean,
  formIndex?: number
  female?: boolean,
  variant?: number,
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
  private pokemonHatchedIcon : Phaser.GameObjects.Sprite;
  private pokemonHatchedCountText: Phaser.GameObjects.Text;
  private pokemonShinyIcon: Phaser.GameObjects.Sprite;

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
  private formIndex: number;
  private speciesLoaded: Map<Species, boolean> = new Map<Species, boolean>();
  private levelMoves: LevelMoves;
  private eggMoves: Moves[] = [];
  private hasEggMoves: boolean[] = [];
  private tmMoves: Moves[] = [];
  private ability1: Abilities;
  private ability2: Abilities | undefined;
  private abilityHidden: Abilities | undefined;
  private passive: Abilities;
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
  private filterInstructionRowX = 0;
  private filterInstructionRowY = 0;

  private starterAttributes: StarterAttributes;
  private savedStarterAttributes: StarterAttributes;

  protected blockInput: boolean = false;
  protected blockInputOverlay: boolean = false;

  private showBackSprite: boolean = false;

  // Menu
  private menuContainer: Phaser.GameObjects.Container;
  private menuBg: Phaser.GameObjects.NineSlice;
  protected optionSelectText: Phaser.GameObjects.Text;
  public bgmBar: BgmBar;
  private menuOptions: MenuOptions[];
  protected scale: number = 0.1666666667;
  private menuDescriptions: string[];

  constructor() {
    super(Mode.POKEDEX_PAGE);
  }

  setup() {
    const ui = this.getUi();
    const currentLanguage = i18next.resolvedLanguage ?? "en";
    const langSettingKey = Object.keys(languageSettings).find(lang => currentLanguage.includes(lang)) ?? "en";
    const textSettings = languageSettings[langSettingKey];

    this.starterSelectContainer = globalScene.add.container(0, -globalScene.game.canvas.height / 6);
    this.starterSelectContainer.setVisible(false);
    ui.add(this.starterSelectContainer);

    const bgColor = globalScene.add.rectangle(0, 0, globalScene.game.canvas.width / 6, globalScene.game.canvas.height / 6, 0x006860);
    bgColor.setOrigin(0, 0);
    this.starterSelectContainer.add(bgColor);

    const starterSelectBg = globalScene.add.image(0, 0, "pokedex_summary_bg");
    starterSelectBg.setOrigin(0, 0);
    this.starterSelectContainer.add(starterSelectBg);

    this.shinyOverlay = globalScene.add.image(6, 6, "summary_overlay_shiny");
    this.shinyOverlay.setOrigin(0, 0);
    this.shinyOverlay.setVisible(false);
    this.starterSelectContainer.add(this.shinyOverlay);

    this.pokemonNumberText = addTextObject(17, 1, "0000", TextStyle.SUMMARY);
    this.pokemonNumberText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonNumberText);

    this.pokemonNameText = addTextObject(6, 112, "", TextStyle.SUMMARY);
    this.pokemonNameText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonNameText);

    this.pokemonGrowthRateLabelText = addTextObject(8, 106, i18next.t("pokedexUiHandler:growthRate"), TextStyle.SUMMARY_ALT, { fontSize: "36px" });
    this.pokemonGrowthRateLabelText.setOrigin(0, 0);
    this.pokemonGrowthRateLabelText.setVisible(false);
    this.starterSelectContainer.add(this.pokemonGrowthRateLabelText);

    this.pokemonGrowthRateText = addTextObject(34, 106, "", TextStyle.SUMMARY_PINK, { fontSize: "36px" });
    this.pokemonGrowthRateText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonGrowthRateText);

    this.pokemonGenderText = addTextObject(96, 112, "", TextStyle.SUMMARY_ALT);
    this.pokemonGenderText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonGenderText);

    this.pokemonUncaughtText = addTextObject(6, 127, i18next.t("pokedexUiHandler:uncaught"), TextStyle.WINDOW, { fontSize: "56px" });
    this.pokemonUncaughtText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonUncaughtText);

    const starterBoxContainer = globalScene.add.container(speciesContainerX + 6, 9); //115

    for (const species of allSpecies) {
      if (!speciesStarterCosts.hasOwnProperty(species.speciesId) || !species.isObtainable()) {
        continue;
      }

      this.speciesLoaded.set(species.speciesId, false);
      this.allSpecies.push(species);

      const starterContainer = new StarterContainer(species).setVisible(false);
      this.starterContainers.push(starterContainer);
      starterBoxContainer.add(starterContainer);
    }

    this.starterSelectContainer.add(starterBoxContainer);

    this.pokemonSprite = globalScene.add.sprite(53, 63, "pkmn__sub");
    this.pokemonSprite.setPipeline(globalScene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], ignoreTimeTint: true });
    this.starterSelectContainer.add(this.pokemonSprite);

    this.type1Icon = globalScene.add.sprite(8, 98, getLocalizedSpriteKey("types"));
    this.type1Icon.setScale(0.5);
    this.type1Icon.setOrigin(0, 0);
    this.starterSelectContainer.add(this.type1Icon);

    this.type2Icon = globalScene.add.sprite(26, 98, getLocalizedSpriteKey("types"));
    this.type2Icon.setScale(0.5);
    this.type2Icon.setOrigin(0, 0);
    this.starterSelectContainer.add(this.type2Icon);

    this.pokemonLuckLabelText = addTextObject(8, 89, i18next.t("common:luckIndicator"), TextStyle.WINDOW_ALT, { fontSize: "56px" });
    this.pokemonLuckLabelText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonLuckLabelText);

    this.pokemonLuckText = addTextObject(8 + this.pokemonLuckLabelText.displayWidth + 2, 89, "0", TextStyle.WINDOW, { fontSize: "56px" });
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
    this.pokemonCandyDarknessOverlay.setAlpha(0.50);
    this.pokemonCandyContainer.add(this.pokemonCandyDarknessOverlay);

    this.pokemonCandyCountText = addTextObject(9.5, 0, "x0", TextStyle.WINDOW_ALT, { fontSize: "56px" });
    this.pokemonCandyCountText.setOrigin(0, 0);
    this.pokemonCandyContainer.add(this.pokemonCandyCountText);

    this.pokemonCandyContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, 30, 20), Phaser.Geom.Rectangle.Contains);
    this.starterSelectContainer.add(this.pokemonCandyContainer);

    this.pokemonFormText = addTextObject(6, 42, "Form", TextStyle.WINDOW_ALT, { fontSize: "42px" });
    this.pokemonFormText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonFormText);

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

    this.pokemonShinyIcon = globalScene.add.sprite(14, 76, "shiny_icons");
    this.pokemonShinyIcon.setOrigin(0.15, 0.2);
    this.pokemonShinyIcon.setScale(1);
    this.pokemonCaughtHatchedContainer.add(this.pokemonShinyIcon);

    this.pokemonHatchedCountText = addTextObject(24, 19, "0", TextStyle.SUMMARY_ALT);
    this.pokemonHatchedCountText.setOrigin(0, 0);
    this.pokemonCaughtHatchedContainer.add(this.pokemonHatchedCountText);

    // The font size should be set per language
    const instructionTextSize = textSettings.instructionTextSize;

    this.instructionsContainer = globalScene.add.container(4, 128);
    this.instructionsContainer.setVisible(true);
    this.starterSelectContainer.add(this.instructionsContainer);

    this.candyUpgradeIconElement = new Phaser.GameObjects.Sprite(globalScene, this.instructionRowX, this.instructionRowY, "keyboard", "C.png");
    this.candyUpgradeIconElement.setName("sprite-candyUpgrade-icon-element");
    this.candyUpgradeIconElement.setScale(0.675);
    this.candyUpgradeIconElement.setOrigin(0.0, 0.0);
    this.candyUpgradeLabel = addTextObject(this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY, i18next.t("pokedexUiHandler:candyUpgrade"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.candyUpgradeLabel.setName("text-candyUpgrade-label");

    // instruction rows that will be pushed into the container dynamically based on need
    // creating new sprites since they will be added to the scene later
    this.shinyIconElement = new Phaser.GameObjects.Sprite(globalScene, this.instructionRowX, this.instructionRowY, "keyboard", "R.png");
    this.shinyIconElement.setName("sprite-shiny-icon-element");
    this.shinyIconElement.setScale(0.675);
    this.shinyIconElement.setOrigin(0.0, 0.0);
    this.shinyLabel = addTextObject(this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY, i18next.t("pokedexUiHandler:cycleShiny"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.shinyLabel.setName("text-shiny-label");

    this.formIconElement = new Phaser.GameObjects.Sprite(globalScene, this.instructionRowX, this.instructionRowY, "keyboard", "F.png");
    this.formIconElement.setName("sprite-form-icon-element");
    this.formIconElement.setScale(0.675);
    this.formIconElement.setOrigin(0.0, 0.0);
    this.formLabel = addTextObject(this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY, i18next.t("pokedexUiHandler:cycleForm"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.formLabel.setName("text-form-label");

    this.genderIconElement = new Phaser.GameObjects.Sprite(globalScene, this.instructionRowX, this.instructionRowY, "keyboard", "G.png");
    this.genderIconElement.setName("sprite-gender-icon-element");
    this.genderIconElement.setScale(0.675);
    this.genderIconElement.setOrigin(0.0, 0.0);
    this.genderLabel = addTextObject(this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY, i18next.t("pokedexUiHandler:cycleGender"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.genderLabel.setName("text-gender-label");

    this.variantIconElement = new Phaser.GameObjects.Sprite(globalScene, this.instructionRowX, this.instructionRowY, "keyboard", "V.png");
    this.variantIconElement.setName("sprite-variant-icon-element");
    this.variantIconElement.setScale(0.675);
    this.variantIconElement.setOrigin(0.0, 0.0);
    this.variantLabel = addTextObject(this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY, i18next.t("pokedexUiHandler:cycleVariant"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.variantLabel.setName("text-variant-label");

    this.showBackSpriteIconElement = new Phaser.GameObjects.Sprite(globalScene, 50, 7, "keyboard", "E.png");
    this.showBackSpriteIconElement.setName("show-backSprite-icon-element");
    this.showBackSpriteIconElement.setScale(0.675);
    this.showBackSpriteIconElement.setOrigin(0.0, 0.0);
    this.showBackSpriteLabel = addTextObject(60, 7, i18next.t("pokedexUiHandler:showBackSprite"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.showBackSpriteLabel.setName("show-backSprite-label");
    this.starterSelectContainer.add(this.showBackSpriteIconElement);
    this.starterSelectContainer.add(this.showBackSpriteLabel);

    this.hideInstructions();

    this.filterInstructionsContainer = globalScene.add.container(50, 5);
    this.filterInstructionsContainer.setVisible(true);
    this.starterSelectContainer.add(this.filterInstructionsContainer);

    this.starterSelectMessageBoxContainer = globalScene.add.container(0, globalScene.game.canvas.height / 6);
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
    this.menuContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, globalScene.game.canvas.width / 6, globalScene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    this.bgmBar = new BgmBar();
    this.bgmBar.setup();
    ui.bgmBar = this.bgmBar;
    this.menuContainer.add(this.bgmBar);
    this.menuContainer.setVisible(false);

    this.menuOptions = Utils.getEnumKeys(MenuOptions).map(m => parseInt(MenuOptions[m]) as MenuOptions);

    this.optionSelectText = addTextObject(0, 0, this.menuOptions.map(o => `${i18next.t(`pokedexUiHandler:${MenuOptions[o]}`)}`).join("\n"), TextStyle.WINDOW, { maxLines: this.menuOptions.length });
    this.optionSelectText.setLineSpacing(12);

    this.menuDescriptions = [
      i18next.t("pokedexUiHandler:showBaseStats"),
      i18next.t("pokedexUiHandler:showAbilities"),
      i18next.t("pokedexUiHandler:showLevelMoves"),
      i18next.t("pokedexUiHandler:showEggMoves"),
      i18next.t("pokedexUiHandler:showTmMoves"),
      i18next.t("pokedexUiHandler:showBiomes"),
      i18next.t("pokedexUiHandler:showNatures"),
      i18next.t("pokedexUiHandler:toggleIVs"),
      i18next.t("pokedexUiHandler:showEvolutions")
    ];

    this.scale = getTextStyleOptions(TextStyle.WINDOW, globalScene.uiTheme).scale;
    this.menuBg = addWindow(
      (globalScene.game.canvas.width / 6) - (this.optionSelectText.displayWidth + 25),
      0,
      this.optionSelectText.displayWidth + 19 + 24 * this.scale,
      (globalScene.game.canvas.height / 6) - 2
    );
    this.menuBg.setOrigin(0, 0);

    this.optionSelectText.setPositionRelative(this.menuBg, 10 + 24 * this.scale, 6);

    this.menuContainer.add(this.menuBg);

    this.menuContainer.add(this.optionSelectText);

    ui.add(this.menuContainer);

    this.starterSelectContainer.add(this.menuContainer);


    // adding base stats
    this.baseStatsOverlay = new BaseStatsOverlay({ x: 317, y: 0, width:133 });
    this.menuContainer.add(this.baseStatsOverlay);
    this.menuContainer.bringToTop(this.baseStatsOverlay);

    // add the info overlay last to be the top most ui element and prevent the IVs from overlaying this
    const overlayScale = 1;
    this.moveInfoOverlay = new MoveInfoOverlay({
      scale: overlayScale,
      top: true,
      x: 1,
      y: globalScene.game.canvas.height / 6 - MoveInfoOverlay.getHeight(overlayScale) - 29,
    });
    this.starterSelectContainer.add(this.moveInfoOverlay);

    this.infoOverlay = new PokedexInfoOverlay({
      scale: overlayScale,
      x: 1,
      y: globalScene.game.canvas.height / 6 - PokedexInfoOverlay.getHeight(overlayScale) - 29,
    });
    this.starterSelectContainer.add(this.infoOverlay);

    // Filter bar sits above everything, except the message box
    this.starterSelectContainer.bringToTop(this.starterSelectMessageBoxContainer);

    this.updateInstructions();
  }

  show(args: any[]): boolean {

    if (args.length >= 1 && args[0] === "refresh") {
      return false;
    } else {
      this.species = args[0];
      this.formIndex = args[1] ?? 0;
      this.savedStarterAttributes = args[2] ?? { shiny:false, female:true, variant:0, form:0 };
      this.starterSetup();
    }

    this.moveInfoOverlay.clear(); // clear this when removing a menu; the cancel button doesn't seem to trigger this automatically on controllers
    this.infoOverlay.clear();

    super.show(args);

    this.starterSelectContainer.setVisible(true);
    this.getUi().bringToTop(this.starterSelectContainer);

    this.starterAttributes = this.initStarterPrefs();

    this.menuOptions = Utils.getEnumKeys(MenuOptions).map(m => parseInt(MenuOptions[m]) as MenuOptions);

    this.menuContainer.setVisible(true);

    this.speciesStarterDexEntry = this.species ? globalScene.gameData.dexData[this.species.speciesId] : null;
    this.setSpecies();
    this.updateInstructions();

    this.setCursor(0);

    return true;

  }

  starterSetup(): void {

    this.evolutions = [];
    this.prevolutions = [];
    this.battleForms = [];

    const species = this.species;
    const formIndex = this.formIndex ?? 0;

    const allEvolutions = pokemonEvolutions.hasOwnProperty(species.speciesId) ? pokemonEvolutions[species.speciesId] : [];

    if (species.forms.length > 0) {
      const form = species.forms[formIndex];

      // If this form has a specific set of moves, we get them.
      this.levelMoves = (formIndex > 0 && pokemonFormLevelMoves.hasOwnProperty(formIndex)) ? pokemonFormLevelMoves[species.speciesId][formIndex] : pokemonSpeciesLevelMoves[species.speciesId];
      this.ability1 = form.ability1;
      this.ability2 = (form.ability2 === form.ability1) ? undefined : form.ability2;
      this.abilityHidden = (form.abilityHidden === form.ability1) ? undefined : form.abilityHidden;

      this.evolutions = allEvolutions.filter(e => (e.preFormKey === form.formKey || e.preFormKey === null));
      this.baseStats = form.baseStats;
      this.baseTotal = form.baseTotal;

    } else {
      this.levelMoves = pokemonSpeciesLevelMoves[species.speciesId];
      this.ability1 = species.ability1;
      this.ability2 = (species.ability2 === species.ability1) ? undefined : species.ability2;
      this.abilityHidden = (species.abilityHidden === species.ability1) ? undefined : species.abilityHidden;

      this.evolutions = allEvolutions;
      this.baseStats = species.baseStats;
      this.baseTotal = species.baseTotal;
    }

    this.eggMoves = speciesEggMoves[this.getStarterSpeciesId(species.speciesId)] ?? [];
    this.hasEggMoves = Array.from({ length: 4 }, (_, em) => (globalScene.gameData.starterData[this.getStarterSpeciesId(species.speciesId)].eggMoves & (1 << em)) !== 0);

    const formKey = this.species?.forms.length > 0 ? this.species.forms[this.formIndex].formKey : "";
    this.tmMoves = speciesTmMoves[species.speciesId]?.filter(m => Array.isArray(m) ? (m[0] === formKey ? true : false ) : true)
      .map(m => Array.isArray(m) ? m[1] : m).sort((a, b) => allMoves[a].name > allMoves[b].name ? 1 : -1) ?? [];

    const passives = starterPassiveAbilities[this.getStarterSpeciesId(species.speciesId)];
    this.passive = (this.formIndex in passives) ? passives[formIndex] : passives[0];

    const starterData = globalScene.gameData.starterData[this.getStarterSpeciesId(species.speciesId)];
    const abilityAttr = starterData.abilityAttr;
    this.hasPassive = starterData.passiveAttr > 0;

    const hasAbility1 = abilityAttr & AbilityAttr.ABILITY_1;
    const hasAbility2 = abilityAttr & AbilityAttr.ABILITY_2;
    const hasHiddenAbility = abilityAttr & AbilityAttr.ABILITY_HIDDEN;

    this.hasAbilities = [
      hasAbility1,
      hasAbility2,
      hasHiddenAbility
    ];

    const allBiomes = catchableSpecies[species.speciesId] ?? [];
    this.preBiomes = this.sanitizeBiomes(
      (catchableSpecies[this.getStarterSpeciesId(species.speciesId)] ?? [])
        .filter(b => !allBiomes.some(bm => (b.biome === bm.biome && b.tier === bm.tier)) && !(b.biome === Biome.TOWN)),
      this.getStarterSpeciesId(species.speciesId));
    this.biomes = this.sanitizeBiomes(allBiomes, species.speciesId);

    const allFormChanges = pokemonFormChanges.hasOwnProperty(species.speciesId) ? pokemonFormChanges[species.speciesId] : [];
    this.battleForms = allFormChanges.filter(f => (f.preFormKey === this.species.forms[this.formIndex].formKey));

    const preSpecies = pokemonPrevolutions.hasOwnProperty(this.species.speciesId) ? allSpecies.find(sp => sp.speciesId === pokemonPrevolutions[this.species.speciesId]) : null;
    if (preSpecies) {
      const preEvolutions = pokemonEvolutions.hasOwnProperty(preSpecies.speciesId) ? pokemonEvolutions[preSpecies.speciesId] : [];
      this.prevolutions = preEvolutions.filter(
        e => e.speciesId === species.speciesId && (
          (
            (e.evoFormKey === "" || e.evoFormKey === null) &&
            (
              // This takes care of Cosplay Pikachu (Pichu is not shown)
              (preSpecies.forms.some(form => form.formKey === species.forms[formIndex]?.formKey)) ||
              // This takes care of Gholdengo
              (preSpecies.forms.length > 0 && species.forms.length === 0) ||
              // This takes care of everything else
              (preSpecies.forms.length === 0 && (species.forms.length === 0 || species.forms[formIndex]?.formKey === ""))
            )
          )
          // This takes care of Burmy, Shellos etc
          || e.evoFormKey === species.forms[formIndex]?.formKey
        )
      );
    }
  }

  // Function to ensure that forms appear in the appropriate biome and tod
  sanitizeBiomes(biomes: BiomeTierTod[], speciesId: number): BiomeTierTod[] {

    if (speciesId === Species.BURMY || speciesId === Species.WORMADAM) {
      return biomes.filter(b => {
        const formIndex = (() => {
          switch (b.biome) {
            case Biome.BEACH:
              return 1;
            case Biome.SLUM:
              return 2;
            default:
              return 0;
          }
        })();
        return this.formIndex === formIndex;
      });

    } else if (speciesId === Species.ROTOM) {
      return biomes.filter(b => {
        const formIndex = (() => {
          switch (b.biome) {
            case Biome.VOLCANO:
              return 1;
            case Biome.SEA:
              return 2;
            case Biome.ICE_CAVE:
              return 3;
            case Biome.MOUNTAIN:
              return 4;
            case Biome.TALL_GRASS:
              return 5;
            default:
              return 0;
          }
        })();
        return this.formIndex === formIndex;
      });

    } else if (speciesId === Species.LYCANROC) {
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

  isCaught(otherSpeciesDexEntry?: DexEntry): bigint {
    if (globalScene.dexForDevs) {
      return 255n;
    }

    const dexEntry = otherSpeciesDexEntry ? otherSpeciesDexEntry : this.speciesStarterDexEntry;

    return dexEntry?.caughtAttr ?? 0n;
  }
  /**
   * Check whether a given form is caught for a given species.
   * All forms that can be reached through a form change during battle are considered caught and show up in the dex as such.
   *
   * @param otherSpecies The species to check; defaults to current species
   * @param otherFormIndex The form index of the form to check; defaults to current form
   * @returns StarterAttributes for the species
   */
  isFormCaught(otherSpecies?: PokemonSpecies, otherFormIndex?: number | undefined): boolean {

    if (globalScene.dexForDevs) {
      return true;
    }
    const species = otherSpecies ? otherSpecies : this.species;
    const formIndex = otherFormIndex !== undefined ? otherFormIndex : this.formIndex;
    const dexEntry = globalScene.gameData.dexData[species.speciesId];

    const isFormCaught = dexEntry ?
      (dexEntry.caughtAttr & globalScene.gameData.getFormAttr(formIndex ?? 0)) > 0n
      : false;
    return isFormCaught;
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
    const starterAttributes : StarterAttributes | null = this.species ? { ...this.savedStarterAttributes } : null;
    const dexEntry = globalScene.gameData.dexData[this.species.speciesId];
    const caughtAttr = this.isCaught(dexEntry);

    // no preferences or Pokemon wasn't caught, return empty attribute
    if (!starterAttributes || !caughtAttr) {
      return {};
    }

    const hasShiny = caughtAttr & DexAttr.SHINY;
    const hasNonShiny = caughtAttr & DexAttr.NON_SHINY;
    if (starterAttributes.shiny && !hasShiny) {
      // shiny form wasn't unlocked, purging shiny and variant setting
      starterAttributes.shiny = false;
      starterAttributes.variant = 0;
    } else if (starterAttributes.shiny === false && !hasNonShiny) {
      // non shiny form wasn't unlocked, purging shiny setting
      starterAttributes.shiny = false;
    }

    if (starterAttributes.variant !== undefined) {
      const unlockedVariants = [
        hasShiny && caughtAttr & DexAttr.DEFAULT_VARIANT,
        hasShiny && caughtAttr & DexAttr.VARIANT_2,
        hasShiny && caughtAttr & DexAttr.VARIANT_3
      ];
      if (isNaN(starterAttributes.variant) || starterAttributes.variant < 0) {
        starterAttributes.variant = 0;
      } else if (!unlockedVariants[starterAttributes.variant]) {
        let highestValidIndex = -1;
        for (let i = 0; i <= starterAttributes.variant && i < unlockedVariants.length; i++) {
          if (unlockedVariants[i] !== 0n) {
            highestValidIndex = i;
          }
        }
        // Set to the highest valid index found or default to 0
        starterAttributes.variant = highestValidIndex !== -1 ? highestValidIndex : 0;
      }
    }

    if (starterAttributes.female !== undefined) {
      if ((starterAttributes.female && !(caughtAttr & DexAttr.FEMALE)) || (!starterAttributes.female && !(caughtAttr & DexAttr.MALE))) {
        starterAttributes.female = !starterAttributes.female;
      }
    }

    return starterAttributes;
  }

  showText(text: string, delay?: number, callback?: Function, callbackDelay?: number, prompt?: boolean, promptDelay?: number, moveToTop?: boolean) {
    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);

    const singleLine = text?.indexOf("\n") === -1;

    this.starterSelectMessageBox.setSize(318, singleLine ? 28 : 42);

    if (moveToTop) {
      this.starterSelectMessageBox.setOrigin(0, 0);
      this.starterSelectMessageBoxContainer.setY(0);
      this.message.setY(4);
    } else {
      this.starterSelectMessageBoxContainer.setY(globalScene.game.canvas.height / 6);
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
   * If the pokemon is an evolution, find speciesId of its starter.
   * @param speciesId the id of the species to check
   * @returns the id of the corresponding starter
   */
  getStarterSpeciesId(speciesId): number {
    if (globalScene.gameData.starterData.hasOwnProperty(speciesId)) {
      return speciesId;
    } else {
      return pokemonStarters[speciesId];
    }
  }

  getStarterSpecies(species): PokemonSpecies {
    if (globalScene.gameData.starterData.hasOwnProperty(species.speciesId)) {
      return species;
    } else {
      return allSpecies.find(sp => sp.speciesId === pokemonStarters[species.speciesId]) ?? species;
    }
  }

  /**
   * Assign a form string to a given species and form
   * @param formKey the form to format
   * @param species the species to format
   * @param speciesId whether the name of the species should be shown at the end
   * @returns the formatted string
   */
  getFormString(formKey: string, species: PokemonSpecies, append: boolean = false): string {
    let label: string;
    const formText = capitalizeString(formKey, "-", false, false) ?? "";
    const speciesName = capitalizeString(this.getStarterSpecies(species).name, "_", true, false) ?? "";
    if (species.speciesId === Species.ARCEUS) {
      label = i18next.t(`pokemonInfo:Type.${formText?.toUpperCase()}`);
      return label;
    }
    label = formText ? i18next.t(`pokemonForm:${speciesName}${formText}`) : "";
    if (label === `${speciesName}${formText}`) {
      label = i18next.t(`battlePokemonForm:${formKey}`, { pokemonName:species.name });
    } else {
      // If the label is only the form, we can append the name of the pokemon
      label += append ? ` ${species.name}` : "";
    }
    return label;
  }

  /**
   * Find the name of the region for regional species
   * @param species the species to check
   * @returns a string with the region name
   */
  getRegionName(species: PokemonSpecies): string {
    const name = species.name;
    const label = Species[species.speciesId];
    const suffix = label.includes("_") ? " (" + label.split("_")[0].toLowerCase() + ")" : "";
    return name + suffix;
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

    if (this.blockInputOverlay) {
      if (button === Button.CANCEL || button === Button.ACTION) {
        this.blockInputOverlay = false;
        this.baseStatsOverlay.clear();
        ui.showText("");
        return true;
      } else if (button === Button.UP || button === Button.DOWN) {
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
      } else {
        this.getUi().revertMode();
        success = true;
      }
    } else {

      const starterData = globalScene.gameData.starterData[this.getStarterSpeciesId(this.species.speciesId)];
      // prepare persistent starter data to store changes
      const starterAttributes = this.starterAttributes;

      if (button === Button.ACTION) {

        switch (this.cursor) {

          case MenuOptions.BASE_STATS:

            if (!isCaught || !isFormCaught) {
              error = true;
            } else {

              this.blockInput = true;

              ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => {
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

            if (!isCaught || !isFormCaught) {
              error = true;
            } else {

              this.blockInput = true;

              ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => {
                ui.showText(i18next.t("pokedexUiHandler:showLevelMoves"), null, () => {

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

                  this.blockInput = false;
                });
              });
              success = true;
            }
            break;

          case MenuOptions.EGG_MOVES:


            if (!isCaught || !isFormCaught) {
              error = true;
            } else {

              this.blockInput = true;

              ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => {

                if (this.eggMoves.length === 0) {
                  ui.showText(i18next.t("pokedexUiHandler:noEggMoves"));
                  this.blockInput = false;
                  return true;
                }

                ui.showText(i18next.t("pokedexUiHandler:showEggMoves"), null, () => {

                  this.moveInfoOverlay.show(allMoves[this.eggMoves[0]]);

                  ui.setModeWithoutClear(Mode.OPTION_SELECT, {
                    options: [
                      {
                        label: i18next.t("pokedexUiHandler:common"),
                        skip: true,
                        style: TextStyle.MONEY_WINDOW,
                        handler: () => false, // Non-selectable, but handler is required
                        onHover: () => this.moveInfoOverlay.clear() // No hover behavior for titles
                      },
                      ...this.eggMoves.slice(0, 3).map((m, i) => ({
                        label: allMoves[m].name,
                        style: this.hasEggMoves[i] ? TextStyle.SETTINGS_VALUE : TextStyle.SHADOW_TEXT,
                        handler: () => false,
                        onHover: () => this.moveInfoOverlay.show(allMoves[m])
                      })),
                      {
                        label: i18next.t("pokedexUiHandler:rare"),
                        skip: true,
                        style: TextStyle.MONEY_WINDOW,
                        handler: () => false,
                        onHover: () => this.moveInfoOverlay.clear()
                      },
                      {
                        label: allMoves[this.eggMoves[3]].name,
                        style: this.hasEggMoves[3] ? TextStyle.SETTINGS_VALUE : TextStyle.SHADOW_TEXT,
                        handler: () => false,
                        onHover: () => this.moveInfoOverlay.show(allMoves[this.eggMoves[3]])
                      },
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
              success = true;
            }
            break;

          case MenuOptions.TM_MOVES:

            if (!isCaught || !isFormCaught) {
              error = true;
            } else {
              this.blockInput = true;

              ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => {
                ui.showText(i18next.t("pokedexUiHandler:showTmMoves"), null, () => {

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
              success = true;
            }
            break;

          case MenuOptions.ABILITIES:

            if (!isCaught || !isFormCaught) {
              error = true;
            } else {

              this.blockInput = true;

              ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => {

                ui.showText(i18next.t("pokedexUiHandler:showAbilities"), null, () => {

                  this.infoOverlay.show(allAbilities[this.ability1].description);

                  const options: any[] = [];

                  if (this.ability1) {
                    options.push({
                      label: allAbilities[this.ability1].name,
                      style: this.hasAbilities[0] > 0 ?  TextStyle.SETTINGS_VALUE : TextStyle.SHADOW_TEXT,
                      handler: () => false,
                      onHover: () => this.infoOverlay.show(allAbilities[this.ability1].description)
                    });
                  }
                  if (this.ability2) {
                    const ability = allAbilities[this.ability2];
                    options.push({
                      label: ability?.name,
                      style: this.hasAbilities[1] > 0 ?  TextStyle.SETTINGS_VALUE : TextStyle.SHADOW_TEXT,
                      handler: () => false,
                      onHover: () => this.infoOverlay.show(ability?.description)
                    });
                  }

                  if (this.abilityHidden) {
                    options.push({
                      label: i18next.t("pokedexUiHandler:hidden"),
                      skip: true,
                      style: TextStyle.MONEY_WINDOW,
                      handler: () => false,
                      onHover: () => this.infoOverlay.clear()
                    });
                    const ability = allAbilities[this.abilityHidden];
                    options.push({
                      label: allAbilities[this.abilityHidden].name,
                      style: this.hasAbilities[2] > 0 ?  TextStyle.SETTINGS_VALUE : TextStyle.SHADOW_TEXT,
                      handler: () => false,
                      onHover: () => this.infoOverlay.show(ability?.description)
                    });
                  }

                  if (this.passive) {
                    options.push({
                      label: i18next.t("pokedexUiHandler:passive"),
                      skip: true,
                      style: TextStyle.MONEY_WINDOW,
                      handler: () => false,
                      onHover: () => this.infoOverlay.clear()
                    });
                    options.push({
                      label: allAbilities[this.passive].name,
                      style: this.hasPassive ?  TextStyle.SETTINGS_VALUE : TextStyle.SHADOW_TEXT,
                      handler: () => false,
                      onHover: () => this.infoOverlay.show(allAbilities[this.passive].description)
                    });
                  }

                  options.push({
                    label: i18next.t("menu:cancel"),
                    handler: () => {
                      this.infoOverlay.clear();
                      this.clearText();
                      ui.setMode(Mode.POKEDEX_PAGE, "refresh");
                      return true;
                    },
                    onHover: () => this.infoOverlay.clear()
                  });

                  ui.setModeWithoutClear(Mode.OPTION_SELECT, {
                    options: options,
                    supportHover: true,
                    maxOptions: 8,
                    yOffset: 19
                  });

                  this.blockInput = false;
                });
              });
              success = true;
            }
            break;

          case MenuOptions.BIOMES:

            if (!(this.isCaught() || this.speciesStarterDexEntry?.seenAttr)) {
              error = true;
            } else {
              this.blockInput = true;

              ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => {

                if ((!this.biomes || this.biomes?.length === 0) &&
                    (!this.preBiomes || this.preBiomes?.length === 0)) {
                  ui.showText(i18next.t("pokedexUiHandler:noBiomes"));
                  ui.playError();
                  this.blockInput = false;
                  return true;
                }

                const options: any[] = [];

                ui.showText(i18next.t("pokedexUiHandler:showBiomes"), null, () => {

                  this.biomes.map(b => {
                    options.push({
                      label: i18next.t(`biome:${Biome[b.biome].toUpperCase()}`) + " - " +
                        i18next.t(`biome:${BiomePoolTier[b.tier].toUpperCase()}`) +
                        ( b.tod.length === 1 && b.tod[0] === -1 ? "" : " (" + b.tod.map(tod => i18next.t(`biome:${TimeOfDay[tod].toUpperCase()}`)).join(", ") + ")"),
                      handler: () => false
                    });
                  });


                  if (this.preBiomes.length > 0) {
                    options.push({
                      label: i18next.t("pokedexUiHandler:preBiomes"),
                      skip: true,
                      handler: () => false
                    });
                    this.preBiomes.map(b => {
                      options.push({
                        label: i18next.t(`biome:${Biome[b.biome].toUpperCase()}`) + " - " +
                          i18next.t(`biome:${BiomePoolTier[b.tier].toUpperCase()}`) +
                          ( b.tod.length === 1 && b.tod[0] === -1 ? "" : " (" + b.tod.map(tod => i18next.t(`biome:${TimeOfDay[tod].toUpperCase()}`)).join(", ") + ")"),
                        handler: () => false
                      });
                    });
                  }

                  options.push({
                    label: i18next.t("menu:cancel"),
                    handler: () => {
                      this.moveInfoOverlay.clear();
                      this.clearText();
                      ui.setMode(Mode.POKEDEX_PAGE, "refresh");
                      return true;
                    },
                    onHover: () => this.moveInfoOverlay.clear()
                  });

                  ui.setModeWithoutClear(Mode.OPTION_SELECT, {
                    options: options,
                    supportHover: true,
                    maxOptions: 8,
                    yOffset: 19
                  });

                  this.blockInput = false;
                });
              });
              success = true;
            }
            break;

          case MenuOptions.EVOLUTIONS:

            if (!isCaught || !isFormCaught) {
              error = true;
            } else {

              this.blockInput = true;

              ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => {

                const options: any[] = [];

                if ((!this.prevolutions || this.prevolutions?.length === 0) &&
                    (!this.evolutions || this.evolutions?.length === 0) &&
                    (!this.battleForms || this.battleForms?.length === 0)) {
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
                      handler: () => false
                    });
                    this.prevolutions.map(pre => {
                      const preSpecies = allSpecies.find(species => species.speciesId === pokemonPrevolutions[this.species.speciesId]);

                      const conditionText: string = pre.description;

                      options.push({
                        label: pre.preFormKey ?
                          this.getFormString(pre.preFormKey, preSpecies ?? this.species, true) :
                          this.getRegionName(preSpecies ?? this.species),
                        handler: () => {
                          const newSpecies = allSpecies.find(species => species.speciesId === pokemonPrevolutions[pre.speciesId]);
                          // Attempts to find the formIndex of the prevolved species
                          const newFormKey = pre.preFormKey ? pre.preFormKey : (this.species.forms.length > 0 ? this.species.forms[this.formIndex].formKey : "");
                          const matchingForm = newSpecies?.forms.find(form => form.formKey === newFormKey);
                          const newFormIndex = matchingForm ? matchingForm.formIndex : 0;
                          this.starterAttributes.form = newFormIndex;
                          this.savedStarterAttributes.form = newFormIndex;
                          this.moveInfoOverlay.clear();
                          this.clearText();
                          ui.setMode(Mode.POKEDEX_PAGE, newSpecies, newFormIndex, this.savedStarterAttributes);
                          return true;
                        },
                        onHover: () => this.showText(conditionText)
                      });
                    });
                  }

                  if (this.evolutions.length > 0) {
                    options.push({
                      label: i18next.t("pokedexUiHandler:evolutions"),
                      style: TextStyle.MONEY_WINDOW,
                      skip: true,
                      handler: () => false
                    });
                    this.evolutions.map(evo => {
                      const evoSpecies = allSpecies.find(species => species.speciesId === evo.speciesId);
                      const evoSpeciesStarterDexEntry = evoSpecies ? globalScene.gameData.dexData[evoSpecies.speciesId] : undefined;
                      const isCaughtEvo = this.isCaught(evoSpeciesStarterDexEntry) ? true : false;
                      // Attempts to find the formIndex of the evolved species
                      const newFormKey = evo.evoFormKey ? evo.evoFormKey : (this.species.forms.length > 0 ? this.species.forms[this.formIndex].formKey : "");
                      const matchingForm = evoSpecies?.forms.find(form => form.formKey === newFormKey);
                      const newFormIndex = matchingForm ? matchingForm.formIndex : 0;
                      const isFormCaughtEvo = this.isFormCaught(evoSpecies, newFormIndex);

                      const conditionText: string = evo.description;

                      options.push({
                        label: evo.evoFormKey ?
                          this.getFormString(evo.evoFormKey, evoSpecies ?? this.species, true) :
                          this.getRegionName(evoSpecies ?? this.species),
                        style: isCaughtEvo && isFormCaughtEvo ? TextStyle.WINDOW : TextStyle.SHADOW_TEXT,
                        handler: () => {
                          this.starterAttributes.form = newFormIndex;
                          this.savedStarterAttributes.form = newFormIndex;
                          this.moveInfoOverlay.clear();
                          this.clearText();
                          ui.setMode(Mode.POKEDEX_PAGE, evoSpecies, newFormIndex, this.savedStarterAttributes);
                          return true;
                        },
                        onHover: () => this.showText(conditionText)
                      });
                    });
                  }

                  if (this.battleForms.length > 0) {
                    options.push({
                      label: i18next.t("pokedexUiHandler:forms"),
                      style: TextStyle.MONEY_WINDOW,
                      skip: true,
                      handler: () => false
                    });
                    this.battleForms.map(bf => {

                      let conditionText:string = "";
                      if (bf.trigger) {
                        conditionText = bf.trigger.description;
                      } else {
                        conditionText = "";
                      }
                      let label: string = this.getFormString(bf.formKey, this.species);
                      if (label === "") {
                        label = this.species.name;
                      }
                      const matchingForm = this.species?.forms.find(form => form.formKey === bf.formKey);
                      const newFormIndex = matchingForm ? matchingForm.formIndex : 0;
                      const isFormCaught = this.isFormCaught(this.species, newFormIndex);

                      if (conditionText) {
                        options.push({
                          label: label,
                          style: isFormCaught ? TextStyle.WINDOW : TextStyle.SHADOW_TEXT,
                          handler: () => {
                            const newSpecies = this.species;
                            const newFormIndex = this.species.forms.find(f => f.formKey === bf.formKey)?.formIndex;
                            this.starterAttributes.form = newFormIndex;
                            this.savedStarterAttributes.form = newFormIndex;
                            this.moveInfoOverlay.clear();
                            this.clearText();
                            ui.setMode(Mode.POKEDEX_PAGE, newSpecies, newFormIndex, this.savedStarterAttributes);
                            return true;
                          },
                          onHover: () => this.showText(conditionText)
                        });
                      }
                    });
                  }

                  options.push({
                    label: i18next.t("menu:cancel"),
                    handler: () => {
                      this.moveInfoOverlay.clear();
                      this.clearText();
                      ui.setMode(Mode.POKEDEX_PAGE, "refresh");
                      return true;
                    },
                    onHover: () => this.moveInfoOverlay.clear()
                  });

                  ui.setModeWithoutClear(Mode.OPTION_SELECT, {
                    options: options,
                    supportHover: true,
                    maxOptions: 8,
                    yOffset: 19
                  });

                  this.blockInput = false;
                });
              });
              success = true;
            }
            break;

          case MenuOptions.TOGGLE_IVS:

            if (!isCaught || !isFormCaught) {
              error = true;
            } else {
              this.toggleStatsMode();
              ui.setMode(Mode.POKEDEX_PAGE, "refresh");
              success = true;
            }
            break;

          case MenuOptions.NATURES:

            if (!isCaught || !isFormCaught) {
              error = true;
            } else {
              this.blockInput = true;
              ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => {
                ui.showText(i18next.t("pokedexUiHandler:showNature"), null, () => {
                  const natures = globalScene.gameData.getNaturesForAttr(this.speciesStarterDexEntry?.natureAttr);
                  ui.setModeWithoutClear(Mode.OPTION_SELECT, {
                    options: natures.map((n: Nature, i: number) => {
                      const option: OptionSelectItem = {
                        label: getNatureName(n, true, true, true, globalScene.uiTheme),
                        handler: () => {
                          return false;
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
              success = true;
            }
            break;
        }

      } else {
        const props = globalScene.gameData.getSpeciesDexAttrProps(this.species, this.getCurrentDexProps(this.species.speciesId));
        switch (button) {
          case Button.CYCLE_SHINY:
            if (this.canCycleShiny) {

              if (!starterAttributes.shiny) {
                // Change to shiny, we need to get the proper default variant
                const newVariant = starterAttributes.variant ? starterAttributes.variant as Variant : 0;
                this.setSpeciesDetails(this.species, { shiny: true, variant: newVariant });

                globalScene.playSound("se/sparkle");
                // Set the variant label to the shiny tint
                const tint = getVariantTint(newVariant);
                this.pokemonShinyIcon.setFrame(getVariantIcon(newVariant));
                this.pokemonShinyIcon.setTint(tint);
                this.pokemonShinyIcon.setVisible(true);

                starterAttributes.shiny = true;
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
                  } else {
                    if (this.isCaught() & DexAttr.VARIANT_3) {
                      break;
                    }
                  }
                } while (newVariant !== props.variant);

                starterAttributes.variant = newVariant; // store the selected variant
                this.savedStarterAttributes.variant = starterAttributes.variant;
                if (newVariant > props.variant) {
                  this.setSpeciesDetails(this.species, { variant: newVariant as Variant });
                  // Cycle tint based on current sprite tint
                  const tint = getVariantTint(newVariant as Variant);
                  this.pokemonShinyIcon.setFrame(getVariantIcon(newVariant as Variant));
                  this.pokemonShinyIcon.setTint(tint);
                  success = true;
                } else {
                  this.setSpeciesDetails(this.species, { shiny: false, variant: 0 });
                  this.pokemonShinyIcon.setVisible(false);
                  success = true;

                  starterAttributes.shiny = false;
                  this.savedStarterAttributes.shiny = starterAttributes.shiny;
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
                if (this.species.forms[newFormIndex].isStarterSelectable || globalScene.dexForDevs) { // TODO: are those bangs correct?
                  break;
                }
              } while (newFormIndex !== props.formIndex);
              starterAttributes.form = newFormIndex; // store the selected form
              this.savedStarterAttributes.form = starterAttributes.form;
              this.formIndex = newFormIndex;
              this.starterSetup();
              this.setSpeciesDetails(this.species, { formIndex: newFormIndex });
              success = this.setCursor(this.cursor);
            }
            break;
          case Button.CYCLE_GENDER:
            if (this.canCycleGender) {
              starterAttributes.female = !props.female;
              this.savedStarterAttributes.female = starterAttributes.female;
              this.setSpeciesDetails(this.species, { female: !props.female });
              success = true;
            }
            break;
          case Button.STATS:
            if (!isCaught || !isFormCaught) {
              error = true;
            } else {
              const ui = this.getUi();
              const options: any[] = []; // TODO: add proper type

              const passiveAttr = starterData.passiveAttr;
              const candyCount = starterData.candyCount;

              if (!pokemonPrevolutions.hasOwnProperty(this.species.speciesId)) {
                if (!(passiveAttr & PassiveAttr.UNLOCKED)) {
                  const passiveCost = getPassiveCandyCount(speciesStarterCosts[this.getStarterSpeciesId(this.species.speciesId)]);
                  options.push({
                    label: `x${passiveCost} ${i18next.t("pokedexUiHandler:unlockPassive")} (${allAbilities[this.passive].name})`,
                    handler: () => {
                      if (Overrides.FREE_CANDY_UPGRADE_OVERRIDE || candyCount >= passiveCost) {
                        starterData.passiveAttr |= PassiveAttr.UNLOCKED | PassiveAttr.ENABLED;
                        if (!Overrides.FREE_CANDY_UPGRADE_OVERRIDE) {
                          starterData.candyCount -= passiveCost;
                        }
                        this.pokemonCandyCountText.setText(`x${starterData.candyCount}`);
                        globalScene.gameData.saveSystem().then(success => {
                          if (!success) {
                            return globalScene.reset(true);
                          }
                        });
                        ui.setMode(Mode.POKEDEX_PAGE, "refresh");
                        this.setSpeciesDetails(this.species);
                        globalScene.playSound("se/buy");

                        return true;
                      }
                      return false;
                    },
                    item: "candy",
                    itemArgs: starterColors[this.getStarterSpeciesId(this.species.speciesId)]
                  });
                }

                // Reduce cost option
                const valueReduction = starterData.valueReduction;
                if (valueReduction < valueReductionMax) {
                  const reductionCost = getValueReductionCandyCounts(speciesStarterCosts[this.getStarterSpeciesId(this.species.speciesId)])[valueReduction];
                  options.push({
                    label: `x${reductionCost} ${i18next.t("pokedexUiHandler:reduceCost")}`,
                    handler: () => {
                      if (Overrides.FREE_CANDY_UPGRADE_OVERRIDE || candyCount >= reductionCost) {
                        starterData.valueReduction++;
                        if (!Overrides.FREE_CANDY_UPGRADE_OVERRIDE) {
                          starterData.candyCount -= reductionCost;
                        }
                        this.pokemonCandyCountText.setText(`x${starterData.candyCount}`);
                        globalScene.gameData.saveSystem().then(success => {
                          if (!success) {
                            return globalScene.reset(true);
                          }
                        });
                        ui.setMode(Mode.POKEDEX_PAGE, "refresh");
                        globalScene.playSound("se/buy");

                        return true;
                      }
                      return false;
                    },
                    item: "candy",
                    itemArgs: starterColors[this.getStarterSpeciesId(this.species.speciesId)]
                  });
                }

                // Same species egg menu option.
                const sameSpeciesEggCost = getSameSpeciesEggCandyCounts(speciesStarterCosts[this.getStarterSpeciesId(this.species.speciesId)]);
                options.push({
                  label: `x${sameSpeciesEggCost} ${i18next.t("pokedexUiHandler:sameSpeciesEgg")}`,
                  handler: () => {
                    if (Overrides.FREE_CANDY_UPGRADE_OVERRIDE || candyCount >= sameSpeciesEggCost) {
                      if (globalScene.gameData.eggs.length >= 99 && !Overrides.UNLIMITED_EGG_COUNT_OVERRIDE) {
                        // Egg list full, show error message at the top of the screen and abort
                        this.showText(i18next.t("egg:tooManyEggs"), undefined, () => this.showText("", 0, () => this.tutorialActive = false), 2000, false, undefined, true);
                        return false;
                      }
                      if (!Overrides.FREE_CANDY_UPGRADE_OVERRIDE) {
                        starterData.candyCount -= sameSpeciesEggCost;
                      }
                      this.pokemonCandyCountText.setText(`x${starterData.candyCount}`);

                      const egg = new Egg({ scene: globalScene, species: this.species.speciesId, sourceType: EggSourceType.SAME_SPECIES_EGG });
                      egg.addEggToGameData();

                      globalScene.gameData.saveSystem().then(success => {
                        if (!success) {
                          return globalScene.reset(true);
                        }
                      });
                      ui.setMode(Mode.POKEDEX_PAGE, "refresh");
                      globalScene.playSound("se/buy");

                      return true;
                    }
                    return false;
                  },
                  item: "candy",
                  itemArgs: starterColors[this.getStarterSpeciesId(this.species.speciesId)]
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
                success = true;
              } else {
                error = true;
              }
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
            this.blockInput = true;
            ui.setModeWithoutClear(Mode.OPTION_SELECT).then(() => {
              const index = allSpecies.findIndex(species => species.speciesId === this.species.speciesId);
              const newIndex = index <= 0 ? allSpecies.length - 1 : index - 1;
              const newSpecies = allSpecies[newIndex];
              const matchingForm = newSpecies?.forms.find(form => form.formKey === this.species?.forms[this.formIndex]?.formKey);
              const newFormIndex = matchingForm ? matchingForm.formIndex : 0;
              this.starterAttributes.form = newFormIndex;
              this.savedStarterAttributes.form = newFormIndex;
              this.moveInfoOverlay.clear();
              this.clearText();
              ui.setModeForceTransition(Mode.POKEDEX_PAGE, newSpecies, newFormIndex, this.savedStarterAttributes);
            });
            this.blockInput = false;
            break;
          case Button.RIGHT:
            ui.setModeWithoutClear(Mode.OPTION_SELECT).then(() => {
              const index = allSpecies.findIndex(species => species.speciesId === this.species.speciesId);
              const newIndex = index >= allSpecies.length - 1 ? 0 : index + 1;
              const newSpecies = allSpecies[newIndex];
              const matchingForm = newSpecies?.forms.find(form => form.formKey === this.species?.forms[this.formIndex]?.formKey);
              const newFormIndex = matchingForm ? matchingForm.formIndex : 0;
              this.starterAttributes.form = newFormIndex;
              this.savedStarterAttributes.form = newFormIndex;
              this.moveInfoOverlay.clear();
              this.clearText();
              ui.setModeForceTransition(Mode.POKEDEX_PAGE, newSpecies, newFormIndex, this.savedStarterAttributes);
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
    this.instructionsContainer.add([ iconElement, controlLabel ]);
    this.instructionRowY += 8;
    if (this.instructionRowY >= 24) {
      this.instructionRowY = 8;
      this.instructionRowX += 50;
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
    if (globalScene.inputMethod === "gamepad") {
      gamepadType = globalScene.inputController.getConfig(globalScene.inputController.selectedDevice[Device.GAMEPAD]).padType;
    } else {
      gamepadType = globalScene.inputMethod;
    }

    if (!gamepadType) {
      return;
    }

    const isFormCaught = this.isFormCaught();

    if (this.isCaught()) {
      if (isFormCaught) {
        if (!pokemonPrevolutions.hasOwnProperty(this.species.speciesId)) {
          this.updateButtonIcon(SettingKeyboard.Button_Stats, gamepadType, this.candyUpgradeIconElement, this.candyUpgradeLabel);
        }
        if (this.canCycleShiny) {
          this.updateButtonIcon(SettingKeyboard.Button_Cycle_Shiny, gamepadType, this.shinyIconElement, this.shinyLabel);
        }
        if (this.canCycleGender) {
          this.updateButtonIcon(SettingKeyboard.Button_Cycle_Gender, gamepadType, this.genderIconElement, this.genderLabel);
        }
      }
      if (this.canCycleForm) {
        this.updateButtonIcon(SettingKeyboard.Button_Cycle_Form, gamepadType, this.formIconElement, this.formLabel);
      }
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

    Challenge.applyChallenges(globalScene.gameMode, Challenge.ChallengeType.STARTER_POINTS, valueLimit);

    return valueLimit.value;
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

    const isFormCaught = this.isFormCaught();

    if ((this.isCaught() && isFormCaught) || (this.speciesStarterDexEntry?.seenAttr && cursor === 5)) {
      ui.showText(this.menuDescriptions[cursor]);
    } else {
      ui.showText("");
    }

    return ret;
  }

  getFriendship(speciesId: number) {
    let currentFriendship = globalScene.gameData.starterData[this.getStarterSpeciesId(speciesId)].friendship;
    if (!currentFriendship || currentFriendship === undefined) {
      currentFriendship = 0;
    }

    const friendshipCap = getStarterValueFriendshipCap(speciesStarterCosts[this.getStarterSpeciesId(speciesId)]);

    return { currentFriendship, friendshipCap };
  }

  setSpecies() {
    const species = this.species;
    const starterAttributes : StarterAttributes | null = species ? { ...this.starterAttributes } : null;

    if (!species && globalScene.ui.getTooltip().visible) {
      globalScene.ui.hideTooltip();
    }

    if (this.statsMode) {
      if (this.isCaught()) {
        this.statsContainer.setVisible(true);
        this.showStats();
      } else {
        this.statsContainer.setVisible(false);
        //@ts-ignore
        this.statsContainer.updateIvs(null); // TODO: resolve ts-ignore. what. how? huh?
      }
    }

    if (species && (this.speciesStarterDexEntry?.seenAttr || this.isCaught())) {
      this.pokemonNumberText.setText(padInt(species.speciesId, 4));
      if (starterAttributes?.nickname) {
        const name = decodeURIComponent(escape(atob(starterAttributes.nickname)));
        this.pokemonNameText.setText(name);
      } else {
        this.pokemonNameText.setText(species.name);
      }

      if (this.isCaught()) {
        const colorScheme = starterColors[species.speciesId];

        const luck = globalScene.gameData.getDexAttrLuck(this.isCaught());
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
        this.pokemonCaughtCountText.setText(`${this.speciesStarterDexEntry?.caughtCount}`);
        if (species.speciesId === Species.MANAPHY || species.speciesId === Species.PHIONE) {
          this.pokemonHatchedIcon.setFrame("manaphy");
        } else {
          this.pokemonHatchedIcon.setFrame(getEggTierForSpecies(species));
        }
        this.pokemonHatchedCountText.setText(`${this.speciesStarterDexEntry?.hatchedCount}`);

        const defaultDexAttr = this.getCurrentDexProps(species.speciesId);
        const defaultProps = globalScene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
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
          this.pokemonCandyCountText.setText(`x${globalScene.gameData.starterData[this.getStarterSpeciesId(species.speciesId)].candyCount}`);
          this.pokemonCandyContainer.setVisible(true);
          this.pokemonFormText.setY(42);
          this.pokemonHatchedIcon.setVisible(true);
          this.pokemonHatchedCountText.setVisible(true);

          const { currentFriendship, friendshipCap } = this.getFriendship(this.species.speciesId);
          const candyCropY = 16 - (16 * (currentFriendship / friendshipCap));
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

        // Set default attributes if for some reason starterAttributes does not exist or attributes missing
        const props: StarterAttributes = globalScene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
        if (starterAttributes?.variant && !isNaN(starterAttributes.variant)) {
          if (props.shiny) {
            props.variant = starterAttributes.variant as Variant;
          }
        }
        props.form = starterAttributes?.form ?? props.form;
        props.female = starterAttributes?.female ?? props.female;

        this.setSpeciesDetails(species, {
          shiny: props.shiny,
          formIndex: props.form,
          female: props.female,
          variant: props.variant ?? 0,
        });

        if (this.isFormCaught(this.species, props.form)) {
          const speciesForm = getPokemonSpeciesForm(species.speciesId, props.form ?? 0);
          this.setTypeIcons(speciesForm.type1, speciesForm.type2);
          this.pokemonSprite.clearTint();
        }
      } else {
        this.pokemonGrowthRateText.setText("");
        this.pokemonGrowthRateLabelText.setVisible(false);
        this.type1Icon.setVisible(true);
        this.type2Icon.setVisible(true);
        this.pokemonLuckLabelText.setVisible(false);
        this.pokemonLuckText.setVisible(false);
        this.pokemonShinyIcon.setVisible(false);
        this.pokemonUncaughtText.setVisible(true);
        this.pokemonCaughtHatchedContainer.setVisible(true);
        this.pokemonCandyContainer.setVisible(false);
        this.pokemonFormText.setVisible(false);

        const defaultDexAttr = globalScene.gameData.getSpeciesDefaultDexAttr(species, true, true);
        const props = globalScene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);

        this.setSpeciesDetails(species, {
          shiny: props.shiny,
          formIndex: props.formIndex,
          female: props.female,
          variant: props.variant,
          forSeen: true
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
      this.pokemonShinyIcon.setVisible(false);
      this.pokemonUncaughtText.setVisible(!!species);
      this.pokemonCaughtHatchedContainer.setVisible(false);
      this.pokemonCandyContainer.setVisible(false);
      this.pokemonFormText.setVisible(false);

      this.setSpeciesDetails(species!, { // TODO: is this bang correct?
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
    const forSeen: boolean = options.forSeen ?? false;
    const oldProps = species ? this.starterAttributes : null;

    // We will only update the sprite if there is a change to form, shiny/variant
    // or gender for species with gender sprite differences
    const shouldUpdateSprite = (species?.genderDiffs && !isNullOrUndefined(female))
     || !isNullOrUndefined(formIndex) || !isNullOrUndefined(shiny) || !isNullOrUndefined(variant) || forceUpdate;

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
      const dexEntry = globalScene.gameData.dexData[species.speciesId];

      const caughtAttr = this.isCaught(dexEntry);

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

      this.shinyOverlay.setVisible(shiny ?? false); // TODO: is false the correct default?
      this.pokemonNumberText.setColor(this.getTextColor(shiny ? TextStyle.SUMMARY_GOLD : TextStyle.SUMMARY, false));
      this.pokemonNumberText.setShadowColor(this.getTextColor(shiny ? TextStyle.SUMMARY_GOLD : TextStyle.SUMMARY, true));


      const assetLoadCancelled = new BooleanHolder(false);
      this.assetLoadCancelled = assetLoadCancelled;

      if (shouldUpdateSprite) {
        const back = this.showBackSprite ? true : false;
        species.loadAssets(female!, formIndex, shiny, variant as Variant, true, back).then(() => { // TODO: is this bang correct?
          if (assetLoadCancelled.value) {
            return;
          }
          this.assetLoadCancelled = null;
          this.speciesLoaded.set(species.speciesId, true);
          this.pokemonSprite.play(species.getSpriteKey(female!, formIndex, shiny, variant, back)); // TODO: is this bang correct?
          this.pokemonSprite.setPipelineData("shiny", shiny);
          this.pokemonSprite.setPipelineData("variant", variant);
          this.pokemonSprite.setPipelineData("spriteKey", species.getSpriteKey(female!, formIndex, shiny, variant, back)); // TODO: is this bang correct?
          this.pokemonSprite.setVisible(!this.statsMode);
        });
      } else {
        this.pokemonSprite.setVisible(!this.statsMode);
      }

      const currentFilteredContainer = this.filteredStarterContainers.find(p => p.species.speciesId === species.speciesId);
      if (currentFilteredContainer) {
        const starterSprite = currentFilteredContainer.icon as Phaser.GameObjects.Sprite;
        starterSprite.setTexture(species.getIconAtlasKey(formIndex, shiny, variant), species.getIconId(female!, formIndex, shiny, variant));
        currentFilteredContainer.checkIconId(female, formIndex, shiny, variant);
      }

      const isNonShinyCaught = !!(caughtAttr & DexAttr.NON_SHINY);
      const isShinyCaught = !!(caughtAttr & DexAttr.SHINY);

      this.canCycleShiny = isNonShinyCaught && isShinyCaught;

      const isMaleCaught = !!(caughtAttr & DexAttr.MALE);
      const isFemaleCaught = !!(caughtAttr & DexAttr.FEMALE);
      this.canCycleGender = isMaleCaught && isFemaleCaught;

      // If the dev option for the dex is selected, all forms can be cycled through
      this.canCycleForm = globalScene.dexForDevs ? species.forms.length > 1 :
        species.forms.filter(f => f.isStarterSelectable).filter(f => f).length > 1;

      if (caughtAttr && species.malePercent !== null) {
        const gender = !female ? Gender.MALE : Gender.FEMALE;
        this.pokemonGenderText.setText(getGenderSymbol(gender));
        this.pokemonGenderText.setColor(getGenderColor(gender));
        this.pokemonGenderText.setShadowColor(getGenderColor(gender, true));
      } else {
        this.pokemonGenderText.setText("");
      }

      if (caughtAttr) {
        if (isFormCaught) {
          this.species.loadAssets(female!, formIndex, shiny, variant as Variant, true).then(() => {
            const crier = (this.species.forms && this.species.forms.length > 0) ? this.species.forms[formIndex ?? this.formIndex] : this.species;
            crier.cry();
          });

          this.pokemonSprite.clearTint();
        } else {
          this.pokemonSprite.setTint(0x000000);
        }
      }

      if (caughtAttr || forSeen) {
        const speciesForm = getPokemonSpeciesForm(species.speciesId, formIndex!); // TODO: is the bang correct?
        this.setTypeIcons(speciesForm.type1, speciesForm.type2);
        this.pokemonFormText.setText(this.getFormString((speciesForm as PokemonForm).formKey, species));

      } else {
        this.setTypeIcons(null, null);
        this.pokemonFormText.setText("");
      }
    } else {
      this.shinyOverlay.setVisible(false);
      this.pokemonNumberText.setColor(this.getTextColor(TextStyle.SUMMARY));
      this.pokemonNumberText.setShadowColor(this.getTextColor(TextStyle.SUMMARY, true));
      this.pokemonGenderText.setText("");
      this.setTypeIcons(null, null);
    }

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
   * Creates a temporary dex attr props that will be used to display the correct shiny, variant, and form based on this.starterAttributes
   *
   * @param speciesId the id of the species to get props for
   * @returns the dex props
   */
  getCurrentDexProps(speciesId: number): bigint {
    let props = 0n;
    const caughtAttr = globalScene.gameData.dexData[speciesId].caughtAttr;

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
    if (this.starterAttributes?.shiny || ((caughtAttr & DexAttr.SHINY) > 0n && this.starterAttributes?.shiny !== false)) {
      props += DexAttr.SHINY;
      if (this.starterAttributes?.variant !== undefined) {
        props += BigInt(Math.pow(2, this.starterAttributes?.variant)) * DexAttr.DEFAULT_VARIANT;
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
    if (this.starterAttributes?.form) { // this checks for the form of the pokemon
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

  checkIconId(icon: Phaser.GameObjects.Sprite, species: PokemonSpecies, female: boolean, formIndex: number, shiny: boolean, variant: number) {
    if (icon.frame.name !== species.getIconId(female, formIndex, shiny, variant)) {
      console.log(`${species.name}'s icon ${icon.frame.name} does not match getIconId with female: ${female}, formIndex: ${formIndex}, shiny: ${shiny}, variant: ${variant}`);
      icon.setTexture(species.getIconAtlasKey(formIndex, false, variant));
      icon.setFrame(species.getIconId(female, formIndex, false, variant));
    }
  }
}
