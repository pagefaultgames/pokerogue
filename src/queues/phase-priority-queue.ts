/**
 * Stores a list of {@linkcode Phase}s
 *
 * Dynamically updates ordering to always pop the highest "priority", based on implementation of {@linkcode reorder}
 */
export abstract class PriorityQueue<T> {
  protected queue: T[] = [];

  /**
   * Sorts the elements in the queue
   */
  protected abstract reorder(): void;

  /**
   * Calls {@linkcode reorder} and shifts the queue
   * @returns The front element of the queue after sorting
   */
  public pop(): T | undefined {
    this.reorder();
    return this.queue.shift();
  }

  /**
   * Adds a phase to the queue
   * @param phase The phase to add
   */
  public push(phase: T): void {
    this.queue.push(phase);
  }

  /**
   * Removes all phases from the queue
   */
  public clear(): void {
    this.queue.splice(0, this.queue.length);
  }

  public isEmpty(): boolean {
    return !this.queue.length;
  }

  public remove(condition?: (t: T) => boolean): boolean {
    const phaseIndex = this.queue.findIndex(condition ?? (() => true));
    if (phaseIndex > -1) {
      this.queue.splice(phaseIndex, 1);
      return true;
    }
    return false;
  }

  public findPhase(condition?: (t: T) => boolean): T | undefined {
    return this.queue.find(phase => !condition || condition(phase));
  }

  public hasPhaseWithCondition(condition?: (t: T) => boolean): boolean {
    return this.queue.find(phase => !condition || condition(phase)) !== undefined;
  }
}
