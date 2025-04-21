import { applyPostTurnAbAttrs, PostTurnAbAttr } from "#app/data/abilities/ability";
import { BattlerTagLapseType } from "#app/data/battler-tags";
import { TerrainType } from "#app/data/terrain";
import { WeatherType } from "#app/enums/weather-type";
import { TurnEndEvent } from "#app/events/battle-scene";
import type Pokemon from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import {
  TurnHealModifier,
  EnemyTurnHealModifier,
  EnemyStatusEffectHealChanceModifier,
  TurnStatusEffectModifier,
  TurnHeldItemTransferModifier,
} from "#app/modifier/modifier";
import i18next from "i18next";
import { FieldPhase } from "./field-phase";
import { PokemonHealPhase } from "./pokemon-heal-phase";
import { globalScene } from "#app/global-scene";

export class TurnEndPhase extends FieldPhase {
  start() {
    super.start();

    globalScene.currentBattle.incrementTurn();
    globalScene.eventTarget.dispatchEvent(new TurnEndEvent(globalScene.currentBattle.turn));

    globalScene.hideAbilityBar();

    const handlePokemon = (pokemon: Pokemon) => {
      if (!pokemon.switchOutStatus) {
        pokemon.lapseTags(BattlerTagLapseType.TURN_END);

        globalScene.applyModifiers(TurnHealModifier, pokemon.isPlayer(), pokemon);

        if (globalScene.arena.terrain?.terrainType === TerrainType.GRASSY && pokemon.isGrounded()) {
          globalScene.unshiftPhase(
            new PokemonHealPhase(
              pokemon.getBattlerIndex(),
              Math.max(pokemon.getMaxHp() >> 4, 1),
              i18next.t("battle:turnEndHpRestore", {
                pokemonName: getPokemonNameWithAffix(pokemon),
              }),
              true,
            ),
          );
        }

        if (!pokemon.isPlayer()) {
          globalScene.applyModifiers(EnemyTurnHealModifier, false, pokemon);
          globalScene.applyModifier(EnemyStatusEffectHealChanceModifier, false, pokemon);
        }

        applyPostTurnAbAttrs(PostTurnAbAttr, pokemon);
      }

      globalScene.applyModifiers(TurnStatusEffectModifier, pokemon.isPlayer(), pokemon);

      globalScene.applyModifiers(TurnHeldItemTransferModifier, pokemon.isPlayer(), pokemon);

      pokemon.battleSummonData.turnCount++;
      pokemon.battleSummonData.waveTurnCount++;
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
