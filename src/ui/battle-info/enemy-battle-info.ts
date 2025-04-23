import BattleInfo from "./battle-info";
import { globalScene } from "#app/global-scene";
import BattleFlyout from "../battle-flyout";
import { addTextObject, TextStyle } from "#app/ui/text";
import { addWindow, WindowVariant } from "#app/ui/ui-theme";
import { Stat } from "#enums/stat";

export class EnemyBattleInfo extends BattleInfo {
  protected player: false = false;
  protected championRibbon: Phaser.GameObjects.Sprite;
  protected ownedIcon: Phaser.GameObjects.Sprite;
  public flyoutMenu: BattleFlyout;

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

    this.ownedIcon = globalScene.add.sprite(0, 0, "icon_owned");
    this.ownedIcon.setName("icon_owned");
    this.ownedIcon.setVisible(false);
    this.ownedIcon.setOrigin(0, 0);
    this.ownedIcon.setPositionRelative(this.nameText, 0, 11.75);
    this.add(this.ownedIcon);

    this.championRibbon = globalScene.add.sprite(0, 0, "champion_ribbon");
    this.championRibbon.setName("icon_champion_ribbon");
    this.championRibbon.setVisible(false);
    this.championRibbon.setOrigin(0, 0);
    this.championRibbon.setPositionRelative(this.nameText, 8, 11.75);
    this.add(this.championRibbon);

    this.flyoutMenu = new BattleFlyout(this.player);
    this.add(this.flyoutMenu);

    this.moveBelow<Phaser.GameObjects.GameObject>(this.flyoutMenu, this.box);

    this.effectivenessContainer = globalScene.add.container(0, 0);
    this.effectivenessContainer.setPositionRelative(this.type1Icon, 22, 4);
    this.effectivenessContainer.setVisible(false);
    this.add(this.effectivenessContainer);

    this.effectivenessText = addTextObject(5, 4.5, "", TextStyle.BATTLE_INFO);
    this.effectivenessWindow = addWindow(0, 0, 0, 20, undefined, false, undefined, undefined, WindowVariant.XTHIN);

    this.effectivenessContainer.add(this.effectivenessWindow);
    this.effectivenessContainer.add(this.effectivenessText);
  }

  setMini(_mini: boolean): void {} // Always mini
}
