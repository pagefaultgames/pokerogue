import { FusionSpeciesFormEvolution, pokemonEvolutions } from "#app/data/balance/pokemon-evolutions";
import { getLevelTotalExp } from "#app/data/exp";
import { MAX_PER_TYPE_POKEBALLS } from "#app/data/pokeball";
import { getStatusEffectHealText } from "#app/data/status-effect";
import type Pokemon from "#app/field/pokemon";
import type { PlayerPokemon } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import Overrides from "#app/overrides";
import { LearnMoveType } from "#enums/learn-move-type";
import type { VoucherType } from "#app/system/voucher";
import { type BooleanHolder, isNullOrUndefined, NumberHolder, randSeedFloat, toDmgValue } from "#app/utils/common";
import { BattlerTagType } from "#enums/battler-tag-type";
import type { Nature } from "#enums/nature";
import type { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import type { PokemonType } from "#enums/pokemon-type";
import i18next from "i18next";
import type {
  EvolutionItemModifierType,
  ModifierOverride,
  ModifierType,
  TerastallizeModifierType,
  TmModifierType,
} from "./modifier-type";
import { FRIENDSHIP_GAIN_FROM_RARE_CANDY } from "#app/data/balance/starters";
import { globalScene } from "#app/global-scene";
import type { ModifierInstanceMap, ModifierString } from "#app/@types/modifier-types";
import { assignItemsFromConfiguration } from "#app/items/held-item-pool";
import type { HeldItemConfiguration } from "#app/items/held-item-data-types";
import { modifierTypes } from "#app/data/data-lists";
import { HeldItemId } from "#enums/held-item-id";

export type ModifierPredicate = (modifier: Modifier) => boolean;

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
        s => s === SpeciesId.TERAPAGOS || s === SpeciesId.OGERPON || s === SpeciesId.SHEDINJA,
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
  public override type: TmModifierType;

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
  public override type: EvolutionItemModifierType;
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

    for (const p of globalScene.getPlayerParty()) {
      if (p.species?.speciesId === SpeciesId.GIMMIGHOUL || p.fusionSpecies?.speciesId === SpeciesId.GIMMIGHOUL) {
        const factor = Math.min(Math.floor(this.moneyMultiplier), 3);
        p.heldItemManager.add(HeldItemId.GIMMIGHOUL_EVO_TRACKER, factor);
      }
    }

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

    if (modifierType?.is("ModifierTypeGenerator")) {
      const pregenArgs = "type" in item && item.type !== null ? [item.type] : undefined;
      modifierType = modifierType.generateType([], pregenArgs);
    }

    const modifier = modifierType && (modifierType.withIdFromFunc(modifierFunc).newModifier() as PersistentModifier);
    if (modifier) {
      modifier.stackCount = item.count || 1;

      if (isPlayer) {
        globalScene.addModifier(modifier, true, false, false, true);
      } else {
        globalScene.addEnemyModifier(modifier, true);
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
  const heldItemsOverride: HeldItemConfiguration = isPlayer
    ? Overrides.STARTING_HELD_ITEMS_OVERRIDE
    : Overrides.OPP_HELD_ITEMS_OVERRIDE;
  if (!heldItemsOverride || heldItemsOverride.length === 0 || !globalScene) {
    return;
  }

  if (!isPlayer) {
    pokemon.heldItemManager.clearItems();
  }

  assignItemsFromConfiguration(heldItemsOverride, pokemon);
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
  LevelIncrementBoosterModifier,
  PreserveBerryModifier,
  ConsumablePokemonModifier,
  TerrastalizeModifier,
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
  ExpShareModifier,
  ExpBalanceModifier,
  MoneyInterestModifier,
  HiddenAbilityRateBoosterModifier,
  ShinyRateBoosterModifier,
  CriticalCatchChanceBoosterModifier,
  LockModifierTiersModifier,
  HealShopCostModifier,
  BoostBugSpawnModifier,
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
