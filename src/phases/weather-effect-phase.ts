import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import type { Weather } from "#data/weather";
import { getWeatherDamageMessage, getWeatherLapseMessage } from "#data/weather";
import { BattlerTagType } from "#enums/battler-tag-type";
import { HitResult } from "#enums/hit-result";
import { CommonAnim } from "#enums/move-anims-common";
import { WeatherType } from "#enums/weather-type";
import type { Pokemon } from "#field/pokemon";
import { CommonAnimPhase } from "#phases/common-anim-phase";
import { BooleanHolder, toDmgValue } from "#utils/common";

export class WeatherEffectPhase extends CommonAnimPhase {
  public readonly phaseName = "WeatherEffectPhase";
  public weather: Weather | null;

  constructor() {
    super(
      undefined,
      undefined,
      CommonAnim.SUNNY + ((globalScene?.arena?.weather?.weatherType || WeatherType.NONE) - 1),
    );
    this.weather = globalScene?.arena?.weather;
  }

  start() {
    // Update weather state with any changes that occurred during the turn
    this.weather = globalScene?.arena?.weather;

    if (!this.weather) {
      return this.end();
    }

    this.setAnimation(CommonAnim.SUNNY + (this.weather.weatherType - 1));

    if (this.weather.isDamaging()) {
      const cancelled = new BooleanHolder(false);

      this.executeForAll((pokemon: Pokemon) =>
        applyAbAttrs("SuppressWeatherEffectAbAttr", { pokemon, weather: this.weather, cancelled }),
      );

      if (!cancelled.value) {
        const inflictDamage = (pokemon: Pokemon) => {
          const cancelled = new BooleanHolder(false);

          applyAbAttrs("PreWeatherDamageAbAttr", { pokemon, weather: this.weather, cancelled });
          applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon, cancelled });

          if (
            cancelled.value
            || pokemon.getTag(BattlerTagType.UNDERGROUND)
            || pokemon.getTag(BattlerTagType.UNDERWATER)
          ) {
            return;
          }

          const damage = toDmgValue(pokemon.getMaxHp() / 16);

          globalScene.phaseManager.queueMessage(getWeatherDamageMessage(this.weather!.weatherType, pokemon) ?? "");
          pokemon.damageAndUpdate(damage, { result: HitResult.INDIRECT, ignoreSegments: true });
        };

        this.executeForAll((pokemon: Pokemon) => {
          const immune =
            !pokemon
            || pokemon.getTypes(true, true).filter(t => this.weather?.isTypeDamageImmune(t)).length > 0
            || pokemon.switchOutStatus;
          if (!immune) {
            inflictDamage(pokemon);
          }
        });
      }
    }

    globalScene.ui.showText(getWeatherLapseMessage(this.weather.weatherType) ?? "", null, () => {
      this.executeForAll((pokemon: Pokemon) => {
        if (!pokemon.switchOutStatus) {
          applyAbAttrs("PostWeatherLapseAbAttr", { pokemon, weather: this.weather });
        }
      });

      super.start();
    });
  }
}
