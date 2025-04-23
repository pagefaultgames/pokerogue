import { globalScene } from "#app/global-scene";
import { biomeLinks, getBiomeName } from "#app/data/balance/biomes";
import { Biome } from "#app/enums/biome";
import { MoneyInterestModifier, MapModifier } from "#app/modifier/modifier";
import type { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import { UiMode } from "#enums/ui-mode";
import { BattlePhase } from "./battle-phase";
import { randSeedInt } from "#app/utils/common";
import { PartyHealPhase } from "./party-heal-phase";
import { SwitchBiomePhase } from "./switch-biome-phase";

export class SelectBiomePhase extends BattlePhase {
  start() {
    super.start();

    const currentBiome = globalScene.arena.biomeType;
    const nextWaveIndex = globalScene.currentBattle.waveIndex + 1;

    const setNextBiome = (nextBiome: Biome) => {
      if (nextWaveIndex % 10 === 1) {
        globalScene.applyModifiers(MoneyInterestModifier, true);
        globalScene.unshiftPhase(new PartyHealPhase(false));
      }
      globalScene.unshiftPhase(new SwitchBiomePhase(nextBiome));
      this.end();
    };

    if (
      (globalScene.gameMode.isClassic && globalScene.gameMode.isWaveFinal(nextWaveIndex + 9)) ||
      (globalScene.gameMode.isDaily && globalScene.gameMode.isWaveFinal(nextWaveIndex)) ||
      (globalScene.gameMode.hasShortBiomes && !(nextWaveIndex % 50))
    ) {
      setNextBiome(Biome.END);
    } else if (globalScene.gameMode.hasRandomBiomes) {
      setNextBiome(this.generateNextBiome(nextWaveIndex));
    } else if (Array.isArray(biomeLinks[currentBiome])) {
      const biomes: Biome[] = (biomeLinks[currentBiome] as (Biome | [Biome, number])[])
        .filter(b => !Array.isArray(b) || !randSeedInt(b[1]))
        .map(b => (!Array.isArray(b) ? b : b[0]));

      if (biomes.length > 1 && globalScene.findModifier(m => m instanceof MapModifier)) {
        const biomeSelectItems = biomes.map(b => {
          const ret: OptionSelectItem = {
            label: getBiomeName(b),
            handler: () => {
              globalScene.ui.setMode(UiMode.MESSAGE);
              setNextBiome(b);
              return true;
            },
          };
          return ret;
        });
        globalScene.ui.setMode(UiMode.OPTION_SELECT, {
          options: biomeSelectItems,
          delay: 1000,
        });
      } else {
        setNextBiome(biomes[randSeedInt(biomes.length)]);
      }
    } else if (biomeLinks.hasOwnProperty(currentBiome)) {
      setNextBiome(biomeLinks[currentBiome] as Biome);
    } else {
      setNextBiome(this.generateNextBiome(nextWaveIndex));
    }
  }

  generateNextBiome(waveIndex: number): Biome {
    if (!(waveIndex % 50)) {
      return Biome.END;
    }
    return globalScene.generateRandomBiome(waveIndex);
  }
}
