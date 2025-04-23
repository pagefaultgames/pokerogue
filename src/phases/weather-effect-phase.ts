import { globalScene } from "#app/global-scene";
import {
  applyPreWeatherEffectAbAttrs,
  SuppressWeatherEffectAbAttr,
  PreWeatherDamageAbAttr,
  applyAbAttrs,
  BlockNonDirectDamageAbAttr,
  applyPostWeatherLapseAbAttrs,
  PostWeatherLapseAbAttr,
} from "#app/data/abilities/ability";
import { CommonAnim } from "#app/data/battle-anims";
import type { Weather } from "#app/data/weather";
import { getWeatherDamageMessage, getWeatherLapseMessage } from "#app/data/weather";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { WeatherType } from "#app/enums/weather-type";
import type Pokemon from "#app/field/pokemon";
import { HitResult } from "#app/field/pokemon";
import { BooleanHolder, toDmgValue } from "#app/utils/common";
import { CommonAnimPhase } from "./common-anim-phase";

export class WeatherEffectPhase extends CommonAnimPhase {
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
        applyPreWeatherEffectAbAttrs(SuppressWeatherEffectAbAttr, pokemon, this.weather, cancelled),
      );

      if (!cancelled.value) {
        const inflictDamage = (pokemon: Pokemon) => {
          const cancelled = new BooleanHolder(false);

          applyPreWeatherEffectAbAttrs(PreWeatherDamageAbAttr, pokemon, this.weather, cancelled);
          applyAbAttrs(BlockNonDirectDamageAbAttr, pokemon, cancelled);

          if (
            cancelled.value ||
            pokemon.getTag(BattlerTagType.UNDERGROUND) ||
            pokemon.getTag(BattlerTagType.UNDERWATER)
          ) {
            return;
          }

          const damage = toDmgValue(pokemon.getMaxHp() / 16);

          globalScene.queueMessage(getWeatherDamageMessage(this.weather!.weatherType, pokemon) ?? "");
          pokemon.damageAndUpdate(damage, { result: HitResult.INDIRECT, ignoreSegments: true });
        };

        this.executeForAll((pokemon: Pokemon) => {
          const immune =
            !pokemon ||
            !!pokemon.getTypes(true, true).filter(t => this.weather?.isTypeDamageImmune(t)).length ||
            pokemon.switchOutStatus;
          if (!immune) {
            inflictDamage(pokemon);
          }
        });
      }
    }

    globalScene.ui.showText(getWeatherLapseMessage(this.weather.weatherType) ?? "", null, () => {
      this.executeForAll((pokemon: Pokemon) => {
        if (!pokemon.switchOutStatus) {
          applyPostWeatherLapseAbAttrs(PostWeatherLapseAbAttr, pokemon, this.weather);
        }
      });

      super.start();
    });
  }
}
