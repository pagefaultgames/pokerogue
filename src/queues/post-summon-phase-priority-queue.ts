import { globalScene } from "#app/global-scene";
import { PostSummonActivateAbilityPhase } from "#app/phases/post-summon-activate-ability-phase";
import type { PostSummonPhase } from "#app/phases/post-summon-phase";
import { PokemonPhasePriorityQueue } from "#app/queues/pokemon-phase-priority-queue";
import { sortInSpeedOrder } from "#app/utils/speed-order";

/**
 * Priority Queue for {@linkcode PostSummonPhase} and {@linkcode PostSummonActivateAbilityPhase}
 *
 * Orders phases first by ability priority, then by the {@linkcode Pokemon}'s effective speed
 */

export class PostSummonPhasePriorityQueue extends PokemonPhasePriorityQueue<PostSummonPhase> {
  public override reorder(): void {
    this.queue = sortInSpeedOrder(this.queue, false);
    this.queue.sort((phaseA: PostSummonPhase, phaseB: PostSummonPhase) => {
      return phaseB.getPriority() - phaseA.getPriority();
    });
  }

  public override push(phase: PostSummonPhase): void {
    super.push(phase);
    this.queueAbilityPhase(phase);
  }

  /**
   * Queues all necessary {@linkcode PostSummonActivateAbilityPhase}s for each pushed {@linkcode PostSummonPhase}
   * @param phase The {@linkcode PostSummonPhase} that was pushed onto the queue
   */
  private queueAbilityPhase(phase: PostSummonPhase): void {
    if (phase instanceof PostSummonActivateAbilityPhase) {
      return;
    }

    const phasePokemon = phase.getPokemon();

    phasePokemon.getAbilityPriorities().forEach((priority, idx) => {
      globalScene.phaseManager.unshiftPhase(
        new PostSummonActivateAbilityPhase(phasePokemon.getBattlerIndex(), priority, !!idx),
      );
    });
  }
}
