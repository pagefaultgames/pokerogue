import { globalScene } from "#app/global-scene";
import { speciesDataRegistry } from "#app/global-species-data-registry";
import { allHeldItems } from "#data/data-lists";
import { SpeciesFormChangeItemTrigger } from "#data/form-change-triggers";
import { SpeciesFormChangeCondition } from "#data/pokemon-forms";
import { FormChangeItemId } from "#enums/form-change-item-id";
import { HeldItemCategoryId } from "#enums/held-item-id";
import { PartyUiMode } from "#enums/party-ui-mode";
import { RewardId } from "#enums/reward-id";
import { SpeciesFormKey } from "#enums/species-form-key";
import { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import { UiMode } from "#enums/ui-mode";
import type { PlayerPokemon } from "#field/pokemon";
import { PokemonReward, type PokemonRewardParams, RewardGenerator } from "#items/reward";
import { type PartyOption, PartyUiHandler } from "#ui/party-ui-handler";
import { randSeedItem } from "#utils/common";
import { isItemInCategory } from "#utils/item-utils";

/**
 * Class that represents form changing items
 */
export class FormChangeItemReward extends PokemonReward {
  public formChangeItemId: FormChangeItemId;

  constructor(id: RewardId, formChangeItemId: FormChangeItemId) {
    super(id, "", allHeldItems[formChangeItemId].iconName, (pokemon: PlayerPokemon) =>
      pokemon.isFormChangeItemCompatible(this.formChangeItemId) ? null : PartyUiHandler.NoEffectMessage,
    );

    this.formChangeItemId = formChangeItemId;
    this.id = RewardId.FORM_CHANGE_ITEM;
  }

  get name(): string {
    return allHeldItems[this.formChangeItemId].name;
  }

  get description(): string {
    return allHeldItems[this.formChangeItemId].description;
  }

  apply({ pokemon }: PokemonRewardParams): boolean {
    if (pokemon.heldItemManager.hasItem(this.formChangeItemId)) {
      return false;
    }

    pokemon.heldItemManager.add(this.formChangeItemId);
    pokemon.toggleFormChangeItem(this.formChangeItemId);

    globalScene.updateItemBar(true);

    return true;
  }

  openParty(postApply: () => void, onCancel: () => void): void {
    globalScene.ui.setModeWithoutClear(
      UiMode.PARTY,
      PartyUiMode.FORM_CHANGE_ITEM_REWARD,
      -1,
      (slotIndex: number, _option: PartyOption) => {
        if (slotIndex < 6) {
          // TODO: improve this check here
          const params: PokemonRewardParams = { pokemon: globalScene.getPlayerParty()[slotIndex] };
          this.apply(params);
          postApply();
        } else {
          onCancel();
        }
      },
      this.selectFilter,
      undefined,
      { itemId: this.formChangeItemId },
    );
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
      return new FormChangeItemReward(
        this.isRareFormChangeItem ? RewardId.RARE_FORM_CHANGE_ITEM : RewardId.FORM_CHANGE_ITEM,
        pregenArgs,
      );
    }
    const party = globalScene.getPlayerParty();

    // TODO: REFACTOR THIS FUCKERY PLEASE
    const formChangeItemPool = [
      ...new Set(
        party
          .filter(p => speciesDataRegistry.hasFormChanges(p.species.speciesId))
          .flatMap(p => {
            const formChanges = speciesDataRegistry.getFormChanges(p.species.speciesId);
            let formChangeItemTriggers = formChanges
              .filter(
                fc =>
                  ((fc.formKey.indexOf(SpeciesFormKey.MEGA) === -1 && fc.formKey.indexOf(SpeciesFormKey.PRIMAL) === -1)
                    || globalScene.trainerItems.hasItem(TrainerItemId.MEGA_BRACELET))
                  && ((fc.formKey.indexOf(SpeciesFormKey.GIGANTAMAX) === -1
                    && fc.formKey.indexOf(SpeciesFormKey.ETERNAMAX) === -1)
                    || globalScene.trainerItems.hasItem(TrainerItemId.DYNAMAX_BAND))
                  && (fc.conditions.length === 0
                    || fc.conditions.filter(cond => cond instanceof SpeciesFormChangeCondition && cond.predicate(p))
                      .length > 0)
                  && fc.preFormKey === p.getFormKey(),
              )
              .map(fc => fc.findTrigger(SpeciesFormChangeItemTrigger) as SpeciesFormChangeItemTrigger)
              .filter(t => t?.active && !p.heldItemManager.hasItem(t.item));

            if (p.species.speciesId === SpeciesId.NECROZMA) {
              // technically we could use a simplified version and check for formChanges.length > 3, but in case any code changes later, this might break...
              let foundULTRA_Z = false;
              let foundN_LUNA = false;
              let foundN_SOLAR = false;
              formChangeItemTriggers.forEach(fc => {
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
              }
            }
            return formChangeItemTriggers;
          }),
      ),
    ]
      .flat()
      .flatMap(fc => fc.item)
      .filter(i =>
        isItemInCategory(
          i,
          this.isRareFormChangeItem ? HeldItemCategoryId.RARE_FORM_CHANGE : HeldItemCategoryId.FORM_CHANGE,
        ),
      );
    // convert it into a set to remove duplicate values, which can appear when the same species with a potential form change is in the party.

    if (formChangeItemPool.length === 0) {
      return null;
    }

    return new FormChangeItemReward(
      this.isRareFormChangeItem ? RewardId.RARE_FORM_CHANGE_ITEM : RewardId.FORM_CHANGE_ITEM,
      randSeedItem(formChangeItemPool),
    );
  }
}
