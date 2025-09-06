import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { TerrainType } from "#data/terrain";
import { BattlerTagLapseType } from "#enums/battler-tag-lapse-type";
import { HeldItemEffect } from "#enums/held-item-effect";
import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { WeatherType } from "#enums/weather-type";
import { TurnEndEvent } from "#events/battle-scene";
import type { Pokemon } from "#field/pokemon";
import { applyHeldItems } from "#items/all-held-items";
import { FieldPhase } from "#phases/field-phase";
import i18next from "i18next";

export class TurnEndPhase extends FieldPhase {
  public readonly phaseName = "TurnEndPhase";
  public upcomingInterlude = false;

  start() {
    super.start();

    globalScene.currentBattle.incrementTurn();
    globalScene.eventTarget.dispatchEvent(new TurnEndEvent(globalScene.currentBattle.turn));

    globalScene.phaseManager.hideAbilityBar();

    const handlePokemon = (pokemon: Pokemon) => {
      if (!pokemon.switchOutStatus) {
        pokemon.lapseTags(BattlerTagLapseType.TURN_END);

        applyHeldItems(HeldItemEffect.TURN_END_HEAL, { pokemon: pokemon });

        if (globalScene.arena.terrain?.terrainType === TerrainType.GRASSY && pokemon.isGrounded()) {
          globalScene.phaseManager.unshiftNew(
            "PokemonHealPhase",
            pokemon.getBattlerIndex(),
            Math.max(pokemon.getMaxHp() >> 4, 1),
            i18next.t("battle:turnEndHpRestore", {
              pokemonName: getPokemonNameWithAffix(pokemon),
            }),
            true,
          );
        }

        if (!pokemon.isPlayer()) {
          globalScene.applyPlayerItems(TrainerItemEffect.ENEMY_HEAL, { pokemon: pokemon });
          globalScene.applyPlayerItems(TrainerItemEffect.ENEMY_STATUS_HEAL_CHANCE, { pokemon: pokemon });
        }

        applyAbAttrs("PostTurnAbAttr", { pokemon });
      }

      applyHeldItems(HeldItemEffect.TURN_END_STATUS, { pokemon: pokemon });

      applyHeldItems(HeldItemEffect.TURN_END_ITEM_STEAL, { pokemon: pokemon });

      pokemon.tempSummonData.turnCount++;
      pokemon.tempSummonData.waveTurnCount++;
    };

    if (!this.upcomingInterlude) {
      this.executeForAll(handlePokemon);

      globalScene.arena.lapseTags();
    }

    if (globalScene.arena.weather && !globalScene.arena.weather.lapse()) {
      globalScene.arena.trySetWeather(WeatherType.NONE);
      globalScene.arena.triggerWeatherBasedFormChangesToNormal();
    }

    if (globalScene.arena.terrain && !globalScene.arena.terrain.lapse()) {
      globalScene.arena.trySetTerrain(TerrainType.NONE);
    }

    this.end();
  }
}
