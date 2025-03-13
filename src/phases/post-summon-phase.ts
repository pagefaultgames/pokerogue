import { globalScene } from "#app/global-scene";
import type { BattlerIndex } from "#app/battle";
import { applyAbAttrs, applyPostSummonAbAttrs, CommanderAbAttr, PostSummonAbAttr } from "#app/data/ability";
import { ArenaTrapTag } from "#app/data/arena-tag";
import { StatusEffect } from "#app/enums/status-effect";
import { PokemonPhase } from "./pokemon-phase";
import { MysteryEncounterPostSummonTag } from "#app/data/battler-tags";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Stat } from "#enums/stat";
import { PostSummonActivateAbilityPhase } from "#app/phases/post-summon-activate-ability-phase";

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
    let indexAfterPostSummon = globalScene.phaseQueue.findIndex(phase => !(phase instanceof PostSummonPhase));
    indexAfterPostSummon = indexAfterPostSummon === -1 ? globalScene.phaseQueue.length : indexAfterPostSummon;

    if (
      !this.ordered &&
      globalScene.findPhase(phase => phase instanceof PostSummonPhase && phase.getPokemon() !== pokemon)
    ) {
      globalScene.phaseQueue.splice(indexAfterPostSummon++, 0, new PostSummonPhase(pokemon.getBattlerIndex(), true));

      this.orderPostSummonPhases();
      this.queueAbilityActivationPhases(indexAfterPostSummon);

      this.end();
      return;
    }

    if (!this.ordered) {
      applyPostSummonAbAttrs(PostSummonAbAttr, pokemon, false, (p: number) => p > 0);
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
      applyPostSummonAbAttrs(PostSummonAbAttr, pokemon, false, (p: number) => p <= 0);
    }

    const field = pokemon.isPlayer() ? globalScene.getPlayerField() : globalScene.getEnemyField();
    for (const p of field) {
      applyAbAttrs(CommanderAbAttr, p, null, false);
    }

    this.end();
  }

  /**
   * Sorts the {@linkcode PostSummonPhase}s in the queue by effective speed
   */
  private orderPostSummonPhases() {
    globalScene.sortPhaseType(
      PostSummonPhase,
      (phaseA: PostSummonPhase, phaseB: PostSummonPhase) =>
        phaseB.getPokemon().getEffectiveStat(Stat.SPD) - phaseA.getPokemon().getEffectiveStat(Stat.SPD),
    );

    for (let i = 0; i < globalScene.phaseQueue.length && globalScene.phaseQueue[i] instanceof PostSummonPhase; i++) {
      (globalScene.phaseQueue[i] as PostSummonPhase).ordered = true;
    }
  }

  /**
   * Adds {@linkcode PostSummonActivateAbilityPhase}s for all {@linkcode PostSummonPhase}s in the queue
   * @param endIndex The index of the first non-{@linkcode PostSummonPhase} Phase in the queue, or the length if none exists
   */
  private queueAbilityActivationPhases(endIndex: number) {
    const abilityPhases: PostSummonActivateAbilityPhase[] = [];

    globalScene.phaseQueue.slice(0, endIndex).forEach((phase: PostSummonPhase) => {
      const phasePokemon = phase.getPokemon();

      phasePokemon
        .getAbilityPriorities()
        .forEach(priority =>
          abilityPhases.push(new PostSummonActivateAbilityPhase(phasePokemon.getBattlerIndex(), priority)),
        );
    });

    abilityPhases.sort(
      (phaseA: PostSummonActivateAbilityPhase, phaseB: PostSummonActivateAbilityPhase) =>
        phaseB.getPriority() - phaseA.getPriority(),
    );

    let zeroIndex = abilityPhases.findIndex(phase => phase.getPriority() === 0);
    zeroIndex = zeroIndex === -1 ? abilityPhases.length : zeroIndex;

    globalScene.unshiftPhase(...abilityPhases.slice(0, zeroIndex));
    globalScene.phaseQueue.splice(endIndex, 0, ...abilityPhases.slice(zeroIndex));
  }
}
