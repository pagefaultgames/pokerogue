import { globalScene } from "#app/global-scene";
import type { Phase } from "#app/phase";
import { PartyUiMode } from "#enums/party-ui-mode";
import { RewardId } from "#enums/reward-id";
import { UiMode } from "#enums/ui-mode";
import type { PlayerPokemon } from "#field/pokemon";
import { type PokemonFusionRewardParams, PokemonReward } from "#items/reward";
import { PartyUiHandler } from "#ui/party-ui-handler";
import i18next from "i18next";

export class FusePokemonReward extends PokemonReward {
  constructor(localeKey: string, iconImage: string) {
    super(RewardId.DNA_SPLICERS, localeKey, iconImage, (pokemon: PlayerPokemon) => {
      if (pokemon.isFusion()) {
        return PartyUiHandler.NoEffectMessage;
      }
      return null;
    });
  }

  get description(): string {
    return i18next.t("reward:fusePokemon.description");
  }

  /**
   * Applies {@linkcode FusePokemonConsumable}
   * @param playerPokemon {@linkcode PlayerPokemon} that should be fused
   * @param playerPokemon2 {@linkcode PlayerPokemon} that should be fused with {@linkcode playerPokemon}
   * @returns always Promise<true>
   */
  apply({ pokemon, pokemon2 }: PokemonFusionRewardParams): boolean {
    pokemon.fuse(pokemon2);
    return true;
  }

  openParty(postApply: () => void, onCancel: () => void, _callingPhase: Phase): void {
    globalScene.ui.setModeWithoutClear(
      UiMode.PARTY,
      PartyUiMode.SPLICE,
      -1,
      (fromSlotIndex: number, spliceSlotIndex: number) => {
        if (
          spliceSlotIndex !== undefined
          && fromSlotIndex < 6
          && spliceSlotIndex < 6
          && fromSlotIndex !== spliceSlotIndex
        ) {
          const party = globalScene.getPlayerParty();
          this.apply({ pokemon: party[fromSlotIndex], pokemon2: party[spliceSlotIndex] });
          postApply();
        } else {
          onCancel();
        }
      },
      this.selectFilter,
    );
  }
}
