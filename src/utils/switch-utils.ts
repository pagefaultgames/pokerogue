import { globalScene } from "#app/global-scene";
import type { Phase } from "#app/phase";
import type { FieldBattlerIndex } from "#enums/battler-index";
import type { EnemyPokemon, PlayerPokemon } from "#field/pokemon";
import type { CheckSwitchPhase } from "#phases/check-switch-phase";
import type { PostSummonPhase } from "#phases/post-summon-phase";
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
  checkSwitch?: boolean;

  /**
   * Whether to skip queueing opposing {@linkcode SummonPhase}s when summoning wild enemy Pokemon.
   * @defaultValue `true`
   * @privateRemarks
   * Only used in `EncounterPhase` to circumvent its absolutely abhorrent code structure.
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
export function queueBattlerEntrancePhases(params: BattlerEntranceParams = {}): void {
  const { double } = globalScene.currentBattle;

  const addPlayer2 = double && globalScene.getPlayerParty().filter(p => p.isAllowedInBattle()).length > 1;
  const addEnemy2 = double && globalScene.getEnemyParty().filter(p => p.isAllowedInBattle()).length > 1;

  const phases = getBattlerEntrancePhases(addPlayer2, addEnemy2, params);
  globalScene.phaseManager.unshiftPhase(...phases);
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
    ...getPostSummonPhases([...playerMons, ...enemyMons], params),
  ] as unknown as NonEmptyTuple<Phase>;

  return phases;
}

function getSummonPhases(
  playerMons: PlayerPokemon[],
  enemyMons: EnemyPokemon[],
  { skipEnemySummon, ...rest }: BattlerEntranceParams,
): SummonPhase[] {
  const { phaseManager } = globalScene;
  const mons = skipEnemySummon ? playerMons : [...playerMons, ...enemyMons];

  return mons.map((p, i) => {
    const index: FieldBattlerIndex = i + (p.isPlayer() ? 0 : 2);
    return phaseManager.create("SummonPhase", index, rest);
  });
}

function getPostSummonPhases(
  mons: (PlayerPokemon | EnemyPokemon)[],
  { checkSwitch }: BattlerEntranceParams,
): (CheckSwitchPhase | PostSummonPhase)[] {
  const { phaseManager } = globalScene;

  // NB: this
  return mons.map((p, i) => {
    const index: FieldBattlerIndex = i + (p.isPlayer() ? 0 : 2);
    return phaseManager.create(checkSwitch ? "CheckSwitchPhase" : "PostSummonPhase", index);
  });
}
//#endregion Helpers
