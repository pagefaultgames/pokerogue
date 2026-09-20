import { globalScene } from "#app/global-scene";
import { getPokeballCatchMultiplier, getPokeballName, MAX_PER_TYPE_POKEBALLS } from "#data/pokeball";
import { PokeballType } from "#enums/pokeball";
import { RewardId } from "#enums/reward-id";
import { Reward } from "#items/reward";
import i18next from "i18next";

export class AddPokeballReward extends Reward {
  private pokeballType: PokeballType;
  private count: number;

  constructor(id: RewardId, iconImage: string, count: number) {
    super(id, "", iconImage, "pb", "se/pb_bounce_1");
    this.pokeballType = PokeballType.POKEBALL;
    switch (id) {
      case RewardId.GREAT_BALL:
        this.pokeballType = PokeballType.GREAT_BALL;
        break;
      case RewardId.ULTRA_BALL:
        this.pokeballType = PokeballType.ULTRA_BALL;
        break;
      case RewardId.ROGUE_BALL:
        this.pokeballType = PokeballType.ROGUE_BALL;
        break;
      case RewardId.MASTER_BALL:
        this.pokeballType = PokeballType.MASTER_BALL;
        break;
    }
    this.count = count;
  }

  get name(): string {
    return i18next.t("reward:addPokeball.name", {
      modifierCount: this.count,
      pokeballName: getPokeballName(this.pokeballType),
    });
  }

  get description(): string {
    return i18next.t("reward:addPokeball.description", {
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
