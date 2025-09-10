import { globalScene } from "#app/global-scene";
import { getEggTierForSpecies } from "#data/egg";
import type { EggHatchData } from "#data/egg-hatch-data";
import { Button } from "#enums/buttons";
import { UiMode } from "#enums/ui-mode";
import { HatchedPokemonContainer } from "#ui/containers/hatched-pokemon-container";
import { PokemonHatchInfoContainer } from "#ui/containers/pokemon-hatch-info-container";
import { ScrollBar } from "#ui/containers/scroll-bar";
import { MessageUiHandler } from "#ui/handlers/message-ui-handler";
import { PokemonIconAnimHandler, PokemonIconAnimMode } from "#ui/handlers/pokemon-icon-anim-handler";
import { ScrollableGridUiHandler } from "#ui/handlers/scrollable-grid-handler";

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
export class EggSummaryUiHandler extends MessageUiHandler {
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

  private scrollGridHandler: ScrollableGridUiHandler;
  private cursorObj: Phaser.GameObjects.Image;

  /** used to add a delay before which it is not possible to exit the summary */
  private blockExit: boolean;

  /**
   * Allows subscribers to listen for events
   *
   * Current Events:
   * - {@linkcode EggEventType.EGG_COUNT_CHANGED} {@linkcode EggCountChangedEvent}
   */
  public readonly eventTarget: EventTarget = new EventTarget();

  constructor() {
    super(UiMode.EGG_HATCH_SUMMARY);
  }

  setup() {
    const ui = this.getUi();

    this.summaryContainer = globalScene.add.container(0, -globalScene.scaledCanvas.height);
    this.summaryContainer.setVisible(false);
    ui.add(this.summaryContainer);

    this.eggHatchContainer = globalScene.add.container(0, -globalScene.scaledCanvas.height);
    this.eggHatchContainer.setVisible(false);
    ui.add(this.eggHatchContainer);

    this.iconAnimHandler = new PokemonIconAnimHandler();
    this.iconAnimHandler.setup();

    this.eggHatchBg = globalScene.add.image(0, 0, "egg_summary_bg");
    this.eggHatchBg.setOrigin(0, 0);
    this.eggHatchContainer.add(this.eggHatchBg);

    this.cursorObj = globalScene.add.image(0, 0, "select_cursor");
    this.cursorObj.setOrigin(0, 0);
    this.summaryContainer.add(this.cursorObj);

    this.pokemonContainers = [];
    this.pokemonIconsContainer = globalScene.add.container(iconContainerX, iconContainerY);
    this.summaryContainer.add(this.pokemonIconsContainer);

    this.infoContainer = new PokemonHatchInfoContainer(this.summaryContainer);
    this.infoContainer.setup();
    this.infoContainer.changeToEggSummaryLayout();
    this.infoContainer.setVisible(true);
    this.summaryContainer.add(this.infoContainer);

    const scrollBar = new ScrollBar(
      iconContainerX + numCols * iconSize,
      iconContainerY + 3,
      4,
      globalScene.scaledCanvas.height - 20,
      numRows,
    );
    this.summaryContainer.add(scrollBar);

    this.scrollGridHandler = new ScrollableGridUiHandler(this, numRows, numCols)
      .withScrollBar(scrollBar)
      .withUpdateGridCallBack(() => this.updatePokemonIcons())
      .withUpdateSingleElementCallback((i: number) => this.infoContainer.showHatchInfo(this.eggHatchData[i]));

    this.cursor = -1;
  }

  clear() {
    super.clear();
    this.scrollGridHandler.reset();
    this.cursor = -1;

    this.summaryContainer.setVisible(false);
    this.pokemonIconsContainer.removeAll(true);
    this.pokemonContainers = [];
    this.eggHatchBg.setVisible(false);
    this.getUi().hideTooltip();

    // Note: Questions on garbage collection go to @frutescens
    const activeKeys = globalScene.getActiveKeys();
    // Removing unnecessary sprites from animation manager
    const animKeys = Object.keys(globalScene.anims["anims"]["entries"]);
    animKeys.forEach(key => {
      if (key.startsWith("pkmn__") && !activeKeys.includes(key)) {
        globalScene.anims.remove(key);
      }
    });
    // Removing unnecessary cries from audio cache
    const audioKeys = Object.keys(globalScene.cache.audio.entries.entries);
    audioKeys.forEach(key => {
      if (key.startsWith("cry/") && !activeKeys.includes(key)) {
        delete globalScene.cache.audio.entries.entries[key];
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
    if (args.length > 0) {
      // sort the egg hatch data by egg tier then by species number (then by order hatched)
      this.eggHatchData = args[0].sort(function sortHatchData(a: EggHatchData, b: EggHatchData) {
        const speciesA = a.pokemon.species;
        const speciesB = b.pokemon.species;
        if (getEggTierForSpecies(speciesA) < getEggTierForSpecies(speciesB)) {
          return -1;
        }
        if (getEggTierForSpecies(speciesA) > getEggTierForSpecies(speciesB)) {
          return 1;
        }
        if (speciesA.speciesId < speciesB.speciesId) {
          return -1;
        }
        if (speciesA.speciesId > speciesB.speciesId) {
          return 1;
        }
        return 0;
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

    globalScene.playSoundWithoutBgm("evolution_fanfare");

    // Prevent exiting the egg summary for 2 seconds if the egg hatching
    // was skipped automatically and for 1 second otherwise
    const exitBlockingDuration = globalScene.eggSkipPreference === 2 ? 2000 : 1000;
    this.blockExit = true;
    globalScene.time.delayedCall(exitBlockingDuration, () => (this.blockExit = false));

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
          hatchContainer = new HatchedPokemonContainer(x, y, hatchData).setVisible(false);
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
    let error = false;
    if (button === Button.CANCEL) {
      if (!this.blockExit) {
        const phase = globalScene.phaseManager.getCurrentPhase();
        if (phase.is("EggSummaryPhase")) {
          phase.end();
        }
        success = true;
      } else {
        error = true;
      }
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
      this.cursorObj.setPosition(
        iconContainerX - 1 + iconSize * (cursor % numCols),
        iconContainerY + 1 + iconSize * Math.floor(cursor / numCols),
      );

      if (lastCursor > -1) {
        this.iconAnimHandler.addOrUpdate(this.pokemonContainers[lastCursor].icon, PokemonIconAnimMode.NONE);
      }
      this.iconAnimHandler.addOrUpdate(this.pokemonContainers[cursor].icon, PokemonIconAnimMode.ACTIVE);

      this.infoContainer.showHatchInfo(this.eggHatchData[cursor + this.scrollGridHandler.getItemOffset()]);
    }

    return changed;
  }
}
