import { globalScene } from "#app/global-scene";
import { allHeldItems } from "#data/data-lists";
import { SpeciesFormChangeItemTrigger } from "#data/form-change-triggers";
import { pokemonFormChanges, SpeciesFormChangeCondition } from "#data/pokemon-forms";
import { FormChangeItemId } from "#enums/form-change-item-id";
import { RewardId } from "#enums/reward-id";
import { SpeciesFormKey } from "#enums/species-form-key";
import { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import type { PlayerPokemon } from "#field/pokemon";
import { PokemonReward, type PokemonRewardParams, RewardGenerator } from "#items/reward";
import { PartyUiHandler } from "#ui/party-ui-handler";
import { randSeedItem } from "#utils/common";

/**
 * Class that represents form changing items
 */
export class FormChangeItemReward extends PokemonReward {
  public formChangeItem: FormChangeItemId;

  constructor(formChangeItem: FormChangeItemId) {
    super("", allHeldItems[formChangeItem].iconName, (pokemon: PlayerPokemon) => {
      // Make sure the Pokemon has alternate forms
      if (
        pokemonFormChanges.hasOwnProperty(pokemon.species.speciesId) &&
        // Get all form changes for this species with an item trigger, including any compound triggers
        pokemonFormChanges[pokemon.species.speciesId]
          .filter(
            fc => fc.trigger.hasTriggerType(SpeciesFormChangeItemTrigger) && fc.preFormKey === pokemon.getFormKey(),
          )
          // Returns true if any form changes match this item
          .flatMap(fc => fc.findTrigger(SpeciesFormChangeItemTrigger) as SpeciesFormChangeItemTrigger)
          .flatMap(fc => fc.item)
          .includes(this.formChangeItem)
      ) {
        return null;
      }

      return PartyUiHandler.NoEffectMessage;
    });

    this.formChangeItem = formChangeItem;
    this.id = RewardId.FORM_CHANGE_ITEM;
  }

  get name(): string {
    return allHeldItems[this.formChangeItem].name;
  }

  get description(): string {
    return allHeldItems[this.formChangeItem].description;
  }

  apply({ pokemon }: PokemonRewardParams): boolean {
    if (pokemon.heldItemManager.hasItem(this.formChangeItem)) {
      return false;
    }

    pokemon.heldItemManager.add(this.formChangeItem);
    pokemon.heldItemManager.toggleActive(this.formChangeItem);

    // TODO: revise logic of this trigger based on active/inactive item
    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeItemTrigger);

    globalScene.updateItems(true);

    return true;
  }
}

export class FormChangeItemRewardGenerator extends RewardGenerator {
  private isRareFormChangeItem: boolean;

  constructor(isRareFormChangeItem: boolean) {
    super();
    this.isRareFormChangeItem = isRareFormChangeItem;
  }

  override generateReward(pregenArgs?: FormChangeItemId) {
    if (pregenArgs !== undefined) {
      return new FormChangeItemReward(pregenArgs);
    }
    const party = globalScene.getPlayerParty();

    // TODO: REFACTOR THIS FUCKERY PLEASE
    const formChangeItemPool = [
      ...new Set(
        party
          .filter(p => pokemonFormChanges.hasOwnProperty(p.species.speciesId))
          .flatMap(p => {
            const formChanges = pokemonFormChanges[p.species.speciesId];
            let formChangeItemTriggers = formChanges
              .filter(
                fc =>
                  ((fc.formKey.indexOf(SpeciesFormKey.MEGA) === -1 &&
                    fc.formKey.indexOf(SpeciesFormKey.PRIMAL) === -1) ||
                    globalScene.trainerItems.hasItem(TrainerItemId.MEGA_BRACELET)) &&
                  ((fc.formKey.indexOf(SpeciesFormKey.GIGANTAMAX) === -1 &&
                    fc.formKey.indexOf(SpeciesFormKey.ETERNAMAX) === -1) ||
                    globalScene.trainerItems.hasItem(TrainerItemId.DYNAMAX_BAND)) &&
                  (!fc.conditions.length ||
                    fc.conditions.filter(cond => cond instanceof SpeciesFormChangeCondition && cond.predicate(p))
                      .length) &&
                  fc.preFormKey === p.getFormKey(),
              )
              .map(fc => fc.findTrigger(SpeciesFormChangeItemTrigger) as SpeciesFormChangeItemTrigger)
              .filter(t => t?.active && !p.heldItemManager.hasItem(t.item));

            if (p.species.speciesId === SpeciesId.NECROZMA) {
              // technically we could use a simplified version and check for formChanges.length > 3, but in case any code changes later, this might break...
              let foundULTRA_Z = false,
                foundN_LUNA = false,
                foundN_SOLAR = false;
              formChangeItemTriggers.forEach((fc, _i) => {
                console.log("Checking ", fc.item);
                switch (fc.item) {
                  case FormChangeItemId.ULTRANECROZIUM_Z:
                    foundULTRA_Z = true;
                    break;
                  case FormChangeItemId.N_LUNARIZER:
                    foundN_LUNA = true;
                    break;
                  case FormChangeItemId.N_SOLARIZER:
                    foundN_SOLAR = true;
                    break;
                }
              });
              if (foundULTRA_Z && foundN_LUNA && foundN_SOLAR) {
                // all three items are present -> user hasn't acquired any of the N_*ARIZERs -> block ULTRANECROZIUM_Z acquisition.
                formChangeItemTriggers = formChangeItemTriggers.filter(
                  fc => fc.item !== FormChangeItemId.ULTRANECROZIUM_Z,
                );
              } else {
                console.log("DID NOT FIND ");
              }
            }
            return formChangeItemTriggers;
          }),
      ),
    ]
      .flat()
      .flatMap(fc => fc.item)
      .filter(i => (i && i < 100) === this.isRareFormChangeItem);
    // convert it into a set to remove duplicate values, which can appear when the same species with a potential form change is in the party.

    if (!formChangeItemPool.length) {
      return null;
    }

    return new FormChangeItemReward(randSeedItem(formChangeItemPool));
  }
}
