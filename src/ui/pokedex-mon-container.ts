import { globalScene } from "#app/global-scene";
import type PokemonSpecies from "../data/pokemon-species";
import { addTextObject, TextStyle } from "./text";

export class PokedexMonContainer extends Phaser.GameObjects.Container {
  public species: PokemonSpecies;
  public icon: Phaser.GameObjects.Sprite;
  public shinyIcons: Phaser.GameObjects.Image[] = [];
  public label: Phaser.GameObjects.Text;
  public starterPassiveBgs: Phaser.GameObjects.Image;
  public hiddenAbilityIcon: Phaser.GameObjects.Image;
  public favoriteIcon: Phaser.GameObjects.Image;
  public classicWinIcon: Phaser.GameObjects.Image;
  public candyUpgradeIcon: Phaser.GameObjects.Image;
  public candyUpgradeOverlayIcon: Phaser.GameObjects.Image;
  public eggMove1Icon: Phaser.GameObjects.Image;
  public tmMove1Icon: Phaser.GameObjects.Image;
  public eggMove2Icon: Phaser.GameObjects.Image;
  public tmMove2Icon: Phaser.GameObjects.Image;
  public passive1Icon: Phaser.GameObjects.Image;
  public passive2Icon: Phaser.GameObjects.Image;
  public cost: number = 0;

  constructor(species: PokemonSpecies) {
    super(globalScene, 0, 0);

    this.species = species;

    const defaultDexAttr = globalScene.gameData.getSpeciesDefaultDexAttr(species, false, true);
    const defaultProps = globalScene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);

    // starter passive bg
    const starterPassiveBg = globalScene.add.image(2, 5, "passive_bg");
    starterPassiveBg.setOrigin(0, 0);
    starterPassiveBg.setScale(0.75);
    starterPassiveBg.setVisible(false);
    this.add(starterPassiveBg);
    this.starterPassiveBgs = starterPassiveBg;

    // icon
    this.icon = globalScene.add.sprite(-2, 2, species.getIconAtlasKey(defaultProps.formIndex, defaultProps.shiny, defaultProps.variant));
    this.icon.setScale(0.5);
    this.icon.setOrigin(0, 0);
    this.icon.setFrame(species.getIconId(defaultProps.female, defaultProps.formIndex, defaultProps.shiny, defaultProps.variant));
    this.checkIconId(defaultProps.female, defaultProps.formIndex, defaultProps.shiny, defaultProps.variant);
    this.icon.setTint(0);
    this.add(this.icon);

    // shiny icons
    for (let i = 0; i < 3; i++) {
      const shinyIcon = globalScene.add.image(i * -3 + 12, 2, "shiny_star_small");
      shinyIcon.setScale(0.5);
      shinyIcon.setOrigin(0, 0);
      shinyIcon.setVisible(false);
      this.shinyIcons.push(shinyIcon);
    }
    this.add(this.shinyIcons);

    // value label
    const label = addTextObject(1, 2, "0", TextStyle.WINDOW, { fontSize: "32px" });
    label.setShadowOffset(2, 2);
    label.setOrigin(0, 0);
    label.setVisible(false);
    this.add(label);
    this.label = label;

    // hidden ability icon
    const abilityIcon = globalScene.add.image(12, 7, "ha_capsule");
    abilityIcon.setOrigin(0, 0);
    abilityIcon.setScale(0.5);
    abilityIcon.setVisible(false);
    this.add(abilityIcon);
    this.hiddenAbilityIcon = abilityIcon;

    // favorite icon
    const favoriteIcon = globalScene.add.image(0, 7, "favorite");
    favoriteIcon.setOrigin(0, 0);
    favoriteIcon.setScale(0.5);
    favoriteIcon.setVisible(false);
    this.add(favoriteIcon);
    this.favoriteIcon = favoriteIcon;

    // classic win icon
    const classicWinIcon = globalScene.add.image(0, 12, "champion_ribbon");
    classicWinIcon.setOrigin(0, 0);
    classicWinIcon.setScale(0.5);
    classicWinIcon.setVisible(false);
    this.add(classicWinIcon);
    this.classicWinIcon = classicWinIcon;

    // candy upgrade icon
    const candyUpgradeIcon = globalScene.add.image(12, 12, "candy");
    candyUpgradeIcon.setOrigin(0, 0);
    candyUpgradeIcon.setScale(0.25);
    candyUpgradeIcon.setVisible(false);
    this.add(candyUpgradeIcon);
    this.candyUpgradeIcon = candyUpgradeIcon;

    // candy upgrade overlay icon
    const candyUpgradeOverlayIcon = globalScene.add.image(12, 12, "candy_overlay");
    candyUpgradeOverlayIcon.setOrigin(0, 0);
    candyUpgradeOverlayIcon.setScale(0.25);
    candyUpgradeOverlayIcon.setVisible(false);
    this.add(candyUpgradeOverlayIcon);
    this.candyUpgradeOverlayIcon = candyUpgradeOverlayIcon;

    // move icons
    const eggMove1Icon = globalScene.add.image(0, 12, "mystery_egg");
    eggMove1Icon.setOrigin(0, 0);
    eggMove1Icon.setScale(0.25);
    eggMove1Icon.setVisible(false);
    this.add(eggMove1Icon);
    this.eggMove1Icon = eggMove1Icon;

    // move icons
    const tmMove1Icon = globalScene.add.image(0, 12, "normal_memory");
    tmMove1Icon.setOrigin(0, 0);
    tmMove1Icon.setScale(0.25);
    tmMove1Icon.setVisible(false);
    this.add(tmMove1Icon);
    this.tmMove1Icon = tmMove1Icon;

    // move icons
    const eggMove2Icon = globalScene.add.image(7, 12, "mystery_egg");
    eggMove2Icon.setOrigin(0, 0);
    eggMove2Icon.setScale(0.25);
    eggMove2Icon.setVisible(false);
    this.add(eggMove2Icon);
    this.eggMove2Icon = eggMove2Icon;

    // move icons
    const tmMove2Icon = globalScene.add.image(7, 12, "normal_memory");
    tmMove2Icon.setOrigin(0, 0);
    tmMove2Icon.setScale(0.25);
    tmMove2Icon.setVisible(false);
    this.add(tmMove2Icon);
    this.tmMove2Icon = tmMove2Icon;


    // move icons
    const passive1Icon = globalScene.add.image(3, 3, "candy");
    passive1Icon.setOrigin(0, 0);
    passive1Icon.setScale(0.25);
    passive1Icon.setVisible(false);
    this.add(passive1Icon);
    this.passive1Icon = passive1Icon;

    // move icons
    const passive2Icon = globalScene.add.image(12, 3, "candy");
    passive2Icon.setOrigin(0, 0);
    passive2Icon.setScale(0.25);
    passive2Icon.setVisible(false);
    this.add(passive2Icon);
    this.passive2Icon = passive2Icon;
  }

  checkIconId(female, formIndex, shiny, variant) {
    if (this.icon.frame.name !== this.species.getIconId(female, formIndex, shiny, variant)) {
      console.log(`${this.species.name}'s variant icon does not exist. Replacing with default.`);
      this.icon.setTexture(this.species.getIconAtlasKey(formIndex, false, variant));
      this.icon.setFrame(this.species.getIconId(female, formIndex, false, variant));
    }
  }
}
