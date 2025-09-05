import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import Overrides from "#app/overrides";
import { FusionSpeciesFormEvolution, pokemonEvolutions } from "#balance/pokemon-evolutions";
import { FRIENDSHIP_GAIN_FROM_RARE_CANDY } from "#balance/starters";
import { getBerryEffectFunc, getBerryPredicate } from "#data/berry";
import { allMoves, modifierTypes } from "#data/data-lists";
import { getLevelTotalExp } from "#data/exp";
import { SpeciesFormChangeItemTrigger } from "#data/form-change-triggers";
import { MAX_PER_TYPE_POKEBALLS } from "#data/pokeball";
import { getStatusEffectHealText } from "#data/status-effect";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import { Color, ShadowColor } from "#enums/color";
import { Command } from "#enums/command";
import type { FormChangeItem } from "#enums/form-change-item";
import { LearnMoveType } from "#enums/learn-move-type";
import type { MoveId } from "#enums/move-id";
import type { Nature } from "#enums/nature";
import type { PokeballType } from "#enums/pokeball";
import type { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { BATTLE_STATS, type PermanentStat, Stat, TEMP_BATTLE_STATS, type TempBattleStat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { TextStyle } from "#enums/text-style";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import type {
  DoubleBattleChanceBoosterModifierType,
  EvolutionItemModifierType,
  FormChangeItemModifierType,
  ModifierOverride,
  ModifierType,
  PokemonBaseStatTotalModifierType,
  PokemonExpBoosterModifierType,
  PokemonFriendshipBoosterModifierType,
  PokemonMoveAccuracyBoosterModifierType,
  PokemonMultiHitModifierType,
  TerastallizeModifierType,
  TmModifierType,
} from "#modifiers/modifier-type";
import type { VoucherType } from "#system/voucher";
import type { ModifierInstanceMap, ModifierString } from "#types/modifier-types";
import { addTextObject } from "#ui/text";
import { BooleanHolder, hslToHex, isNullOrUndefined, NumberHolder, randSeedFloat, toDmgValue } from "#utils/common";
import { getModifierType } from "#utils/modifier-utils";
import i18next from "i18next";

export type ModifierPredicate = (modifier: Modifier) => boolean;

const iconOverflowIndex = 24;

export const modifierSortFunc = (a: Modifier, b: Modifier): number => {
  const itemNameMatch = a.type.name.localeCompare(b.type.name);
  const typeNameMatch = a.constructor.name.localeCompare(b.constructor.name);
  const aId = a instanceof PokemonHeldItemModifier ? a.pokemonId : -1;
  const bId = b instanceof PokemonHeldItemModifier ? b.pokemonId : -1;

  // First sort by pokemon ID, then by item type and then name
  return aId - bId || typeNameMatch || itemNameMatch;
};

export class ModifierBar extends Phaser.GameObjects.Container {
  private player: boolean;
  private modifierCache: PersistentModifier[];

  constructor(enemy?: boolean) {
    super(globalScene, 1 + (enemy ? 302 : 0), 2);

    this.player = !enemy;
    this.setScale(0.5);
  }

  /**
   * Method to update content displayed in {@linkcode ModifierBar}
   * @param {PersistentModifier[]} modifiers - The list of modifiers to be displayed in the {@linkcode ModifierBar}
   * @param {boolean} hideHeldItems - If set to "true", only modifiers not assigned to a Pokémon are displayed
   */
  updateModifiers(modifiers: PersistentModifier[], hideHeldItems = false) {
    this.removeAll(true);

    const visibleIconModifiers = modifiers.filter(m => m.isIconVisible());
    const nonPokemonSpecificModifiers = visibleIconModifiers
      .filter(m => !(m as PokemonHeldItemModifier).pokemonId)
      .sort(modifierSortFunc);
    const pokemonSpecificModifiers = visibleIconModifiers
      .filter(m => (m as PokemonHeldItemModifier).pokemonId)
      .sort(modifierSortFunc);

    const sortedVisibleIconModifiers = hideHeldItems
      ? nonPokemonSpecificModifiers
      : nonPokemonSpecificModifiers.concat(pokemonSpecificModifiers);

    sortedVisibleIconModifiers.forEach((modifier: PersistentModifier, i: number) => {
      const icon = modifier.getIcon();
      if (i >= iconOverflowIndex) {
        icon.setVisible(false);
      }
      this.add(icon);
      this.setModifierIconPosition(icon, sortedVisibleIconModifiers.length);
      icon.setInteractive(new Phaser.Geom.Rectangle(0, 0, 32, 24), Phaser.Geom.Rectangle.Contains);
      icon.on("pointerover", () => {
        globalScene.ui.showTooltip(modifier.type.name, modifier.type.getDescription());
        if (this.modifierCache && this.modifierCache.length > iconOverflowIndex) {
          this.updateModifierOverflowVisibility(true);
        }
      });
      icon.on("pointerout", () => {
        globalScene.ui.hideTooltip();
        if (this.modifierCache && this.modifierCache.length > iconOverflowIndex) {
          this.updateModifierOverflowVisibility(false);
        }
      });
    });

    for (const icon of this.getAll()) {
      this.sendToBack(icon);
    }

    this.modifierCache = modifiers;
  }

  updateModifierOverflowVisibility(ignoreLimit: boolean) {
    const modifierIcons = this.getAll().reverse() as Phaser.GameObjects.Container[];
    for (const modifier of modifierIcons.slice(iconOverflowIndex)) {
      modifier.setVisible(ignoreLimit);
    }
  }

  setModifierIconPosition(icon: Phaser.GameObjects.Container, modifierCount: number) {
    const rowIcons: number = 12 + 6 * Math.max(Math.ceil(Math.min(modifierCount, 24) / 12) - 2, 0);

    const x = ((this.getIndex(icon) % rowIcons) * 26) / (rowIcons / 12);
    const y = Math.floor(this.getIndex(icon) / rowIcons) * 20;

    icon.setPosition(this.player ? x : -x, y);
  }
}

export abstract class Modifier {
  public type: ModifierType;

  constructor(type: ModifierType) {
    this.type = type;
  }

  /**
   * Return whether this modifier is of the given class
   *
   * @remarks
   * Used to avoid requiring the caller to have imported the specific modifier class, avoiding circular dependencies.
   *
   * @param modifier - The modifier to check against
   * @returns Whether the modiifer is an instance of the given type
   */
  public is<T extends ModifierString>(modifier: T): this is ModifierInstanceMap[T] {
    const targetModifier = ModifierClassMap[modifier];
    if (!targetModifier) {
      return false;
    }
    return this instanceof targetModifier;
  }

  match(_modifier: Modifier): boolean {
    return false;
  }

  /**
   * Checks if {@linkcode Modifier} should be applied
   * @param _args parameters passed to {@linkcode Modifier.apply}
   * @returns always `true` by default
   */
  shouldApply(..._args: Parameters<this["apply"]>): boolean {
    return true;
  }

  /**
   * Handles applying of {@linkcode Modifier}
   * @param args collection of all passed parameters
   */
  abstract apply(...args: unknown[]): boolean;
}

export abstract class PersistentModifier extends Modifier {
  public stackCount: number;
  public virtualStackCount: number;

  /** This field does not exist at runtime and must not be used.
   * Its sole purpose is to ensure that typescript is able to properly narrow when the `is` method is called.
   */
  private declare _: never;

  constructor(type: ModifierType, stackCount = 1) {
    super(type);
    this.stackCount = stackCount;
    this.virtualStackCount = 0;
  }

  add(modifiers: PersistentModifier[], virtual: boolean): boolean {
    for (const modifier of modifiers) {
      if (this.match(modifier)) {
        return modifier.incrementStack(this.stackCount, virtual);
      }
    }

    if (virtual) {
      this.virtualStackCount += this.stackCount;
      this.stackCount = 0;
    }
    modifiers.push(this);
    return true;
  }

  abstract clone(): PersistentModifier;

  getArgs(): any[] {
    return [];
  }

  incrementStack(amount: number, virtual: boolean): boolean {
    if (this.getStackCount() + amount <= this.getMaxStackCount()) {
      if (!virtual) {
        this.stackCount += amount;
      } else {
        this.virtualStackCount += amount;
      }
      return true;
    }

    return false;
  }

  getStackCount(): number {
    return this.stackCount + this.virtualStackCount;
  }

  abstract getMaxStackCount(forThreshold?: boolean): number;

  getCountUnderMax(): number {
    return this.getMaxStackCount() - this.getStackCount();
  }

  isIconVisible(): boolean {
    return true;
  }

  getIcon(_forSummary?: boolean): Phaser.GameObjects.Container {
    const container = globalScene.add.container(0, 0);

    const item = globalScene.add.sprite(0, 12, "items");
    item.setFrame(this.type.iconImage);
    item.setOrigin(0, 0.5);
    container.add(item);

    const stackText = this.getIconStackText();
    if (stackText) {
      container.add(stackText);
    }

    const virtualStackText = this.getIconStackText(true);
    if (virtualStackText) {
      container.add(virtualStackText);
    }

    return container;
  }

  getIconStackText(virtual?: boolean): Phaser.GameObjects.BitmapText | null {
    if (this.getMaxStackCount() === 1 || (virtual && !this.virtualStackCount)) {
      return null;
    }

    const text = globalScene.add.bitmapText(10, 15, "item-count", this.stackCount.toString(), 11);
    text.letterSpacing = -0.5;
    if (this.getStackCount() >= this.getMaxStackCount()) {
      text.setTint(0xf89890);
    }
    text.setOrigin(0, 0);

    return text;
  }
}

export abstract class ConsumableModifier extends Modifier {
  add(_modifiers: Modifier[]): boolean {
    return true;
  }
}

export class AddPokeballModifier extends ConsumableModifier {
  private pokeballType: PokeballType;
  private count: number;

  constructor(type: ModifierType, pokeballType: PokeballType, count: number) {
    super(type);

    this.pokeballType = pokeballType;
    this.count = count;
  }

  /**
   * Applies {@linkcode AddPokeballModifier}
   * @param battleScene {@linkcode BattleScene}
   * @returns always `true`
   */
  override apply(): boolean {
    const pokeballCounts = globalScene.pokeballCounts;
    pokeballCounts[this.pokeballType] = Math.min(
      pokeballCounts[this.pokeballType] + this.count,
      MAX_PER_TYPE_POKEBALLS,
    );

    return true;
  }
}

export class AddVoucherModifier extends ConsumableModifier {
  private voucherType: VoucherType;
  private count: number;

  constructor(type: ModifierType, voucherType: VoucherType, count: number) {
    super(type);

    this.voucherType = voucherType;
    this.count = count;
  }

  /**
   * Applies {@linkcode AddVoucherModifier}
   * @param battleScene {@linkcode BattleScene}
   * @returns always `true`
   */
  override apply(): boolean {
    const voucherCounts = globalScene.gameData.voucherCounts;
    voucherCounts[this.voucherType] += this.count;

    return true;
  }
}

/**
 * Modifier used for party-wide or passive items that start an initial
 * {@linkcode battleCount} equal to {@linkcode maxBattles} that, for every
 * battle, decrements. Typically, when {@linkcode battleCount} reaches 0, the
 * modifier will be removed. If a modifier of the same type is to be added, it
 * will reset {@linkcode battleCount} back to {@linkcode maxBattles} of the
 * existing modifier instead of adding that modifier directly.
 * @extends PersistentModifier
 * @abstract
 * @see {@linkcode add}
 */
export abstract class LapsingPersistentModifier extends PersistentModifier {
  /** The maximum amount of battles the modifier will exist for */
  private maxBattles: number;
  /** The current amount of battles the modifier will exist for */
  private battleCount: number;

  constructor(type: ModifierType, maxBattles: number, battleCount?: number, stackCount?: number) {
    super(type, stackCount);

    this.maxBattles = maxBattles;
    this.battleCount = battleCount ?? this.maxBattles;
  }

  /**
   * Goes through existing modifiers for any that match the selected modifier,
   * which will then either add it to the existing modifiers if none were found
   * or, if one was found, it will refresh {@linkcode battleCount}.
   * @param modifiers {@linkcode PersistentModifier} array of the player's modifiers
   * @param _virtual N/A
   * @param _scene N/A
   * @returns `true` if the modifier was successfully added or applied, false otherwise
   */
  add(modifiers: PersistentModifier[], _virtual: boolean): boolean {
    for (const modifier of modifiers) {
      if (this.match(modifier)) {
        const modifierInstance = modifier as LapsingPersistentModifier;
        if (modifierInstance.getBattleCount() < modifierInstance.getMaxBattles()) {
          modifierInstance.resetBattleCount();
          globalScene.playSound("se/restore");
          return true;
        }
        // should never get here
        return false;
      }
    }

    modifiers.push(this);
    return true;
  }

  /**
   * Lapses the {@linkcode battleCount} by 1.
   * @param _args passed arguments (not in use here)
   * @returns `true` if the {@linkcode battleCount} is greater than 0
   */
  public lapse(..._args: unknown[]): boolean {
    this.battleCount--;
    return this.battleCount > 0;
  }

  getIcon(): Phaser.GameObjects.Container {
    const container = super.getIcon();

    // Linear interpolation on hue
    const hue = Math.floor(120 * (this.battleCount / this.maxBattles) + 5);

    // Generates the color hex code with a constant saturation and lightness but varying hue
    const typeHex = hslToHex(hue, 0.5, 0.9);
    const strokeHex = hslToHex(hue, 0.7, 0.3);

    const battleCountText = addTextObject(27, 0, this.battleCount.toString(), TextStyle.PARTY, {
      fontSize: "66px",
      color: typeHex,
    });
    battleCountText.setShadow(0, 0);
    battleCountText.setStroke(strokeHex, 16);
    battleCountText.setOrigin(1, 0);
    container.add(battleCountText);

    return container;
  }

  getIconStackText(_virtual?: boolean): Phaser.GameObjects.BitmapText | null {
    return null;
  }

  getBattleCount(): number {
    return this.battleCount;
  }

  resetBattleCount(): void {
    this.battleCount = this.maxBattles;
  }

  /**
   * Updates an existing modifier with a new `maxBattles` and `battleCount`.
   */
  setNewBattleCount(count: number): void {
    this.maxBattles = count;
    this.battleCount = count;
  }

  getMaxBattles(): number {
    return this.maxBattles;
  }

  getArgs(): any[] {
    return [this.maxBattles, this.battleCount];
  }

  getMaxStackCount(_forThreshold?: boolean): number {
    // Must be an abitrary number greater than 1
    return 2;
  }
}

/**
 * Modifier used for passive items, specifically lures, that
 * temporarily increases the chance of a double battle.
 * @extends LapsingPersistentModifier
 * @see {@linkcode apply}
 */
export class DoubleBattleChanceBoosterModifier extends LapsingPersistentModifier {
  public declare type: DoubleBattleChanceBoosterModifierType;

  match(modifier: Modifier): boolean {
    return modifier instanceof DoubleBattleChanceBoosterModifier && modifier.getMaxBattles() === this.getMaxBattles();
  }

  clone(): DoubleBattleChanceBoosterModifier {
    return new DoubleBattleChanceBoosterModifier(
      this.type,
      this.getMaxBattles(),
      this.getBattleCount(),
      this.stackCount,
    );
  }

  /**
   * Increases the chance of a double battle occurring
   * @param doubleBattleChance {@linkcode NumberHolder} for double battle chance
   * @returns true
   */
  override apply(doubleBattleChance: NumberHolder): boolean {
    // This is divided because the chance is generated as a number from 0 to doubleBattleChance.value using randSeedInt
    // A double battle will initiate if the generated number is 0
    doubleBattleChance.value = doubleBattleChance.value / 4;

    return true;
  }
}

/**
 * Modifier used for party-wide items, specifically the X items, that
 * temporarily increases the stat stage multiplier of the corresponding
 * {@linkcode TempBattleStat}.
 * @extends LapsingPersistentModifier
 * @see {@linkcode apply}
 */
export class TempStatStageBoosterModifier extends LapsingPersistentModifier {
  /** The stat whose stat stage multiplier will be temporarily increased */
  private stat: TempBattleStat;
  /** The amount by which the stat stage itself or its multiplier will be increased by */
  private boost: number;

  constructor(type: ModifierType, stat: TempBattleStat, maxBattles: number, battleCount?: number, stackCount?: number) {
    super(type, maxBattles, battleCount, stackCount);

    this.stat = stat;
    // Note that, because we want X Accuracy to maintain its original behavior,
    // it will increment as it did previously, directly to the stat stage.
    this.boost = stat !== Stat.ACC ? 0.3 : 1;
  }

  match(modifier: Modifier): boolean {
    if (modifier instanceof TempStatStageBoosterModifier) {
      const modifierInstance = modifier as TempStatStageBoosterModifier;
      return modifierInstance.stat === this.stat;
    }
    return false;
  }

  clone() {
    return new TempStatStageBoosterModifier(
      this.type,
      this.stat,
      this.getMaxBattles(),
      this.getBattleCount(),
      this.stackCount,
    );
  }

  getArgs(): any[] {
    return [this.stat, ...super.getArgs()];
  }

  /**
   * Checks if {@linkcode args} contains the necessary elements and if the
   * incoming stat is matches {@linkcode stat}.
   * @param tempBattleStat {@linkcode TempBattleStat} being affected
   * @param statLevel {@linkcode NumberHolder} that holds the resulting value of the stat stage multiplier
   * @returns `true` if the modifier can be applied, false otherwise
   */
  override shouldApply(tempBattleStat?: TempBattleStat, statLevel?: NumberHolder): boolean {
    return (
      !!tempBattleStat && !!statLevel && TEMP_BATTLE_STATS.includes(tempBattleStat) && tempBattleStat === this.stat
    );
  }

  /**
   * Increases the incoming stat stage matching {@linkcode stat} by {@linkcode boost}.
   * @param _tempBattleStat {@linkcode TempBattleStat} N/A
   * @param statLevel {@linkcode NumberHolder} that holds the resulting value of the stat stage multiplier
   */
  override apply(_tempBattleStat: TempBattleStat, statLevel: NumberHolder): boolean {
    statLevel.value += this.boost;
    return true;
  }
}

/**
 * Modifier used for party-wide items, namely Dire Hit, that
 * temporarily increments the critical-hit stage
 * @extends LapsingPersistentModifier
 * @see {@linkcode apply}
 */
export class TempCritBoosterModifier extends LapsingPersistentModifier {
  clone() {
    return new TempCritBoosterModifier(this.type, this.getMaxBattles(), this.getBattleCount(), this.stackCount);
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof TempCritBoosterModifier;
  }

  /**
   * Checks if {@linkcode args} contains the necessary elements.
   * @param critLevel {@linkcode NumberHolder} that holds the resulting critical-hit level
   * @returns `true` if the critical-hit stage boost applies successfully
   */
  override shouldApply(critLevel?: NumberHolder): boolean {
    return !!critLevel;
  }

  /**
   * Increases the current critical-hit stage value by 1.
   * @param critLevel {@linkcode NumberHolder} that holds the resulting critical-hit level
   * @returns `true` if the critical-hit stage boost applies successfully
   */
  override apply(critLevel: NumberHolder): boolean {
    critLevel.value++;
    return true;
  }
}

export class MapModifier extends PersistentModifier {
  clone(): MapModifier {
    return new MapModifier(this.type, this.stackCount);
  }

  override apply(..._args: unknown[]): boolean {
    return true;
  }

  getMaxStackCount(): number {
    return 1;
  }
}

export class MegaEvolutionAccessModifier extends PersistentModifier {
  clone(): MegaEvolutionAccessModifier {
    return new MegaEvolutionAccessModifier(this.type, this.stackCount);
  }

  override apply(..._args: unknown[]): boolean {
    return true;
  }

  getMaxStackCount(): number {
    return 1;
  }
}

export class GigantamaxAccessModifier extends PersistentModifier {
  clone(): GigantamaxAccessModifier {
    return new GigantamaxAccessModifier(this.type, this.stackCount);
  }

  /**
   * Applies {@linkcode GigantamaxAccessModifier}
   * @param _args N/A
   * @returns always `true`
   */
  apply(..._args: unknown[]): boolean {
    return true;
  }

  getMaxStackCount(): number {
    return 1;
  }
}

export class TerastallizeAccessModifier extends PersistentModifier {
  clone(): TerastallizeAccessModifier {
    return new TerastallizeAccessModifier(this.type, this.stackCount);
  }

  /**
   * Applies {@linkcode TerastallizeAccessModifier}
   * @param _args N/A
   * @returns always `true`
   */
  override apply(..._args: unknown[]): boolean {
    return true;
  }

  getMaxStackCount(): number {
    return 1;
  }
}

export abstract class PokemonHeldItemModifier extends PersistentModifier {
  /** The ID of the {@linkcode Pokemon} that this item belongs to. */
  public pokemonId: number;
  /** Whether this item can be transfered to or stolen by another Pokemon. */
  public isTransferable = true;

  constructor(type: ModifierType, pokemonId: number, stackCount?: number) {
    super(type, stackCount);

    this.pokemonId = pokemonId;
  }

  abstract matchType(_modifier: Modifier): boolean;

  match(modifier: Modifier) {
    return this.matchType(modifier) && (modifier as PokemonHeldItemModifier).pokemonId === this.pokemonId;
  }

  getArgs(): any[] {
    return [this.pokemonId];
  }

  /**
   * Applies the {@linkcode PokemonHeldItemModifier} to the given {@linkcode Pokemon}.
   * @param pokemon The {@linkcode Pokemon} that holds the held item
   * @param args additional parameters
   */
  abstract override apply(pokemon: Pokemon, ...args: unknown[]): boolean;

  /**
   * Checks if {@linkcode PokemonHeldItemModifier} should be applied.
   * @param pokemon The {@linkcode Pokemon} that holds the item
   * @param _args N/A
   * @returns if {@linkcode PokemonHeldItemModifier} should be applied
   */
  override shouldApply(pokemon?: Pokemon, ..._args: unknown[]): boolean {
    return !!pokemon && (this.pokemonId === -1 || pokemon.id === this.pokemonId);
  }

  isIconVisible(): boolean {
    return !!this.getPokemon()?.isOnField();
  }

  getIcon(forSummary?: boolean): Phaser.GameObjects.Container {
    const container = !forSummary ? globalScene.add.container(0, 0) : super.getIcon();

    if (!forSummary) {
      const pokemon = this.getPokemon();
      if (pokemon) {
        const pokemonIcon = globalScene.addPokemonIcon(pokemon, -2, 10, 0, 0.5, undefined, true);
        container.add(pokemonIcon);
        container.setName(pokemon.id.toString());
      }

      const item = globalScene.add.sprite(16, this.virtualStackCount ? 8 : 16, "items");
      item.setScale(0.5);
      item.setOrigin(0, 0.5);
      item.setTexture("items", this.type.iconImage);
      container.add(item);

      const stackText = this.getIconStackText();
      if (stackText) {
        container.add(stackText);
      }

      const virtualStackText = this.getIconStackText(true);
      if (virtualStackText) {
        container.add(virtualStackText);
      }
    } else {
      container.setScale(0.5);
    }

    return container;
  }

  getPokemon(): Pokemon | undefined {
    return globalScene.getPokemonById(this.pokemonId) ?? undefined;
  }

  getScoreMultiplier(): number {
    return 1;
  }

  getMaxStackCount(forThreshold = false): number {
    const pokemon = this.getPokemon();
    if (!pokemon) {
      return 0;
    }
    if (pokemon.isPlayer() && forThreshold) {
      return globalScene
        .getPlayerParty()
        .map(p => this.getMaxHeldItemCount(p))
        .reduce((stackCount: number, maxStackCount: number) => Math.max(stackCount, maxStackCount), 0);
    }
    return this.getMaxHeldItemCount(pokemon);
  }

  getSpecies(): SpeciesId | null {
    return null;
  }

  abstract getMaxHeldItemCount(pokemon?: Pokemon): number;
}

export abstract class LapsingPokemonHeldItemModifier extends PokemonHeldItemModifier {
  protected battlesLeft: number;
  public isTransferable = false;

  constructor(type: ModifierType, pokemonId: number, battlesLeft?: number, stackCount?: number) {
    super(type, pokemonId, stackCount);

    this.battlesLeft = battlesLeft!; // TODO: is this bang correct?
  }

  /**
   * Lapse the {@linkcode battlesLeft} counter (reduce it by 1)
   * @param _args arguments passed (not used here)
   * @returns `true` if {@linkcode battlesLeft} is not null
   */
  public lapse(..._args: unknown[]): boolean {
    return !!--this.battlesLeft;
  }

  /**
   * Retrieve the {@linkcode Modifier | Modifiers} icon as a {@linkcode Phaser.GameObjects.Container | Container}
   * @param forSummary `true` if the icon is for the summary screen
   * @returns the icon as a {@linkcode Phaser.GameObjects.Container | Container}
   */
  public getIcon(forSummary?: boolean): Phaser.GameObjects.Container {
    const container = super.getIcon(forSummary);

    if (this.getPokemon()?.isPlayer()) {
      const battleCountText = addTextObject(27, 0, this.battlesLeft.toString(), TextStyle.PARTY, {
        fontSize: "66px",
        color: Color.PINK,
      });
      battleCountText.setShadow(0, 0);
      battleCountText.setStroke(ShadowColor.RED, 16);
      battleCountText.setOrigin(1, 0);
      container.add(battleCountText);
    }

    return container;
  }

  getBattlesLeft(): number {
    return this.battlesLeft;
  }

  getMaxStackCount(_forThreshold?: boolean): number {
    return 1;
  }
}

/**
 * Modifier used for held items, specifically vitamins like Carbos, Hp Up, etc., that
 * increase the value of a given {@linkcode PermanentStat}.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class BaseStatModifier extends PokemonHeldItemModifier {
  protected stat: PermanentStat;
  public isTransferable = false;

  constructor(type: ModifierType, pokemonId: number, stat: PermanentStat, stackCount?: number) {
    super(type, pokemonId, stackCount);
    this.stat = stat;
  }

  matchType(modifier: Modifier): boolean {
    if (modifier instanceof BaseStatModifier) {
      return (modifier as BaseStatModifier).stat === this.stat;
    }
    return false;
  }

  clone(): PersistentModifier {
    return new BaseStatModifier(this.type, this.pokemonId, this.stat, this.stackCount);
  }

  getArgs(): any[] {
    return super.getArgs().concat(this.stat);
  }

  /**
   * Checks if {@linkcode BaseStatModifier} should be applied to the specified {@linkcode Pokemon}.
   * @param _pokemon the {@linkcode Pokemon} to be modified
   * @param baseStats the base stats of the {@linkcode Pokemon}
   * @returns `true` if the {@linkcode Pokemon} should be modified
   */
  override shouldApply(_pokemon?: Pokemon, baseStats?: number[]): boolean {
    return super.shouldApply(_pokemon, baseStats) && Array.isArray(baseStats);
  }

  /**
   * Applies the {@linkcode BaseStatModifier} to the specified {@linkcode Pokemon}.
   * @param _pokemon the {@linkcode Pokemon} to be modified
   * @param baseStats the base stats of the {@linkcode Pokemon}
   * @returns always `true`
   */
  override apply(_pokemon: Pokemon, baseStats: number[]): boolean {
    baseStats[this.stat] = Math.floor(baseStats[this.stat] * (1 + this.getStackCount() * 0.1));
    return true;
  }

  getScoreMultiplier(): number {
    return 1.1;
  }

  getMaxHeldItemCount(pokemon: Pokemon): number {
    return pokemon.ivs[this.stat];
  }
}

export class EvoTrackerModifier extends PokemonHeldItemModifier {
  protected species: SpeciesId;
  protected required: number;
  public isTransferable = false;

  constructor(type: ModifierType, pokemonId: number, species: SpeciesId, required: number, stackCount?: number) {
    super(type, pokemonId, stackCount);
    this.species = species;
    this.required = required;
  }

  matchType(modifier: Modifier): boolean {
    return (
      modifier instanceof EvoTrackerModifier && modifier.species === this.species && modifier.required === this.required
    );
  }

  clone(): PersistentModifier {
    return new EvoTrackerModifier(this.type, this.pokemonId, this.species, this.required, this.stackCount);
  }

  getArgs(): any[] {
    return super.getArgs().concat([this.species, this.required]);
  }

  /**
   * Applies the {@linkcode EvoTrackerModifier}
   * @returns always `true`
   */
  override apply(): boolean {
    return true;
  }

  getIconStackText(_virtual?: boolean): Phaser.GameObjects.BitmapText | null {
    const pokemon = this.getPokemon();

    const count = (pokemon?.getPersistentTreasureCount() || 0) + this.getStackCount();

    const text = globalScene.add.bitmapText(10, 15, "item-count", count.toString(), 11);
    text.letterSpacing = -0.5;
    if (count >= this.required) {
      text.setTint(0xf89890);
    }
    text.setOrigin(0, 0);

    return text;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 999;
  }

  override getSpecies(): SpeciesId {
    return this.species;
  }
}

/**
 * Currently used by Shuckle Juice item
 */
export class PokemonBaseStatTotalModifier extends PokemonHeldItemModifier {
  public declare type: PokemonBaseStatTotalModifierType;
  public isTransferable = false;
  public statModifier: 10 | -15;

  constructor(type: PokemonBaseStatTotalModifierType, pokemonId: number, statModifier: 10 | -15, stackCount?: number) {
    super(type, pokemonId, stackCount);
    this.statModifier = statModifier;
  }

  override matchType(modifier: Modifier): boolean {
    return modifier instanceof PokemonBaseStatTotalModifier && this.statModifier === modifier.statModifier;
  }

  override clone(): PersistentModifier {
    return new PokemonBaseStatTotalModifier(this.type, this.pokemonId, this.statModifier, this.stackCount);
  }

  override getArgs(): any[] {
    return super.getArgs().concat(this.statModifier);
  }

  /**
   * Checks if {@linkcode PokemonBaseStatTotalModifier} should be applied to the specified {@linkcode Pokemon}.
   * @param pokemon the {@linkcode Pokemon} to be modified
   * @param baseStats the base stats of the {@linkcode Pokemon}
   * @returns `true` if the {@linkcode Pokemon} should be modified
   */
  override shouldApply(pokemon?: Pokemon, baseStats?: number[]): boolean {
    return super.shouldApply(pokemon, baseStats) && Array.isArray(baseStats);
  }

  /**
   * Applies the {@linkcode PokemonBaseStatTotalModifier}
   * @param _pokemon the {@linkcode Pokemon} to be modified
   * @param baseStats the base stats of the {@linkcode Pokemon}
   * @returns always `true`
   */
  override apply(_pokemon: Pokemon, baseStats: number[]): boolean {
    // Modifies the passed in baseStats[] array
    baseStats.forEach((v, i) => {
      // HP is affected by half as much as other stats
      const newVal = i === 0 ? Math.floor(v + this.statModifier / 2) : Math.floor(v + this.statModifier);
      baseStats[i] = Math.min(Math.max(newVal, 1), 999999);
    });

    return true;
  }

  override getScoreMultiplier(): number {
    return 1.2;
  }

  override getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 2;
  }
}

/**
 * Currently used by Old Gateau item
 */
export class PokemonBaseStatFlatModifier extends PokemonHeldItemModifier {
  public isTransferable = false;

  override matchType(modifier: Modifier): boolean {
    return modifier instanceof PokemonBaseStatFlatModifier;
  }

  override clone(): PersistentModifier {
    return new PokemonBaseStatFlatModifier(this.type, this.pokemonId, this.stackCount);
  }

  /**
   * Checks if the {@linkcode PokemonBaseStatFlatModifier} should be applied to the {@linkcode Pokemon}.
   * @param pokemon The {@linkcode Pokemon} that holds the item
   * @param baseStats The base stats of the {@linkcode Pokemon}
   * @returns `true` if the {@linkcode PokemonBaseStatFlatModifier} should be applied
   */
  override shouldApply(pokemon?: Pokemon, baseStats?: number[]): boolean {
    return super.shouldApply(pokemon, baseStats) && Array.isArray(baseStats);
  }

  /**
   * Applies the {@linkcode PokemonBaseStatFlatModifier}
   * @param _pokemon The {@linkcode Pokemon} that holds the item
   * @param baseStats The base stats of the {@linkcode Pokemon}
   * @returns always `true`
   */
  override apply(pokemon: Pokemon, baseStats: number[]): boolean {
    // Modifies the passed in baseStats[] array by a flat value, only if the stat is specified in this.stats
    const stats = this.getStats(pokemon);
    const statModifier = 20;
    baseStats.forEach((v, i) => {
      if (stats.includes(i)) {
        const newVal = Math.floor(v + statModifier);
        baseStats[i] = Math.min(Math.max(newVal, 1), 999999);
      }
    });

    return true;
  }

  /**
   * Get the lowest of HP/Spd, lowest of Atk/SpAtk, and lowest of Def/SpDef
   * @returns Array of 3 {@linkcode Stat}s to boost
   */
  getStats(pokemon: Pokemon): Stat[] {
    const stats: Stat[] = [];
    const baseStats = pokemon.getSpeciesForm().baseStats.slice(0);
    // HP or Speed
    stats.push(baseStats[Stat.HP] < baseStats[Stat.SPD] ? Stat.HP : Stat.SPD);
    // Attack or SpAtk
    stats.push(baseStats[Stat.ATK] < baseStats[Stat.SPATK] ? Stat.ATK : Stat.SPATK);
    // Def or SpDef
    stats.push(baseStats[Stat.DEF] < baseStats[Stat.SPDEF] ? Stat.DEF : Stat.SPDEF);
    return stats;
  }

  override getScoreMultiplier(): number {
    return 1.1;
  }

  override getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 1;
  }
}

/**
 * Currently used by Macho Brace item
 */
export class PokemonIncrementingStatModifier extends PokemonHeldItemModifier {
  public isTransferable = false;

  matchType(modifier: Modifier): boolean {
    return modifier instanceof PokemonIncrementingStatModifier;
  }

  clone(): PokemonIncrementingStatModifier {
    return new PokemonIncrementingStatModifier(this.type, this.pokemonId, this.stackCount);
  }

  /**
   * Checks if the {@linkcode PokemonIncrementingStatModifier} should be applied to the {@linkcode Pokemon}.
   * @param pokemon The {@linkcode Pokemon} that holds the item
   * @param stat The affected {@linkcode Stat}
   * @param statHolder The {@linkcode NumberHolder} that holds the stat
   * @returns `true` if the {@linkcode PokemonBaseStatFlatModifier} should be applied
   */
  override shouldApply(pokemon?: Pokemon, stat?: Stat, statHolder?: NumberHolder): boolean {
    return super.shouldApply(pokemon, stat, statHolder) && !!statHolder;
  }

  /**
   * Applies the {@linkcode PokemonIncrementingStatModifier}
   * @param _pokemon The {@linkcode Pokemon} that holds the item
   * @param stat The affected {@linkcode Stat}
   * @param statHolder The {@linkcode NumberHolder} that holds the stat
   * @returns always `true`
   */
  override apply(_pokemon: Pokemon, stat: Stat, statHolder: NumberHolder): boolean {
    // Modifies the passed in stat number holder by +2 per stack for HP, +1 per stack for other stats
    // If the Macho Brace is at max stacks (50), adds additional 10% to total HP and 5% to other stats
    const isHp = stat === Stat.HP;

    if (isHp) {
      statHolder.value += 2 * this.stackCount;
      if (this.stackCount === this.getMaxHeldItemCount()) {
        statHolder.value = Math.floor(statHolder.value * 1.1);
      }
    } else {
      statHolder.value += this.stackCount;
      if (this.stackCount === this.getMaxHeldItemCount()) {
        statHolder.value = Math.floor(statHolder.value * 1.05);
      }
    }

    return true;
  }

  getScoreMultiplier(): number {
    return 1.2;
  }

  getMaxHeldItemCount(_pokemon?: Pokemon): number {
    return 50;
  }
}

/**
 * Modifier used for held items that Applies {@linkcode Stat} boost(s)
 * using a multiplier.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class StatBoosterModifier extends PokemonHeldItemModifier {
  /** The stats that the held item boosts */
  protected stats: Stat[];
  /** The multiplier used to increase the relevant stat(s) */
  protected multiplier: number;

  constructor(type: ModifierType, pokemonId: number, stats: Stat[], multiplier: number, stackCount?: number) {
    super(type, pokemonId, stackCount);

    this.stats = stats;
    this.multiplier = multiplier;
  }

  clone() {
    return new StatBoosterModifier(this.type, this.pokemonId, this.stats, this.multiplier, this.stackCount);
  }

  getArgs(): any[] {
    return [...super.getArgs(), this.stats, this.multiplier];
  }

  matchType(modifier: Modifier): boolean {
    if (modifier instanceof StatBoosterModifier) {
      const modifierInstance = modifier as StatBoosterModifier;
      if (modifierInstance.multiplier === this.multiplier && modifierInstance.stats.length === this.stats.length) {
        return modifierInstance.stats.every((e, i) => e === this.stats[i]);
      }
    }

    return false;
  }

  /**
   * Checks if the incoming stat is listed in {@linkcode stats}
   * @param _pokemon the {@linkcode Pokemon} that holds the item
   * @param _stat the {@linkcode Stat} to be boosted
   * @param statValue {@linkcode NumberHolder} that holds the resulting value of the stat
   * @returns `true` if the stat could be boosted, false otherwise
   */
  override shouldApply(pokemon: Pokemon, stat: Stat, statValue: NumberHolder): boolean {
    return super.shouldApply(pokemon, stat, statValue) && this.stats.includes(stat);
  }

  /**
   * Boosts the incoming stat by a {@linkcode multiplier} if the stat is listed
   * in {@linkcode stats}.
   * @param _pokemon the {@linkcode Pokemon} that holds the item
   * @param _stat the {@linkcode Stat} to be boosted
   * @param statValue {@linkcode NumberHolder} that holds the resulting value of the stat
   * @returns `true` if the stat boost applies successfully, false otherwise
   * @see shouldApply
   */
  override apply(_pokemon: Pokemon, _stat: Stat, statValue: NumberHolder): boolean {
    statValue.value *= this.multiplier;
    return true;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 1;
  }
}

/**
 * Modifier used for held items, specifically Eviolite, that apply
 * {@linkcode Stat} boost(s) using a multiplier if the holder can evolve.
 * @extends StatBoosterModifier
 * @see {@linkcode apply}
 */
export class EvolutionStatBoosterModifier extends StatBoosterModifier {
  matchType(modifier: Modifier): boolean {
    return modifier instanceof EvolutionStatBoosterModifier;
  }

  /**
   * Checks if the stat boosts can apply and if the holder is not currently
   * Gigantamax'd.
   * @param pokemon {@linkcode Pokemon} that holds the held item
   * @param stat {@linkcode Stat} The {@linkcode Stat} to be boosted
   * @param statValue {@linkcode NumberHolder} that holds the resulting value of the stat
   * @returns `true` if the stat boosts can be applied, false otherwise
   */
  override shouldApply(pokemon: Pokemon, stat: Stat, statValue: NumberHolder): boolean {
    return super.shouldApply(pokemon, stat, statValue) && !pokemon.isMax();
  }

  /**
   * Boosts the incoming stat value by a {@linkcode EvolutionStatBoosterModifier.multiplier} if the holder
   * can evolve. Note that, if the holder is a fusion, they will receive
   * only half of the boost if either of the fused members are fully
   * evolved. However, if they are both unevolved, the full boost
   * will apply.
   * @param pokemon {@linkcode Pokemon} that holds the item
   * @param _stat {@linkcode Stat} The {@linkcode Stat} to be boosted
   * @param statValue{@linkcode NumberHolder} that holds the resulting value of the stat
   * @returns `true` if the stat boost applies successfully, false otherwise
   * @see shouldApply
   */
  override apply(pokemon: Pokemon, stat: Stat, statValue: NumberHolder): boolean {
    const isUnevolved = pokemon.getSpeciesForm(true).speciesId in pokemonEvolutions;

    if (pokemon.isFusion() && pokemon.getFusionSpeciesForm(true).speciesId in pokemonEvolutions !== isUnevolved) {
      // Half boost applied if pokemon is fused and either part of fusion is fully evolved
      statValue.value *= 1 + (this.multiplier - 1) / 2;
      return true;
    }
    if (isUnevolved) {
      // Full boost applied if holder is unfused and unevolved or, if fused, both parts of fusion are unevolved
      return super.apply(pokemon, stat, statValue);
    }

    return false;
  }
}

/**
 * Modifier used for held items that Applies {@linkcode Stat} boost(s) using a
 * multiplier if the holder is of a specific {@linkcode SpeciesId}.
 * @extends StatBoosterModifier
 * @see {@linkcode apply}
 */
export class SpeciesStatBoosterModifier extends StatBoosterModifier {
  /** The species that the held item's stat boost(s) apply to */
  private species: SpeciesId[];

  constructor(
    type: ModifierType,
    pokemonId: number,
    stats: Stat[],
    multiplier: number,
    species: SpeciesId[],
    stackCount?: number,
  ) {
    super(type, pokemonId, stats, multiplier, stackCount);

    this.species = species;
  }

  clone() {
    return new SpeciesStatBoosterModifier(
      this.type,
      this.pokemonId,
      this.stats,
      this.multiplier,
      this.species,
      this.stackCount,
    );
  }

  getArgs(): any[] {
    return [...super.getArgs(), this.species];
  }

  matchType(modifier: Modifier): boolean {
    if (modifier instanceof SpeciesStatBoosterModifier) {
      const modifierInstance = modifier as SpeciesStatBoosterModifier;
      if (modifierInstance.species.length === this.species.length) {
        return super.matchType(modifier) && modifierInstance.species.every((e, i) => e === this.species[i]);
      }
    }

    return false;
  }

  /**
   * Checks if the incoming stat is listed in {@linkcode stats} and if the holder's {@linkcode SpeciesId}
   * (or its fused species) is listed in {@linkcode species}.
   * @param pokemon {@linkcode Pokemon} that holds the item
   * @param stat {@linkcode Stat} being checked at the time
   * @param statValue {@linkcode NumberHolder} that holds the resulting value of the stat
   * @returns `true` if the stat could be boosted, false otherwise
   */
  override shouldApply(pokemon: Pokemon, stat: Stat, statValue: NumberHolder): boolean {
    return (
      super.shouldApply(pokemon, stat, statValue)
      && (this.species.includes(pokemon.getSpeciesForm(true).speciesId)
        || (pokemon.isFusion() && this.species.includes(pokemon.getFusionSpeciesForm(true).speciesId)))
    );
  }

  /**
   * Checks if either parameter is included in the corresponding lists
   * @param speciesId {@linkcode SpeciesId} being checked
   * @param stat {@linkcode Stat} being checked
   * @returns `true` if both parameters are in {@linkcode species} and {@linkcode stats} respectively, false otherwise
   */
  contains(speciesId: SpeciesId, stat: Stat): boolean {
    return this.species.includes(speciesId) && this.stats.includes(stat);
  }
}

/**
 * Modifier used for held items that apply critical-hit stage boost(s).
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class CritBoosterModifier extends PokemonHeldItemModifier {
  /** The amount of stages by which the held item increases the current critical-hit stage value */
  protected stageIncrement: number;

  constructor(type: ModifierType, pokemonId: number, stageIncrement: number, stackCount?: number) {
    super(type, pokemonId, stackCount);

    this.stageIncrement = stageIncrement;
  }

  clone() {
    return new CritBoosterModifier(this.type, this.pokemonId, this.stageIncrement, this.stackCount);
  }

  getArgs(): any[] {
    return super.getArgs().concat(this.stageIncrement);
  }

  matchType(modifier: Modifier): boolean {
    if (modifier instanceof CritBoosterModifier) {
      return (modifier as CritBoosterModifier).stageIncrement === this.stageIncrement;
    }

    return false;
  }

  /**
   * Increases the current critical-hit stage value by {@linkcode stageIncrement}.
   * @param _pokemon {@linkcode Pokemon} N/A
   * @param critStage {@linkcode NumberHolder} that holds the resulting critical-hit level
   * @returns always `true`
   */
  override apply(_pokemon: Pokemon, critStage: NumberHolder): boolean {
    critStage.value += this.stageIncrement;
    return true;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 1;
  }
}

/**
 * Modifier used for held items that apply critical-hit stage boost(s)
 * if the holder is of a specific {@linkcode SpeciesId}.
 * @extends CritBoosterModifier
 * @see {@linkcode shouldApply}
 */
export class SpeciesCritBoosterModifier extends CritBoosterModifier {
  /** The species that the held item's critical-hit stage boost applies to */
  private species: SpeciesId[];

  constructor(
    type: ModifierType,
    pokemonId: number,
    stageIncrement: number,
    species: SpeciesId[],
    stackCount?: number,
  ) {
    super(type, pokemonId, stageIncrement, stackCount);

    this.species = species;
  }

  clone() {
    return new SpeciesCritBoosterModifier(
      this.type,
      this.pokemonId,
      this.stageIncrement,
      this.species,
      this.stackCount,
    );
  }

  getArgs(): any[] {
    return [...super.getArgs(), this.species];
  }

  matchType(modifier: Modifier): boolean {
    return modifier instanceof SpeciesCritBoosterModifier;
  }

  /**
   * Checks if the holder's {@linkcode SpeciesId} (or its fused species) is listed
   * in {@linkcode species}.
   * @param pokemon {@linkcode Pokemon} that holds the held item
   * @param critStage {@linkcode NumberHolder} that holds the resulting critical-hit level
   * @returns `true` if the critical-hit level can be incremented, false otherwise
   */
  override shouldApply(pokemon: Pokemon, critStage: NumberHolder): boolean {
    return (
      super.shouldApply(pokemon, critStage)
      && (this.species.includes(pokemon.getSpeciesForm(true).speciesId)
        || (pokemon.isFusion() && this.species.includes(pokemon.getFusionSpeciesForm(true).speciesId)))
    );
  }
}

/**
 * Applies Specific Type item boosts (e.g., Magnet)
 */
export class AttackTypeBoosterModifier extends PokemonHeldItemModifier {
  public moveType: PokemonType;
  private boostMultiplier: number;

  constructor(type: ModifierType, pokemonId: number, moveType: PokemonType, boostPercent: number, stackCount?: number) {
    super(type, pokemonId, stackCount);

    this.moveType = moveType;
    this.boostMultiplier = boostPercent * 0.01;
  }

  matchType(modifier: Modifier): boolean {
    if (modifier instanceof AttackTypeBoosterModifier) {
      const attackTypeBoosterModifier = modifier as AttackTypeBoosterModifier;
      return (
        attackTypeBoosterModifier.moveType === this.moveType
        && attackTypeBoosterModifier.boostMultiplier === this.boostMultiplier
      );
    }

    return false;
  }

  clone() {
    return new AttackTypeBoosterModifier(
      this.type,
      this.pokemonId,
      this.moveType,
      this.boostMultiplier * 100,
      this.stackCount,
    );
  }

  getArgs(): any[] {
    return super.getArgs().concat([this.moveType, this.boostMultiplier * 100]);
  }

  /**
   * Checks if {@linkcode AttackTypeBoosterModifier} should be applied
   * @param pokemon the {@linkcode Pokemon} that holds the held item
   * @param moveType the {@linkcode PokemonType} of the move being used
   * @param movePower the {@linkcode NumberHolder} that holds the power of the move
   * @returns `true` if boosts should be applied to the move.
   */
  override shouldApply(pokemon?: Pokemon, moveType?: PokemonType, movePower?: NumberHolder): boolean {
    return (
      super.shouldApply(pokemon, moveType, movePower)
      && typeof moveType === "number"
      && movePower instanceof NumberHolder
      && this.moveType === moveType
    );
  }

  /**
   * Applies {@linkcode AttackTypeBoosterModifier}
   * @param pokemon {@linkcode Pokemon} that holds the held item
   * @param moveType {@linkcode PokemonType} of the move being used
   * @param movePower {@linkcode NumberHolder} that holds the power of the move
   * @returns `true` if boosts have been applied to the move.
   */
  override apply(_pokemon: Pokemon, moveType: PokemonType, movePower: NumberHolder): boolean {
    if (moveType === this.moveType && movePower.value >= 1) {
      (movePower as NumberHolder).value = Math.floor(
        (movePower as NumberHolder).value * (1 + this.getStackCount() * this.boostMultiplier),
      );
      return true;
    }

    return false;
  }

  getScoreMultiplier(): number {
    return 1.2;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 99;
  }
}

export class SurviveDamageModifier extends PokemonHeldItemModifier {
  matchType(modifier: Modifier): boolean {
    return modifier instanceof SurviveDamageModifier;
  }

  clone() {
    return new SurviveDamageModifier(this.type, this.pokemonId, this.stackCount);
  }

  /**
   * Checks if the {@linkcode SurviveDamageModifier} should be applied
   * @param pokemon the {@linkcode Pokemon} that holds the item
   * @param surviveDamage {@linkcode BooleanHolder} that holds the survive damage
   * @returns `true` if the {@linkcode SurviveDamageModifier} should be applied
   */
  override shouldApply(pokemon?: Pokemon, surviveDamage?: BooleanHolder): boolean {
    return super.shouldApply(pokemon, surviveDamage) && !!surviveDamage;
  }

  /**
   * Applies {@linkcode SurviveDamageModifier}
   * @param pokemon the {@linkcode Pokemon} that holds the item
   * @param surviveDamage {@linkcode BooleanHolder} that holds the survive damage
   * @returns `true` if the survive damage has been applied
   */
  override apply(pokemon: Pokemon, surviveDamage: BooleanHolder): boolean {
    if (!surviveDamage.value && pokemon.randBattleSeedInt(10) < this.getStackCount()) {
      surviveDamage.value = true;

      globalScene.phaseManager.queueMessage(
        i18next.t("modifier:surviveDamageApply", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          typeName: this.type.name,
        }),
      );
      return true;
    }

    return false;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 5;
  }
}

export class BypassSpeedChanceModifier extends PokemonHeldItemModifier {
  matchType(modifier: Modifier) {
    return modifier instanceof BypassSpeedChanceModifier;
  }

  clone() {
    return new BypassSpeedChanceModifier(this.type, this.pokemonId, this.stackCount);
  }

  /**
   * Checks if {@linkcode BypassSpeedChanceModifier} should be applied
   * @param pokemon the {@linkcode Pokemon} that holds the item
   * @param doBypassSpeed {@linkcode BooleanHolder} that is `true` if speed should be bypassed
   * @returns `true` if {@linkcode BypassSpeedChanceModifier} should be applied
   */
  override shouldApply(pokemon?: Pokemon, doBypassSpeed?: BooleanHolder): boolean {
    return super.shouldApply(pokemon, doBypassSpeed) && !!doBypassSpeed;
  }

  /**
   * Applies {@linkcode BypassSpeedChanceModifier}
   * @param pokemon the {@linkcode Pokemon} that holds the item
   * @param doBypassSpeed {@linkcode BooleanHolder} that is `true` if speed should be bypassed
   * @returns `true` if {@linkcode BypassSpeedChanceModifier} has been applied
   */
  override apply(pokemon: Pokemon, doBypassSpeed: BooleanHolder): boolean {
    if (!doBypassSpeed.value && pokemon.randBattleSeedInt(10) < this.getStackCount()) {
      doBypassSpeed.value = true;
      const isCommandFight =
        globalScene.currentBattle.turnCommands[pokemon.getBattlerIndex()]?.command === Command.FIGHT;
      const hasQuickClaw = this.type.is("PokemonHeldItemModifierType") && this.type.id === "QUICK_CLAW";

      if (isCommandFight && hasQuickClaw) {
        globalScene.phaseManager.queueMessage(
          i18next.t("modifier:bypassSpeedChanceApply", {
            pokemonName: getPokemonNameWithAffix(pokemon),
            itemName: i18next.t("modifierType:ModifierType.QUICK_CLAW.name"),
          }),
        );
      }
      return true;
    }

    return false;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 3;
  }
}

/**
 * Class for Pokemon held items like King's Rock
 * Because King's Rock can be stacked in PokeRogue, unlike mainline, it does not receive a boost from AbilityId.SERENE_GRACE
 */
export class FlinchChanceModifier extends PokemonHeldItemModifier {
  private chance: number;
  constructor(type: ModifierType, pokemonId: number, stackCount?: number) {
    super(type, pokemonId, stackCount);

    this.chance = 10;
  }

  matchType(modifier: Modifier) {
    return modifier instanceof FlinchChanceModifier;
  }

  clone() {
    return new FlinchChanceModifier(this.type, this.pokemonId, this.stackCount);
  }

  /**
   * Checks if {@linkcode FlinchChanceModifier} should be applied
   * @param pokemon the {@linkcode Pokemon} that holds the item
   * @param flinched {@linkcode BooleanHolder} that is `true` if the pokemon flinched
   * @returns `true` if {@linkcode FlinchChanceModifier} should be applied
   */
  override shouldApply(pokemon?: Pokemon, flinched?: BooleanHolder): boolean {
    return super.shouldApply(pokemon, flinched) && !!flinched;
  }

  /**
   * Applies {@linkcode FlinchChanceModifier} to randomly flinch targets hit.
   * @param pokemon - The {@linkcode Pokemon} that holds the item
   * @param flinched - A {@linkcode BooleanHolder} holding whether the pokemon has flinched
   * @returns `true` if {@linkcode FlinchChanceModifier} was applied successfully
   */
  override apply(pokemon: Pokemon, flinched: BooleanHolder): boolean {
    // The check for pokemon.summonData is to ensure that a crash doesn't occur when a Pokemon with King's Rock procs a flinch
    // TODO: Since summonData is always defined now, we can probably remove this
    if (pokemon.summonData && !flinched.value && pokemon.randBattleSeedInt(100) < this.getStackCount() * this.chance) {
      flinched.value = true;
      return true;
    }

    return false;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 3;
  }
}

export class TurnHealModifier extends PokemonHeldItemModifier {
  matchType(modifier: Modifier) {
    return modifier instanceof TurnHealModifier;
  }

  clone() {
    return new TurnHealModifier(this.type, this.pokemonId, this.stackCount);
  }

  /**
   * Applies {@linkcode TurnHealModifier}
   * @param pokemon The {@linkcode Pokemon} that holds the item
   * @returns `true` if the {@linkcode Pokemon} was healed
   */
  override apply(pokemon: Pokemon): boolean {
    if (!pokemon.isFullHp()) {
      globalScene.phaseManager.unshiftNew(
        "PokemonHealPhase",
        pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / 16) * this.stackCount,
        i18next.t("modifier:turnHealApply", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          typeName: this.type.name,
        }),
        true,
      );
      return true;
    }

    return false;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 4;
  }
}

/**
 * Modifier used for held items, namely Toxic Orb and Flame Orb, that apply a
 * set {@linkcode StatusEffect} at the end of a turn.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class TurnStatusEffectModifier extends PokemonHeldItemModifier {
  /** The status effect to be applied by the held item */
  private effect: StatusEffect;

  constructor(type: ModifierType, pokemonId: number, stackCount?: number) {
    super(type, pokemonId, stackCount);

    switch (type.id) {
      case "TOXIC_ORB":
        this.effect = StatusEffect.TOXIC;
        break;
      case "FLAME_ORB":
        this.effect = StatusEffect.BURN;
        break;
    }
  }

  /**
   * Checks if {@linkcode modifier} is an instance of this class,
   * intentionally ignoring potentially different {@linkcode effect}s
   * to prevent held item stockpiling since the item obtained first
   * would be the only item able to {@linkcode apply} successfully.
   * @override
   * @param modifier {@linkcode Modifier} being type tested
   * @return `true` if {@linkcode modifier} is an instance of
   * TurnStatusEffectModifier, false otherwise
   */
  matchType(modifier: Modifier): boolean {
    return modifier instanceof TurnStatusEffectModifier;
  }

  clone() {
    return new TurnStatusEffectModifier(this.type, this.pokemonId, this.stackCount);
  }

  /**
   * Attempt to inflict the holder with the associated {@linkcode StatusEffect}.
   * @param pokemon - The {@linkcode Pokemon} holding the item
   * @returns `true` if the status effect was applied successfully
   */
  override apply(pokemon: Pokemon): boolean {
    return pokemon.trySetStatus(this.effect, pokemon, undefined, this.type.name);
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 1;
  }

  getStatusEffect(): StatusEffect {
    return this.effect;
  }
}

export class HitHealModifier extends PokemonHeldItemModifier {
  matchType(modifier: Modifier) {
    return modifier instanceof HitHealModifier;
  }

  clone() {
    return new HitHealModifier(this.type, this.pokemonId, this.stackCount);
  }

  /**
   * Applies {@linkcode HitHealModifier}
   * @param pokemon The {@linkcode Pokemon} that holds the item
   * @returns `true` if the {@linkcode Pokemon} was healed
   */
  override apply(pokemon: Pokemon): boolean {
    if (pokemon.turnData.totalDamageDealt && !pokemon.isFullHp()) {
      // TODO: this shouldn't be undefined AFAIK
      globalScene.phaseManager.unshiftNew(
        "PokemonHealPhase",
        pokemon.getBattlerIndex(),
        toDmgValue(pokemon.turnData.totalDamageDealt / 8) * this.stackCount,
        i18next.t("modifier:hitHealApply", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          typeName: this.type.name,
        }),
        true,
      );
    }

    return true;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 4;
  }
}

export class LevelIncrementBoosterModifier extends PersistentModifier {
  match(modifier: Modifier) {
    return modifier instanceof LevelIncrementBoosterModifier;
  }

  clone() {
    return new LevelIncrementBoosterModifier(this.type, this.stackCount);
  }

  /**
   * Checks if {@linkcode LevelIncrementBoosterModifier} should be applied
   * @param count {@linkcode NumberHolder} holding the level increment count
   * @returns `true` if {@linkcode LevelIncrementBoosterModifier} should be applied
   */
  override shouldApply(count: NumberHolder): boolean {
    return !!count;
  }

  /**
   * Applies {@linkcode LevelIncrementBoosterModifier}
   * @param count {@linkcode NumberHolder} holding the level increment count
   * @returns always `true`
   */
  override apply(count: NumberHolder): boolean {
    count.value += this.getStackCount();

    return true;
  }

  getMaxStackCount(_forThreshold?: boolean): number {
    return 99;
  }
}

export class BerryModifier extends PokemonHeldItemModifier {
  public berryType: BerryType;
  public consumed: boolean;

  constructor(type: ModifierType, pokemonId: number, berryType: BerryType, stackCount?: number) {
    super(type, pokemonId, stackCount);

    this.berryType = berryType;
    this.consumed = false;
  }

  matchType(modifier: Modifier) {
    return modifier instanceof BerryModifier && (modifier as BerryModifier).berryType === this.berryType;
  }

  clone() {
    return new BerryModifier(this.type, this.pokemonId, this.berryType, this.stackCount);
  }

  getArgs(): any[] {
    return super.getArgs().concat(this.berryType);
  }

  /**
   * Checks if {@linkcode BerryModifier} should be applied
   * @param pokemon The {@linkcode Pokemon} that holds the berry
   * @returns `true` if {@linkcode BerryModifier} should be applied
   */
  override shouldApply(pokemon: Pokemon): boolean {
    return !this.consumed && super.shouldApply(pokemon) && getBerryPredicate(this.berryType)(pokemon);
  }

  /**
   * Applies {@linkcode BerryModifier}
   * @param pokemon The {@linkcode Pokemon} that holds the berry
   * @returns always `true`
   */
  override apply(pokemon: Pokemon): boolean {
    const preserve = new BooleanHolder(false);
    globalScene.applyModifiers(PreserveBerryModifier, pokemon.isPlayer(), pokemon, preserve);
    this.consumed = !preserve.value;

    // munch the berry and trigger unburden-like effects
    getBerryEffectFunc(this.berryType)(pokemon);
    applyAbAttrs("PostItemLostAbAttr", { pokemon });

    // Update berry eaten trackers for Belch, Harvest, Cud Chew, etc.
    // Don't recover it if we proc berry pouch (no item duplication)
    pokemon.recordEatenBerry(this.berryType, this.consumed);

    return true;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    if ([BerryType.LUM, BerryType.LEPPA, BerryType.SITRUS, BerryType.ENIGMA].includes(this.berryType)) {
      return 2;
    }
    return 3;
  }
}

export class PreserveBerryModifier extends PersistentModifier {
  match(modifier: Modifier) {
    return modifier instanceof PreserveBerryModifier;
  }

  clone() {
    return new PreserveBerryModifier(this.type, this.stackCount);
  }

  /**
   * Checks if all prequired conditions are met to apply {@linkcode PreserveBerryModifier}
   * @param pokemon {@linkcode Pokemon} that holds the berry
   * @param doPreserve {@linkcode BooleanHolder} that is `true` if the berry should be preserved
   * @returns `true` if {@linkcode PreserveBerryModifier} should be applied
   */
  override shouldApply(pokemon?: Pokemon, doPreserve?: BooleanHolder): boolean {
    return !!pokemon && !!doPreserve;
  }

  /**
   * Applies {@linkcode PreserveBerryModifier}
   * @param pokemon The {@linkcode Pokemon} that holds the berry
   * @param doPreserve {@linkcode BooleanHolder} that is `true` if the berry should be preserved
   * @returns always `true`
   */
  override apply(pokemon: Pokemon, doPreserve: BooleanHolder): boolean {
    doPreserve.value ||= pokemon.randBattleSeedInt(10) < this.getStackCount() * 3;

    return true;
  }

  getMaxStackCount(): number {
    return 3;
  }
}

export class PokemonInstantReviveModifier extends PokemonHeldItemModifier {
  matchType(modifier: Modifier) {
    return modifier instanceof PokemonInstantReviveModifier;
  }

  clone() {
    return new PokemonInstantReviveModifier(this.type, this.pokemonId, this.stackCount);
  }

  /**
   * Applies {@linkcode PokemonInstantReviveModifier}
   * @param pokemon The {@linkcode Pokemon} that holds the item
   * @returns always `true`
   */
  override apply(pokemon: Pokemon): boolean {
    // Restore the Pokemon to half HP
    globalScene.phaseManager.unshiftNew(
      "PokemonHealPhase",
      pokemon.getBattlerIndex(),
      toDmgValue(pokemon.getMaxHp() / 2),
      i18next.t("modifier:pokemonInstantReviveApply", {
        pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        typeName: this.type.name,
      }),
      false,
      false,
      true,
    );

    // Remove the Pokemon's FAINT status
    pokemon.resetStatus(true, false, true, false);

    // Reapply Commander on the Pokemon's side of the field, if applicable
    const field = pokemon.isPlayer() ? globalScene.getPlayerField() : globalScene.getEnemyField();
    for (const p of field) {
      applyAbAttrs("CommanderAbAttr", { pokemon: p });
    }
    return true;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 1;
  }
}

/**
 * Modifier used for held items, namely White Herb, that restore adverse stat
 * stages in battle.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class ResetNegativeStatStageModifier extends PokemonHeldItemModifier {
  matchType(modifier: Modifier) {
    return modifier instanceof ResetNegativeStatStageModifier;
  }

  clone() {
    return new ResetNegativeStatStageModifier(this.type, this.pokemonId, this.stackCount);
  }

  /**
   * Goes through the holder's stat stages and, if any are negative, resets that
   * stat stage back to 0.
   * @param pokemon {@linkcode Pokemon} that holds the item
   * @returns `true` if any stat stages were reset, false otherwise
   */
  override apply(pokemon: Pokemon): boolean {
    let statRestored = false;

    for (const s of BATTLE_STATS) {
      if (pokemon.getStatStage(s) < 0) {
        pokemon.setStatStage(s, 0);
        statRestored = true;
      }
    }

    if (statRestored) {
      globalScene.phaseManager.queueMessage(
        i18next.t("modifier:resetNegativeStatStageApply", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          typeName: this.type.name,
        }),
      );
    }
    return statRestored;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 2;
  }
}

/**
 * Modifier used for held items, namely Mystical Rock, that extend the
 * duration of weather and terrain effects.
 * @extends PokemonHeldItemModifier
 * @see {@linkcode apply}
 */
export class FieldEffectModifier extends PokemonHeldItemModifier {
  /**
   * Provides two more turns per stack to any weather or terrain effect caused
   * by the holder.
   * @param pokemon {@linkcode Pokemon} that holds the held item
   * @param fieldDuration {@linkcode NumberHolder} that stores the current field effect duration
   * @returns `true` if the field effect extension was applied successfully
   */
  override apply(_pokemon: Pokemon, fieldDuration: NumberHolder): boolean {
    fieldDuration.value += 2 * this.stackCount;
    return true;
  }

  override matchType(modifier: Modifier): boolean {
    return modifier instanceof FieldEffectModifier;
  }

  override clone(): FieldEffectModifier {
    return new FieldEffectModifier(this.type, this.pokemonId, this.stackCount);
  }

  override getMaxHeldItemCount(_pokemon?: Pokemon): number {
    return 2;
  }
}

export abstract class ConsumablePokemonModifier extends ConsumableModifier {
  public pokemonId: number;

  constructor(type: ModifierType, pokemonId: number) {
    super(type);

    this.pokemonId = pokemonId;
  }

  /**
   * Checks if {@linkcode ConsumablePokemonModifier} should be applied
   * @param playerPokemon The {@linkcode PlayerPokemon} that consumes the item
   * @param _args N/A
   * @returns `true` if {@linkcode ConsumablePokemonModifier} should be applied
   */
  override shouldApply(playerPokemon?: PlayerPokemon, ..._args: unknown[]): boolean {
    return !!playerPokemon && (this.pokemonId === -1 || playerPokemon.id === this.pokemonId);
  }

  /**
   * Applies {@linkcode ConsumablePokemonModifier}
   * @param playerPokemon The {@linkcode PlayerPokemon} that consumes the item
   * @param args Additional arguments passed to {@linkcode ConsumablePokemonModifier.apply}
   */
  abstract override apply(playerPokemon: PlayerPokemon, ...args: unknown[]): boolean;

  getPokemon() {
    return globalScene.getPlayerParty().find(p => p.id === this.pokemonId);
  }
}

export class TerastallizeModifier extends ConsumablePokemonModifier {
  public declare type: TerastallizeModifierType;
  public teraType: PokemonType;

  constructor(type: TerastallizeModifierType, pokemonId: number, teraType: PokemonType) {
    super(type, pokemonId);

    this.teraType = teraType;
  }

  /**
   * Checks if {@linkcode TerastallizeModifier} should be applied
   * @param playerPokemon The {@linkcode PlayerPokemon} that consumes the item
   * @returns `true` if the {@linkcode TerastallizeModifier} should be applied
   */
  override shouldApply(playerPokemon?: PlayerPokemon): boolean {
    return (
      super.shouldApply(playerPokemon)
      && [playerPokemon?.species.speciesId, playerPokemon?.fusionSpecies?.speciesId].filter(
        s => s === SpeciesId.TERAPAGOS || s === SpeciesId.OGERPON || s === SpeciesId.SHEDINJA,
      ).length === 0
    );
  }

  /**
   * Applies {@linkcode TerastallizeModifier}
   * @param pokemon The {@linkcode PlayerPokemon} that consumes the item
   * @returns `true` if hp was restored
   */
  override apply(pokemon: Pokemon): boolean {
    pokemon.teraType = this.teraType;
    return true;
  }
}

export class PokemonHpRestoreModifier extends ConsumablePokemonModifier {
  private restorePoints: number;
  private restorePercent: number;
  private healStatus: boolean;
  public fainted: boolean;

  constructor(
    type: ModifierType,
    pokemonId: number,
    restorePoints: number,
    restorePercent: number,
    healStatus: boolean,
    fainted?: boolean,
  ) {
    super(type, pokemonId);

    this.restorePoints = restorePoints;
    this.restorePercent = restorePercent;
    this.healStatus = healStatus;
    this.fainted = !!fainted;
  }

  /**
   * Checks if {@linkcode PokemonHpRestoreModifier} should be applied
   * @param playerPokemon The {@linkcode PlayerPokemon} that consumes the item
   * @param multiplier The multiplier of the hp restore
   * @returns `true` if the {@linkcode PokemonHpRestoreModifier} should be applied
   */
  override shouldApply(playerPokemon?: PlayerPokemon, multiplier?: number): boolean {
    return (
      super.shouldApply(playerPokemon)
      && (this.fainted || (!isNullOrUndefined(multiplier) && typeof multiplier === "number"))
    );
  }

  /**
   * Applies {@linkcode PokemonHpRestoreModifier}
   * @param pokemon The {@linkcode PlayerPokemon} that consumes the item
   * @param multiplier The multiplier of the hp restore
   * @returns `true` if hp was restored
   */
  override apply(pokemon: Pokemon, multiplier: number): boolean {
    if (!pokemon.hp === this.fainted) {
      let restorePoints = this.restorePoints;
      if (!this.fainted) {
        restorePoints = Math.floor(restorePoints * multiplier);
      }
      if (this.fainted || this.healStatus) {
        pokemon.resetStatus(true, true, false, false);
      }
      pokemon.hp = Math.min(
        pokemon.hp
          + Math.max(
            Math.ceil(Math.max(Math.floor(this.restorePercent * 0.01 * pokemon.getMaxHp()), restorePoints)),
            1,
          ),
        pokemon.getMaxHp(),
      );
      return true;
    }
    return false;
  }
}

export class PokemonStatusHealModifier extends ConsumablePokemonModifier {
  /**
   * Applies {@linkcode PokemonStatusHealModifier}
   * @param playerPokemon The {@linkcode PlayerPokemon} that gets healed from the status
   * @returns always `true`
   */
  override apply(playerPokemon: PlayerPokemon): boolean {
    playerPokemon.resetStatus(true, true, false, false);
    return true;
  }
}

export abstract class ConsumablePokemonMoveModifier extends ConsumablePokemonModifier {
  public moveIndex: number;

  constructor(type: ModifierType, pokemonId: number, moveIndex: number) {
    super(type, pokemonId);

    this.moveIndex = moveIndex;
  }
}

export class PokemonPpRestoreModifier extends ConsumablePokemonMoveModifier {
  private restorePoints: number;

  constructor(type: ModifierType, pokemonId: number, moveIndex: number, restorePoints: number) {
    super(type, pokemonId, moveIndex);

    this.restorePoints = restorePoints;
  }

  /**
   * Applies {@linkcode PokemonPpRestoreModifier}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should get move pp restored
   * @returns always `true`
   */
  override apply(playerPokemon: PlayerPokemon): boolean {
    const move = playerPokemon.getMoveset()[this.moveIndex];

    if (move) {
      move.ppUsed = this.restorePoints > -1 ? Math.max(move.ppUsed - this.restorePoints, 0) : 0;
    }

    return true;
  }
}

export class PokemonAllMovePpRestoreModifier extends ConsumablePokemonModifier {
  private restorePoints: number;

  constructor(type: ModifierType, pokemonId: number, restorePoints: number) {
    super(type, pokemonId);

    this.restorePoints = restorePoints;
  }

  /**
   * Applies {@linkcode PokemonAllMovePpRestoreModifier}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should get all move pp restored
   * @returns always `true`
   */
  override apply(playerPokemon: PlayerPokemon): boolean {
    for (const move of playerPokemon.getMoveset()) {
      if (move) {
        move.ppUsed = this.restorePoints > -1 ? Math.max(move.ppUsed - this.restorePoints, 0) : 0;
      }
    }

    return true;
  }
}

export class PokemonPpUpModifier extends ConsumablePokemonMoveModifier {
  private upPoints: number;

  constructor(type: ModifierType, pokemonId: number, moveIndex: number, upPoints: number) {
    super(type, pokemonId, moveIndex);

    this.upPoints = upPoints;
  }

  /**
   * Applies {@linkcode PokemonPpUpModifier}
   * @param playerPokemon The {@linkcode PlayerPokemon} that gets a pp up on move-slot {@linkcode moveIndex}
   * @returns
   */
  override apply(playerPokemon: PlayerPokemon): boolean {
    const move = playerPokemon.getMoveset()[this.moveIndex];

    if (move && !move.maxPpOverride) {
      move.ppUp = Math.min(move.ppUp + this.upPoints, 3);
    }

    return true;
  }
}

export class PokemonNatureChangeModifier extends ConsumablePokemonModifier {
  public nature: Nature;

  constructor(type: ModifierType, pokemonId: number, nature: Nature) {
    super(type, pokemonId);

    this.nature = nature;
  }

  /**
   * Applies {@linkcode PokemonNatureChangeModifier}
   * @param playerPokemon {@linkcode PlayerPokemon} to apply the {@linkcode Nature} change to
   * @returns
   */
  override apply(playerPokemon: PlayerPokemon): boolean {
    playerPokemon.setCustomNature(this.nature);
    globalScene.gameData.unlockSpeciesNature(playerPokemon.species, this.nature);

    return true;
  }
}

export class PokemonLevelIncrementModifier extends ConsumablePokemonModifier {
  /**
   * Applies {@linkcode PokemonLevelIncrementModifier}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should get levels incremented
   * @param levelCount The amount of levels to increment
   * @returns always `true`
   */
  override apply(playerPokemon: PlayerPokemon, levelCount: NumberHolder = new NumberHolder(1)): boolean {
    globalScene.applyModifiers(LevelIncrementBoosterModifier, true, levelCount);

    playerPokemon.level += levelCount.value;
    if (playerPokemon.level <= globalScene.getMaxExpLevel(true)) {
      playerPokemon.exp = getLevelTotalExp(playerPokemon.level, playerPokemon.species.growthRate);
      playerPokemon.levelExp = 0;
    }

    playerPokemon.addFriendship(FRIENDSHIP_GAIN_FROM_RARE_CANDY, true);

    globalScene.phaseManager.unshiftNew(
      "LevelUpPhase",
      globalScene.getPlayerParty().indexOf(playerPokemon),
      playerPokemon.level - levelCount.value,
      playerPokemon.level,
    );

    return true;
  }
}

export class TmModifier extends ConsumablePokemonModifier {
  public declare type: TmModifierType;

  /**
   * Applies {@linkcode TmModifier}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should learn the TM
   * @returns always `true`
   */
  override apply(playerPokemon: PlayerPokemon): boolean {
    globalScene.phaseManager.unshiftNew(
      "LearnMovePhase",
      globalScene.getPlayerParty().indexOf(playerPokemon),
      this.type.moveId,
      LearnMoveType.TM,
    );

    return true;
  }
}

export class RememberMoveModifier extends ConsumablePokemonModifier {
  public levelMoveIndex: number;

  constructor(type: ModifierType, pokemonId: number, levelMoveIndex: number) {
    super(type, pokemonId);

    this.levelMoveIndex = levelMoveIndex;
  }

  /**
   * Applies {@linkcode RememberMoveModifier}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should remember the move
   * @returns always `true`
   */
  override apply(playerPokemon: PlayerPokemon, cost?: number): boolean {
    globalScene.phaseManager.unshiftNew(
      "LearnMovePhase",
      globalScene.getPlayerParty().indexOf(playerPokemon),
      playerPokemon.getLearnableLevelMoves()[this.levelMoveIndex],
      LearnMoveType.MEMORY,
      cost,
    );

    return true;
  }
}

export class EvolutionItemModifier extends ConsumablePokemonModifier {
  public declare type: EvolutionItemModifierType;
  /**
   * Applies {@linkcode EvolutionItemModifier}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should evolve via item
   * @returns `true` if the evolution was successful
   */
  override apply(playerPokemon: PlayerPokemon): boolean {
    let matchingEvolution = pokemonEvolutions.hasOwnProperty(playerPokemon.species.speciesId)
      ? pokemonEvolutions[playerPokemon.species.speciesId].find(
          e => e.evoItem === this.type.evolutionItem && e.validate(playerPokemon, false, e.item!),
        )
      : null;

    if (!matchingEvolution && playerPokemon.isFusion()) {
      matchingEvolution = pokemonEvolutions[playerPokemon.fusionSpecies!.speciesId].find(
        e => e.evoItem === this.type.evolutionItem && e.validate(playerPokemon, true, e.item!),
      );
      if (matchingEvolution) {
        matchingEvolution = new FusionSpeciesFormEvolution(playerPokemon.species.speciesId, matchingEvolution);
      }
    }

    if (matchingEvolution) {
      globalScene.phaseManager.unshiftNew("EvolutionPhase", playerPokemon, matchingEvolution, playerPokemon.level - 1);
      return true;
    }

    return false;
  }
}

export class FusePokemonModifier extends ConsumablePokemonModifier {
  public fusePokemonId: number;

  constructor(type: ModifierType, pokemonId: number, fusePokemonId: number) {
    super(type, pokemonId);

    this.fusePokemonId = fusePokemonId;
  }

  /**
   * Checks if {@linkcode FusePokemonModifier} should be applied
   * @param playerPokemon {@linkcode PlayerPokemon} that should be fused
   * @param playerPokemon2 {@linkcode PlayerPokemon} that should be fused with {@linkcode playerPokemon}
   * @returns `true` if {@linkcode FusePokemonModifier} should be applied
   */
  override shouldApply(playerPokemon?: PlayerPokemon, playerPokemon2?: PlayerPokemon): boolean {
    return (
      super.shouldApply(playerPokemon, playerPokemon2) && !!playerPokemon2 && this.fusePokemonId === playerPokemon2.id
    );
  }

  /**
   * Applies {@linkcode FusePokemonModifier}
   * @param playerPokemon {@linkcode PlayerPokemon} that should be fused
   * @param playerPokemon2 {@linkcode PlayerPokemon} that should be fused with {@linkcode playerPokemon}
   * @returns always Promise<true>
   */
  override apply(playerPokemon: PlayerPokemon, playerPokemon2: PlayerPokemon): boolean {
    playerPokemon.fuse(playerPokemon2);
    return true;
  }
}

export class MultipleParticipantExpBonusModifier extends PersistentModifier {
  match(modifier: Modifier): boolean {
    return modifier instanceof MultipleParticipantExpBonusModifier;
  }

  /**
   * Applies {@linkcode MultipleParticipantExpBonusModifier}
   * @returns always `true`
   */
  apply(): boolean {
    return true;
  }

  clone(): MultipleParticipantExpBonusModifier {
    return new MultipleParticipantExpBonusModifier(this.type, this.stackCount);
  }

  getMaxStackCount(): number {
    return 5;
  }
}

export class HealingBoosterModifier extends PersistentModifier {
  private multiplier: number;

  constructor(type: ModifierType, multiplier: number, stackCount?: number) {
    super(type, stackCount);

    this.multiplier = multiplier;
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof HealingBoosterModifier;
  }

  clone(): HealingBoosterModifier {
    return new HealingBoosterModifier(this.type, this.multiplier, this.stackCount);
  }

  getArgs(): any[] {
    return [this.multiplier];
  }

  /**
   * Applies {@linkcode HealingBoosterModifier}
   * @param healingMultiplier the multiplier to apply to the healing
   * @returns always `true`
   */
  override apply(healingMultiplier: NumberHolder): boolean {
    healingMultiplier.value *= 1 + (this.multiplier - 1) * this.getStackCount();

    return true;
  }

  getMaxStackCount(): number {
    return 5;
  }
}

export class ExpBoosterModifier extends PersistentModifier {
  private boostMultiplier: number;

  constructor(type: ModifierType, boostPercent: number, stackCount?: number) {
    super(type, stackCount);

    this.boostMultiplier = boostPercent * 0.01;
  }

  match(modifier: Modifier): boolean {
    if (modifier instanceof ExpBoosterModifier) {
      const expModifier = modifier as ExpBoosterModifier;
      return expModifier.boostMultiplier === this.boostMultiplier;
    }
    return false;
  }

  clone(): ExpBoosterModifier {
    return new ExpBoosterModifier(this.type, this.boostMultiplier * 100, this.stackCount);
  }

  getArgs(): any[] {
    return [this.boostMultiplier * 100];
  }

  /**
   * Applies {@linkcode ExpBoosterModifier}
   * @param boost {@linkcode NumberHolder} holding the boost value
   * @returns always `true`
   */
  override apply(boost: NumberHolder): boolean {
    boost.value = Math.floor(boost.value * (1 + this.getStackCount() * this.boostMultiplier));

    return true;
  }

  getMaxStackCount(_forThreshold?: boolean): number {
    return this.boostMultiplier < 1 ? (this.boostMultiplier < 0.6 ? 99 : 30) : 10;
  }
}

export class PokemonExpBoosterModifier extends PokemonHeldItemModifier {
  public declare type: PokemonExpBoosterModifierType;

  private boostMultiplier: number;

  constructor(type: PokemonExpBoosterModifierType, pokemonId: number, boostPercent: number, stackCount?: number) {
    super(type, pokemonId, stackCount);
    this.boostMultiplier = boostPercent * 0.01;
  }

  matchType(modifier: Modifier): boolean {
    if (modifier instanceof PokemonExpBoosterModifier) {
      const pokemonExpModifier = modifier as PokemonExpBoosterModifier;
      return pokemonExpModifier.boostMultiplier === this.boostMultiplier;
    }
    return false;
  }

  clone(): PersistentModifier {
    return new PokemonExpBoosterModifier(this.type, this.pokemonId, this.boostMultiplier * 100, this.stackCount);
  }

  getArgs(): any[] {
    return super.getArgs().concat(this.boostMultiplier * 100);
  }

  /**
   * Checks if {@linkcode PokemonExpBoosterModifier} should be applied
   * @param pokemon The {@linkcode Pokemon} to apply the exp boost to
   * @param boost {@linkcode NumberHolder} holding the exp boost value
   * @returns `true` if {@linkcode PokemonExpBoosterModifier} should be applied
   */
  override shouldApply(pokemon: Pokemon, boost: NumberHolder): boolean {
    return super.shouldApply(pokemon, boost) && !!boost;
  }

  /**
   * Applies {@linkcode PokemonExpBoosterModifier}
   * @param _pokemon The {@linkcode Pokemon} to apply the exp boost to
   * @param boost {@linkcode NumberHolder} holding the exp boost value
   * @returns always `true`
   */
  override apply(_pokemon: Pokemon, boost: NumberHolder): boolean {
    boost.value = Math.floor(boost.value * (1 + this.getStackCount() * this.boostMultiplier));

    return true;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 99;
  }
}

export class ExpShareModifier extends PersistentModifier {
  match(modifier: Modifier): boolean {
    return modifier instanceof ExpShareModifier;
  }

  clone(): ExpShareModifier {
    return new ExpShareModifier(this.type, this.stackCount);
  }

  /**
   * Applies {@linkcode ExpShareModifier}
   * @returns always `true`
   */
  override apply(): boolean {
    return true;
  }

  getMaxStackCount(): number {
    return 5;
  }
}

export class ExpBalanceModifier extends PersistentModifier {
  match(modifier: Modifier): boolean {
    return modifier instanceof ExpBalanceModifier;
  }

  clone(): ExpBalanceModifier {
    return new ExpBalanceModifier(this.type, this.stackCount);
  }

  /**
   * Applies {@linkcode ExpBalanceModifier}
   * @returns always `true`
   */
  override apply(): boolean {
    return true;
  }

  getMaxStackCount(): number {
    return 4;
  }
}

export class PokemonFriendshipBoosterModifier extends PokemonHeldItemModifier {
  public declare type: PokemonFriendshipBoosterModifierType;

  matchType(modifier: Modifier): boolean {
    return modifier instanceof PokemonFriendshipBoosterModifier;
  }

  clone(): PersistentModifier {
    return new PokemonFriendshipBoosterModifier(this.type, this.pokemonId, this.stackCount);
  }

  /**
   * Applies {@linkcode PokemonFriendshipBoosterModifier}
   * @param _pokemon The {@linkcode Pokemon} to apply the friendship boost to
   * @param friendship {@linkcode NumberHolder} holding the friendship boost value
   * @returns always `true`
   */
  override apply(_pokemon: Pokemon, friendship: NumberHolder): boolean {
    friendship.value = Math.floor(friendship.value * (1 + 0.5 * this.getStackCount()));

    return true;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 3;
  }
}

export class PokemonNatureWeightModifier extends PokemonHeldItemModifier {
  matchType(modifier: Modifier): boolean {
    return modifier instanceof PokemonNatureWeightModifier;
  }

  clone(): PersistentModifier {
    return new PokemonNatureWeightModifier(this.type, this.pokemonId, this.stackCount);
  }

  /**
   * Applies {@linkcode PokemonNatureWeightModifier}
   * @param _pokemon The {@linkcode Pokemon} to apply the nature weight to
   * @param multiplier {@linkcode NumberHolder} holding the nature weight
   * @returns `true` if multiplier was applied
   */
  override apply(_pokemon: Pokemon, multiplier: NumberHolder): boolean {
    if (multiplier.value !== 1) {
      multiplier.value += 0.1 * this.getStackCount() * (multiplier.value > 1 ? 1 : -1);
      return true;
    }

    return false;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 10;
  }
}

export class PokemonMoveAccuracyBoosterModifier extends PokemonHeldItemModifier {
  public declare type: PokemonMoveAccuracyBoosterModifierType;
  private accuracyAmount: number;

  constructor(type: PokemonMoveAccuracyBoosterModifierType, pokemonId: number, accuracy: number, stackCount?: number) {
    super(type, pokemonId, stackCount);
    this.accuracyAmount = accuracy;
  }

  matchType(modifier: Modifier): boolean {
    if (modifier instanceof PokemonMoveAccuracyBoosterModifier) {
      const pokemonAccuracyBoosterModifier = modifier as PokemonMoveAccuracyBoosterModifier;
      return pokemonAccuracyBoosterModifier.accuracyAmount === this.accuracyAmount;
    }
    return false;
  }

  clone(): PersistentModifier {
    return new PokemonMoveAccuracyBoosterModifier(this.type, this.pokemonId, this.accuracyAmount, this.stackCount);
  }

  getArgs(): any[] {
    return super.getArgs().concat(this.accuracyAmount);
  }

  /**
   * Checks if {@linkcode PokemonMoveAccuracyBoosterModifier} should be applied
   * @param pokemon The {@linkcode Pokemon} to apply the move accuracy boost to
   * @param moveAccuracy {@linkcode NumberHolder} holding the move accuracy boost
   * @returns `true` if {@linkcode PokemonMoveAccuracyBoosterModifier} should be applied
   */
  override shouldApply(pokemon?: Pokemon, moveAccuracy?: NumberHolder): boolean {
    return super.shouldApply(pokemon, moveAccuracy) && !!moveAccuracy;
  }

  /**
   * Applies {@linkcode PokemonMoveAccuracyBoosterModifier}
   * @param _pokemon The {@linkcode Pokemon} to apply the move accuracy boost to
   * @param moveAccuracy {@linkcode NumberHolder} holding the move accuracy boost
   * @returns always `true`
   */
  override apply(_pokemon: Pokemon, moveAccuracy: NumberHolder): boolean {
    moveAccuracy.value = moveAccuracy.value + this.accuracyAmount * this.getStackCount();

    return true;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 3;
  }
}

export class PokemonMultiHitModifier extends PokemonHeldItemModifier {
  public declare type: PokemonMultiHitModifierType;

  matchType(modifier: Modifier): boolean {
    return modifier instanceof PokemonMultiHitModifier;
  }

  clone(): PersistentModifier {
    return new PokemonMultiHitModifier(this.type, this.pokemonId, this.stackCount);
  }

  /**
   * For each stack, converts 25 percent of attack damage into an additional strike.
   * @param pokemon The {@linkcode Pokemon} using the move
   * @param moveId The {@linkcode MoveId | identifier} for the move being used
   * @param count {@linkcode NumberHolder} holding the move's hit count for this turn
   * @param damageMultiplier {@linkcode NumberHolder} holding a damage multiplier applied to a strike of this move
   * @returns always `true`
   */
  override apply(
    pokemon: Pokemon,
    moveId: MoveId,
    count: NumberHolder | null = null,
    damageMultiplier: NumberHolder | null = null,
  ): boolean {
    const move = allMoves[moveId];
    /**
     * The move must meet Parental Bond's restrictions for this item
     * to apply. This means
     * - Only attacks are boosted
     * - Multi-strike moves, charge moves, and self-sacrificial moves are not boosted
     *   (though Multi-Lens can still affect moves boosted by Parental Bond)
     * - Multi-target moves are not boosted *unless* they can only hit a single Pokemon
     * - Fling, Uproar, Rollout, Ice Ball, and Endeavor are not boosted
     */
    if (!move.canBeMultiStrikeEnhanced(pokemon)) {
      return false;
    }

    if (!isNullOrUndefined(count)) {
      return this.applyHitCountBoost(count);
    }
    if (!isNullOrUndefined(damageMultiplier)) {
      return this.applyDamageModifier(pokemon, damageMultiplier);
    }

    return false;
  }

  /** Adds strikes to a move equal to the number of stacked Multi-Lenses */
  private applyHitCountBoost(count: NumberHolder): boolean {
    count.value += this.getStackCount();
    return true;
  }

  /**
   * If applied to the first hit of a move, sets the damage multiplier
   * equal to (1 - the number of stacked Multi-Lenses).
   * Additional strikes beyond that are given a 0.25x damage multiplier
   */
  private applyDamageModifier(pokemon: Pokemon, damageMultiplier: NumberHolder): boolean {
    if (pokemon.turnData.hitsLeft === pokemon.turnData.hitCount) {
      // Reduce first hit by 25% for each stack count
      damageMultiplier.value *= 1 - 0.25 * this.getStackCount();
      return true;
    }

    if (pokemon.turnData.hitCount - pokemon.turnData.hitsLeft !== this.getStackCount() + 1) {
      // Deal 25% damage for each remaining Multi Lens hit
      damageMultiplier.value *= 0.25;
      return true;
    }
    // An extra hit not caused by Multi Lens -- assume it is Parental Bond
    return false;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 2;
  }
}

export class PokemonFormChangeItemModifier extends PokemonHeldItemModifier {
  public declare type: FormChangeItemModifierType;
  public formChangeItem: FormChangeItem;
  public active: boolean;
  public isTransferable = false;

  constructor(
    type: FormChangeItemModifierType,
    pokemonId: number,
    formChangeItem: FormChangeItem,
    active: boolean,
    stackCount?: number,
  ) {
    super(type, pokemonId, stackCount);
    this.formChangeItem = formChangeItem;
    this.active = active;
  }

  matchType(modifier: Modifier): boolean {
    return modifier instanceof PokemonFormChangeItemModifier && modifier.formChangeItem === this.formChangeItem;
  }

  clone(): PersistentModifier {
    return new PokemonFormChangeItemModifier(
      this.type,
      this.pokemonId,
      this.formChangeItem,
      this.active,
      this.stackCount,
    );
  }

  getArgs(): any[] {
    return super.getArgs().concat(this.formChangeItem, this.active);
  }

  /**
   * Applies {@linkcode PokemonFormChangeItemModifier}
   * @param pokemon The {@linkcode Pokemon} to apply the form change item to
   * @param active `true` if the form change item is active
   * @returns `true` if the form change item was applied
   */
  override apply(pokemon: Pokemon, active: boolean): boolean {
    const switchActive = this.active && !active;

    if (switchActive) {
      this.active = false;
    }

    const ret = globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeItemTrigger);

    if (switchActive) {
      this.active = true;
    }

    return ret;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 1;
  }
}

export class MoneyRewardModifier extends ConsumableModifier {
  private moneyMultiplier: number;

  constructor(type: ModifierType, moneyMultiplier: number) {
    super(type);

    this.moneyMultiplier = moneyMultiplier;
  }

  /**
   * Applies {@linkcode MoneyRewardModifier}
   * @returns always `true`
   */
  override apply(): boolean {
    const moneyAmount = new NumberHolder(globalScene.getWaveMoneyAmount(this.moneyMultiplier));

    globalScene.applyModifiers(MoneyMultiplierModifier, true, moneyAmount);

    globalScene.addMoney(moneyAmount.value);

    globalScene.getPlayerParty().map(p => {
      if (p.species?.speciesId === SpeciesId.GIMMIGHOUL || p.fusionSpecies?.speciesId === SpeciesId.GIMMIGHOUL) {
        const factor = Math.min(Math.floor(this.moneyMultiplier), 3);
        const modifier = getModifierType(modifierTypes.EVOLUTION_TRACKER_GIMMIGHOUL).newModifier(
          p,
          factor,
        ) as EvoTrackerModifier;
        globalScene.addModifier(modifier);
      }
    });

    return true;
  }
}

export class MoneyMultiplierModifier extends PersistentModifier {
  match(modifier: Modifier): boolean {
    return modifier instanceof MoneyMultiplierModifier;
  }

  clone(): MoneyMultiplierModifier {
    return new MoneyMultiplierModifier(this.type, this.stackCount);
  }

  /**
   * Applies {@linkcode MoneyMultiplierModifier}
   * @param multiplier {@linkcode NumberHolder} holding the money multiplier value
   * @returns always `true`
   */
  override apply(multiplier: NumberHolder): boolean {
    multiplier.value += Math.floor(multiplier.value * 0.2 * this.getStackCount());

    return true;
  }

  getMaxStackCount(): number {
    return 5;
  }
}

export class DamageMoneyRewardModifier extends PokemonHeldItemModifier {
  matchType(modifier: Modifier): boolean {
    return modifier instanceof DamageMoneyRewardModifier;
  }

  clone(): DamageMoneyRewardModifier {
    return new DamageMoneyRewardModifier(this.type, this.pokemonId, this.stackCount);
  }

  /**
   * Applies {@linkcode DamageMoneyRewardModifier}
   * @param pokemon The {@linkcode Pokemon} attacking
   * @param multiplier {@linkcode NumberHolder} holding the multiplier value
   * @returns always `true`
   */
  override apply(_pokemon: Pokemon, multiplier: NumberHolder): boolean {
    const moneyAmount = new NumberHolder(Math.floor(multiplier.value * (0.5 * this.getStackCount())));
    globalScene.applyModifiers(MoneyMultiplierModifier, true, moneyAmount);
    globalScene.addMoney(moneyAmount.value);

    return true;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 5;
  }
}

export class MoneyInterestModifier extends PersistentModifier {
  match(modifier: Modifier): boolean {
    return modifier instanceof MoneyInterestModifier;
  }

  /**
   * Applies {@linkcode MoneyInterestModifier}
   * @returns always `true`
   */
  override apply(): boolean {
    const interestAmount = Math.floor(globalScene.money * 0.1 * this.getStackCount());
    globalScene.addMoney(interestAmount);

    const userLocale = navigator.language || "en-US";
    const formattedMoneyAmount = interestAmount.toLocaleString(userLocale);
    const message = i18next.t("modifier:moneyInterestApply", {
      moneyAmount: formattedMoneyAmount,
      typeName: this.type.name,
    });
    globalScene.phaseManager.queueMessage(message, undefined, true);

    return true;
  }

  clone(): MoneyInterestModifier {
    return new MoneyInterestModifier(this.type, this.stackCount);
  }

  getMaxStackCount(): number {
    return 5;
  }
}

export class HiddenAbilityRateBoosterModifier extends PersistentModifier {
  match(modifier: Modifier): boolean {
    return modifier instanceof HiddenAbilityRateBoosterModifier;
  }

  clone(): HiddenAbilityRateBoosterModifier {
    return new HiddenAbilityRateBoosterModifier(this.type, this.stackCount);
  }

  /**
   * Applies {@linkcode HiddenAbilityRateBoosterModifier}
   * @param boost {@linkcode NumberHolder} holding the boost value
   * @returns always `true`
   */
  override apply(boost: NumberHolder): boolean {
    boost.value *= Math.pow(2, -1 - this.getStackCount());

    return true;
  }

  getMaxStackCount(): number {
    return 4;
  }
}

export class ShinyRateBoosterModifier extends PersistentModifier {
  match(modifier: Modifier): boolean {
    return modifier instanceof ShinyRateBoosterModifier;
  }

  clone(): ShinyRateBoosterModifier {
    return new ShinyRateBoosterModifier(this.type, this.stackCount);
  }

  /**
   * Applies {@linkcode ShinyRateBoosterModifier}
   * @param boost {@linkcode NumberHolder} holding the boost value
   * @returns always `true`
   */
  override apply(boost: NumberHolder): boolean {
    boost.value *= Math.pow(2, 1 + this.getStackCount());

    return true;
  }

  getMaxStackCount(): number {
    return 4;
  }
}

export class CriticalCatchChanceBoosterModifier extends PersistentModifier {
  match(modifier: Modifier): boolean {
    return modifier instanceof CriticalCatchChanceBoosterModifier;
  }

  clone(): CriticalCatchChanceBoosterModifier {
    return new CriticalCatchChanceBoosterModifier(this.type, this.stackCount);
  }

  /**
   * Applies {@linkcode CriticalCatchChanceBoosterModifier}
   * @param boost {@linkcode NumberHolder} holding the boost value
   * @returns always `true`
   */
  override apply(boost: NumberHolder): boolean {
    // 1 stack: 2x
    // 2 stack: 2.5x
    // 3 stack: 3x
    boost.value *= 1.5 + this.getStackCount() / 2;

    return true;
  }

  getMaxStackCount(): number {
    return 3;
  }
}

export class LockModifierTiersModifier extends PersistentModifier {
  match(modifier: Modifier): boolean {
    return modifier instanceof LockModifierTiersModifier;
  }

  /**
   * Applies {@linkcode LockModifierTiersModifier}
   * @returns always `true`
   */
  override apply(): boolean {
    return true;
  }

  clone(): LockModifierTiersModifier {
    return new LockModifierTiersModifier(this.type, this.stackCount);
  }

  getMaxStackCount(): number {
    return 1;
  }
}

/**
 * Black Sludge item
 */
export class HealShopCostModifier extends PersistentModifier {
  public readonly shopMultiplier: number;

  constructor(type: ModifierType, shopMultiplier: number, stackCount?: number) {
    super(type, stackCount);

    this.shopMultiplier = shopMultiplier ?? 2.5;
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof HealShopCostModifier;
  }

  clone(): HealShopCostModifier {
    return new HealShopCostModifier(this.type, this.shopMultiplier, this.stackCount);
  }

  /**
   * Applies {@linkcode HealShopCostModifier}
   * @param cost {@linkcode NumberHolder} holding the heal shop cost
   * @returns always `true`
   */
  apply(moneyCost: NumberHolder): boolean {
    moneyCost.value = Math.floor(moneyCost.value * this.shopMultiplier);

    return true;
  }

  getArgs(): any[] {
    return super.getArgs().concat(this.shopMultiplier);
  }

  getMaxStackCount(): number {
    return 1;
  }
}

export class BoostBugSpawnModifier extends PersistentModifier {
  match(modifier: Modifier): boolean {
    return modifier instanceof BoostBugSpawnModifier;
  }

  clone(): BoostBugSpawnModifier {
    return new BoostBugSpawnModifier(this.type, this.stackCount);
  }

  /**
   * Applies {@linkcode BoostBugSpawnModifier}
   * @returns always `true`
   */
  override apply(): boolean {
    return true;
  }

  getMaxStackCount(): number {
    return 1;
  }
}

export class SwitchEffectTransferModifier extends PokemonHeldItemModifier {
  matchType(modifier: Modifier): boolean {
    return modifier instanceof SwitchEffectTransferModifier;
  }

  clone(): SwitchEffectTransferModifier {
    return new SwitchEffectTransferModifier(this.type, this.pokemonId, this.stackCount);
  }

  /**
   * Applies {@linkcode SwitchEffectTransferModifier}
   * @returns always `true`
   */
  override apply(): boolean {
    return true;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 1;
  }
}

/**
 * Abstract class for held items that steal other Pokemon's items.
 * @see {@linkcode TurnHeldItemTransferModifier}
 * @see {@linkcode ContactHeldItemTransferChanceModifier}
 */
export abstract class HeldItemTransferModifier extends PokemonHeldItemModifier {
  /**
   * Determines the targets to transfer items from when this applies.
   * @param pokemon the {@linkcode Pokemon} holding this item
   * @param _args N/A
   * @returns the opponents of the source {@linkcode Pokemon}
   */
  getTargets(pokemon?: Pokemon, ..._args: unknown[]): Pokemon[] {
    return pokemon?.getOpponents?.() ?? [];
  }

  /**
   * Steals an item, chosen randomly, from a set of target Pokemon.
   * @param pokemon The {@linkcode Pokemon} holding this item
   * @param target The {@linkcode Pokemon} to steal from (optional)
   * @param _args N/A
   * @returns `true` if an item was stolen; false otherwise.
   */
  override apply(pokemon: Pokemon, target?: Pokemon, ..._args: unknown[]): boolean {
    const opponents = this.getTargets(pokemon, target);

    if (opponents.length === 0) {
      return false;
    }

    const targetPokemon = opponents[pokemon.randBattleSeedInt(opponents.length)];

    const transferredItemCount = this.getTransferredItemCount();
    if (!transferredItemCount) {
      return false;
    }

    const transferredModifierTypes: ModifierType[] = [];
    const itemModifiers = globalScene.findModifiers(
      m => m instanceof PokemonHeldItemModifier && m.pokemonId === targetPokemon.id && m.isTransferable,
      targetPokemon.isPlayer(),
    ) as PokemonHeldItemModifier[];

    for (let i = 0; i < transferredItemCount; i++) {
      if (itemModifiers.length === 0) {
        break;
      }
      const randItemIndex = pokemon.randBattleSeedInt(itemModifiers.length);
      const randItem = itemModifiers[randItemIndex];
      if (globalScene.tryTransferHeldItemModifier(randItem, pokemon, false)) {
        transferredModifierTypes.push(randItem.type);
        itemModifiers.splice(randItemIndex, 1);
      }
    }

    for (const mt of transferredModifierTypes) {
      globalScene.phaseManager.queueMessage(this.getTransferMessage(pokemon, targetPokemon, mt));
    }

    return transferredModifierTypes.length > 0;
  }

  abstract getTransferredItemCount(): number;

  abstract getTransferMessage(pokemon: Pokemon, targetPokemon: Pokemon, item: ModifierType): string;
}

/**
 * Modifier for held items that steal items from the enemy at the end of
 * each turn.
 * @see {@linkcode modifierTypes[MINI_BLACK_HOLE]}
 */
export class TurnHeldItemTransferModifier extends HeldItemTransferModifier {
  isTransferable = true;

  matchType(modifier: Modifier): boolean {
    return modifier instanceof TurnHeldItemTransferModifier;
  }

  clone(): TurnHeldItemTransferModifier {
    return new TurnHeldItemTransferModifier(this.type, this.pokemonId, this.stackCount);
  }

  getTransferredItemCount(): number {
    return this.getStackCount();
  }

  getTransferMessage(pokemon: Pokemon, targetPokemon: Pokemon, item: ModifierType): string {
    return i18next.t("modifier:turnHeldItemTransferApply", {
      pokemonNameWithAffix: getPokemonNameWithAffix(targetPokemon),
      itemName: item.name,
      pokemonName: pokemon.getNameToRender(),
      typeName: this.type.name,
    });
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 1;
  }

  setTransferrableFalse(): void {
    this.isTransferable = false;
  }
}

/**
 * Modifier for held items that add a chance to steal items from the target of a
 * successful attack.
 * @see {@linkcode modifierTypes[GRIP_CLAW]}
 * @see {@linkcode HeldItemTransferModifier}
 */
export class ContactHeldItemTransferChanceModifier extends HeldItemTransferModifier {
  public readonly chance: number;

  constructor(type: ModifierType, pokemonId: number, chancePercent: number, stackCount?: number) {
    super(type, pokemonId, stackCount);

    this.chance = chancePercent / 100;
  }

  /**
   * Determines the target to steal items from when this applies.
   * @param _holderPokemon The {@linkcode Pokemon} holding this item
   * @param targetPokemon The {@linkcode Pokemon} the holder is targeting with an attack
   * @returns The target {@linkcode Pokemon} as array for further use in `apply` implementations
   */
  override getTargets(_holderPokemon: Pokemon, targetPokemon: Pokemon): Pokemon[] {
    return targetPokemon ? [targetPokemon] : [];
  }

  matchType(modifier: Modifier): boolean {
    return modifier instanceof ContactHeldItemTransferChanceModifier;
  }

  clone(): ContactHeldItemTransferChanceModifier {
    return new ContactHeldItemTransferChanceModifier(this.type, this.pokemonId, this.chance * 100, this.stackCount);
  }

  getArgs(): any[] {
    return super.getArgs().concat(this.chance * 100);
  }

  getTransferredItemCount(): number {
    return randSeedFloat() <= this.chance * this.getStackCount() ? 1 : 0;
  }

  getTransferMessage(pokemon: Pokemon, targetPokemon: Pokemon, item: ModifierType): string {
    return i18next.t("modifier:contactHeldItemTransferApply", {
      pokemonNameWithAffix: getPokemonNameWithAffix(targetPokemon),
      itemName: item.name,
      pokemonName: getPokemonNameWithAffix(pokemon),
      typeName: this.type.name,
    });
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 5;
  }
}

export class IvScannerModifier extends PersistentModifier {
  constructor(type: ModifierType, _stackCount?: number) {
    super(type);
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof IvScannerModifier;
  }

  clone(): IvScannerModifier {
    return new IvScannerModifier(this.type);
  }

  /**
   * Applies {@linkcode IvScannerModifier}
   * @returns always `true`
   */
  override apply(): boolean {
    return true; //Dude are you kidding me
  }

  getMaxStackCount(): number {
    return 1;
  }
}

export class ExtraModifierModifier extends PersistentModifier {
  match(modifier: Modifier): boolean {
    return modifier instanceof ExtraModifierModifier;
  }

  clone(): ExtraModifierModifier {
    return new ExtraModifierModifier(this.type, this.stackCount);
  }

  /**
   * Applies {@linkcode ExtraModifierModifier}
   * @param count {NumberHolder} holding the count value
   * @returns always `true`
   */
  override apply(count: NumberHolder): boolean {
    count.value += this.getStackCount();

    return true;
  }

  getMaxStackCount(): number {
    return 3;
  }
}

/**
 * Modifier used for timed boosts to the player's shop item rewards.
 * @extends LapsingPersistentModifier
 * @see {@linkcode apply}
 */
export class TempExtraModifierModifier extends LapsingPersistentModifier {
  /**
   * Goes through existing modifiers for any that match Silver Pokeball,
   * which will then add the max count of the new item to the existing count of the current item.
   * If no existing Silver Pokeballs are found, will add a new one.
   * @param modifiers {@linkcode PersistentModifier} array of the player's modifiers
   * @param _virtual N/A
   * @returns true if the modifier was successfully added or applied, false otherwise
   */
  add(modifiers: PersistentModifier[], _virtual: boolean): boolean {
    for (const modifier of modifiers) {
      if (this.match(modifier)) {
        const modifierInstance = modifier as TempExtraModifierModifier;
        const newBattleCount = this.getMaxBattles() + modifierInstance.getBattleCount();

        modifierInstance.setNewBattleCount(newBattleCount);
        globalScene.playSound("se/restore");
        return true;
      }
    }

    modifiers.push(this);
    return true;
  }

  clone() {
    return new TempExtraModifierModifier(this.type, this.getMaxBattles(), this.getBattleCount(), this.stackCount);
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof TempExtraModifierModifier;
  }

  /**
   * Increases the current rewards in the battle by the `stackCount`.
   * @returns `true` if the shop reward number modifier applies successfully
   * @param count {@linkcode NumberHolder} that holds the resulting shop item reward count
   */
  apply(count: NumberHolder): boolean {
    count.value += this.getStackCount();
    return true;
  }
}

export abstract class EnemyPersistentModifier extends PersistentModifier {
  getMaxStackCount(): number {
    return 5;
  }
}

abstract class EnemyDamageMultiplierModifier extends EnemyPersistentModifier {
  protected damageMultiplier: number;

  constructor(type: ModifierType, damageMultiplier: number, stackCount?: number) {
    super(type, stackCount);

    this.damageMultiplier = damageMultiplier;
  }

  /**
   * Applies {@linkcode EnemyDamageMultiplierModifier}
   * @param multiplier {NumberHolder} holding the multiplier value
   * @returns always `true`
   */
  override apply(multiplier: NumberHolder): boolean {
    multiplier.value = toDmgValue(multiplier.value * Math.pow(this.damageMultiplier, this.getStackCount()));

    return true;
  }

  getMaxStackCount(): number {
    return 99;
  }
}

export class EnemyDamageBoosterModifier extends EnemyDamageMultiplierModifier {
  constructor(type: ModifierType, _boostPercent: number, stackCount?: number) {
    //super(type, 1 + ((boostPercent || 10) * 0.01), stackCount);
    super(type, 1.05, stackCount); // Hardcode multiplier temporarily
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof EnemyDamageBoosterModifier;
  }

  clone(): EnemyDamageBoosterModifier {
    return new EnemyDamageBoosterModifier(this.type, (this.damageMultiplier - 1) * 100, this.stackCount);
  }

  getArgs(): any[] {
    return [(this.damageMultiplier - 1) * 100];
  }

  getMaxStackCount(): number {
    return 999;
  }
}

export class EnemyDamageReducerModifier extends EnemyDamageMultiplierModifier {
  constructor(type: ModifierType, _reductionPercent: number, stackCount?: number) {
    //super(type, 1 - ((reductionPercent || 5) * 0.01), stackCount);
    super(type, 0.975, stackCount); // Hardcode multiplier temporarily
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof EnemyDamageReducerModifier;
  }

  clone(): EnemyDamageReducerModifier {
    return new EnemyDamageReducerModifier(this.type, (1 - this.damageMultiplier) * 100, this.stackCount);
  }

  getArgs(): any[] {
    return [(1 - this.damageMultiplier) * 100];
  }

  getMaxStackCount(): number {
    return globalScene.currentBattle.waveIndex < 2000 ? super.getMaxStackCount() : 999;
  }
}

export class EnemyTurnHealModifier extends EnemyPersistentModifier {
  public healPercent: number;

  constructor(type: ModifierType, _healPercent: number, stackCount?: number) {
    super(type, stackCount);

    // Hardcode temporarily
    this.healPercent = 2;
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof EnemyTurnHealModifier;
  }

  clone(): EnemyTurnHealModifier {
    return new EnemyTurnHealModifier(this.type, this.healPercent, this.stackCount);
  }

  getArgs(): any[] {
    return [this.healPercent];
  }

  /**
   * Applies {@linkcode EnemyTurnHealModifier}
   * @param enemyPokemon The {@linkcode Pokemon} to heal
   * @returns `true` if the {@linkcode Pokemon} was healed
   */
  override apply(enemyPokemon: Pokemon): boolean {
    if (!enemyPokemon.isFullHp()) {
      globalScene.phaseManager.unshiftNew(
        "PokemonHealPhase",
        enemyPokemon.getBattlerIndex(),
        Math.max(Math.floor(enemyPokemon.getMaxHp() / (100 / this.healPercent)) * this.stackCount, 1),
        i18next.t("modifier:enemyTurnHealApply", {
          pokemonNameWithAffix: getPokemonNameWithAffix(enemyPokemon),
        }),
        true,
        false,
        false,
        false,
        true,
      );
      return true;
    }

    return false;
  }

  getMaxStackCount(): number {
    return 10;
  }
}

export class EnemyAttackStatusEffectChanceModifier extends EnemyPersistentModifier {
  public effect: StatusEffect;
  public chance: number;

  constructor(type: ModifierType, effect: StatusEffect, _chancePercent: number, stackCount?: number) {
    super(type, stackCount);

    this.effect = effect;
    // Hardcode temporarily
    this.chance = 0.025 * (this.effect === StatusEffect.BURN || this.effect === StatusEffect.POISON ? 2 : 1);
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof EnemyAttackStatusEffectChanceModifier && modifier.effect === this.effect;
  }

  clone(): EnemyAttackStatusEffectChanceModifier {
    return new EnemyAttackStatusEffectChanceModifier(this.type, this.effect, this.chance * 100, this.stackCount);
  }

  getArgs(): any[] {
    return [this.effect, this.chance * 100];
  }

  /**
   * Applies {@linkcode EnemyAttackStatusEffectChanceModifier}
   * @param enemyPokemon {@linkcode Pokemon} to apply the status effect to
   * @returns `true` if the {@linkcode Pokemon} was affected
   */
  override apply(enemyPokemon: Pokemon): boolean {
    if (randSeedFloat() <= this.chance * this.getStackCount()) {
      return enemyPokemon.trySetStatus(this.effect);
    }

    return false;
  }

  getMaxStackCount(): number {
    return 10;
  }
}

export class EnemyStatusEffectHealChanceModifier extends EnemyPersistentModifier {
  public chance: number;

  constructor(type: ModifierType, _chancePercent: number, stackCount?: number) {
    super(type, stackCount);

    //Hardcode temporarily
    this.chance = 0.025;
  }

  match(modifier: Modifier): boolean {
    return modifier instanceof EnemyStatusEffectHealChanceModifier;
  }

  clone(): EnemyStatusEffectHealChanceModifier {
    return new EnemyStatusEffectHealChanceModifier(this.type, this.chance * 100, this.stackCount);
  }

  getArgs(): any[] {
    return [this.chance * 100];
  }

  /**
   * Applies {@linkcode EnemyStatusEffectHealChanceModifier} to randomly heal status.
   * @param enemyPokemon - The {@linkcode Pokemon} to heal
   * @returns `true` if the {@linkcode Pokemon} was healed
   */
  override apply(enemyPokemon: Pokemon): boolean {
    if (!enemyPokemon.status || randSeedFloat() > this.chance * this.getStackCount()) {
      return false;
    }

    globalScene.phaseManager.queueMessage(
      getStatusEffectHealText(enemyPokemon.status.effect, getPokemonNameWithAffix(enemyPokemon)),
    );
    enemyPokemon.resetStatus();
    enemyPokemon.updateInfo();
    return true;
  }

  getMaxStackCount(): number {
    return 10;
  }
}

export class EnemyEndureChanceModifier extends EnemyPersistentModifier {
  public chance: number;

  constructor(type: ModifierType, _chancePercent?: number, stackCount?: number) {
    super(type, stackCount || 10);

    //Hardcode temporarily
    this.chance = 2;
  }

  match(modifier: Modifier) {
    return modifier instanceof EnemyEndureChanceModifier;
  }

  clone() {
    return new EnemyEndureChanceModifier(this.type, this.chance, this.stackCount);
  }

  getArgs(): any[] {
    return [this.chance];
  }

  /**
   * Applies a chance of enduring a lethal hit of an attack
   * @param target the {@linkcode Pokemon} to apply the {@linkcode BattlerTagType.ENDURING} chance to
   * @returns `true` if {@linkcode Pokemon} endured
   */
  override apply(target: Pokemon): boolean {
    if (target.waveData.endured || target.randBattleSeedInt(100) >= this.chance * this.getStackCount()) {
      return false;
    }

    target.addTag(BattlerTagType.ENDURE_TOKEN, 1);

    target.waveData.endured = true;

    return true;
  }

  getMaxStackCount(): number {
    return 10;
  }
}

export class EnemyFusionChanceModifier extends EnemyPersistentModifier {
  private chance: number;

  constructor(type: ModifierType, chancePercent: number, stackCount?: number) {
    super(type, stackCount);

    this.chance = chancePercent / 100;
  }

  match(modifier: Modifier) {
    return modifier instanceof EnemyFusionChanceModifier && modifier.chance === this.chance;
  }

  clone() {
    return new EnemyFusionChanceModifier(this.type, this.chance * 100, this.stackCount);
  }

  getArgs(): any[] {
    return [this.chance * 100];
  }

  /**
   * Applies {@linkcode EnemyFusionChanceModifier}
   * @param isFusion {@linkcode BooleanHolder} that will be set to `true` if the {@linkcode EnemyPokemon} is a fusion
   * @returns `true` if the {@linkcode EnemyPokemon} is a fusion
   */
  override apply(isFusion: BooleanHolder): boolean {
    if (randSeedFloat() > this.chance * this.getStackCount()) {
      return false;
    }

    isFusion.value = true;

    return true;
  }

  getMaxStackCount(): number {
    return 10;
  }
}

/**
 * Uses either `MODIFIER_OVERRIDE` in overrides.ts to set {@linkcode PersistentModifier}s for either:
 *  - The player
 *  - The enemy
 * @param isPlayer {@linkcode boolean} for whether the player (`true`) or enemy (`false`) is being overridden
 */
export function overrideModifiers(isPlayer = true): void {
  const modifiersOverride: ModifierOverride[] = isPlayer
    ? Overrides.STARTING_MODIFIER_OVERRIDE
    : Overrides.ENEMY_MODIFIER_OVERRIDE;
  if (!modifiersOverride || modifiersOverride.length === 0 || !globalScene) {
    return;
  }

  // If it's the opponent, clear all of their current modifiers to avoid stacking
  if (!isPlayer) {
    globalScene.clearEnemyModifiers();
  }

  for (const item of modifiersOverride) {
    const modifierFunc = modifierTypes[item.name];
    let modifierType: ModifierType | null = modifierFunc();

    if (modifierType.is("ModifierTypeGenerator")) {
      const pregenArgs = "type" in item && item.type !== null ? [item.type] : undefined;
      modifierType = modifierType.generateType([], pregenArgs);
    }

    const modifier = modifierType && (modifierType.withIdFromFunc(modifierFunc).newModifier() as PersistentModifier);
    if (modifier) {
      modifier.stackCount = item.count || 1;

      if (isPlayer) {
        globalScene.addModifier(modifier, true, false, false, true);
      } else {
        globalScene.addEnemyModifier(modifier, true, true);
      }
    }
  }
}

/**
 * Uses either `HELD_ITEMS_OVERRIDE` in overrides.ts to set {@linkcode PokemonHeldItemModifier}s for either:
 *  - The first member of the player's team when starting a new game
 *  - An enemy {@linkcode Pokemon} being spawned in
 * @param pokemon {@linkcode Pokemon} whose held items are being overridden
 * @param isPlayer {@linkcode boolean} for whether the {@linkcode pokemon} is the player's (`true`) or an enemy (`false`)
 */
export function overrideHeldItems(pokemon: Pokemon, isPlayer = true): void {
  const heldItemsOverride: ModifierOverride[] = isPlayer
    ? Overrides.STARTING_HELD_ITEMS_OVERRIDE
    : Overrides.ENEMY_HELD_ITEMS_OVERRIDE;
  if (!heldItemsOverride || heldItemsOverride.length === 0 || !globalScene) {
    return;
  }

  if (!isPlayer) {
    globalScene.clearEnemyHeldItemModifiers(pokemon);
  }

  for (const item of heldItemsOverride) {
    const modifierFunc = modifierTypes[item.name];
    let modifierType: ModifierType | null = modifierFunc();
    const qty = item.count || 1;

    if (modifierType.is("ModifierTypeGenerator")) {
      const pregenArgs = "type" in item && item.type !== null ? [item.type] : undefined;
      modifierType = modifierType.generateType([], pregenArgs);
    }

    const heldItemModifier =
      modifierType && (modifierType.withIdFromFunc(modifierFunc).newModifier(pokemon) as PokemonHeldItemModifier);
    if (heldItemModifier) {
      heldItemModifier.pokemonId = pokemon.id;
      heldItemModifier.stackCount = qty;
      if (isPlayer) {
        globalScene.addModifier(heldItemModifier, true, false, false, true);
      } else {
        globalScene.addEnemyModifier(heldItemModifier, true, true);
      }
    }
  }
}

/**
 * Private map from modifier strings to their constructors.
 *
 * @remarks
 * Used for {@linkcode Modifier.is} to check if a modifier is of a certain type without
 * requiring modifier types to be imported in every file.
 */
const ModifierClassMap = Object.freeze({
  PersistentModifier,
  ConsumableModifier,
  AddPokeballModifier,
  AddVoucherModifier,
  LapsingPersistentModifier,
  DoubleBattleChanceBoosterModifier,
  TempStatStageBoosterModifier,
  TempCritBoosterModifier,
  MapModifier,
  MegaEvolutionAccessModifier,
  GigantamaxAccessModifier,
  TerastallizeAccessModifier,
  PokemonHeldItemModifier,
  LapsingPokemonHeldItemModifier,
  BaseStatModifier,
  EvoTrackerModifier,
  PokemonBaseStatTotalModifier,
  PokemonBaseStatFlatModifier,
  PokemonIncrementingStatModifier,
  StatBoosterModifier,
  SpeciesStatBoosterModifier,
  CritBoosterModifier,
  SpeciesCritBoosterModifier,
  AttackTypeBoosterModifier,
  SurviveDamageModifier,
  BypassSpeedChanceModifier,
  FlinchChanceModifier,
  TurnHealModifier,
  TurnStatusEffectModifier,
  HitHealModifier,
  LevelIncrementBoosterModifier,
  BerryModifier,
  PreserveBerryModifier,
  PokemonInstantReviveModifier,
  ResetNegativeStatStageModifier,
  FieldEffectModifier,
  ConsumablePokemonModifier,
  TerastallizeModifier,
  PokemonHpRestoreModifier,
  PokemonStatusHealModifier,
  ConsumablePokemonMoveModifier,
  PokemonPpRestoreModifier,
  PokemonAllMovePpRestoreModifier,
  PokemonPpUpModifier,
  PokemonNatureChangeModifier,
  PokemonLevelIncrementModifier,
  TmModifier,
  RememberMoveModifier,
  EvolutionItemModifier,
  FusePokemonModifier,
  MultipleParticipantExpBonusModifier,
  HealingBoosterModifier,
  ExpBoosterModifier,
  PokemonExpBoosterModifier,
  ExpShareModifier,
  ExpBalanceModifier,
  PokemonFriendshipBoosterModifier,
  PokemonNatureWeightModifier,
  PokemonMoveAccuracyBoosterModifier,
  PokemonMultiHitModifier,
  PokemonFormChangeItemModifier,
  MoneyRewardModifier,
  DamageMoneyRewardModifier,
  MoneyInterestModifier,
  HiddenAbilityRateBoosterModifier,
  ShinyRateBoosterModifier,
  CriticalCatchChanceBoosterModifier,
  LockModifierTiersModifier,
  HealShopCostModifier,
  BoostBugSpawnModifier,
  SwitchEffectTransferModifier,
  HeldItemTransferModifier,
  TurnHeldItemTransferModifier,
  ContactHeldItemTransferChanceModifier,
  IvScannerModifier,
  ExtraModifierModifier,
  TempExtraModifierModifier,
  EnemyPersistentModifier,
  EnemyDamageMultiplierModifier,
  EnemyDamageBoosterModifier,
  EnemyDamageReducerModifier,
  EnemyTurnHealModifier,
  EnemyAttackStatusEffectChanceModifier,
  EnemyStatusEffectHealChanceModifier,
  EnemyEndureChanceModifier,
  EnemyFusionChanceModifier,
  MoneyMultiplierModifier,
});

export type ModifierConstructorMap = typeof ModifierClassMap;
