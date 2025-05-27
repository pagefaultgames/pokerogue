import type { default as Pokemon } from "../../field/pokemon";
import { getLocalizedSpriteKey, fixedInt, getShinyDescriptor } from "#app/utils/common";
import { addTextObject, TextStyle } from "../text";
import { getGenderSymbol, getGenderColor, Gender } from "../../data/gender";
import { StatusEffect } from "#enums/status-effect";
import { globalScene } from "#app/global-scene";
import { getTypeRgb } from "#app/data/type";
import { PokemonType } from "#enums/pokemon-type";
import { getVariantTint } from "#app/sprites/variant";
import { Stat } from "#enums/stat";
import i18next from "i18next";

export default abstract class BattleInfo extends Phaser.GameObjects.Container {
  public static readonly EXP_GAINS_DURATION_BASE = 1650;

  protected baseY: number;

  protected player: boolean;
  protected mini: boolean;
  protected boss: boolean;
  protected bossSegments: number;
  protected offset: boolean;
  protected lastName: string | null;
  protected lastTeraType: PokemonType;
  protected lastStatus: StatusEffect;
  protected lastHp: number;
  protected lastMaxHp: number;
  protected lastHpFrame: string | null;
  protected lastExp: number;
  protected lastLevelExp: number;
  protected lastLevel: number;
  protected lastLevelCapped: boolean;
  protected lastStats: string;

  protected box: Phaser.GameObjects.Sprite;
  protected nameText: Phaser.GameObjects.Text;
  protected genderText: Phaser.GameObjects.Text;
  protected teraIcon: Phaser.GameObjects.Sprite;
  protected shinyIcon: Phaser.GameObjects.Sprite;
  protected fusionShinyIcon: Phaser.GameObjects.Sprite;
  protected splicedIcon: Phaser.GameObjects.Sprite;
  protected statusIndicator: Phaser.GameObjects.Sprite;
  protected levelContainer: Phaser.GameObjects.Container;
  protected hpBar: Phaser.GameObjects.Image;
  protected levelNumbersContainer: Phaser.GameObjects.Container;
  protected type1Icon: Phaser.GameObjects.Sprite;
  protected type2Icon: Phaser.GameObjects.Sprite;
  protected type3Icon: Phaser.GameObjects.Sprite;
  protected expBar: Phaser.GameObjects.Image;

  public expMaskRect: Phaser.GameObjects.Graphics;

  protected statsContainer: Phaser.GameObjects.Container;
  protected statsBox: Phaser.GameObjects.Sprite;
  protected statValuesContainer: Phaser.GameObjects.Container;
  protected statNumbers: Phaser.GameObjects.Sprite[];

  get statOrder(): Stat[] {
    return [];
  }

  /** Helper method used by the constructor to create the tera and shiny icons next to the name */
  private constructIcons() {
    const hitArea = new Phaser.Geom.Rectangle(0, 0, 12, 15);
    const hitCallback = Phaser.Geom.Rectangle.Contains;

    this.teraIcon = globalScene.add
      .sprite(0, 0, "icon_tera")
      .setName("icon_tera")
      .setVisible(false)
      .setOrigin(0)
      .setScale(0.5)
      .setInteractive(hitArea, hitCallback);
    this.teraIcon.setPositionRelative(this.nameText, 0, 2);

    this.shinyIcon = globalScene.add
      .sprite(0, 0, "shiny_star")
      .setName("icon_shiny")
      .setVisible(false)
      .setOrigin(0)
      .setScale(0.5)
      .setInteractive(hitArea, hitCallback);
    this.shinyIcon.setPositionRelative(this.nameText, 0, 2);

    this.fusionShinyIcon = globalScene.add
      .sprite(0, 0, "shiny_star_2")
      .setName("icon_fusion_shiny")
      .setVisible(false)
      .setOrigin(0)
      .setScale(0.5)
      .copyPosition(this.shinyIcon);

    this.splicedIcon = globalScene.add
      .sprite(0, 0, "icon_spliced")
      .setName("icon_spliced")
      .setVisible(false)
      .setOrigin(0)
      .setScale(0.5)
      .setInteractive(hitArea, hitCallback);
    this.splicedIcon.setPositionRelative(this.nameText, 0, 2);

    this.add([this.teraIcon, this.shinyIcon, this.fusionShinyIcon, this.splicedIcon]);
  }

  constructor(x: number, y: number, player: boolean) {
    super(globalScene, x, y);
    this.baseY = y;
    this.player = player;
    this.mini = !player;
    this.boss = false;
    this.offset = false;
    this.lastName = null;
    this.lastTeraType = PokemonType.UNKNOWN;
    this.lastStatus = StatusEffect.NONE;
    this.lastHp = -1;
    this.lastMaxHp = -1;
    this.lastHpFrame = null;
    this.lastExp = -1;
    this.lastLevelExp = -1;
    this.lastLevel = -1;

    // Initially invisible and shown via Pokemon.showInfo
    this.setVisible(false);

    this.box = globalScene.add.sprite(0, 0, this.getTextureName()).setName("box").setOrigin(1, 0.5);
    this.add(this.box);

    this.nameText = addTextObject(player ? -115 : -124, player ? -15.2 : -11.2, "", TextStyle.BATTLE_INFO)
      .setName("text_name")
      .setOrigin(0);
    this.add(this.nameText);

    this.genderText = addTextObject(0, 0, "", TextStyle.BATTLE_INFO).setName("text_gender").setOrigin(0);
    this.genderText.setPositionRelative(this.nameText, 0, 2);
    this.add(this.genderText);

    this.constructIcons();

    this.statusIndicator = globalScene.add
      .sprite(0, 0, getLocalizedSpriteKey("statuses"))
      .setName("icon_status")
      .setVisible(false)
      .setOrigin(0);
    this.statusIndicator.setPositionRelative(this.nameText, 0, 11.5);
    this.add(this.statusIndicator);

    this.levelContainer = globalScene.add.container(player ? -41 : -50, player ? -10 : -5).setName("container_level");
    this.add(this.levelContainer);

    const levelOverlay = globalScene.add.image(0, 0, "overlay_lv");
    this.levelContainer.add(levelOverlay);

    this.hpBar = globalScene.add
      .image(player ? -61 : -71, player ? -1 : 4.5, "overlay_hp")
      .setName("hp_bar")
      .setOrigin(0);
    this.add(this.hpBar);

    this.levelNumbersContainer = globalScene.add
      .container(9.5, globalScene.uiTheme ? 0 : -0.5)
      .setName("container_level");
    this.levelContainer.add(this.levelNumbersContainer);

    this.statsContainer = globalScene.add.container(0, 0).setName("container_stats").setAlpha(0);
    this.add(this.statsContainer);

    this.statsBox = globalScene.add
      .sprite(0, 0, `${this.getTextureName()}_stats`)
      .setName("box_stats")
      .setOrigin(1, 0.5);
    this.statsContainer.add(this.statsBox);

    const statLabels: Phaser.GameObjects.Sprite[] = [];
    this.statNumbers = [];

    this.statValuesContainer = globalScene.add.container(0, 0);
    this.statsContainer.add(this.statValuesContainer);

    // this gives us a different starting location from the left of the label and padding between stats for a player vs enemy
    // since the player won't have HP to show, it doesn't need to change from the current version
    const startingX = this.player ? -this.statsBox.width + 8 : -this.statsBox.width + 5;
    const paddingX = this.player ? 4 : 2;
    const statOverflow = this.player ? 1 : 0;

    for (const [i, s] of this.statOrder.entries()) {
      // we do a check for i > statOverflow to see when the stat labels go onto the next column
      // For enemies, we have HP (i=0) by itself then a new column, so we check for i > 0
      // For players, we don't have HP, so we start with i = 0 and i = 1 for our first column, and so need to check for i > 1
      const statX =
        i > statOverflow
          ? this.statNumbers[Math.max(i - 2, 0)].x + this.statNumbers[Math.max(i - 2, 0)].width + paddingX
          : startingX; // we have the Math.max(i - 2, 0) in there so for i===1 to not return a negative number; since this is now based on anything >0 instead of >1, we need to allow for i-2 < 0

      const baseY = -this.statsBox.height / 2 + 4; // this is the baseline for the y-axis
      let statY: number; // this will be the y-axis placement for the labels
      if (this.statOrder[i] === Stat.SPD || this.statOrder[i] === Stat.HP) {
        statY = baseY + 5;
      } else {
        statY = baseY + (!!(i % 2) === this.player ? 10 : 0); // we compare i % 2 against this.player to tell us where to place the label; because this.battleStatOrder for enemies has HP, this.battleStatOrder[1]=ATK, but for players this.battleStatOrder[0]=ATK, so this comparing i % 2 to this.player fixes this issue for us
      }

      const statLabel = globalScene.add
        .sprite(statX, statY, "pbinfo_stat", Stat[s])
        .setName("icon_stat_label_" + i.toString())
        .setOrigin(0);
      statLabels.push(statLabel);
      this.statValuesContainer.add(statLabel);

      const statNumber = globalScene.add
        .sprite(statX + statLabel.width, statY, "pbinfo_stat_numbers", this.statOrder[i] !== Stat.HP ? "3" : "empty")
        .setName("icon_stat_number_" + i.toString())
        .setOrigin(0);
      this.statNumbers.push(statNumber);
      this.statValuesContainer.add(statNumber);

      if (this.statOrder[i] === Stat.HP) {
        statLabel.setVisible(false);
        statNumber.setVisible(false);
      }
    }

    this.type1Icon = globalScene.add
      .sprite(player ? -139 : -15, player ? -17 : -15.5, `pbinfo_${player ? "player" : "enemy"}_type1`)
      .setName("icon_type_1")
      .setOrigin(0);
    this.add(this.type1Icon);

    this.type2Icon = globalScene.add
      .sprite(player ? -139 : -15, player ? -1 : -2.5, `pbinfo_${player ? "player" : "enemy"}_type2`)
      .setName("icon_type_2")
      .setOrigin(0);
    this.add(this.type2Icon);

    this.type3Icon = globalScene.add
      .sprite(player ? -154 : 0, player ? -17 : -15.5, `pbinfo_${player ? "player" : "enemy"}_type`)
      .setName("icon_type_3")
      .setOrigin(0);
    this.add(this.type3Icon);
  }

  getStatsValueContainer(): Phaser.GameObjects.Container {
    return this.statValuesContainer;
  }

  //#region Initialization methods

  initSplicedIcon(pokemon: Pokemon, baseWidth: number) {
    this.splicedIcon.setPositionRelative(
      this.nameText,
      baseWidth + this.genderText.displayWidth + 1 + (this.teraIcon.visible ? this.teraIcon.displayWidth + 1 : 0),
      2.5,
    );
    this.splicedIcon.setVisible(pokemon.isFusion(true));
    if (!this.splicedIcon.visible) {
      return;
    }
    this.splicedIcon
      .on("pointerover", () =>
        globalScene.ui.showTooltip(
          "",
          `${pokemon.species.getName(pokemon.formIndex)}/${pokemon.fusionSpecies?.getName(pokemon.fusionFormIndex)}`,
        ),
      )
      .on("pointerout", () => globalScene.ui.hideTooltip());
  }

  /**
   * Called by {@linkcode initInfo} to initialize the shiny icon
   * @param pokemon - The pokemon object attached to this battle info
   * @param baseXOffset - The x offset to use for the shiny icon
   * @param doubleShiny - Whether the pokemon is shiny and its fusion species is also shiny
   */
  protected initShinyIcon(pokemon: Pokemon, xOffset: number, doubleShiny: boolean) {
    const baseVariant = !doubleShiny ? pokemon.getVariant(true) : pokemon.variant;

    this.shinyIcon.setPositionRelative(
      this.nameText,
      xOffset +
        this.genderText.displayWidth +
        1 +
        (this.teraIcon.visible ? this.teraIcon.displayWidth + 1 : 0) +
        (this.splicedIcon.visible ? this.splicedIcon.displayWidth + 1 : 0),
      2.5,
    );
    this.shinyIcon
      .setTexture(`shiny_star${doubleShiny ? "_1" : ""}`)
      .setVisible(pokemon.isShiny())
      .setTint(getVariantTint(baseVariant));

    if (!this.shinyIcon.visible) {
      return;
    }

    let shinyDescriptor = "";
    if (doubleShiny || baseVariant) {
      shinyDescriptor = " (" + getShinyDescriptor(baseVariant);
      if (doubleShiny) {
        shinyDescriptor += "/" + getShinyDescriptor(pokemon.fusionVariant);
      }
      shinyDescriptor += ")";
    }

    this.shinyIcon
      .on("pointerover", () => globalScene.ui.showTooltip("", i18next.t("common:shinyOnHover") + shinyDescriptor))
      .on("pointerout", () => globalScene.ui.hideTooltip());
  }

  /** Called by {@linkcode initInfo} to initialize the type icons beside the battle info */
  initTypes(types: PokemonType[]) {
    this.type1Icon
      .setTexture(`pbinfo_${this.player ? "player" : "enemy"}_type${types.length > 1 ? "1" : ""}`)
      .setFrame(PokemonType[types[0]].toLowerCase());
    this.type2Icon.setVisible(types.length > 1);
    this.type3Icon.setVisible(types.length > 2);
    if (types.length > 1) {
      this.type2Icon.setFrame(PokemonType[types[1]].toLowerCase());
    }
    if (types.length > 2) {
      this.type3Icon.setFrame(PokemonType[types[2]].toLowerCase());
    }
  }

  initInfo(pokemon: Pokemon) {
    this.updateNameText(pokemon);
    const nameTextWidth = this.nameText.displayWidth;

    this.name = pokemon.getNameToRender();
    this.box.name = pokemon.getNameToRender();

    this.genderText
      .setText(getGenderSymbol(pokemon.gender))
      .setColor(getGenderColor(pokemon.gender))
      .setPositionRelative(this.nameText, nameTextWidth, 0);

    this.lastTeraType = pokemon.getTeraType();

    this.teraIcon
      .setVisible(pokemon.isTerastallized)
      .on("pointerover", () => {
        if (pokemon.isTerastallized) {
          globalScene.ui.showTooltip(
            "",
            i18next.t("fightUiHandler:teraHover", {
              type: i18next.t(`pokemonInfo:Type.${PokemonType[this.lastTeraType]}`),
            }),
          );
        }
      })
      .on("pointerout", () => globalScene.ui.hideTooltip())
      .setPositionRelative(this.nameText, nameTextWidth + this.genderText.displayWidth + 1, 2);

    const isFusion = pokemon.isFusion(true);
    this.initSplicedIcon(pokemon, nameTextWidth);

    const doubleShiny = isFusion && pokemon.shiny && pokemon.fusionShiny;
    this.initShinyIcon(pokemon, nameTextWidth, doubleShiny);

    this.fusionShinyIcon.setVisible(doubleShiny).copyPosition(this.shinyIcon);
    if (isFusion) {
      this.fusionShinyIcon.setTint(getVariantTint(pokemon.fusionVariant));
    }

    this.hpBar.setScale(pokemon.getHpRatio(true), 1);
    this.lastHpFrame = this.hpBar.scaleX > 0.5 ? "high" : this.hpBar.scaleX > 0.25 ? "medium" : "low";
    this.hpBar.setFrame(this.lastHpFrame);
    this.lastHp = pokemon.hp;
    this.lastMaxHp = pokemon.getMaxHp();

    this.setLevel(pokemon.level);
    this.lastLevel = pokemon.level;

    this.shinyIcon.setVisible(pokemon.isShiny());

    this.initTypes(pokemon.getTypes(true, false, undefined, true));

    const stats = this.statOrder.map(() => 0);

    this.lastStats = stats.join("");
    this.updateStats(stats);
  }
  //#endregion

  /**
   * Return the texture name of the battle info box
   */
  abstract getTextureName(): string;

  setMini(_mini: boolean): void {}

  toggleStats(visible: boolean): void {
    globalScene.tweens.add({
      targets: this.statsContainer,
      duration: fixedInt(125),
      ease: "Sine.easeInOut",
      alpha: visible ? 1 : 0,
    });
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

  //#region Update methods and helpers

  /** Update the status icon to match the pokemon's current status
   * @param pokemon - The pokemon object attached to this battle info
   * @param xOffset - The offset from the name text
   */
  updateStatusIcon(pokemon: Pokemon, xOffset = 0) {
    if (this.lastStatus !== (pokemon.status?.effect || StatusEffect.NONE)) {
      this.lastStatus = pokemon.status?.effect || StatusEffect.NONE;

      if (this.lastStatus !== StatusEffect.NONE) {
        this.statusIndicator.setFrame(StatusEffect[this.lastStatus].toLowerCase());
      }

      this.statusIndicator.setVisible(!!this.lastStatus).setPositionRelative(this.nameText, xOffset, 11.5);
    }
  }

  /** Update the pokemon name inside the container */
  protected updateName(name: string): boolean {
    if (this.lastName === name) {
      return false;
    }
    this.nameText.setText(name).setPositionRelative(this.box, -this.nameText.displayWidth, 0);
    this.lastName = name;

    return true;
  }

  protected updateTeraType(ty: PokemonType): boolean {
    if (this.lastTeraType === ty) {
      return false;
    }

    this.teraIcon
      .setVisible(ty !== PokemonType.UNKNOWN)
      .setTintFill(Phaser.Display.Color.GetColor(...getTypeRgb(ty)))
      .setPositionRelative(this.nameText, this.nameText.displayWidth + this.genderText.displayWidth + 1, 2);
    this.lastTeraType = ty;

    return true;
  }

  updateTypes(types: PokemonType[]): void {
    this.type1Icon
      .setTexture(`pbinfo_${this.player ? "player" : "enemy"}_type${types.length > 1 ? "1" : ""}`)
      .setFrame(PokemonType[types[0]].toLowerCase());
    this.type2Icon.setVisible(types.length > 1);
    this.type3Icon.setVisible(types.length > 2);
    if (types.length > 1) {
      this.type2Icon.setFrame(PokemonType[types[1]].toLowerCase());
    }
    if (types.length > 2) {
      this.type3Icon.setFrame(PokemonType[types[2]].toLowerCase());
    }
  }

  /**
   * Called by {@linkcode updateInfo} to update the position of the tera, spliced, and shiny icons
   * @param isFusion - Whether the pokemon is a fusion or not
   */
  protected updateIconDisplay(isFusion: boolean): void {
    this.teraIcon.setPositionRelative(this.nameText, this.nameText.displayWidth + this.genderText.displayWidth + 1, 2);
    this.splicedIcon
      .setVisible(isFusion)
      .setPositionRelative(
        this.nameText,
        this.nameText.displayWidth +
          this.genderText.displayWidth +
          1 +
          (this.teraIcon.visible ? this.teraIcon.displayWidth + 1 : 0),
        1.5,
      );
    this.shinyIcon.setPositionRelative(
      this.nameText,
      this.nameText.displayWidth +
        this.genderText.displayWidth +
        1 +
        (this.teraIcon.visible ? this.teraIcon.displayWidth + 1 : 0) +
        (this.splicedIcon.visible ? this.splicedIcon.displayWidth + 1 : 0),
      2.5,
    );
  }

  //#region Hp Bar Display handling
  /**
   * Called every time the hp frame is updated by the tween
   * @param pokemon - The pokemon object attached to this battle info
   */
  protected updateHpFrame(): void {
    const hpFrame = this.hpBar.scaleX > 0.5 ? "high" : this.hpBar.scaleX > 0.25 ? "medium" : "low";
    if (hpFrame !== this.lastHpFrame) {
      this.hpBar.setFrame(hpFrame);
      this.lastHpFrame = hpFrame;
    }
  }

  /**
   * Called by every frame in the hp animation tween created in {@linkcode updatePokemonHp}
   * @param _pokemon - The pokemon the battle-info bar belongs to
   */
  protected onHpTweenUpdate(_pokemon: Pokemon): void {
    this.updateHpFrame();
  }

  /** Update the pokemonHp bar */
  protected updatePokemonHp(pokemon: Pokemon, resolve: (r: void | PromiseLike<void>) => void, instant?: boolean): void {
    let duration = !instant ? Phaser.Math.Clamp(Math.abs(this.lastHp - pokemon.hp) * 5, 250, 5000) : 0;
    const speed = globalScene.hpBarSpeed;
    if (speed) {
      duration = speed >= 3 ? 0 : duration / Math.pow(2, speed);
    }
    globalScene.tweens.add({
      targets: this.hpBar,
      ease: "Sine.easeOut",
      scaleX: pokemon.getHpRatio(true),
      duration: duration,
      onUpdate: () => {
        this.onHpTweenUpdate(pokemon);
      },
      onComplete: () => {
        this.updateHpFrame();
        resolve();
      },
    });
    this.lastMaxHp = pokemon.getMaxHp();
  }

  //#endregion

  async updateInfo(pokemon: Pokemon, instant?: boolean): Promise<void> {
    let resolve: (r: void | PromiseLike<void>) => void = () => {};
    const promise = new Promise<void>(r => (resolve = r));
    if (!globalScene) {
      return resolve();
    }

    const gender: Gender = pokemon.summonData?.illusion?.gender ?? pokemon.gender;

    this.genderText.setText(getGenderSymbol(gender)).setColor(getGenderColor(gender));

    const nameUpdated = this.updateName(pokemon.getNameToRender());

    const teraTypeUpdated = this.updateTeraType(pokemon.isTerastallized ? pokemon.getTeraType() : PokemonType.UNKNOWN);

    const isFusion = pokemon.isFusion(true);

    if (nameUpdated || teraTypeUpdated) {
      this.updateIconDisplay(isFusion);
    }

    this.updateStatusIcon(pokemon);

    if (this.lastHp !== pokemon.hp || this.lastMaxHp !== pokemon.getMaxHp()) {
      return this.updatePokemonHp(pokemon, resolve, instant);
    }
    if (!this.player && this.lastLevel !== pokemon.level) {
      this.setLevel(pokemon.level);
      this.lastLevel = pokemon.level;
    }

    const stats = pokemon.getStatStages();
    const statsStr = stats.join("");

    if (this.lastStats !== statsStr) {
      this.updateStats(stats);
      this.lastStats = statsStr;
    }

    this.shinyIcon.setVisible(pokemon.isShiny(true));

    const doubleShiny = isFusion && pokemon.shiny && pokemon.fusionShiny;
    const baseVariant = !doubleShiny ? pokemon.getVariant(true) : pokemon.variant;
    this.shinyIcon.setTint(getVariantTint(baseVariant));

    this.fusionShinyIcon.setVisible(doubleShiny).setPosition(this.shinyIcon.x, this.shinyIcon.y);
    if (isFusion) {
      this.fusionShinyIcon.setTint(getVariantTint(pokemon.fusionVariant));
    }

    resolve();
    await promise;
  }
  //#endregion

  updateNameText(pokemon: Pokemon): void {
    let displayName = pokemon.getNameToRender().replace(/[♂♀]/g, "");
    let nameTextWidth: number;

    const nameSizeTest = addTextObject(0, 0, displayName, TextStyle.BATTLE_INFO);
    nameTextWidth = nameSizeTest.displayWidth;

    const gender = pokemon.summonData.illusion?.gender ?? pokemon.gender;
    while (
      nameTextWidth >
      (this.player || !this.boss ? 60 : 98) -
        ((gender !== Gender.GENDERLESS ? 6 : 0) +
          (pokemon.fusionSpecies ? 8 : 0) +
          (pokemon.isShiny() ? 8 : 0) +
          (Math.min(pokemon.level.toString().length, 3) - 3) * 8)
    ) {
      displayName = `${displayName.slice(0, displayName.endsWith(".") ? -2 : -1).trimEnd()}.`;
      nameSizeTest.setText(displayName);
      nameTextWidth = nameSizeTest.displayWidth;
    }

    nameSizeTest.destroy();

    this.nameText.setText(displayName);
    this.lastName = pokemon.getNameToRender();

    if (this.nameText.visible) {
      this.nameText.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, this.nameText.width, this.nameText.height),
        Phaser.Geom.Rectangle.Contains,
      );
    }
  }

  setLevel(level: number): void {
    const isCapped = level >= globalScene.getMaxExpLevel();
    this.levelNumbersContainer.removeAll(true);
    const levelStr = level.toString();
    for (let i = 0; i < levelStr.length; i++) {
      this.levelNumbersContainer.add(
        globalScene.add.image(i * 8, 0, `numbers${isCapped && this.player ? "_red" : ""}`, levelStr[i]),
      );
    }
    this.levelContainer.setX((this.player ? -41 : -50) - 8 * Math.max(levelStr.length - 3, 0));
  }

  updateStats(stats: number[]): void {
    for (const [i, s] of this.statOrder.entries()) {
      if (s !== Stat.HP) {
        this.statNumbers[i].setFrame(stats[s - 1].toString());
      }
    }
  }

  getBaseY(): number {
    return this.baseY;
  }

  resetY(): void {
    this.y = this.baseY;
  }
}
