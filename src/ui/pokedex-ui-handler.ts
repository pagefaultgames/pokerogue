import { BattleSceneEventType, CandyUpgradeNotificationChangedEvent } from "#app/events/battle-scene";
import { Variant, getVariantTint, getVariantIcon } from "#app/data/variant";
import { argbFromRgba } from "@material/material-color-utilities";
import i18next from "i18next";
import BattleScene, { starterColors } from "#app/battle-scene";
import { speciesEggMoves } from "#app/data/balance/egg-moves";
import { pokemonFormLevelMoves, pokemonSpeciesLevelMoves } from "#app/data/balance/pokemon-level-moves";
import PokemonSpecies, { allSpecies, getPokemonSpeciesForm, getPokerusStarters, PokemonForm } from "#app/data/pokemon-species";
import { getStarterValueFriendshipCap, speciesStarterCosts, POKERUS_STARTER_COUNT } from "#app/data/balance/starters";
import { catchableSpecies } from "#app/data/balance/biomes";
import { Type } from "#enums/type";
import { AbilityAttr, DexAttr, DexAttrProps, DexEntry, StarterMoveset, StarterAttributes, StarterPreferences, StarterPrefs } from "#app/system/game-data";
import { Tutorial, handleTutorial } from "#app/tutorial";
import MessageUiHandler from "#app/ui/message-ui-handler";
import PokemonIconAnimHandler, { PokemonIconAnimMode } from "#app/ui/pokemon-icon-anim-handler";
import { TextStyle, addTextObject } from "#app/ui/text";
import { Mode } from "#app/ui/ui";
//import { addWindow } from "#app/ui/ui-theme";
import { SettingKeyboard } from "#app/system/settings/settings-keyboard";
import { Passive as PassiveAttr } from "#enums/passive";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Button } from "#enums/buttons";
import { DropDown, DropDownLabel, DropDownOption, DropDownState, DropDownType, SortCriteria } from "#app/ui/dropdown";
import { StarterContainer } from "#app/ui/starter-container";
import { DropDownColumn, FilterBar } from "#app/ui/filter-bar";
import { ScrollBar } from "#app/ui/scroll-bar";
import { Abilities } from "#enums/abilities";
import { getPassiveCandyCount, getValueReductionCandyCounts, getSameSpeciesEggCandyCounts } from "#app/data/balance/starters";
import { BooleanHolder, fixedInt, getLocalizedSpriteKey, padInt, randIntRange, rgbHexToRgba } from "#app/utils";
import type { Nature } from "#enums/nature";
import AutoCompleteUiHandler from "./autocomplete-ui-handler";
import AwaitableUiHandler from "./awaitable-ui-handler";
import { addWindow, WindowVariant } from "./ui-theme";
import { OptionSelectConfig } from "./abstact-option-select-ui-handler";
import { FilterText, FilterTextRow } from "./filter-text";
import { allAbilities } from "#app/data/ability";
import { starterPassiveAbilities } from "#app/data/balance/passives";
import { allMoves } from "#app/data/move";
import { speciesTmMoves } from "#app/data/balance/tms";
import { pokemonStarters } from "#app/data/balance/pokemon-evolutions";
import { Biome } from "#enums/biome";


// We don't need this interface here
export interface Starter {
  species: PokemonSpecies;
  starter: PokemonSpecies;
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
const speciesContainerX = 143; // if team on the RIGHT: 109 / if on the LEFT: 143

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
  formIndex?: integer
  female?: boolean,
  variant?: Variant,
  abilityIndex?: integer,
  natureIndex?: integer,
  forSeen?: boolean, // default = false
}

export default class PokedexUiHandler extends MessageUiHandler {
  private starterSelectContainer: Phaser.GameObjects.Container;
  private starterSelectScrollBar: ScrollBar;
  //  private filterTextContainer: Phaser.GameObjects.Container;
  private autocomplete: AutoCompleteUiHandler;
  private filterBarContainer: Phaser.GameObjects.Container;
  private filterBar: FilterBar;
  private starterContainers: StarterContainer[] = [];
  private filteredStarterContainers: StarterContainer[] = [];
  private validStarterContainers: StarterContainer[] = [];
  private pokemonNumberText: Phaser.GameObjects.Text;
  private pokemonSprite: Phaser.GameObjects.Sprite;
  private pokemonNameText: Phaser.GameObjects.Text;
  private type1Icon: Phaser.GameObjects.Sprite;
  private type2Icon: Phaser.GameObjects.Sprite;

  private activeTooltip: "ABILITY" | "PASSIVE" | "CANDY" | undefined;

  private starterSelectMessageBox: Phaser.GameObjects.NineSlice;
  private starterSelectMessageBoxContainer: Phaser.GameObjects.Container;

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

  private assetLoadCancelled: BooleanHolder | null;
  public cursorObj: Phaser.GameObjects.Image;
  private starterCursorObjs: Phaser.GameObjects.Image[];
  private pokerusCursorObjs: Phaser.GameObjects.Image[];
  private starterIconsCursorObj: Phaser.GameObjects.Image;

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
  private filterTextCursor: integer = 0;

  private showDecorations: boolean = false;
  private goFilterIconElement: Phaser.GameObjects.Sprite;
  private goFilterLabel: Phaser.GameObjects.Text;

  constructor(scene: BattleScene) {
    super(scene, Mode.POKEDEX);
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

    const starterContainerWindow = addWindow(this.scene, speciesContainerX, filterBarHeight + 1, 175, 161);
    const starterContainerBg = this.scene.add.image(speciesContainerX + 1, filterBarHeight + 2, "starter_container_bg");
    starterContainerBg.setOrigin(0, 0);
    this.starterSelectContainer.add(starterContainerBg);
    this.starterSelectContainer.add(starterContainerWindow);


    // Create and initialise filter text fields

    this.filterTextContainer = this.scene.add.container(0, 0);
    this.filterText = new FilterText(this.scene, 1, filterBarHeight + 2, 140, 100, this.updateStarters);

    //    const nameTextField: TextField = new TextField(this.scene, 0, 0, genOptions, this.updateStarters, DropDownType.HYBRID);
    this.filterText.addFilter(FilterTextRow.NAME, i18next.t("filterText:nameField"));
    this.filterText.addFilter(FilterTextRow.MOVE_1, i18next.t("filterText:move1Field"));
    this.filterText.addFilter(FilterTextRow.MOVE_2, i18next.t("filterText:move2Field"));
    this.filterText.addFilter(FilterTextRow.ABILITY_1, i18next.t("filterText:ability1Field"));
    this.filterText.addFilter(FilterTextRow.ABILITY_2, i18next.t("filterText:ability2Field"));

    this.filterTextContainer.add(this.filterText);
    this.starterSelectContainer.add(this.filterTextContainer);


    //    this.filterTextContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);
    //    this.starterSelectContainer.setVisible(false);
    //    ui.add(this.filterTextContainer);


    this.autocomplete = new AutoCompleteUiHandler(this.scene);

    const manageDataOptions: any[] = []; // TODO: proper type

    manageDataOptions.push({
      label: "Test Dialogue",
      handler: () => {
        ui.playSelect();
        const prefilledText = "";
        const buttonAction: any = {};
        buttonAction["buttonActions"] = [
          (sanitizedName: string) => {
            ui.revertMode();
            ui.playSelect();
            const dialogueTestName = sanitizedName;
            const dialogueName = decodeURIComponent(escape(atob(dialogueTestName)));
            const handler = ui.getHandler() as AwaitableUiHandler;
            handler.tutorialActive = true;
            const interpolatorOptions: any = {};
            const splitArr = dialogueName.split(" "); // this splits our inputted text into words to cycle through later
            const translatedString = splitArr[0]; // this is our outputted i18 string
            const regex = RegExp("\\{\\{(\\w*)\\}\\}", "g"); // this is a regex expression to find all the text between {{ }} in the i18 output
            const matches = i18next.t(translatedString).match(regex) ?? [];
            if (matches.length > 0) {
              for (let match = 0; match < matches.length; match++) {
                // we add 1 here  because splitArr[0] is our first value for the translatedString, and after that is where the variables are
                // the regex here in the replace (/\W/g) is to remove the {{ and }} and just give us all alphanumeric characters
                if (typeof splitArr[match + 1] !== "undefined") {
                  interpolatorOptions[matches[match].replace(/\W/g, "")] = i18next.t(splitArr[match + 1]);
                }
              }
            }
            // Switch to the dialog test window
            this.setDialogTestMode(true);
            ui.showText(String(i18next.t(translatedString, interpolatorOptions)), null, () => this.scene.ui.showText("", 0, () => {
              handler.tutorialActive = false;
              // Go back to the default message window
              this.setDialogTestMode(false);
            }), null, true);
          },
          () => {
            ui.revertMode();
          }
        ];
        ui.setMode(Mode.TEST_DIALOGUE, buttonAction, prefilledText);
        return true;
      },
      keepOpen: true
    });


    this.menuMessageBoxContainer = this.scene.add.container(0, 130);
    this.menuMessageBoxContainer.setName("menu-message-box");
    this.menuMessageBoxContainer.setVisible(false);

    // Window for general messages
    this.menuMessageBox = addWindow(this.scene, 0, 0, this.defaultMessageBoxWidth, 48);
    this.menuMessageBox.setOrigin(0, 0);
    this.menuMessageBoxContainer.add(this.menuMessageBox);

    // Full-width window used for testing dialog messages in debug mode
    this.dialogueMessageBox = addWindow(this.scene, -this.textPadding, 0, this.scene.game.canvas.width / 6 + this.textPadding * 2, 49, false, false, 0, 0, WindowVariant.THIN);
    this.dialogueMessageBox.setOrigin(0, 0);
    this.menuMessageBoxContainer.add(this.dialogueMessageBox);


    this.manageDataConfig = {
      xOffset: 98,
      options: manageDataOptions,
      maxOptions: 7
    };


    // Create and initialise filter bar
    this.filterBarContainer = this.scene.add.container(0, 0);
    this.filterBar = new FilterBar(this.scene, speciesContainerX - 10, 1, 175 + 10, filterBarHeight);

    // gen filter
    const genOptions: DropDownOption[] = [
      new DropDownOption(this.scene, 1, new DropDownLabel(i18next.t("pokedexUiHandler:gen1"))),
      new DropDownOption(this.scene, 2, new DropDownLabel(i18next.t("pokedexUiHandler:gen2"))),
      new DropDownOption(this.scene, 3, new DropDownLabel(i18next.t("pokedexUiHandler:gen3"))),
      new DropDownOption(this.scene, 4, new DropDownLabel(i18next.t("pokedexUiHandler:gen4"))),
      new DropDownOption(this.scene, 5, new DropDownLabel(i18next.t("pokedexUiHandler:gen5"))),
      new DropDownOption(this.scene, 6, new DropDownLabel(i18next.t("pokedexUiHandler:gen6"))),
      new DropDownOption(this.scene, 7, new DropDownLabel(i18next.t("pokedexUiHandler:gen7"))),
      new DropDownOption(this.scene, 8, new DropDownLabel(i18next.t("pokedexUiHandler:gen8"))),
      new DropDownOption(this.scene, 9, new DropDownLabel(i18next.t("pokedexUiHandler:gen9"))),
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
      const typeSprite = this.scene.add.sprite(0, 0, getLocalizedSpriteKey("types"));
      typeSprite.setScale(0.5);
      typeSprite.setFrame(type.toLowerCase());
      typeOptions.push(new DropDownOption(this.scene, index, new DropDownLabel("", typeSprite)));
    });
    this.filterBar.addFilter(DropDownColumn.TYPES, i18next.t("filterBar:typeFilter"), new DropDown(this.scene, 0, 0, typeOptions, this.updateStarters, DropDownType.HYBRID, 0.5));

    // biome filter. Making an entry in the dropdown for each biome
    const biomeOptions = Object.values(Biome)
      .filter((value) => typeof value === "number") // Filter numeric values from the enum
      .map((biomeValue, index) =>
        new DropDownOption(this.scene, index, new DropDownLabel(i18next.t(`biome:${Biome[biomeValue].toUpperCase()}`)))
      );
    const biomeDropDown: DropDown = new DropDown(this.scene, 0, 0, biomeOptions, this.updateStarters, DropDownType.HYBRID);
    this.filterBar.addFilter(DropDownColumn.BIOME, i18next.t("filterBar:biomeFilter"), biomeDropDown);

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

    this.pokemonNumberText = addTextObject(this.scene, 6, 140, "", TextStyle.SUMMARY);
    this.pokemonNumberText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonNumberText);

    this.pokemonNameText = addTextObject(this.scene, 6, 127, "", TextStyle.SUMMARY);
    this.pokemonNameText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonNameText);

    const starterSpecies: Species[] = [];

    const starterBoxContainer = this.scene.add.container(speciesContainerX + 6, 9); //115

    this.starterSelectScrollBar = new ScrollBar(this.scene, 161, 12, 5, starterContainerWindow.height - 6, 9);

    starterBoxContainer.add(this.starterSelectScrollBar);

    this.pokerusCursorObjs = new Array(POKERUS_STARTER_COUNT).fill(null).map(() => {
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

      starterSpecies.push(species.speciesId);
      this.speciesLoaded.set(species.speciesId, false);
      this.allSpecies.push(species);

      const starterContainer = new StarterContainer(this.scene, species).setVisible(false);
      this.iconAnimHandler.addOrUpdate(starterContainer.icon, PokemonIconAnimMode.NONE);
      this.starterContainers.push(starterContainer);
      starterBoxContainer.add(starterContainer);
    }

    this.starterSelectContainer.add(starterBoxContainer);

    this.pokemonSprite = this.scene.add.sprite(96, 143, "pkmn__sub");
    this.pokemonSprite.setPipeline(this.scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], ignoreTimeTint: true });
    this.starterSelectContainer.add(this.pokemonSprite);

    this.type1Icon = this.scene.add.sprite(10, 158, getLocalizedSpriteKey("types"));
    this.type1Icon.setScale(0.5);
    this.type1Icon.setOrigin(0, 0);
    this.starterSelectContainer.add(this.type1Icon);

    this.type2Icon = this.scene.add.sprite(10, 166, getLocalizedSpriteKey("types"));
    this.type2Icon.setScale(0.5);
    this.type2Icon.setOrigin(0, 0);
    this.starterSelectContainer.add(this.type2Icon);

    this.starterSelectMessageBoxContainer = this.scene.add.container(0, this.scene.game.canvas.height / 6);
    this.starterSelectMessageBoxContainer.setVisible(false);
    this.starterSelectContainer.add(this.starterSelectMessageBoxContainer);

    this.starterSelectMessageBox = addWindow(this.scene, 1, -1, 318, 28);
    this.starterSelectMessageBox.setOrigin(0, 1);
    this.starterSelectMessageBoxContainer.add(this.starterSelectMessageBox);

    // Instruction for "C" button to toggle showDecorations
    const instructionTextSize = textSettings.instructionTextSize;

    this.goFilterIconElement = new Phaser.GameObjects.Sprite(this.scene, 10, 10, "keyboard", "C.png");
    this.goFilterIconElement.setName("sprite-goFilter-icon-element");
    this.goFilterIconElement.setScale(0.675);
    this.goFilterIconElement.setOrigin(0.0, 0.0);
    this.goFilterLabel = addTextObject(this.scene, 20, 10, i18next.t("pokedexUiHandler:toggleDecorations"), TextStyle.PARTY, { fontSize: instructionTextSize });
    this.goFilterLabel.setName("text-goFilter-label");
    this.starterSelectContainer.add(this.goFilterIconElement);
    this.starterSelectContainer.add(this.goFilterLabel);

    this.message = addTextObject(this.scene, 8, 8, "", TextStyle.WINDOW, { maxLines: 2 });
    this.message.setOrigin(0, 0);
    this.starterSelectMessageBoxContainer.add(this.message);

    // arrow icon for the message box
    this.initPromptSprite(this.starterSelectMessageBoxContainer);

    // Filter bar sits above everything, except the tutorial overlay and message box
    this.starterSelectContainer.bringToTop(this.filterBarContainer);
    this.initTutorialOverlay(this.starterSelectContainer);
    this.starterSelectContainer.bringToTop(this.starterSelectMessageBoxContainer);

    this.scene.eventTarget.addEventListener(BattleSceneEventType.CANDY_UPGRADE_NOTIFICATION_CHANGED, (e) => this.onCandyUpgradeDisplayChanged(e));
  }

  show(args: any[]): boolean {

    if (!this.starterPreferences) {
      this.starterPreferences = StarterPrefs.load();
    }

    this.pokerusSpecies = getPokerusStarters(this.scene);

    // When calling with "refresh", we do not reset the cursor and filters
    if (args.length >= 1 && args[0] === "refresh") {
      return false;
    }

    super.show(args);

    this.starterSelectContainer.setVisible(true);

    this.getUi().bringToTop(this.starterSelectContainer);

    // Making caught pokemon visible icons, etc
    this.allSpecies.forEach((species, s) => {
      const icon = this.starterContainers[s].icon;
      const dexEntry = this.scene.gameData.dexData[species.speciesId];

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

    handleTutorial(this.scene, Tutorial.Pokedex);

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

  /**
   * Set the selections for all filters to their default starting value
   */
  resetFilters() : void {
    this.filterBar.setValsToDefault();
    this.filterText.setValsToDefault();
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
    //    const maxRows = 9;
    const numberOfStarters = this.filteredStarterContainers.length;
    const numOfRows = Math.ceil(numberOfStarters / maxColumns);
    const currentRow = Math.floor(this.cursor / maxColumns);
    const onScreenFirstIndex = this.scrollCursor * maxColumns; // this is first starter index on the screen
    //    const onScreenLastIndex = Math.min(this.filteredStarterContainers.length - 1, onScreenFirstIndex + maxRows * maxColumns - 1); // this is the last starter index on the screen
    //    const onScreenNumberOfStarters = onScreenLastIndex - onScreenFirstIndex + 1;

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

        // if there are possible starters go the first one of the list
        if (numberOfStarters > 0) {
          this.setFilterMode(false);
          this.scrollCursor = 0;
          this.updateScroll();
          this.setCursor(0);
        }
        success = true;

      } else if (this.filterTextMode) {
        this.filterText.resetSelection(this.filterTextCursor);
        success = true;
      } else if (this.starterSpecies.length) {
        this.popStarter(this.starterSpecies.length - 1);
        success = true;
      } else {
        this.tryExit();
        success = true;
      }
    } else if (button === Button.STATS) {
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
          } else if (this.filterBarCursor === this.filterBar.numFilters - 1 && this.starterSpecies.length > 0) {
          // UP from the last filter, move to start button
            this.setFilterMode(false);
            this.cursorObj.setVisible(false);
            success = true;
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
          } else if (this.filterBarCursor === this.filterBar.numFilters - 1 && this.starterSpecies.length > 0) {
          // DOWN from the last filter, move to Pokemon in party if any
            this.setFilterMode(false);
            this.cursorObj.setVisible(false);
            this.starterIconsCursorIndex = 0;
            success = true;
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
              } else {
                this.starterIconsCursorObj.setVisible(false);
                this.setSpecies(null);
              }
              success = true;
            }
            break;
          case Button.LEFT:
            if (this.cursor % 9 !== 0) {
              success = this.setCursor(this.cursor - 1);
            } else {
            // LEFT from filtered Pokemon, on the left edge
              this.filterTextCursor = this.filterText.getNearestFilter(this.filteredStarterContainers[this.cursor]);
              this.setFilterTextMode(true);
              success = true;
            }
            break;
          case Button.RIGHT:
            // is not right edge
            if (this.cursor % 9 < (currentRow < numOfRows - 1 ? 8 : (numberOfStarters - 1) % 9)) {
              success = this.setCursor(this.cursor + 1);
            } else {
            // RIGHT from filtered Pokemon, on the right edge
              this.filterTextCursor = this.filterText.getNearestFilter(this.filteredStarterContainers[this.cursor]);
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
      iconPath = this.scene.inputController?.getIconForLatestInputRecorded(iconSetting);
    }
    iconElement.setTexture(gamepadType, iconPath);
    iconElement.setVisible(true);
    controlLabel.setVisible(true);
  }

  // TODO: add a toggle to return props (show shinies in dex or not)
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
    this.filteredStarterContainers = [];
    this.validStarterContainers = [];

    this.pokerusCursorObjs.forEach(cursor => cursor.setVisible(false));
    this.starterCursorObjs.forEach(cursor => cursor.setVisible(false));

    this.filterBar.updateFilterLabels();
    this.filterText.updateFilterLabels();

    this.validStarterContainers = this.starterContainers;

    // this updates icons for previously saved pokemon
    for (let i = 0; i < this.validStarterContainers.length; i++) {
      const currentFilteredContainer = this.validStarterContainers[i];
      const starterSprite = currentFilteredContainer.icon as Phaser.GameObjects.Sprite;

      const currentDexAttr = this.getCurrentDexProps(currentFilteredContainer.species.speciesId);
      const props = this.getSanitizedProps(this.scene.gameData.getSpeciesDexAttrProps(currentFilteredContainer.species, currentDexAttr));

      starterSprite.setTexture(currentFilteredContainer.species.getIconAtlasKey(props.formIndex, props.shiny, props.variant), currentFilteredContainer.species.getIconId(props.female!, props.formIndex, props.shiny, props.variant));
      currentFilteredContainer.checkIconId(props.female, props.formIndex, props.shiny, props.variant);
    }

    // filter
    this.validStarterContainers.forEach(container => {
      container.setVisible(false);

      container.cost = this.scene.gameData.getSpeciesStarterValue(this.getStarterSpeciesId(container.species.speciesId));

      // First, ensure you have the caught attributes for the species else default to bigint 0
      // TODO: This might be removed depending on how accessible we want the pokedex function to be
      const caughtAttr = this.scene.gameData.dexData[container.species.speciesId]?.caughtAttr || BigInt(0);
      const starterData = this.scene.gameData.starterData[this.getStarterSpeciesId(container.species.speciesId)];
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
      const tmMoves = speciesTmMoves[container.species.speciesId]?.map(m => allMoves[m].name) ?? [];
      const selectedMove1 = this.filterText.getValue(FilterTextRow.MOVE_1);
      const selectedMove2 = this.filterText.getValue(FilterTextRow.MOVE_2);

      const fitsFormMove1 = container.species.forms.some(form => this.hasFormLevelMove(form, selectedMove1));
      const fitsFormMove2 = container.species.forms.some(form => this.hasFormLevelMove(form, selectedMove2));
      const fitsMove1 = levelMoves.includes(selectedMove1) || fitsFormMove1 || eggMoves.includes(selectedMove1) || tmMoves.includes(selectedMove1) || selectedMove1 === this.filterText.defaultText;
      const fitsMove2 = levelMoves.includes(selectedMove2) || fitsFormMove2 || eggMoves.includes(selectedMove2) || tmMoves.includes(selectedMove2) || selectedMove2 === this.filterText.defaultText;
      const fitsMoves = fitsMove1 && fitsMove2;

      // Ability filter
      const abilities = [ container.species.ability1, container.species.ability2, container.species.abilityHidden ].map(a => allAbilities[a].name);
      const selectedAbility1 = this.filterText.getValue(FilterTextRow.ABILITY_1);
      const fitsFormAbility = container.species.forms.some(form => allAbilities[form.ability1].name === selectedAbility1);
      const fitsAbility1 = abilities.includes(selectedAbility1) || fitsFormAbility || selectedAbility1 === this.filterText.defaultText;

      const passive = starterPassiveAbilities[this.getStarterSpeciesId(container.species.speciesId)] ?? 0;
      const selectedAbility2 = this.filterText.getValue(FilterTextRow.ABILITY_2);
      const fitsAbility2 = allAbilities[passive].name === selectedAbility2 || selectedAbility2 === this.filterText.defaultText;

      // If both fields have been set to the same ability, show both ability and passive
      const fitsAbilities = (selectedAbility1 === selectedAbility2) ? fitsAbility1 || fitsAbility2 : fitsAbility1 && fitsAbility2;


      // Gen filter
      const fitsGen =   this.filterBar.getVals(DropDownColumn.GEN).includes(container.species.generation);

      // Type filter
      const fitsType =  this.filterBar.getVals(DropDownColumn.TYPES).some(type => container.species.isOfType((type as number) - 1));

      // Biome filter
      const indexToBiome = new Map(
        Object.values(Biome).map((value, index) => [ index, value ])
      );

      // We get biomes for both the mon and its starters to ensure that evolutions get the correct filters.
      // TODO: We might also need to do it the other way around.
      //      const biomes = catchableSpecies[container.species.speciesId].concat(catchableSpecies[this.getStarterSpeciesId(container.species.speciesId)]).map(b => Biome[b.biome]);
      const biomes = catchableSpecies[container.species.speciesId].map(b => Biome[b.biome]);
      // Only show uncatchable mons if all biomes are selected.
      // TODO: Have an entry for uncatchable mons.
      const showUncatchable = (biomes.length === 0 && this.filterBar.getVals(DropDownColumn.BIOME).length === 35) ? true : false;
      const fitsBiome = this.filterBar.getVals(DropDownColumn.BIOME).some(item => biomes.includes(indexToBiome.get(item))) || showUncatchable;


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

      if (fitsName && fitsAbilities && fitsMoves && fitsGen && fitsBiome && fitsType && fitsCaught && fitsPassive && fitsCostReduction && fitsFavorite && fitsWin && fitsHA && fitsEgg && fitsPokerus) {
        this.filteredStarterContainers.push(container);
      }
    });

    this.starterSelectScrollBar.setTotalRows(Math.max(Math.ceil(this.filteredStarterContainers.length / 9), 1));
    this.starterSelectScrollBar.setScrollCursor(0);

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
    const onScreenLastIndex = Math.min(this.filteredStarterContainers.length - 1, onScreenFirstIndex + maxRows * maxColumns - 1);

    this.starterSelectScrollBar.setScrollCursor(this.scrollCursor);

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

        if (this.showDecorations) {
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

          container.starterPassiveBgs.setVisible(!!this.scene.gameData.starterData[this.getStarterSpeciesId(speciesId)].passiveAttr);
          container.hiddenAbilityIcon.setVisible(!!this.scene.gameData.dexData[speciesId].caughtAttr && !!(this.scene.gameData.starterData[this.getStarterSpeciesId(speciesId)].abilityAttr & 4));
          container.classicWinIcon.setVisible(this.scene.gameData.starterData[this.getStarterSpeciesId(speciesId)].classicWinCount > 0);
          container.favoriteIcon.setVisible(this.starterPreferences[speciesId]?.favorite ?? false);

          // 'Candy Icon' mode
          if (this.scene.candyUpgradeDisplay === 0) {

            if (!starterColors[this.getStarterSpeciesId(speciesId)]) {
              // Default to white if no colors are found
              starterColors[this.getStarterSpeciesId(speciesId)] = [ "ffffff", "ffffff" ];
            }

            // Set the candy colors
            container.candyUpgradeIcon.setTint(argbFromRgba(rgbHexToRgba(starterColors[this.getStarterSpeciesId(speciesId)][0])));
            container.candyUpgradeOverlayIcon.setTint(argbFromRgba(rgbHexToRgba(starterColors[this.getStarterSpeciesId(speciesId)][1])));

            //          this.setUpgradeIcon(container);
          } else if (this.scene.candyUpgradeDisplay === 1) {
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

  setCursor(cursor: integer): boolean {
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
      cursor = Math.max(Math.min(this.filteredStarterContainers.length - 1, cursor), 0);
      changed = super.setCursor(cursor);

      const pos = calcStarterPosition(cursor, this.scrollCursor);
      this.cursorObj.setPosition(pos.x - 1, pos.y + 1);

      const species = this.filteredStarterContainers[cursor]?.species;

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
    let currentFriendship = this.scene.gameData.starterData[this.getStarterSpeciesId(speciesId)].friendship;
    if (!currentFriendship || currentFriendship === undefined) {
      currentFriendship = 0;
    }

    const friendshipCap = getStarterValueFriendshipCap(speciesStarterCosts[speciesId]);

    return { currentFriendship, friendshipCap };
  }

  // setSpecies(null) might be broken; it doesn't hide the sprite on its own.
  setSpecies(species: PokemonSpecies | null) {

    this.speciesStarterDexEntry = species ? this.scene.gameData.dexData[species.speciesId] : null;
    this.dexAttrCursor = species ? this.getCurrentDexProps(species.speciesId) : 0n;

    if (!species && this.scene.ui.getTooltip().visible) {
      this.scene.ui.hideTooltip();
    }

    const starterAttributes : StarterAttributes | null = species ? { ...this.starterPreferences[species.speciesId] } : null;

    if (this.lastSpecies) {
      const dexAttr = this.getCurrentDexProps(this.lastSpecies.speciesId);
      const props = this.getSanitizedProps(this.scene.gameData.getSpeciesDexAttrProps(this.lastSpecies, dexAttr));
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

      this.pokemonNumberText.setText("No. " + padInt(species.speciesId, 4));

      if (starterAttributes?.nickname) {
        const name = decodeURIComponent(escape(atob(starterAttributes.nickname)));
        this.pokemonNameText.setText(name);
      } else {
        this.pokemonNameText.setText(species.name);
      }

      if (this.speciesStarterDexEntry?.caughtAttr) {

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

        const speciesForm = getPokemonSpeciesForm(species.speciesId, 0);
        this.setTypeIcons(speciesForm.type1, speciesForm.type2);

        this.setSpeciesDetails(species, {});

        this.pokemonSprite.clearTint();
        if (this.pokerusSpecies.includes(species)) {
          handleTutorial(this.scene, Tutorial.Pokerus);
        }
      } else {
        this.type1Icon.setVisible(false);
        this.type2Icon.setVisible(false);

        this.setSpeciesDetails(species, {
          forSeen: true
        });
        this.pokemonSprite.setTint(0x808080);
      }
    } else {
      this.pokemonNumberText.setText("");
      this.pokemonNameText.setText(species ? "???" : "");
      this.type1Icon.setVisible(false);
      this.type2Icon.setVisible(false);
      this.pokemonSprite.clearTint();
    }
  }

  setSpeciesDetails(species: PokemonSpecies, options: SpeciesDetails = {}): void {
    let { shiny, formIndex, female, variant, abilityIndex, natureIndex } = options;
    const forSeen: boolean = options.forSeen ?? false;
    this.dexAttrCursor = 0n;
    this.abilityCursor = -1;
    this.natureCursor = -1;

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
      const dexEntry = this.scene.gameData.dexData[species.speciesId];

      //      const caughtAttr = this.scene.gameData.dexData[species.speciesId]?.caughtAttr || BigInt(0);

      if (!dexEntry.caughtAttr) {
        const props = this.getSanitizedProps(this.scene.gameData.getSpeciesDexAttrProps(species, this.getCurrentDexProps(species.speciesId)));
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
            this.pokemonSprite.setVisible(true);
          });
        } else {
          this.pokemonSprite.setVisible(true);
        }
      }

      if (dexEntry.caughtAttr) {

        const speciesForm = getPokemonSpeciesForm(species.speciesId, 0); // TODO: always selecting the first form

        this.setTypeIcons(speciesForm.type1, speciesForm.type2);
      } else {
        this.setTypeIcons(null, null);
      }
    } else {
      //      this.pokemonNumberText.setColor(this.getTextColor(TextStyle.SUMMARY));
      //      this.pokemonNumberText.setShadowColor(this.getTextColor(TextStyle.SUMMARY, true));
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

  popStarter(index: number): void {
    this.starterSpecies.splice(index, 1);
    this.starterAttr.splice(index, 1);
    this.starterAbilityIndexes.splice(index, 1);
    this.starterNatures.splice(index, 1);
    this.starterMovesets.splice(index, 1);

    for (let s = 0; s < this.starterSpecies.length; s++) {
      if (s >= index) {
        this.starterCursorObjs[s].setPosition(this.starterCursorObjs[s + 1].x, this.starterCursorObjs[s + 1].y);
        this.starterCursorObjs[s].setVisible(this.starterCursorObjs[s + 1].visible);
      }
    }
    this.starterCursorObjs[this.starterSpecies.length].setVisible(false);

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
    } else if (this.starterSpecies.length === 0) {
      if (this.filteredStarterContainers.length > 0) {
        // Back to the first Pokemon if there is one
        this.cursorObj.setVisible(true);
        this.setCursor(0 + this.scrollCursor * 9);
      } else {
        // Back to filters
        this.filterBarCursor = Math.max(1, this.filterBar.numFilters - 1);
        this.setFilterMode(true);
      }
    }
  }

  updateStarterValueLabel(starter: StarterContainer): void {
    const speciesId = starter.species.speciesId;
    const baseStarterValue = speciesStarterCosts[speciesId];
    const starterValue = this.scene.gameData.getSpeciesStarterValue(this.getStarterSpeciesId(speciesId));
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
        this.scene.clearPhaseQueue();
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

  clearText() {
    this.starterSelectMessageBoxContainer.setVisible(false);
    super.clearText();
  }

  clear(): void {
    super.clear();

    //    StarterPrefs.save(this.starterPreferences);
    this.cursor = -1;
    this.activeTooltip = undefined;
    this.scene.ui.hideTooltip();

    this.starterSelectContainer.setVisible(false);
    this.blockInput = false;

    while (this.starterSpecies.length) {
      this.popStarter(this.starterSpecies.length - 1);
    }
  }

  setDialogTestMode(isDialogMode: boolean) {
    this.menuMessageBox.setVisible(!isDialogMode);
    this.dialogueMessageBox.setVisible(isDialogMode);
    // If we're testing dialog, we use the same word wrapping as the battle message handler
    this.message.setWordWrapWidth(isDialogMode ? this.scene.ui.getMessageHandler().wordWrapWidth : this.defaultWordWrapWidth);
    this.message.setX(isDialogMode ? this.textPadding + 1 : this.textPadding);
    this.message.setY(isDialogMode ? this.textPadding + 0.4 : this.textPadding);
  }

  checkIconId(icon: Phaser.GameObjects.Sprite, species: PokemonSpecies, female: boolean, formIndex: number, shiny: boolean, variant: number) {
    if (icon.frame.name !== species.getIconId(female, formIndex, shiny, variant)) {
      console.log(`${species.name}'s icon ${icon.frame.name} does not match getIconId with female: ${female}, formIndex: ${formIndex}, shiny: ${shiny}, variant: ${variant}`);
      icon.setTexture(species.getIconAtlasKey(formIndex, false, variant));
      icon.setFrame(species.getIconId(female, formIndex, false, variant));
    }
  }
}
