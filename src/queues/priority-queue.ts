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
   * Adds an element to the queue
   * @param element The element to add
   */
  public push(element: T): void {
    this.queue.push(element);
  }

  /**
   * Removes all elements from the queue
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
    const index = this.queue.findIndex(condition ?? (() => true));
    if (index > -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /** Returns an element matching the condition */
  public find(condition?: (t: T) => boolean): T | undefined {
    return this.queue.find(e => !condition || condition(e));
  }

  /** Returns if an element matching the condition exists */
  public has(condition?: (t: T) => boolean): boolean {
    return this.queue.find(e => !condition || condition(e)) !== undefined;
  }
}
