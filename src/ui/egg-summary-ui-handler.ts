import BattleScene from "../battle-scene";
import { Mode } from "./ui";
import PokemonIconAnimHandler, { PokemonIconAnimMode } from "./pokemon-icon-anim-handler";
import { TextStyle, addTextObject } from "./text";
import MessageUiHandler from "./message-ui-handler";
import { Egg } from "../data/egg";
import { addWindow } from "./ui-theme";
import {Button} from "#enums/buttons";
import { PlayerPokemon } from "#app/field/pokemon.js";
import { Gender } from "#app/data/gender.js";
import { EggSummaryPhase } from "#app/egg-hatch-phase.js";
import PokemonInfoContainer from "./pokemon-info-container";
import { getVariantTint } from "#app/data/variant.js";

export default class EggSummaryUiHandler extends MessageUiHandler {
  private eggListContainer: Phaser.GameObjects.Container;
  private eggListIconContainer: Phaser.GameObjects.Container;
  private eggListPokemonContainer: Phaser.GameObjects.Container;
  private eggSprite: Phaser.GameObjects.Sprite;
  private eggListMessageBoxContainer: Phaser.GameObjects.Container;
  private eggHatchContainer: Phaser.GameObjects.Container;
  private eggHatchBg: Phaser.GameObjects.Image;
  private pokemonBg: Phaser.GameObjects.Image;
  private eggHatchOverlay: Phaser.GameObjects.Rectangle;
  private currentPokemonSprite: Phaser.GameObjects.Sprite;

  private infoContainer: PokemonInfoContainer;
  private spriteContainers: Phaser.GameObjects.Container[];
  private shinyIcons: Phaser.GameObjects.Image[];
  private hiddenAbilityIcons: Phaser.GameObjects.Image[];
  private pokeballIcons: Phaser.GameObjects.Image[];
  private eggMoveIcons: Phaser.GameObjects.Image[];
  private infoContainers: PokemonInfoContainer[];

  private cursorObj: Phaser.GameObjects.Image;

  private iconAnimHandler: PokemonIconAnimHandler;
  private pokemonHatched: PlayerPokemon[];

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

    this.eggListContainer = this.scene.add.container(0, -this.scene.game.canvas.height / 6);
    this.eggListContainer.setVisible(false);
    ui.add(this.eggListContainer);

    this.eggHatchContainer = this.scene.add.container(0, -this.scene.game.canvas.height / 6);
    this.eggHatchContainer.setVisible(false);
    ui.add(this.eggHatchContainer);
    // this.scene.fieldUI.add(this.eggHatchContainer);

    // const bgColor = this.scene.add.rectangle(0, 0, this.scene.game.canvas.width / 6, this.scene.game.canvas.height / 6, 0x006860);
    // bgColor.setOrigin(0, 0);
    // this.eggListContainer.add(bgColor);
    this.iconAnimHandler = new PokemonIconAnimHandler();
    this.iconAnimHandler.setup(this.scene);

    this.eggHatchBg = this.scene.add.image(0, 0, "egg_list_bg");
    this.eggHatchBg.setOrigin(0, 0);
    this.eggHatchContainer.add(this.eggHatchBg);

    this.eggListIconContainer = this.scene.add.container(115, 9);
    this.eggListContainer.add(this.eggListIconContainer);
    this.eggListPokemonContainer = this.scene.add.container(115, 9);
    this.eggListContainer.add(this.eggListPokemonContainer);

    this.cursorObj = this.scene.add.image(0, 0, "select_cursor");
    this.cursorObj.setOrigin(0, 0);
    this.eggListContainer.add(this.cursorObj);

    // this.eggSprite = this.scene.add.sprite(54, 37, "egg");
    // this.eggListContainer.add(this.eggSprite);
    this.currentPokemonSprite = this.scene.add.sprite(54, 37, "pkmn__sub");
    this.currentPokemonSprite.setScale(0.75);
    this.currentPokemonSprite.setPipeline(this.scene.spritePipeline, { tone: [ 0.0, 0.0, 0.0, 0.0 ], ignoreTimeTint: true });
    this.eggListContainer.add(this.currentPokemonSprite);

    this.eggListMessageBoxContainer = this.scene.add.container(0, this.scene.game.canvas.height / 6);
    this.eggListMessageBoxContainer.setVisible(false);
    this.eggListContainer.add(this.eggListMessageBoxContainer);

    const eggListMessageBox = addWindow(this.scene, 1, -1, 318, 28);
    eggListMessageBox.setOrigin(0, 1);
    this.eggListMessageBoxContainer.add(eggListMessageBox);

    this.message = addTextObject(this.scene, 8, -8, "", TextStyle.WINDOW, { maxLines: 1 });
    this.message.setOrigin(0, 1);
    this.eggListMessageBoxContainer.add(this.message);

    this.cursor = -1;
  }

  clear() {
    super.clear();
    this.cursor = -1;
    this.eggListContainer.setVisible(false);
    this.eggListIconContainer.removeAll(true);
    this.eggListPokemonContainer.removeAll(true);
    this.eggHatchBg.setVisible(false);
    this.currentPokemonSprite.setVisible(false);
    this.getUi().hideTooltip();
    console.log("Egg Summary Handler cleared");

  }

  show(args: any[]): boolean {
    /* args[] information
    * args[0] : the Pokemon hatched to display
    * args[1] : the integer of the new egg move for corresponding pokemon
    */
    super.show(args);
    if (args.length >= 1) {
      this.pokemonHatched = args[0];
    }
    // this.pokemonHatched = [];

    this.getUi().bringToTop(this.eggListContainer);

    this.eggListContainer.setVisible(true);
    this.eggHatchContainer.setVisible(true);
    this.eggListPokemonContainer.setVisible(true);
    this.eggHatchBg.setVisible(true);

    const size = 12;
    const scale_size =  size * (4/3);

    this.shinyIcons = new Array(this.pokemonHatched.length).fill(null).map((_, i) => {
      const x = (i % 11) * 18;
      const y = Math.floor(i / 11) * 18;
      const ret = this.scene.add.image(x + 0.1 * size, y + 0.2 * size, "shiny_star_small");
      ret.setOrigin(0, 0);
      ret.setScale(size / scale_size);
      ret.setVisible(true);
      this.eggListPokemonContainer.add(ret);
      return ret;
    });

    this.hiddenAbilityIcons = new Array(this.pokemonHatched.length).fill(null).map((_, i) => {
      const x = (i % 11) * 18;
      const y = Math.floor(i / 11) * 18;
      const ret = this.scene.add.image(x + 0.5 * size, y + 0.9 * size, "ha_capsule");
      ret.setOrigin(0, 0);
      ret.setScale(size / scale_size);
      ret.setVisible(true);
      this.eggListPokemonContainer.add(ret);
      return ret;
    });

    this.pokeballIcons = new Array(this.pokemonHatched.length).fill(null).map((_, i) => {
      const x = (i % 11) * 18;
      const y = Math.floor(i / 11) * 18;
      const ret = this.scene.add.image(x+ 0.1 * size, y + 0.9 * size, "icon_owned");
      ret.setOrigin(0, 0);
      ret.setScale(size / scale_size);
      ret.setVisible(true);
      this.eggListPokemonContainer.add(ret);
      return ret;
    });

    this.eggMoveIcons = new Array(this.pokemonHatched.length).fill(null).map((_, i) => {
      const x = (i % 11) * 18;
      const y = Math.floor(i / 11) * 18;
      const ret = this.scene.add.image(x + 0.8 * size, y + 0.9 * size, "icon_owned");
      ret.setOrigin(0, 0);
      ret.setScale(size / scale_size);
      ret.setVisible(true);
      ret.setTint(0.5);
      this.eggListPokemonContainer.add(ret);
      return ret;
    });

    this.infoContainers = new Array(this.pokemonHatched.length).fill(null).map((_, i) => {
      const ret = new PokemonInfoContainer(this.scene, 45, 100);
      ret.setup();
      ret.show(this.pokemonHatched[i]);
      ret.setVisible(false);
      ret.setScale(0.8);
      this.eggListPokemonContainer.add(ret);
      return ret;
    });

    let i = 0;
    for (const displayPokemon of this.pokemonHatched) {
      console.log(displayPokemon);
      // const x = (index % 9) * 18;
      // const y = Math.floor(index / 9) * 18;
      const x = (i % 11) * 18;
      const y = Math.floor(i / 11) * 18;
      const icon = this.scene.add.sprite(x-2, y+2, displayPokemon.species.getIconAtlasKey(displayPokemon.formIndex, displayPokemon.shiny, displayPokemon.variant));
      // const icon = this.scene.add.sprite(x - 2, y + 2, "egg_icons");
      icon.setScale(0.5);
      icon.setOrigin(0, 0);
      icon.setOrigin(0, 0);
      icon.setFrame(displayPokemon.species.getIconId(displayPokemon.gender === Gender.FEMALE, displayPokemon.formIndex, displayPokemon.shiny, displayPokemon.variant));
      // icon.setFrame(egg.getKey());
      this.eggListIconContainer.add(icon);
      this.iconAnimHandler.addOrUpdate(icon, PokemonIconAnimMode.NONE);

      // this.checkIconId(icon, displayPokemon.species, displayPokemon.female, displayPokemon.formIndex, displayPokemon.shiny, displayPokemon.variant);

      // DONE shiny icon funcitonality for variants
      // TODO test shiny icons
      this.shinyIcons[i].setVisible(displayPokemon.shiny);
      this.shinyIcons[i].setTint(getVariantTint(displayPokemon.variant));
      // this.shinyIcons[i].setTint(getVariantTint(speciesVariants[v] === DexAttr.DEFAULT_VARIANT ? 0 : speciesVariants[v] === DexAttr.VARIANT_2 ? 1 : 2));
      // DONE new pokemon / catch icon functionality
      // TODO test for new pokemon
      const dexEntry = this.scene.gameData.dexData[this.pokemonHatched[i].species.speciesId];
      const caughtAttr = dexEntry.caughtAttr;
      this.pokeballIcons[i].setVisible(!caughtAttr);
      // this.pokeballIcons[i].setVisible(this.scene.gameData.dexData[displayPokemon.species.speciesId].caughtAttr)


      this.hiddenAbilityIcons[i].setVisible((displayPokemon.hasAbility(displayPokemon.species.abilityHidden)));

      // TODO new egg move icon functionality
      this.eggMoveIcons[i].setVisible(false);

      this.pokeballIcons[i].setVisible(true);
      this.shinyIcons[i].setVisible(true);
      this.hiddenAbilityIcons[i].setVisible(true);
      this.infoContainers[i].setVisible(false);

      i++;
    }

    this.setCursor(0);

    return true;
  }



  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    const error = false;
    console.log("egg handler button " + button);
    if (button === Button.CANCEL) {
      const phase = this.scene.getCurrentPhase();
      if (phase instanceof EggSummaryPhase) {
        phase.end();
      }
      ui.revertMode();
      success = true;
    } else {
      const count = this.pokemonHatched.length;
      const rows = Math.ceil(count / 11);
      const row = Math.floor(this.cursor / 11);
      switch (button) {
      case Button.UP:
        if (row) {
          success = this.setCursor(this.cursor - 11);
        }
        break;
      case Button.DOWN:
        if (row < rows - 2 || (row < rows - 1 && this.cursor % 11 <= (count - 1) % 11)) {
          success = this.setCursor(this.cursor + 11);
        }
        break;
      case Button.LEFT:
        if (this.cursor % 11) {
          success = this.setCursor(this.cursor - 1);
        }
        break;
      case Button.RIGHT:
        if (this.cursor % 11 < (row < rows - 1 ? 10 : (count - 1) % 11)) {
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

  setEggDetails(egg: Egg): void {
    // this.eggSprite.setFrame(`egg_${egg.getKey()}`);
    // this.eggNameText.setText(`${i18next.t("egg:egg")} (${egg.getEggDescriptor()})`);
    // this.eggDateText.setText(
    //   new Date(egg.timestamp).toLocaleString(undefined, {
    //     weekday: "short",
    //     year: "numeric",
    //     month: "2-digit",
    //     day: "numeric"
    //   })
    // );
    // this.eggHatchWavesText.setText(egg.getEggHatchWavesMessage());
    // this.eggGachaInfoText.setText(egg.getEggTypeDescriptor(this.scene));
  }

  setCursor(cursor: integer): boolean {
    let changed = false;

    const lastCursor = this.cursor;

    changed = super.setCursor(cursor);

    if (changed) {
      this.cursorObj.setPosition(114 + 18 * (cursor % 11), 10 + 18 * Math.floor(cursor / 11));

      if (lastCursor > -1) {
        this.iconAnimHandler.addOrUpdate(this.eggListIconContainer.getAt(lastCursor) as Phaser.GameObjects.Sprite, PokemonIconAnimMode.NONE);
        this.infoContainers[lastCursor].setVisible(false);
      }
      this.iconAnimHandler.addOrUpdate(this.eggListIconContainer.getAt(cursor) as Phaser.GameObjects.Sprite, PokemonIconAnimMode.ACTIVE);
      this.infoContainers[cursor].setVisible(true);
      this.setEggDetails(this.scene.gameData.eggs[cursor]);

      // load sprite
      // icon.setFrame(displayPokemon.species.getIconId(, displayPokemon.formIndex, displayPokemon.shiny, displayPokemon.variant));
      const displayPokemon = this.pokemonHatched[cursor];
      const species = displayPokemon.species;
      const female = displayPokemon.gender === Gender.FEMALE;
      const formIndex = displayPokemon.formIndex;
      const shiny = displayPokemon.shiny;
      const variant = displayPokemon.variant;

      species.loadAssets(this.scene, female, formIndex, shiny, variant, true).then(() => {
        // if (assetLoadCancelled.value) {
        //   return;
        // }
        // this.assetLoadCancelled = null;
        // this.speciesLoaded.set(species.speciesId, true);
        // redundant setVisible(true) but makes sure sprite is only visible after being rendered (no substitute visible)
        this.currentPokemonSprite.setVisible(true);
        this.currentPokemonSprite.play(species.getSpriteKey(female, formIndex, shiny, variant));
        this.currentPokemonSprite.setPipelineData("shiny", shiny);
        this.currentPokemonSprite.setPipelineData("variant", variant);
        this.currentPokemonSprite.setPipelineData("spriteKey", species.getSpriteKey(female, formIndex, shiny, variant));
        // this.pokemonSprite.setVisible(!this.statsMode);
      });
    }

    return changed;
  }

}
