import { globalScene } from "#app/global-scene";
import type { Phase } from "#app/phase";
import type { EnemyPokemon, PlayerPokemon } from "#field/pokemon";
import { IvScannerModifier } from "#modifiers/modifier";
import type { CheckSwitchPhase } from "#phases/check-switch-phase";
import type { PostSummonPhase } from "#phases/post-summon-phase";
import type { ScanIvsPhase } from "#phases/scan-ivs-phase";
import type { SummonPhase, SummonPhaseOptions } from "#phases/summon-phase";
import type { NonEmptyTuple } from "type-fest";

/**
 * Options type for {@linkcode queueBattlerEntrancePhases}.
 */
interface BattlerEntranceParams extends SummonPhaseOptions {
  /**
   * Whether to queue {@linkcode CheckSwitchPhase}s instead of {@linkcode PostSummonPhase}s for player pokemon
   * to ask the player if they would like to switch _BEFORE_ applying on-entrance effects.
   * If the switch prompt is denied, a regular {@linkcode PostSummonPhase} will be queued after said phase ends.
   * @defaultValue `true`
   * @privateRemarks
   * Ignored when summoning `EnemyPokemon` (for whom `CheckSwitchPhase`s cannot be queued).
   */
  checkSwitch: boolean;

  /**
   * Whether to skip queueing opposing {@linkcode SummonPhase}s when summoning wild enemy Pokemon.
   * @defaultValue `true`
   * @privateRemarks
   * Only used in `EncounterPhase` to circumvent its absolutely abhorrent code structure, as summoning wild Pokemon
   * queues animations directly without an intermediate phase.
   */
  skipEnemySummon?: boolean;
}

/**
 * Queue a sequence of phases to add all player and/or enemy Pokemon to the field. \
 * Encompasses both visual and logical elements, and checks whether each individual Pokemon
 * is already on field before attempting to summon them.
 * @param params - Parameters used to customize switching behavior.
 * Any excess parameters will be passed to the the queued `SummonPhase`s.
 */
export function queueBattlerEntrancePhases(params: BattlerEntranceParams): void {
  const { double } = globalScene.currentBattle;

  const addPlayer2 = double && globalScene.getPlayerParty().filter(p => p.isAllowedInBattle()).length > 1;
  const addEnemy2 = double && globalScene.getEnemyParty().filter(p => p.isAllowedInBattle()).length > 1;

  const phases = getBattlerEntrancePhases(addPlayer2, addEnemy2, params);
  globalScene.phaseManager.unshiftPhase(phases[0], ...phases.slice(1));
}

//#region Helpers
function getBattlerEntrancePhases(
  addPlayer2: boolean,
  addEnemy2: boolean,
  params: BattlerEntranceParams,
): NonEmptyTuple<Phase> {
  const playerMons = globalScene.getPlayerParty().slice(0, 1 + +addPlayer2);
  const enemyMons = globalScene.getEnemyParty().slice(0, 1 + +addEnemy2);

  // Type assertion is valid as these will always unshift at least 1 phase
  const phases = [
    ...getSummonPhases(playerMons, enemyMons, params),
    ...getIvScannerPhases(enemyMons),
    ...getPostSummonPhases([...playerMons, ...enemyMons], params),
  ] as const;

  if (phases.length === 0) {
    // This should never happen
    throw new Error("No phases were queued for battler entrances!");
  }
  return phases as unknown as NonEmptyTuple<(typeof phases)[number]>;
}

function getSummonPhases(
  playerMons: PlayerPokemon[],
  enemyMons: EnemyPokemon[],
  { skipEnemySummon, ...rest }: BattlerEntranceParams,
): SummonPhase[] {
  const { phaseManager } = globalScene;
  const mons = skipEnemySummon ? playerMons : [...playerMons, ...enemyMons];

  return mons.map(p => phaseManager.create("SummonPhase", p.getBattlerIndex(), rest));
}

function getIvScannerPhases(enemyMons: EnemyPokemon[]): ScanIvsPhase[] {
  const { phaseManager } = globalScene;

  // do nothing if no IV Scanner is present
  if (!globalScene.findModifier(m => m instanceof IvScannerModifier)) {
    return [];
  }

  return enemyMons.map(p => phaseManager.create("ScanIvsPhase", p.getBattlerIndex()));
}

function getPostSummonPhases(
  mons: (PlayerPokemon | EnemyPokemon)[],
  { checkSwitch }: BattlerEntranceParams,
): (CheckSwitchPhase | PostSummonPhase)[] {
  const { phaseManager } = globalScene;

  return mons.map(p =>
    phaseManager.create(p.isPlayer() && checkSwitch ? "CheckSwitchPhase" : "PostSummonPhase", p.getBattlerIndex()),
  );
}
//#endregion Helpers
