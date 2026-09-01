import { globalScene } from "#app/global-scene";
import { PostSummonActivateAbilityPhase } from "#phases/post-summon-activate-ability-phase";
import type { PostSummonPhase } from "#phases/post-summon-phase";
import { DynamicPhasePriorityQueue } from "#queues/pokemon-phase-priority-queue";
import { sortInSpeedOrder } from "#utils/speed-order";

/**
 * Priority Queue for {@linkcode PostSummonPhase} and {@linkcode PostSummonActivateAbilityPhase}
 *
 * Orders phases first by ability priority, then by the {@linkcode Pokemon}'s effective speed
 */
export class PostSummonPhasePriorityQueue extends DynamicPhasePriorityQueue<PostSummonPhase> {
  protected override reorder(): void {
    this.queue = sortInSpeedOrder(this.queue);
    this.queue.sort((phaseA, phaseB) => phaseB.getPriority() - phaseA.getPriority());
  }

  public override push(phase: PostSummonPhase): void {
    super.push(phase);
    this.queueAbilityPhase(phase);
  }

  /**
   * Queues all necessary {@linkcode PostSummonActivateAbilityPhase}s for each pushed {@linkcode PostSummonPhase}
   * @param phase - The {@linkcode PostSummonPhase} that was pushed onto the queue
   */
  private queueAbilityPhase(phase: PostSummonPhase): void {
    if (phase instanceof PostSummonActivateAbilityPhase) {
      return;
    }

    const phasePokemon = phase.getPokemon();

    phasePokemon.getAbilityPriorities().forEach((priority, idx) => {
      const activateAbilityPhase = new PostSummonActivateAbilityPhase(
        phasePokemon.getBattlerIndex(),
        priority,
        idx !== 0,
      );
      globalScene.phaseManager.unshiftPhase(activateAbilityPhase);
    });
  }
}
