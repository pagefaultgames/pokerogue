// biome-ignore lint/correctness/noUnusedImports: TSDoc
import type { BattleScene } from "#app/battle-scene";
import type { BattleType } from "#enums/battle-type";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import type { Trainer } from "#field/trainer";
import type { TrainerData } from "#system/trainer-data";

/**
 * @module
 * A collection of types/interfaces used for {@linkcode BattleScene.newBattle} and associated
 * sub-methods.
 *
 * Types are listed in order of appearance in the function.
 */

/** Interface representing the base type of a new battle config, used for DRY. */
interface NewBattleBaseProps {
  /** The type of battle to create. */
  battleType: BattleType;
  /**
   * The `Trainer` to spawn.
   * Only present in populated data and will be `undefined` for non-trainer battles.
   */
  trainer?: Trainer;
  /**
   * Saved data used to initialize the trainer.
   * Only present in data initialized from a saved session,
   * and will be `undefined` for non-trainer battles.
   */
  trainerData?: TrainerData;
  /**
   * The type of Mystery Encounter to spawn.
   * Only present in data initialized from a saved session,
   * and will be `undefined` for non-ME battles.
   */
  mysteryEncounterType?: MysteryEncounterType;
  /**
   * The wave number of the NEW wave to spawn.
   * Will always be >=1 (barring save data corruption).
   */
  waveIndex: number;
  /**
   * Whether the battle is a double battle.
   * Always `false` when an ME is spawned.
   */
  double?: boolean;
}

/**
 * Interface representing the return type of {@linkcode BattleScene.getNewBattleProps}, used
 * when converting session data into a new battle.
 * @interface
 */
export type NewBattleProps = Omit<NewBattleBaseProps, "trainer">;

/**
 * Interface representing the type of a new battle.
 *
 * @interface
 * @privateRemarks
 * The reason all "missing" properties are marked as `Partial` rather than simply being `undefined`
 * is to allow assignment during function calls.
 */
export type NewBattleInitialProps = Partial<NewBattleResolvedProps> & Pick<NewBattleResolvedProps, "waveIndex">;

/**
 * Interface representing the type of a partially resolved new battle config, used when passing stuff around midway through.
 * Only contains properties known to be present after all 3 sub-methods finish execution.
 * @interface
 */
export type NewBattleConstructedProps = Partial<NewBattleResolvedProps> &
  Pick<NewBattleResolvedProps, "waveIndex" | "battleType">;

/**
 * Interface representing the fully resolved type of a new battle config, used to create a new Battle instance.
 * @interface
 */
export type NewBattleResolvedProps = Omit<NewBattleBaseProps, "trainerConfig" | "trainerData">;
