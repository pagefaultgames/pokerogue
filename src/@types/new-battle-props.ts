/**
 * A collection of types/interfaces used for {@linkcode BattleScene.newBattle} and associated
 * sub-methods.
 *
 * Types are listed in order of appearance in the function.
 * @module
 */

import type { Battle } from "#app/battle";
import type { BattleScene } from "#app/battle-scene";
import type { BattleType } from "#enums/battle-type";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import type { Trainer } from "#field/trainer";
import type { TrainerData } from "#system/trainer-data";
import type { SetOptional, SetRequired } from "type-fest";

/**
 * Interface representing the base type of a new battle config, used for DRY.
 * @internal
 */
interface NewBattleBaseProps {
  /** The type of battle to create. */
  battleType: BattleType;
  /**
   * The `Trainer` to spawn.
   * Only present in processed data and will be `undefined` for non-trainer battles.
   */
  trainer?: Trainer | undefined;
  /**
   * Saved data used to initialize the trainer.
   * Only present in data initialized from a saved session,
   * and will be `undefined` for non-trainer battles.
   */
  trainerData?: TrainerData | undefined;
  /**
   * The type of Mystery Encounter to spawn.
   * Only present in data initialized from a saved session,
   * and will be `undefined` for non-ME battles.
   */
  mysteryEncounterType?: MysteryEncounterType | undefined;
  /**
   * The wave number of the NEW wave to spawn.
   * Will always be `>=1` (barring save data corruption).
   */
  waveIndex: number;
  /**
   * Whether the battle is a double battle.
   *
   * ⚠️ Mystery Encounters will ignore this property
   * and set it to `false`.
   */
  double?: boolean | undefined;
}

/**
 * Interface representing the return type of {@linkcode BattleScene.getNewBattleProps}, used
 * when converting session data into a new battle.
 */
export interface NewBattleProps extends Omit<NewBattleBaseProps, "trainer"> {}

/**
 * Interface representing the type of a new battle config as it is constructed.
 *
 * @privateRemarks
 * The reason all "missing" properties are marked as `Partial` rather than simply being `undefined`
 * is to allow assignment during function calls.
 */
export interface NewBattleInitialProps extends SetOptional<NewBattleBaseProps, "battleType"> {}

/**
 * Interface representing the type of a partially resolved new battle config, used during double battle generation.
 * Only contains properties known to be present after all 3 sub-methods finish resolving.
 */
export interface NewBattleConstructedProps extends NewBattleBaseProps {}

/**
 * Interface representing the fully resolved type of a new battle config, used to create a new {@linkcode Battle} instance.
 */
export interface NewBattleResolvedProps extends SetRequired<Omit<NewBattleBaseProps, "trainerData">, "double"> {}
