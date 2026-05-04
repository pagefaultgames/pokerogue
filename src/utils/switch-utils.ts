import { globalScene } from "#app/global-scene";
import type { Phase } from "#app/phase";
import type { PhaseManager } from "#app/phase-manager";
import { BattlerIndex } from "#enums/battler-index";
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
   * to ask the player if they would like to switch _BEFORE_ applying on-entrance effects. \
   * If the switch prompt is denied or otherwise rendered ineligible, a regular {@linkcode PostSummonPhase} will be queued immediately after said phase ends.
   * @privateRemarks
   * Ignored when summoning `EnemyPokemon` (for whom `CheckSwitchPhase`s cannot be queued).
   */
  checkSwitch: boolean;

  /**
   * Whether to skip queueing opposing {@linkcode SummonPhase}s when summoning wild enemy Pokemon.
   * @privateRemarks
   * Only used in `EncounterPhase` to circumvent its absolutely abhorrent code structure, as summoning wild Pokemon
   * plays animations directly without an intermediate phase.
   */
  skipEnemySummon: boolean;
}

/**
 * Queue all relevant phases required to add all player and/or enemy Pokemon to the field at battle start. \
 * Encompasses both visual and logical elements, and will actively recall any existing Pokemon as necessary to ensure proper handling.
 * @param params - Parameters used to customize switching behavior.
 * Any excess parameters will be passed to the queued `SummonPhase`s.
 * @see {@linkcode PhaseManager.queueBattlerEntrance} - Function that queues a single entrance sequence for 1 Pokemon
 */
export function queueBattlerEntrancePhases(params: BattlerEntranceParams): void {
  const { double } = globalScene.currentBattle;

  const availablePlayerPartyMembers = globalScene.getPokemonAllowedInBattle();
  const availableEnemyPartyMembers = globalScene.getEnemyParty().filter(p => p.isAllowedInBattle());

  const addPlayer2 = double && availablePlayerPartyMembers.length > 1;
  const addEnemy2 = double && availableEnemyPartyMembers.length > 1;

  // NB: Battle entrance phases use the first 2 party slots since those phases expect it
  const playerMons = globalScene.getPlayerParty().slice(0, addPlayer2 ? 2 : 1);
  const enemyMons = globalScene.getEnemyParty().slice(0, addEnemy2 ? 2 : 1);

  // If the second player mon is already on the field, recall it before toggling double battle position
  if (!double && (playerMons[1]?.isOnField() ?? false)) {
    globalScene.phaseManager.unshiftNew("RecallPhase", BattlerIndex.PLAYER_2);
  }
  globalScene.phaseManager.unshiftNew("ToggleDoublePositionPhase", double);

  const entrancePhases = getBattlerEntrancePhases(playerMons, enemyMons, params);
  globalScene.phaseManager.unshiftPhase(...entrancePhases);
}

// #region Helpers

function getBattlerEntrancePhases(
  playerMons: readonly PlayerPokemon[],
  enemyMons: readonly EnemyPokemon[],
  params: BattlerEntranceParams,
): NonEmptyTuple<Phase> {
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
  playerMons: readonly PlayerPokemon[],
  enemyMons: readonly EnemyPokemon[],
  { skipEnemySummon, ...rest }: BattlerEntranceParams,
): SummonPhase[] {
  const { phaseManager } = globalScene;
  const mons: readonly (PlayerPokemon | EnemyPokemon)[] = skipEnemySummon ? playerMons : [...playerMons, ...enemyMons];

  return mons.map(p => phaseManager.create("SummonPhase", p.getBattlerIndex(), rest));
}

function getIvScannerPhases(enemyMons: readonly EnemyPokemon[]): ScanIvsPhase[] {
  const { phaseManager } = globalScene;

  // do nothing if no IV Scanner is present
  if (!globalScene.findModifier(m => m instanceof IvScannerModifier)) {
    return [];
  }

  return enemyMons.map(p => phaseManager.create("ScanIvsPhase", p.getBattlerIndex()));
}

function getPostSummonPhases(
  battlers: readonly (PlayerPokemon | EnemyPokemon)[],
  { checkSwitch }: BattlerEntranceParams,
): (CheckSwitchPhase | PostSummonPhase)[] {
  const { phaseManager } = globalScene;

  return battlers.map(p =>
    phaseManager.create(p.isPlayer() && checkSwitch ? "CheckSwitchPhase" : "PostSummonPhase", p.getBattlerIndex()),
  );
}

// #endregion Helpers
