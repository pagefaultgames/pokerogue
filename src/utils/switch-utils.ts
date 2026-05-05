import { globalScene } from "#app/global-scene";
import type { Phase } from "#app/phase";
import type { PhaseManager } from "#app/phase-manager";
import { IS_TEST } from "#constants/app-constants";
import { BattlerIndex } from "#enums/battler-index";
import type { EnemyPokemon, PlayerPokemon } from "#field/pokemon";
import { IvScannerModifier } from "#modifiers/modifier";
import type { CheckSwitchPhase } from "#phases/check-switch-phase";
import type { PostSummonPhase } from "#phases/post-summon-phase";
import type { RecallPhase } from "#phases/recall-phase";
import type { ScanIvsPhase } from "#phases/scan-ivs-phase";
import type { SummonPhase, SummonPhaseOptions } from "#phases/summon-phase";
import type { ToggleDoublePositionPhase } from "#phases/toggle-double-position-phase";
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
   * Whether to skip queueing {@linkcode SummonPhase}s when summoning wild enemy Pokemon.
   * @privateRemarks
   * Only used in `EncounterPhase` to circumvent its absolutely abhorrent code structure, as summoning wild Pokemon
   * plays animations directly without an intermediate phase (while trainers play their animation during a separate phase).
   */
  skipEnemySummon: boolean;

  /**
   * Whether to summon Pokemon and queue phases as if loading from a save file.
   * @remarks
   * This notably skips queueing the phases used for single->double and double->single battle transition.
   */
  readonly loaded?: boolean;
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

  // NB: Battle entrance phases use the first 2 party slots instead of the first 2 available party members
  // TODO: This assumption may actually be the root cause of the "invalid summon" errors in SummonPhase;
  // we should revisit this at a later date
  const playerMons = globalScene.getPlayerParty().slice(0, addPlayer2 ? 2 : 1);
  const enemyMons = globalScene.getEnemyParty().slice(0, addEnemy2 ? 2 : 1);

  // TODO: Consider reworking the code to use iterators instead of arrays
  const phases = [
    // NB: Any required `ShinySparklePhase`s are queued by the unshifted `SummonPhase`s
    ...getEnemySummonPhases(enemyMons, params),
    ...getPlayerSummonPhases(playerMons, availablePlayerPartyMembers, params),
    ...getIvScannerPhases(enemyMons),
    ...getPostSummonPhases([...playerMons, ...enemyMons], params),
  ] as const;

  // The above should ALWAYS unshift at least 1 phase (to summon the player party), so we throw an error in tests to ensure the invariant isn't violated
  // (and let vite remove it during prod)
  if (IS_TEST && phases.length === 0) {
    throw new Error("No phases were queued for battler entrances!");
  }

  globalScene.phaseManager.unshiftPhase(...(phases as unknown as NonEmptyTuple<Phase>));
}

/**
 * Obtain the {@linkcode SummonPhase}s for all enemy Pokemon, if any.
 * Returns an empty array when `skipEnemySummon` is set (e.g. for wild encounters where enemies are placed directly).
 * @param enemyMons - The enemy pokemon entering battle
 * @returns The {@linkcode SummonPhase}s to be queued for the enemy Pokemon
 */
function getEnemySummonPhases(
  enemyMons: readonly EnemyPokemon[],
  { skipEnemySummon, ...summonPhaseOpts }: BattlerEntranceParams,
): SummonPhase[] {
  if (skipEnemySummon) {
    return [];
  }

  const { phaseManager } = globalScene;
  return enemyMons.map(p => phaseManager.create("SummonPhase", p.getBattlerIndex(), summonPhaseOpts));
}

/**
 * Obtain the {@linkcode SummonPhase}s (and any necessary {@linkcode RecallPhase} / {@linkcode ToggleDoublePositionPhase}s)
 * required to bring all player Pokemon onto the field at battle start.
 * @param playerMons - The first 1-2 pokemon in the player's party; assumed to be slated to enter the field
 */
function getPlayerSummonPhases(
  playerMons: readonly PlayerPokemon[],
  availablePlayerPartyMembers: readonly PlayerPokemon[],
  { skipEnemySummon: _skip, checkSwitch: _cs, ...summonPhaseOpts }: BattlerEntranceParams,
): (SummonPhase | RecallPhase | ToggleDoublePositionPhase)[] {
  const { phaseManager } = globalScene;
  const { loaded } = summonPhaseOpts;

  const transitionPhases = loaded ? [] : getTransitionPhases(availablePlayerPartyMembers);

  return [
    phaseManager.create("SummonPhase", playerMons[0].getBattlerIndex(), summonPhaseOpts),
    ...transitionPhases,
    ...playerMons.slice(1).map(p => phaseManager.create("SummonPhase", p.getBattlerIndex(), summonPhaseOpts)),
  ];
}

/**
 * Obtain the phases to be queued to ensure proper transitions
 */
function getTransitionPhases(
  availablePlayerPartyMembers: readonly PlayerPokemon[],
): readonly (RecallPhase | ToggleDoublePositionPhase)[] {
  const { phaseManager } = globalScene;
  const { double } = globalScene.currentBattle;

  const transitionPhases: (RecallPhase | ToggleDoublePositionPhase)[] = [];

  transitionPhases.push(phaseManager.create("ToggleDoublePositionPhase", double));
  // If the second player mon is already on the field, recall it before toggling double battle position
  if (!double && availablePlayerPartyMembers[1]?.isOnField()) {
    transitionPhases.push(phaseManager.create("RecallPhase", BattlerIndex.PLAYER_2));
  }

  return transitionPhases;
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
