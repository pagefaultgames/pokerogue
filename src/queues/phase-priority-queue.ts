/**
 * Stores a list of elements.
 *
 * Dynamically updates ordering to always pop the highest "priority", based on implementation of {@linkcode reorder}.
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
    return this.queue.length === 0;
  }

  /**
   * Removes the first element matching the condition
   * @param condition - A condition function
   * @returns `true` if a removal occurred, `false` otherwise
   *
   * @remarks
   * {@linkcode reorder} is not called by this method, so the removal is not guaranteed to be the true "first" element.
   */
  public remove(condition?: (t: T) => boolean): boolean {
    const phaseIndex = this.queue.findIndex(condition ?? (() => true));
    if (phaseIndex > -1) {
      this.queue.splice(phaseIndex, 1);
      return true;
    }
    return false;
  }

  /** Returns a phase matching the condition */
  public findPhase(condition?: (t: T) => boolean): T | undefined {
    return this.queue.find(phase => !condition || condition(phase));
  }

  /** Returns if a phase matching the condition exists */
  public hasPhaseWithCondition(condition?: (t: T) => boolean): boolean {
    return this.queue.find(phase => !condition || condition(phase)) !== undefined;
  }
}
