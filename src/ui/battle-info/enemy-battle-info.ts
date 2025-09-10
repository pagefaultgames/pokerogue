import { globalScene } from "#app/global-scene";
import { Stat } from "#enums/stat";
import { TextStyle } from "#enums/text-style";
import { UiTheme } from "#enums/ui-theme";
import type { EnemyPokemon } from "#field/pokemon";
import type { BattleInfoParamList } from "#ui/battle-info";
import { BattleInfo } from "#ui/battle-info";
import { BattleFlyout } from "#ui/containers/battle-flyout";
import { addTextObject } from "#ui/text";
import { addWindow, WindowVariant } from "#ui/ui-theme";
import { getLocalizedSpriteKey } from "#utils/common";
import i18next from "i18next";
import type { GameObjects } from "phaser";

export class EnemyBattleInfo extends BattleInfo {
  protected player: false = false;
  protected championRibbon: Phaser.GameObjects.Sprite;
  protected ownedIcon: Phaser.GameObjects.Sprite;
  protected flyoutMenu: BattleFlyout;

  protected hpBarSegmentDividers: GameObjects.Rectangle[] = [];

  // #region Type effectiveness hint objects
  protected effectivenessContainer: Phaser.GameObjects.Container;
  protected effectivenessWindow: Phaser.GameObjects.NineSlice;
  protected effectivenessText: Phaser.GameObjects.Text;
  protected currentEffectiveness?: string;
  // #endregion

  override get statOrder(): Stat[] {
    return [Stat.HP, Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.ACC, Stat.EVA, Stat.SPD];
  }

  override getTextureName(): string {
    return this.boss ? "pbinfo_enemy_boss" : "pbinfo_enemy_mini";
  }

  override constructTypeIcons(): void {
    this.type1Icon = globalScene.add.sprite(-15, -15.5, "pbinfo_enemy_type1").setName("icon_type_1").setOrigin(0);
    this.type2Icon = globalScene.add.sprite(-15, -2.5, "pbinfo_enemy_type2").setName("icon_type_2").setOrigin(0);
    this.type3Icon = globalScene.add.sprite(0, -15.5, "pbinfo_enemy_type").setName("icon_type_3").setOrigin(0);
    this.add([this.type1Icon, this.type2Icon, this.type3Icon]);
  }

  constructor() {
    const posParams: BattleInfoParamList = {
      nameTextX: -124,
      nameTextY: -11.2,
      levelContainerX: -50,
      levelContainerY: -5,
      hpBarX: -71,
      hpBarY: 4.5,
      statBox: {
        xOffset: 5,
        paddingX: 2,
        statOverflow: 0,
      },
    };

    super(140, -141, false, posParams);

    this.ownedIcon = globalScene.add
      .sprite(0, 0, "icon_owned")
      .setName("icon_owned")
      .setVisible(false)
      .setOrigin(0, 0)
      .setPositionRelative(this.nameText, 0, 11.75);

    this.championRibbon = globalScene.add
      .sprite(0, 0, "champion_ribbon")
      .setName("icon_champion_ribbon")
      .setVisible(false)
      .setOrigin(0, 0)
      .setPositionRelative(this.nameText, 8, 11.75);
    // Ensure these two icons are positioned below the stats container
    this.addAt([this.ownedIcon, this.championRibbon], this.getIndex(this.statsContainer));

    this.flyoutMenu = new BattleFlyout(this.player);
    this.add(this.flyoutMenu);

    this.moveBelow<Phaser.GameObjects.GameObject>(this.flyoutMenu, this.box);

    this.effectivenessContainer = globalScene.add
      .container(0, 0)
      .setVisible(false)
      .setPositionRelative(this.type1Icon, 22, 4);
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
      globalScene.gameMode.isClassic
      && globalScene.gameData.starterData[pokemon.species.getRootSpeciesId()].classicWinCount > 0
      && globalScene.gameData.starterData[pokemon.species.getRootSpeciesId(true)].classicWinCount > 0
    ) {
      // move the ribbon to the left if there is no owned icon
      const championRibbonX = this.ownedIcon.visible ? 8 : 0;
      this.championRibbon.setPositionRelative(this.nameText, championRibbonX, 11.75);
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
      this.effectivenessContainer.setVisible(false);
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
        this.statValuesContainer,
      ].map(e => (e.x += 48 * (boss ? -1 : 1)));
      this.hpBar.x += 38 * (boss ? -1 : 1);
      this.hpBar.y += 2 * (this.boss ? -1 : 1);
      this.hpBar.setTexture(`overlay_hp${boss ? "_boss" : ""}`);
      this.hpLabel.x += 38 * (boss ? -1 : 1);
      this.hpLabel.y += 1 * (this.boss ? -1 : 1);
      this.hpLabel.setTexture(getLocalizedSpriteKey(`overlay_hp_label${boss ? "_boss" : ""}`));
      this.levelContainer.x += 2 * (boss ? -1 : 1);
      this.box.setTexture(this.getTextureName());
      this.statsBox.setTexture(`${this.getTextureName()}_stats`);
    }

    this.bossSegments = boss ? pokemon.bossSegments : 0;
    this.updateBossSegmentDividers(pokemon);
  }

  updateBossSegmentDividers(pokemon: EnemyPokemon): void {
    while (this.hpBarSegmentDividers.length > 0) {
      this.hpBarSegmentDividers.pop()?.destroy();
    }

    if (this.boss && this.bossSegments > 1) {
      const isLegacyUiTheme = globalScene.uiTheme === UiTheme.LEGACY;
      const maxHp = pokemon.getMaxHp();
      for (let s = 1; s < this.bossSegments; s++) {
        const dividerX = (Math.round((maxHp / this.bossSegments) * s) / maxHp) * this.hpBar.width;
        const divider = globalScene.add.rectangle(
          0,
          0,
          1,
          this.hpBar.height - (isLegacyUiTheme ? 0 : 1),
          pokemon.bossSegmentIndex >= s ? 0xffffff : 0x404040,
        );
        divider.setOrigin(0.5, 0).setName("hpBar_divider_" + s.toString());
        this.add(divider);
        this.moveBelow(divider as Phaser.GameObjects.GameObject, this.statsContainer);

        divider.setPositionRelative(this.hpBar, dividerX, isLegacyUiTheme ? 0 : 1);
        this.hpBarSegmentDividers.push(divider);
      }
    }
  }

  override updateStatusIcon(pokemon: EnemyPokemon): void {
    super.updateStatusIcon(pokemon, (this.ownedIcon.visible ? 8 : 0) + (this.championRibbon.visible ? 8 : 0));
  }

  protected override updatePokemonHp(
    pokemon: EnemyPokemon,
    resolve: (r: void | PromiseLike<void>) => void,
    instant?: boolean,
  ): void {
    super.updatePokemonHp(pokemon, resolve, instant);
    this.lastHp = pokemon.hp;
  }
}
