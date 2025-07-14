import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { allHeldItems } from "#data/data-lists";
import type { HeldItemId } from "#enums/held-item-id";
import { Pokemon } from "#field/pokemon";
import { HeldItem, HeldItemEffect } from "#items/held-item";
import { coerceArray, randSeedFloat } from "#utils/common";
import i18next from "i18next";

export interface ItemStealParams {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The pokemon to steal from (optional) */
  // TODO: https://github.com/pagefaultgames/pokerogue/pull/5656#discussion_r2135607083
  target?: Pokemon;
}

//  constructor(type: HeldItemId, maxStackCount: number, boostPercent: number) {

/**
 * Abstract class for held items that steal other Pokemon's items.
 * @see {@linkcode TurnEndItemStealHeldItem}
 * @see {@linkcode ContactItemStealChanceHeldItem}
 */
export abstract class ItemTransferHeldItem extends HeldItem {
  /**
   * Steals an item, chosen randomly, from a set of target Pokemon.
   * @param pokemon The {@linkcode Pokemon} holding this item
   * @param target The {@linkcode Pokemon} to steal from (optional)
   * @param _args N/A
   * @returns `true` if an item was stolen; false otherwise.
   */
  apply(params: ItemStealParams): boolean {
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
    const transferredModifierTypes: HeldItemId[] = [];
    const heldItems = targetPokemon.heldItemManager.getTransferableHeldItems();

    for (let i = 0; i < transferredItemCount; i++) {
      if (!heldItems.length) {
        break;
      }
      const randItemIndex = pokemon.randBattleSeedInt(heldItems.length);
      const randItem = heldItems[randItemIndex];
      // TODO: Fix this after updating the various methods in battle-scene.ts
      if (globalScene.tryTransferHeldItem(randItem, targetPokemon, pokemon, false)) {
        transferredModifierTypes.push(randItem);
        heldItems.splice(randItemIndex, 1);
      }
    }

    for (const mt of transferredModifierTypes) {
      globalScene.phaseManager.queueMessage(this.getTransferMessage(params, mt));
    }

    return !!transferredModifierTypes.length;
  }

  abstract getTargets(params: ItemStealParams): Pokemon[];

  abstract getTransferredItemCount(params: ItemStealParams): number;

  abstract getTransferMessage(params: ItemStealParams, itemId: HeldItemId): string;
}

/**
 * Modifier for held items that steal items from the enemy at the end of
 * each turn.
 * @see {@linkcode modifierTypes[MINI_BLACK_HOLE]}
 */
export class TurnEndItemStealHeldItem extends ItemTransferHeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.TURN_END_ITEM_STEAL];
  isTransferable = true;

  get description(): string {
    return i18next.t("modifierType:ModifierType.TurnHeldItemTransferModifierType.description");
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
 * Modifier for held items that add a chance to steal items from the target of a
 * successful attack.
 * @see {@linkcode modifierTypes[GRIP_CLAW]}
 * @see {@linkcode HeldItemTransferModifier}
 */
export class ContactItemStealChanceHeldItem extends ItemTransferHeldItem {
  public effects: HeldItemEffect[] = [HeldItemEffect.CONTACT_ITEM_STEAL_CHANCE];
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
