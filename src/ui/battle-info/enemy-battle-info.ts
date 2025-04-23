import BattleInfo from "./battle-info";
import { globalScene } from "#app/global-scene";
import BattleFlyout from "../battle-flyout";
import { addTextObject, TextStyle } from "#app/ui/text";
import { addWindow, WindowVariant } from "#app/ui/ui-theme";
import { Stat } from "#enums/stat";
import type { EnemyPokemon } from "#app/field/pokemon";

export class EnemyBattleInfo extends BattleInfo {
  protected player: false = false;
  protected championRibbon: Phaser.GameObjects.Sprite;
  protected ownedIcon: Phaser.GameObjects.Sprite;
  protected flyoutMenu: BattleFlyout;

  // #region Type effectiveness hint objects
  protected effectivenessContainer: Phaser.GameObjects.Container;
  protected effectivenessWindow: Phaser.GameObjects.NineSlice;
  protected effectivenessText: Phaser.GameObjects.Text;
  protected currentEffectiveness?: string;
  // #endregion

  override get statOrder(): Stat[] {
    return [Stat.HP, Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.ACC, Stat.EVA, Stat.SPD];
  }

  constructor() {
    super(140, -141, false);

    this.ownedIcon = globalScene.add.sprite(0, 0, "icon_owned").setName("icon_owned").setVisible(false).setOrigin(0, 0);
    this.ownedIcon.setPositionRelative(this.nameText, 0, 11.75);
    this.add(this.ownedIcon);

    this.championRibbon = globalScene.add
      .sprite(0, 0, "champion_ribbon")
      .setName("icon_champion_ribbon")
      .setVisible(false)
      .setOrigin(0, 0);
    this.championRibbon.setPositionRelative(this.nameText, 8, 11.75);
    this.add(this.championRibbon);

    this.flyoutMenu = new BattleFlyout(this.player);
    this.add(this.flyoutMenu);

    this.moveBelow<Phaser.GameObjects.GameObject>(this.flyoutMenu, this.box);

    this.effectivenessContainer = globalScene.add.container(0, 0).setVisible(false);
    this.effectivenessContainer.setPositionRelative(this.type1Icon, 22, 4);
    this.add(this.effectivenessContainer);

    this.effectivenessText = addTextObject(5, 4.5, "", TextStyle.BATTLE_INFO);
    this.effectivenessWindow = addWindow(0, 0, 0, 20, undefined, false, undefined, undefined, WindowVariant.XTHIN);

    this.effectivenessContainer.add([this.effectivenessWindow, this.effectivenessText]);
  }

  override initInfo(pokemon: EnemyPokemon): void {
    this.flyoutMenu.initInfo(pokemon);
    super.initInfo(pokemon);
  }

  /**
   * Show or hide the type effectiveness multiplier window
   * Passing undefined will hide the window
   */
  updateEffectiveness(effectiveness?: string) {
    this.currentEffectiveness = effectiveness;

    if (!globalScene.typeHints || effectiveness === undefined || this.flyoutMenu.flyoutVisible) {
      this.effectivenessContainer.setVisible(false);
      return;
    }

    this.effectivenessText.setText(effectiveness);
    this.effectivenessWindow.width = 10 + this.effectivenessText.displayWidth;
    this.effectivenessContainer.setVisible(true);
  }

  /**
   * Request the flyoutMenu to toggle if available and hides or shows the effectiveness window where necessary
   */
  toggleFlyout(visible: boolean): void {
    this.flyoutMenu.toggleFlyout(visible);

    if (visible) {
      this.effectivenessContainer?.setVisible(false);
    } else {
      this.updateEffectiveness(this.currentEffectiveness);
    }
  }

  setMini(_mini: boolean): void {} // Always mini
}
