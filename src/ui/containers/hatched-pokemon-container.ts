import { globalScene } from "#app/global-scene";
import type { EggHatchData } from "#data/egg-hatch-data";
import { Gender } from "#data/gender";
import type { PokemonSpecies } from "#data/pokemon-species";
import { DexAttr } from "#enums/dex-attr";
import { getVariantTint } from "#sprites/variant";
import type { PokemonIconAnimHandler } from "#ui/handlers/pokemon-icon-anim-handler";
import { PokemonIconAnimMode } from "#ui/handlers/pokemon-icon-anim-handler";

/**
 * A container for a Pokemon's sprite and icons to get displayed in the egg summary screen
 * Shows the Pokemon's sprite, surrounded by icons for:
 * shiny variant, hidden ability, new egg move, new catch
 */
export class HatchedPokemonContainer extends Phaser.GameObjects.Container {
  public species: PokemonSpecies;
  public icon: Phaser.GameObjects.Sprite;
  public shinyIcon: Phaser.GameObjects.Image;
  public hiddenAbilityIcon: Phaser.GameObjects.Image;
  public pokeballIcon: Phaser.GameObjects.Image;
  public eggMoveIcon: Phaser.GameObjects.Image;

  /**
   * @param x x position
   * @param y y position
   * @param hatchData the {@linkcode EggHatchData} to load the icons and sprites for
   */
  constructor(x: number, y: number, hatchData: EggHatchData) {
    super(globalScene, x, y);

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
    const pokemonIcon = globalScene.add.sprite(-offset, offset, species.getIconAtlasKey(formIndex, isShiny, variant));
    pokemonIcon.setScale(0.5);
    pokemonIcon.setOrigin(0, 0);
    pokemonIcon.setFrame(species.getIconId(female, formIndex, isShiny, variant));
    this.icon = pokemonIcon;
    this.checkIconId(female, formIndex, isShiny, variant);
    this.add(this.icon);

    // Shiny icon
    this.shinyIcon = globalScene.add.image(rightSideX, offset, "shiny_star_small");
    this.shinyIcon.setOrigin(0, 0);
    this.shinyIcon.setScale(0.5);
    this.add(this.shinyIcon);

    // Hidden ability icon
    const haIcon = globalScene.add.image(rightSideX, offset * 4, "ha_capsule");
    haIcon.setOrigin(0, 0);
    haIcon.setScale(0.5);
    this.hiddenAbilityIcon = haIcon;
    this.add(this.hiddenAbilityIcon);

    // Pokeball icon
    const pokeballIcon = globalScene.add.image(rightSideX, offset * 7, "icon_owned");
    pokeballIcon.setOrigin(0, 0);
    pokeballIcon.setScale(0.5);
    this.pokeballIcon = pokeballIcon;
    this.add(this.pokeballIcon);

    // Egg move icon
    const eggMoveIcon = globalScene.add.image(0, offset, "icon_egg_move");
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
    const newShinyOrVariant = (newShiny & caughtAttr) === BigInt(0) || (newVariant & caughtAttr) === BigInt(0);
    const newForm = ((BigInt(1 << displayPokemon.formIndex) * DexAttr.DEFAULT_FORM) & caughtAttr) === BigInt(0);

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
