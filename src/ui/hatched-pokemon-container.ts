import { EggHatchData } from "#app/data/egg-hatch-data";
import { Gender } from "#app/data/gender";
import { getVariantTint } from "#app/data/variant";
import { DexAttr } from "#app/system/game-data";
import BattleScene from "#app/battle-scene";
import PokemonSpecies from "#app/data/pokemon-species";
import PokemonIconAnimHandler, { PokemonIconAnimMode } from "./pokemon-icon-anim-handler";

/**
 * A container for a Pokemon's sprite and icons to get displayed in the egg summary screen
 * Shows the Pokemon's sprite, surrounded by icons for:
 * shiny variant, hidden ability, new egg move, new catch
 */
export class HatchedPokemonContainer extends Phaser.GameObjects.Container {
  public scene: BattleScene;
  public species: PokemonSpecies;
  public icon: Phaser.GameObjects.Sprite;
  public shinyIcon: Phaser.GameObjects.Image;
  public hiddenAbilityIcon: Phaser.GameObjects.Image;
  public pokeballIcon: Phaser.GameObjects.Image;
  public eggMoveIcon: Phaser.GameObjects.Image;

  /**
   * @param scene the current {@linkcode BattleScene}
   * @param x x position
   * @param y y position
   * @param hatchData the {@linkcode EggHatchData} to load the icons and sprites for
   */
  constructor(scene: BattleScene, x: number, y: number, hatchData: EggHatchData) {
    super(scene, x, y);

    const displayPokemon = hatchData.pokemon;
    this.species = displayPokemon.species;

    const offset = 2;
    const rightSideX = 12;
    const species = displayPokemon.species;
    const female = displayPokemon.gender === Gender.FEMALE;
    const formIndex = displayPokemon.formIndex;
    const variant = displayPokemon.variant;
    const isShiny = displayPokemon.shiny;

    // Pokemon sprite
    const pokemonIcon = this.scene.add.sprite(-offset, offset, species.getIconAtlasKey(formIndex, isShiny, variant));
    pokemonIcon.setScale(0.5);
    pokemonIcon.setOrigin(0, 0);
    pokemonIcon.setFrame(species.getIconId(female, formIndex, isShiny, variant));
    this.icon = pokemonIcon;
    this.checkIconId(female, formIndex, isShiny, variant);
    this.add(this.icon);

    // Shiny icon
    this.shinyIcon = this.scene.add.image(rightSideX, offset, "shiny_star_small");
    this.shinyIcon.setOrigin(0, 0);
    this.shinyIcon.setScale(0.5);
    this.add(this.shinyIcon);

    // Hidden ability icon
    const haIcon = this.scene.add.image(rightSideX, offset * 4, "ha_capsule");
    haIcon.setOrigin(0, 0);
    haIcon.setScale(0.5);
    this.hiddenAbilityIcon = haIcon;
    this.add(this.hiddenAbilityIcon);

    // Pokeball icon
    const pokeballIcon = this.scene.add.image(rightSideX, offset * 7, "icon_owned");
    pokeballIcon.setOrigin(0, 0);
    pokeballIcon.setScale(0.5);
    this.pokeballIcon = pokeballIcon;
    this.add(this.pokeballIcon);

    // Egg move icon
    const eggMoveIcon = this.scene.add.image(0, offset, "icon_egg_move");
    eggMoveIcon.setOrigin(0, 0);
    eggMoveIcon.setScale(0.5);
    this.eggMoveIcon = eggMoveIcon;
    this.add(this.eggMoveIcon);
  }

  /**
   * Update the Pokemon's sprite and icons based on new hatch data
   * Animates the pokemon icon if it has a new form or shiny variant
   *
   * @param hatchData the {@linkcode EggHatchData} to base the icons on
   * @param iconAnimHandler the {@linkcode PokemonIconAnimHandler} to use to animate the sprites
   */
  updateAndAnimate(hatchData: EggHatchData, iconAnimHandler: PokemonIconAnimHandler) {
    const displayPokemon = hatchData.pokemon;
    this.species = displayPokemon.species;

    const dexEntry = hatchData.dexEntryBeforeUpdate;
    const caughtAttr = dexEntry.caughtAttr;
    const newShiny = BigInt(1 << (displayPokemon.shiny ? 1 : 0));
    const newVariant = BigInt(1 << (displayPokemon.variant + 4));
    const newShinyOrVariant = ((newShiny & caughtAttr) === BigInt(0)) || ((newVariant & caughtAttr) === BigInt(0));
    const newForm = (BigInt(1 << displayPokemon.formIndex) * DexAttr.DEFAULT_FORM & caughtAttr) === BigInt(0);

    const female = displayPokemon.gender === Gender.FEMALE;
    const formIndex = displayPokemon.formIndex;
    const variant = displayPokemon.variant;
    const isShiny = displayPokemon.shiny;

    this.icon.setTexture(this.species.getIconAtlasKey(formIndex, isShiny, variant));
    this.icon.setFrame(this.species.getIconId(female, formIndex, isShiny, variant));
    this.checkIconId(female, formIndex, isShiny, variant);

    this.shinyIcon.setVisible(displayPokemon.shiny);
    this.shinyIcon.setTint(getVariantTint(displayPokemon.variant));

    this.eggMoveIcon.setVisible(hatchData.eggMoveUnlocked);
    this.hiddenAbilityIcon.setVisible(displayPokemon.abilityIndex === 2);
    this.pokeballIcon.setVisible(!caughtAttr || newForm);

    // add animation to the Pokemon sprite for new unlocks (new catch, new shiny or new form)
    if (!caughtAttr || newShinyOrVariant || newForm) {
      iconAnimHandler.addOrUpdate(this.icon, PokemonIconAnimMode.PASSIVE);
    } else {
      iconAnimHandler.addOrUpdate(this.icon, PokemonIconAnimMode.NONE);
    }
  }

  /**
   * Check if the given Pokemon icon exists, otherwise replace it with a default one
   * @param female `true` to get the female icon
   * @param formIndex the form index
   * @param shiny whether the Pokemon is shiny
   * @param variant the shiny variant
   */
  private checkIconId(female: boolean, formIndex: number, shiny: boolean, variant: number) {
    if (this.icon.frame.name !== this.species.getIconId(female, formIndex, shiny, variant)) {
      console.log(`${this.species.name}'s variant icon does not exist. Replacing with default.`);
      this.icon.setTexture(this.species.getIconAtlasKey(formIndex, false, variant));
      this.icon.setFrame(this.species.getIconId(female, formIndex, false, variant));
    }
  }
}
