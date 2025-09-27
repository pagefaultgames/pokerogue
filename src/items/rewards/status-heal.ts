import { BattlerTagType } from "#enums/battler-tag-type";
import { RewardId } from "#enums/reward-id";
import type { PlayerPokemon } from "#field/pokemon";
import { PokemonReward, type PokemonRewardParams } from "#items/reward";
import { PartyUiHandler } from "#ui/party-ui-handler";
import i18next from "i18next";

export class PokemonStatusHealReward extends PokemonReward {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, (pokemon: PlayerPokemon) => {
      if (!pokemon.hp || (!pokemon.status && !pokemon.getTag(BattlerTagType.CONFUSED))) {
        return PartyUiHandler.NoEffectMessage;
      }
      return null;
    });
    this.id = RewardId.FULL_HEAL;
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.PokemonStatusHealModifierType.description");
  }

  apply({ pokemon }: PokemonRewardParams): boolean {
    pokemon.resetStatus(true, true, false, false);
    return true;
  }
}
