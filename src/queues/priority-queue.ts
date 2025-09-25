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
   * @returns The front element of the queue after sorting, or `undefined` if the queue is empty
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
   * Adds an element to the queue
   * @param element The element to add
   */
  public push(element: T): void {
    this.queue.push(element);
  }

  /**
   * Removes all elements from the queue
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
   * Removes the first element matching the condition
   * @param condition - An optional condition function (defaults to a function that always returns `true`)
   * @returns Whether a removal occurred
   */
  public remove(condition: (t: T) => boolean = () => true): boolean {
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
  public find(condition?: (t: T) => boolean): T | undefined {
    return this.queue.find(e => !condition || condition(e));
  }

  /** @returns Whether an element matching the condition function exists */
  public has(condition?: (t: T) => boolean): boolean {
    return this.queue.some(e => !condition || condition(e));
  }
}
