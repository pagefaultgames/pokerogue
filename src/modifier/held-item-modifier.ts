import { pokemonEvolutions } from "#app/data/balance/pokemon-evolutions";
import Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import { addTextObject, TextStyle } from "#app/ui/text";
import { BooleanHolder, isNullOrUndefined, NumberHolder, toDmgValue } from "#app/utils/common";
import { Color, ShadowColor } from "#enums/color";
import type { PokemonType } from "#enums/pokemon-type";
import type { Species } from "#enums/species";
import { BATTLE_STATS, type PermanentStat, Stat } from "#enums/stat";
import i18next from "i18next";
import { getPokemonNameWithAffix } from "#app/messages";
import { Command } from "#app/ui/command-ui-handler";
import { PokemonHealPhase } from "#app/phases/pokemon-heal-phase";
import { StatusEffect } from "#enums/status-effect";
import { BerryType } from "#enums/berry-type";
import { getBerryEffectFunc, getBerryPredicate } from "#app/data/berry";
import {
  applyAbAttrs,
  applyPostItemLostAbAttrs,
  CommanderAbAttr,
  PostItemLostAbAttr,
} from "#app/data/abilities/ability";
import type { Moves } from "#enums/moves";
import { allMoves } from "#app/data/data-lists";
import { type FormChangeItem, SpeciesFormChangeItemTrigger } from "#app/data/pokemon-forms";
import {
  ExtraModifierModifier,
  type Modifier,
  MoneyMultiplierModifier,
  PersistentModifier,
  TempExtraModifierModifier,
} from "./modifier";
import {
  type FormChangeItemModifierType,
  type ModifierOverride,
  ModifierTypeGenerator,
  modifierTypes,
  type PokemonExpBoosterModifierType,
  type PokemonFriendshipBoosterModifierType,
  PokemonHeldItemModifierType,
  type PokemonMoveAccuracyBoosterModifierType,
  type PokemonMultiHitModifierType,
  type ModifierType,
  type PokemonBaseStatTotalModifierType,
} from "./modifier-type";
import { getOrInferTier, ModifierPoolType } from "./modifier-pool";
import Overrides from "#app/overrides";

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
    return this.pokemonId ? (globalScene.getPokemonById(this.pokemonId) ?? undefined) : undefined;
  }

  getScoreMultiplier(): number {
    return 1;
  }

  getMaxStackCount(forThreshold?: boolean): number {
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
  protected species: Species;
  protected required: number;
  public isTransferable = false;

  constructor(type: ModifierType, pokemonId: number, species: Species, required: number, stackCount?: number) {
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

  getIconStackText(virtual?: boolean): Phaser.GameObjects.BitmapText | null {
    if (this.getMaxStackCount() === 1 || (virtual && !this.virtualStackCount)) {
      return null;
    }

    const pokemon = globalScene.getPokemonById(this.pokemonId);

    this.stackCount = pokemon
      ? pokemon.evoCounter +
        pokemon.getHeldItems().filter(m => m instanceof DamageMoneyRewardModifier).length +
        globalScene.findModifiers(
          m =>
            m instanceof MoneyMultiplierModifier ||
            m instanceof ExtraModifierModifier ||
            m instanceof TempExtraModifierModifier,
        ).length
      : this.stackCount;

    const text = globalScene.add.bitmapText(10, 15, "item-count", this.stackCount.toString(), 11);
    text.letterSpacing = -0.5;
    if (this.getStackCount() >= this.required) {
      text.setTint(0xf89890);
    }
    text.setOrigin(0, 0);

    return text;
  }

  getMaxHeldItemCount(pokemon: Pokemon): number {
    this.stackCount =
      pokemon.evoCounter +
      pokemon.getHeldItems().filter(m => m instanceof DamageMoneyRewardModifier).length +
      globalScene.findModifiers(
        m =>
          m instanceof MoneyMultiplierModifier ||
          m instanceof ExtraModifierModifier ||
          m instanceof TempExtraModifierModifier,
      ).length;
    return 999;
  }
}

/**
 * Currently used by Shuckle Juice item
 */
export class PokemonBaseStatTotalModifier extends PokemonHeldItemModifier {
  public override type: PokemonBaseStatTotalModifierType;
  public isTransferable = false;

  private statModifier: number;

  constructor(type: PokemonBaseStatTotalModifierType, pokemonId: number, statModifier: number, stackCount?: number) {
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
  private statModifier: number;
  private stats: Stat[];
  public isTransferable = false;

  constructor(type: ModifierType, pokemonId: number, statModifier: number, stats: Stat[], stackCount?: number) {
    super(type, pokemonId, stackCount);

    this.statModifier = statModifier;
    this.stats = stats;
  }

  override matchType(modifier: Modifier): boolean {
    return (
      modifier instanceof PokemonBaseStatFlatModifier &&
      modifier.statModifier === this.statModifier &&
      this.stats.every(s => modifier.stats.some(stat => s === stat))
    );
  }

  override clone(): PersistentModifier {
    return new PokemonBaseStatFlatModifier(this.type, this.pokemonId, this.statModifier, this.stats, this.stackCount);
  }

  override getArgs(): any[] {
    return [...super.getArgs(), this.statModifier, this.stats];
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
  override apply(_pokemon: Pokemon, baseStats: number[]): boolean {
    // Modifies the passed in baseStats[] array by a flat value, only if the stat is specified in this.stats
    baseStats.forEach((v, i) => {
      if (this.stats.includes(i)) {
        const newVal = Math.floor(v + this.statModifier);
        baseStats[i] = Math.min(Math.max(newVal, 1), 999999);
      }
    });

    return true;
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

  getArgs(): any[] {
    return super.getArgs();
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
  clone() {
    return super.clone() as EvolutionStatBoosterModifier;
  }

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
 * multiplier if the holder is of a specific {@linkcode Species}.
 * @extends StatBoosterModifier
 * @see {@linkcode apply}
 */
export class SpeciesStatBoosterModifier extends StatBoosterModifier {
  /** The species that the held item's stat boost(s) apply to */
  private species: Species[];

  constructor(
    type: ModifierType,
    pokemonId: number,
    stats: Stat[],
    multiplier: number,
    species: Species[],
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
   * Checks if the incoming stat is listed in {@linkcode stats} and if the holder's {@linkcode Species}
   * (or its fused species) is listed in {@linkcode species}.
   * @param pokemon {@linkcode Pokemon} that holds the item
   * @param stat {@linkcode Stat} being checked at the time
   * @param statValue {@linkcode NumberHolder} that holds the resulting value of the stat
   * @returns `true` if the stat could be boosted, false otherwise
   */
  override shouldApply(pokemon: Pokemon, stat: Stat, statValue: NumberHolder): boolean {
    return (
      super.shouldApply(pokemon, stat, statValue) &&
      (this.species.includes(pokemon.getSpeciesForm(true).speciesId) ||
        (pokemon.isFusion() && this.species.includes(pokemon.getFusionSpeciesForm(true).speciesId)))
    );
  }

  /**
   * Checks if either parameter is included in the corresponding lists
   * @param speciesId {@linkcode Species} being checked
   * @param stat {@linkcode Stat} being checked
   * @returns `true` if both parameters are in {@linkcode species} and {@linkcode stats} respectively, false otherwise
   */
  contains(speciesId: Species, stat: Stat): boolean {
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
 * if the holder is of a specific {@linkcode Species}.
 * @extends CritBoosterModifier
 * @see {@linkcode shouldApply}
 */
export class SpeciesCritBoosterModifier extends CritBoosterModifier {
  /** The species that the held item's critical-hit stage boost applies to */
  private species: Species[];

  constructor(type: ModifierType, pokemonId: number, stageIncrement: number, species: Species[], stackCount?: number) {
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
   * Checks if the holder's {@linkcode Species} (or its fused species) is listed
   * in {@linkcode species}.
   * @param pokemon {@linkcode Pokemon} that holds the held item
   * @param critStage {@linkcode NumberHolder} that holds the resulting critical-hit level
   * @returns `true` if the critical-hit level can be incremented, false otherwise
   */
  override shouldApply(pokemon: Pokemon, critStage: NumberHolder): boolean {
    return (
      super.shouldApply(pokemon, critStage) &&
      (this.species.includes(pokemon.getSpeciesForm(true).speciesId) ||
        (pokemon.isFusion() && this.species.includes(pokemon.getFusionSpeciesForm(true).speciesId)))
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
        attackTypeBoosterModifier.moveType === this.moveType &&
        attackTypeBoosterModifier.boostMultiplier === this.boostMultiplier
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
      super.shouldApply(pokemon, moveType, movePower) &&
      typeof moveType === "number" &&
      movePower instanceof NumberHolder &&
      this.moveType === moveType
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

      globalScene.queueMessage(
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
      const hasQuickClaw = this.type instanceof PokemonHeldItemModifierType && this.type.id === "QUICK_CLAW";

      if (isCommandFight && hasQuickClaw) {
        globalScene.queueMessage(
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
 * Because King's Rock can be stacked in PokeRogue, unlike mainline, it does not receive a boost from Abilities.SERENE_GRACE
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
      globalScene.unshiftPhase(
        new PokemonHealPhase(
          pokemon.getBattlerIndex(),
          toDmgValue(pokemon.getMaxHp() / 16) * this.stackCount,
          i18next.t("modifier:turnHealApply", {
            pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
            typeName: this.type.name,
          }),
          true,
        ),
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
   * Tries to inflicts the holder with the associated {@linkcode StatusEffect}.
   * @param pokemon {@linkcode Pokemon} that holds the held item
   * @returns `true` if the status effect was applied successfully
   */
  override apply(pokemon: Pokemon): boolean {
    return pokemon.trySetStatus(this.effect, true, undefined, undefined, this.type.name);
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
      globalScene.unshiftPhase(
        new PokemonHealPhase(
          pokemon.getBattlerIndex(),
          toDmgValue(pokemon.turnData.totalDamageDealt / 8) * this.stackCount,
          i18next.t("modifier:hitHealApply", {
            pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
            typeName: this.type.name,
          }),
          true,
        ),
      );
    }

    return true;
  }

  getMaxHeldItemCount(_pokemon: Pokemon): number {
    return 4;
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
    applyPostItemLostAbAttrs(PostItemLostAbAttr, pokemon, false);

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
    globalScene.unshiftPhase(
      new PokemonHealPhase(
        pokemon.getBattlerIndex(),
        toDmgValue(pokemon.getMaxHp() / 2),
        i18next.t("modifier:pokemonInstantReviveApply", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
          typeName: this.type.name,
        }),
        false,
        false,
        true,
      ),
    );

    // Remove the Pokemon's FAINT status
    pokemon.resetStatus(true, false, true, false);

    // Reapply Commander on the Pokemon's side of the field, if applicable
    const field = pokemon.isPlayer() ? globalScene.getPlayerField() : globalScene.getEnemyField();
    for (const p of field) {
      applyAbAttrs(CommanderAbAttr, p, null, false);
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
      globalScene.queueMessage(
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

export class PokemonExpBoosterModifier extends PokemonHeldItemModifier {
  public override type: PokemonExpBoosterModifierType;

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

export class PokemonFriendshipBoosterModifier extends PokemonHeldItemModifier {
  public override type: PokemonFriendshipBoosterModifierType;

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
  public override type: PokemonMoveAccuracyBoosterModifierType;
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
  public override type: PokemonMultiHitModifierType;

  matchType(modifier: Modifier): boolean {
    return modifier instanceof PokemonMultiHitModifier;
  }

  clone(): PersistentModifier {
    return new PokemonMultiHitModifier(this.type, this.pokemonId, this.stackCount);
  }

  /**
   * For each stack, converts 25 percent of attack damage into an additional strike.
   * @param pokemon The {@linkcode Pokemon} using the move
   * @param moveId The {@linkcode Moves | identifier} for the move being used
   * @param count {@linkcode NumberHolder} holding the move's hit count for this turn
   * @param damageMultiplier {@linkcode NumberHolder} holding a damage multiplier applied to a strike of this move
   * @returns always `true`
   */
  override apply(
    pokemon: Pokemon,
    moveId: Moves,
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
  public override type: FormChangeItemModifierType;
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
    return pokemon instanceof Pokemon ? pokemon.getOpponents() : [];
  }

  /**
   * Steals an item from a set of target Pokemon.
   * This prioritizes high-tier held items when selecting the item to steal.
   * @param pokemon The {@linkcode Pokemon} holding this item
   * @param target The {@linkcode Pokemon} to steal from (optional)
   * @param _args N/A
   * @returns `true` if an item was stolen; false otherwise.
   */
  override apply(pokemon: Pokemon, target?: Pokemon, ..._args: unknown[]): boolean {
    const opponents = this.getTargets(pokemon, target);

    if (!opponents.length) {
      return false;
    }

    const targetPokemon = opponents[pokemon.randBattleSeedInt(opponents.length)];

    const transferredItemCount = this.getTransferredItemCount();
    if (!transferredItemCount) {
      return false;
    }

    const poolType = pokemon.isPlayer()
      ? ModifierPoolType.PLAYER
      : pokemon.hasTrainer()
        ? ModifierPoolType.TRAINER
        : ModifierPoolType.WILD;

    const transferredModifierTypes: ModifierType[] = [];
    const itemModifiers = globalScene.findModifiers(
      m => m instanceof PokemonHeldItemModifier && m.pokemonId === targetPokemon.id && m.isTransferable,
      targetPokemon.isPlayer(),
    ) as PokemonHeldItemModifier[];
    let highestItemTier = itemModifiers
      .map(m => getOrInferTier(m.type, poolType))
      .reduce((highestTier, tier) => Math.max(tier!, highestTier), 0); // TODO: is this bang correct?
    let tierItemModifiers = itemModifiers.filter(m => getOrInferTier(m.type, poolType) === highestItemTier);

    for (let i = 0; i < transferredItemCount; i++) {
      if (!tierItemModifiers.length) {
        while (highestItemTier-- && !tierItemModifiers.length) {
          tierItemModifiers = itemModifiers.filter(m => m.type.tier === highestItemTier);
        }
        if (!tierItemModifiers.length) {
          break;
        }
      }
      const randItemIndex = pokemon.randBattleSeedInt(itemModifiers.length);
      const randItem = itemModifiers[randItemIndex];
      if (globalScene.tryTransferHeldItemModifier(randItem, pokemon, false)) {
        transferredModifierTypes.push(randItem.type);
        itemModifiers.splice(randItemIndex, 1);
      }
    }

    for (const mt of transferredModifierTypes) {
      globalScene.queueMessage(this.getTransferMessage(pokemon, targetPokemon, mt));
    }

    return !!transferredModifierTypes.length;
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
    return Phaser.Math.RND.realInRange(0, 1) < this.chance * this.getStackCount() ? 1 : 0;
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
    : Overrides.OPP_HELD_ITEMS_OVERRIDE;
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

    if (modifierType instanceof ModifierTypeGenerator) {
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
