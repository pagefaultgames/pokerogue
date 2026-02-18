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
export abstract class ItemManager<
  Id extends number,
  // TODO: Restrict `Data` to have `stack` as the only allowed non-optional property (which would hopefully shut up the type errors);
  // this will be untenable until after a beta merge since `exactOptionalPropertyTypes` is disabled atm
  Data extends { stack: number },
  Specs extends Data & { id: Id } = Data & { id: Id },
> {
  protected readonly items: Map<Id, Data> = new Map();

  /** Look up the item definition's max stack count for the given ID. */
  protected abstract getMaxStackCount(id: Id): number;

  /** Type guard to check whether an input is a full `Specs` object. */
  protected abstract isSpecs(entry: Id | Specs): entry is Specs;

  public getItemSpecs(id: Id): Specs | undefined {
    const item = this.items.get(id);
    if (!item) {
      return;
    }
    return {
      ...item,
      id,
    } as Specs;
  }

  /**
   * Build an item configuration array from all currently held items.
   * @param restrictedIds - If provided, only include items whose ID is in this array.
   */
  // TODO: This is never called with a restricted ID array ever
  // TODO: Would an array of `Specs` make more sense as a return value?
  // We're literally just bundling these into objects with counts of 1 apiece
  public generateItemConfiguration(restrictedIds?: Id[]): { entry: Specs; count: 1 }[] {
    const config: { entry: Specs; count: 1 }[] = [];
    for (const [id, item] of this.items) {
      if (!restrictedIds || restrictedIds.includes(id)) {
        const specs = { ...item, id } as Specs;
        config.push({ entry: specs, count: 1 });
      }
    }
    return config;
  }

  // TODO: Rename to `getAllItemSpecs` or something more illustrative of its functionality
  public generateSaveData(): Specs[] {
    const saveData: Specs[] = [];
    for (const [id, item] of this.items) {
      const specs = { ...item, id } as Specs;
      saveData.push(specs);
    }
    return saveData;
  }

  // TODO: Return an iterator for efficiency; we already provide an arity function
  // and polyfill all ES2025 iterator methods
  public getItems(): Id[] {
    return Array.from(this.items.keys());
  }

  public getItemCount(): number {
    return this.items.size;
  }

  public hasItem(itemType: Id): boolean {
    return this.items.has(itemType);
  }

  // TODO: Consider renaming to `getStackCount`
  public getStack(itemType: Id): number {
    const item = this.items.get(itemType);
    return item?.stack ?? 0;
  }

  public isMaxStack(itemType: Id): boolean {
    const item = this.items.get(itemType);
    return !!item && item.stack >= this.getMaxStackCount(itemType);
  }

  public add(itemType: Specs): boolean;
  public add(itemType: Id | Specs, qty?: number): boolean;
  public add(itemType: Id | Specs, qty = 1): boolean {
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
      return true;
    }

    return false;
  }

  private addItemWithSpecs(itemSpecs: Specs): boolean {
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

  // TODO: Merge `removeStack` and `all` into 1 parameter to avoid passing useless values for the former
  public remove(itemType: Id, removeStack = 1, all = false): void {
    const item = this.items.get(itemType);
    if (!item) {
      return;
    }

    item.stack -= removeStack;
    if (all || item.stack <= 0) {
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
