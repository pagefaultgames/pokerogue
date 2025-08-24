import type { BattlerTag } from "#data/battler-tags";
import { loadBattlerTag, SerializableBattlerTag } from "#data/battler-tags";
import { allSpecies } from "#data/data-lists";
import type { Gender } from "#data/gender";
import { PokemonMove } from "#data/moves/pokemon-move";
import type { PokemonSpeciesForm } from "#data/pokemon-species";
import type { TypeDamageMultiplier } from "#data/type";
import type { AbilityId } from "#enums/ability-id";
import type { BerryType } from "#enums/berry-type";
import type { MoveId } from "#enums/move-id";
import type { Nature } from "#enums/nature";
import type { PokemonType } from "#enums/pokemon-type";
import type { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import type { AttackMoveResult } from "#types/attack-move-result";
import type { IllusionData } from "#types/illusion-data";
import type { TurnMove } from "#types/turn-move";
import type { CoerceNullPropertiesToUndefined } from "#types/type-helpers";
import { isNullOrUndefined } from "#utils/common";
import { getPokemonSpeciesForm } from "#utils/pokemon-utils";

/**
 * The type that {@linkcode PokemonSpeciesForm} is converted to when an object containing it serializes it.
 */
type SerializedSpeciesForm = {
  id: SpeciesId;
  formIdx: number;
};

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
 * Deserialize a pokemon species form from an object containing `id` and `formIdx` properties.
 * @param value - The value to deserialize
 * @returns The `PokemonSpeciesForm` or `null` if the fields could not be properly discerned
 */
function deserializePokemonSpeciesForm(value: SerializedSpeciesForm | PokemonSpeciesForm): PokemonSpeciesForm | null {
  // @ts-expect-error: We may be deserializing a PokemonSpeciesForm, but we catch later on
  let { id, formIdx } = value;

  if (isNullOrUndefined(id) || isNullOrUndefined(formIdx)) {
    // @ts-expect-error: Typescript doesn't know that in block, `value` must be a PokemonSpeciesForm
    id = value.speciesId;
    // @ts-expect-error: Same as above (plus we are accessing a protected property)
    formIdx = value._formIndex;
  }
  // If for some reason either of these fields are null/undefined, we cannot reconstruct the species form
  if (isNullOrUndefined(id) || isNullOrUndefined(formIdx)) {
    return null;
  }
  return getPokemonSpeciesForm(id, formIdx);
}

interface SerializedIllusionData extends Omit<IllusionData, "fusionSpecies"> {
  /** The id of the illusioned fusion species, or `undefined` if not a fusion */
  fusionSpecies?: SpeciesId;
}

interface SerializedPokemonSummonData {
  statStages: number[];
  moveQueue: TurnMove[];
  tags: BattlerTag[];
  abilitySuppressed: boolean;
  speciesForm?: SerializedSpeciesForm;
  fusionSpeciesForm?: SerializedSpeciesForm;
  ability?: AbilityId;
  passiveAbility?: AbilityId;
  gender?: Gender;
  fusionGender?: Gender;
  stats: number[];
  moveset?: PokemonMove[];
  types: PokemonType[];
  addedType?: PokemonType;
  illusion?: SerializedIllusionData;
  illusionBroken: boolean;
  berriesEatenLast: BerryType[];
  moveHistory: TurnMove[];
}

/**
 * Persistent in-battle data for a {@linkcode Pokemon}.
 * Resets on switch or new battle.
 *
 * @sealed
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

  constructor(source?: PokemonSummonData | SerializedPokemonSummonData) {
    if (isNullOrUndefined(source)) {
      return;
    }

    // TODO: Rework this into an actual generic function for use elsewhere
    for (const [key, value] of Object.entries(source)) {
      if (isNullOrUndefined(value) && this.hasOwnProperty(key)) {
        continue;
      }

      if (key === "speciesForm" || key === "fusionSpeciesForm") {
        this[key] = deserializePokemonSpeciesForm(value);
        continue;
      }

      if (key === "illusion" && typeof value === "object") {
        // Make a copy so as not to mutate provided value
        const illusionData = {
          ...value,
        };
        if (!isNullOrUndefined(illusionData.fusionSpecies)) {
          switch (typeof illusionData.fusionSpecies) {
            case "object":
              illusionData.fusionSpecies = allSpecies[illusionData.fusionSpecies.speciesId];
              break;
            case "number":
              illusionData.fusionSpecies = allSpecies[illusionData.fusionSpecies];
              break;
            default:
              illusionData.fusionSpecies = undefined;
          }
        }
        this[key] = illusionData as IllusionData;
        continue;
      }

      if (key === "moveset") {
        this.moveset = value?.map((m: any) => PokemonMove.loadMove(m));
        continue;
      }

      if (key === "tags" && Array.isArray(value)) {
        // load battler tags, discarding any that are not serializable
        this.tags = value
          .map((t: SerializableBattlerTag) => loadBattlerTag(t))
          .filter((t): t is SerializableBattlerTag => t instanceof SerializableBattlerTag);
        continue;
      }
      this[key] = value;
    }
  }

  /**
   * Serialize this PokemonSummonData to JSON, converting {@linkcode PokemonSpeciesForm} and {@linkcode IllusionData.fusionSpecies}
   * into simpler types instead of serializing all of their fields.
   *
   * @remarks
   * - `IllusionData.fusionSpecies` is serialized as just the species ID
   * - `PokemonSpeciesForm` and `PokemonSpeciesForm.fusionSpeciesForm` are converted into {@linkcode SerializedSpeciesForm} objects
   */
  public toJSON(): SerializedPokemonSummonData {
    // Pokemon species forms are never saved, only the species ID.
    const illusion = this.illusion;
    const speciesForm = this.speciesForm;
    const fusionSpeciesForm = this.fusionSpeciesForm;
    const illusionSpeciesForm = illusion?.fusionSpecies;
    const t = {
      // the "as omit" is required to avoid TS resolving the overwritten properties to "never"
      // We coerce null to undefined in the type, as the for loop below replaces `null` with `undefined`
      ...(this as Omit<
        CoerceNullPropertiesToUndefined<PokemonSummonData>,
        "speciesForm" | "fusionSpeciesForm" | "illusion"
      >),
      speciesForm: isNullOrUndefined(speciesForm)
        ? undefined
        : { id: speciesForm.speciesId, formIdx: speciesForm.formIndex },
      fusionSpeciesForm: isNullOrUndefined(fusionSpeciesForm)
        ? undefined
        : { id: fusionSpeciesForm.speciesId, formIdx: fusionSpeciesForm.formIndex },
      illusion: isNullOrUndefined(illusion)
        ? undefined
        : {
            ...(this.illusion as Omit<typeof illusion, "fusionSpecies">),
            fusionSpecies: illusionSpeciesForm?.speciesId,
          },
    };
    // Replace `null` with `undefined`, as `undefined` never gets serialized
    for (const [key, value] of Object.entries(t)) {
      if (value === null) {
        t[key] = undefined;
      }
    }
    return t;
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
  /** Tracker for a pending status effect
   *
   * @remarks
   * Set whenever {@linkcode Pokemon#trySetStatus} succeeds in order to prevent subsequent status effects
   * from being applied. Necessary because the status is not actually set until the {@linkcode ObtainStatusEffectPhase} runs,
   * which may not happen before another status effect is attempted to be applied.
   */
  public pendingStatus: StatusEffect = StatusEffect.NONE;
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
