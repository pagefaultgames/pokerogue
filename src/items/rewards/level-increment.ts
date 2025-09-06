import { globalScene } from "#app/global-scene";
import { FRIENDSHIP_GAIN_FROM_RARE_CANDY } from "#balance/starters";
import { getLevelTotalExp } from "#data/exp";
import { RewardId } from "#enums/reward-id";
import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { TrainerItemId } from "#enums/trainer-item-id";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import { PokemonReward, type PokemonRewardParams, Reward } from "#items/reward";
import { NumberHolder } from "#utils/common";
import i18next from "i18next";

function incrementLevelWithCandy(pokemon: Pokemon): boolean {
  const levelCount = new NumberHolder(1);
  globalScene.applyPlayerItems(TrainerItemEffect.LEVEL_INCREMENT_BOOSTER, { numberHolder: levelCount });

  pokemon.level += levelCount.value;
  if (pokemon.level <= globalScene.getMaxExpLevel(true)) {
    pokemon.exp = getLevelTotalExp(pokemon.level, pokemon.species.growthRate);
    pokemon.levelExp = 0;
  }

  if (pokemon.isPlayer()) {
    pokemon.addFriendship(FRIENDSHIP_GAIN_FROM_RARE_CANDY);

    globalScene.phaseManager.unshiftNew(
      "LevelUpPhase",
      globalScene.getPlayerParty().indexOf(pokemon),
      pokemon.level - levelCount.value,
      pokemon.level,
    );
  }
  return true;
}

export class PokemonLevelIncrementReward extends PokemonReward {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, (_pokemon: PlayerPokemon) => null);
    this.id = RewardId.RARE_CANDY;
  }

  get description(): string {
    let levels = 1;
    const candyJarStack = globalScene.trainerItems.getStack(TrainerItemId.CANDY_JAR);
    levels += candyJarStack;
    return i18next.t("modifierType:ModifierType.PokemonLevelIncrementModifierType.description", { levels });
  }

  /**
   * Applies {@linkcode PokemonLevelIncrementConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should get levels incremented
   * @param levelCount The amount of levels to increment
   * @returns always `true`
   */
  apply({ pokemon }: PokemonRewardParams): boolean {
    return incrementLevelWithCandy(pokemon);
  }
}

export class AllPokemonLevelIncrementReward extends Reward {
  id = RewardId.RARER_CANDY;

  get description(): string {
    let levels = 1;
    const candyJarStack = globalScene.trainerItems.getStack(TrainerItemId.CANDY_JAR);
    levels += candyJarStack;
    return i18next.t("modifierType:ModifierType.AllPokemonLevelIncrementModifierType.description", { levels });
  }

  apply(): boolean {
    for (const pokemon of globalScene.getPlayerParty()) {
      incrementLevelWithCandy(pokemon);
    }

    return true;
  }
}
