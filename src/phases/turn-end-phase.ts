import { applyPostTurnAbAttrs, PostTurnAbAttr } from "#app/data/ability";
import { BattlerTagLapseType } from "#app/data/battler-tags";
import { TerrainType } from "#app/data/terrain";
import { WeatherType } from "#app/enums/weather-type";
import { TurnEndEvent } from "#app/events/battle-scene";
import Pokemon from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { TurnHealModifier, EnemyTurnHealModifier, EnemyStatusEffectHealChanceModifier, TurnStatusEffectModifier, TurnHeldItemTransferModifier } from "#app/modifier/modifier";
import i18next from "i18next";
import { FieldPhase } from "./field-phase";
import { PokemonHealPhase } from "./pokemon-heal-phase";
import { gScene } from "#app/battle-scene";

export class TurnEndPhase extends FieldPhase {
  constructor() {
    super();
  }

  start() {
    super.start();

    gScene.currentBattle.incrementTurn();
    gScene.eventTarget.dispatchEvent(new TurnEndEvent(gScene.currentBattle.turn));

    const handlePokemon = (pokemon: Pokemon) => {
      pokemon.lapseTags(BattlerTagLapseType.TURN_END);

      gScene.applyModifiers(TurnHealModifier, pokemon.isPlayer(), pokemon);

      if (gScene.arena.terrain?.terrainType === TerrainType.GRASSY && pokemon.isGrounded()) {
        gScene.unshiftPhase(new PokemonHealPhase(pokemon.getBattlerIndex(),
          Math.max(pokemon.getMaxHp() >> 4, 1), i18next.t("battle:turnEndHpRestore", { pokemonName: getPokemonNameWithAffix(pokemon) }), true));
      }

      if (!pokemon.isPlayer()) {
        gScene.applyModifiers(EnemyTurnHealModifier, false, pokemon);
        gScene.applyModifier(EnemyStatusEffectHealChanceModifier, false, pokemon);
      }

      applyPostTurnAbAttrs(PostTurnAbAttr, pokemon);

      gScene.applyModifiers(TurnStatusEffectModifier, pokemon.isPlayer(), pokemon);

      gScene.applyModifiers(TurnHeldItemTransferModifier, pokemon.isPlayer(), pokemon);

      pokemon.battleSummonData.turnCount++;
      pokemon.battleSummonData.waveTurnCount++;
    };

    this.executeForAll(handlePokemon);

    gScene.arena.lapseTags();

    if (gScene.arena.weather && !gScene.arena.weather.lapse()) {
      gScene.arena.trySetWeather(WeatherType.NONE, false);
      gScene.arena.triggerWeatherBasedFormChangesToNormal();
    }

    if (gScene.arena.terrain && !gScene.arena.terrain.lapse()) {
      gScene.arena.trySetTerrain(TerrainType.NONE, false);
    }

    this.end();
  }
}
