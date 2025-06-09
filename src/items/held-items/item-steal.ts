import Pokemon from "#app/field/pokemon";
import { randSeedFloat } from "#app/utils/common";
import type { HeldItemId } from "#enums/held-item-id";
import i18next from "i18next";
import { HeldItem, ITEM_EFFECT } from "../held-item";
import { getPokemonNameWithAffix } from "#app/messages";
import { allHeldItems } from "../all-held-items";
import { globalScene } from "#app/global-scene";

export interface ITEM_STEAL_PARAMS {
  /** The pokemon with the item */
  pokemon: Pokemon;
  /** The pokemon to steal from (optional) */
  target?: Pokemon;
}

//  constructor(type: HeldItemId, maxStackCount = 1, boostPercent: number) {

/**
 * Abstract class for held items that steal other Pokemon's items.
 * @see {@linkcode TurnHeldItemTransferModifier}
 * @see {@linkcode ContactHeldItemTransferChanceModifier}
 */
export abstract class ItemTransferHeldItem extends HeldItem {
  /**
   * Steals an item, chosen randomly, from a set of target Pokemon.
   * @param pokemon The {@linkcode Pokemon} holding this item
   * @param target The {@linkcode Pokemon} to steal from (optional)
   * @param _args N/A
   * @returns `true` if an item was stolen; false otherwise.
   */
  apply(params: ITEM_STEAL_PARAMS): boolean {
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

  abstract getTargets(params: ITEM_STEAL_PARAMS): Pokemon[];

  abstract getTransferredItemCount(params: ITEM_STEAL_PARAMS): number;

  abstract getTransferMessage(params: ITEM_STEAL_PARAMS, itemId: HeldItemId): string;
}

/**
 * Modifier for held items that steal items from the enemy at the end of
 * each turn.
 * @see {@linkcode modifierTypes[MINI_BLACK_HOLE]}
 */
export class TurnEndItemStealHeldItem extends ItemTransferHeldItem {
  public effects: ITEM_EFFECT[] = [ITEM_EFFECT.TURN_END_ITEM_STEAL];
  isTransferable = true;

  /**
   * Determines the targets to transfer items from when this applies.
   * @param pokemon the {@linkcode Pokemon} holding this item
   * @param _args N/A
   * @returns the opponents of the source {@linkcode Pokemon}
   */
  getTargets(params: ITEM_STEAL_PARAMS): Pokemon[] {
    return params.pokemon instanceof Pokemon ? params.pokemon.getOpponents() : [];
  }

  getTransferredItemCount(_params: ITEM_STEAL_PARAMS): number {
    return 1;
  }

  getTransferMessage(params: ITEM_STEAL_PARAMS, itemId: HeldItemId): string {
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
  public effects: ITEM_EFFECT[] = [ITEM_EFFECT.CONTACT_ITEM_STEAL_CHANCE];
  public readonly chance: number;

  constructor(type: HeldItemId, maxStackCount = 1, chancePercent: number) {
    super(type, maxStackCount);

    this.chance = chancePercent / 100;
  }

  /**
   * Determines the target to steal items from when this applies.
   * @param _holderPokemon The {@linkcode Pokemon} holding this item
   * @param targetPokemon The {@linkcode Pokemon} the holder is targeting with an attack
   * @returns The target {@linkcode Pokemon} as array for further use in `apply` implementations
   */
  getTargets(params: ITEM_STEAL_PARAMS): Pokemon[] {
    return params.target ? [params.target] : [];
  }

  getTransferredItemCount(params: ITEM_STEAL_PARAMS): number {
    const stackCount = params.pokemon.heldItemManager.getStack(this.type);
    return randSeedFloat() <= this.chance * stackCount ? 1 : 0;
  }

  getTransferMessage(params: ITEM_STEAL_PARAMS, itemId: HeldItemId): string {
    return i18next.t("modifier:contactHeldItemTransferApply", {
      pokemonNameWithAffix: getPokemonNameWithAffix(params.target),
      itemName: allHeldItems[itemId].name,
      pokemonName: params.pokemon.getNameToRender(),
      typeName: this.name,
    });
  }
}
