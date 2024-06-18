import BattleScene from "../battle-scene";
import PokemonSpecies from "../data/pokemon-species";
import { addTextObject, TextStyle } from "./text";

export class StarterContainer extends Phaser.GameObjects.Container {
  public scene: BattleScene;
  public species: PokemonSpecies;
  public icon: Phaser.GameObjects.Sprite;
  public shinyIcons: Phaser.GameObjects.Image[] = [];
  public label: Phaser.GameObjects.Text;
  public hiddenAbilityIcon: Phaser.GameObjects.Image;
  public classicWinIcon: Phaser.GameObjects.Image;
  public candyUpgradeIcon: Phaser.GameObjects.Image;
  public candyUpgradeOverlayIcon: Phaser.GameObjects.Image;
  public cost: number = 0;

  constructor(scene: BattleScene, species: PokemonSpecies) {
    super(scene, 0, 0);

    this.species = species;

    const defaultDexAttr = scene.gameData.getSpeciesDefaultDexAttr(species, false, true);
    const defaultProps = scene.gameData.getSpeciesDexAttrProps(species, defaultDexAttr);

    // icon
    this.icon = this.scene.add.sprite(-2, 2, species.getIconAtlasKey(defaultProps.formIndex, defaultProps.shiny, defaultProps.variant));
    this.icon.setScale(0.5);
    this.icon.setOrigin(0, 0);
    this.icon.setFrame(species.getIconId(defaultProps.female, defaultProps.formIndex, defaultProps.shiny, defaultProps.variant));
    this.checkIconId(defaultProps.female, defaultProps.formIndex, defaultProps.shiny, defaultProps.variant);
    this.icon.setTint(0);
    this.add(this.icon);

    // shiny icons
    for (let i = 0; i < 3; i++) {
      const shinyIcon = this.scene.add.image(i * -3 + 12, 2, "shiny_star_small");
      shinyIcon.setScale(0.5);
      shinyIcon.setOrigin(0, 0);
      shinyIcon.setVisible(false);
      this.shinyIcons.push(shinyIcon);
    }
    this.add(this.shinyIcons);

    // value label
    const label = addTextObject(this.scene, 1, 2, "0", TextStyle.WINDOW, { fontSize: "32px" });
    label.setShadowOffset(2, 2);
    label.setOrigin(0, 0);
    label.setVisible(false);
    this.add(label);
    this.label = label;

    // hidden ability icon
    const abilityIcon = this.scene.add.image(12, 7, "ha_capsule");
    abilityIcon.setOrigin(0, 0);
    abilityIcon.setScale(0.5);
    abilityIcon.setVisible(false);
    this.add(abilityIcon);
    this.hiddenAbilityIcon = abilityIcon;

    // classic win icon
    const classicWinIcon = this.scene.add.image(2, 12, "champion_ribbon");
    classicWinIcon.setOrigin(0, 0);
    classicWinIcon.setScale(0.5);
    classicWinIcon.setVisible(false);
    this.add(classicWinIcon);
    this.classicWinIcon = classicWinIcon;

    // candy upgrade icon
    const candyUpgradeIcon = this.scene.add.image(12, 12, "candy");
    candyUpgradeIcon.setOrigin(0, 0);
    candyUpgradeIcon.setScale(0.25);
    candyUpgradeIcon.setVisible(false);
    this.add(candyUpgradeIcon);
    this.candyUpgradeIcon = candyUpgradeIcon;

    // candy upgrade overlay icon
    const candyUpgradeOverlayIcon = this.scene.add.image(12, 12, "candy_overlay");
    candyUpgradeOverlayIcon.setOrigin(0, 0);
    candyUpgradeOverlayIcon.setScale(0.25);
    candyUpgradeOverlayIcon.setVisible(false);
    this.add(candyUpgradeOverlayIcon);
    this.candyUpgradeOverlayIcon = candyUpgradeOverlayIcon;
  }

  checkIconId(female, formIndex, shiny, variant) {
    if (this.icon.frame.name !== this.species.getIconId(female, formIndex, shiny, variant)) {
      console.log(`${this.species.name}'s variant icon does not exist. Replacing with default.`);
      this.icon.setTexture(this.species.getIconAtlasKey(formIndex, false, variant));
      this.icon.setFrame(this.species.getIconId(female, formIndex, false, variant));
    }
  }
}
