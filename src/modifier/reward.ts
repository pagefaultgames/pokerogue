/**
import { globalScene } from "#app/global-scene";
import type { PokeballType } from "#enums/pokeball";
import i18next from "i18next";
import { allHeldItems, type HeldItem } from "./held-items";
import { getPokeballCatchMultiplier, getPokeballName, MAX_PER_TYPE_POKEBALLS } from "#app/data/pokeball";
import type Pokemon from "#app/field/pokemon";

export class Reward {
    
  getName(): string {
    return "";
  }

  getDescription(): string {
    return "";
  }

  getIcon(): string {
    return "";
  }

  createIcon(): Phaser.GameObjects.Container {
    const container = globalScene.add.container(0, 0);

    const item = globalScene.add.sprite(0, 12, "items");
    item.setFrame(this.getIcon());
    item.setOrigin(0, 0.5);
    container.add(item);
    return container;
  }
}


export class PokeballReward extends Reward {
  private pokeballType: PokeballType;
  private count: number;

  constructor(pokeballType: PokeballType, count: number) {
    super();
    this.pokeballType = pokeballType;
    this.count = count;
  }

  getName(): string {
    return i18next.t("modifierType:ModifierType.AddPokeballModifierType.name", {
      modifierCount: this.count,
      pokeballName: getPokeballName(this.pokeballType),
    });
  }

  getDescription(): string {
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
    
  apply(): boolean {
    const pokeballCounts = globalScene.pokeballCounts;
    pokeballCounts[this.pokeballType] = Math.min(
      pokeballCounts[this.pokeballType] + this.count,
      MAX_PER_TYPE_POKEBALLS,
    );
    return true;
  }
}

export class PartySelectReward extends Reward {
  apply(): {
  }
}

export class HeldItemReward extends PartySelectReward {
  private itemId;
  constructor(itemId: HeldItem) {
    super();
    this.itemId = itemId;
  }

  getName(): string {
    return allHeldItems[this.itemId].getName();
  }

  getDescription(): string {
    return allHeldItems[this.itemId].getDescription();
  }

  getIcon(): string {
    return allHeldItems[this.itemId].getIcon();
  }

  apply(): {
  }
}





export class RewardGenerator {
  options: number[];
  optionWeights: number[];

  constructor(options: number[]) {
    this.options = options;
  }
}


export class PokeballRewardGenerator extends RewardGenerator{

  constructor(
    options: PokeballType[],
    condition?: (party: Pokemon[], option: number) => boolean, 
    getOptionWeight?: (party: Pokemon[], option: number) => number,
  ) {
    super(options);

    this.isAvailable = isAvailable;
    this.getOptionWeight = getOptionWeight;
  }

  isAvailable(): boolean {
    
  }

  optionWeights() {

  }

}




export interface RewardInfo {
  options: number[];
  rewardType: ;
  condition?: (party: Pokemon[], option: number) => void;
  optionWeight?: (party: Pokemon[], option: number) => void;
}




interface RewardPool {
  [rewardTier: number]: RewardGenerator[];
}


export class RewardManager {

  private rewardPool: RewardPool;

  constructor(rewardPool: RewardPool) {
    this.rewardPool = rewardPool;
  }








}
  * */
