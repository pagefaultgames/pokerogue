/**
 * Abstract base class for item managers. \
 * Stores a `Map` of item IDs to their associated data, with shared methods
 * for querying, retrieving, and altering them.
 *
 * @typeParam Id - The numeric ID of the items being stored
 * @typeParam Data - The data type associated with the given ID; must include
 * @typeParam Specs - The serializable item specification type (Data + `id`).
 */
// NB: To anyone looking at this, please upvote https://github.com/microsoft/TypeScript/issues/7061
// so we can make `Specs` a proper type alias instead of a free type parameter and remove numerous `as Specs` calls
export abstract class ItemManager<Id extends number, Data extends { stack: number; tempStack?: number }> {
  protected readonly items: Map<Id, Data> = new Map();

  /** Look up the item definition's max stack count for the given ID. */
  protected abstract getMaxStackCount(id: Id): number;

  /** Type guard to check whether an input is a full `Specs` object. */
  protected abstract isSpecs(entry: Id | (Data & { id: Id })): entry is Data & { id: Id };

  public getItemSpecs(id: Id): (Data & { id: Id }) | undefined {
    const item = this.items.get(id);
    if (!item) {
      return;
    }
    return {
      ...item,
      id,
    };
  }

  /**
   * Build an item configuration array from all currently held items.
   * @param restrictedIds - If provided, only include items whose ID is in this array.
   */
  // TODO: This is never called with a restricted ID array ever
  // TODO: Would an array/iterator of `Specs` make more sense as a return value?
  // We're literally just bundling these into objects with counts of 1 apiece
  public generateItemConfiguration(restrictedIds: Id[] = []): { entry: Data & { id: Id }; count: number }[] {
    return this.items
      .entries()
      .filter(([iid]) => !restrictedIds.includes(iid))
      .map(([id, item]) => ({ entry: { ...item, id }, count: 1 }))
      .toArray();
  }

  // TODO: Rename to `getAllItemSpecs` or something more illustrative of its functionality
  public generateSaveData(): (Data & { id: Id })[] {
    return this.items
      .entries()
      .map(([id, item]) => ({ ...item, id }))
      .toArray();
  }

  // TODO: Return an iterator for efficiency; we already provide an arity function
  // and polyfill all ES2025 iterator methods
  /**
   * Returns all items currently in the manager.
   * By default, items for which the stack size is temporarily 0 are not included.
   * @param excludeTempStack - Whether the temporary stack should be excluded.
   */
  public getItems(excludeTempStack = false): Id[] {
    const items = Array.from(this.items.keys());
    if (excludeTempStack) {
      return items;
    }
    return items.filter(k => this.getStack(k) > 0);
  }

  public getItemCount(): number {
    return this.items.size;
  }

  // TODO: Consider renaming to `getStackCount`
  /**
   * Returns the stack size of the requested item.
   * This also includes the temporary stack, unless explicitly requested.
   * @param itemType - The item to get the stack for
   * @param excludeTempStack - Whether the temporary stack should be excluded.
   */
  public getStack(itemType: Id, excludeTempStack = false): number {
    const item = this.items.get(itemType);
    if (!item) {
      return 0;
    }
    if (excludeTempStack) {
      return item.stack;
    }
    return item.stack + (item.tempStack ?? 0);
  }

  public hasItem(itemType: Id, excludeTempStack = false): boolean {
    return this.getStack(itemType, excludeTempStack) > 0;
  }

  public isMaxStack(itemType: Id, excludeTempStack = false): boolean {
    const stack = this.getStack(itemType, excludeTempStack);
    return stack >= this.getMaxStackCount(itemType);
  }

  public add(itemType: Data & { id: Id }): boolean;
  public add(itemType: Id | (Data & { id: Id }), qty?: number): boolean;
  public add(itemType: Id | (Data & { id: Id }), qty = 1): boolean {
    if (this.isSpecs(itemType)) {
      return this.addItemWithSpecs(itemType);
    }
    const maxStack = this.getMaxStackCount(itemType);

    const item = this.items.get(itemType);
    if (!item) {
      this.items.set(itemType, { stack: Math.min(qty, maxStack) } as Data);
      return true;
    }

    // TODO: We may want an error message of some kind instead
    if (item.stack < maxStack) {
      item.stack = Math.min(item.stack + qty, maxStack);
      // Update temp stack in case it now exceeds limits
      this.clampTempStack(itemType);
      return true;
    }

    return false;
  }

  private addItemWithSpecs(itemSpecs: Data & { id: Id }): boolean {
    const { id } = itemSpecs;
    const maxStack = this.getMaxStackCount(id);
    const existing = this.items.get(id);

    const tempStack = existing?.stack ?? 0;

    this.items.set(id, {
      ...itemSpecs,
      stack: Math.min(itemSpecs.stack + tempStack, maxStack),
    } as unknown as Data);

    return true;
  }

  /**
   * Adds to the temporary stack for the given item, then clamps the stack size.
   * @param itemType - The item to add.
   * @param qty - How much to increase the stack.
   */
  public addTempStack(itemType: Id, qty: number): boolean {
    if (!this.hasItem(itemType)) {
      this.add(itemType, 0);
    }
    const item = this.items.get(itemType);
    if (!item) {
      return false;
    }
    const tempStack = item.tempStack ?? 0;
    item.tempStack = tempStack + qty;
    this.clampTempStack(itemType);
    return true;
  }

  /**
   * Ensure that the size of the temporary stack is within the limits.
   * stack + tempStack must never be less than 0 or more than the maximum stack size.
   * @param itemType - The item to clamp.
   */
  private clampTempStack(itemType: Id): void {
    const item = this.items.get(itemType);
    if (!item) {
      return;
    }
    const permanentStack = this.getStack(itemType, true);
    const maxStack = this.getMaxStackCount(itemType);
    const tempStack = item.tempStack ?? 0;
    item.tempStack = Phaser.Math.Clamp(tempStack, -permanentStack, maxStack - permanentStack);
  }

  public clearTempStacks(): void {
    for (const item of this.items.values()) {
      item.tempStack = 0;
    }
  }

  // TODO: Merge `removeStack` and `all` into 1 parameter to avoid passing useless values for the former
  public remove(itemType: Id, removeStack = 1, all = false): void {
    const item = this.items.get(itemType);
    if (!item) {
      return;
    }

    item.stack -= removeStack;
    this.clampTempStack(itemType);
    if (all || item.stack <= 0) {
      // TODO: what if tempStack > 0?
      this.items.delete(itemType);
    }
  }

  /**
   * Remove all item data from the manager.
   */
  public clearItems(): void {
    this.items.clear();
  }
}
