import { globalScene } from "#app/global-scene";
import { biomeLinks, getBiomeName } from "#app/data/balance/biomes";
import { Biome } from "#app/enums/biome";
import { MoneyInterestModifier, MapModifier } from "#app/modifier/modifier";
import type { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import { Mode } from "#app/ui/ui";
import { BattlePhase } from "./battle-phase";
import * as Utils from "#app/utils";
import { PartyHealPhase } from "./party-heal-phase";
import { SwitchBiomePhase } from "./switch-biome-phase";

export class SelectBiomePhase extends BattlePhase {
  constructor() {
    super();
  }

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

    if ((globalScene.gameMode.isClassic && globalScene.gameMode.isWaveFinal(globalScene.currentBattle.waveIndex + 9))
        || (globalScene.gameMode.isDaily && globalScene.gameMode.isWaveFinal(globalScene.currentBattle.waveIndex))
        || (globalScene.gameMode.hasShortBiomes && !(globalScene.currentBattle.waveIndex % 50))) {
      setNextBiome(Biome.END);
    } else if (globalScene.gameMode.hasRandomBiomes) {
      setNextBiome(this.generateNextBiome());
    } else if (Array.isArray(biomeLinks[currentBiome])) {
      let biomes: Biome[] = [];
      globalScene.executeWithSeedOffset(() => {
        biomes = (biomeLinks[currentBiome] as (Biome | [Biome, integer])[])
          .filter(b => !Array.isArray(b) || !Utils.randSeedInt(b[1]))
          .map(b => !Array.isArray(b) ? b : b[0]);
      }, globalScene.currentBattle.waveIndex);
      if (biomes.length > 1 && globalScene.findModifier(m => m instanceof MapModifier)) {
        let biomeChoices: Biome[] = [];
        globalScene.executeWithSeedOffset(() => {
          biomeChoices = (!Array.isArray(biomeLinks[currentBiome])
            ? [ biomeLinks[currentBiome] as Biome ]
            : biomeLinks[currentBiome] as (Biome | [Biome, integer])[])
            .filter((b, i) => !Array.isArray(b) || !Utils.randSeedInt(b[1]))
            .map(b => Array.isArray(b) ? b[0] : b);
        }, globalScene.currentBattle.waveIndex);
        const biomeSelectItems = biomeChoices.map(b => {
          const ret: OptionSelectItem = {
            label: getBiomeName(b),
            handler: () => {
              globalScene.ui.setMode(Mode.MESSAGE);
              setNextBiome(b);
              return true;
            }
          };
          return ret;
        });
        globalScene.ui.setMode(Mode.OPTION_SELECT, {
          options: biomeSelectItems,
          delay: 1000
        });
      } else {
        setNextBiome(biomes[Utils.randSeedInt(biomes.length)]);
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
