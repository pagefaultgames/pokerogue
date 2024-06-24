import i18next from "i18next";
import BattleScene from "../battle-scene";
import { Gender, getGenderColor, getGenderSymbol } from "../data/gender";
import PokemonSpecies, { allSpecies } from "../data/pokemon-species";
import { Type } from "../data/type";
import { DexEntry, StarterPreferences, StarterPrefs } from "../system/game-data";
import * as Utils from "../utils";
import MessageUiHandler from "./message-ui-handler";
import PokemonIconAnimHandler, { PokemonIconAnimMode } from "./pokemon-icon-anim-handler";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import { addWindow } from "./ui-theme";
import { Species } from "#enums/species";
import {Button} from "#enums/buttons";

export interface Starter {
  species: PokemonSpecies;
  dexAttr: bigint;
}

/**
 * Calculates the icon position for a Pokemon of a given UI index
 * @param index UI index to calculate the icon position of
 * @returns An interface with an x and y property
 */
function calcIconPosition(index: number): {x: number, y: number} {
  const x = (index % 9) * 18;
  const y = Math.floor(index / 9) * 18;

  return {x: x, y: y};
}

/**
 * Calculates the {@linkcode Phaser.GameObjects.Sprite} position for a Pokemon of a given UI index
 * @param index UI index to calculate the icon position of
 * @returns An interface with an x and y property
 */
function calcSpritePosition(index: number): {x: number, y: number} {
  const position = calcIconPosition(index);

  return {x: position.x - 2, y: position.y + 2};
}

const gens = [
  i18next.t("starterSelectUiHandler:gen1"),
  i18next.t("starterSelectUiHandler:gen2"),
  i18next.t("starterSelectUiHandler:gen3"),
  i18next.t("starterSelectUiHandler:gen4"),
  i18next.t("starterSelectUiHandler:gen5"),
  i18next.t("starterSelectUiHandler:gen6"),
  i18next.t("starterSelectUiHandler:gen7"),
  i18next.t("starterSelectUiHandler:gen8"),
  i18next.t("starterSelectUiHandler:gen9")
];

export default class PokedexUiHandler2 extends MessageUiHandler {
  private starterSelectContainer: Phaser.GameObjects.Container;
  private starterSelectGenIconContainers: Phaser.GameObjects.Container[];
  private pokemonNumberText: Phaser.GameObjects.Text;
  private pokemonSprite: Phaser.GameObjects.Sprite;
  private pokemonNameText: Phaser.GameObjects.Text;
  private type1Icon: Phaser.GameObjects.Sprite;
  private type2Icon: Phaser.GameObjects.Sprite;
  private pokemonGenderText: Phaser.GameObjects.Text;
  private pokemonGenderText2: Phaser.GameObjects.Text;
  private pokemonUncaughtText: Phaser.GameObjects.Text;
  private genOptionsText: Phaser.GameObjects.Text;

  private speciesStarterDexEntry: DexEntry;

  private shinyContainer: Phaser.GameObjects.Container;
  private formsContainer: Phaser.GameObjects.Container;
  private unlockedContainer: Phaser.GameObjects.Container;
  private genderContainer: Phaser.GameObjects.Container;

  private genMode: boolean;
  private genCursor: integer = 0;
  private genScrollCursor: integer = 0;

  private genSpecies: PokemonSpecies[][] = [];
  private lastSpecies: PokemonSpecies;
  private speciesLoaded: Map<Species, boolean> = new Map<Species, boolean>();

  public starterCursors: integer[] = [];

  private assetLoadCancelled: Utils.BooleanHolder;
  public cursorObj: Phaser.GameObjects.Image;
  private genCursorObj: Phaser.GameObjects.Image;
  private genCursorHighlightObj: Phaser.GameObjects.Image;
  private iconAnimHandler: PokemonIconAnimHandler;

  private starterPreferences: StarterPreferences;

  protected blockInput: boolean = false;

  constructor(scene: BattleScene) {
    super(scene, Mode.STARTER_SELECT);
  }

  setup() {
    console.log("SETUP");
    const ui = this.getUi();

    this.starterSelectContainer = this.scene.add.container(0, -this.scene.game.canvas.height / 6);
    this.starterSelectContainer.setVisible(false);
    ui.add(this.starterSelectContainer);

    const bgColor = this.scene.add.rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6, 0x006860);
    bgColor.setOrigin(0, 0);
    this.starterSelectContainer.add(bgColor);

    const starterSelectBg = this.scene.add.image(0, 0, "pokedex_select_bg");
    starterSelectBg.setOrigin(0, 0);
    this.starterSelectContainer.add(starterSelectBg);

    const starterContainerWindow = addWindow(this.scene, 141, 1, 178, 178);
    const genContainerWindow = addWindow(this.scene, 107, 1, 34, 126);

    this.starterSelectContainer.add(genContainerWindow);
    this.starterSelectContainer.add(starterContainerWindow);

    if (!this.scene.uiTheme) {
      starterContainerWindow.setVisible(false);
    }

    this.iconAnimHandler = new PokemonIconAnimHandler();
    this.iconAnimHandler.setup(this.scene);

    this.pokemonNumberText = addTextObject(this.scene, 17, 1, "0000", TextStyle.SUMMARY);
    this.pokemonNumberText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonNumberText);

    this.pokemonUncaughtText = addTextObject(this.scene, 6, 114, i18next.t("starterSelectUiHandler:uncaught"), TextStyle.SUMMARY_ALT, { fontSize: "56px" });
    this.pokemonUncaughtText.setOrigin(0, 0);
    this.starterSelectContainer.add(this.pokemonUncaughtText);


    // The font size should be set per language
    this.genOptionsText = addTextObject(this.scene, 124, 7, "", TextStyle.WINDOW, { fontSize: 72, lineSpacing: 39, align: "center" });
    this.genOptionsText.setShadowOffset(4.5, 4.5);
    this.genOptionsText.setOrigin(0.5, 0);
    this.starterSelectContainer.add(this.genOptionsText);

    this.updateGenOptions();

    this.starterSelectGenIconContainers = new Array(gens.length).fill(null).map((_, i) => {
      const container = this.scene.add.container(151, 9);
      if (i) {
        container.setVisible(false);
      }
      this.starterSelectContainer.add(container);
      return container;
    });

    this.cursorObj = this.scene.add.image(0, 0, "select_cursor");
    this.cursorObj.setOrigin(0, 0);
    this.starterSelectContainer.add(this.cursorObj);

    this.genCursorHighlightObj = this.scene.add.image(111, 5, "select_gen_cursor_highlight");
    this.genCursorHighlightObj.setOrigin(0, 0);
    this.starterSelectContainer.add(this.genCursorHighlightObj);

    this.genCursorObj = this.scene.add.image(111, 5, "select_gen_cursor");
    this.genCursorObj.setVisible(false);
    this.genCursorObj.setOrigin(0, 0);
    this.starterSelectContainer.add(this.genCursorObj);

    const starterSpecies: Species[] = [];

    for (let g = 0; g < this.starterSelectGenIconContainers.length; g++) {
      let s = 0;
      this.genSpecies.push([]);

      for (const species of allSpecies.filter(a => a.generation === g+1)) {
        starterSpecies.push(species.speciesId);
        this.speciesLoaded.set(species.speciesId, false);
        this.genSpecies[g].push(species);
        const position = calcIconPosition(s);
        const icon = this.scene.add.sprite(position.x - 2, position.y + 2, species.getIconAtlasKey(0, false, 0));
        icon.setScale(0.5);
        icon.setOrigin(0, 0);
        icon.setFrame(species.getIconId(false, 0, false, 0));
        const checkedIcon = this.checkIconId(icon, species, false, 0, false, 0);
        if (checkedIcon) {
          icon.setTexture(checkedIcon.texture, checkedIcon.frame);
        }
        icon.setTint(0);
        this.starterSelectGenIconContainers[g].add(icon);
        this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.NONE);
        s++;
      }
    }

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

    const pokemonCaughtIcon = this.scene.add.sprite(1, 0, "items", "pb");
    pokemonCaughtIcon.setOrigin(0, 0);
    pokemonCaughtIcon.setScale(0.75);

    this.shinyContainer = this.scene.add.container(6, 111);
    this.shinyContainer.setVisible(false);

    this.formsContainer = this.scene.add.container(3, 130);
    this.formsContainer.setVisible(false);

    this.genderContainer = this.scene.add.container(85, 15);
    this.genderContainer.setVisible(false);

    this.unlockedContainer = this.scene.add.container(0, 0);
    this.unlockedContainer.setVisible(false);

    this.pokemonNameText = addTextObject(this.scene, 6, 15, "", TextStyle.SUMMARY);
    this.pokemonNameText.setOrigin(0, 0);
    this.pokemonNameText.setStroke("#000000", 8);
    this.starterSelectContainer.add(this.pokemonNameText);
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
    this.setGenMode(false);
    this.setCursor(0);
    this.setGenMode(true);
    this.setCursor(0);



    this.updateSpeciesIcons();

    this.getUi().moveTo(this.starterSelectContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    return true;
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);

    if (text?.indexOf("\n") === -1) {
      this.message.setY(-22);
    } else {
      this.message.setY(-37);
    }

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

    const position = calcSpritePosition(this.genSpecies[species.generation - 1].indexOf(species));
    icon.y = position.y;
  }

  processInput(button: Button): boolean {
    if (this.blockInput) {
      return false;
    }
    const ui = this.getUi();

    let success = false;

    if (button === Button.CANCEL) {
      this.backToMenu();
    } else if (this.genMode) {
      switch (button) {
      case Button.UP:
        if (this.genCursor) {
          success = this.setCursor(this.genCursor - 1);
        }
        break;
      case Button.DOWN:
        if (this.genCursor < 6) {
          success = this.setCursor(this.genCursor + 1);
        } else {
          this.setGenMode(true);
          success = true;
        }
        break;
      case Button.LEFT:
        success = this.setGenMode(false);
        this.setCursor(this.cursor + 8);
        break;
      case Button.RIGHT:
        success = this.setGenMode(false);
        break;
      }
    } else {
      const genStarters = this.starterSelectGenIconContainers[this.getGenCursorWithScroll()].getAll().length;
      const rows = Math.ceil(genStarters / 9);
      const row = Math.floor(this.cursor / 9);
      // prepare persistent starter data to store changes
      let starterAttributes = this.starterPreferences[this.lastSpecies.speciesId];
      if (!starterAttributes) {
        starterAttributes =
          this.starterPreferences[this.lastSpecies.speciesId] = {};
      }
      switch (button) {
      case Button.UP:
        if (row) {
          success = this.setCursor(this.cursor - 9);
        } else {
          // when strictly opposite starter based on rows length
          // does not exits, set cursor on the second to last row
          if (this.cursor + (rows - 1) * 9 > genStarters - 1) {
            success = this.setCursor(this.cursor + (rows - 2) * 9);
          } else {
            success = this.setCursor(this.cursor + (rows - 1) * 9);
          }
        }
        break;
      case Button.DOWN:
        if (row < rows - 2 || (row < rows - 1 && this.cursor % 9 <= (genStarters - 1) % 9)) {
          success = this.setCursor(this.cursor + 9);
        } else {
          // if there is no starter below while being on the second to
          // last row, adjust cursor position with one line less
          if (row === rows - 2 && this.cursor + 9 > genStarters - 1) {
            success = this.setCursor(this.cursor - (rows - 2) * 9);
          } else {
            success = this.setCursor(this.cursor - (rows - 1) * 9);
          }
        }
        break;
      case Button.LEFT:
        if (this.cursor % 9) {
          success = this.setCursor(this.cursor - 1);
        } else {
          success = this.setGenMode(true);
        }
        break;
      case Button.RIGHT:
        if (this.cursor % 9 < (row < rows - 1 ? 8 : (genStarters - 1) % 9)) {
          success = this.setCursor(this.cursor + 1);
        } else {
          success = this.setGenMode(true);
        }
        break;
      }
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  setCursor(cursor: integer): boolean {
    let changed = false;

    if (this.genMode) {
      changed = this.genCursor !== cursor;

      let genCursorWithScroll = this.getGenCursorWithScroll();

      if (!cursor && this.genScrollCursor) {
        this.genScrollCursor--;
        cursor++;
        this.updateGenOptions();
      } else if (cursor === 6 && this.genScrollCursor < gens.length - 7) {
        this.genScrollCursor++;
        cursor--;
        this.updateGenOptions();
      }

      if (genCursorWithScroll !== undefined) {
        this.starterSelectGenIconContainers[genCursorWithScroll].setVisible(false);
      }
      this.cursor = 0;
      this.genCursor = cursor;
      genCursorWithScroll = this.getGenCursorWithScroll();
      this.genCursorObj.setY(5 + 17 * this.genCursor);
      this.genCursorHighlightObj.setY(this.genCursorObj.y);
      this.starterSelectGenIconContainers[genCursorWithScroll].setVisible(true);

    } else {
      changed = super.setCursor(cursor);

      this.cursorObj.setPosition(150 + 18 * (cursor % 9), 10 + 18 * Math.floor(cursor / 9));

      const species = this.genSpecies[this.getGenCursorWithScroll()][cursor];

      this.setSpecies(species);
    }

    return changed;
  }

  getGenCursorWithScroll(): integer {
    return this.genCursor !== undefined
      ? this.genCursor + this.genScrollCursor
      : undefined;
  }

  updateGenOptions(): void {
    let text = "";
    for (let g = this.genScrollCursor; g <= this.genScrollCursor + 6; g++) {
      let optionText = "";
      if (g === this.genScrollCursor && this.genScrollCursor) {
        optionText = "↑";
      } else if (g === this.genScrollCursor + 6 && this.genScrollCursor < gens.length - 7) {
        optionText = "↓";
      } else {
        optionText = i18next.t(`starterSelectUiHandler:gen${g + 1}`);
      }
      text += `${text ? "\n" : ""}${optionText}`;
    }
    this.genOptionsText.setText(text);
  }

  setGenMode(genMode: boolean): boolean {
    this.genCursorObj.setVisible(genMode);
    this.cursorObj.setVisible(!genMode);

    if (genMode !== this.genMode) {
      this.genMode = genMode;

      this.setCursor(genMode ? this.genCursor : this.cursor);
      if (genMode) {
        this.setSpecies(null);
      }

      return true;
    }

    return false;
  }

  setSpecies(species: PokemonSpecies) {
    this.speciesStarterDexEntry = species ? this.scene.gameData.dexData[species.speciesId] : null;

    if (this.lastSpecies) {
      const lastSpeciesIcon = (this.starterSelectGenIconContainers[this.lastSpecies.generation - 1].getAt(this.genSpecies[this.lastSpecies.generation - 1].indexOf(this.lastSpecies)) as Phaser.GameObjects.Sprite);
      lastSpeciesIcon.setTexture(
        this.lastSpecies.getIconAtlasKey(0, false, 0),
        this.lastSpecies.getIconId(false, 0, false, 0)
      );
      const checkedIcon = this.checkIconId(lastSpeciesIcon, this.lastSpecies, false, 0, false, 0);
      if (checkedIcon) {
        lastSpeciesIcon.setTexture(checkedIcon.texture, checkedIcon.frame);
      }
      this.iconAnimHandler.addOrUpdate(lastSpeciesIcon, PokemonIconAnimMode.NONE);

      // Resume the animation for the previously selected species
      const speciesIndex = this.genSpecies[this.lastSpecies.generation - 1].indexOf(this.lastSpecies);
      const icon = this.starterSelectGenIconContainers[this.lastSpecies.generation - 1].getAt(speciesIndex) as Phaser.GameObjects.Sprite;
      this.scene.tweens.getTweensOf(icon).forEach(tween => tween.resume());
    }

    this.lastSpecies = species;

    if (species && (this.speciesStarterDexEntry?.seenAttr || this.speciesStarterDexEntry?.caughtAttr)) {
      this.pokemonNumberText.setText(Utils.padInt(species.speciesId, 4));
      this.pokemonNameText.setText(species.name);

      if (this.speciesStarterDexEntry?.caughtAttr) {
        this.shinyContainer.removeAll();
        this.formsContainer.removeAll();
        this.genderContainer.removeAll();
        this.unlockedContainer.removeAll();
        this.shinyContainer.setVisible(true);
        this.formsContainer.setVisible(true);
        this.genderContainer.setVisible(true);
        this.unlockedContainer.setVisible(true);
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

        species.forms.forEach((_, i) => {
          const itemCols = 10;
          const x = (i % itemCols) * 14;
          const y = Math.floor(i / itemCols) * 14;
          const icon = this.scene.add.sprite(x, y, species.getIconAtlasKey(0));
          icon.setScale(0.4);
          icon.setOrigin(0, 0);
          icon.setTexture(this.lastSpecies.getIconAtlasKey(i, false, 0));
          icon.setFrame(this.lastSpecies.getIconId(false, i, false, 0));

          const caught = (BigInt(this.speciesStarterDexEntry.caughtAttr) & BigInt(Math.pow(2, 7 + i))) !== 0n;
          const seen = (BigInt(this.speciesStarterDexEntry.seenAttr) & BigInt(Math.pow(2, 7 + i))) !== 0n;

          if (caught) {
            icon.clearTint();
          } else if (seen) {
            icon.setTint(0x808080);
          } else {
            icon.setTint(0);
          }

          this.formsContainer.add(icon);
        });
        this.starterSelectContainer.add(this.formsContainer);

        this.pokemonGenderText = addTextObject(this.scene, 7, 0, "", TextStyle.SUMMARY_ALT);
        this.pokemonGenderText.setOrigin(0, 0);
        this.genderContainer.add(this.pokemonGenderText);

        this.pokemonGenderText2 = addTextObject(this.scene, 0, 0, "", TextStyle.SUMMARY_ALT);
        this.pokemonGenderText2.setOrigin(0, 0);
        this.genderContainer.add(this.pokemonGenderText2);

        this.starterSelectContainer.add(this.genderContainer);


        const hasHiddenAbility = (BigInt(this.scene.gameData.starterData[species.getRootSpeciesId()].abilityAttr) & 4n) !== 0n;
        const hasClassicWin = this.scene.gameData.starterData[species.getRootSpeciesId()]?.classicWinCount > 0;

        const unlocked = [
          {name: "hidden-ability", texture: "ha_capsule", isVisible: hasHiddenAbility, skip: false},
          {name: "classic-win", texture: "champion_ribbon", isVisible: hasClassicWin, skip: false},
        ];
        unlocked.forEach((item, i) => {
          const icon = this.scene.add.image(6+i*5, 30, item.texture);
          icon.setName(`${item.name}-icon`);
          icon.setOrigin(0, 0);
          icon.setScale(0.5);
          icon.setVisible(true);

          if (item.isVisible) {
            icon.clearTint();
          } else {
            icon.setTint(0);
          }
          !item.skip && this.unlockedContainer.add(icon);
        });
        this.starterSelectContainer.add(this.unlockedContainer);


        this.pokemonUncaughtText.setVisible(false);
        this.shinyContainer.setVisible(true);
        this.formsContainer.setVisible(true);
        this.genderContainer.setVisible(true);
        this.unlockedContainer.setVisible(true);



        // Pause the animation when the species is selected
        const speciesIndex = this.genSpecies[species.generation - 1].indexOf(species);
        const icon = this.starterSelectGenIconContainers[species.generation - 1].getAt(speciesIndex) as Phaser.GameObjects.Sprite;

        // Initiates the small up and down idle animation
        this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.PASSIVE);


        this.setSpeciesDetails(species);

        this.pokemonSprite.clearTint();
      } else {
        this.type1Icon.setVisible(false);
        this.type2Icon.setVisible(false);
        this.pokemonUncaughtText.setVisible(true);
        this.shinyContainer.setVisible(false);
        this.formsContainer.setVisible(false);
        this.genderContainer.setVisible(false);
        this.unlockedContainer.setVisible(false);

        this.setSpeciesDetails(species, true);
        this.pokemonSprite.setTint(0x808080);
      }
    } else {
      this.pokemonNumberText.setText(Utils.padInt(0, 4));
      this.pokemonNameText.setText(species ? "???" : "");
      this.type1Icon.setVisible(false);
      this.type2Icon.setVisible(false);
      this.pokemonUncaughtText.setVisible(!!species);
      this.shinyContainer.setVisible(false);
      this.formsContainer.setVisible(false);
      this.genderContainer.setVisible(false);
      this.unlockedContainer.setVisible(false);

      this.setSpeciesDetails(species);
      this.pokemonSprite.clearTint();
    }
  }

  setSpeciesDetails(species: PokemonSpecies, forSeen: boolean = false): void {
    this.pokemonSprite.setVisible(false);

    if (this.assetLoadCancelled) {
      this.assetLoadCancelled.value = true;
      this.assetLoadCancelled = null;
    }

    if (species) {
      const dexEntry = this.scene.gameData.dexData[species.speciesId];
      this.pokemonNumberText.setColor(this.getTextColor(TextStyle.SUMMARY, false));
      this.pokemonNumberText.setShadowColor(this.getTextColor(TextStyle.SUMMARY, true));

      if (forSeen ? this.speciesStarterDexEntry?.seenAttr : this.speciesStarterDexEntry?.caughtAttr) {


        const assetLoadCancelled = new Utils.BooleanHolder(false);
        this.assetLoadCancelled = assetLoadCancelled;

        species.loadAssets(this.scene, false, 0, false, 0, true).then(() => {
          if (assetLoadCancelled.value) {
            return;
          }
          this.assetLoadCancelled = null;
          this.speciesLoaded.set(species.speciesId, true);
          this.pokemonSprite.play(species.getSpriteKey(false, 0, false, 0));
          this.pokemonSprite.setPipelineData("shiny", false);
          this.pokemonSprite.setPipelineData("variant", 0);
          this.pokemonSprite.setPipelineData("spriteKey", species.getSpriteKey(false, 0, false, 0));
          this.pokemonSprite.setVisible(true);
        });


        const starterSprite = this.starterSelectGenIconContainers[this.getGenCursorWithScroll()].getAt(this.cursor) as Phaser.GameObjects.Sprite;
        starterSprite.setTexture(species.getIconAtlasKey(0, false, 0), species.getIconId(false, 0, false, 0));
        starterSprite.setAlpha(1);
        const checkedIcon = this.checkIconId((this.starterSelectGenIconContainers[this.getGenCursorWithScroll()].getAt(this.cursor) as Phaser.GameObjects.Sprite), species, false, 0, false, 0);
        if (checkedIcon) {
          starterSprite.setTexture(checkedIcon.texture, checkedIcon.frame);
        }
      }

      if (dexEntry.caughtAttr && species.malePercent !== null) {
        this.setGenderIcons(species);
      } else {
        this.pokemonGenderText.setText("");
        this.pokemonGenderText2.setText("");
      }

      if (dexEntry.caughtAttr) {
        this.setTypeIcons(species.type1, species.type2);
      } else {
        this.setTypeIcons(null, null);
      }
    } else {
      this.pokemonNumberText.setColor(this.getTextColor(TextStyle.SUMMARY));
      this.pokemonNumberText.setShadowColor(this.getTextColor(TextStyle.SUMMARY, true));
      this.pokemonGenderText.setText("");
      this.pokemonGenderText2.setText("");
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

  setGenderIcons(species: PokemonSpecies): void {
    const dexEntry = this.scene.gameData.dexData[species.speciesId];
    const isOnlyMale = species.malePercent === 100;
    const isOnlyFemale = species.malePercent === 0;
    const isMale = (BigInt(dexEntry.caughtAttr) & 4n) !== 0n;
    const isFemale = (BigInt(dexEntry.caughtAttr) & 8n) !== 0n;

    if (isOnlyMale || isOnlyFemale) {
      this.pokemonGenderText.setText(getGenderSymbol(isMale ? Gender.MALE : Gender.FEMALE));
      this.pokemonGenderText.setColor(getGenderColor(isMale ? Gender.MALE : Gender.FEMALE));
      this.pokemonGenderText.setShadowColor(getGenderColor(isMale ? Gender.MALE : Gender.FEMALE, true));
    } else {
      this.pokemonGenderText.setText(getGenderSymbol(Gender.MALE));
      this.pokemonGenderText.setColor(getGenderColor(Gender.MALE));
      this.pokemonGenderText.setShadowColor(getGenderColor(Gender.MALE, true));
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

  clearText() {
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

  updateSpeciesIcons() {
    for (let g = 0; g < this.genSpecies.length; g++) {
      this.genSpecies[g].forEach((species, s) => {
        const icon = this.starterSelectGenIconContainers[g].getAt(s) as Phaser.GameObjects.Sprite;
        const dexEntry = this.scene.gameData.dexData[species.speciesId];

        if (dexEntry.caughtAttr) {
          icon.clearTint();
        } else if (dexEntry.seenAttr) {
          icon.setTint(0x808080);
        }

        this.setUpgradeAnimation(icon, species);
      });
    }
  }
}
