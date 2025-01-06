import { EvolutionItem, pokemonEvolutions, pokemonPrevolutions, pokemonStarters, SpeciesFormEvolution } from "#app/data/balance/pokemon-evolutions";
import { Variant, getVariantTint, getVariantIcon } from "#app/data/variant";
import { argbFromRgba } from "@material/material-color-utilities";
import i18next from "i18next";
import BattleScene, { starterColors } from "#app/battle-scene";
import { allAbilities } from "#app/data/ability";
import { speciesEggMoves } from "#app/data/balance/egg-moves";
import { GrowthRate, getGrowthRateColor } from "#app/data/exp";
import { Gender, getGenderColor, getGenderSymbol } from "#app/data/gender";
import { allMoves } from "#app/data/move";
import { getNatureName } from "#app/data/nature";
import { pokemonFormChanges } from "#app/data/pokemon-forms";
import { LevelMoves, pokemonFormLevelMoves, pokemonSpeciesLevelMoves } from "#app/data/balance/pokemon-level-moves";
import PokemonSpecies, { allSpecies, getPokemonSpeciesForm, PokemonForm } from "#app/data/pokemon-species";
import { getStarterValueFriendshipCap, speciesStarterCosts } from "#app/data/balance/starters";
import { starterPassiveAbilities } from "#app/data/balance/passives";
import { Type } from "#enums/type";
import { GameModes } from "#app/game-mode";
import { AbilityAttr, DexAttr, DexEntry, StarterAttributes  } from "#app/system/game-data";
import { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import MessageUiHandler from "#app/ui/message-ui-handler";
import PokemonIconAnimHandler, { PokemonIconAnimMode } from "#app/ui/pokemon-icon-anim-handler";
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
import { BiomePoolTier, BiomeTierTod, catchableSpecies } from "#app/data/balance/biomes";
import { Biome } from "#app/enums/biome";
import { TimeOfDay } from "#app/enums/time-of-day";
import { Abilities } from "#app/enums/abilities";
import BaseStatsOverlay from "./base-stats-overlay";


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
  variant?: integer,
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

  private starterSelectMessageBox: Phaser.GameObjects.NineSlice;
  private starterSelectMessageBoxContainer: Phaser.GameObjects.Container;
  private statsContainer: StatsContainer;
  private moveInfoOverlay: MoveInfoOverlay;
  private infoOverlay: PokedexInfoOverlay;
  private baseStatsOverlay: BaseStatsOverlay;

  private statsMode: boolean;

  private allSpecies: PokemonSpecies[] = [];
  private lastSpecies: PokemonSpecies;
  private lastFormIndex: number;
  private speciesLoaded: Map<Species, boolean> = new Map<Species, boolean>();
  public starterSpecies: PokemonSpecies[] = [];
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
  private battleForms: PokemonForm[];
  private prevolutions: SpeciesFormEvolution[];

  private speciesStarterDexEntry: DexEntry | null;
  private canCycleShiny: boolean;
  private canCycleForm: boolean;
  private canCycleGender: boolean;
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

  private starterAttributes: StarterAttributes;

  protected blockInput: boolean = false;
  protected blockInputOverlay: boolean = false;

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

    const starterSelectBg = this.scene.add.image(0, 0, "pokedex_summary_bg");
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

    this.pokemonGrowthRateLabelText = addTextObject(this.scene, 8, 106, i18next.t("pokedexUiHandler:growthRate"), TextStyle.SUMMARY_ALT, { fontSize: "36px" });
    this.pokemonGrowthRateLabelText.setOrigin(0, 0);
    this.pokemonGrowthRateLabelText.setVisible(false);
    this.starterSelectContainer.add(this.pokemonGrowthRateLabelText);

    this.pokemonGrowthRateText = addTextObject(this.scene, 34, 106, "", TextStyle.SUMMARY_PINK, { fontSize: "36px" });
    this.pokemonGrowthRateText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonGrowthRateText);

    this.pokemonGenderText = addTextObject(this.scene, 96, 112, "", TextStyle.SUMMARY_ALT);
    this.pokemonGenderText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonGenderText);

    this.pokemonUncaughtText = addTextObject(this.scene, 6, 127, i18next.t("pokedexUiHandler:uncaught"), TextStyle.SUMMARY_ALT, { fontSize: "56px" });
    this.pokemonUncaughtText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonUncaughtText);

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

    // The font size should be set per language
    const instructionTextSize = textSettings.instructionTextSize;

    this.instructionsContainer = this.scene.add.container(4, 128);
    this.instructionsContainer.setVisible(true);
    this.starterSelectContainer.add(this.instructionsContainer);

    this.candyUpgradeIconElement = new Phaser.GameObjects.Sprite(this.scene, this.instructionRowX, this.instructionRowY, "keyboard", "C.png");
    this.candyUpgradeIconElement.setName("sprite-candyUpgrade-icon-element");
    this.candyUpgradeIconElement.setScale(0.675);
    this.candyUpgradeIconElement.setOrigin(0.0, 0.0);
    this.candyUpgradeLabel = addTextObject(this.scene, this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY, i18next.t("pokedexUiHandler:candyUpgrade"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.candyUpgradeLabel.setName("text-candyUpgrade-label");

    // instruction rows that will be pushed into the container dynamically based on need
    // creating new sprites since they will be added to the scene later
    this.shinyIconElement = new Phaser.GameObjects.Sprite(this.scene, this.instructionRowX, this.instructionRowY, "keyboard", "R.png");
    this.shinyIconElement.setName("sprite-shiny-icon-element");
    this.shinyIconElement.setScale(0.675);
    this.shinyIconElement.setOrigin(0.0, 0.0);
    this.shinyLabel = addTextObject(this.scene, this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY, i18next.t("pokedexUiHandler:cycleShiny"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.shinyLabel.setName("text-shiny-label");

    this.formIconElement = new Phaser.GameObjects.Sprite(this.scene, this.instructionRowX, this.instructionRowY, "keyboard", "F.png");
    this.formIconElement.setName("sprite-form-icon-element");
    this.formIconElement.setScale(0.675);
    this.formIconElement.setOrigin(0.0, 0.0);
    this.formLabel = addTextObject(this.scene, this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY, i18next.t("pokedexUiHandler:cycleForm"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.formLabel.setName("text-form-label");

    this.genderIconElement = new Phaser.GameObjects.Sprite(this.scene, this.instructionRowX, this.instructionRowY, "keyboard", "G.png");
    this.genderIconElement.setName("sprite-gender-icon-element");
    this.genderIconElement.setScale(0.675);
    this.genderIconElement.setOrigin(0.0, 0.0);
    this.genderLabel = addTextObject(this.scene, this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY, i18next.t("pokedexUiHandler:cycleGender"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.genderLabel.setName("text-gender-label");

    this.variantIconElement = new Phaser.GameObjects.Sprite(this.scene, this.instructionRowX, this.instructionRowY, "keyboard", "V.png");
    this.variantIconElement.setName("sprite-variant-icon-element");
    this.variantIconElement.setScale(0.675);
    this.variantIconElement.setOrigin(0.0, 0.0);
    this.variantLabel = addTextObject(this.scene, this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY, i18next.t("pokedexUiHandler:cycleVariant"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.variantLabel.setName("text-variant-label");

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
    this.menuBg.setOrigin(0, 0);

    this.optionSelectText.setPositionRelative(this.menuBg, 10 + 24 * this.scale, 6);

    this.menuContainer.add(this.menuBg);

    this.menuContainer.add(this.optionSelectText);

    ui.add(this.menuContainer);

    this.starterSelectContainer.add(this.menuContainer);


    // adding base stats
    this.baseStatsOverlay = new BaseStatsOverlay(this.scene, { x: 317, y: 0, width:133 });
    this.menuContainer.add(this.baseStatsOverlay);
    this.menuContainer.bringToTop(this.baseStatsOverlay);

    // add the info overlay last to be the top most ui element and prevent the IVs from overlaying this
    const overlayScale = 1;
    this.moveInfoOverlay = new MoveInfoOverlay(this.scene, {
      scale: overlayScale,
      top: true,
      x: 1,
      y: this.scene.game.canvas.height / 6 - MoveInfoOverlay.getHeight(overlayScale) - 29,
    });
    this.starterSelectContainer.add(this.moveInfoOverlay);

    this.infoOverlay = new PokedexInfoOverlay(this.scene, {
      scale: overlayScale,
      x: 1,
      y: this.scene.game.canvas.height / 6 - PokedexInfoOverlay.getHeight(overlayScale) - 29,
    });
    this.starterSelectContainer.add(this.infoOverlay);

    // Filter bar sits above everything, except the tutorial overlay and message box
    this.initTutorialOverlay(this.starterSelectContainer);
    this.starterSelectContainer.bringToTop(this.starterSelectMessageBoxContainer);

    this.updateInstructions();
  }

  show(args: any[]): boolean {


    if (args.length >= 1 && args[0] === "refresh") {
      return false;
    } else {
      this.lastSpecies = args[0];
      this.lastFormIndex = args[1] ?? 0;
      this.starterAttributes = args[2] ?? { shiny:false, female:true, variant:0, form:0 };
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

    this.setCursor(0);

    this.setSpecies(this.lastSpecies);
    this.updateInstructions();

    return true;

  }

  starterSetup(): void {

    this.evolutions = [];
    this.prevolutions = [];
    this.battleForms = [];

    const species = this.lastSpecies;
    const formIndex = this.lastFormIndex ?? 0;

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
    this.hasEggMoves = Array.from({ length: 4 }, (_, em) => (this.scene.gameData.starterData[this.getStarterSpeciesId(species.speciesId)].eggMoves & (1 << em)) !== 0);

    this.tmMoves = (speciesTmMoves[species.speciesId] ?? []).sort((a, b) => allMoves[a].name > allMoves[b].name ? 1 : -1);

    this.passive = starterPassiveAbilities[this.getStarterSpeciesId(species.speciesId)];

    const starterData = this.scene.gameData.starterData[this.getStarterSpeciesId(species.speciesId)];
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

    this.battleForms = species.forms.filter(f => !f.isStarterSelectable);

    const preSpecies = pokemonPrevolutions.hasOwnProperty(this.lastSpecies.speciesId) ? allSpecies.find(sp => sp.speciesId === pokemonPrevolutions[this.lastSpecies.speciesId]) : null;
    if (preSpecies) {
      const preEvolutions = pokemonEvolutions.hasOwnProperty(preSpecies.speciesId) ? pokemonEvolutions[preSpecies.speciesId] : [];
      console.log(preEvolutions);
      this.prevolutions = preEvolutions.filter(
        e => e.speciesId === species.speciesId && ((e.evoFormKey === "" || e.evoFormKey === null) || e.evoFormKey === species.forms[formIndex]?.formKey));
      console.log(this.prevolutions);
    }

    if (this.battleForms.find(bf => bf.formIndex === this.lastFormIndex)) {
      const indexToRemove = this.battleForms.findIndex(form => form.formIndex === this.lastFormIndex);
      if (indexToRemove !== -1) {
        this.battleForms.splice(indexToRemove, 1);
      }
      this.battleForms.unshift(this.lastSpecies.forms[0]);
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
        return this.lastFormIndex === formIndex;
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
        return this.lastFormIndex === formIndex;
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
        return this.lastFormIndex === formIndex;
      });
    }

    return biomes;
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
    const starterAttributes = this.starterAttributes;
    const dexEntry = this.scene.gameData.dexData[this.lastSpecies.speciesId];
    const starterData = this.scene.gameData.starterData[this.getStarterSpeciesId(this.lastSpecies.speciesId)];

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
      const speciesHasSingleAbility = this.lastSpecies.ability2 === this.lastSpecies.ability1;
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
    if (selectedForm !== undefined && (this.lastSpecies.forms[selectedForm]?.isStarterSelectable && !(caughtAttr & this.scene.gameData.getFormAttr(selectedForm)))) {
      // requested form wasn't unlocked and is selectable as a starter
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

  getStarterSpeciesId(speciesId): number {
    if (this.scene.gameData.starterData.hasOwnProperty(speciesId)) {
      return speciesId;
    } else {
      return pokemonStarters[speciesId];
    }
  }

  getStarterSpecies(species): PokemonSpecies {
    if (this.scene.gameData.starterData.hasOwnProperty(species.speciesId)) {
      return species;
    } else {
      return allSpecies.find(sp => sp.speciesId === pokemonStarters[species.speciesId]) ?? species;
    }
  }

  /**
   * Determines if a passive upgrade is available for the given species ID
   * @param speciesId The ID of the species to check the passive of
   * @returns true if the user has enough candies and a passive has not been unlocked already
   */
  isPassiveAvailable(speciesId: number): boolean {
    // Get this species ID's starter data
    const starterData = this.scene.gameData.starterData[this.getStarterSpeciesId(speciesId)];

    return starterData.candyCount >= getPassiveCandyCount(speciesStarterCosts[this.getStarterSpeciesId(speciesId)])
      && !(starterData.passiveAttr & PassiveAttr.UNLOCKED);
  }

  /**
   * Determines if a value reduction upgrade is available for the given species ID
   * @param speciesId The ID of the species to check the value reduction of
   * @returns true if the user has enough candies and all value reductions have not been unlocked already
   */
  isValueReductionAvailable(speciesId: number): boolean {
    // Get this species ID's starter data
    const starterData = this.scene.gameData.starterData[this.getStarterSpeciesId(speciesId)];

    return starterData.candyCount >= getValueReductionCandyCounts(speciesStarterCosts[this.getStarterSpeciesId(speciesId)])[starterData.valueReduction]
        && starterData.valueReduction < valueReductionMax;
  }

  /**
   * Determines if an same species egg can be bought for the given species ID
   * @param speciesId The ID of the species to check the value reduction of
   * @returns true if the user has enough candies
   */
  isSameSpeciesEggAvailable(speciesId: number): boolean {
    // Get this species ID's starter data
    const starterData = this.scene.gameData.starterData[this.getStarterSpeciesId(speciesId)];

    return starterData.candyCount >= getSameSpeciesEggCandyCounts(speciesStarterCosts[this.getStarterSpeciesId(speciesId)]);
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

      let starterContainer;
      const starterData = this.scene.gameData.starterData[this.getStarterSpeciesId(this.lastSpecies.speciesId)];
      // prepare persistent starter data to store changes
      const starterAttributes = this.starterAttributes;

      if (button === Button.ACTION) {

        switch (this.cursor) {

          case MenuOptions.BASE_STATS:

            this.blockInput = true;

            ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => {
              ui.showText(i18next.t("pokedexUiHandler:baseStats"), null, () => {

                this.baseStatsOverlay.show(this.baseStats, this.baseTotal);

                this.blockInput = false;
                this.blockInputOverlay = true;

                return true;
              });
            });
            break;

          case MenuOptions.LEVEL_MOVES:

            this.blockInput = true;

            ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => {
              ui.showText(i18next.t("pokedexUiHandler:movesLearntOnLevelUp"), null, () => {

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

                ui.setModeWithoutClear(Mode.OPTION_SELECT, {
                  options: [
                    {
                      label: "Common:",
                      skip: true,
                      color: "#ccbe00",
                      handler: () => false, // Non-selectable, but handler is required
                      onHover: () => this.moveInfoOverlay.clear() // No hover behavior for titles
                    },
                    ...this.eggMoves.slice(0, 3).map((m, i) => ({
                      label: allMoves[m].name,
                      color: this.hasEggMoves[i] ? "#ffffff" : "#6b5a73",
                      handler: () => false,
                      onHover: () => this.moveInfoOverlay.show(allMoves[m])
                    })),
                    {
                      label: "Rare:",
                      skip: true,
                      color: "#ccbe00",
                      handler: () => false,
                      onHover: () => this.moveInfoOverlay.clear()
                    },
                    {
                      label: allMoves[this.eggMoves[3]].name,
                      color: this.hasEggMoves[3] ? "#ffffff" : "#6b5a73",
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

          case MenuOptions.ABILITIES:

            this.blockInput = true;

            ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => {

              ui.showText(i18next.t("pokedexUiHandler:showAbilities"), null, () => {

                this.infoOverlay.show(allAbilities[this.ability1].description);

                const options: any[] = [];

                if (this.ability1) {
                  options.push({
                    label: allAbilities[this.ability1].name,
                    color: this.hasAbilities[0] > 0 ? "#ffffff" : "#6b5a73",
                    handler: () => false,
                    onHover: () => this.infoOverlay.show(allAbilities[this.ability1].description)
                  });
                }
                if (this.ability2) {
                  const ability = allAbilities[this.ability2];
                  options.push({
                    label: ability?.name,
                    color: this.hasAbilities[1] > 0 ? "#ffffff" : "#6b5a73",
                    handler: () => false,
                    onHover: () => this.infoOverlay.show(ability?.description)
                  });
                }

                if (this.abilityHidden) {
                  options.push({
                    label: "Hidden:",
                    skip: true,
                    color: "#ccbe00",
                    handler: () => false,
                    onHover: () => this.infoOverlay.clear()
                  });
                  const ability = allAbilities[this.abilityHidden];
                  options.push({
                    label: allAbilities[this.abilityHidden].name,
                    color: this.hasAbilities[2] > 0 ? "#ffffff" : "#6b5a73",
                    handler: () => false,
                    onHover: () => this.infoOverlay.show(ability?.description)
                  });
                }

                if (this.passive) {
                  options.push({
                    label: "Passive:",
                    skip: true,
                    color: "#ccbe00",
                    handler: () => false,
                    onHover: () => this.infoOverlay.clear()
                  });
                  options.push({
                    label: allAbilities[this.passive].name,
                    color: this.hasPassive ? "#ffffff" : "#6b5a73",
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
            break;

          case MenuOptions.BIOMES:

            this.blockInput = true;

            ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => {

              const options: any[] = [];

              ui.showText(i18next.t("pokedexUiHandler:biomes"), null, () => {

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
            break;

          case MenuOptions.EVOLUTIONS:

            this.blockInput = true;

            ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => {

              const options: any[] = [];

              ui.showText(i18next.t("pokedexUiHandler:evolutionsAndForms"), null, () => {

                if (!this.prevolutions && !this.evolutions && !this.battleForms) {
                  this.blockInput = false;
                  return true;
                }

                if (this.prevolutions?.length > 0) {
                  options.push({
                    label: i18next.t("pokedexUiHandler:prevolutions"),
                    skip: true,
                    handler: () => false
                  });
                  this.prevolutions.map(pre => {
                    const preSpecies = allSpecies.find(species => species.speciesId === pokemonPrevolutions[this.lastSpecies.speciesId]);
                    options.push({
                      label: pre.preFormKey ?
                        this.getFormString(pre.preFormKey, preSpecies ?? this.lastSpecies, true) :
                        this.getRegionName(preSpecies ?? this.lastSpecies),
                      color: "#ccbe00",
                      handler: () => {
                        const newSpecies = allSpecies.find(species => species.speciesId === pokemonPrevolutions[pre.speciesId]);
                        // Attempts to find the formIndex of the evolved species
                        const newFormKey = pre.evoFormKey ? pre.evoFormKey : (this.lastSpecies.forms.length > 0 ? this.lastSpecies.forms[this.lastFormIndex].formKey : "");
                        const matchingForm = newSpecies?.forms.find(form => form.formKey === newFormKey);
                        const newFormIndex = matchingForm ? matchingForm.formIndex : 0;
                        this.starterAttributes.form = newFormIndex;
                        this.moveInfoOverlay.clear();
                        this.clearText();
                        ui.setMode(Mode.POKEDEX_PAGE, newSpecies, newFormIndex, this.starterAttributes);
                        return true;
                      }
                    });

                    let label:string = "";
                    if (pre.level > 1) {
                      label = `${pre.level}`;
                    } else if (pre.item) {
                      label = i18next.t(`modifierType:EvolutionItem.${EvolutionItem[pre.item].toUpperCase()}`) +
                        " (" + (pre.item > 50 ? "Ultra" : "Great") + ")";
                    } else {
                      label = "";
                    }
                    options.push({
                      label: label,
                      skip: true,
                      handler: () => false
                    });
                  });
                }

                if (this.evolutions.length > 0) {
                  options.push({
                    label: i18next.t("pokedexUiHandler:evolutions"),
                    skip: true,
                    handler: () => false
                  });
                  this.evolutions.map(evo => {
                    const evoSpecies = allSpecies.find(species => species.speciesId === evo.speciesId);
                    options.push({
                      label: evo.evoFormKey ?
                        this.getFormString(evo.evoFormKey, evoSpecies ?? this.lastSpecies, true) :
                        this.getRegionName(evoSpecies ?? this.lastSpecies),
                      color: "#ccbe00",
                      handler: () => {
                        const newSpecies = allSpecies.find(species => species.speciesId === evo.speciesId);
                        // Attempts to find the formIndex of the evolved species
                        const newFormKey = evo.evoFormKey ? evo.evoFormKey : (this.lastSpecies.forms.length > 0 ? this.lastSpecies.forms[this.lastFormIndex].formKey : "");
                        const matchingForm = newSpecies?.forms.find(form => form.formKey === newFormKey);
                        const newFormIndex = matchingForm ? matchingForm.formIndex : 0;
                        this.starterAttributes.form = newFormIndex;
                        this.moveInfoOverlay.clear();
                        this.clearText();
                        ui.setMode(Mode.POKEDEX_PAGE, newSpecies, newFormIndex, this.starterAttributes);
                        return true;
                      }
                    });
                    let label:string = "";
                    if (evo.level > 1) {
                      label = `${evo.level}`;
                    } else if (evo.item) {
                      label = i18next.t(`modifierType:EvolutionItem.${EvolutionItem[evo.item].toUpperCase()}`) +
                        " (" + (evo.item > 50 ? "Ultra" : "Great") + ")";
                    } else {
                      label = "";
                    }
                    options.push({
                      label: label,
                      skip: true,
                      handler: () => false
                    });
                  });
                }

                if (this.battleForms.length > 0) {
                  options.push({
                    label: i18next.t("pokedexUiHandler:forms"),
                    skip: true,
                    handler: () => false
                  });
                  this.battleForms.map(bf => {
                    let label: string = this.getFormString(bf.formKey, this.lastSpecies);
                    if (!label && bf.formIndex === 0) {
                      label = i18next.t(`pokemon:${Species[bf.speciesId].toUpperCase()}`);
                    }
                    options.push({
                      label: label,
                      color: "#ccbe00",
                      handler: () => {
                        const newSpecies = this.lastSpecies;
                        const newFormIndex = bf.formIndex;
                        this.starterAttributes.form = newFormIndex;
                        this.moveInfoOverlay.clear();
                        this.clearText();
                        ui.setMode(Mode.POKEDEX_PAGE, newSpecies, newFormIndex, this.starterAttributes);
                        return true;
                      }
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
            break;

          case MenuOptions.TOGGLE_IVS:
            this.toggleStatsMode();
            ui.setMode(Mode.POKEDEX_PAGE, "refresh");
            return true;

          case MenuOptions.NATURES:
            this.blockInput = true;
            ui.setMode(Mode.POKEDEX_PAGE, "refresh").then(() => {
              ui.showText(i18next.t("pokedexUiHandler:showNature"), null, () => {
                const natures = this.scene.gameData.getNaturesForAttr(this.speciesStarterDexEntry?.natureAttr);
                ui.setModeWithoutClear(Mode.OPTION_SELECT, {
                  options: natures.map((n: Nature, i: number) => {
                    const option: OptionSelectItem = {
                      label: getNatureName(n, true, true, true, this.scene.uiTheme),
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

          default:
            return true;
        }

        return true;

      } else {
        const props = this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, this.getCurrentDexProps(this.lastSpecies.speciesId));
        switch (button) {
          case Button.CYCLE_SHINY:
            if (this.canCycleShiny) {
              starterAttributes.shiny = starterAttributes.shiny !== undefined ? !starterAttributes.shiny : false;

              if (starterAttributes.shiny) {
              // Change to shiny, we need to get the proper default variant
                const newVariant = starterAttributes.variant ? starterAttributes.variant as Variant : 0;
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
              let newFormIndex = this.lastFormIndex;
              do {
                newFormIndex = (newFormIndex + 1) % formCount;
                if (this.speciesStarterDexEntry!.caughtAttr! & this.scene.gameData.getFormAttr(newFormIndex)) { // TODO: are those bangs correct?
                  break;
                }
              } while (newFormIndex !== props.formIndex);
              // TODO: Is this still needed?
              starterAttributes.form = newFormIndex; // store the selected form
              this.lastFormIndex = newFormIndex;
              this.starterSetup();
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
          case Button.STATS:
            if (!this.speciesStarterDexEntry?.caughtAttr) {
              error = true;
            } else if (this.starterSpecies.length <= 6) { // checks to see if the party has 6 or fewer pokemon
              const ui = this.getUi();
              const options: any[] = []; // TODO: add proper type

              const passiveAttr = starterData.passiveAttr;
              const candyCount = starterData.candyCount;

              if (!pokemonPrevolutions.hasOwnProperty(this.lastSpecies.speciesId)) {
                if (!(passiveAttr & PassiveAttr.UNLOCKED)) {
                  const passiveCost = getPassiveCandyCount(speciesStarterCosts[this.getStarterSpeciesId(this.lastSpecies.speciesId)]);
                  options.push({
                    label: `x${passiveCost} ${i18next.t("pokedexUiHandler:unlockPassive")} (${allAbilities[starterPassiveAbilities[this.getStarterSpeciesId(this.lastSpecies.speciesId)]].name})`,
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
                          starterContainer.starterPassiveBgs.setVisible(!!this.scene.gameData.starterData[this.getStarterSpeciesId(this.lastSpecies.speciesId)].passiveAttr);
                        }
                        return true;
                      }
                      return false;
                    },
                    item: "candy",
                    itemArgs: starterColors[this.getStarterSpeciesId(this.lastSpecies.speciesId)]
                  });
                }

                // Reduce cost option
                const valueReduction = starterData.valueReduction;
                if (valueReduction < valueReductionMax) {
                  const reductionCost = getValueReductionCandyCounts(speciesStarterCosts[this.getStarterSpeciesId(this.lastSpecies.speciesId)])[valueReduction];
                  options.push({
                    label: `x${reductionCost} ${i18next.t("pokedexUiHandler:reduceCost")}`,
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
                    itemArgs: starterColors[this.getStarterSpeciesId(this.lastSpecies.speciesId)]
                  });
                }

                // Same species egg menu option.
                const sameSpeciesEggCost = getSameSpeciesEggCandyCounts(speciesStarterCosts[this.getStarterSpeciesId(this.lastSpecies.speciesId)]);
                options.push({
                  label: `x${sameSpeciesEggCost} ${i18next.t("pokedexUiHandler:sameSpeciesEgg")}`,
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
                  itemArgs: starterColors[this.getStarterSpeciesId(this.lastSpecies.speciesId)]
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
              }
              ui.setModeWithoutClear(Mode.OPTION_SELECT, {
                options: options,
                yOffset: 47
              });
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
    iconElement.setPosition(this.instructionRowX, this.instructionRowY + 8);
    controlLabel.setPosition(this.instructionRowX + this.instructionRowTextOffset, this.instructionRowY + 8);
    iconElement.setVisible(true);
    controlLabel.setVisible(true);
    this.instructionsContainer.add([ iconElement, controlLabel ]);
    this.instructionRowY += 8;
    if (this.instructionRowY >= 16) {
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

    this.candyUpgradeIconElement.setVisible(true);
    this.candyUpgradeLabel.setVisible(true);
    this.instructionsContainer.add(this.candyUpgradeIconElement);
    this.instructionsContainer.add(this.candyUpgradeLabel);

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
      if (this.canCycleVariant) {
        this.updateButtonIcon(SettingKeyboard.Button_Cycle_Variant, gamepadType, this.variantIconElement, this.variantLabel);
      }
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
    let currentFriendship = this.scene.gameData.starterData[this.getStarterSpeciesId(speciesId)].friendship;
    if (!currentFriendship || currentFriendship === undefined) {
      currentFriendship = 0;
    }

    const friendshipCap = getStarterValueFriendshipCap(speciesStarterCosts[this.getStarterSpeciesId(speciesId)]);

    return { currentFriendship, friendshipCap };
  }

  setSpecies(species: PokemonSpecies | null) {
    this.speciesStarterDexEntry = species ? this.scene.gameData.dexData[species.speciesId] : null;

    if (!species && this.scene.ui.getTooltip().visible) {
      this.scene.ui.hideTooltip();
    }

    const starterAttributes : StarterAttributes | null = species ? { ...this.starterAttributes } : null;

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
          this.pokemonCandyCountText.setText(`x${this.scene.gameData.starterData[this.getStarterSpeciesId(species.speciesId)].candyCount}`);
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

        const starterIndex = this.starterSpecies.indexOf(species);

        let props: StarterAttributes;

        if (starterIndex > -1) {
          props = this.starterAttributes;
          this.setSpeciesDetails(species, {
            shiny: props.shiny,
            formIndex: props.form,
            female: props.female,
            variant: props.variant ?? 0,
          });
        } else {
          const defaultDexAttr = this.getCurrentDexProps(species.speciesId);
          // load default nature from stater save data, if set
          props = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);
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
        }

        const speciesForm = getPokemonSpeciesForm(species.speciesId, props.form ?? 0);
        this.setTypeIcons(speciesForm.type1, speciesForm.type2);

        this.pokemonSprite.clearTint();
      } else {
        this.pokemonGrowthRateText.setText("");
        this.pokemonGrowthRateLabelText.setVisible(false);
        this.type1Icon.setVisible(false);
        this.type2Icon.setVisible(false);
        this.pokemonLuckLabelText.setVisible(false);
        this.pokemonLuckText.setVisible(false);
        this.pokemonShinyIcon.setVisible(false);
        this.pokemonUncaughtText.setVisible(true);
        this.pokemonCaughtHatchedContainer.setVisible(false);
        this.pokemonCandyContainer.setVisible(false);
        this.pokemonFormText.setVisible(false);

        const defaultDexAttr = this.scene.gameData.getSpeciesDefaultDexAttr(species, true, true);
        const props = this.scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);

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
      this.pokemonCaughtHatchedContainer.setVisible(false);
      this.pokemonCandyContainer.setVisible(false);
      this.pokemonFormText.setVisible(false);

      this.setSpeciesDetails(species!, { // TODO: is this bang correct?
        shiny: false,
        formIndex: 0,
        female: false,
        variant: 0,
      });
      this.pokemonSprite.clearTint();
    }
  }

  setSpeciesDetails(species: PokemonSpecies, options: SpeciesDetails = {}): void {
    let { shiny, formIndex, female, variant } = options;
    const forSeen: boolean = options.forSeen ?? false;
    const oldProps = species ? this.starterAttributes : null;

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
      const dexEntry = this.scene.gameData.dexData[species.speciesId];

      const caughtAttr = this.scene.gameData.dexData[species.speciesId]?.caughtAttr || BigInt(0);

      if (!dexEntry.caughtAttr) {
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

      this.shinyOverlay.setVisible(shiny ?? false); // TODO: is false the correct default?
      this.pokemonNumberText.setColor(this.getTextColor(shiny ? TextStyle.SUMMARY_GOLD : TextStyle.SUMMARY, false));
      this.pokemonNumberText.setShadowColor(this.getTextColor(shiny ? TextStyle.SUMMARY_GOLD : TextStyle.SUMMARY, true));

      if (forSeen ? this.speciesStarterDexEntry?.seenAttr : this.speciesStarterDexEntry?.caughtAttr) {

        const assetLoadCancelled = new BooleanHolder(false);
        this.assetLoadCancelled = assetLoadCancelled;

        if (shouldUpdateSprite) {
          species.loadAssets(this.scene, female!, formIndex, shiny, variant as Variant, true).then(() => { // TODO: is this bang correct?
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

        this.canCycleForm = species.forms.filter(f => f.isStarterSelectable || !pokemonFormChanges[species.speciesId]?.find(fc => fc.formKey))
          .map((_, f) => dexEntry.caughtAttr & this.scene.gameData.getFormAttr(f)).filter(f => f).length > 1;

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
   * Creates a temporary dex attr props that will be used to check whether a pokemon is valid for a challenge
   * and to display the correct shiny, variant, and form based on this.starterAttributes
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
