import BattleInfo from "./battle-info";
import { globalScene } from "#app/global-scene";
import BattleFlyout from "../battle-flyout";
import { addTextObject, TextStyle } from "#app/ui/text";
import { addWindow, WindowVariant } from "#app/ui/ui-theme";
import { Stat } from "#enums/stat";
import type { EnemyPokemon } from "#app/field/pokemon";
import i18next from "i18next";

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

    if (this.nameText.visible) {
      this.nameText
        .on("pointerover", () =>
          globalScene.ui.showTooltip(
            "",
            i18next.t("battleInfo:generation", {
              generation: i18next.t(`starterSelectUiHandler:gen${pokemon.species.generation}`),
            }),
          ),
        )
        .on("pointerout", () => globalScene.ui.hideTooltip());
    }

    const dexEntry = globalScene.gameData.dexData[pokemon.species.speciesId];
    this.ownedIcon.setVisible(!!dexEntry.caughtAttr);
    const opponentPokemonDexAttr = pokemon.getDexAttr();
    if (
      globalScene.gameMode.isClassic &&
      globalScene.gameData.starterData[pokemon.species.getRootSpeciesId()].classicWinCount > 0 &&
      globalScene.gameData.starterData[pokemon.species.getRootSpeciesId(true)].classicWinCount > 0
    ) {
      this.championRibbon.setVisible(true);
    }

    // Check if Player owns all genders and forms of the Pokemon
    const missingDexAttrs = (dexEntry.caughtAttr & opponentPokemonDexAttr) < opponentPokemonDexAttr;

    const ownedAbilityAttrs = globalScene.gameData.starterData[pokemon.species.getRootSpeciesId()].abilityAttr;

    // Check if the player owns ability for the root form
    const playerOwnsThisAbility = pokemon.checkIfPlayerHasAbilityOfStarter(ownedAbilityAttrs);

    if (missingDexAttrs || !playerOwnsThisAbility) {
      this.ownedIcon.setTint(0x808080);
    }

    if (this.boss) {
      this.updateBossSegmentDividers(pokemon as EnemyPokemon);
    }
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

  updateBossSegments(pokemon: EnemyPokemon): void {
    const boss = !!pokemon.bossSegments;

    if (boss !== this.boss) {
      this.boss = boss;

      [
        this.nameText,
        this.genderText,
        this.teraIcon,
        this.splicedIcon,
        this.shinyIcon,
        this.ownedIcon,
        this.championRibbon,
        this.statusIndicator,
        this.levelContainer,
        this.statValuesContainer,
      ].map(e => (e.x += 48 * (boss ? -1 : 1)));
      this.hpBar.x += 38 * (boss ? -1 : 1);
      this.hpBar.y += 2 * (this.boss ? -1 : 1);
      this.hpBar.setTexture(`overlay_hp${boss ? "_boss" : ""}`);
      this.box.setTexture(this.getTextureName());
      this.statsBox.setTexture(`${this.getTextureName()}_stats`);
    }

    this.bossSegments = boss ? pokemon.bossSegments : 0;
    this.updateBossSegmentDividers(pokemon);
  }

  updateBossSegmentDividers(pokemon: EnemyPokemon): void {
    while (this.hpBarSegmentDividers.length) {
      this.hpBarSegmentDividers.pop()?.destroy();
    }

    if (this.boss && this.bossSegments > 1) {
      const uiTheme = globalScene.uiTheme;
      const maxHp = pokemon.getMaxHp();
      for (let s = 1; s < this.bossSegments; s++) {
        const dividerX = (Math.round((maxHp / this.bossSegments) * s) / maxHp) * this.hpBar.width;
        const divider = globalScene.add.rectangle(
          0,
          0,
          1,
          this.hpBar.height - (uiTheme ? 0 : 1),
          pokemon.bossSegmentIndex >= s ? 0xffffff : 0x404040,
        );
        divider.setOrigin(0.5, 0);
        divider.setName("hpBar_divider_" + s.toString());
        this.add(divider);
        this.moveBelow(divider as Phaser.GameObjects.GameObject, this.statsContainer);

        divider.setPositionRelative(this.hpBar, dividerX, uiTheme ? 0 : 1);
        this.hpBarSegmentDividers.push(divider);
      }
    }
  }

  setMini(_mini: boolean): void {} // Always mini
}
