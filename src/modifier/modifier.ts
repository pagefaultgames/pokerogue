import { FusionSpeciesFormEvolution, pokemonEvolutions } from "#app/data/balance/pokemon-evolutions";
import { getLevelTotalExp } from "#app/data/exp";
import { MAX_PER_TYPE_POKEBALLS } from "#app/data/pokeball";
import { getStatusEffectHealText } from "#app/data/status-effect";
import { getPokemonNameWithAffix } from "#app/messages";
import Overrides from "#app/overrides";
import { EvolutionPhase } from "#app/phases/evolution-phase";
import { LearnMovePhase, LearnMoveType } from "#app/phases/learn-move-phase";
import { LevelUpPhase } from "#app/phases/level-up-phase";
import { PokemonHealPhase } from "#app/phases/pokemon-heal-phase";
import type { VoucherType } from "#app/system/voucher";
import { addTextObject, TextStyle } from "#app/ui/text";
import { BattlerTagType } from "#enums/battler-tag-type";
import type { Nature } from "#enums/nature";
import type { PokeballType } from "#enums/pokeball";
import { Species } from "#enums/species";
import { type TempBattleStat, Stat, TEMP_BATTLE_STATS } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import type { PokemonType } from "#enums/pokemon-type";
import i18next from "i18next";
import {
  type DoubleBattleChanceBoosterModifierType,
  type EvolutionItemModifierType,
  type ModifierOverride,
  type ModifierType,
  type TerastallizeModifierType,
  type TmModifierType,
  getModifierType,
  ModifierTypeGenerator,
  modifierTypes,
} from "./modifier-type";
import { FRIENDSHIP_GAIN_FROM_RARE_CANDY } from "#app/data/balance/starters";
import { globalScene } from "#app/global-scene";
import type { EvoTrackerModifier } from "./held-item-modifier"; // TODO: Get rid of this circular import
import { type BooleanHolder, hslToHex, isNullOrUndefined, NumberHolder, toDmgValue } from "#app/utils/common";
import type Pokemon from "#app/field/pokemon";
import type { PlayerPokemon } from "#app/field/pokemon";

export type ModifierPredicate = (modifier: Modifier) => boolean;

export abstract class Modifier {
  public type: ModifierType;

  constructor(type: ModifierType) {
    this.type = type;
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
  public override type: DoubleBattleChanceBoosterModifierType;

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

export class TerrastalizeModifier extends ConsumablePokemonModifier {
  public override type: TerastallizeModifierType;
  public teraType: PokemonType;

  constructor(type: TerastallizeModifierType, pokemonId: number, teraType: PokemonType) {
    super(type, pokemonId);

    this.teraType = teraType;
  }

  /**
   * Checks if {@linkcode TerrastalizeModifier} should be applied
   * @param playerPokemon The {@linkcode PlayerPokemon} that consumes the item
   * @returns `true` if the {@linkcode TerrastalizeModifier} should be applied
   */
  override shouldApply(playerPokemon?: PlayerPokemon): boolean {
    return (
      super.shouldApply(playerPokemon) &&
      [playerPokemon?.species.speciesId, playerPokemon?.fusionSpecies?.speciesId].filter(
        s => s === Species.TERAPAGOS || s === Species.OGERPON || s === Species.SHEDINJA,
      ).length === 0
    );
  }

  /**
   * Applies {@linkcode TerrastalizeModifier}
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
      super.shouldApply(playerPokemon) &&
      (this.fainted || (!isNullOrUndefined(multiplier) && typeof multiplier === "number"))
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
        pokemon.hp +
          Math.max(Math.ceil(Math.max(Math.floor(this.restorePercent * 0.01 * pokemon.getMaxHp()), restorePoints)), 1),
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

    playerPokemon.addFriendship(FRIENDSHIP_GAIN_FROM_RARE_CANDY);

    globalScene.unshiftPhase(
      new LevelUpPhase(
        globalScene.getPlayerParty().indexOf(playerPokemon),
        playerPokemon.level - levelCount.value,
        playerPokemon.level,
      ),
    );

    return true;
  }
}

export class TmModifier extends ConsumablePokemonModifier {
  public override type: TmModifierType;

  /**
   * Applies {@linkcode TmModifier}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should learn the TM
   * @returns always `true`
   */
  override apply(playerPokemon: PlayerPokemon): boolean {
    globalScene.unshiftPhase(
      new LearnMovePhase(globalScene.getPlayerParty().indexOf(playerPokemon), this.type.moveId, LearnMoveType.TM),
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
    globalScene.unshiftPhase(
      new LearnMovePhase(
        globalScene.getPlayerParty().indexOf(playerPokemon),
        playerPokemon.getLearnableLevelMoves()[this.levelMoveIndex],
        LearnMoveType.MEMORY,
        cost,
      ),
    );

    return true;
  }
}

export class EvolutionItemModifier extends ConsumablePokemonModifier {
  public override type: EvolutionItemModifierType;
  /**
   * Applies {@linkcode EvolutionItemModifier}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should evolve via item
   * @returns `true` if the evolution was successful
   */
  override apply(playerPokemon: PlayerPokemon): boolean {
    let matchingEvolution = pokemonEvolutions.hasOwnProperty(playerPokemon.species.speciesId)
      ? pokemonEvolutions[playerPokemon.species.speciesId].find(
          e =>
            e.item === this.type.evolutionItem &&
            (e.evoFormKey === null || (e.preFormKey || "") === playerPokemon.getFormKey()) &&
            (!e.condition || e.condition.predicate(playerPokemon)),
        )
      : null;

    if (!matchingEvolution && playerPokemon.isFusion()) {
      matchingEvolution = pokemonEvolutions[playerPokemon.fusionSpecies!.speciesId].find(
        e =>
          e.item === this.type.evolutionItem && // TODO: is the bang correct?
          (e.evoFormKey === null || (e.preFormKey || "") === playerPokemon.getFusionFormKey()) &&
          (!e.condition || e.condition.predicate(playerPokemon)),
      );
      if (matchingEvolution) {
        matchingEvolution = new FusionSpeciesFormEvolution(playerPokemon.species.speciesId, matchingEvolution);
      }
    }

    if (matchingEvolution) {
      globalScene.unshiftPhase(new EvolutionPhase(playerPokemon, matchingEvolution, playerPokemon.level - 1));
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
      if (p.species?.speciesId === Species.GIMMIGHOUL || p.fusionSpecies?.speciesId === Species.GIMMIGHOUL) {
        p.evoCounter
          ? (p.evoCounter += Math.min(Math.floor(this.moneyMultiplier), 3))
          : (p.evoCounter = Math.min(Math.floor(this.moneyMultiplier), 3));
        const modifier = getModifierType(modifierTypes.EVOLUTION_TRACKER_GIMMIGHOUL).newModifier(
          p,
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
    globalScene.queueMessage(message, undefined, true);

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
      globalScene.unshiftPhase(
        new PokemonHealPhase(
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
        ),
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
    if (Phaser.Math.RND.realInRange(0, 1) < this.chance * this.getStackCount()) {
      return enemyPokemon.trySetStatus(this.effect, true);
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
   * Applies {@linkcode EnemyStatusEffectHealChanceModifier}
   * @param enemyPokemon The {@linkcode Pokemon} to heal
   * @returns `true` if the {@linkcode Pokemon} was healed
   */
  override apply(enemyPokemon: Pokemon): boolean {
    if (enemyPokemon.status && Phaser.Math.RND.realInRange(0, 1) < this.chance * this.getStackCount()) {
      globalScene.queueMessage(
        getStatusEffectHealText(enemyPokemon.status.effect, getPokemonNameWithAffix(enemyPokemon)),
      );
      enemyPokemon.resetStatus();
      enemyPokemon.updateInfo();
      return true;
    }

    return false;
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
    if (Phaser.Math.RND.realInRange(0, 1) >= this.chance * this.getStackCount()) {
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
    : Overrides.OPP_MODIFIER_OVERRIDE;
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

    if (modifierType instanceof ModifierTypeGenerator) {
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
