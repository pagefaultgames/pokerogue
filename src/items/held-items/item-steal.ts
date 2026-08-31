import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { allHeldItems } from "#data/data-lists";
import { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import { Pokemon } from "#field/pokemon";
import { HeldItemAttr } from "#items/held-item-attr";
import type { ItemStealParams } from "#types/held-item-parameter";
import { coerceArray, randSeedFloat } from "#utils/common";
import i18next from "i18next";

/**
 * Abstract class for held items that steal other Pokemon's items.
 * @see {@linkcode TurnEndItemStealHeldItemAttr}
 * @see {@linkcode ContactItemStealChanceHeldItemAttr}
 */
abstract class ItemTransferHeldItemAttr<T extends HeldItemEffect> extends HeldItemAttr<T> {
  /** @sealed */
  // TODO: This works but can perhaps be done more elegantly
  public override apply(params: ItemStealParams): void {
    const opponents = this.getTargets(params);

    if (opponents.length === 0) {
      return;
    }

    const { pokemon } = params;
    //TODO: Simplify this logic here
    const targetPokemon = opponents[pokemon.randBattleSeedInt(opponents.length)];

    const transferredItemCount = this.getTransferredItemCount(params);
    if (!transferredItemCount) {
      return;
    }

    // TODO: Change this logic to use held items
    const transferredItems: HeldItemId[] = [];
    const heldItems = targetPokemon.heldItemManager.getTransferableHeldItems();

    for (let i = 0; i < transferredItemCount; i++) {
      if (heldItems.length === 0) {
        break;
      }
      const randItemIndex = pokemon.randBattleSeedInt(heldItems.length);
      const randItem = heldItems[randItemIndex];
      // TODO: Fix this after updating the various methods in battle-scene.ts
      if (globalScene.tryTransferHeldItem(randItem, targetPokemon, pokemon, false)) {
        transferredItems.push(randItem);
        heldItems.splice(randItemIndex, 1);
      }
    }

    for (const mt of transferredItems) {
      globalScene.phaseManager.queueMessage(this.getTransferMessage(params, mt));
    }
  }

  protected abstract getTargets(params: ItemStealParams): Pokemon[];

  protected abstract getTransferredItemCount(params: ItemStealParams): number;

  protected abstract getTransferMessage(params: ItemStealParams, itemId: HeldItemId): string;
}

/**
 * Attribute for held items that steal items from the enemy at the end of each turn.
 * @sealed
 */
export class TurnEndItemStealHeldItemAttr extends ItemTransferHeldItemAttr<typeof HeldItemEffect.TURN_END_ITEM_STEAL> {
  public override readonly effect = HeldItemEffect.TURN_END_ITEM_STEAL;

  public override shouldApply({ pokemon }: ItemStealParams): boolean {
    return !pokemon.isFainted();
  }

  /**
   * Determines the targets to transfer items from when this applies.
   * @param pokemon the {@linkcode Pokemon} holding this item
   * @returns the opponents of the source {@linkcode Pokemon}
   */
  protected override getTargets(params: ItemStealParams): Pokemon[] {
    // TODO: this will always be defined, might be placeholder?
    return params.pokemon instanceof Pokemon ? params.pokemon.getOpponents() : [];
  }

  protected override getTransferredItemCount(): number {
    return 1;
  }

  protected override getTransferMessage({ target, pokemon }: ItemStealParams, itemId: HeldItemId): string {
    return i18next.t("itemApply:turnHeldItemTransferApply", {
      pokemonNameWithAffix: getPokemonNameWithAffix(target),
      itemName: allHeldItems[itemId].name,
      pokemonName: pokemon.getNameToRender(),
      typeName: this.item.name,
    });
  }
}

/**
 * Attribute for held items that add a chance to steal items from the target of a
 * successful attack.
 * @sealed
 */
export class ContactItemStealChanceHeldItemAttr extends ItemTransferHeldItemAttr<
  typeof HeldItemEffect.CONTACT_ITEM_STEAL_CHANCE
> {
  public override readonly effect = HeldItemEffect.CONTACT_ITEM_STEAL_CHANCE;
  public readonly chancePercent: number;
  public readonly chance: number;

  constructor(chancePercent: number) {
    super();

    this.chancePercent = chancePercent;
    this.chance = chancePercent / 100;
  }

  /**
   * Determines the target to steal items from when this applies.
   * @param _holderPokemon - The {@linkcode Pokemon} holding this item
   * @param targetPokemon - The {@linkcode Pokemon} the holder is targeting with an attack
   * @returns The target {@linkcode Pokemon} as array for further use in `apply` implementations
   */
  protected override getTargets({ target }: ItemStealParams): Pokemon[] {
    return target ? coerceArray(target) : [];
  }

  protected override getTransferredItemCount({ pokemon }: ItemStealParams): number {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    return randSeedFloat() <= this.chance * stackCount ? 1 : 0;
  }

  protected override getTransferMessage({ pokemon, target }: ItemStealParams, itemId: HeldItemId): string {
    return i18next.t("itemApply:contactHeldItemTransferApply", {
      pokemonNameWithAffix: getPokemonNameWithAffix(target),
      itemName: allHeldItems[itemId].name,
      pokemonName: pokemon.getNameToRender(),
      typeName: this.item.name,
    });
  }
}
