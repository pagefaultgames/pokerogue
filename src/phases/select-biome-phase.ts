import { globalScene } from "#app/global-scene";
import { biomeLinks, getBiomeName } from "#app/data/balance/biomes";
import { Biome } from "#app/enums/biome";
import { MoneyInterestModifier, MapModifier } from "#app/modifier/modifier";
import type { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import { Mode } from "#app/ui/ui";
import { BattlePhase } from "./battle-phase";
import { randSeedInt } from "#app/utils";
import { PartyHealPhase } from "./party-heal-phase";
import { SwitchBiomePhase } from "./switch-biome-phase";

export class SelectBiomePhase extends BattlePhase {
  start() {
    super.start();

    const currentBiome = globalScene.arena.biomeType;

    const setNextBiome = (nextBiome: Biome) => {
      if (globalScene.currentBattle.waveIndex % 10 === 1) {
        globalScene.applyModifiers(MoneyInterestModifier, true);
        globalScene.unshiftPhase(new PartyHealPhase(false));
      }
      globalScene.unshiftPhase(new SwitchBiomePhase(nextBiome));
      this.end();
    };

    if (
      (globalScene.gameMode.isClassic && globalScene.gameMode.isWaveFinal(globalScene.currentBattle.waveIndex + 9)) ||
      (globalScene.gameMode.isDaily && globalScene.gameMode.isWaveFinal(globalScene.currentBattle.waveIndex)) ||
      (globalScene.gameMode.hasShortBiomes && !(globalScene.currentBattle.waveIndex % 50))
    ) {
      setNextBiome(Biome.END);
    } else if (globalScene.gameMode.hasRandomBiomes) {
      setNextBiome(this.generateNextBiome());
    } else if (Array.isArray(biomeLinks[currentBiome])) {
      const biomes: Biome[] = (biomeLinks[currentBiome] as (Biome | [Biome, number])[])
        .filter(b => !Array.isArray(b) || !randSeedInt(b[1]))
        .map(b => (!Array.isArray(b) ? b : b[0]));

      if (biomes.length > 1 && globalScene.findModifier(m => m instanceof MapModifier)) {
        const biomeSelectItems = biomes.map(b => {
          const ret: OptionSelectItem = {
            label: getBiomeName(b),
            handler: () => {
              globalScene.ui.setMode(Mode.MESSAGE);
              setNextBiome(b);
              return true;
            },
          };
          return ret;
        });
        globalScene.ui.setMode(Mode.OPTION_SELECT, {
          options: biomeSelectItems,
          delay: 1000,
        });
      } else {
        setNextBiome(biomes[randSeedInt(biomes.length)]);
      }
    } else if (biomeLinks.hasOwnProperty(currentBiome)) {
      setNextBiome(biomeLinks[currentBiome] as Biome);
    } else {
      setNextBiome(this.generateNextBiome());
    }
  }

  generateNextBiome(): Biome {
    if (!(globalScene.currentBattle.waveIndex % 50)) {
      return Biome.END;
    }
    return globalScene.generateRandomBiome(globalScene.currentBattle.waveIndex);
  }
}
