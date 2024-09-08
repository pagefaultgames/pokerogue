import BattleScene from "#app/battle-scene";
import { applyPreWeatherEffectAbAttrs, SuppressWeatherEffectAbAttr, PreWeatherDamageAbAttr, applyAbAttrs, BlockNonDirectDamageAbAttr, applyPostWeatherLapseAbAttrs, PostWeatherLapseAbAttr } from "#app/data/ability.js";
import { CommonAnim } from "#app/data/battle-anims";
import { Weather, getWeatherDamageMessage, getWeatherLapseMessage } from "#app/data/weather";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { WeatherType } from "#app/enums/weather-type";
import Pokemon, { HitResult } from "#app/field/pokemon";
import * as Utils from "#app/utils";
import { CommonAnimPhase } from "./common-anim-phase";

export class WeatherEffectPhase extends CommonAnimPhase {
  public weather: Weather | null;

  constructor(scene: BattleScene) {
    super(scene, undefined, undefined, CommonAnim.SUNNY + ((scene?.arena?.weather?.weatherType || WeatherType.NONE) - 1));
    this.weather = scene?.arena?.weather;
  }

  start() {
    // Update weather state with any changes that occurred during the turn
    this.weather = this.scene?.arena?.weather;

    if (!this.weather) {
      this.end();
      return;
    }

    this.setAnimation(CommonAnim.SUNNY + (this.weather.weatherType - 1));

    if (this.weather.isDamaging()) {

      const cancelled = new Utils.BooleanHolder(false);

      this.executeForAll((pokemon: Pokemon) => applyPreWeatherEffectAbAttrs(SuppressWeatherEffectAbAttr, pokemon, this.weather, cancelled));

      if (!cancelled.value) {
        const inflictDamage = (pokemon: Pokemon) => {
          const cancelled = new Utils.BooleanHolder(false);

          applyPreWeatherEffectAbAttrs(PreWeatherDamageAbAttr, pokemon, this.weather, cancelled);
          applyAbAttrs(BlockNonDirectDamageAbAttr, pokemon, cancelled);

          if (cancelled.value || pokemon.getTag(BattlerTagType.UNDERGROUND) || pokemon.getTag(BattlerTagType.UNDERWATER)) {
            return;
          }

          const damage = Math.ceil(pokemon.getMaxHp() / 16);

          this.scene.queueMessage(getWeatherDamageMessage(this.weather?.weatherType!, pokemon)!); // TODO: are those bangs correct?
          pokemon.damageAndUpdate(damage, HitResult.EFFECTIVE, false, false, true);
        };

        this.executeForAll((pokemon: Pokemon) => {
          const immune = !pokemon || !!pokemon.getTypes(true, true).filter(t => this.weather?.isTypeDamageImmune(t)).length;
          if (!immune) {
            inflictDamage(pokemon);
          }
        });
      }
    }

    this.scene.ui.showText(getWeatherLapseMessage(this.weather.weatherType)!, null, () => { // TODO: is this bang correct?
      this.executeForAll((pokemon: Pokemon) => applyPostWeatherLapseAbAttrs(PostWeatherLapseAbAttr, pokemon, this.weather));

      super.start();
    });
  }
}
