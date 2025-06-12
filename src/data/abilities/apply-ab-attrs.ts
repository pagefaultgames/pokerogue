import type { AbAttrApplyFunc, AbAttrMap, AbAttrString, AbAttrSuccessFunc } from "#app/@types/ability-types";
import type Pokemon from "#app/field/pokemon";
import { globalScene } from "#app/global-scene";
import type { BooleanHolder, NumberHolder } from "#app/utils/common";
import type { BattlerIndex } from "#enums/battler-index";
import type { HitResult } from "#enums/hit-result";
import type { BattleStat, Stat } from "#enums/stat";
import type { StatusEffect } from "#enums/status-effect";
import type { WeatherType } from "#enums/weather-type";
import type { BattlerTag } from "../battler-tags";
import type Move from "../moves/move";
import type { PokemonMove } from "../moves/pokemon-move";
import type { TerrainType } from "../terrain";
import type { Weather } from "../weather";
import type {
  PostBattleInitAbAttr,
  PreDefendAbAttr,
  PostDefendAbAttr,
  PostMoveUsedAbAttr,
  StatMultiplierAbAttr,
  AllyStatMultiplierAbAttr,
  PostSetStatusAbAttr,
  PostDamageAbAttr,
  FieldMultiplyStatAbAttr,
  PreAttackAbAttr,
  ExecutedMoveAbAttr,
  PostAttackAbAttr,
  PostKnockOutAbAttr,
  PostVictoryAbAttr,
  PostSummonAbAttr,
  PreSummonAbAttr,
  PreSwitchOutAbAttr,
  PreLeaveFieldAbAttr,
  PreStatStageChangeAbAttr,
  PostStatStageChangeAbAttr,
  PreSetStatusAbAttr,
  PreApplyBattlerTagAbAttr,
  PreWeatherEffectAbAttr,
  PreWeatherDamageAbAttr,
  PostTurnAbAttr,
  PostWeatherChangeAbAttr,
  PostWeatherLapseAbAttr,
  PostTerrainChangeAbAttr,
  CheckTrappedAbAttr,
  PostBattleAbAttr,
  PostFaintAbAttr,
  PostItemLostAbAttr,
} from "./ability";

function applySingleAbAttrs<T extends AbAttrString>(
  pokemon: Pokemon,
  passive: boolean,
  attrType: T,
  applyFunc: AbAttrApplyFunc<AbAttrMap[T]>,
  successFunc: AbAttrSuccessFunc<AbAttrMap[T]>,
  args: any[],
  gainedMidTurn = false,
  simulated = false,
  messages: string[] = [],
) {
  if (!pokemon?.canApplyAbility(passive) || (passive && pokemon.getPassiveAbility().id === pokemon.getAbility().id)) {
    return;
  }

  const ability = passive ? pokemon.getPassiveAbility() : pokemon.getAbility();
  if (
    gainedMidTurn &&
    ability.getAttrs(attrType).some(attr => {
      attr.is("PostSummonAbAttr") && !attr.shouldActivateOnGain();
    })
  ) {
    return;
  }

  for (const attr of ability.getAttrs(attrType)) {
    const condition = attr.getCondition();
    let abShown = false;
    if ((condition && !condition(pokemon)) || !successFunc(attr, passive)) {
      continue;
    }

    globalScene.phaseManager.setPhaseQueueSplice();

    if (attr.showAbility && !simulated) {
      globalScene.phaseManager.queueAbilityDisplay(pokemon, passive, true);
      abShown = true;
    }
    const message = attr.getTriggerMessage(pokemon, ability.name, args);
    if (message) {
      if (!simulated) {
        globalScene.phaseManager.queueMessage(message);
      }
      messages.push(message);
    }

    applyFunc(attr, passive);

    if (abShown) {
      globalScene.phaseManager.queueAbilityDisplay(pokemon, passive, false);
    }

    if (!simulated) {
      pokemon.waveData.abilitiesApplied.add(ability.id);
    }

    globalScene.phaseManager.clearPhaseQueueSplice();
  }
}

function applyAbAttrsInternal<T extends AbAttrString>(
  attrType: T,
  pokemon: Pokemon | null,
  applyFunc: AbAttrApplyFunc<AbAttrMap[T]>,
  successFunc: AbAttrSuccessFunc<AbAttrMap[T]>,
  args: any[],
  simulated = false,
  messages: string[] = [],
  gainedMidTurn = false,
) {
  for (const passive of [false, true]) {
    if (pokemon) {
      applySingleAbAttrs(pokemon, passive, attrType, applyFunc, successFunc, args, gainedMidTurn, simulated, messages);
      globalScene.phaseManager.clearPhaseQueueSplice();
    }
  }
}

export function applyAbAttrs<T extends AbAttrString>(
  attrType: T,
  pokemon: Pokemon,
  cancelled: BooleanHolder | null,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal<T>(
    attrType,
    pokemon,
    // @ts-expect-error: TODO: fix the error on `cancelled`
    (attr, passive) => attr.apply(pokemon, passive, simulated, cancelled, args),
    (attr, passive) => attr.canApply(pokemon, passive, simulated, args),
    args,
    simulated,
  );
}

// TODO: Improve the type signatures of the following methods / refactor the apply methods

export function applyPostBattleInitAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PostBattleInitAbAttr ? K : never,
  pokemon: Pokemon,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) => (attr as PostBattleInitAbAttr).applyPostBattleInit(pokemon, passive, simulated, args),
    (attr, passive) => (attr as PostBattleInitAbAttr).canApplyPostBattleInit(pokemon, passive, simulated, args),
    args,
    simulated,
  );
}

export function applyPreDefendAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PreDefendAbAttr ? K : never,
  pokemon: Pokemon,
  attacker: Pokemon,
  move: Move | null,
  cancelled: BooleanHolder | null,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) =>
      (attr as PreDefendAbAttr).applyPreDefend(pokemon, passive, simulated, attacker, move, cancelled, args),
    (attr, passive) =>
      (attr as PreDefendAbAttr).canApplyPreDefend(pokemon, passive, simulated, attacker, move, cancelled, args),
    args,
    simulated,
  );
}

export function applyPostDefendAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PostDefendAbAttr ? K : never,
  pokemon: Pokemon,
  attacker: Pokemon,
  move: Move,
  hitResult: HitResult | null,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) =>
      (attr as PostDefendAbAttr).applyPostDefend(pokemon, passive, simulated, attacker, move, hitResult, args),
    (attr, passive) =>
      (attr as PostDefendAbAttr).canApplyPostDefend(pokemon, passive, simulated, attacker, move, hitResult, args),
    args,
    simulated,
  );
}

export function applyPostMoveUsedAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PostMoveUsedAbAttr ? K : never,
  pokemon: Pokemon,
  move: PokemonMove,
  source: Pokemon,
  targets: BattlerIndex[],
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, _passive) => (attr as PostMoveUsedAbAttr).applyPostMoveUsed(pokemon, move, source, targets, simulated, args),
    (attr, _passive) =>
      (attr as PostMoveUsedAbAttr).canApplyPostMoveUsed(pokemon, move, source, targets, simulated, args),
    args,
    simulated,
  );
}

export function applyStatMultiplierAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends StatMultiplierAbAttr ? K : never,
  pokemon: Pokemon,
  stat: BattleStat,
  statValue: NumberHolder,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) =>
      (attr as StatMultiplierAbAttr).applyStatStage(pokemon, passive, simulated, stat, statValue, args),
    (attr, passive) =>
      (attr as StatMultiplierAbAttr).canApplyStatStage(pokemon, passive, simulated, stat, statValue, args),
    args,
  );
}

/**
 * Applies an ally's Stat multiplier attribute
 * @param attrType - {@linkcode AllyStatMultiplierAbAttr} should always be AllyStatMultiplierAbAttr for the time being
 * @param pokemon - The {@linkcode Pokemon} with the ability
 * @param stat - The type of the checked {@linkcode Stat}
 * @param statValue - {@linkcode NumberHolder} containing the value of the checked stat
 * @param checkedPokemon - The {@linkcode Pokemon} with the checked stat
 * @param ignoreAbility - Whether or not the ability should be ignored by the pokemon or its move.
 * @param args - unused
 */
export function applyAllyStatMultiplierAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends AllyStatMultiplierAbAttr ? K : never,
  pokemon: Pokemon,
  stat: BattleStat,
  statValue: NumberHolder,
  simulated = false,
  checkedPokemon: Pokemon,
  ignoreAbility: boolean,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) =>
      (attr as AllyStatMultiplierAbAttr).applyAllyStat(
        pokemon,
        passive,
        simulated,
        stat,
        statValue,
        checkedPokemon,
        ignoreAbility,
        args,
      ),
    (attr, passive) =>
      (attr as AllyStatMultiplierAbAttr).canApplyAllyStat(
        pokemon,
        passive,
        simulated,
        stat,
        statValue,
        checkedPokemon,
        ignoreAbility,
        args,
      ),
    args,
    simulated,
  );
}

export function applyPostSetStatusAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PostSetStatusAbAttr ? K : never,
  pokemon: Pokemon,
  effect: StatusEffect,
  sourcePokemon?: Pokemon | null,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) =>
      (attr as PostSetStatusAbAttr).applyPostSetStatus(pokemon, sourcePokemon, passive, effect, simulated, args),
    (attr, passive) =>
      (attr as PostSetStatusAbAttr).canApplyPostSetStatus(pokemon, sourcePokemon, passive, effect, simulated, args),
    args,
    simulated,
  );
}

export function applyPostDamageAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PostDamageAbAttr ? K : never,
  pokemon: Pokemon,
  damage: number,
  _passive: boolean,
  simulated = false,
  args: any[],
  source?: Pokemon,
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) => (attr as PostDamageAbAttr).applyPostDamage(pokemon, damage, passive, simulated, args, source),
    (attr, passive) => (attr as PostDamageAbAttr).canApplyPostDamage(pokemon, damage, passive, simulated, args, source),
    args,
  );
}
/**
 * Applies a field Stat multiplier attribute
 * @param attrType {@linkcode FieldMultiplyStatAbAttr} should always be FieldMultiplyBattleStatAbAttr for the time being
 * @param pokemon {@linkcode Pokemon} the Pokemon applying this ability
 * @param stat {@linkcode Stat} the type of the checked stat
 * @param statValue {@linkcode NumberHolder} the value of the checked stat
 * @param checkedPokemon {@linkcode Pokemon} the Pokemon with the checked stat
 * @param hasApplied {@linkcode BooleanHolder} whether or not a FieldMultiplyBattleStatAbAttr has already affected this stat
 * @param args unused
 */

export function applyFieldStatMultiplierAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends FieldMultiplyStatAbAttr ? K : never,
  pokemon: Pokemon,
  stat: Stat,
  statValue: NumberHolder,
  checkedPokemon: Pokemon,
  hasApplied: BooleanHolder,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) =>
      (attr as FieldMultiplyStatAbAttr).applyFieldStat(
        pokemon,
        passive,
        simulated,
        stat,
        statValue,
        checkedPokemon,
        hasApplied,
        args,
      ),
    (attr, passive) =>
      (attr as FieldMultiplyStatAbAttr).canApplyFieldStat(
        pokemon,
        passive,
        simulated,
        stat,
        statValue,
        checkedPokemon,
        hasApplied,
        args,
      ),
    args,
  );
}

export function applyPreAttackAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PreAttackAbAttr ? K : never,
  pokemon: Pokemon,
  defender: Pokemon | null,
  move: Move,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) => (attr as PreAttackAbAttr).applyPreAttack(pokemon, passive, simulated, defender, move, args),
    (attr, passive) => (attr as PreAttackAbAttr).canApplyPreAttack(pokemon, passive, simulated, defender, move, args),
    args,
    simulated,
  );
}

export function applyExecutedMoveAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends ExecutedMoveAbAttr ? K : never,
  pokemon: Pokemon,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    attr => (attr as ExecutedMoveAbAttr).applyExecutedMove(pokemon, simulated),
    attr => (attr as ExecutedMoveAbAttr).canApplyExecutedMove(pokemon, simulated),
    args,
    simulated,
  );
}

export function applyPostAttackAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PostAttackAbAttr ? K : never,
  pokemon: Pokemon,
  defender: Pokemon,
  move: Move,
  hitResult: HitResult | null,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) =>
      (attr as PostAttackAbAttr).applyPostAttack(pokemon, passive, simulated, defender, move, hitResult, args),
    (attr, passive) =>
      (attr as PostAttackAbAttr).canApplyPostAttack(pokemon, passive, simulated, defender, move, hitResult, args),
    args,
    simulated,
  );
}

export function applyPostKnockOutAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PostKnockOutAbAttr ? K : never,
  pokemon: Pokemon,
  knockedOut: Pokemon,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) => (attr as PostKnockOutAbAttr).applyPostKnockOut(pokemon, passive, simulated, knockedOut, args),
    (attr, passive) => (attr as PostKnockOutAbAttr).canApplyPostKnockOut(pokemon, passive, simulated, knockedOut, args),
    args,
    simulated,
  );
}

export function applyPostVictoryAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PostVictoryAbAttr ? K : never,
  pokemon: Pokemon,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) => (attr as PostVictoryAbAttr).applyPostVictory(pokemon, passive, simulated, args),
    (attr, passive) => (attr as PostVictoryAbAttr).canApplyPostVictory(pokemon, passive, simulated, args),
    args,
    simulated,
  );
}

export function applyPostSummonAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PostSummonAbAttr ? K : never,
  pokemon: Pokemon,
  passive = false,
  simulated = false,
  ...args: any[]
): void {
  applySingleAbAttrs(
    pokemon,
    passive,
    attrType,
    (attr, passive) => (attr as PostSummonAbAttr).applyPostSummon(pokemon, passive, simulated, args),
    (attr, passive) => (attr as PostSummonAbAttr).canApplyPostSummon(pokemon, passive, simulated, args),
    args,
    false,
    simulated,
  );
}

export function applyPreSummonAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PreSummonAbAttr ? K : never,
  pokemon: Pokemon,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) => (attr as PreSummonAbAttr).applyPreSummon(pokemon, passive, args),
    (attr, passive) => (attr as PreSummonAbAttr).canApplyPreSummon(pokemon, passive, args),
    args,
  );
}

export function applyPreSwitchOutAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PreSwitchOutAbAttr ? K : never,
  pokemon: Pokemon,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) => (attr as PreSwitchOutAbAttr).applyPreSwitchOut(pokemon, passive, simulated, args),
    (attr, passive) => (attr as PreSwitchOutAbAttr).canApplyPreSwitchOut(pokemon, passive, simulated, args),
    args,
    simulated,
  );
}

export function applyPreLeaveFieldAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PreLeaveFieldAbAttr ? K : never,
  pokemon: Pokemon,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) => (attr as PreLeaveFieldAbAttr).applyPreLeaveField(pokemon, passive, simulated, args),
    (attr, passive) => (attr as PreLeaveFieldAbAttr).canApplyPreLeaveField(pokemon, passive, simulated, args),
    args,
    simulated,
  );
}

export function applyPreStatStageChangeAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PreStatStageChangeAbAttr ? K : never,
  pokemon: Pokemon | null,
  stat: BattleStat,
  cancelled: BooleanHolder,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) =>
      (attr as PreStatStageChangeAbAttr).applyPreStatStageChange(pokemon, passive, simulated, stat, cancelled, args),
    (attr, passive) =>
      (attr as PreStatStageChangeAbAttr).canApplyPreStatStageChange(pokemon, passive, simulated, stat, cancelled, args),
    args,
    simulated,
  );
}

export function applyPostStatStageChangeAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PostStatStageChangeAbAttr ? K : never,
  pokemon: Pokemon,
  stats: BattleStat[],
  stages: number,
  selfTarget: boolean,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, _passive) =>
      (attr as PostStatStageChangeAbAttr).applyPostStatStageChange(pokemon, simulated, stats, stages, selfTarget, args),
    (attr, _passive) =>
      (attr as PostStatStageChangeAbAttr).canApplyPostStatStageChange(
        pokemon,
        simulated,
        stats,
        stages,
        selfTarget,
        args,
      ),
    args,
    simulated,
  );
}

export function applyPreSetStatusAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PreSetStatusAbAttr ? K : never,
  pokemon: Pokemon,
  effect: StatusEffect | undefined,
  cancelled: BooleanHolder,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) =>
      (attr as PreSetStatusAbAttr).applyPreSetStatus(pokemon, passive, simulated, effect, cancelled, args),
    (attr, passive) =>
      (attr as PreSetStatusAbAttr).canApplyPreSetStatus(pokemon, passive, simulated, effect, cancelled, args),
    args,
    simulated,
  );
}

export function applyPreApplyBattlerTagAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PreApplyBattlerTagAbAttr ? K : never,
  pokemon: Pokemon,
  tag: BattlerTag,
  cancelled: BooleanHolder,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) =>
      (attr as PreApplyBattlerTagAbAttr).applyPreApplyBattlerTag(pokemon, passive, simulated, tag, cancelled, args),
    (attr, passive) =>
      (attr as PreApplyBattlerTagAbAttr).canApplyPreApplyBattlerTag(pokemon, passive, simulated, tag, cancelled, args),
    args,
    simulated,
  );
}

export function applyPreWeatherEffectAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PreWeatherEffectAbAttr ? K : never,
  pokemon: Pokemon,
  weather: Weather | null,
  cancelled: BooleanHolder,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) =>
      (attr as PreWeatherDamageAbAttr).applyPreWeatherEffect(pokemon, passive, simulated, weather, cancelled, args),
    (attr, passive) =>
      (attr as PreWeatherDamageAbAttr).canApplyPreWeatherEffect(pokemon, passive, simulated, weather, cancelled, args),
    args,
    simulated,
  );
}

export function applyPostTurnAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PostTurnAbAttr ? K : never,
  pokemon: Pokemon,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) => (attr as PostTurnAbAttr).applyPostTurn(pokemon, passive, simulated, args),
    (attr, passive) => (attr as PostTurnAbAttr).canApplyPostTurn(pokemon, passive, simulated, args),
    args,
    simulated,
  );
}

export function applyPostWeatherChangeAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PostWeatherChangeAbAttr ? K : never,
  pokemon: Pokemon,
  weather: WeatherType,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) =>
      (attr as PostWeatherChangeAbAttr).applyPostWeatherChange(pokemon, passive, simulated, weather, args),
    (attr, passive) =>
      (attr as PostWeatherChangeAbAttr).canApplyPostWeatherChange(pokemon, passive, simulated, weather, args),
    args,
    simulated,
  );
}

export function applyPostWeatherLapseAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PostWeatherLapseAbAttr ? K : never,
  pokemon: Pokemon,
  weather: Weather | null,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) =>
      (attr as PostWeatherLapseAbAttr).applyPostWeatherLapse(pokemon, passive, simulated, weather, args),
    (attr, passive) =>
      (attr as PostWeatherLapseAbAttr).canApplyPostWeatherLapse(pokemon, passive, simulated, weather, args),
    args,
    simulated,
  );
}

export function applyPostTerrainChangeAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PostTerrainChangeAbAttr ? K : never,
  pokemon: Pokemon,
  terrain: TerrainType,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) =>
      (attr as PostTerrainChangeAbAttr).applyPostTerrainChange(pokemon, passive, simulated, terrain, args),
    (attr, passive) =>
      (attr as PostTerrainChangeAbAttr).canApplyPostTerrainChange(pokemon, passive, simulated, terrain, args),
    args,
    simulated,
  );
}

export function applyCheckTrappedAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends CheckTrappedAbAttr ? K : never,
  pokemon: Pokemon,
  trapped: BooleanHolder,
  otherPokemon: Pokemon,
  messages: string[],
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) =>
      (attr as CheckTrappedAbAttr).applyCheckTrapped(pokemon, passive, simulated, trapped, otherPokemon, args),
    (attr, passive) =>
      (attr as CheckTrappedAbAttr).canApplyCheckTrapped(pokemon, passive, simulated, trapped, otherPokemon, args),
    args,
    simulated,
    messages,
  );
}

export function applyPostBattleAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PostBattleAbAttr ? K : never,
  pokemon: Pokemon,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) => (attr as PostBattleAbAttr).applyPostBattle(pokemon, passive, simulated, args),
    (attr, passive) => (attr as PostBattleAbAttr).canApplyPostBattle(pokemon, passive, simulated, args),
    args,
    simulated,
  );
}

export function applyPostFaintAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PostFaintAbAttr ? K : never,
  pokemon: Pokemon,
  attacker?: Pokemon,
  move?: Move,
  hitResult?: HitResult,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, passive) =>
      (attr as PostFaintAbAttr).applyPostFaint(pokemon, passive, simulated, attacker, move, hitResult, args),
    (attr, passive) =>
      (attr as PostFaintAbAttr).canApplyPostFaint(pokemon, passive, simulated, attacker, move, hitResult, args),
    args,
    simulated,
  );
}

export function applyPostItemLostAbAttrs<K extends AbAttrString>(
  attrType: AbAttrMap[K] extends PostItemLostAbAttr ? K : never,
  pokemon: Pokemon,
  simulated = false,
  ...args: any[]
): void {
  applyAbAttrsInternal(
    attrType,
    pokemon,
    (attr, _passive) => (attr as PostItemLostAbAttr).applyPostItemLost(pokemon, simulated, args),
    (attr, _passive) => (attr as PostItemLostAbAttr).canApplyPostItemLost(pokemon, simulated, args),
    args,
  );
}

/**
 * Applies abilities when they become active mid-turn (ability switch)
 *
 * Ignores passives as they don't change and shouldn't be reapplied when main abilities change
 */
export function applyOnGainAbAttrs(pokemon: Pokemon, passive = false, simulated = false, ...args: any[]): void {
  applySingleAbAttrs(
    pokemon,
    passive,
    "PostSummonAbAttr",
    (attr, passive) => attr.applyPostSummon(pokemon, passive, simulated, args),
    (attr, passive) => attr.canApplyPostSummon(pokemon, passive, simulated, args),
    args,
    true,
    simulated,
  );
}
/**
 * Applies ability attributes which activate when the ability is lost or suppressed (i.e. primal weather)
 */
export function applyOnLoseAbAttrs(pokemon: Pokemon, passive = false, simulated = false, ...args: any[]): void {
  applySingleAbAttrs(
    pokemon,
    passive,
    "PreLeaveFieldAbAttr",
    (attr, passive) => attr.applyPreLeaveField(pokemon, passive, simulated, [...args, true]),
    (attr, passive) => attr.canApplyPreLeaveField(pokemon, passive, simulated, [...args, true]),
    args,
    true,
    simulated,
  );

  applySingleAbAttrs(
    pokemon,
    passive,
    "IllusionBreakAbAttr",
    (attr, passive) => attr.apply(pokemon, passive, simulated, null, args),
    (attr, passive) => attr.canApply(pokemon, passive, simulated, args),
    args,
    true,
    simulated,
  );
}
