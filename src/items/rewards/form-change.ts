import { globalScene } from "#app/global-scene";
import { speciesDataRegistry } from "#app/global-species-data-registry";
import { allHeldItems } from "#data/data-lists";
import { SpeciesFormChangeItemTrigger } from "#data/form-change-triggers";
import { SpeciesFormChangeCondition } from "#data/pokemon-forms";
import { FormChangeItemId } from "#enums/form-change-item-id";
import { HeldItemCategoryId } from "#enums/held-item-id";
import { RewardId } from "#enums/reward-id";
import { SpeciesFormKey } from "#enums/species-form-key";
import { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import type { PlayerPokemon } from "#field/pokemon";
import { PokemonReward, type PokemonRewardParams, RewardGenerator } from "#items/reward";
import type { RewardMatchKey } from "#types/rewards";
import { PartyUiHandler } from "#ui/party-ui-handler";
import { isItemInCategory } from "#utils/item-utils";

/**
 * Class that represents form changing items
 */
export class FormChangeItemReward extends PokemonReward {
  public readonly formChangeItemId: FormChangeItemId;

  constructor(id: RewardId, formChangeItemId: FormChangeItemId) {
    super(id);
    this.formChangeItemId = formChangeItemId;
  }

  override get matchKey(): RewardMatchKey {
    return `formChange:${this.formChangeItemId}`;
  }

  get name(): string {
    return allHeldItems[this.formChangeItemId].name;
  }

  get description(): string {
    return allHeldItems[this.formChangeItemId].description;
  }

  get iconName(): string {
    return allHeldItems[this.formChangeItemId].iconName;
  }

  protected override getIneligibilityMessage(pokemon: PlayerPokemon): string | null {
    return pokemon.isFormChangeItemCompatible(this.formChangeItemId) ? null : PartyUiHandler.NoEffectMessage;
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
}

export class FormChangeItemRewardGenerator extends RewardGenerator<FormChangeItemId> {
  private readonly isRareFormChangeItem: boolean;

  constructor(isRareFormChangeItem: boolean) {
    super();
    this.isRareFormChangeItem = isRareFormChangeItem;
  }

  override getAvailableItems(exclusions?: ReadonlySet<RewardMatchKey>): FormChangeItemId[] {
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
      .filter(
        i =>
          isItemInCategory(
            i,
            this.isRareFormChangeItem ? HeldItemCategoryId.RARE_FORM_CHANGE : HeldItemCategoryId.FORM_CHANGE,
          ) && !exclusions?.has(`formChange:${i}`),
      );

    return formChangeItemPool;
  }

  override generateReward(formChangeItemId: FormChangeItemId): FormChangeItemReward {
    const id = this.isRareFormChangeItem ? RewardId.RARE_FORM_CHANGE_ITEM : RewardId.FORM_CHANGE_ITEM;
    return new FormChangeItemReward(id, formChangeItemId);
  }
}
