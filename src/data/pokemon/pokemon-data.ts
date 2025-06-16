import { type BattlerTag, loadBattlerTag } from "#app/data/battler-tags";
import type { Gender } from "#app/data/gender";
import type { PokemonSpeciesForm } from "#app/data/pokemon-species";
import type { TypeDamageMultiplier } from "#app/data/type";
import { isNullOrUndefined } from "#app/utils/common";
import type { AbilityId } from "#enums/ability-id";
import type { BerryType } from "#enums/berry-type";
import type { MoveId } from "#enums/move-id";
import type { PokemonType } from "#enums/pokemon-type";
import { PokemonMove } from "#app/data/moves/pokemon-move";
import type { TurnMove } from "#app/@types/turn-move";
import type { AttackMoveResult } from "#app/@types/attack-move-result";
import type { Nature } from "#enums/nature";
import type { IllusionData } from "#app/@types/illusion-data";

/**
 * Permanent data that can customize a Pokemon in non-standard ways from its Species.
 * Includes abilities, nature, changed types, etc.
 */
export class CustomPokemonData {
  // TODO: Change the default value for all these from -1 to something a bit more sensible
  /**
   * The scale at which to render this Pokemon's sprite.
   */
  public spriteScale = -1;
  public ability: AbilityId | -1;
  public passive: AbilityId | -1;
  public nature: Nature | -1;
  public types: PokemonType[];
  /** Deprecated but needed for session save migration */
  // TODO: Remove this once pre-session migration is implemented
  public hitsRecCount: number | null = null;

  constructor(data?: CustomPokemonData | Partial<CustomPokemonData>) {
    this.spriteScale = data?.spriteScale ?? -1;
    this.ability = data?.ability ?? -1;
    this.passive = data?.passive ?? -1;
    this.nature = data?.nature ?? -1;
    this.types = data?.types ?? [];
    this.hitsRecCount = data?.hitsRecCount ?? null;
  }
}

/**
 * Persistent in-battle data for a {@linkcode Pokemon}.
 * Resets on switch or new battle.
 */
export class PokemonSummonData {
  /** [Atk, Def, SpAtk, SpDef, Spd, Acc, Eva] */
  public statStages: number[] = [0, 0, 0, 0, 0, 0, 0];
  /**
   * A queue of moves yet to be executed, used by charging, recharging and frenzy moves.
   * So long as this array is nonempty, this Pokemon's corresponding `CommandPhase` will be skipped over entirely
   * in favor of using the queued move.
   * TODO: Clean up a lot of the code surrounding the move queue.
   */
  public moveQueue: TurnMove[] = [];
  public tags: BattlerTag[] = [];
  public abilitySuppressed = false;

  // Overrides for transform.
  // TODO: Move these into a separate class & add rage fist hit count
  public speciesForm: PokemonSpeciesForm | null = null;
  public fusionSpeciesForm: PokemonSpeciesForm | null = null;
  public ability: AbilityId | undefined;
  public passiveAbility: AbilityId | undefined;
  public gender: Gender | undefined;
  public fusionGender: Gender | undefined;
  public stats: number[] = [0, 0, 0, 0, 0, 0];
  public moveset: PokemonMove[] | null;

  // If not initialized this value will not be populated from save data.
  public types: PokemonType[] = [];
  public addedType: PokemonType | null = null;

  /** Data pertaining to this pokemon's illusion. */
  public illusion: IllusionData | null = null;
  public illusionBroken = false;

  /** Array containing all berries eaten in the last turn; used by {@linkcode AbilityId.CUD_CHEW} */
  public berriesEatenLast: BerryType[] = [];

  /**
   * An array of all moves this pokemon has used since entering the battle.
   * Used for most moves and abilities that check prior move usage or copy already-used moves.
   */
  public moveHistory: TurnMove[] = [];

  constructor(source?: PokemonSummonData | Partial<PokemonSummonData>) {
    if (isNullOrUndefined(source)) {
      return;
    }

    // TODO: Rework this into an actual generic function for use elsewhere
    for (const [key, value] of Object.entries(source)) {
      if (isNullOrUndefined(value) && this.hasOwnProperty(key)) {
        continue;
      }

      if (key === "moveset") {
        this.moveset = value?.map((m: any) => PokemonMove.loadMove(m));
        continue;
      }

      if (key === "tags") {
        // load battler tags
        this.tags = value.map((t: BattlerTag) => loadBattlerTag(t));
        continue;
      }
      this[key] = value;
    }
  }
}

// TODO: Merge this inside `summmonData` but exclude from save if/when a save data serializer is added
export class PokemonTempSummonData {
  /**
   * The number of turns this pokemon has spent without switching out.
   * Only currently used for positioning the battle cursor.
   */
  turnCount = 1;

  /**
   * The number of turns this pokemon has spent in the active position since the start of the wave
   * without switching out.
   * Reset on switch and new wave, but not stored in `SummonData` to avoid being written to the save file.

   * Used to evaluate "first turn only" conditions such as
   * {@linkcode MoveId.FAKE_OUT | Fake Out} and {@linkcode MoveId.FIRST_IMPRESSION | First Impression}).
   */
  waveTurnCount = 1;
}

/**
 * Persistent data for a {@linkcode Pokemon}.
 * Resets at the start of a new battle (but not on switch).
 */
export class PokemonBattleData {
  /** Counter tracking direct hits this Pokemon has received during this battle; used for {@linkcode MoveId.RAGE_FIST} */
  public hitCount = 0;
  /** Whether this Pokemon has eaten a berry this battle; used for {@linkcode MoveId.BELCH} */
  public hasEatenBerry = false;
  /** Array containing all berries eaten and not yet recovered during this current battle; used by {@linkcode AbilityId.HARVEST} */
  public berriesEaten: BerryType[] = [];

  constructor(source?: PokemonBattleData | Partial<PokemonBattleData>) {
    if (!isNullOrUndefined(source)) {
      this.hitCount = source.hitCount ?? 0;
      this.hasEatenBerry = source.hasEatenBerry ?? false;
      this.berriesEaten = source.berriesEaten ?? [];
    }
  }
}

/**
 * Temporary data for a {@linkcode Pokemon}.
 * Resets on new wave/battle start (but not on switch).
 */
export class PokemonWaveData {
  /** Whether the pokemon has endured due to a {@linkcode BattlerTagType.ENDURE_TOKEN} */
  public endured = false;
  /**
   * A set of all the abilities this {@linkcode Pokemon} has used in this wave.
   * Used to track once per battle conditions, as well as (hopefully) by the updated AI for move effectiveness.
   */
  public abilitiesApplied: Set<AbilityId> = new Set<AbilityId>();
  /** Whether the pokemon's ability has been revealed or not */
  public abilityRevealed = false;
}

/**
 * Temporary data for a {@linkcode Pokemon}.
 * Resets at the start of a new turn, as well as on switch.
 */
export class PokemonTurnData {
  public acted = false;
  /** How many times the current move should hit the target(s) */
  public hitCount = 0;
  /**
   * - `-1` = Calculate how many hits are left
   * - `0` = Move is finished
   */
  public hitsLeft = -1;
  public totalDamageDealt = 0;
  public singleHitDamageDealt = 0;
  public damageTaken = 0;
  public attacksReceived: AttackMoveResult[] = [];
  public order: number;
  public statStagesIncreased = false;
  public statStagesDecreased = false;
  public moveEffectiveness: TypeDamageMultiplier | null = null;
  public combiningPledge?: MoveId;
  public switchedInThisTurn = false;
  public failedRunAway = false;
  public joinedRound = false;
  /**
   * The amount of times this Pokemon has acted again and used a move in the current turn.
   * Used to make sure multi-hits occur properly when the user is
   * forced to act again in the same turn, and **must be incremented** by any effects that grant extra actions.
   */
  public extraTurns = 0;
  /**
   * All berries eaten by this pokemon in this turn.
   * Saved into {@linkcode PokemonSummonData | SummonData} by {@linkcode AbilityId.CUD_CHEW} on turn end.
   * @see {@linkcode PokemonSummonData.berriesEatenLast}
   */
  public berriesEaten: BerryType[] = [];
}
