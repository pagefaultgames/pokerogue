import { globalScene } from "#app/global-scene";
import type { Phase } from "#app/phase";
import { TrickRoomTag } from "#data/arena-tag";
import { DynamicPhaseType } from "#enums/dynamic-phase-type";
import { Stat } from "#enums/stat";
import { ActivatePriorityQueuePhase } from "#phases/activate-priority-queue-phase";
import { PostSummonActivateAbilityPhase } from "#phases/post-summon-activate-ability-phase";
import type { PostSummonPhase } from "#phases/post-summon-phase";
import { BooleanHolder } from "#utils/common";

/**
 * Stores a list of {@linkcode Phase}s
 *
 * Dynamically updates ordering to always pop the highest "priority", based on implementation of {@linkcode reorder}
 */
export abstract class PhasePriorityQueue {
  protected abstract queue: Phase[];

  /**
   * Sorts the elements in the queue
   */
  public abstract reorder(): void;

  /**
   * Calls {@linkcode reorder} and shifts the queue
   * @returns The front element of the queue after sorting
   */
  public pop(): Phase | undefined {
    this.reorder();
    return this.queue.shift();
  }

  /**
   * Adds a phase to the queue
   * @param phase The phase to add
   */
  public push(phase: Phase): void {
    this.queue.push(phase);
  }

  /**
   * Removes all phases from the queue
   */
  public clear(): void {
    this.queue.splice(0, this.queue.length);
  }

  /**
   * Attempt to remove one or more Phases from the current queue.
   * @param phaseFilter - The function to select phases for removal
   * @param removeCount - The maximum number of phases to remove, or `all` to remove all matching phases;
   * default `1`
   * @returns The number of successfully removed phases
   * @todo Remove this eventually once the patchwork bug this is used for is fixed
   */
  public tryRemovePhase(phaseFilter: (phase: Phase) => boolean, removeCount: number | "all" = 1): number {
    if (removeCount === "all") {
      removeCount = this.queue.length;
    } else if (removeCount < 1) {
      return 0;
    }
    let numRemoved = 0;

    do {
      const phaseIndex = this.queue.findIndex(phaseFilter);
      if (phaseIndex === -1) {
        break;
      }
      this.queue.splice(phaseIndex, 1);
      numRemoved++;
    } while (numRemoved < removeCount && this.queue.length > 0);

    return numRemoved;
  }
}

/**
 * Priority Queue for {@linkcode PostSummonPhase} and {@linkcode PostSummonActivateAbilityPhase}
 *
 * Orders phases first by ability priority, then by the {@linkcode Pokemon}'s effective speed
 */
export class PostSummonPhasePriorityQueue extends PhasePriorityQueue {
  protected override queue: PostSummonPhase[] = [];

  public override reorder(): void {
    this.queue.sort((phaseA: PostSummonPhase, phaseB: PostSummonPhase) => {
      if (phaseA.getPriority() === phaseB.getPriority()) {
        return (
          (phaseB.getPokemon().getEffectiveStat(Stat.SPD) - phaseA.getPokemon().getEffectiveStat(Stat.SPD))
          * (isTrickRoom() ? -1 : 1)
        );
      }

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
    const phasePokemon = phase.getPokemon();

    phasePokemon.getAbilityPriorities().forEach((priority, idx) => {
      this.queue.push(new PostSummonActivateAbilityPhase(phasePokemon.getBattlerIndex(), priority, !!idx));
      globalScene.phaseManager.appendToPhase(
        new ActivatePriorityQueuePhase(DynamicPhaseType.POST_SUMMON),
        "ActivatePriorityQueuePhase",
        (p: ActivatePriorityQueuePhase) => p.getType() === DynamicPhaseType.POST_SUMMON,
      );
    });
  }
}

function isTrickRoom(): boolean {
  const speedReversed = new BooleanHolder(false);
  globalScene.arena.applyTags(TrickRoomTag, false, speedReversed);
  return speedReversed.value;
}
