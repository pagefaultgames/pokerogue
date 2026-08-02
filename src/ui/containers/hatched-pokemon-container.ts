import { globalScene } from "#app/global-scene";
import type { EggHatchData } from "#data/egg-hatch-data";
import { Gender } from "#data/gender";
import type { PokemonSpecies } from "#data/pokemon-species";
import { DexAttr } from "#enums/dex-attr";
import { getVariantTint } from "#sprites/variant";
import type { PokemonIconAnimHelper } from "#ui/pokemon-icon-anim-helper";
import { PokemonIconAnimMode } from "#ui/pokemon-icon-anim-helper";

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

  private readonly iconAnimHandler: PokemonIconAnimHelper;
  /** Whether the current hatch is a new catch, shiny/variant or form, i.e. whether it idles animated */
  private isNewUnlock = false;
  /** Whether this cell is the one the grid cursor is currently on */
  private highlighted = false;

  /**
   * @param iconAnimHandler the {@linkcode PokemonIconAnimHelper} driving this container's icon animation
   * @param x x position
   * @param y y position
   */
  constructor(iconAnimHandler: PokemonIconAnimHelper, x = 0, y = 0) {
    super(globalScene, x, y);

    this.iconAnimHandler = iconAnimHandler;

    const offset = 2;
    const rightSideX = 12;

    // Placeholder sprites, `setHatchData` should be called before display
    const pokemonIcon = globalScene.add.sprite(-offset, offset, "pokemon_icons_0");
    pokemonIcon.setScale(0.5);
    pokemonIcon.setOrigin(0, 0);
    this.icon = pokemonIcon;
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
   * @param hatchData the {@linkcode EggHatchData} to base the icons on
   */
  setHatchData(hatchData: EggHatchData): void {
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

    this.isNewUnlock = !caughtAttr || newShinyOrVariant || newForm;
    this.highlighted = false;
    this.applyAnimMode();
  }

  /**
   * @param highlighted - whether this container is the selected one
   */
  setHighlighted(highlighted: boolean): void {
    if (this.highlighted === highlighted) {
      return;
    }
    this.highlighted = highlighted;
    this.applyAnimMode();
  }

  /**
   * Push the animation mode implied by the current hatch data and highlight state onto the icon.
   */
  private applyAnimMode(): void {
    if (this.highlighted) {
      this.iconAnimHandler.addOrUpdate(this.icon, PokemonIconAnimMode.ACTIVE);
      return;
    }
    if (this.isNewUnlock) {
      this.iconAnimHandler.addOrUpdate(this.icon, PokemonIconAnimMode.PASSIVE);
      return;
    }
    this.iconAnimHandler.addOrUpdate(this.icon, PokemonIconAnimMode.NONE);
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
