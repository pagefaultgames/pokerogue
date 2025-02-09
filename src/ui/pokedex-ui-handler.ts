import type { Variant } from "#app/data/variant";
import { getVariantTint, getVariantIcon } from "#app/data/variant";
import { argbFromRgba } from "@material/material-color-utilities";
import i18next from "i18next";
import { starterColors } from "#app/battle-scene";
import { speciesEggMoves } from "#app/data/balance/egg-moves";
import { pokemonFormLevelMoves, pokemonSpeciesLevelMoves } from "#app/data/balance/pokemon-level-moves";
import type { PokemonForm } from "#app/data/pokemon-species";
import type PokemonSpecies from "#app/data/pokemon-species";
import { allSpecies, getPokemonSpeciesForm, getPokerusStarters } from "#app/data/pokemon-species";
import { getStarterValueFriendshipCap, speciesStarterCosts, POKERUS_STARTER_COUNT } from "#app/data/balance/starters";
import { catchableSpecies } from "#app/data/balance/biomes";
import { Type } from "#enums/type";
import type { DexAttrProps, DexEntry, StarterMoveset, StarterAttributes, StarterPreferences } from "#app/system/game-data";
import { AbilityAttr, DexAttr, StarterPrefs } from "#app/system/game-data";
import MessageUiHandler from "#app/ui/message-ui-handler";
import PokemonIconAnimHandler, { PokemonIconAnimMode } from "#app/ui/pokemon-icon-anim-handler";
import { TextStyle, addTextObject } from "#app/ui/text";
import { Mode } from "#app/ui/ui";
import { SettingKeyboard } from "#app/system/settings/settings-keyboard";
import { Passive as PassiveAttr } from "#enums/passive";
import type { Moves } from "#enums/moves";
import type { Species } from "#enums/species";
import { Button } from "#enums/buttons";
import { DropDown, DropDownLabel, DropDownOption, DropDownState, DropDownType, SortCriteria } from "#app/ui/dropdown";
import { PokedexMonContainer } from "#app/ui/pokedex-mon-container";
import { DropDownColumn, FilterBar } from "#app/ui/filter-bar";
import { ScrollBar } from "#app/ui/scroll-bar";
import { Abilities } from "#enums/abilities";
import { getPassiveCandyCount, getValueReductionCandyCounts, getSameSpeciesEggCandyCounts } from "#app/data/balance/starters";
import { BooleanHolder, fixedInt, getLocalizedSpriteKey, padInt, randIntRange, rgbHexToRgba } from "#app/utils";
import type { Nature } from "#enums/nature";
import { addWindow } from "./ui-theme";
import type { OptionSelectConfig } from "./abstact-option-select-ui-handler";
import { FilterText, FilterTextRow } from "./filter-text";
import { allAbilities } from "#app/data/ability";
import type { PassiveAbilities } from "#app/data/balance/passives";
import { starterPassiveAbilities } from "#app/data/balance/passives";
import { allMoves } from "#app/data/move";
import { speciesTmMoves } from "#app/data/balance/tms";
import { pokemonStarters } from "#app/data/balance/pokemon-evolutions";
import { Biome } from "#enums/biome";
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


enum FilterTextOptions{
  NAME,
  MOVE_1,
  MOVE_2,
  ABILITY_1,
  ABILITY_2,
}


const valueReductionMax = 2;

// Position of UI elements
const filterBarHeight = 17;
const speciesContainerX = 143;

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

  return { x: x, y: y };
}

interface SpeciesDetails {
  shiny?: boolean,
  formIndex?: number
  female?: boolean,
  variant?: Variant,
  abilityIndex?: number,
  natureIndex?: number,
  forSeen?: boolean, // default = false
}

export default class PokedexUiHandler extends MessageUiHandler {
  private starterSelectContainer: Phaser.GameObjects.Container;
  private starterSelectScrollBar: ScrollBar;
  private filterBarContainer: Phaser.GameObjects.Container;
  private filterBar: FilterBar;
  private pokemonContainers: PokedexMonContainer[] = [];
  private filteredPokemonContainers: PokedexMonContainer[] = [];
  private validPokemonContainers: PokedexMonContainer[] = [];
  private pokemonNumberText: Phaser.GameObjects.Text;
  private pokemonSprite: Phaser.GameObjects.Sprite;
  private pokemonNameText: Phaser.GameObjects.Text;
  private type1Icon: Phaser.GameObjects.Sprite;
  private type2Icon: Phaser.GameObjects.Sprite;

  private starterSelectMessageBox: Phaser.GameObjects.NineSlice;
  private starterSelectMessageBoxContainer: Phaser.GameObjects.Container;

  private filterMode: boolean;
  private filterBarCursor: number = 0;
  private starterMoveset: StarterMoveset | null;
  private scrollCursor: number;

  private allSpecies: PokemonSpecies[] = [];
  private lastSpecies: PokemonSpecies;
  private speciesLoaded: Map<Species, boolean> = new Map<Species, boolean>();
  private pokerusSpecies: PokemonSpecies[] = [];
  private speciesStarterDexEntry: DexEntry | null;
  private speciesStarterMoves: Moves[];

  private assetLoadCancelled: BooleanHolder | null;
  public cursorObj: Phaser.GameObjects.Image;
  private pokerusCursorObjs: Phaser.GameObjects.Image[];

  private iconAnimHandler: PokemonIconAnimHandler;

  private starterPreferences: StarterPreferences;

  protected blockInput: boolean = false;

  // for text filters
  private readonly textPadding = 8;
  private readonly defaultMessageBoxWidth = 220;
  private readonly defaultWordWrapWidth = 1224;
  private menuMessageBoxContainer: Phaser.GameObjects.Container;
  private menuMessageBox: Phaser.GameObjects.NineSlice;
  private dialogueMessageBox: Phaser.GameObjects.NineSlice;
  protected manageDataConfig: OptionSelectConfig;
  private filterTextOptions: FilterTextOptions[];
  protected optionSelectText: Phaser.GameObjects.Text;
  protected scale: number = 0.1666666667;
  private menuBg: Phaser.GameObjects.NineSlice;

  private filterTextContainer: Phaser.GameObjects.Container;
  private filterText: FilterText;
  private filterTextMode: boolean;
  private filterTextCursor: number = 0;

  private showDecorations: boolean = false;
  private goFilterIconElement1: Phaser.GameObjects.Sprite;
  private goFilterIconElement2: Phaser.GameObjects.Sprite;
  private goFilterLabel: Phaser.GameObjects.Text;
  private toggleDecorationsIconElement: Phaser.GameObjects.Sprite;
  private toggleDecorationsLabel: Phaser.GameObjects.Text;

  constructor() {
    super(Mode.POKEDEX);
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

    const pokemonContainerWindow = addWindow(speciesContainerX, filterBarHeight + 1, 175, 161);
    const pokemonContainerBg = globalScene.add.image(speciesContainerX + 1, filterBarHeight + 2, "starter_container_bg");
    pokemonContainerBg.setOrigin(0, 0);
    this.starterSelectContainer.add(pokemonContainerBg);
    this.starterSelectContainer.add(pokemonContainerWindow);


    // Create and initialise filter text fields
    this.filterTextContainer = globalScene.add.container(0, 0);
    this.filterText = new FilterText(1, filterBarHeight + 2, 140, 100, this.updateStarters);

    this.filterText.addFilter(FilterTextRow.NAME, i18next.t("filterText:nameField"));
    this.filterText.addFilter(FilterTextRow.MOVE_1, i18next.t("filterText:move1Field"));
    this.filterText.addFilter(FilterTextRow.MOVE_2, i18next.t("filterText:move2Field"));
    this.filterText.addFilter(FilterTextRow.ABILITY_1, i18next.t("filterText:ability1Field"));
    this.filterText.addFilter(FilterTextRow.ABILITY_2, i18next.t("filterText:ability2Field"));

    this.filterTextContainer.add(this.filterText);
    this.starterSelectContainer.add(this.filterTextContainer);


    // Create and initialise filter bar
    this.filterBarContainer = globalScene.add.container(0, 0);
    this.filterBar = new FilterBar(speciesContainerX, 1, 175, filterBarHeight, 2, 0, 6);

    // gen filter
    const genOptions: DropDownOption[] = [
      new DropDownOption(1, new DropDownLabel(i18next.t("pokedexUiHandler:gen1"))),
      new DropDownOption(2, new DropDownLabel(i18next.t("pokedexUiHandler:gen2"))),
      new DropDownOption(3, new DropDownLabel(i18next.t("pokedexUiHandler:gen3"))),
      new DropDownOption(4, new DropDownLabel(i18next.t("pokedexUiHandler:gen4"))),
      new DropDownOption(5, new DropDownLabel(i18next.t("pokedexUiHandler:gen5"))),
      new DropDownOption(6, new DropDownLabel(i18next.t("pokedexUiHandler:gen6"))),
      new DropDownOption(7, new DropDownLabel(i18next.t("pokedexUiHandler:gen7"))),
      new DropDownOption(8, new DropDownLabel(i18next.t("pokedexUiHandler:gen8"))),
      new DropDownOption(9, new DropDownLabel(i18next.t("pokedexUiHandler:gen9"))),
    ];
    const genDropDown: DropDown = new DropDown(0, 0, genOptions, this.updateStarters, DropDownType.HYBRID);
    this.filterBar.addFilter(DropDownColumn.GEN, i18next.t("filterBar:genFilter"), genDropDown);

    // type filter
    const typeKeys = Object.keys(Type).filter(v => isNaN(Number(v)));
    const typeOptions: DropDownOption[] = [];
    typeKeys.forEach((type, index) => {
      if (index === 0 || index === 19) {
        return;
      }
      const typeSprite = globalScene.add.sprite(0, 0, getLocalizedSpriteKey("types"));
      typeSprite.setScale(0.5);
      typeSprite.setFrame(type.toLowerCase());
      typeOptions.push(new DropDownOption( index, new DropDownLabel("", typeSprite)));
    });
    this.filterBar.addFilter(DropDownColumn.TYPES, i18next.t("filterBar:typeFilter"), new DropDown(0, 0, typeOptions, this.updateStarters, DropDownType.HYBRID, 0.5));

    // biome filter, making an entry in the dropdown for each biome
    const biomeOptions = Object.values(Biome)
      .filter((value) => typeof value === "number") // Filter numeric values from the enum
      .map((biomeValue, index) =>
        new DropDownOption( index, new DropDownLabel(i18next.t(`biome:${Biome[biomeValue].toUpperCase()}`)))
      );
    biomeOptions.push(new DropDownOption( biomeOptions.length, new DropDownLabel(i18next.t("filterBar:uncatchable"))));
    const biomeDropDown: DropDown = new DropDown(0, 0, biomeOptions, this.updateStarters, DropDownType.HYBRID);
    this.filterBar.addFilter(DropDownColumn.BIOME, i18next.t("filterBar:biomeFilter"), biomeDropDown);

    // caught filter
    const shiny1Sprite = globalScene.add.sprite(0, 0, "shiny_icons");
    shiny1Sprite.setOrigin(0.15, 0.2);
    shiny1Sprite.setScale(0.6);
    shiny1Sprite.setFrame(getVariantIcon(0));
    shiny1Sprite.setTint(getVariantTint(0));
    const shiny2Sprite = globalScene.add.sprite(0, 0, "shiny_icons");
    shiny2Sprite.setOrigin(0.15, 0.2);
    shiny2Sprite.setScale(0.6);
    shiny2Sprite.setFrame(getVariantIcon(1));
    shiny2Sprite.setTint(getVariantTint(1));
    const shiny3Sprite = globalScene.add.sprite(0, 0, "shiny_icons");
    shiny3Sprite.setOrigin(0.15, 0.2);
    shiny3Sprite.setScale(0.6);
    shiny3Sprite.setFrame(getVariantIcon(2));
    shiny3Sprite.setTint(getVariantTint(2));

    const caughtOptions = [
      new DropDownOption("SHINY3", new DropDownLabel("", shiny3Sprite)),
      new DropDownOption("SHINY2", new DropDownLabel("", shiny2Sprite)),
      new DropDownOption("SHINY", new DropDownLabel("", shiny1Sprite)),
      new DropDownOption("NORMAL", new DropDownLabel(i18next.t("filterBar:normal"))),
      new DropDownOption("UNCAUGHT", new DropDownLabel(i18next.t("filterBar:uncaught")))
    ];

    this.filterBar.addFilter(DropDownColumn.CAUGHT, i18next.t("filterBar:caughtFilter"), new DropDown(0, 0, caughtOptions, this.updateStarters, DropDownType.HYBRID));

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
      new DropDownOption("PASSIVE", passiveLabels),
      new DropDownOption("COST_REDUCTION", costReductionLabels),
    ];

    this.filterBar.addFilter(DropDownColumn.UNLOCKS, i18next.t("filterBar:unlocksFilter"), new DropDown(0, 0, unlocksOptions, this.updateStarters, DropDownType.RADIAL));

    // misc filter
    const starters = [
      new DropDownLabel(i18next.t("filterBar:starter"), undefined, DropDownState.OFF),
      new DropDownLabel(i18next.t("filterBar:isStarter"), undefined, DropDownState.ON),
      new DropDownLabel(i18next.t("filterBar:notStarter"), undefined, DropDownState.EXCLUDE),
    ];
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
      new DropDownOption("STARTER", starters),
      new DropDownOption("FAVORITE", favoriteLabels),
      new DropDownOption("WIN", winLabels),
      new DropDownOption("HIDDEN_ABILITY", hiddenAbilityLabels),
      new DropDownOption("EGG", eggLabels),
      new DropDownOption("POKERUS", pokerusLabels),
    ];
    this.filterBar.addFilter(DropDownColumn.MISC, i18next.t("filterBar:miscFilter"), new DropDown(0, 0, miscOptions, this.updateStarters, DropDownType.RADIAL));

    // sort filter
    const sortOptions = [
      new DropDownOption(SortCriteria.NUMBER, new DropDownLabel(i18next.t("filterBar:sortByNumber"), undefined, DropDownState.ON)),
      new DropDownOption(SortCriteria.COST, new DropDownLabel(i18next.t("filterBar:sortByCost"))),
      new DropDownOption(SortCriteria.CANDY, new DropDownLabel(i18next.t("filterBar:sortByCandies"))),
      new DropDownOption(SortCriteria.IV, new DropDownLabel(i18next.t("filterBar:sortByIVs"))),
      new DropDownOption(SortCriteria.NAME, new DropDownLabel(i18next.t("filterBar:sortByName"))),
      new DropDownOption(SortCriteria.CAUGHT, new DropDownLabel(i18next.t("filterBar:sortByNumCaught"))),
      new DropDownOption(SortCriteria.HATCHED, new DropDownLabel(i18next.t("filterBar:sortByNumHatched")))
    ];
    this.filterBar.addFilter(DropDownColumn.SORT, i18next.t("filterBar:sortFilter"), new DropDown(0, 0, sortOptions, this.updateStarters, DropDownType.SINGLE));
    this.filterBarContainer.add(this.filterBar);

    this.starterSelectContainer.add(this.filterBarContainer);

    // Offset the generation filter dropdown to avoid covering the filtered pokemon
    this.filterBar.offsetHybridFilters();

    if (!globalScene.uiTheme) {
      pokemonContainerWindow.setVisible(false);
    }

    this.iconAnimHandler = new PokemonIconAnimHandler();
    this.iconAnimHandler.setup();

    this.pokemonNumberText = addTextObject(6, 140, "", TextStyle.SUMMARY);
    this.pokemonNumberText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonNumberText);

    this.pokemonNameText = addTextObject(6, 127, "", TextStyle.SUMMARY);
    this.pokemonNameText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonNameText);

    const starterBoxContainer = globalScene.add.container(speciesContainerX + 6, 9); //115

    this.starterSelectScrollBar = new ScrollBar(161, 12, 5, pokemonContainerWindow.height - 6, 9);

    starterBoxContainer.add(this.starterSelectScrollBar);

    this.pokerusCursorObjs = new Array(POKERUS_STARTER_COUNT).fill(null).map(() => {
      const cursorObj = globalScene.add.image(0, 0, "select_cursor_pokerus");
      cursorObj.setVisible(false);
      cursorObj.setOrigin(0, 0);
      starterBoxContainer.add(cursorObj);
      return cursorObj;
    });

    this.cursorObj = globalScene.add.image(0, 0, "select_cursor");
    this.cursorObj.setOrigin(0, 0);

    starterBoxContainer.add(this.cursorObj);

    for (const species of allSpecies) {
      this.speciesLoaded.set(species.speciesId, false);
      this.allSpecies.push(species);

      const pokemonContainer = new PokedexMonContainer(species).setVisible(false);
      this.iconAnimHandler.addOrUpdate(pokemonContainer.icon, PokemonIconAnimMode.NONE);
      this.pokemonContainers.push(pokemonContainer);
      starterBoxContainer.add(pokemonContainer);
    }

    this.starterSelectContainer.add(starterBoxContainer);

    this.pokemonSprite = globalScene.add.sprite(96, 143, "pkmn__sub");
    this.pokemonSprite.setPipeline(globalScene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], ignoreTimeTint: true });
    this.starterSelectContainer.add(this.pokemonSprite);

    this.type1Icon = globalScene.add.sprite(10, 158, getLocalizedSpriteKey("types"));
    this.type1Icon.setScale(0.5);
    this.type1Icon.setOrigin(0, 0);
    this.starterSelectContainer.add(this.type1Icon);

    this.type2Icon = globalScene.add.sprite(10, 166, getLocalizedSpriteKey("types"));
    this.type2Icon.setScale(0.5);
    this.type2Icon.setOrigin(0, 0);
    this.starterSelectContainer.add(this.type2Icon);

    this.starterSelectMessageBoxContainer = globalScene.add.container(0, globalScene.game.canvas.height / 6);
    this.starterSelectMessageBoxContainer.setVisible(false);
    this.starterSelectContainer.add(this.starterSelectMessageBoxContainer);

    this.starterSelectMessageBox = addWindow(1, -1, 318, 28);
    this.starterSelectMessageBox.setOrigin(0, 1);
    this.starterSelectMessageBoxContainer.add(this.starterSelectMessageBox);

    // Instruction for "C" button to toggle showDecorations
    const instructionTextSize = textSettings.instructionTextSize;

    this.goFilterIconElement1 = new Phaser.GameObjects.Sprite(globalScene, 10, 2, "keyboard", "C.png");
    this.goFilterIconElement1.setName("sprite-goFilter1-icon-element");
    this.goFilterIconElement1.setScale(0.675);
    this.goFilterIconElement1.setOrigin(0.0, 0.0);
    this.goFilterIconElement2 = new Phaser.GameObjects.Sprite(globalScene, 20, 2, "keyboard", "V.png");
    this.goFilterIconElement2.setName("sprite-goFilter2-icon-element");
    this.goFilterIconElement2.setScale(0.675);
    this.goFilterIconElement2.setOrigin(0.0, 0.0);
    this.goFilterLabel = addTextObject(30, 2, i18next.t("pokedexUiHandler:goFilters"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.goFilterLabel.setName("text-goFilter-label");
    this.starterSelectContainer.add(this.goFilterIconElement1);
    this.starterSelectContainer.add(this.goFilterIconElement2);
    this.starterSelectContainer.add(this.goFilterLabel);

    this.toggleDecorationsIconElement = new Phaser.GameObjects.Sprite(globalScene, 10, 10, "keyboard", "R.png");
    this.toggleDecorationsIconElement.setName("sprite-toggleDecorations-icon-element");
    this.toggleDecorationsIconElement.setScale(0.675);
    this.toggleDecorationsIconElement.setOrigin(0.0, 0.0);
    this.toggleDecorationsLabel = addTextObject(20, 10, i18next.t("pokedexUiHandler:toggleDecorations"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.toggleDecorationsLabel.setName("text-toggleDecorations-label");
    this.starterSelectContainer.add(this.toggleDecorationsIconElement);
    this.starterSelectContainer.add(this.toggleDecorationsLabel);

    this.message = addTextObject(8, 8, "", TextStyle.WINDOW, { maxLines: 2 });
    this.message.setOrigin(0, 0);
    this.starterSelectMessageBoxContainer.add(this.message);

    // arrow icon for the message box
    this.initPromptSprite(this.starterSelectMessageBoxContainer);

    // Filter bar sits above everything, except the tutorial overlay and message box
    this.starterSelectContainer.bringToTop(this.filterBarContainer);
    this.initTutorialOverlay(this.starterSelectContainer);
    this.starterSelectContainer.bringToTop(this.starterSelectMessageBoxContainer);
  }

  show(args: any[]): boolean {

    if (!this.starterPreferences) {
      this.starterPreferences = StarterPrefs.load();
    }

    this.pokerusSpecies = getPokerusStarters();

    // When calling with "refresh", we do not reset the cursor and filters
    if (args.length >= 1 && args[0] === "refresh") {
      return false;
    }

    super.show(args);

    this.starterSelectContainer.setVisible(true);

    this.getUi().bringToTop(this.starterSelectContainer);

    // Making caught pokemon visible icons, etc
    this.allSpecies.forEach((species, s) => {
      const icon = this.pokemonContainers[s].icon;
      const dexEntry = globalScene.gameData.dexData[species.speciesId];

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
    this.setFilterTextMode(false);
    this.filterTextCursor = 0;
    this.setCursor(0);

    this.filterTextContainer.setVisible(true);

    return true;
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
    const dexEntry = globalScene.gameData.dexData[species.speciesId];
    const starterData = globalScene.gameData.starterData[species.speciesId];

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
    if (selectedForm !== undefined && (!species.forms[selectedForm]?.isStarterSelectable || !(caughtAttr & globalScene.gameData.getFormAttr(selectedForm)))) {
      // requested form wasn't unlocked/isn't a starter form, purging setting
      delete starterAttributes.form;
    }

    if (starterAttributes.nature !== undefined) {
      const unlockedNatures = globalScene.gameData.getNaturesForAttr(dexEntry.natureAttr);
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
    this.filterBar.setValsToDefault();
    this.filterText.setValsToDefault();
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

  getStarterSpeciesId(speciesId): number {
    if (speciesStarterCosts.hasOwnProperty(speciesId)) {
      return speciesId;
    } else {
      return pokemonStarters[speciesId];
    }
  }

  /**
   * Determines if a passive upgrade is available for the given species ID
   * @param speciesId The ID of the species to check the passive of
   * @returns true if the user has enough candies and a passive has not been unlocked already
   */
  isPassiveAvailable(speciesId: number): boolean {
    // Get this species ID's starter data
    const starterData = globalScene.gameData.starterData[this.getStarterSpeciesId(speciesId)];

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
    const starterData = globalScene.gameData.starterData[this.getStarterSpeciesId(speciesId)];

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
    const starterData = globalScene.gameData.starterData[this.getStarterSpeciesId(speciesId)];

    return starterData.candyCount >= getSameSpeciesEggCandyCounts(speciesStarterCosts[this.getStarterSpeciesId(speciesId)]);
  }

  /**
   * Sets a bounce animation if enabled and the Pokemon has an upgrade
   * @param icon {@linkcode Phaser.GameObjects.GameObject} to animate
   * @param species {@linkcode PokemonSpecies} of the icon used to check for upgrades
   * @param startPaused Should this animation be paused after it is added?
   */
  setUpgradeAnimation(icon: Phaser.GameObjects.Sprite, species: PokemonSpecies, startPaused: boolean = false): void {
    globalScene.tweens.killTweensOf(icon);
    // Skip animations if they are disabled
    if (globalScene.candyUpgradeDisplay === 0 || species.speciesId !== species.getRootSpeciesId(false)) {
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
    if (globalScene.candyUpgradeNotification === 1) {
      if (isPassiveAvailable) {
        globalScene.tweens.chain(tweenChain).paused = startPaused;
      }
    // 'On' mode
    } else if (globalScene.candyUpgradeNotification === 2) {
      if (isPassiveAvailable || isValueReductionAvailable || isSameSpeciesEggAvailable) {
        globalScene.tweens.chain(tweenChain).paused = startPaused;
      }
    }
  }

  /**
   * Sets the visibility of a Candy Upgrade Icon
   */
  setUpgradeIcon(starter: PokedexMonContainer): void {
    const species = starter.species;
    const slotVisible = !!species?.speciesId;

    if (!species || globalScene.candyUpgradeNotification === 0 || species.speciesId !== species.getRootSpeciesId(false)) {
      starter.candyUpgradeIcon.setVisible(false);
      starter.candyUpgradeOverlayIcon.setVisible(false);
      return;
    }

    const isPassiveAvailable = this.isPassiveAvailable(species.speciesId);
    const isValueReductionAvailable = this.isValueReductionAvailable(species.speciesId);
    const isSameSpeciesEggAvailable = this.isSameSpeciesEggAvailable(species.speciesId);

    // 'Passive Only' mode
    if (globalScene.candyUpgradeNotification === 1) {
      starter.candyUpgradeIcon.setVisible(slotVisible && isPassiveAvailable);
      starter.candyUpgradeOverlayIcon.setVisible(slotVisible && starter.candyUpgradeIcon.visible);

      // 'On' mode
    } else if (globalScene.candyUpgradeNotification === 2) {
      starter.candyUpgradeIcon.setVisible(
        slotVisible && ( isPassiveAvailable || isValueReductionAvailable || isSameSpeciesEggAvailable ));
      starter.candyUpgradeOverlayIcon.setVisible(slotVisible && starter.candyUpgradeIcon.visible);
    }
  }

  /**
   * Update the display of candy upgrade icons or animations for the given PokedexMonContainer
   * @param pokemonContainer the container for the Pokemon to update
   */
  updateCandyUpgradeDisplay(pokemonContainer: PokedexMonContainer) {
    if (this.isUpgradeIconEnabled() ) {
      this.setUpgradeIcon(pokemonContainer);
    }
    if (this.isUpgradeAnimationEnabled()) {
      this.setUpgradeAnimation(pokemonContainer.icon, this.lastSpecies, true);
    }
  }

  processInput(button: Button): boolean {
    if (this.blockInput) {
      return false;
    }

    const maxColumns = 9;
    const numberOfStarters = this.filteredPokemonContainers.length;
    const numOfRows = Math.ceil(numberOfStarters / maxColumns);
    const currentRow = Math.floor(this.cursor / maxColumns);
    const onScreenFirstIndex = this.scrollCursor * maxColumns; // this is first index on the screen

    // TODO: use the above to let the cursor go to the correct position when switching back.

    const ui = this.getUi();

    let success = false;
    let error = false;

    if (button === Button.SUBMIT) {
      error = true;
    } else if (button === Button.CANCEL) {
      if (this.filterMode && this.filterBar.openDropDown) {
        // CANCEL with a filter menu open > close it
        this.filterBar.toggleDropDown(this.filterBarCursor);

        // if there are possible pokemon go the first one of the list
        if (numberOfStarters > 0) {
          this.setFilterMode(false);
          this.scrollCursor = 0;
          this.updateScroll();
          this.setCursor(0);
        }
        success = true;

      } else if (this.filterTextMode && !(this.filterText.getValue(this.filterTextCursor) === this.filterText.defaultText)) {
        this.filterText.resetSelection(this.filterTextCursor);
        success = true;
      } else {
        this.tryExit();
        success = true;
      }
    }  else if (button === Button.STATS) {
      if (!this.filterMode) {
        this.cursorObj.setVisible(false);
        this.setSpecies(null);
        this.filterText.cursorObj.setVisible(false);
        this.filterTextMode = false;
        this.filterBarCursor = 0;
        this.setFilterMode(true);
      }
    }  else if (button === Button.V) {
      if (!this.filterTextMode) {
        this.cursorObj.setVisible(false);
        this.setSpecies(null);
        this.filterBar.cursorObj.setVisible(false);
        this.filterMode = false;
        this.filterTextCursor = 0;
        this.setFilterTextMode(true);
      }
    } else if (button === Button.CYCLE_SHINY) {
      this.showDecorations = !this.showDecorations;
      this.updateScroll();
      success = true;
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
          } else if (numberOfStarters > 0) {
          // UP from filter bar to bottom of Pokemon list
            this.setFilterMode(false);
            this.scrollCursor = Math.max(0, numOfRows - 9);
            this.updateScroll();
            const proportion = this.filterBarCursor / Math.max(1, this.filterBar.numFilters - 1);
            const targetCol = Math.min(8, proportion < 0.5 ? Math.floor(proportion * 8) : Math.ceil(proportion * 8));
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
            const targetCol = Math.min(8, proportion < 0.5 ? Math.floor(proportion * 8) : Math.ceil(proportion * 8));
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
    } else if (this.filterTextMode) {
      switch (button) {
        case Button.LEFT:
          // LEFT from filter bar, move to right of Pokemon list
          if (numberOfStarters > 0) {
            this.setFilterTextMode(false);
            const rowIndex = this.filterTextCursor;
            this.setCursor(onScreenFirstIndex + (rowIndex < numOfRows - 1 ? (rowIndex + 1) * maxColumns - 1 : numberOfStarters - 1));
            success = true;
          }
          break;
        case Button.RIGHT:
          // RIGHT from filter bar, move to left of Pokemon list
          if (numberOfStarters > 0) {
            this.setFilterTextMode(false);
            const rowIndex = this.filterTextCursor;
            this.setCursor(onScreenFirstIndex + (rowIndex < numOfRows ? rowIndex * maxColumns : (numOfRows - 1) * maxColumns));
            success = true;
          }
          break;
        case Button.UP:
          if (this.filterTextCursor > 0) {
            success = this.setCursor(this.filterTextCursor - 1);
          } else {
            success = this.setCursor(this.filterText.numFilters - 1);
          }
          break;
        case Button.DOWN:
          if (this.filterTextCursor < this.filterText.numFilters - 1) {
            success = this.setCursor(this.filterTextCursor + 1);
          } else {
            success = this.setCursor(0);
          }
          break;
        case Button.ACTION:
          this.filterText.startSearch(this.filterTextCursor, this.getUi());
          success = true;
          break;
      }
    } else {

      if (button === Button.ACTION) {
        ui.setOverlayMode(Mode.POKEDEX_PAGE, this.lastSpecies, 0);
        success = true;
      } else {
        switch (button) {
          case Button.UP:
            if (currentRow > 0) {
              if (this.scrollCursor > 0 && currentRow - this.scrollCursor === 0) {
                this.scrollCursor--;
                this.updateScroll();
              }
              success = this.setCursor(this.cursor - 9);
            } else {
              this.filterBarCursor = this.filterBar.getNearestFilter(this.filteredPokemonContainers[this.cursor]);
              this.setFilterMode(true);
              success = true;
            }
            break;
          case Button.DOWN:
            if (currentRow < numOfRows - 1) { // not last row
              if (currentRow - this.scrollCursor === 8) { // last row of visible pokemon
                this.scrollCursor++;
              }
              success = this.setCursor(this.cursor + 9);
              this.updateScroll();
            } else if (numOfRows > 1) {
            // DOWN from last row of pokemon > Wrap around to first row
              this.scrollCursor = 0;
              this.updateScroll();
              success = this.setCursor(this.cursor % 9);
            } else {
            // DOWN from single row of pokemon > Go to filters
              this.filterBarCursor = this.filterBar.getNearestFilter(this.filteredPokemonContainers[this.cursor]);
              this.setFilterMode(true);
              success = true;
            }
            break;
          case Button.LEFT:
            if (this.cursor % 9 !== 0) {
              success = this.setCursor(this.cursor - 1);
            } else {
            // LEFT from filtered pokemon, on the left edge
              this.filterTextCursor = this.filterText.getNearestFilter(this.filteredPokemonContainers[this.cursor]);
              this.setFilterTextMode(true);
              success = true;
            }
            break;
          case Button.RIGHT:
            // is not right edge
            if (this.cursor % 9 < (currentRow < numOfRows - 1 ? 8 : (numberOfStarters - 1) % 9)) {
              success = this.setCursor(this.cursor + 1);
            } else {
            // RIGHT from filtered pokemon, on the right edge
              this.filterTextCursor = this.filterText.getNearestFilter(this.filteredPokemonContainers[this.cursor]);
              this.setFilterTextMode(true);
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
      iconPath = globalScene.inputController?.getIconForLatestInputRecorded(iconSetting);
    }
    iconElement.setTexture(gamepadType, iconPath);
    iconElement.setVisible(true);
    controlLabel.setVisible(true);
  }

  updateFilterButtonIcon(iconSetting, gamepadType, iconElement, controlLabel): void {
    let iconPath;
    // touch controls cannot be rebound as is, and are just emulating a keyboard event.
    // Additionally, since keyboard controls can be rebound (and will be displayed when they are), we need to have special handling for the touch controls
    if (gamepadType === "touch") {
      gamepadType = "keyboard";
      iconPath = "C.png";
    } else {
      iconPath = globalScene.inputController?.getIconForLatestInputRecorded(iconSetting);
    }
    iconElement.setTexture(gamepadType, iconPath);
    iconElement.setVisible(true);
    controlLabel.setVisible(true);
  }

  getSanitizedProps(props: DexAttrProps): DexAttrProps {
    const sanitizedProps: DexAttrProps = {
      shiny: false,
      female: props.female,
      variant: 0,
      formIndex: 0,
    };
    return sanitizedProps;
  }

  // Returns true if one of the forms has the requested move
  hasFormLevelMove(form: PokemonForm, selectedMove: string): boolean {
    if (!pokemonFormLevelMoves.hasOwnProperty(form.speciesId) || !pokemonFormLevelMoves[form.speciesId].hasOwnProperty(form.formIndex)) {
      return false;
    } else {
      const levelMoves = pokemonFormLevelMoves[form.speciesId][form.formIndex].map(m => allMoves[m[1]].name);
      return levelMoves.includes(selectedMove);
    }
  }

  updateStarters = () => {
    this.scrollCursor = 0;
    this.filteredPokemonContainers = [];
    this.validPokemonContainers = [];

    this.pokerusCursorObjs.forEach(cursor => cursor.setVisible(false));

    this.filterBar.updateFilterLabels();
    this.filterText.updateFilterLabels();

    this.validPokemonContainers = this.pokemonContainers;

    // this updates icons for previously saved pokemon
    for (let i = 0; i < this.validPokemonContainers.length; i++) {
      const currentFilteredContainer = this.validPokemonContainers[i];
      const starterSprite = currentFilteredContainer.icon as Phaser.GameObjects.Sprite;

      const currentDexAttr = this.getCurrentDexProps(currentFilteredContainer.species.speciesId);
      const props = this.getSanitizedProps(globalScene.gameData.getSpeciesDexAttrProps(currentFilteredContainer.species, currentDexAttr));

      starterSprite.setTexture(currentFilteredContainer.species.getIconAtlasKey(props.formIndex, props.shiny, props.variant), currentFilteredContainer.species.getIconId(props.female!, props.formIndex, props.shiny, props.variant));
      currentFilteredContainer.checkIconId(props.female, props.formIndex, props.shiny, props.variant);
    }

    // filter
    this.validPokemonContainers.forEach(container => {
      container.setVisible(false);

      container.cost = globalScene.gameData.getSpeciesStarterValue(this.getStarterSpeciesId(container.species.speciesId));

      // First, ensure you have the caught attributes for the species else default to bigint 0
      // TODO: This might be removed depending on how accessible we want the pokedex function to be
      const caughtAttr = globalScene.gameData.dexData[container.species.speciesId]?.caughtAttr || BigInt(0);
      const starterData = globalScene.gameData.starterData[this.getStarterSpeciesId(container.species.speciesId)];
      const isStarterProgressable = speciesEggMoves.hasOwnProperty(this.getStarterSpeciesId(container.species.speciesId));

      // Name filter
      const selectedName = this.filterText.getValue(FilterTextRow.NAME);
      const fitsName = container.species.name === selectedName || selectedName === this.filterText.defaultText;

      // Move filter
      // TODO: There can be fringe cases where the two moves belong to mutually exclusive forms, these must be handled separately (Pikachu);
      // On the other hand, in some cases it is possible to switch between different forms and combine (Deoxys)
      const levelMoves = pokemonSpeciesLevelMoves[container.species.speciesId].map(m => allMoves[m[1]].name);
      // This always gets egg moves from the starter
      const eggMoves = speciesEggMoves[this.getStarterSpeciesId(container.species.speciesId)]?.map(m => allMoves[m].name) ?? [];
      const tmMoves = speciesTmMoves[this.getStarterSpeciesId(container.species.speciesId)]?.map(m => allMoves[Array.isArray(m) ? m[1] : m].name) ?? [];
      const selectedMove1 = this.filterText.getValue(FilterTextRow.MOVE_1);
      const selectedMove2 = this.filterText.getValue(FilterTextRow.MOVE_2);

      const fitsFormMove1 = container.species.forms.some(form => this.hasFormLevelMove(form, selectedMove1));
      const fitsFormMove2 = container.species.forms.some(form => this.hasFormLevelMove(form, selectedMove2));
      const fitsLevelMove1 = levelMoves.includes(selectedMove1) || fitsFormMove1;
      const fitsEggMove1 = eggMoves.includes(selectedMove1);
      const fitsTmMove1 = tmMoves.includes(selectedMove1);
      const fitsLevelMove2 = levelMoves.includes(selectedMove2) || fitsFormMove2;
      const fitsEggMove2 = eggMoves.includes(selectedMove2);
      const fitsTmMove2 = tmMoves.includes(selectedMove2);
      const fitsMove1 = fitsLevelMove1 || fitsEggMove1 || fitsTmMove1 || selectedMove1 === this.filterText.defaultText;
      const fitsMove2 = fitsLevelMove2 || fitsEggMove2 || fitsTmMove2 || selectedMove2 === this.filterText.defaultText;
      const fitsMoves = fitsMove1 && fitsMove2;

      container.eggMove1Icon.setVisible(false);
      container.tmMove1Icon.setVisible(false);
      container.eggMove2Icon.setVisible(false);
      container.tmMove2Icon.setVisible(false);
      if (fitsEggMove1 && !fitsLevelMove1) {
        container.eggMove1Icon.setVisible(true);
      } else if (fitsTmMove1 && !fitsLevelMove1) {
        container.tmMove1Icon.setVisible(true);
      }
      if (fitsEggMove2 && !fitsLevelMove2) {
        container.eggMove2Icon.setVisible(true);
      } else if (fitsTmMove2 && !fitsLevelMove2) {
        container.tmMove2Icon.setVisible(true);
      }

      // Ability filter
      const abilities = [ container.species.ability1, container.species.ability2, container.species.abilityHidden ].map(a => allAbilities[a].name);
      const passives = starterPassiveAbilities[this.getStarterSpeciesId(container.species.speciesId)] ?? {} as PassiveAbilities;

      const selectedAbility1 = this.filterText.getValue(FilterTextRow.ABILITY_1);
      const fitsFormAbility = container.species.forms.some(form => allAbilities[form.ability1].name === selectedAbility1);
      const fitsAbility1 = abilities.includes(selectedAbility1) || fitsFormAbility || selectedAbility1 === this.filterText.defaultText;
      const fitsPassive1 = Object.values(passives).some(p => p.name === selectedAbility1);

      const selectedAbility2 = this.filterText.getValue(FilterTextRow.ABILITY_2);
      const fitsAbility2 = abilities.includes(selectedAbility2) || fitsFormAbility || selectedAbility2 === this.filterText.defaultText;
      const fitsPassive2 = Object.values(passives).some(p => p.name === selectedAbility2);

      // If both fields have been set to the same ability, show both ability and passive
      const fitsAbilities = (fitsAbility1 && (fitsPassive2 || selectedAbility2 === this.filterText.defaultText)) ||
                            (fitsAbility2 && (fitsPassive1 || selectedAbility1 === this.filterText.defaultText));

      container.passive1Icon.setVisible(false);
      container.passive2Icon.setVisible(false);
      if (fitsPassive1) {
        container.passive1Icon.setVisible(true);
      }
      if (fitsPassive2) {
        container.passive2Icon.setVisible(true);
      }

      // Gen filter
      const fitsGen =   this.filterBar.getVals(DropDownColumn.GEN).includes(container.species.generation);

      // Type filter
      const fitsType =  this.filterBar.getVals(DropDownColumn.TYPES).some(type => container.species.isOfType((type as number) - 1));

      // Biome filter
      const indexToBiome = new Map(
        Object.values(Biome)
          .map((value, index) => (typeof value === "string" ? [ index, value ] : undefined))
          .filter((entry): entry is [number, string] => entry !== undefined)
      );
      indexToBiome.set(35, "Uncatchable");

      // We get biomes for both the mon and its starters to ensure that evolutions get the correct filters.
      // TODO: We might also need to do it the other way around.
      const biomes = catchableSpecies[container.species.speciesId].concat(catchableSpecies[this.getStarterSpeciesId(container.species.speciesId)]).map(b => Biome[b.biome]);
      if (biomes.length === 0) {
        biomes.push("Uncatchable");
      }
      const showNoBiome = (biomes.length === 0 && this.filterBar.getVals(DropDownColumn.BIOME).length === 36) ? true : false;
      const fitsBiome = this.filterBar.getVals(DropDownColumn.BIOME).some(item => biomes.includes(indexToBiome.get(item) ?? "")) || showNoBiome;


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
      const isCostReducedByOne = starterData.valueReduction === 1;
      const isCostReducedByTwo = starterData.valueReduction === 2;
      const isCostReductionUnlockable = this.isValueReductionAvailable(container.species.speciesId);
      const fitsCostReduction = this.filterBar.getVals(DropDownColumn.UNLOCKS).some(unlocks => {
        if (unlocks.val === "COST_REDUCTION" && unlocks.state === DropDownState.ON) {
          return isCostReducedByOne || isCostReducedByTwo;
        } else if (unlocks.val === "COST_REDUCTION" && unlocks.state === DropDownState.ONE) {
          return isCostReducedByOne;
        } else if (unlocks.val === "COST_REDUCTION" && unlocks.state === DropDownState.TWO) {
          return isCostReducedByTwo;
        } else if (unlocks.val === "COST_REDUCTION" && unlocks.state === DropDownState.EXCLUDE) {
          return isStarterProgressable && !(isCostReducedByOne || isCostReducedByTwo);
        } else if (unlocks.val === "COST_REDUCTION" && unlocks.state === DropDownState.UNLOCKABLE) {
          return isCostReductionUnlockable;
        } else if (unlocks.val === "COST_REDUCTION" && unlocks.state === DropDownState.OFF) {
          return true;
        }
      });

      // Starter Filter
      const isStarter = this.getStarterSpeciesId(container.species.speciesId) === container.species.speciesId;
      const fitsStarter = this.filterBar.getVals(DropDownColumn.MISC).some(misc => {
        if (misc.val === "STARTER" && misc.state === DropDownState.ON) {
          return isStarter;
        }
        if (misc.val === "STARTER" && misc.state === DropDownState.EXCLUDE) {
          return !isStarter;
        }
        if (misc.val === "STARTER" && misc.state === DropDownState.OFF) {
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

      if (fitsName && fitsAbilities && fitsMoves && fitsGen && fitsBiome && fitsType && fitsCaught && fitsPassive && fitsCostReduction && fitsStarter && fitsFavorite && fitsWin && fitsHA && fitsEgg && fitsPokerus) {
        this.filteredPokemonContainers.push(container);
      }
    });

    this.starterSelectScrollBar.setTotalRows(Math.max(Math.ceil(this.filteredPokemonContainers.length / 9), 1));
    this.starterSelectScrollBar.setScrollCursor(0);

    // sort
    const sort = this.filterBar.getVals(DropDownColumn.SORT)[0];
    this.filteredPokemonContainers.sort((a, b) => {
      switch (sort.val) {
        default:
          break;
        case SortCriteria.NUMBER:
          return (a.species.speciesId - b.species.speciesId) * -sort.dir;
        case SortCriteria.COST:
          return (a.cost - b.cost) * -sort.dir;
        case SortCriteria.CANDY:
          const candyCountA = globalScene.gameData.starterData[a.species.speciesId].candyCount;
          const candyCountB = globalScene.gameData.starterData[b.species.speciesId].candyCount;
          return (candyCountA - candyCountB) * -sort.dir;
        case SortCriteria.IV:
          const avgIVsA = globalScene.gameData.dexData[a.species.speciesId].ivs.reduce((a, b) => a + b, 0) / globalScene.gameData.dexData[a.species.speciesId].ivs.length;
          const avgIVsB = globalScene.gameData.dexData[b.species.speciesId].ivs.reduce((a, b) => a + b, 0) / globalScene.gameData.dexData[b.species.speciesId].ivs.length;
          return (avgIVsA - avgIVsB) * -sort.dir;
        case SortCriteria.NAME:
          return a.species.name.localeCompare(b.species.name) * -sort.dir;
        case SortCriteria.CAUGHT:
          return (globalScene.gameData.dexData[a.species.speciesId].caughtCount - globalScene.gameData.dexData[b.species.speciesId].caughtCount) * -sort.dir;
        case SortCriteria.HATCHED:
          return (globalScene.gameData.dexData[this.getStarterSpeciesId(a.species.speciesId)].hatchedCount - globalScene.gameData.dexData[this.getStarterSpeciesId(b.species.speciesId)].hatchedCount) * -sort.dir;
      }
      return 0;
    });

    this.updateScroll();
  };

  updateScroll = () => {
    const maxColumns = 9;
    const maxRows = 9;
    const onScreenFirstIndex = this.scrollCursor * maxColumns;
    const onScreenLastIndex = Math.min(this.filteredPokemonContainers.length - 1, onScreenFirstIndex + maxRows * maxColumns - 1);

    this.starterSelectScrollBar.setScrollCursor(this.scrollCursor);

    this.pokerusCursorObjs.forEach(cursorObj => cursorObj.setVisible(false));

    let pokerusCursorIndex = 0;
    this.filteredPokemonContainers.forEach((container, i) => {
      const pos = calcStarterPosition(i, this.scrollCursor);
      container.setPosition(pos.x, pos.y);
      if (i < onScreenFirstIndex || i > onScreenLastIndex) {
        container.setVisible(false);
        return;
      } else {
        container.setVisible(true);

        if (this.showDecorations) {

          if (this.pokerusSpecies.includes(container.species)) {
            this.pokerusCursorObjs[pokerusCursorIndex].setPosition(pos.x - 1, pos.y + 1);
            this.pokerusCursorObjs[pokerusCursorIndex].setVisible(true);
            pokerusCursorIndex++;
          }

          const speciesId = container.species.speciesId;
          this.updateStarterValueLabel(container);

          container.label.setVisible(true);
          const speciesVariants = speciesId && globalScene.gameData.dexData[speciesId].caughtAttr & DexAttr.SHINY
            ? [ DexAttr.DEFAULT_VARIANT, DexAttr.VARIANT_2, DexAttr.VARIANT_3 ].filter(v => !!(globalScene.gameData.dexData[speciesId].caughtAttr & v))
            : [];
          for (let v = 0; v < 3; v++) {
            const hasVariant = speciesVariants.length > v;
            container.shinyIcons[v].setVisible(hasVariant);
            if (hasVariant) {
              container.shinyIcons[v].setTint(getVariantTint(speciesVariants[v] === DexAttr.DEFAULT_VARIANT ? 0 : speciesVariants[v] === DexAttr.VARIANT_2 ? 1 : 2));
            }
          }

          container.starterPassiveBgs.setVisible(!!globalScene.gameData.starterData[this.getStarterSpeciesId(speciesId)].passiveAttr);
          container.hiddenAbilityIcon.setVisible(!!globalScene.gameData.dexData[speciesId].caughtAttr && !!(globalScene.gameData.starterData[this.getStarterSpeciesId(speciesId)].abilityAttr & 4));
          container.classicWinIcon.setVisible(globalScene.gameData.starterData[this.getStarterSpeciesId(speciesId)].classicWinCount > 0);
          container.favoriteIcon.setVisible(this.starterPreferences[speciesId]?.favorite ?? false);

          // 'Candy Icon' mode
          if (globalScene.candyUpgradeDisplay === 0) {

            if (!starterColors[this.getStarterSpeciesId(speciesId)]) {
              // Default to white if no colors are found
              starterColors[this.getStarterSpeciesId(speciesId)] = [ "ffffff", "ffffff" ];
            }

            // Set the candy colors
            container.candyUpgradeIcon.setTint(argbFromRgba(rgbHexToRgba(starterColors[this.getStarterSpeciesId(speciesId)][0])));
            container.candyUpgradeOverlayIcon.setTint(argbFromRgba(rgbHexToRgba(starterColors[this.getStarterSpeciesId(speciesId)][1])));

          } else if (globalScene.candyUpgradeDisplay === 1) {
            container.candyUpgradeIcon.setVisible(false);
            container.candyUpgradeOverlayIcon.setVisible(false);
          }
        } else {
          container.label.setVisible(false);
          for (let v = 0; v < 3; v++) {
            container.shinyIcons[v].setVisible(false);
          }
          container.starterPassiveBgs.setVisible(false);
          container.hiddenAbilityIcon.setVisible(false);
          container.classicWinIcon.setVisible(false);
          container.favoriteIcon.setVisible(false);

          container.candyUpgradeIcon.setVisible(false);
          container.candyUpgradeOverlayIcon.setVisible(false);
        }
      }
    });
  };

  setCursor(cursor: number): boolean {
    let changed = false;

    if (this.filterMode) {
      changed = this.filterBarCursor !== cursor;
      this.filterBarCursor = cursor;
      this.filterBar.setCursor(cursor);
    } else if (this.filterTextMode) {
      changed = this.filterTextCursor !== cursor;
      this.filterTextCursor = cursor;
      this.filterText.setCursor(cursor);
    } else {
      cursor = Math.max(Math.min(this.filteredPokemonContainers.length - 1, cursor), 0);
      changed = super.setCursor(cursor);

      const pos = calcStarterPosition(cursor, this.scrollCursor);
      this.cursorObj.setPosition(pos.x - 1, pos.y + 1);

      const species = this.filteredPokemonContainers[cursor]?.species;

      if (species) {
        this.setSpecies(species);
      }
    }

    return changed;
  }

  setFilterMode(filterMode: boolean): boolean {
    this.cursorObj.setVisible(!filterMode);
    this.filterBar.cursorObj.setVisible(filterMode);
    this.pokemonSprite.setVisible(false);

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

  setFilterTextMode(filterTextMode: boolean): boolean {
    this.cursorObj.setVisible(!filterTextMode);
    this.filterText.cursorObj.setVisible(filterTextMode);
    this.pokemonSprite.setVisible(false);

    if (filterTextMode !== this.filterTextMode) {
      this.filterTextMode = filterTextMode;
      this.setCursor(filterTextMode ? this.filterTextCursor : this.cursor);
      if (filterTextMode) {
        this.setSpecies(null);
      }
      return true;
    }
    return false;
  }

  getFriendship(speciesId: number) {
    let currentFriendship = globalScene.gameData.starterData[this.getStarterSpeciesId(speciesId)].friendship;
    if (!currentFriendship || currentFriendship === undefined) {
      currentFriendship = 0;
    }

    const friendshipCap = getStarterValueFriendshipCap(speciesStarterCosts[speciesId]);

    return { currentFriendship, friendshipCap };
  }

  setSpecies(species: PokemonSpecies | null) {

    this.speciesStarterDexEntry = species ? globalScene.gameData.dexData[species.speciesId] : null;

    if (!species && globalScene.ui.getTooltip().visible) {
      globalScene.ui.hideTooltip();
    }

    if (this.lastSpecies) {
      const dexAttr = this.getCurrentDexProps(this.lastSpecies.speciesId);
      const props = this.getSanitizedProps(globalScene.gameData.getSpeciesDexAttrProps(this.lastSpecies, dexAttr));
      const speciesIndex = this.allSpecies.indexOf(this.lastSpecies);
      const lastSpeciesIcon = this.pokemonContainers[speciesIndex].icon;
      this.checkIconId(lastSpeciesIcon, this.lastSpecies, props.female, props.formIndex, props.shiny, props.variant);
      this.iconAnimHandler.addOrUpdate(lastSpeciesIcon, PokemonIconAnimMode.NONE);

      // Resume the animation for the previously selected species
      const icon = this.pokemonContainers[speciesIndex].icon;
      globalScene.tweens.getTweensOf(icon).forEach(tween => tween.resume());
    }

    this.lastSpecies = species!; // TODO: is this bang correct?

    if (species && (this.speciesStarterDexEntry?.seenAttr || this.speciesStarterDexEntry?.caughtAttr)) {

      this.pokemonNumberText.setText(i18next.t("pokedexUiHandler:pokemonNumber") + padInt(species.speciesId, 4));

      this.pokemonNameText.setText(species.name);

      if (this.speciesStarterDexEntry?.caughtAttr) {

        // Pause the animation when the species is selected
        const speciesIndex = this.allSpecies.indexOf(species);
        const icon = this.pokemonContainers[speciesIndex].icon;

        if (this.isUpgradeAnimationEnabled()) {
          globalScene.tweens.getTweensOf(icon).forEach(tween => tween.pause());
          // Reset the position of the icon
          icon.x = -2;
          icon.y = 2;
        }

        // Initiates the small up and down idle animation
        this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.PASSIVE);

        const speciesForm = getPokemonSpeciesForm(species.speciesId, 0);
        this.setTypeIcons(speciesForm.type1, speciesForm.type2);

        this.setSpeciesDetails(species, {});

        this.pokemonSprite.clearTint();

        this.type1Icon.clearTint();
        this.type2Icon.clearTint();
      } else {
        this.type1Icon.setVisible(true);
        this.type2Icon.setVisible(true);

        this.setSpeciesDetails(species, {
          forSeen: true
        });
        this.pokemonSprite.setTint(0x808080);
      }
    } else {
      this.pokemonNumberText.setText(species ? i18next.t("pokedexUiHandler:pokemonNumber") + padInt(species.speciesId, 4) : "");
      this.pokemonNameText.setText(species ? "???" : "");
      this.type1Icon.setVisible(false);
      this.type2Icon.setVisible(false);
      if (species) {
        this.pokemonSprite.setTint(0x000000);
        this.setSpeciesDetails(species, {});
      }
    }
  }

  setSpeciesDetails(species: PokemonSpecies, options: SpeciesDetails = {}): void {
    let { shiny, formIndex, female, variant } = options;
    const forSeen: boolean = options.forSeen ?? false;

    // We will only update the sprite if there is a change to form, shiny/variant
    // or gender for species with gender sprite differences
    const shouldUpdateSprite = true;

    if (species?.forms?.find(f => f.formKey === "female")) {
      if (female !== undefined) {
        formIndex = female ? 1 : 0;
      } else if (formIndex !== undefined) {
        female = formIndex === 1;
      }
    }

    this.pokemonSprite.setVisible(false);

    if (this.assetLoadCancelled) {
      this.assetLoadCancelled.value = true;
      this.assetLoadCancelled = null;
    }

    this.starterMoveset = null;
    this.speciesStarterMoves = [];

    if (species) {
      const dexEntry = globalScene.gameData.dexData[species.speciesId];

      if (!dexEntry.caughtAttr) {
        const props = this.getSanitizedProps(globalScene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId)));

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
      }

      const assetLoadCancelled = new BooleanHolder(false);
      this.assetLoadCancelled = assetLoadCancelled;

      if (shouldUpdateSprite) {

        species.loadAssets(female!, formIndex, shiny, variant, true).then(() => { // TODO: is this bang correct?
          if (assetLoadCancelled.value) {
            return;
          }
          this.assetLoadCancelled = null;
          this.speciesLoaded.set(species.speciesId, true);
          this.pokemonSprite.play(species.getSpriteKey(female!, formIndex, shiny, variant)); // TODO: is this bang correct?
          this.pokemonSprite.setPipelineData("shiny", shiny);
          this.pokemonSprite.setPipelineData("variant", variant);
          this.pokemonSprite.setPipelineData("spriteKey", species.getSpriteKey(female!, formIndex, shiny, variant)); // TODO: is this bang correct?
          this.pokemonSprite.setVisible(true);
        });
      } else {
        this.pokemonSprite.setVisible(!(this.filterMode || this.filterTextMode));
      }

      if (dexEntry.caughtAttr || forSeen) {

        const speciesForm = getPokemonSpeciesForm(species.speciesId, 0); // TODO: always selecting the first form

        this.setTypeIcons(speciesForm.type1, speciesForm.type2);
      } else {
        this.setTypeIcons(null, null);
      }
    } else {
      this.setTypeIcons(null, null);
    }

    if (!this.starterMoveset) {
      this.starterMoveset = this.speciesStarterMoves.slice(0, 4) as StarterMoveset;
    }
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

  updateStarterValueLabel(starter: PokedexMonContainer): void {
    const speciesId = starter.species.speciesId;
    const baseStarterValue = speciesStarterCosts[speciesId];
    const starterValue = globalScene.gameData.getSpeciesStarterValue(this.getStarterSpeciesId(speciesId));
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

  tryExit(): boolean {
    this.blockInput = true;
    const ui = this.getUi();

    const cancel = () => {
      ui.setMode(Mode.POKEDEX, "refresh");
      this.clearText();
      this.blockInput = false;
    };
    ui.showText(i18next.t("pokedexUiHandler:confirmExit"), null, () => {
      ui.setModeWithoutClear(Mode.CONFIRM, () => {
        ui.setMode(Mode.POKEDEX, "refresh");
        globalScene.clearPhaseQueue();
        this.clearText();
        this.clear();
        ui.revertMode();
      }, cancel, null, null, 19);
    });

    return true;
  }


  /**
   * Creates a temporary dex attr props that will be used to
   * display the correct shiny, variant, and form based on the StarterPreferences
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
      props += globalScene.gameData.getFormAttr(globalScene.gameData.getFormIndex(caughtAttr));
    }

    return props;
  }

  override destroy(): void {
    this.pokemonContainers = [];
  }

  clearText() {
    this.starterSelectMessageBoxContainer.setVisible(false);
    super.clearText();
  }

  clear(): void {
    super.clear();

    this.cursor = -1;
    globalScene.ui.hideTooltip();

    this.starterSelectContainer.setVisible(false);
    this.blockInput = false;
  }

  checkIconId(icon: Phaser.GameObjects.Sprite, species: PokemonSpecies, female: boolean, formIndex: number, shiny: boolean, variant: number) {
    if (icon.frame.name !== species.getIconId(female, formIndex, shiny, variant)) {
      console.log(`${species.name}'s icon ${icon.frame.name} does not match getIconId with female: ${female}, formIndex: ${formIndex}, shiny: ${shiny}, variant: ${variant}`);
      icon.setTexture(species.getIconAtlasKey(formIndex, false, variant));
      icon.setFrame(species.getIconId(female, formIndex, false, variant));
    }
  }
}
