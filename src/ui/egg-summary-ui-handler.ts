import BattleScene from "../battle-scene";
import { Mode } from "./ui";
import PokemonIconAnimHandler, { PokemonIconAnimMode } from "./pokemon-icon-anim-handler";
import MessageUiHandler from "./message-ui-handler";
import { getEggTierForSpecies } from "../data/egg";
import {Button} from "#enums/buttons";
import { Gender } from "#app/data/gender";
import { getVariantTint } from "#app/data/variant";
import { EggTier } from "#app/enums/egg-type";
import PokemonHatchInfoContainer from "./pokemon-hatch-info-container";
import { EggSummaryPhase } from "#app/phases/egg-summary-phase";
import { DexAttr } from "#app/system/game-data";
import { EggHatchData } from "#app/data/egg-hatch-data";

const iconContainerX = 115;
const iconContainerY = 9;
const numCols = 11;
const iconSize = 18;

/**
 * UI Handler for the egg summary.
 * Handles navigation and display of each pokemon as a list
 * Also handles display of the pokemon-hatch-info-container
 */
export default class EggSummaryUiHandler extends MessageUiHandler {
  /** holds all elements in the scene */
  private eggHatchContainer: Phaser.GameObjects.Container;
  /** holds the icon containers and info container */
  private summaryContainer: Phaser.GameObjects.Container;
  /** container for the mini pokemon sprites */
  private pokemonIconSpritesContainer: Phaser.GameObjects.Container;
  /** container for the icons displayed on top of the mini pokemon sprites (e.g. shiny, HA capsule) */
  private pokemonIconsContainer: Phaser.GameObjects.Container;
  /** container for the elements displayed behind the mini pokemon sprites (e.g. egg rarity bg) */
  private pokemonBackgroundContainer: Phaser.GameObjects.Container;
  /** hatch info container that displays the current pokemon / hatch (main element on left hand side) */
  private infoContainer: PokemonHatchInfoContainer;
  /** handles jumping animations for the pokemon sprite icons */
  private iconAnimHandler: PokemonIconAnimHandler;
  private eggHatchBg: Phaser.GameObjects.Image;
  private cursorObj: Phaser.GameObjects.Image;
  private eggHatchData: EggHatchData[];


  /**
   * Allows subscribers to listen for events
   *
   * Current Events:
   * - {@linkcode EggEventType.EGG_COUNT_CHANGED} {@linkcode EggCountChangedEvent}
   */
  public readonly eventTarget: EventTarget = new EventTarget();

  constructor(scene: BattleScene) {
    super(scene, Mode.EGG_HATCH_SUMMARY);
  }


  setup() {
    const ui = this.getUi();

    this.summaryContainer = this.scene.add.container(0, -this.scene.game.canvas.height / 6);
    this.summaryContainer.setVisible(false);
    ui.add(this.summaryContainer);

    this.eggHatchContainer = this.scene.add.container(0, -this.scene.game.canvas.height / 6);
    this.eggHatchContainer.setVisible(false);
    ui.add(this.eggHatchContainer);

    this.iconAnimHandler = new PokemonIconAnimHandler();
    this.iconAnimHandler.setup(this.scene);

    this.eggHatchBg = this.scene.add.image(0, 0, "egg_summary_bg");
    this.eggHatchBg.setOrigin(0, 0);
    this.eggHatchContainer.add(this.eggHatchBg);

    this.cursorObj = this.scene.add.image(0, 0, "select_cursor");
    this.cursorObj.setOrigin(0, 0);
    this.summaryContainer.add(this.cursorObj);

    this.pokemonIconSpritesContainer = this.scene.add.container(iconContainerX, iconContainerY);
    this.pokemonIconsContainer = this.scene.add.container(iconContainerX, iconContainerY);
    this.pokemonBackgroundContainer = this.scene.add.container(iconContainerX, iconContainerY);
    this.summaryContainer.add(this.pokemonBackgroundContainer);
    this.summaryContainer.add(this.pokemonIconSpritesContainer);
    this.summaryContainer.add(this.pokemonIconsContainer);

    this.infoContainer = new PokemonHatchInfoContainer(this.scene, this.summaryContainer);
    this.infoContainer.setup();
    this.infoContainer.changeToEggSummaryLayout();
    this.infoContainer.setVisible(true);
    this.summaryContainer.add(this.infoContainer);

    this.cursor = -1;
  }

  clear() {
    super.clear();
    this.cursor = -1;
    this.summaryContainer.setVisible(false);
    this.pokemonIconSpritesContainer.removeAll(true);
    this.pokemonIconsContainer.removeAll(true);
    this.pokemonBackgroundContainer.removeAll(true);
    this.eggHatchBg.setVisible(false);
    this.getUi().hideTooltip();

    // Note: Questions on garbage collection go to @frutescens
    const activeKeys = this.scene.getActiveKeys();
    // Removing unnecessary sprites from animation manager
    const animKeys = Object.keys(this.scene.anims["anims"]["entries"]);
    animKeys.forEach(key => {
      if (key.startsWith("pkmn__") && !activeKeys.includes(key)) {
        this.scene.anims.remove(key);
      }
    });
    // Removing unnecessary cries from audio cache
    const audioKeys = Object.keys(this.scene.cache.audio.entries.entries);
    audioKeys.forEach(key => {
      if (key.startsWith("cry/") && !activeKeys.includes(key)) {
        delete this.scene.cache.audio.entries.entries[key];
      }
    });
    // Clears eggHatchData in EggSummaryUiHandler
    this.eggHatchData.length = 0;
    // Removes Pokemon icons in EggSummaryUiHandler
    this.iconAnimHandler.removeAll();
  }

  /**
   * @param args EggHatchData[][]
   * args[0]: list of EggHatchData for each egg/pokemon hatched
   */
  show(args: EggHatchData[][]): boolean {
    super.show(args);
    if (args.length >= 1) {
      // sort the egg hatch data by egg tier then by species number (then by order hatched)
      this.eggHatchData = args[0].sort(function sortHatchData(a: EggHatchData, b: EggHatchData) {
        const speciesA = a.pokemon.species;
        const speciesB = b.pokemon.species;
        if (getEggTierForSpecies(speciesA) < getEggTierForSpecies(speciesB)) {
          return -1;
        } else if (getEggTierForSpecies(speciesA) > getEggTierForSpecies(speciesB)) {
          return 1;
        } else {
          if (speciesA.speciesId < speciesB.speciesId) {
            return -1;
          } else if (speciesA.speciesId > speciesB.speciesId) {
            return 1;
          } else {
            return 0;
          }
        }
      }

      );
    }

    this.getUi().bringToTop(this.summaryContainer);
    this.summaryContainer.setVisible(true);
    this.eggHatchContainer.setVisible(true);
    this.pokemonIconsContainer.setVisible(true);
    this.eggHatchBg.setVisible(true);
    this.infoContainer.hideDisplayPokemon();

    this.eggHatchData.forEach( (value: EggHatchData, i: number) => {
      const x = (i % numCols) * iconSize;
      const y = Math.floor(i / numCols) * iconSize;

      const displayPokemon = value.pokemon;
      const offset = 2;
      const rightSideX = 12;

      const rarityBg = this.scene.add.image(x + 2, y + 5, "passive_bg");
      rarityBg.setOrigin(0, 0);
      rarityBg.setScale(0.75);
      rarityBg.setVisible(true);
      this.pokemonBackgroundContainer.add(rarityBg);

      // set tint for passive bg
      switch (getEggTierForSpecies(displayPokemon.species)) {
      case EggTier.COMMON:
        rarityBg.setVisible(false);
        break;
      case EggTier.GREAT:
        rarityBg.setTint(0xabafff);
        break;
      case EggTier.ULTRA:
        rarityBg.setTint(0xffffaa);
        break;
      case EggTier.MASTER:
        rarityBg.setTint(0xdfffaf);
        break;
      }
      const species = displayPokemon.species;
      const female = displayPokemon.gender === Gender.FEMALE;
      const formIndex = displayPokemon.formIndex;
      const variant = displayPokemon.variant;
      const isShiny = displayPokemon.shiny;

      // set pokemon icon (and replace with base sprite if there is a mismatch)
      const pokemonIcon = this.scene.add.sprite(x - offset, y + offset, species.getIconAtlasKey(formIndex, isShiny, variant));
      pokemonIcon.setScale(0.5);
      pokemonIcon.setOrigin(0, 0);
      pokemonIcon.setFrame(species.getIconId(female, formIndex, isShiny, variant));

      if (pokemonIcon.frame.name !== species.getIconId(female, formIndex, isShiny, variant)) {
        console.log(`${species.name}'s variant icon does not exist. Replacing with default.`);
        pokemonIcon.setTexture(species.getIconAtlasKey(formIndex, false, variant));
        pokemonIcon.setFrame(species.getIconId(female, formIndex, false, variant));
      }
      this.pokemonIconSpritesContainer.add(pokemonIcon);

      const shinyIcon = this.scene.add.image(x + rightSideX, y + offset, "shiny_star_small");
      shinyIcon.setOrigin(0, 0);
      shinyIcon.setScale(0.5);
      shinyIcon.setVisible(displayPokemon.shiny);
      shinyIcon.setTint(getVariantTint(displayPokemon.variant));
      this.pokemonIconsContainer.add(shinyIcon);

      const haIcon = this.scene.add.image(x + rightSideX, y + offset * 4, "ha_capsule");
      haIcon.setOrigin(0, 0);
      haIcon.setScale(0.5);
      haIcon.setVisible(displayPokemon.abilityIndex === 2);
      this.pokemonIconsContainer.add(haIcon);

      const dexEntry = value.dexEntryBeforeUpdate;
      const caughtAttr = dexEntry.caughtAttr;
      const newShiny = BigInt(1 << (displayPokemon.shiny ? 1 : 0));
      const newVariant = BigInt(1 << (displayPokemon.variant + 4));
      const newShinyOrVariant = ((newShiny & caughtAttr) === BigInt(0)) || ((newVariant & caughtAttr) === BigInt(0));
      const newForm = (BigInt(1 << displayPokemon.formIndex) * DexAttr.DEFAULT_FORM & caughtAttr) === BigInt(0);

      const pokeballIcon = this.scene.add.image(x + rightSideX, y + offset * 7, "icon_owned");
      pokeballIcon.setOrigin(0, 0);
      pokeballIcon.setScale(0.5);
      pokeballIcon.setVisible(!caughtAttr || newForm);
      this.pokemonIconsContainer.add(pokeballIcon);

      const eggMoveIcon = this.scene.add.image(x, y + offset, "icon_egg_move");
      eggMoveIcon.setOrigin(0, 0);
      eggMoveIcon.setScale(0.5);
      eggMoveIcon.setVisible(value.eggMoveUnlocked);
      this.pokemonIconsContainer.add(eggMoveIcon);

      // add animation to the Pokemon sprite for new unlocks (new catch, new shiny or new form)
      if (!caughtAttr || newShinyOrVariant || newForm) {
        this.iconAnimHandler.addOrUpdate(pokemonIcon, PokemonIconAnimMode.PASSIVE);
      } else {
        this.iconAnimHandler.addOrUpdate(pokemonIcon, PokemonIconAnimMode.NONE);
      }
    });

    this.setCursor(0);
    this.scene.playSoundWithoutBgm("evolution_fanfare");
    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    const error = false;
    if (button === Button.CANCEL) {
      const phase = this.scene.getCurrentPhase();
      if (phase instanceof EggSummaryPhase) {
        phase.end();
      }
      success = true;
    } else {
      const count = this.eggHatchData.length;
      const rows = Math.ceil(count / numCols);
      const row = Math.floor(this.cursor / numCols);
      switch (button) {
      case Button.UP:
        if (row) {
          success = this.setCursor(this.cursor - numCols);
        }
        break;
      case Button.DOWN:
        if (row < rows - 2 || (row < rows - 1 && this.cursor % numCols <= (count - 1) % numCols)) {
          success = this.setCursor(this.cursor + numCols);
        }
        break;
      case Button.LEFT:
        if (this.cursor % numCols) {
          success = this.setCursor(this.cursor - 1);
        }
        break;
      case Button.RIGHT:
        if (this.cursor % numCols < (row < rows - 1 ? 10 : (count - 1) % numCols)) {
          success = this.setCursor(this.cursor + 1);
        }
        break;
      }
    }

    if (success) {
      ui.playSelect();
    } else if (error) {
      ui.playError();
    }

    return success || error;
  }

  setCursor(cursor: number): boolean {
    let changed = false;

    const lastCursor = this.cursor;

    changed = super.setCursor(cursor);

    if (changed) {
      this.cursorObj.setPosition(iconContainerX - 1 + iconSize * (cursor % numCols), iconContainerY + 1 + iconSize * Math.floor(cursor / numCols));

      if (lastCursor > -1) {
        this.iconAnimHandler.addOrUpdate(this.pokemonIconSpritesContainer.getAt(lastCursor) as Phaser.GameObjects.Sprite, PokemonIconAnimMode.NONE);
      }
      this.iconAnimHandler.addOrUpdate(this.pokemonIconSpritesContainer.getAt(cursor) as Phaser.GameObjects.Sprite, PokemonIconAnimMode.ACTIVE);

      this.infoContainer.showHatchInfo(this.eggHatchData[cursor]);

    }

    return changed;
  }

}
