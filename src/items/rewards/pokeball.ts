import { globalScene } from "#app/global-scene";
import { getPokeballCatchMultiplier, getPokeballName, MAX_PER_TYPE_POKEBALLS } from "#data/pokeball";
import type { PokeballType } from "#enums/pokeball";
import type { RewardId } from "#enums/reward-id";
import { Reward } from "#items/reward";
import i18next from "i18next";

export class AddPokeballReward extends Reward {
  private pokeballType: PokeballType;
  private count: number;

  constructor(iconImage: string, pokeballType: PokeballType, count: number, id: RewardId) {
    super("", iconImage, "pb", "se/pb_bounce_1");
    this.pokeballType = pokeballType;
    this.count = count;
    this.id = id;
  }

  get name(): string {
    return i18next.t("modifierType:ModifierType.AddPokeballModifierType.name", {
      modifierCount: this.count,
      pokeballName: getPokeballName(this.pokeballType),
    });
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.AddPokeballModifierType.description", {
      modifierCount: this.count,
      pokeballName: getPokeballName(this.pokeballType),
      catchRate:
        getPokeballCatchMultiplier(this.pokeballType) > -1
          ? `${getPokeballCatchMultiplier(this.pokeballType)}x`
          : "100%",
      pokeballAmount: `${globalScene.pokeballCounts[this.pokeballType]}`,
    });
  }

  /**
   * Applies {@linkcode AddPokeballReward}
   * @returns always `true`
   */
  apply(): boolean {
    const pokeballCounts = globalScene.pokeballCounts;
    pokeballCounts[this.pokeballType] = Math.min(
      pokeballCounts[this.pokeballType] + this.count,
      MAX_PER_TYPE_POKEBALLS,
    );

    return true;
  }
}
