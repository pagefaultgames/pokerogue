import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { globalScene } from "#app/global-scene";
import type { Weather } from "#data/weather";
import { getWeatherAnim, getWeatherDamageMessage, getWeatherLapseMessage } from "#data/weather";
import { BattlerTagType } from "#enums/battler-tag-type";
import { HitResult } from "#enums/hit-result";
import type { Pokemon } from "#field/pokemon";
import { CommonAnimPhase } from "#phases/common-anim-phase";
import { toDmgValue } from "#utils/common";
import { ValueHolder } from "#utils/value-holder";

export class WeatherEffectPhase extends CommonAnimPhase {
  public readonly phaseName = "WeatherEffectPhase";

  // TODO: is this field even necessary? it's immediately updated in `start()`
  // so the stored value from the constructor is never used
  public weather: Weather | null;

  constructor() {
    super(undefined, undefined, getWeatherAnim(globalScene.arena.weatherType));

    this.weather = globalScene.arena.weather;
  }

  public override start(): void {
    // Update weather state with any changes that occurred during the turn
    this.weather = globalScene.arena.weather;
    // buffer const used so TS actually understands the `null` guard
    const weather = this.weather;

    if (!weather) {
      this.end();
      return;
    }

    this.setAnimation(getWeatherAnim(weather.weatherType));

    if (weather.isDamaging()) {
      const suppressed = new ValueHolder(false);

      this.executeForAll((pokemon: Pokemon) =>
        applyAbAttrs("SuppressWeatherEffectAbAttr", { pokemon, weather, cancelled: suppressed }),
      );

      if (!suppressed.value) {
        const inflictDamage = (pokemon: Pokemon) => {
          const cancelled = new ValueHolder(false);

          applyAbAttrs("PreWeatherDamageAbAttr", { pokemon, weather, cancelled });
          applyAbAttrs("BlockNonDirectDamageAbAttr", { pokemon, cancelled });

          if (
            cancelled.value
            || pokemon.getTag(BattlerTagType.UNDERGROUND)
            || pokemon.getTag(BattlerTagType.UNDERWATER)
          ) {
            return;
          }

          const damage = toDmgValue(pokemon.getMaxHp() / 16);

          globalScene.phaseManager.queueMessage(getWeatherDamageMessage(weather.weatherType, pokemon));
          pokemon.damageAndUpdate(damage, { result: HitResult.INDIRECT, ignoreSegments: true });
        };

        this.executeForAll((pokemon: Pokemon) => {
          const immune =
            !pokemon
            || pokemon.getTypes({ returnOriginalTypesIfStellar: true }).filter(t => weather.isTypeDamageImmune(t))
              .length > 0
            || pokemon.switchOutStatus;
          if (!immune) {
            inflictDamage(pokemon);
          }
        });
      }
    }

    globalScene.ui.showText(getWeatherLapseMessage(weather.weatherType), null, () => {
      this.executeForAll((pokemon: Pokemon) => {
        if (!pokemon.switchOutStatus) {
          applyAbAttrs("PostWeatherLapseAbAttr", { pokemon, weather });
        }
      });

      super.start();
    });
  }
}
