import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { allHeldItems } from "#data/data-lists";
import { HeldItemEffect } from "#enums/held-item-effect";
import type { HeldItemId } from "#enums/held-item-id";
import { Pokemon } from "#field/pokemon";
import { type EffectTuple, HeldItem } from "#items/held-item";
import type { ItemStealParams } from "#types/held-item-parameter";
import { coerceArray, randSeedFloat } from "#utils/common";
import i18next from "i18next";

//  constructor(type: HeldItemId, maxStackCount: number, boostPercent: number) {

/**
 * Abstract class for held items that steal other Pokemon's items.
 * @see {@linkcode TurnEndItemStealHeldItem}
 * @see {@linkcode ContactItemStealChanceHeldItem}
 */
export abstract class ItemTransferHeldItem<T extends EffectTuple> extends HeldItem<T> {
  /**
   * Steals an item, chosen randomly, from a set of target Pokemon.
   * @param pokemon The {@linkcode Pokemon} holding this item
   * @param target The {@linkcode Pokemon} to steal from (optional)
   * @param _args N/A
   * @returns `true` if an item was stolen; false otherwise.
   */
  // TODO: This works but can perhaps be done more elegantly
  applySteal(params: ItemStealParams): boolean {
    const opponents = this.getTargets(params);

    if (!opponents.length) {
      return false;
    }

    const pokemon = params.pokemon;
    //TODO: Simplify this logic here
    const targetPokemon = opponents[pokemon.randBattleSeedInt(opponents.length)];

    const transferredItemCount = this.getTransferredItemCount(params);
    if (!transferredItemCount) {
      return false;
    }

    // TODO: Change this logic to use held items
    const transferredRewards: HeldItemId[] = [];
    const heldItems = targetPokemon.heldItemManager.getTransferableHeldItems();

    for (let i = 0; i < transferredItemCount; i++) {
      if (!heldItems.length) {
        break;
      }
      const randItemIndex = pokemon.randBattleSeedInt(heldItems.length);
      const randItem = heldItems[randItemIndex];
      // TODO: Fix this after updating the various methods in battle-scene.ts
      if (globalScene.tryTransferHeldItem(randItem, targetPokemon, pokemon, false)) {
        transferredRewards.push(randItem);
        heldItems.splice(randItemIndex, 1);
      }
    }

    for (const mt of transferredRewards) {
      globalScene.phaseManager.queueMessage(this.getTransferMessage(params, mt));
    }

    return !!transferredRewards.length;
  }

  abstract getTargets(params: ItemStealParams): Pokemon[];

  abstract getTransferredItemCount(params: ItemStealParams): number;

  abstract getTransferMessage(params: ItemStealParams, itemId: HeldItemId): string;
}

/**
 * Held item that steal items from the enemy at the end of
 * each turn.
 */
export class TurnEndItemStealHeldItem extends ItemTransferHeldItem<[typeof HeldItemEffect.TURN_END_ITEM_STEAL]> {
  public readonly effects = [HeldItemEffect.TURN_END_ITEM_STEAL] as const;
  isTransferable = true;

  get description(): string {
    return i18next.t("modifierType:ModifierType.TurnHeldItemTransferModifierType.description");
  }

  apply(_effect: typeof HeldItemEffect.TURN_END_ITEM_STEAL, params: ItemStealParams) {
    super.applySteal(params);
  }

  /**
   * Determines the targets to transfer items from when this applies.
   * @param pokemon the {@linkcode Pokemon} holding this item
   * @param _args N/A
   * @returns the opponents of the source {@linkcode Pokemon}
   */
  getTargets(params: ItemStealParams): Pokemon[] {
    return params.pokemon instanceof Pokemon ? params.pokemon.getOpponents() : [];
  }

  getTransferredItemCount(_params: ItemStealParams): number {
    return 1;
  }

  getTransferMessage(params: ItemStealParams, itemId: HeldItemId): string {
    return i18next.t("modifier:turnHeldItemTransferApply", {
      pokemonNameWithAffix: getPokemonNameWithAffix(params.target),
      itemName: allHeldItems[itemId].name,
      pokemonName: params.pokemon.getNameToRender(),
      typeName: this.name,
    });
  }

  setTransferrableFalse(): void {
    this.isTransferable = false;
  }
}

/**
 * Held item that adds a chance to steal items from the target of a
 * successful attack.
 */
export class ContactItemStealChanceHeldItem extends ItemTransferHeldItem<
  [typeof HeldItemEffect.CONTACT_ITEM_STEAL_CHANCE]
> {
  public readonly effects = [HeldItemEffect.CONTACT_ITEM_STEAL_CHANCE] as const;
  public readonly chancePercent: number;
  public readonly chance: number;

  constructor(type: HeldItemId, maxStackCount: number, chancePercent: number) {
    super(type, maxStackCount);

    this.chancePercent = chancePercent;
    this.chance = chancePercent / 100;
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.ContactHeldItemTransferChanceModifierType.description", {
      chancePercent: this.chancePercent,
    });
  }

  apply(_effect: typeof HeldItemEffect.CONTACT_ITEM_STEAL_CHANCE, params: ItemStealParams) {
    super.applySteal(params);
  }

  /**
   * Determines the target to steal items from when this applies.
   * @param _holderPokemon The {@linkcode Pokemon} holding this item
   * @param targetPokemon The {@linkcode Pokemon} the holder is targeting with an attack
   * @returns The target {@linkcode Pokemon} as array for further use in `apply` implementations
   */
  getTargets({ target }: ItemStealParams): Pokemon[] {
    return target ? coerceArray(target) : [];
  }

  getTransferredItemCount({ pokemon }: ItemStealParams): number {
    const stackCount = pokemon.heldItemManager.getStack(this.type);
    return randSeedFloat() <= this.chance * stackCount ? 1 : 0;
  }

  getTransferMessage({ pokemon, target }: ItemStealParams, itemId: HeldItemId): string {
    return i18next.t("modifier:contactHeldItemTransferApply", {
      pokemonNameWithAffix: getPokemonNameWithAffix(target),
      itemName: allHeldItems[itemId].name,
      pokemonName: pokemon.getNameToRender(),
      typeName: this.name,
    });
  }
}
