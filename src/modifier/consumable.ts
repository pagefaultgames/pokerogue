import { globalScene } from "#app/global-scene";
import Overrides from "#app/overrides";
import { FusionSpeciesFormEvolution, pokemonEvolutions } from "#balance/pokemon-evolutions";
import { FRIENDSHIP_GAIN_FROM_RARE_CANDY } from "#balance/starters";
import { getLevelTotalExp } from "#data/exp";
import { MAX_PER_TYPE_POKEBALLS } from "#data/pokeball";
import { HeldItemId } from "#enums/held-item-id";
import { LearnMoveType } from "#enums/learn-move-type";
import type { Nature } from "#enums/nature";
import type { PokeballType } from "#enums/pokeball";
import type { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import type { HeldItemConfiguration } from "#items/held-item-data-types";
import { assignItemsFromConfiguration } from "#items/held-item-pool";
import { TrainerItemEffect } from "#items/trainer-item";
import type { TrainerItemConfiguration } from "#items/trainer-item-data-types";
import type { EvolutionItemReward, Reward, TerastallizeReward, TmReward } from "#modifiers/modifier-type";
import type { VoucherType } from "#system/voucher";
import type { ModifierInstanceMap, ModifierString } from "#types/modifier-types";
import { isNullOrUndefined, NumberHolder } from "#utils/common";

export abstract class Consumable {
  public type: Reward;

  constructor(type: Reward) {
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

export class AddPokeballConsumable extends Consumable {
  private pokeballType: PokeballType;
  private count: number;

  constructor(type: Reward, pokeballType: PokeballType, count: number) {
    super(type);

    this.pokeballType = pokeballType;
    this.count = count;
  }

  /**
   * Applies {@linkcode AddPokeballConsumable}
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

export class AddVoucherConsumable extends Consumable {
  private voucherType: VoucherType;
  private count: number;

  constructor(type: Reward, voucherType: VoucherType, count: number) {
    super(type);

    this.voucherType = voucherType;
    this.count = count;
  }

  /**
   * Applies {@linkcode AddVoucherConsumable}
   * @param battleScene {@linkcode BattleScene}
   * @returns always `true`
   */
  override apply(): boolean {
    const voucherCounts = globalScene.gameData.voucherCounts;
    voucherCounts[this.voucherType] += this.count;

    return true;
  }
}

export abstract class PokemonConsumable extends Consumable {
  public pokemonId: number;

  constructor(type: Reward, pokemonId: number) {
    super(type);

    this.pokemonId = pokemonId;
  }

  /**
   * Checks if {@linkcode PokemonConsumable} should be applied
   * @param playerPokemon The {@linkcode PlayerPokemon} that consumes the item
   * @param _args N/A
   * @returns `true` if {@linkcode PokemonConsumable} should be applied
   */
  override shouldApply(playerPokemon?: PlayerPokemon, ..._args: unknown[]): boolean {
    return !!playerPokemon && (this.pokemonId === -1 || playerPokemon.id === this.pokemonId);
  }

  /**
   * Applies {@linkcode PokemonConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that consumes the item
   * @param args Additional arguments passed to {@linkcode PokemonConsumable.apply}
   */
  abstract override apply(playerPokemon: PlayerPokemon, ...args: unknown[]): boolean;

  getPokemon() {
    return globalScene.getPlayerParty().find(p => p.id === this.pokemonId);
  }
}

export class TerrastalizeConsumable extends PokemonConsumable {
  public override type: TerastallizeReward;
  public teraType: PokemonType;

  constructor(type: TerastallizeReward, pokemonId: number, teraType: PokemonType) {
    super(type, pokemonId);

    this.teraType = teraType;
  }

  /**
   * Checks if {@linkcode TerrastalizeConsumable} should be applied
   * @param playerPokemon The {@linkcode PlayerPokemon} that consumes the item
   * @returns `true` if the {@linkcode TerrastalizeConsumable} should be applied
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
   * Applies {@linkcode TerrastalizeConsumable}
   * @param pokemon The {@linkcode PlayerPokemon} that consumes the item
   * @returns `true` if hp was restored
   */
  override apply(pokemon: Pokemon): boolean {
    pokemon.teraType = this.teraType;
    return true;
  }
}

export class PokemonHpRestoreConsumable extends PokemonConsumable {
  private restorePoints: number;
  private restorePercent: number;
  private healStatus: boolean;
  public fainted: boolean;

  constructor(
    type: Reward,
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
   * Checks if {@linkcode PokemonHpRestoreConsumable} should be applied
   * @param playerPokemon The {@linkcode PlayerPokemon} that consumes the item
   * @param multiplier The multiplier of the hp restore
   * @returns `true` if the {@linkcode PokemonHpRestoreConsumable} should be applied
   */
  override shouldApply(playerPokemon?: PlayerPokemon, multiplier?: number): boolean {
    return (
      super.shouldApply(playerPokemon) &&
      (this.fainted || (!isNullOrUndefined(multiplier) && typeof multiplier === "number"))
    );
  }

  /**
   * Applies {@linkcode PokemonHpRestoreConsumable}
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

export class PokemonStatusHealConsumable extends PokemonConsumable {
  /**
   * Applies {@linkcode PokemonStatusHealConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that gets healed from the status
   * @returns always `true`
   */
  override apply(playerPokemon: PlayerPokemon): boolean {
    playerPokemon.resetStatus(true, true, false, false);
    return true;
  }
}

export abstract class PokemonMoveConsumable extends PokemonConsumable {
  public moveIndex: number;

  constructor(type: Reward, pokemonId: number, moveIndex: number) {
    super(type, pokemonId);

    this.moveIndex = moveIndex;
  }
}

export class PokemonPpRestoreConsumable extends PokemonMoveConsumable {
  private restorePoints: number;

  constructor(type: Reward, pokemonId: number, moveIndex: number, restorePoints: number) {
    super(type, pokemonId, moveIndex);

    this.restorePoints = restorePoints;
  }

  /**
   * Applies {@linkcode PokemonPpRestoreConsumable}
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

export class PokemonAllMovePpRestoreConsumable extends PokemonConsumable {
  private restorePoints: number;

  constructor(type: Reward, pokemonId: number, restorePoints: number) {
    super(type, pokemonId);

    this.restorePoints = restorePoints;
  }

  /**
   * Applies {@linkcode PokemonAllMovePpRestoreConsumable}
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

export class PokemonPpUpConsumable extends PokemonMoveConsumable {
  private upPoints: number;

  constructor(type: Reward, pokemonId: number, moveIndex: number, upPoints: number) {
    super(type, pokemonId, moveIndex);

    this.upPoints = upPoints;
  }

  /**
   * Applies {@linkcode PokemonPpUpConsumable}
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

export class PokemonNatureChangeConsumable extends PokemonConsumable {
  public nature: Nature;

  constructor(type: Reward, pokemonId: number, nature: Nature) {
    super(type, pokemonId);

    this.nature = nature;
  }

  /**
   * Applies {@linkcode PokemonNatureChangeConsumable}
   * @param playerPokemon {@linkcode PlayerPokemon} to apply the {@linkcode Nature} change to
   * @returns
   */
  override apply(playerPokemon: PlayerPokemon): boolean {
    playerPokemon.setCustomNature(this.nature);
    globalScene.gameData.unlockSpeciesNature(playerPokemon.species, this.nature);

    return true;
  }
}

export class PokemonLevelIncrementConsumable extends PokemonConsumable {
  /**
   * Applies {@linkcode PokemonLevelIncrementConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should get levels incremented
   * @param levelCount The amount of levels to increment
   * @returns always `true`
   */
  override apply(playerPokemon: PlayerPokemon, levelCount: NumberHolder = new NumberHolder(1)): boolean {
    globalScene.applyPlayerItems(TrainerItemEffect.LEVEL_INCREMENT_BOOSTER, { numberHolder: levelCount });

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

export class TmConsumable extends PokemonConsumable {
  public override type: TmReward;

  /**
   * Applies {@linkcode TmConsumable}
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

export class RememberMoveConsumable extends PokemonConsumable {
  public levelMoveIndex: number;

  constructor(type: Reward, pokemonId: number, levelMoveIndex: number) {
    super(type, pokemonId);

    this.levelMoveIndex = levelMoveIndex;
  }

  /**
   * Applies {@linkcode RememberMoveConsumable}
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

export class EvolutionItemConsumable extends PokemonConsumable {
  public override type: EvolutionItemReward;
  /**
   * Applies {@linkcode EvolutionItemConsumable}
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

export class FusePokemonConsumable extends PokemonConsumable {
  public fusePokemonId: number;

  constructor(type: Reward, pokemonId: number, fusePokemonId: number) {
    super(type, pokemonId);

    this.fusePokemonId = fusePokemonId;
  }

  /**
   * Checks if {@linkcode FusePokemonConsumable} should be applied
   * @param playerPokemon {@linkcode PlayerPokemon} that should be fused
   * @param playerPokemon2 {@linkcode PlayerPokemon} that should be fused with {@linkcode playerPokemon}
   * @returns `true` if {@linkcode FusePokemonConsumable} should be applied
   */
  override shouldApply(playerPokemon?: PlayerPokemon, playerPokemon2?: PlayerPokemon): boolean {
    return (
      super.shouldApply(playerPokemon, playerPokemon2) && !!playerPokemon2 && this.fusePokemonId === playerPokemon2.id
    );
  }

  /**
   * Applies {@linkcode FusePokemonConsumable}
   * @param playerPokemon {@linkcode PlayerPokemon} that should be fused
   * @param playerPokemon2 {@linkcode PlayerPokemon} that should be fused with {@linkcode playerPokemon}
   * @returns always Promise<true>
   */
  override apply(playerPokemon: PlayerPokemon, playerPokemon2: PlayerPokemon): boolean {
    playerPokemon.fuse(playerPokemon2);
    return true;
  }
}

export class MoneyRewardConsumable extends Consumable {
  private moneyMultiplier: number;

  constructor(type: Reward, moneyMultiplier: number) {
    super(type);

    this.moneyMultiplier = moneyMultiplier;
  }

  /**
   * Applies {@linkcode MoneyRewardConsumable}
   * @returns always `true`
   */
  override apply(): boolean {
    const moneyAmount = new NumberHolder(globalScene.getWaveMoneyAmount(this.moneyMultiplier));

    globalScene.applyPlayerItems(TrainerItemEffect.MONEY_MULTIPLIER, { numberHolder: moneyAmount });

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

/**
 * Uses either `MODIFIER_OVERRIDE` in overrides.ts to set {@linkcode PersistentModifier}s for either:
 *  - The player
 *  - The enemy
 * @param isPlayer {@linkcode boolean} for whether the player (`true`) or enemy (`false`) is being overridden
 */
export function overrideTrainerItems(isPlayer = true): void {
  const trainerItemsOverride: TrainerItemConfiguration = isPlayer
    ? Overrides.STARTING_TRAINER_ITEMS_OVERRIDE
    : Overrides.OPP_TRAINER_ITEMS_OVERRIDE;
  if (!trainerItemsOverride || trainerItemsOverride.length === 0 || !globalScene) {
    return;
  }

  // If it's the opponent, clear all of their current modifiers to avoid stacking
  if (!isPlayer) {
    globalScene.clearEnemyItems();
  }

  globalScene.assignTrainerItemsFromConfiguration(trainerItemsOverride, isPlayer);
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
  Consumable,
  AddPokeballConsumable,
  AddVoucherConsumable,
  PokemonConsumable,
  TerrastalizeConsumable,
  PokemonHpRestoreConsumable,
  PokemonStatusHealConsumable,
  PokemonMoveConsumable,
  PokemonPpRestoreConsumable,
  PokemonAllMovePpRestoreConsumable,
  PokemonPpUpConsumable,
  PokemonNatureChangeConsumable,
  PokemonLevelIncrementConsumable,
  TmConsumable,
  RememberMoveConsumable,
  EvolutionItemConsumable,
  FusePokemonConsumable,
});

export type ModifierConstructorMap = typeof ModifierClassMap;
