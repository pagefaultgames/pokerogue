/**
 * Abstract class representing a {@link https://en.wikipedia.org/wiki/Priority_queue#Min-priority_queue | Min-priority queue}.
 *
 * Dynamically updates ordering to always return the "highest priority" item,
 * based on the implementation of {@linkcode reorder}.
 */
export abstract class PriorityQueue<T> {
  /** The items in the queue. */
  protected queue: T[] = [];

  /**
   * Sort the elements currently in the queue.
   * @privateRemarks
   * When sorting, earlier elements should be placed **before** later ones.
   */
  protected abstract reorder(): void;

  /**
   * Reorder the queue before removing and returning the highest priority element.
   * @returns The front-most element of the queue after sorting,
   * or `undefined` if the queue is empty.
   * @sealed
   */
  public pop(): T | undefined {
    if (this.isEmpty()) {
      return;
    }

    this.reorder();
    return this.queue.shift();
  }

  /**
   * Add an element to the queue.
   * @param element - The element to add
   */
  public push(element: T): void {
    this.queue.push(element);
  }

  /**
   * Remove all elements from the queue.
   * @sealed
   */
  public clear(): void {
    this.queue.splice(0, this.queue.length);
  }

  /**
   * @returns Whether the queue is empty
   * @sealed
   */
  public isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Remove the first element in the queue matching a given condition.
   * @param condition - If provided, will restrict the removal to only entries matching the given condition
   * @returns Whether a removal occurred
   */
  public remove(condition: (t: T) => boolean): boolean {
    // Reorder to remove the first element
    this.reorder();
    const index = this.queue.findIndex(condition);
    if (index === -1) {
      return false;
    }

    this.queue.splice(index, 1);
    return true;
  }

  /** @returns An element matching the condition function */
  public find(condition: (t: T) => boolean): T | undefined {
    return this.queue.find(condition);
  }

  /** @returns Whether an element matching the condition function exists */
  public has(condition: (t: T) => boolean): boolean {
    return this.queue.some(condition);
  }
}
