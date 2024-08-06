import { getVariantTint, getVariantIcon } from "#app/data/variant";
import i18next from "i18next";
import BattleScene from "../battle-scene";
import { Gender, getGenderColor, getGenderSymbol } from "../data/gender";
import { Nature } from "../data/nature";
import PokemonSpecies, { allSpecies, getPokemonSpeciesForm } from "../data/pokemon-species";
import { Type } from "../data/type";
import { AbilityAttr, DexAttr, DexEntry, StarterAttributes, StarterPreferences, StarterPrefs } from "../system/game-data";
import * as Utils from "../utils";
import MessageUiHandler from "./message-ui-handler";
import PokemonIconAnimHandler, { PokemonIconAnimMode } from "./pokemon-icon-anim-handler";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import { addWindow } from "./ui-theme";
import { Species } from "#enums/species";
import {Button} from "#enums/buttons";
import { DropDown, DropDownOption, DropDownState, DropDownType } from "./dropdown";
import { StarterContainer } from "./starter-container";
import { DropDownColumn, FilterBar } from "./filter-bar";
import { ScrollBar } from "./scroll-bar";
import { Variant } from "#app/data/variant";

export type StarterSelectCallback = (starters: Starter[]) => void;

export interface Starter {
  species: PokemonSpecies;
  dexAttr: bigint;
  abilityIndex: integer,
  passive: boolean;
  nature: Nature;
  pokerus: boolean;
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
  private type1Icon: Phaser.GameObjects.Sprite;
  private type2Icon: Phaser.GameObjects.Sprite;
  private pokemonGenderText: Phaser.GameObjects.Text;
  private pokemonGenderText2: Phaser.GameObjects.Text;
  private pokemonUncaughtText: Phaser.GameObjects.Text;

  private shinyContainer: Phaser.GameObjects.Container;
  private formsContainer: Phaser.GameObjects.Container;
  private genderContainer: Phaser.GameObjects.Container;

  private starterSelectMessageBox: Phaser.GameObjects.NineSlice;
  private starterSelectMessageBoxContainer: Phaser.GameObjects.Container;

  private starterIconsCursorXOffset: number = -3;
  private starterIconsCursorYOffset: number = 1;
  private starterIconsCursorIndex: number;
  private filterMode: boolean;
  private dexAttrCursor: bigint = 0n;
  private filterBarCursor: integer = 0;
  private scrollCursor: number;

  private allSpecies: PokemonSpecies[] = [];
  private lastSpecies: PokemonSpecies;
  private speciesLoaded: Map<Species, boolean> = new Map<Species, boolean>();
  public starterSpecies: PokemonSpecies[] = [];
  private starterAttr: bigint[] = [];
  private speciesStarterDexEntry: DexEntry;

  private assetLoadCancelled: Utils.BooleanHolder;
  public cursorObj: Phaser.GameObjects.Image;
  private starterIcons: Phaser.GameObjects.Sprite[];
  private starterIconsCursorObj: Phaser.GameObjects.Image;
  // private starterValueLabels: Phaser.GameObjects.Text[];
  // private shinyIcons: Phaser.GameObjects.Image[][];
  // private hiddenAbilityIcons: Phaser.GameObjects.Image[];
  // private classicWinIcons: Phaser.GameObjects.Image[];
  // private candyUpgradeIcon: Phaser.GameObjects.Image[];
  // private candyUpgradeOverlayIcon: Phaser.GameObjects.Image[];
  //
  private iconAnimHandler: PokemonIconAnimHandler;

  //variables to keep track of the dynamically rendered list of instruction prompts for starter select

  private starterPreferences: StarterPreferences;

  protected blockInput: boolean = false;

  constructor(scene: BattleScene) {
    super(scene, Mode.POKEDEX);
  }

  setup() {
    const ui = this.getUi();

    this.starterSelectContainer = this.scene.add.container(0, -this.scene.game.canvas.height / 6);
    this.starterSelectContainer.setVisible(false);
    ui.add(this.starterSelectContainer);

    const bgColor = this.scene.add.rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6, 0x006860);
    bgColor.setOrigin(0, 0);
    this.starterSelectContainer.add(bgColor);

    const starterSelectBg = this.scene.add.image(0, 0, "pokedex_bg");
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
    this.filterBar.addFilter(i18next.t("filterBar:genFilter"), new DropDown(this.scene, 0, 0, genOptions, this.updateStarters, DropDownType.MULTI));
    this.filterBar.defaultGenVals = this.filterBar.getVals(DropDownColumn.GEN);
    // set gen filter to all off except for the I GEN
    for (const option of genOptions) {
      if (option.val !== 1) {
        option.setOptionState(DropDownType.MULTI ,DropDownState.OFF);
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
    this.filterBar.addFilter(i18next.t("filterBar:typeFilter"), new DropDown(this.scene, 0, 0, typeOptions, this.updateStarters, DropDownType.MULTI, 0.5));
    this.filterBar.defaultTypeVals = this.filterBar.getVals(DropDownColumn.TYPES);

    // shiny filter
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

    const shinyOptions = [
      new DropDownOption(this.scene, "SHINY3", null, shiny3Sprite),
      new DropDownOption(this.scene, "SHINY2", null, shiny2Sprite),
      new DropDownOption(this.scene, "SHINY", null, shiny1Sprite),
      new DropDownOption(this.scene, "NORMAL", i18next.t("filterBar:normal")),
      new DropDownOption(this.scene, "UNCAUGHT", i18next.t("filterBar:uncaught")),
    ];

    this.filterBar.addFilter("Owned", new DropDown(this.scene, 0, 0, shinyOptions, this.updateStarters, DropDownType.MULTI));
    this.filterBar.defaultShinyVals = this.filterBar.getVals(DropDownColumn.SHINY);


    // unlocks filter
    const unlocksOptions = [
      new DropDownOption(this.scene, "PASSIVE", ["Passive", i18next.t("filterBar:passiveUnlocked"), i18next.t("filterBar:passiveLocked")], null, DropDownState.OFF),
    ];

    this.filterBar.addFilter(i18next.t("filterBar:unlocksFilter"), new DropDown(this.scene, 0, 0, unlocksOptions, this.updateStarters, DropDownType.TRI));
    this.filterBar.defaultUnlocksVals = this.filterBar.getVals(DropDownColumn.UNLOCKS);

    // misc filter
    const miscOptions = [
      new DropDownOption(this.scene, "WIN", ["Win", "Win - Yes", "Win - No"], null, DropDownState.OFF),
    ];
    this.filterBar.addFilter("Misc", new DropDown(this.scene, 0, 0, miscOptions, this.updateStarters, DropDownType.TRI));
    this.filterBar.defaultMiscVals = this.filterBar.getVals(DropDownColumn.MISC);

    // sort filter
    const sortOptions = [
      new DropDownOption(this.scene, 0, i18next.t("filterBar:sortByNumber")),
      new DropDownOption(this.scene, 1, i18next.t("filterBar:sortByCost"), null, DropDownState.OFF),
      new DropDownOption(this.scene, 2, i18next.t("filterBar:sortByCandies"), null, DropDownState.OFF),
      new DropDownOption(this.scene, 3, i18next.t("filterBar:sortByIVs"), null, DropDownState.OFF),
      new DropDownOption(this.scene, 4, i18next.t("filterBar:sortByName"), null, DropDownState.OFF)];
    this.filterBar.addFilter(i18next.t("filterBar:sortFilter"), new DropDown(this.scene, 0, 0, sortOptions, this.updateStarters, DropDownType.SINGLE));
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

    this.pokemonNameText = addTextObject(this.scene, 6, 15, "", TextStyle.SUMMARY);
    this.pokemonNameText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonNameText);

    this.shinyContainer = this.scene.add.container(6, 111);
    this.shinyContainer.setVisible(false);

    this.formsContainer = this.scene.add.container(3, 128);
    this.formsContainer.setVisible(false);

    this.genderContainer = this.scene.add.container(85, 15);
    this.genderContainer.setVisible(false);

    this.pokemonGenderText = addTextObject(this.scene, 7, 0, "", TextStyle.SUMMARY_ALT);
    this.pokemonGenderText.setOrigin(0, 0);
    this.genderContainer.add(this.pokemonGenderText);

    this.pokemonGenderText2 = addTextObject(this.scene, 0, 0, "", TextStyle.SUMMARY_ALT);
    this.pokemonGenderText2.setOrigin(0, 0);
    this.genderContainer.add(this.pokemonGenderText2);
    this.starterSelectContainer.add(this.genderContainer);

    this.pokemonUncaughtText = addTextObject(this.scene, 6, 127, i18next.t("starterSelectUiHandler:uncaught"), TextStyle.SUMMARY_ALT, { fontSize: "56px" });
    this.pokemonUncaughtText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonUncaughtText);


    const starterSpecies: Species[] = [];

    const starterBoxContainer = this.scene.add.container(115, 9);

    this.starterSelectScrollBar = new ScrollBar(this.scene, 161, 12, 0);

    starterBoxContainer.add(this.starterSelectScrollBar);

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
      this.starterContainer.push(starterContainer);
      starterBoxContainer.add(starterContainer);
    }

    this.starterSelectContainer.add(starterBoxContainer);

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

    this.starterSelectMessageBoxContainer = this.scene.add.container(0, this.scene.game.canvas.height / 6);
    this.starterSelectMessageBoxContainer.setVisible(false);
    this.starterSelectContainer.add(this.starterSelectMessageBoxContainer);

    this.starterSelectMessageBox = addWindow(this.scene, 1, -1, 318, 28);
    this.starterSelectMessageBox.setOrigin(0, 1);
    this.starterSelectMessageBoxContainer.add(this.starterSelectMessageBox);

    this.message = addTextObject(this.scene, 8, 8, "", TextStyle.WINDOW, { maxLines: 2 });
    this.message.setOrigin(0, 0);
    this.starterSelectMessageBoxContainer.add(this.message);

    this.starterSelectContainer.bringToTop(this.filterBarContainer);
  }

  show(args: any[]): boolean {
    console.log("SHOW");
    if (!this.starterPreferences) {
      // starterPreferences haven't been loaded yet
      this.starterPreferences = StarterPrefs.load();
    }
    // if (args.length >= 1 && args[0] instanceof Function) {
    super.show(args);

    this.starterSelectContainer.setVisible(true);

    this.setCursor(0);

    this.updateStarters();

    // this.updateSpeciesIcons();

    this.getUi().moveTo(this.starterSelectContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    return true;
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
   * Determines if 'Animation' based upgrade notifications should be shown
   * @returns true if upgrade notifications are enabled and set to display an 'Animation'
   */
  isUpgradeAnimationEnabled(): boolean {
    return this.scene.candyUpgradeNotification !== 0 && this.scene.candyUpgradeDisplay === 1;
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
    // const onScreenFirstRow = Math.floor(onScreenFirstIndex / maxColumns);
    const onScreenCurrentRow = Math.floor((this.cursor - onScreenFirstIndex) / maxColumns);

    // console.log("this.cursor: ", this.cursor, "this.scrollCursor" , this.scrollCursor, "numberOfStarters: ", numberOfStarters, "numOfRows: ", numOfRows, "currentRow: ", currentRow, "onScreenFirstIndex: ", onScreenFirstIndex, "onScreenLastIndex: ", onScreenLastIndex, "onScreenNumberOfStarters: ", onScreenNumberOfStarters, "onScreenNumberOfRow: ", onScreenNumberOfRows, "onScreenCurrentRow: ", onScreenCurrentRow);


    let success = false;

    if (button === Button.CANCEL) {
      if (this.filterMode && this.filterBar.openDropDown) {
        this.filterBar.toggleDropDown(this.filterBarCursor);
        success = true;
      } else {
        this.backToMenu();
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

      // let starterAttributes = this.starterPreferences[this.lastSpecies.speciesId];
      // if (!starterAttributes) {
      //   starterAttributes = this.starterPreferences[this.lastSpecies.speciesId] = {};
      // }
      switch (button) {
      case Button.ACTION:
        const pkmn = this.filteredStarterContainers[this.cursor]?.species;
        if (this.scene.gameData.dexData[pkmn.speciesId]?.caughtAttr) {
          console.log(pkmn);
          success = true;
        } else {
          console.log("not caught yet");
          success = false;
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


    return success;
  }

  updateStarters = () => {
    this.scrollCursor = 0;
    this.filteredStarterContainers = [];

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
      const isPassiveUnlocked = this.scene.gameData.starterData[container.species.getRootSpeciesId()].passiveAttr > 0;
      const isWin = this.scene.gameData.starterData[container.species.getRootSpeciesId()].classicWinCount > 0;
      const isNotWin = this.scene.gameData.starterData[container.species.getRootSpeciesId()].classicWinCount === 0;
      const isUndefined = this.scene.gameData.starterData[container.species.getRootSpeciesId()].classicWinCount === undefined;

      const fitsGen =   this.filterBar.getVals(DropDownColumn.GEN).includes(container.species.generation);

      const fitsType =  this.filterBar.getVals(DropDownColumn.TYPES).some(type => container.species.isOfType((type as number) - 1));

      const fitsShiny = this.filterBar.getVals(DropDownColumn.SHINY).some(variant => {
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

      const fitsPassive = this.filterBar.getVals(DropDownColumn.UNLOCKS).some(unlocks => {
        if (unlocks.val === "PASSIVE" && unlocks.state === DropDownState.INCLUDE) {
          return isPassiveUnlocked;
        } else if (unlocks.val === "PASSIVE" && unlocks.state === DropDownState.EXCLUDE) {
          return !isPassiveUnlocked;
        } else if (unlocks.val === "PASSIVE" && unlocks.state === DropDownState.OFF) {
          return true;
        }
      });

      const fitsWin = this.filterBar.getVals(DropDownColumn.MISC).some(misc => {
        if (container.species.speciesId < 10) {
        }
        if (misc.val === "WIN" && misc.state === DropDownState.INCLUDE) {
          return isWin;
        } else if (misc.val === "WIN" && misc.state === DropDownState.EXCLUDE) {
          return isNotWin || isUndefined;
        } else if (misc.val === "WIN" && misc.state === DropDownState.OFF) {
          return true;
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
    const maxColumns = 9;
    const maxRows = 9;
    const onScreenFirstIndex = this.scrollCursor * maxColumns;
    const onScreenLastIndex = Math.min(this.filteredStarterContainers.length - 1, onScreenFirstIndex + maxRows * maxColumns -1);

    this.starterSelectScrollBar.setPage(this.scrollCursor);

    this.filteredStarterContainers.forEach((container, i) => {
      const pos = calcStarterPosition(i, this.scrollCursor);
      container.setPosition(pos.x, pos.y);
      if (i < onScreenFirstIndex || i > onScreenLastIndex) {
        container.setVisible(false);

        return;
      } else {
        container.setVisible(true);
        if (this.scene.gameData.dexData[container.species.speciesId]?.caughtAttr) {
          container.icon.clearTint();
        } else if (this.scene.gameData.dexData[container.species.speciesId]?.seenAttr) {
          container.icon.setTint(0x808080);
        } else {
          container.icon.setTint(0x000000);
        }


        container.label.setVisible(false);
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
        this.setSpecies(species);
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

    const starterAttributes : StarterAttributes = species ? {...this.starterPreferences[species.getRootSpeciesId()]} : null;
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

      const abilityAttr = this.scene.gameData.starterData[species.getRootSpeciesId()].abilityAttr;
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

    if (this.lastSpecies) {
      const speciesIndex = this.allSpecies.indexOf(this.lastSpecies);
      const lastSpeciesIcon = this.starterContainer[speciesIndex].icon;
      this.checkIconId(lastSpeciesIcon, this.lastSpecies, false, 0, false, 0);
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
        this.shinyContainer.removeAll();
        this.shinyContainer.setVisible(true);
        this.formsContainer.removeAll();
        this.formsContainer.setVisible(true);
        this.genderContainer.setVisible(true);

        const shinies = [
          {name:"yellow"},
          {name:"blue"},
          {name:"red"}
        ];
        shinies.forEach((_, i) => {
          const shinyDetails = [
            {
              seen: (BigInt(this.speciesStarterDexEntry.seenAttr) & 16n) !== 0n,
              caught: (BigInt(this.speciesStarterDexEntry.caughtAttr) & 16n) !== 0n
            },
            {
              seen: (BigInt(this.speciesStarterDexEntry.seenAttr) & 32n) !== 0n,
              caught: (BigInt(this.speciesStarterDexEntry.caughtAttr) & 32n) !== 0n
            },
            {
              seen: (BigInt(this.speciesStarterDexEntry.seenAttr) & 64n) !== 0n,
              caught: (BigInt(this.speciesStarterDexEntry.caughtAttr) & 64n) !== 0n
            },
          ];



          const icon = this.scene.add.sprite(i*30, 0, species.getIconAtlasKey(0));
          icon.setScale(0.5);
          icon.setOrigin(0, 0);
          icon.setTexture(this.lastSpecies.getIconAtlasKey(0, true, i));
          icon.setFrame(this.lastSpecies.getIconId(false, 0, true, i));
          const checkedIcon = this.checkIconId(icon, species, false, 0, true, i);
          if (checkedIcon) {
            icon.setTexture(checkedIcon.texture, checkedIcon.frame);
          }

          if (shinyDetails[i].caught) {
            icon.clearTint();
          } else if (shinyDetails[i].seen) {
            icon.setTint(0x808080);
          } else {
            icon.setTint(0);
          }


          this.shinyContainer.add(icon);
        });
        this.starterSelectContainer.add(this.shinyContainer);

        for (let a = 0; a < species.forms.length; a++) {

          const {itemCols, paddingLeft, paddingTop} = this.getFormContainerSizes(species.forms.length);

          const x = (a % itemCols) * paddingLeft;
          const y = Math.floor(a / itemCols) * paddingTop;

          const icon = this.scene.add.sprite(x, y, species.getIconAtlasKey(0));
          icon.setTexture(`pokemon_icons_${species.generation}`);
          const frame = species.getIconId(false, a);
          icon.setFrame(frame);
          icon.setOrigin(0, 0);
          icon.setScale(0.5);

          const caught = (BigInt(this.speciesStarterDexEntry.caughtAttr) & BigInt(Math.pow(2,7+a))) !== 0n;
          const seen = (BigInt(this.speciesStarterDexEntry.seenAttr) & BigInt(Math.pow(2,7+a))) !== 0n;

          if (caught) {
            icon.clearTint();
          } else if (seen) {
            icon.setTint(0x808080);
          } else {
            icon.setTint(0);
          }

          this.formsContainer.add(icon);
        }
        this.starterSelectContainer.add(this.formsContainer);

        this.pokemonUncaughtText.setVisible(false);



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

        this.setSpeciesDetails(species);

        this.setTypeIcons(species.type1, species.type2);

        this.pokemonSprite.clearTint();
      } else {
        this.type1Icon.setVisible(false);
        this.type2Icon.setVisible(false);
        this.pokemonUncaughtText.setVisible(true);

        this.genderContainer.setVisible(false);
        this.shinyContainer.setVisible(false);
        this.formsContainer.setVisible(false);

        this.setSpeciesDetails(species, true);
        this.pokemonSprite.setTint(0x808080);
      }
    } else {
      this.pokemonNumberText.setText(Utils.padInt(0, 4));
      this.pokemonNameText.setText(species ? "???" : "");
      this.type1Icon.setVisible(false);
      this.type2Icon.setVisible(false);
      this.pokemonUncaughtText.setVisible(!!species);

      this.genderContainer.setVisible(false);
      this.shinyContainer.setVisible(false);
      this.formsContainer.setVisible(false);

      this.setSpeciesDetails(species, false);
      this.pokemonSprite.clearTint();
    }
  }



  setSpeciesDetails(species: PokemonSpecies, forSeen: boolean = false): void {
    let shiny = false;
    let formIndex = 0;
    let female = false;
    let variant: Variant = 0;
    let abilityIndex = 0;
    let natureIndex = 0;

    this.dexAttrCursor = 0n;

    if (species?.forms?.find(f => f.formKey === "female")) {
      if (female !== undefined) {
        formIndex = female ? 1 : 0;
      } else if (formIndex !== undefined) {
        female = formIndex === 1;
      }
    }

    if (species) {
      this.dexAttrCursor |= DexAttr.NON_SHINY;
      this.dexAttrCursor |= DexAttr.MALE;
      this.dexAttrCursor |= DexAttr.DEFAULT_VARIANT;
      this.dexAttrCursor |= this.scene.gameData.getFormAttr(formIndex);
    }

    this.pokemonSprite.setVisible(false);

    if (this.assetLoadCancelled) {
      this.assetLoadCancelled.value = true;
      this.assetLoadCancelled = null;
    }

    if (species) {
      const dexEntry = this.scene.gameData.dexData[species.speciesId];
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
        const starterIndex = this.starterSpecies.indexOf(species);

        if (starterIndex > -1) {
          this.starterAttr[starterIndex] = this.dexAttrCursor;
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
          this.pokemonSprite.setVisible(true);
        });


        const starterSprite = this.filteredStarterContainers[this.cursor].icon as Phaser.GameObjects.Sprite;
        starterSprite.setTexture(species.getIconAtlasKey(formIndex, shiny, variant), species.getIconId(female, formIndex, shiny, variant));
        this.filteredStarterContainers[this.cursor].checkIconId(female, formIndex, shiny, variant);
      }

      if (dexEntry.caughtAttr && species.malePercent !== null) {
        this.setGenderIcons(species);
      } else {
        this.pokemonGenderText.setText("");
        this.pokemonGenderText2.setText("");
      }

      if (dexEntry.caughtAttr) {
        const speciesForm = getPokemonSpeciesForm(species.speciesId, formIndex);
        this.setTypeIcons(speciesForm.type1, speciesForm.type2);
      } else {
        this.setTypeIcons(null, null);
      }
    } else {
      this.shinyOverlay.setVisible(false);
      this.pokemonNumberText.setColor(this.getTextColor(TextStyle.SUMMARY));
      this.pokemonNumberText.setShadowColor(this.getTextColor(TextStyle.SUMMARY, true));
      this.pokemonGenderText.setText("");
      this.setTypeIcons(null, null);
    }


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

  clearText() {
    this.starterSelectMessageBoxContainer.setVisible(false);
    super.clearText();
  }

  clear(): void {
    super.clear();

    StarterPrefs.save(this.starterPreferences);
    this.cursor = -1;
    this.starterSelectContainer.setVisible(false);
    this.blockInput = false;
  }

  checkIconId(icon: Phaser.GameObjects.Sprite, species: PokemonSpecies, female, formIndex, shiny, variant) {
    if (icon.frame.name !== species.getIconId(female, formIndex, shiny, variant)) {
      console.log(icon.frame.name, species.getIconId(female, formIndex, shiny, variant));
      console.log(`${species.name}'s variant icon does not exist. Replacing with default.`);
      icon.setTexture(species.getIconAtlasKey(formIndex, false, variant));
      icon.setFrame(species.getIconId(female, formIndex, false, variant));
      icon.setTexture("pokemon_icons_0");
      icon.setFrame("unknown");
      return {
        frame: species.getIconId(female, formIndex, false, variant),
        texture: species.getIconAtlasKey(formIndex, false, variant)
      };
    }
  }

  backToMenu() {
    this.scene.clearPhaseQueue();
    this.scene.ui.revertMode();
  }

  setGenderIcons(species: PokemonSpecies): void {
    const dexEntry = this.scene.gameData.dexData[species.speciesId];
    const isOnlyMale = species.malePercent === 100;
    const isOnlyFemale = species.malePercent === 0;
    const isMale = (BigInt(dexEntry.caughtAttr) & 4n) !== 0n;
    const isFemale = (BigInt(dexEntry.caughtAttr) & 8n) !== 0n;

    this.pokemonGenderText.setVisible(false);
    this.pokemonGenderText2.setVisible(false);

    if (isOnlyMale || isOnlyFemale) {
      this.pokemonGenderText.setVisible(true);
      this.pokemonGenderText.clearTint();
      this.pokemonGenderText.setText(getGenderSymbol(isMale ? Gender.MALE : Gender.FEMALE));
      this.pokemonGenderText.setColor(getGenderColor(isMale ? Gender.MALE : Gender.FEMALE));
      this.pokemonGenderText.setShadowColor(getGenderColor(isMale ? Gender.MALE : Gender.FEMALE, true));
    } else {
      this.pokemonGenderText.setVisible(true);
      this.pokemonGenderText.clearTint();
      this.pokemonGenderText.setText(getGenderSymbol(Gender.MALE));
      this.pokemonGenderText.setColor(getGenderColor(Gender.MALE));
      this.pokemonGenderText.setShadowColor(getGenderColor(Gender.MALE, true));

      this.pokemonGenderText2.setVisible(true);
      this.pokemonGenderText2.clearTint();
      this.pokemonGenderText2.setText(getGenderSymbol(Gender.FEMALE));
      this.pokemonGenderText2.setColor(getGenderColor(Gender.FEMALE));
      this.pokemonGenderText2.setShadowColor(getGenderColor(Gender.FEMALE, true));
      if (!isMale) {
        this.pokemonGenderText.setTint(0);
      }
      if (!isFemale) {
        this.pokemonGenderText2.setTint(0);
      }
    }
  }

  getFormContainerSizes(formsLength: number) {
    switch (formsLength) {
    case 28:  // Unown
      return { paddingLeft: 12, paddingTop: 11, itemCols: 8 };
    case 18:  // Silvally
      return { paddingLeft: 16, paddingTop: 16, itemCols: 6 };
    case 19:  // Arceus
    case 20:  // Vivilion
      return { paddingLeft: 14, paddingTop: 16, itemCols: 7 };
    default:
      return { paddingLeft: 18, paddingTop: 18, itemCols: 5 };
    }

  }
}
