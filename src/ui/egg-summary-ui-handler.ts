import BattleScene from "../battle-scene";
import { Mode } from "./ui";
import PokemonIconAnimHandler, { PokemonIconAnimMode } from "./pokemon-icon-anim-handler";
import MessageUiHandler from "./message-ui-handler";
import { getEggTierForSpecies } from "../data/egg";
import { Button } from "#enums/buttons";
import PokemonHatchInfoContainer from "./pokemon-hatch-info-container";
import { EggSummaryPhase } from "#app/phases/egg-summary-phase";
import { EggHatchData } from "#app/data/egg-hatch-data";
import ScrollableGridUiHandler from "./scrollable-grid-handler";
import { HatchedPokemonContainer } from "./hatched-pokemon-container";
import { ScrollBar } from "#app/ui/scroll-bar";

const iconContainerX = 112;
const iconContainerY = 9;
const numRows = 9;
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
  /** container for the each pokemon sprites and icons */
  private pokemonIconsContainer: Phaser.GameObjects.Container;
  /** list of the containers added to pokemonIconsContainer for easier access */
  private pokemonContainers: HatchedPokemonContainer[];

  /** hatch info container that displays the current pokemon / hatch (main element on left hand side) */
  private infoContainer: PokemonHatchInfoContainer;
  /** handles jumping animations for the pokemon sprite icons */
  private iconAnimHandler: PokemonIconAnimHandler;
  private eggHatchBg: Phaser.GameObjects.Image;
  private eggHatchData: EggHatchData[];

  private scrollGridHandler : ScrollableGridUiHandler;
  private cursorObj: Phaser.GameObjects.Image;

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

    this.pokemonContainers = [];
    this.pokemonIconsContainer = this.scene.add.container(iconContainerX, iconContainerY);
    this.summaryContainer.add(this.pokemonIconsContainer);

    this.infoContainer = new PokemonHatchInfoContainer(this.scene, this.summaryContainer);
    this.infoContainer.setup();
    this.infoContainer.changeToEggSummaryLayout();
    this.infoContainer.setVisible(true);
    this.summaryContainer.add(this.infoContainer);

    const scrollBar = new ScrollBar(this.scene, iconContainerX + numCols * iconSize, iconContainerY + 3, 4, this.scene.game.canvas.height / 6 - 20, numRows);
    this.summaryContainer.add(scrollBar);

    this.scrollGridHandler = new ScrollableGridUiHandler(this, numRows, numCols)
      .withScrollBar(scrollBar)
      .withUpdateGridCallBack(() => this.updatePokemonIcons())
      .withUpdateSingleElementCallback((i: number) => this.infoContainer.showHatchInfo(this.eggHatchData[i]));

    this.cursor = -1;
  }

  clear() {
    super.clear();
    this.cursor = -1;
    this.scrollGridHandler.reset();
    this.summaryContainer.setVisible(false);
    this.pokemonIconsContainer.removeAll(true);
    this.pokemonContainers = [];
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
      });
    }

    this.getUi().bringToTop(this.summaryContainer);
    this.summaryContainer.setVisible(true);
    this.eggHatchContainer.setVisible(true);
    this.eggHatchBg.setVisible(true);
    this.infoContainer.hideDisplayPokemon();

    this.scrollGridHandler.setTotalElements(this.eggHatchData.length);
    this.updatePokemonIcons();

    this.setCursor(0);
    this.scene.playSoundWithoutBgm("evolution_fanfare");
    return true;
  }

  /**
   * Show the grid of Pokemon icons
   */
  private updatePokemonIcons(): void {
    const itemOffset = this.scrollGridHandler.getItemOffset();
    const eggsToShow = Math.min(numRows * numCols, this.eggHatchData.length - itemOffset);

    for (let i = 0; i < numRows * numCols; i++) {
      const hatchData = this.eggHatchData[i + itemOffset];
      let hatchContainer = this.pokemonContainers[i];

      if (i < eggsToShow) {
        if (!hatchContainer) {
          const x = (i % numCols) * iconSize;
          const y = Math.floor(i / numCols) * iconSize;
          hatchContainer = new HatchedPokemonContainer(this.scene, x, y, hatchData).setVisible(false);
          this.pokemonContainers.push(hatchContainer);
          this.pokemonIconsContainer.add(hatchContainer);
        }
        hatchContainer.setVisible(true);
        hatchContainer.updateAndAnimate(hatchData, this.iconAnimHandler);
      } else if (hatchContainer) {
        hatchContainer.setVisible(false);
        this.iconAnimHandler.addOrUpdate(hatchContainer.icon, PokemonIconAnimMode.NONE);
      }
    }
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
      this.scrollGridHandler.processInput(button);
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
        this.iconAnimHandler.addOrUpdate(this.pokemonContainers[lastCursor].icon, PokemonIconAnimMode.NONE);
      }
      this.iconAnimHandler.addOrUpdate(this.pokemonContainers[cursor].icon, PokemonIconAnimMode.ACTIVE);

      this.infoContainer.showHatchInfo(this.eggHatchData[cursor + this.scrollGridHandler.getItemOffset()]);
    }

    return changed;
  }

}
