import { applyAbAttrs } from "#app/data/abilities/apply-ab-attrs";
import { BattlerTagLapseType } from "#enums/battler-tag-lapse-type";
import { TerrainType } from "#app/data/terrain";
import { WeatherType } from "#app/enums/weather-type";
import { TurnEndEvent } from "#app/events/battle-scene";
import type Pokemon from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import i18next from "i18next";
import { FieldPhase } from "./field-phase";
import { globalScene } from "#app/global-scene";
import { applyHeldItems } from "#app/items/all-held-items";
import { HeldItemEffect } from "#app/items/held-item";
import { TRAINER_ITEM_EFFECT } from "#app/items/trainer-item";

export class TurnEndPhase extends FieldPhase {
  public readonly phaseName = "TurnEndPhase";
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
          globalScene.applyPlayerItems(TRAINER_ITEM_EFFECT.ENEMY_HEAL, { pokemon: pokemon });
          globalScene.applyPlayerItems(TRAINER_ITEM_EFFECT.ENEMY_STATUS_HEAL_CHANCE, { pokemon: pokemon });
        }

        applyAbAttrs("PostTurnAbAttr", { pokemon });
      }

      applyHeldItems(HeldItemEffect.TURN_END_STATUS, { pokemon: pokemon });

      applyHeldItems(HeldItemEffect.TURN_END_ITEM_STEAL, { pokemon: pokemon });

      pokemon.tempSummonData.turnCount++;
      pokemon.tempSummonData.waveTurnCount++;
    };

    this.executeForAll(handlePokemon);

    globalScene.arena.lapseTags();

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
