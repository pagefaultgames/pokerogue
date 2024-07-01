import BattleScene from "../battle-scene";
import { Button } from "#enums/buttons";
import MessageUiHandler from "./message-ui-handler";
import { TextStyle, addTextObject } from "./text";
import { Mode } from "./ui";
import { addWindow } from "./ui-theme";
import PokemonSpecies, { allSpecies } from "#app/data/pokemon-species.js";
import { getVariantTint } from "#app/data/variant.js";
import { Gender, getGenderColor, getGenderSymbol } from "#app/data/gender.js";
import { Abilities } from "#app/enums/abilities.js";

const itemRows = 4;
const itemCols = 17;

export default class PokedexUiHandler extends MessageUiHandler {
  private pokedexContainer: Phaser.GameObjects.Container;
  private pokedexIconsContainer: Phaser.GameObjects.Container;

  private pokedexIconsBg: Phaser.GameObjects.NineSlice;
  private caughtInfoBg: Phaser.GameObjects.NineSlice;
  private caughtInfoContainer: Phaser.GameObjects.Container;
  private pokemonIcons: Phaser.GameObjects.Sprite[];
  private pokemonNameText: Phaser.GameObjects.Text;
  private formsContainer: Phaser.GameObjects.Container;

  private itemsTotal: integer;
  private scrollCursor: integer;

  private cursorObj: Phaser.GameObjects.NineSlice;

  constructor(scene: BattleScene, mode?: Mode) {
    super(scene, mode);

    this.itemsTotal = Object.keys(allSpecies).length;
    this.scrollCursor = 0;
  }

  setup() {
    const ui = this.getUi();

    this.pokedexContainer = this.scene.add.container(1, -(this.scene.game.canvas.height / 6) + 1);

    this.pokedexContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6), Phaser.Geom.Rectangle.Contains);

    const headerBg = addWindow(this.scene, 0, 0, (this.scene.game.canvas.width / 6) - 2, 24);
    headerBg.setOrigin(0, 0);

    const headerText = addTextObject(this.scene, 0, 0, "Pokédex", TextStyle.SETTINGS_LABEL);
    headerText.setOrigin(0, 0);
    headerText.setPositionRelative(headerBg, 8, 4);

    this.pokedexIconsBg = addWindow(this.scene, 0, headerBg.height, (this.scene.game.canvas.width / 6) - 2, (this.scene.game.canvas.height / 6) - headerBg.height - 68);
    this.pokedexIconsBg.setOrigin(0, 0);

    this.pokedexIconsContainer = this.scene.add.container(6, headerBg.height + 6);

    this.pokemonIcons = [];

    for (let a = 0; a < itemRows * itemCols; a++) {
      const species = allSpecies[a];
      const x = (a % itemCols) * 18;
      const y = Math.floor(a / itemCols) * 18;

      const icon = this.scene.add.sprite(x, y, species.getIconAtlasKey(0));
      icon.setOrigin(0, 0);
      icon.setScale(0.5);

      this.pokemonIcons.push(icon);
      this.pokedexIconsContainer.add(icon);
    }

    const pokemonNameBg = addWindow(this.scene, 0, headerBg.height + this.pokedexIconsBg.height, 220, 24);
    pokemonNameBg.setOrigin(0, 0);

    this.pokemonNameText = addTextObject(this.scene, 0, 0, "", TextStyle.WINDOW);
    this.pokemonNameText.setOrigin(0, 0);
    this.pokemonNameText.setPositionRelative(pokemonNameBg, 8, 4);

    this.caughtInfoBg = addWindow(this.scene, pokemonNameBg.x + pokemonNameBg.width, pokemonNameBg.y, 98, 24);
    this.caughtInfoBg.setOrigin(0, 0);

    const formsBg = addWindow(this.scene, 0, pokemonNameBg.y + pokemonNameBg.height, (this.scene.game.canvas.width / 6) - 2, 42);
    formsBg.setOrigin(0, 0);

    this.formsContainer = this.scene.add.container(6, formsBg.y + formsBg.height - 40);
    this.caughtInfoContainer = this.scene.add.container(6, this.caughtInfoBg.y + this.caughtInfoBg.height - 40);

    this.pokedexContainer.add(headerBg);
    this.pokedexContainer.add(headerText);
    this.pokedexContainer.add(this.pokedexIconsBg);
    this.pokedexContainer.add(this.pokedexIconsContainer);
    this.pokedexContainer.add(pokemonNameBg);
    this.pokedexContainer.add(this.pokemonNameText);
    this.pokedexContainer.add(this.caughtInfoBg);
    this.pokedexContainer.add(this.caughtInfoContainer);
    this.pokedexContainer.add(formsBg);
    this.pokedexContainer.add(this.formsContainer);

    ui.add(this.pokedexContainer);

    this.setCursor(0);

    this.pokedexContainer.setVisible(false);
  }

  show(args: any[]): boolean {
    super.show(args);

    this.pokedexContainer.setVisible(true);
    this.setCursor(0);
    this.setScrollCursor(0);

    this.updateSpeciesIcons();

    this.getUi().moveTo(this.pokedexContainer, this.getUi().length - 1);

    this.getUi().hideTooltip();

    return true;
  }

  protected showInfo(species: PokemonSpecies) {

    const gameData = this.scene.gameData;
    const dexEntry = gameData.dexData[species.speciesId];
    const starterData = gameData.starterData[species.speciesId];

    this.pokemonNameText.setText(`#${species.speciesId} ${species.name}`);
    this.formsContainer.removeAll(true);
    this.caughtInfoContainer.removeAll(true);

    if (!dexEntry.caughtAttr && !dexEntry.seenAttr) {
      return;
    }

    for (let a = 0; a < species.forms.length; a++) {
      const x = (a % itemCols) * 18;
      const y = Math.floor(a / itemCols) * 18;

      const icon = this.scene.add.sprite(x, y, species.getIconAtlasKey(0));
      icon.setTexture(`pokemon_icons_${species.generation}`);
      const frame = species.getIconId(false, a);
      icon.setFrame(frame);
      icon.setOrigin(0, 0);
      icon.setScale(0.5);

      const caught = (BigInt(dexEntry.caughtAttr) & BigInt(Math.pow(2,7+a))) !== 0n;
      const seen = (BigInt(dexEntry.seenAttr) & BigInt(Math.pow(2,7+a))) !== 0n;

      if (caught) {
        icon.clearTint();
      } else if (seen) {
        icon.setTint(0x808080);
      } else {
        icon.setTint(0);
      }

      this.formsContainer.add(icon);
    }

    const isMale = (BigInt(dexEntry.caughtAttr) & 4n) !== 0n;
    const isFemale = (BigInt(dexEntry.caughtAttr) & 8n) !== 0n;
    const isYellowShiny = (BigInt(dexEntry.caughtAttr) & 16n) !== 0n;
    const isBlueShiny = (BigInt(dexEntry.caughtAttr) & 32n) !== 0n;
    const isRedShiny = (BigInt(dexEntry.caughtAttr) & 64n) !== 0n;
    const isAbility1 = (BigInt(this.scene.gameData.starterData[species.getRootSpeciesId()].abilityAttr) & 1n) !== 0n;
    const isAbility2 = (BigInt(this.scene.gameData.starterData[species.getRootSpeciesId()].abilityAttr) & 2n) !== 0n;
    const isHiddenAbility = (BigInt(this.scene.gameData.starterData[species.getRootSpeciesId()].abilityAttr) & 4n) !== 0n;
    const isOnlyMale = species.malePercent === 100;
    const isOnlyFemale = species.malePercent === 0;
    const isGenderless = species.malePercent === null;
    const hasOnlyOneAbility = species.ability2 === Abilities.NONE;

    const icons: {texture?: string, color?: number, isVisible: boolean, type?: string, gender?: Gender, skip?: boolean}[] = [
      {type: "gender", gender: Gender.FEMALE, isVisible: isFemale, skip: isGenderless || isOnlyMale},
      {type: "gender", gender: Gender.MALE, isVisible: isMale, skip: isGenderless || isOnlyFemale},
      {texture: "shiny_star_small", color: getVariantTint(0), isVisible: isYellowShiny},
      {texture: "shiny_star_small", color: getVariantTint(1), isVisible: isBlueShiny},
      {texture: "shiny_star_small", color: getVariantTint(2), isVisible: isRedShiny},
      {texture: "ha_capsule", isVisible: isAbility1},
      {texture: "ha_capsule", isVisible: isAbility2, skip: hasOnlyOneAbility},
      {texture: "ha_capsule", isVisible: isHiddenAbility},
      {texture: "champion_ribbon", isVisible: starterData?.classicWinCount > 0},
    ].filter(a => !a.skip);

    for (let a = 0; a < icons.length; a++) {
      const y = Math.floor(a / itemCols) * 18;

      if (icons[a].type === "gender") {
        const icon = addTextObject(this.scene, this.caughtInfoBg.x + a * 10, y + 20, "", TextStyle.BATTLE_INFO);
        icon.setName("text_gender");
        icon.setOrigin(0, 0);
        icon.setText(getGenderSymbol(icons[a].gender));
        icon.setColor(getGenderColor(icons[a].gender));
        !icons[a].isVisible && icon.setTint(0);
        this.caughtInfoContainer.add(icon);
      } else {
        const icon = this.scene.add.sprite(this.caughtInfoBg.x + a * 10, y + 20, icons[a].texture);
        icon.setOrigin(0, 0);
        icon.setScale(0.5);
        icons[a].color && icon.setTint(icons[a].color);
        !icons[a].isVisible && icon.setTint(0);
        this.caughtInfoContainer.add(icon);
      }
    }
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    if (button === Button.CANCEL) {
      success = true;
      this.scene.ui.revertMode();
    } else {
      const rowIndex = Math.floor(this.cursor / itemCols);
      const itemOffset = (this.scrollCursor * itemCols);
      switch (button) {
      case Button.UP:
        if (this.cursor < itemCols) {
          if (this.scrollCursor) {
            success = this.setScrollCursor(this.scrollCursor - 1);
          }
        } else {
          success = this.setCursor(this.cursor - itemCols);
        }
        break;
      case Button.DOWN:
        const canMoveDown = (this.cursor + itemOffset) + itemCols < this.itemsTotal;
        if (rowIndex >= itemRows - 1) {
          if (this.scrollCursor < Math.ceil(this.itemsTotal / itemCols) - itemRows && canMoveDown) {
            success = this.setScrollCursor(this.scrollCursor + 1);
          }
        } else if (canMoveDown) {
          success = this.setCursor(this.cursor + itemCols);
        }
        break;
      case Button.LEFT:
        if (!this.cursor && this.scrollCursor) {
          success = this.setScrollCursor(this.scrollCursor - 1) && this.setCursor(this.cursor + (itemCols - 1));
        } else if (this.cursor) {
          success = this.setCursor(this.cursor - 1);
        }
        break;
      case Button.RIGHT:
        if (this.cursor + 1 === itemRows * itemCols && this.scrollCursor < Math.ceil(this.itemsTotal / itemCols) - itemRows) {
          success = this.setScrollCursor(this.scrollCursor + 1) && this.setCursor(this.cursor - (itemCols - 1));
        } else if (this.cursor + itemOffset < Object.keys(allSpecies).length - 1) {
          success = this.setCursor(this.cursor + 1);
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
    const ret = super.setCursor(cursor);

    let updateInfo = ret;

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.nineslice(0, 0, "select_cursor_highlight", null, 18, 18, 1, 1, 1, 1);
      this.cursorObj.setOrigin(0, 0);
      this.pokedexIconsContainer.add(this.cursorObj);
      updateInfo = true;
    }

    this.cursorObj.setPositionRelative(this.pokemonIcons[this.cursor], 0, 0);

    if (updateInfo) {
      this.showInfo(allSpecies[Object.keys(allSpecies)[cursor + this.scrollCursor * itemCols]]);
    }

    return ret;
  }

  setScrollCursor(scrollCursor: integer): boolean {
    if (scrollCursor === this.scrollCursor) {
      return false;
    }

    this.scrollCursor = scrollCursor;

    this.updateSpeciesIcons();

    this.showInfo(allSpecies[Object.keys(allSpecies)[Math.min(this.cursor + this.scrollCursor * itemCols, Object.values(allSpecies).length - 1)]]);

    return true;
  }

  updateSpeciesIcons(): void {

    const itemOffset = this.scrollCursor * itemCols;
    const itemLimit = itemRows * itemCols;

    const speciesRange = Object.values(allSpecies).slice(itemOffset, itemLimit + itemOffset);

    speciesRange.forEach((species: PokemonSpecies, i: integer) => {
      const icon = this.pokemonIcons[i];
      const dexEntry = this.scene.gameData.dexData[species.speciesId];


      icon.setTexture(`pokemon_icons_${species.generation}`);
      icon.setFrame(species.getIconId(false));
      icon.width = 40;
      icon.height = 30;
      icon.setVisible(true);

      if (dexEntry.caughtAttr) {
        icon.clearTint();
      } else if (dexEntry.seenAttr) {
        icon.setTint(0x808080);
      } else {
        icon.setTint(0);
      }

    });

    if (speciesRange.length < this.pokemonIcons.length) {
      this.pokemonIcons.slice(speciesRange.length).map(i => i.setVisible(false));
    }
  }

  clear() {
    super.clear();
    this.pokedexContainer.setVisible(false);
    this.eraseCursor();
  }

  eraseCursor() {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }
}
