import { EnemyPokemon, default as Pokemon } from "../field/pokemon";
import { getLevelTotalExp, getLevelRelExp } from "../data/exp";
import * as Utils from "../utils";
import { addTextObject, TextStyle } from "./text";
import { getGenderSymbol, getGenderColor, Gender } from "../data/gender";
import { StatusEffect } from "../data/status-effect";
import BattleScene from "../battle-scene";
import { Type, getTypeRgb } from "../data/type";
import { getVariantTint } from "#app/data/variant";
import { BattleStat } from "#app/data/battle-stat";
import BattleFlyout from "./battle-flyout";
import { WindowVariant, addWindow } from "./ui-theme";

const battleStatOrder = [ BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.ACC, BattleStat.EVA, BattleStat.SPD ];

export default class BattleInfo extends Phaser.GameObjects.Container {
  private baseY: number;

  private player: boolean;
  private mini: boolean;
  private boss: boolean;
  private bossSegments: integer;
  private offset: boolean;
  private lastName: string;
  private lastTeraType: Type;
  private lastStatus: StatusEffect;
  private lastHp: integer;
  private lastMaxHp: integer;
  private lastHpFrame: string;
  private lastExp: integer;
  private lastLevelExp: integer;
  private lastLevel: integer;
  private lastLevelCapped: boolean;
  private lastBattleStats: string;

  private box: Phaser.GameObjects.Sprite;
  private nameText: Phaser.GameObjects.Text;
  private genderText: Phaser.GameObjects.Text;
  private ownedIcon: Phaser.GameObjects.Sprite;
  private championRibbon: Phaser.GameObjects.Sprite;
  private teraIcon: Phaser.GameObjects.Sprite;
  private shinyIcon: Phaser.GameObjects.Sprite;
  private fusionShinyIcon: Phaser.GameObjects.Sprite;
  private splicedIcon: Phaser.GameObjects.Sprite;
  private statusIndicator: Phaser.GameObjects.Sprite;
  private levelContainer: Phaser.GameObjects.Container;
  private hpBar: Phaser.GameObjects.Image;
  private hpBarSegmentDividers: Phaser.GameObjects.Rectangle[];
  private levelNumbersContainer: Phaser.GameObjects.Container;
  private hpNumbersContainer: Phaser.GameObjects.Container;
  private type1Icon: Phaser.GameObjects.Sprite;
  private type2Icon: Phaser.GameObjects.Sprite;
  private type3Icon: Phaser.GameObjects.Sprite;
  private expBar: Phaser.GameObjects.Image;

  // #region Type effectiveness hint objects
  private effectivenessContainer: Phaser.GameObjects.Container;
  private effectivenessWindow: Phaser.GameObjects.NineSlice;
  private effectivenessText: Phaser.GameObjects.Text;
  private currentEffectiveness?: string;
  // #endregion

  public expMaskRect: Phaser.GameObjects.Graphics;

  private statsContainer: Phaser.GameObjects.Container;
  private statsBox: Phaser.GameObjects.Sprite;
  private statValuesContainer: Phaser.GameObjects.Container;
  private statNumbers: Phaser.GameObjects.Sprite[];

  public flyoutMenu?: BattleFlyout;

  constructor(scene: Phaser.Scene, x: number, y: number, player: boolean) {
    super(scene, x, y);
    this.baseY = y;
    this.player = player;
    this.mini = !player;
    this.boss = false;
    this.offset = false;
    this.lastName = null;
    this.lastTeraType = Type.UNKNOWN;
    this.lastStatus = StatusEffect.NONE;
    this.lastHp = -1;
    this.lastMaxHp = -1;
    this.lastHpFrame = null;
    this.lastExp = -1;
    this.lastLevelExp = -1;
    this.lastLevel = -1;

    // Initially invisible and shown via Pokemon.showInfo
    this.setVisible(false);

    this.box = this.scene.add.sprite(0, 0, this.getTextureName());
    this.box.setName("box");
    this.box.setOrigin(1, 0.5);
    this.add(this.box);

    this.nameText = addTextObject(this.scene, player ? -115 : -124, player ? -15.2 : -11.2, "", TextStyle.BATTLE_INFO);
    this.nameText.setName("text_name");
    this.nameText.setOrigin(0, 0);
    this.add(this.nameText);

    this.genderText = addTextObject(this.scene, 0, 0, "", TextStyle.BATTLE_INFO);
    this.genderText.setName("text_gender");
    this.genderText.setOrigin(0, 0);
    this.genderText.setPositionRelative(this.nameText, 0, 2);
    this.add(this.genderText);

    if (!this.player) {
      this.ownedIcon = this.scene.add.sprite(0, 0, "icon_owned");
      this.ownedIcon.setName("icon_owned");
      this.ownedIcon.setVisible(false);
      this.ownedIcon.setOrigin(0, 0);
      this.ownedIcon.setPositionRelative(this.nameText, 0, 11.75);
      this.add(this.ownedIcon);

      this.championRibbon = this.scene.add.sprite(0, 0, "champion_ribbon");
      this.championRibbon.setName("icon_champion_ribbon");
      this.championRibbon.setVisible(false);
      this.championRibbon.setOrigin(0, 0);
      this.championRibbon.setPositionRelative(this.nameText, 11.75, 11.75);
      this.add(this.championRibbon);
    }

    this.teraIcon = this.scene.add.sprite(0, 0, "icon_tera");
    this.teraIcon.setName("icon_tera");
    this.teraIcon.setVisible(false);
    this.teraIcon.setOrigin(0, 0);
    this.teraIcon.setScale(0.5);
    this.teraIcon.setPositionRelative(this.nameText, 0, 2);
    this.teraIcon.setInteractive(new Phaser.Geom.Rectangle(0, 0, 12, 15), Phaser.Geom.Rectangle.Contains);
    this.add(this.teraIcon);

    this.shinyIcon = this.scene.add.sprite(0, 0, "shiny_star");
    this.shinyIcon.setName("icon_shiny");
    this.shinyIcon.setVisible(false);
    this.shinyIcon.setOrigin(0, 0);
    this.shinyIcon.setScale(0.5);
    this.shinyIcon.setPositionRelative(this.nameText, 0, 2);
    this.shinyIcon.setInteractive(new Phaser.Geom.Rectangle(0, 0, 12, 15), Phaser.Geom.Rectangle.Contains);
    this.add(this.shinyIcon);

    this.fusionShinyIcon = this.scene.add.sprite(0, 0, "shiny_star_2");
    this.fusionShinyIcon.setName("icon_fusion_shiny");
    this.fusionShinyIcon.setVisible(false);
    this.fusionShinyIcon.setOrigin(0, 0);
    this.fusionShinyIcon.setScale(0.5);
    this.fusionShinyIcon.setPosition(this.shinyIcon.x, this.shinyIcon.y);
    this.add(this.fusionShinyIcon);

    this.splicedIcon = this.scene.add.sprite(0, 0, "icon_spliced");
    this.splicedIcon.setName("icon_spliced");
    this.splicedIcon.setVisible(false);
    this.splicedIcon.setOrigin(0, 0);
    this.splicedIcon.setScale(0.5);
    this.splicedIcon.setPositionRelative(this.nameText, 0, 2);
    this.splicedIcon.setInteractive(new Phaser.Geom.Rectangle(0, 0, 12, 15), Phaser.Geom.Rectangle.Contains);
    this.add(this.splicedIcon);

    this.statusIndicator = this.scene.add.sprite(0, 0, "statuses");
    this.statusIndicator.setName("icon_status");
    this.statusIndicator.setVisible(false);
    this.statusIndicator.setOrigin(0, 0);
    this.statusIndicator.setPositionRelative(this.nameText, 0, 11.5);
    this.add(this.statusIndicator);

    this.levelContainer = this.scene.add.container(player ? -41 : -50, player ? -10 : -5);
    this.levelContainer.setName("container_level");
    this.add(this.levelContainer);

    const levelOverlay = this.scene.add.image(0, 0, "overlay_lv");
    this.levelContainer.add(levelOverlay);

    this.hpBar = this.scene.add.image(player ? -61 : -71, player ? -1 : 4.5, "overlay_hp");
    this.hpBar.setName("hp_bar");
    this.hpBar.setOrigin(0);
    this.add(this.hpBar);

    this.hpBarSegmentDividers = [];

    this.levelNumbersContainer = this.scene.add.container(9.5, (this.scene as BattleScene).uiTheme ? 0 : -0.5);
    this.levelNumbersContainer.setName("container_level");
    this.levelContainer.add(this.levelNumbersContainer);

    if (this.player) {
      this.hpNumbersContainer = this.scene.add.container(-15, 10);
      this.hpNumbersContainer.setName("container_hp");
      this.add(this.hpNumbersContainer);

      const expBar = this.scene.add.image(-98, 18, "overlay_exp");
      expBar.setName("overlay_exp");
      expBar.setOrigin(0);
      this.add(expBar);

      const expMaskRect = this.scene.make.graphics({});
      expMaskRect.setScale(6);
      expMaskRect.fillStyle(0xFFFFFF);
      expMaskRect.beginPath();
      expMaskRect.fillRect(127, 126, 85, 2);

      const expMask = expMaskRect.createGeometryMask();

      expBar.setMask(expMask);

      this.expBar = expBar;
      this.expMaskRect = expMaskRect;
    }

    this.statsContainer = this.scene.add.container(0, 0);
    this.statsContainer.setName("container_stats");
    this.statsContainer.setAlpha(0);
    this.add(this.statsContainer);

    this.statsBox = this.scene.add.sprite(0, 0, `${this.getTextureName()}_stats`);
    this.statsBox.setName("box_stats");
    this.statsBox.setOrigin(1, 0.5);
    this.statsContainer.add(this.statsBox);

    const statLabels: Phaser.GameObjects.Sprite[] = [];
    this.statNumbers = [];

    this.statValuesContainer = this.scene.add.container(0, 0);
    this.statsContainer.add(this.statValuesContainer);

    battleStatOrder.map((s, i) => {
      const statX = i > 1 ? this.statNumbers[i - 2].x + this.statNumbers[i - 2].width + 4 : -this.statsBox.width + 8;
      const statY = -this.statsBox.height / 2 + 4 + (i < battleStatOrder.length - 1 ? (i % 2 ? 10 : 0) : 5);
      const statLabel = this.scene.add.sprite(statX, statY, "pbinfo_stat", BattleStat[s]);
      statLabel.setName("icon_stat_label_" + i.toString());
      statLabel.setOrigin(0, 0);
      statLabels.push(statLabel);
      this.statValuesContainer.add(statLabel);

      const statNumber = this.scene.add.sprite(statX + statLabel.width, statY, "pbinfo_stat_numbers", "3");
      statNumber.setName("icon_stat_number_" + i.toString());
      statNumber.setOrigin(0, 0);
      this.statNumbers.push(statNumber);
      this.statValuesContainer.add(statNumber);
    });

    if (!this.player) {
      this.flyoutMenu = new BattleFlyout(this.scene, this.player);
      this.add(this.flyoutMenu);

      this.moveBelow<Phaser.GameObjects.GameObject>(this.flyoutMenu, this.box);
    }

    this.type1Icon = this.scene.add.sprite(player ? -139 : -15, player ? -17 : -15.5, `pbinfo_${player ? "player" : "enemy"}_type1`);
    this.type1Icon.setName("icon_type_1");
    this.type1Icon.setOrigin(0, 0);
    this.add(this.type1Icon);

    this.type2Icon = this.scene.add.sprite(player ? -139 : -15, player ? -1 : -2.5, `pbinfo_${player ? "player" : "enemy"}_type2`);
    this.type2Icon.setName("icon_type_2");
    this.type2Icon.setOrigin(0, 0);
    this.add(this.type2Icon);

    this.type3Icon = this.scene.add.sprite(player ? -154 : 0, player ? -17 : -15.5, `pbinfo_${player ? "player" : "enemy"}_type`);
    this.type3Icon.setName("icon_type_3");
    this.type3Icon.setOrigin(0, 0);
    this.add(this.type3Icon);

    if (!this.player) {
      this.effectivenessContainer = this.scene.add.container(0, 0);
      this.effectivenessContainer.setPositionRelative(this.type1Icon, 22, 4);
      this.effectivenessContainer.setVisible(false);
      this.add(this.effectivenessContainer);

      this.effectivenessText = addTextObject(this.scene, 5, 4.5, "", TextStyle.BATTLE_INFO);
      this.effectivenessWindow = addWindow((this.scene as BattleScene), 0, 0, 0, 20, false, false, null, null, WindowVariant.XTHIN);

      this.effectivenessContainer.add(this.effectivenessWindow);
      this.effectivenessContainer.add(this.effectivenessText);
    }
  }

  initInfo(pokemon: Pokemon) {
    this.updateNameText(pokemon);
    const nameTextWidth = this.nameText.displayWidth;

    this.name = pokemon.name;
    this.box.name = pokemon.name;

    this.flyoutMenu?.initInfo(pokemon);

    this.genderText.setText(getGenderSymbol(pokemon.gender));
    this.genderText.setColor(getGenderColor(pokemon.gender));
    this.genderText.setPositionRelative(this.nameText, nameTextWidth, 0);

    this.lastTeraType = pokemon.getTeraType();

    this.teraIcon.setPositionRelative(this.nameText, nameTextWidth + this.genderText.displayWidth + 1, 2);
    this.teraIcon.setVisible(this.lastTeraType !== Type.UNKNOWN);
    this.teraIcon.on("pointerover", () => {
      if (this.lastTeraType !== Type.UNKNOWN) {
        (this.scene as BattleScene).ui.showTooltip(null, `${Utils.toReadableString(Type[this.lastTeraType])} Terastallized`);
      }
    });
    this.teraIcon.on("pointerout", () => (this.scene as BattleScene).ui.hideTooltip());

    const isFusion = pokemon.isFusion();

    this.splicedIcon.setPositionRelative(this.nameText, nameTextWidth + this.genderText.displayWidth + 1 + (this.teraIcon.visible ? this.teraIcon.displayWidth + 1 : 0), 2.5);
    this.splicedIcon.setVisible(isFusion);
    if (this.splicedIcon.visible) {
      this.splicedIcon.on("pointerover", () => (this.scene as BattleScene).ui.showTooltip(null, `${pokemon.species.getName(pokemon.formIndex)}/${pokemon.fusionSpecies.getName(pokemon.fusionFormIndex)}`));
      this.splicedIcon.on("pointerout", () => (this.scene as BattleScene).ui.hideTooltip());
    }

    const doubleShiny = isFusion && pokemon.shiny && pokemon.fusionShiny;
    const baseVariant = !doubleShiny ? pokemon.getVariant() : pokemon.variant;

    this.shinyIcon.setPositionRelative(this.nameText, nameTextWidth + this.genderText.displayWidth + 1 + (this.teraIcon.visible ? this.teraIcon.displayWidth + 1 : 0) + (this.splicedIcon.visible ? this.splicedIcon.displayWidth + 1 : 0), 2.5);
    this.shinyIcon.setTexture(`shiny_star${doubleShiny ? "_1" : ""}`);
    this.shinyIcon.setVisible(pokemon.isShiny());
    this.shinyIcon.setTint(getVariantTint(baseVariant));
    if (this.shinyIcon.visible) {
      const shinyDescriptor = doubleShiny || baseVariant ?
        `${baseVariant === 2 ? "Epic" : baseVariant === 1 ? "Rare" : "Common"}${doubleShiny ? `/${pokemon.fusionVariant === 2 ? "Epic" : pokemon.fusionVariant === 1 ? "Rare" : "Common"}` : ""}`
        : "";
      this.shinyIcon.on("pointerover", () => (this.scene as BattleScene).ui.showTooltip(null, `Shiny${shinyDescriptor ? ` (${shinyDescriptor})` : ""}`));
      this.shinyIcon.on("pointerout", () => (this.scene as BattleScene).ui.hideTooltip());
    }

    this.fusionShinyIcon.setPosition(this.shinyIcon.x, this.shinyIcon.y);
    this.fusionShinyIcon.setVisible(doubleShiny);
    if (isFusion) {
      this.fusionShinyIcon.setTint(getVariantTint(pokemon.fusionVariant));
    }

    if (!this.player) {
      const dexEntry = pokemon.scene.gameData.dexData[pokemon.species.speciesId];
      this.ownedIcon.setVisible(!!dexEntry.caughtAttr);
      const opponentPokemonDexAttr = pokemon.getDexAttr();
      if (pokemon.scene.gameMode.isClassic) {
        if (pokemon.scene.gameData.starterData[pokemon.species.getRootSpeciesId()].classicWinCount > 0 && pokemon.scene.gameData.starterData[pokemon.species.getRootSpeciesId(true)].classicWinCount > 0) {
          this.championRibbon.setVisible(true);
        }
      }

      // Check if Player owns all genders and forms of the Pokemon
      const missingDexAttrs = ((dexEntry.caughtAttr & opponentPokemonDexAttr) < opponentPokemonDexAttr);

      /**
       * If the opposing Pokemon only has 1 normal ability and is using the hidden ability it should have the same behavior
       * if it had 2 normal abilities. This code checks if that is the case and uses the correct opponent Pokemon abilityIndex (2)
       * for calculations so it aligns with where the hidden ability is stored in the starter data's abilityAttr (4)
       */
      const opponentPokemonOneNormalAbility = (pokemon.species.getAbilityCount() === 2);
      const opponentPokemonAbilityIndex = (opponentPokemonOneNormalAbility && pokemon.abilityIndex === 1) ? 2 : pokemon.abilityIndex;
      const opponentPokemonAbilityAttr = Math.pow(2, opponentPokemonAbilityIndex);

      const rootFormHasHiddenAbility = pokemon.scene.gameData.starterData[pokemon.species.getRootSpeciesId()].abilityAttr & opponentPokemonAbilityAttr;

      if (missingDexAttrs || !rootFormHasHiddenAbility) {
        this.ownedIcon.setTint(0x808080);
      }

      if (this.boss) {
        this.updateBossSegmentDividers(pokemon as EnemyPokemon);
      }
    }

    this.hpBar.setScale(pokemon.getHpRatio(true), 1);
    this.lastHpFrame = this.hpBar.scaleX > 0.5 ? "high" : this.hpBar.scaleX > 0.25 ? "medium" : "low";
    this.hpBar.setFrame(this.lastHpFrame);
    if (this.player) {
      this.setHpNumbers(pokemon.hp, pokemon.getMaxHp());
    }
    this.lastHp = pokemon.hp;
    this.lastMaxHp = pokemon.getMaxHp();

    this.setLevel(pokemon.level);
    this.lastLevel = pokemon.level;

    this.shinyIcon.setVisible(pokemon.isShiny());

    const types = pokemon.getTypes(true);
    this.type1Icon.setTexture(`pbinfo_${this.player ? "player" : "enemy"}_type${types.length > 1 ? "1" : ""}`);
    this.type1Icon.setFrame(Type[types[0]].toLowerCase());
    this.type2Icon.setVisible(types.length > 1);
    this.type3Icon.setVisible(types.length > 2);
    if (types.length > 1) {
      this.type2Icon.setFrame(Type[types[1]].toLowerCase());
    }
    if (types.length > 2) {
      this.type3Icon.setFrame(Type[types[2]].toLowerCase());
    }

    if (this.player) {
      this.expMaskRect.x = (pokemon.levelExp / getLevelTotalExp(pokemon.level, pokemon.species.growthRate)) * 510;
      this.lastExp = pokemon.exp;
      this.lastLevelExp = pokemon.levelExp;

      this.statValuesContainer.setPosition(8, 7);
    }

    const battleStats = battleStatOrder.map(() => 0);

    this.lastBattleStats = battleStats.join("");
    this.updateBattleStats(battleStats);
  }

  getTextureName(): string {
    return `pbinfo_${this.player ? "player" : "enemy"}${!this.player && this.boss ? "_boss" : this.mini ? "_mini" : ""}`;
  }

  setMini(mini: boolean): void {
    if (this.mini === mini) {
      return;
    }

    this.mini = mini;

    this.box.setTexture(this.getTextureName());
    this.statsBox.setTexture(`${this.getTextureName()}_stats`);

    if (this.player) {
      this.y -= 12 * (mini ? 1 : -1);
      this.baseY = this.y;
    }

    const offsetElements = [ this.nameText, this.genderText, this.teraIcon, this.splicedIcon, this.shinyIcon, this.statusIndicator, this.levelContainer ];
    offsetElements.forEach(el => el.y += 1.5 * (mini ? -1 : 1));

    [ this.type1Icon, this.type2Icon, this.type3Icon ].forEach(el => {
      el.x += 4 * (mini ? 1 : -1);
      el.y += -8 * (mini ? 1 : -1);
    });

    this.statValuesContainer.x += 2 * (mini ? 1 : -1);
    this.statValuesContainer.y += -7 * (mini ? 1 : -1);

    const toggledElements = [ this.hpNumbersContainer, this.expBar ];
    toggledElements.forEach(el => el.setVisible(!mini));
  }

  toggleStats(visible: boolean): void {
    this.scene.tweens.add({
      targets: this.statsContainer,
      duration: Utils.fixedInt(125),
      ease: "Sine.easeInOut",
      alpha: visible ? 1 : 0
    });
  }

  updateBossSegments(pokemon: EnemyPokemon): void {
    const boss = !!pokemon.bossSegments;

    if (boss !== this.boss) {
      this.boss = boss;

      [ this.nameText, this.genderText, this.teraIcon, this.splicedIcon, this.shinyIcon, this.ownedIcon, this.championRibbon, this.statusIndicator, this.levelContainer, this.statValuesContainer ].map(e => e.x += 48 * (boss ? -1 : 1));
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
      this.hpBarSegmentDividers.pop().destroy();
    }

    if (this.boss && this.bossSegments > 1) {
      const uiTheme = (this.scene as BattleScene).uiTheme;
      const maxHp = pokemon.getMaxHp();
      for (let s = 1; s < this.bossSegments; s++) {
        const dividerX = (Math.round((maxHp / this.bossSegments) * s) /  maxHp) * this.hpBar.width;
        const divider = this.scene.add.rectangle(0, 0, 1, this.hpBar.height - (uiTheme ? 0 : 1), pokemon.bossSegmentIndex >= s ? 0xFFFFFF : 0x404040);
        divider.setOrigin(0.5, 0);
        divider.setName("hpBar_divider_" + s.toString());
        this.add(divider);
        this.moveBelow(divider as Phaser.GameObjects.GameObject, this.statsContainer);

        divider.setPositionRelative(this.hpBar, dividerX, uiTheme ? 0 : 1);
        this.hpBarSegmentDividers.push(divider);
      }
    }
  }

  setOffset(offset: boolean): void {
    if (this.offset === offset) {
      return;
    }

    this.offset = offset;

    this.x += 10 * (this.offset === this.player ? 1 : -1);
    this.y += 27 * (this.offset ? 1 : -1);
    this.baseY = this.y;
  }

  updateInfo(pokemon: Pokemon, instant?: boolean): Promise<void> {
    return new Promise(resolve => {
      if (!this.scene) {
        return resolve();
      }

      const nameUpdated = this.lastName !== pokemon.name;

      if (nameUpdated) {
        this.updateNameText(pokemon);
        this.genderText.setPositionRelative(this.nameText, this.nameText.displayWidth, 0);
      }

      const teraType = pokemon.getTeraType();
      const teraTypeUpdated = this.lastTeraType !== teraType;

      if (teraTypeUpdated) {
        this.teraIcon.setVisible(teraType !== Type.UNKNOWN);
        this.teraIcon.setPositionRelative(this.nameText, this.nameText.displayWidth + this.genderText.displayWidth + 1, 2);
        this.teraIcon.setTintFill(Phaser.Display.Color.GetColor(...getTypeRgb(teraType)));
        this.lastTeraType = teraType;
      }

      if (nameUpdated || teraTypeUpdated) {
        this.splicedIcon.setVisible(!!pokemon.fusionSpecies);

        this.teraIcon.setPositionRelative(this.nameText, this.nameText.displayWidth + this.genderText.displayWidth + 1, 2);
        this.splicedIcon.setPositionRelative(this.nameText, this.nameText.displayWidth + this.genderText.displayWidth + 1 + (this.teraIcon.visible ? this.teraIcon.displayWidth + 1 : 0), 1.5);
        this.shinyIcon.setPositionRelative(this.nameText, this.nameText.displayWidth + this.genderText.displayWidth + 1 + (this.teraIcon.visible ? this.teraIcon.displayWidth + 1 : 0) + (this.splicedIcon.visible ? this.splicedIcon.displayWidth + 1 : 0), 2.5);
      }

      if (this.lastStatus !== (pokemon.status?.effect || StatusEffect.NONE)) {
        this.lastStatus = pokemon.status?.effect || StatusEffect.NONE;

        if (this.lastStatus !== StatusEffect.NONE) {
          this.statusIndicator.setFrame(StatusEffect[this.lastStatus].toLowerCase());
        }
        this.statusIndicator.setVisible(!!this.lastStatus);

        if (!this.player && this.ownedIcon.visible) {
          this.ownedIcon.setAlpha(this.statusIndicator.visible ? 0 : 1);
        }
      }

      const types = pokemon.getTypes(true);
      this.type1Icon.setTexture(`pbinfo_${this.player ? "player" : "enemy"}_type${types.length > 1 ? "1" : ""}`);
      this.type1Icon.setFrame(Type[types[0]].toLowerCase());
      this.type2Icon.setVisible(types.length > 1);
      this.type3Icon.setVisible(types.length > 2);
      if (types.length > 1) {
        this.type2Icon.setFrame(Type[types[1]].toLowerCase());
      }
      if (types.length > 2) {
        this.type3Icon.setFrame(Type[types[2]].toLowerCase());
      }

      const updateHpFrame = () => {
        const hpFrame = this.hpBar.scaleX > 0.5 ? "high" : this.hpBar.scaleX > 0.25 ? "medium" : "low";
        if (hpFrame !== this.lastHpFrame) {
          this.hpBar.setFrame(hpFrame);
          this.lastHpFrame = hpFrame;
        }
      };

      const updatePokemonHp = () => {
        let duration = !instant ? Utils.clampInt(Math.abs((this.lastHp) - pokemon.hp) * 5, 250, 5000) : 0;
        const speed = (this.scene as BattleScene).hpBarSpeed;
        if (speed) {
          duration = speed >= 3 ? 0 : duration / Math.pow(2, speed);
        }
        this.scene.tweens.add({
          targets: this.hpBar,
          ease: "Sine.easeOut",
          scaleX: pokemon.getHpRatio(true),
          duration: duration,
          onUpdate: () => {
            if (this.player && this.lastHp !== pokemon.hp) {
              const tweenHp = Math.ceil(this.hpBar.scaleX * pokemon.getMaxHp());
              this.setHpNumbers(tweenHp, pokemon.getMaxHp());
              this.lastHp = tweenHp;
            }

            updateHpFrame();
          },
          onComplete: () => {
            updateHpFrame();
            resolve();
          }
        });
        if (!this.player) {
          this.lastHp = pokemon.hp;
        }
        this.lastMaxHp = pokemon.getMaxHp();
      };

      if (this.player) {
        const isLevelCapped = pokemon.level >= (this.scene as BattleScene).getMaxExpLevel();

        if ((this.lastExp !== pokemon.exp || this.lastLevel !== pokemon.level)) {
          const originalResolve = resolve;
          const durationMultipler = Math.max(Phaser.Tweens.Builders.GetEaseFunction("Cubic.easeIn")(1 - (Math.min(pokemon.level - this.lastLevel, 10) / 10)), 0.1);
          resolve = () => this.updatePokemonExp(pokemon, false, durationMultipler).then(() => originalResolve());
        } else if (isLevelCapped !== this.lastLevelCapped) {
          this.setLevel(pokemon.level);
        }

        this.lastLevelCapped = isLevelCapped;
      }

      if (this.lastHp !== pokemon.hp || this.lastMaxHp !== pokemon.getMaxHp()) {
        return updatePokemonHp();
      } else if (!this.player && this.lastLevel !== pokemon.level) {
        this.setLevel(pokemon.level);
        this.lastLevel = pokemon.level;
      }

      const battleStats = pokemon.summonData
        ? pokemon.summonData.battleStats
        : battleStatOrder.map(() => 0);
      const battleStatsStr = battleStats.join("");

      if (this.lastBattleStats !== battleStatsStr) {
        this.updateBattleStats(battleStats);
        this.lastBattleStats = battleStatsStr;
      }

      this.shinyIcon.setVisible(pokemon.isShiny());

      resolve();
    });
  }

  updateNameText(pokemon: Pokemon): void {
    let displayName = pokemon.name.replace(/[♂♀]/g, "");
    let nameTextWidth: number;

    const nameSizeTest = addTextObject(this.scene, 0, 0, displayName, TextStyle.BATTLE_INFO);
    nameTextWidth = nameSizeTest.displayWidth;

    while (nameTextWidth > (this.player || !this.boss ? 60 : 98) - ((pokemon.gender !== Gender.GENDERLESS ? 6 : 0) + (pokemon.fusionSpecies ? 8 : 0) + (pokemon.isShiny() ? 8 : 0) + (Math.min(pokemon.level.toString().length, 3) - 3) * 8)) {
      displayName = `${displayName.slice(0, displayName.endsWith(".") ? -2 : -1).trimEnd()}.`;
      nameSizeTest.setText(displayName);
      nameTextWidth = nameSizeTest.displayWidth;
    }

    nameSizeTest.destroy();

    this.nameText.setText(displayName);
    this.lastName = pokemon.name;
  }

  updatePokemonExp(pokemon: Pokemon, instant?: boolean, levelDurationMultiplier: number = 1): Promise<void> {
    return new Promise(resolve => {
      const levelUp = this.lastLevel < pokemon.level;
      const relLevelExp = getLevelRelExp(this.lastLevel + 1, pokemon.species.growthRate);
      const levelExp = levelUp ? relLevelExp : pokemon.levelExp;
      let ratio = relLevelExp ? levelExp / relLevelExp : 0;
      if (this.lastLevel >= (this.scene as BattleScene).getMaxExpLevel(true)) {
        if (levelUp) {
          ratio = 1;
        } else {
          ratio = 0;
        }
        instant = true;
      }
      const durationMultiplier = Phaser.Tweens.Builders.GetEaseFunction("Sine.easeIn")(1 - (Math.max(this.lastLevel - 100, 0) / 150));
      const duration = this.visible && !instant ? (((levelExp - this.lastLevelExp) / relLevelExp) * 1650) * durationMultiplier * levelDurationMultiplier : 0;
      if (ratio === 1) {
        this.lastLevelExp = 0;
        this.lastLevel++;
      } else {
        this.lastExp = pokemon.exp;
        this.lastLevelExp = pokemon.levelExp;
      }
      if (duration) {
        (this.scene as BattleScene).playSound("exp");
      }
      this.scene.tweens.add({
        targets: this.expMaskRect,
        ease: "Sine.easeIn",
        x: ratio * 510,
        duration: duration,
        onComplete: () => {
          if (!this.scene) {
            return resolve();
          }
          if (duration) {
            this.scene.sound.stopByKey("exp");
          }
          if (ratio === 1) {
            (this.scene as BattleScene).playSound("level_up");
            this.setLevel(this.lastLevel);
            this.scene.time.delayedCall(500 * levelDurationMultiplier, () => {
              this.expMaskRect.x = 0;
              this.updateInfo(pokemon, instant).then(() => resolve());
            });
            return;
          }
          resolve();
        }
      });
    });
  }

  setLevel(level: integer): void {
    const isCapped = level >= (this.scene as BattleScene).getMaxExpLevel();
    this.levelNumbersContainer.removeAll(true);
    const levelStr = level.toString();
    for (let i = 0; i < levelStr.length; i++) {
      this.levelNumbersContainer.add(this.scene.add.image(i * 8, 0, `numbers${isCapped && this.player ? "_red" : ""}`, levelStr[i]));
    }
    this.levelContainer.setX((this.player ? -41 : -50) - 8 * Math.max(levelStr.length - 3, 0));
  }

  setHpNumbers(hp: integer, maxHp: integer): void {
    if (!this.player || !this.scene) {
      return;
    }
    this.hpNumbersContainer.removeAll(true);
    const hpStr = hp.toString();
    const maxHpStr = maxHp.toString();
    let offset = 0;
    for (let i = maxHpStr.length - 1; i >= 0; i--) {
      this.hpNumbersContainer.add(this.scene.add.image(offset++ * -8, 0, "numbers", maxHpStr[i]));
    }
    this.hpNumbersContainer.add(this.scene.add.image(offset++ * -8, 0, "numbers", "/"));
    for (let i = hpStr.length - 1; i >= 0; i--) {
      this.hpNumbersContainer.add(this.scene.add.image(offset++ * -8, 0, "numbers", hpStr[i]));
    }
  }

  updateBattleStats(battleStats: integer[]): void {
    battleStatOrder.map((s, i) => {
      this.statNumbers[i].setFrame(battleStats[s].toString());
    });
  }

  /**
   * Request the flyoutMenu to toggle if available and hides or shows the effectiveness window where necessary
   */
  toggleFlyout(visible: boolean): void {
    this.flyoutMenu?.toggleFlyout(visible);

    if (visible) {
      this.effectivenessContainer?.setVisible(false);
    } else {
      this.updateEffectiveness(this.currentEffectiveness);
    }
  }

  /**
   * Show or hide the type effectiveness multiplier window
   * Passing undefined will hide the window
   */
  updateEffectiveness(effectiveness?: string) {
    if (this.player) {
      return;
    }
    this.currentEffectiveness = effectiveness;

    if (!(this.scene as BattleScene).typeHints || effectiveness === undefined || this.flyoutMenu.flyoutVisible) {
      this.effectivenessContainer.setVisible(false);
      return;
    }

    this.effectivenessText.setText(effectiveness);
    this.effectivenessWindow.width = 10 + this.effectivenessText.displayWidth;
    this.effectivenessContainer.setVisible(true);
  }

  getBaseY(): number {
    return this.baseY;
  }

  resetY(): void {
    this.y = this.baseY;
  }
}

export class PlayerBattleInfo extends BattleInfo {
  constructor(scene: Phaser.Scene) {
    super(scene, Math.floor(scene.game.canvas.width / 6) - 10, -72, true);
  }
}

export class EnemyBattleInfo extends BattleInfo {
  constructor(scene: Phaser.Scene) {
    super(scene, 140, -141, false);
  }

  setMini(mini: boolean): void { } // Always mini
}
