import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#app/battle";
import { applyAbAttrs, applyPriorityBasedAbAttrs, CommanderAbAttr, PostSummonAbAttr } from "#app/data/ability";
import { ArenaTrapTag } from "#app/data/arena-tag";
import { StatusEffect } from "#app/enums/status-effect";
import { PokemonPhase } from "./pokemon-phase";
import { MysteryEncounterPostSummonTag } from "#app/data/battler-tags";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Stat } from "#enums/stat";
import { PostSummonActivateAbilityPhase } from "#app/phases/priority-ability-activation-phase";

export class PostSummonPhase extends PokemonPhase {
  /** Represents whether or not this phase has already been placed in the correct (speed) order */
  private ordered: boolean;

  constructor(battlerIndex?: BattlerIndex, ordered = false) {
    super(battlerIndex);

    this.ordered = ordered;
  }

  start() {
    super.start();

    const pokemon = this.getPokemon();

    if (
      !this.ordered &&
      globalScene.findPhase(phase => phase instanceof PostSummonPhase && phase.getPokemon() !== pokemon)
    ) {
      globalScene.pushPhase(new PostSummonPhase(pokemon.getBattlerIndex(), true));

      this.orderPostSummonPhases();

      this.end();
      return;
    }

    if (!this.ordered) {
      applyPriorityBasedAbAttrs(pokemon, (p: number) => p > 0);
    }

    if (pokemon.status?.effect === StatusEffect.TOXIC) {
      pokemon.status.toxicTurnCount = 0;
    }
    globalScene.arena.applyTags(ArenaTrapTag, false, pokemon);

    // If this is mystery encounter and has post summon phase tag, apply post summon effects
    if (
      globalScene.currentBattle.isBattleMysteryEncounter() &&
      pokemon.findTags(t => t instanceof MysteryEncounterPostSummonTag).length > 0
    ) {
      pokemon.lapseTag(BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON);
    }
    if (!this.ordered) {
      applyPriorityBasedAbAttrs(pokemon, (p: number) => p <= 0);
    }
    const field = pokemon.isPlayer() ? globalScene.getPlayerField() : globalScene.getEnemyField();
    for (const p of field) {
      applyAbAttrs(CommanderAbAttr, p, null, false);
    }

    this.end();
  }

  private orderPostSummonPhases() {
    globalScene.sortPhaseType(
      PostSummonPhase,
      (phaseA: PostSummonPhase, phaseB: PostSummonPhase) =>
        phaseB.getPokemon().getEffectiveStat(Stat.SPD) - phaseA.getPokemon().getEffectiveStat(Stat.SPD),
    );

    const positivePriorityPhases: PostSummonActivateAbilityPhase[] = [];
    const zeroNegativePriorityPhases: PostSummonActivateAbilityPhase[] = [];

    globalScene.phaseQueue.forEach((phase: PostSummonPhase) => {
      phase.ordered = true;
      const phasePokemon = phase.getPokemon();

      for (const priority of phasePokemon.getAbilityPriorities()) {
        (priority > 0 ? positivePriorityPhases : zeroNegativePriorityPhases).push(
          new PostSummonActivateAbilityPhase(phasePokemon.getBattlerIndex(), priority),
        );
      }
    });

    for (const phaseList of [positivePriorityPhases, zeroNegativePriorityPhases]) {
      phaseList.sort(
        (phaseA: PostSummonActivateAbilityPhase, phaseB: PostSummonActivateAbilityPhase) =>
          phaseB.getPriority() - phaseA.getPriority(),
      );
    }

    globalScene.unshiftPhase(...positivePriorityPhases);
    zeroNegativePriorityPhases.forEach(phase => globalScene.pushPhase(phase));
  }
}
