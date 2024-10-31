import { gScene } from "#app/battle-scene";
import { biomeLinks, getBiomeName } from "#app/data/balance/biomes";
import { Biome } from "#app/enums/biome";
import { MoneyInterestModifier, MapModifier } from "#app/modifier/modifier";
import { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
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

    const currentBiome = gScene.arena.biomeType;

    const setNextBiome = (nextBiome: Biome) => {
      if (gScene.currentBattle.waveIndex % 10 === 1) {
        gScene.applyModifiers(MoneyInterestModifier, true);
        gScene.unshiftPhase(new PartyHealPhase(false));
      }
      gScene.unshiftPhase(new SwitchBiomePhase(nextBiome));
      this.end();
    };

    if ((gScene.gameMode.isClassic && gScene.gameMode.isWaveFinal(gScene.currentBattle.waveIndex + 9))
        || (gScene.gameMode.isDaily && gScene.gameMode.isWaveFinal(gScene.currentBattle.waveIndex))
        || (gScene.gameMode.hasShortBiomes && !(gScene.currentBattle.waveIndex % 50))) {
      setNextBiome(Biome.END);
    } else if (gScene.gameMode.hasRandomBiomes) {
      setNextBiome(this.generateNextBiome());
    } else if (Array.isArray(biomeLinks[currentBiome])) {
      let biomes: Biome[] = [];
      gScene.executeWithSeedOffset(() => {
        biomes = (biomeLinks[currentBiome] as (Biome | [Biome, integer])[])
          .filter(b => !Array.isArray(b) || !Utils.randSeedInt(b[1]))
          .map(b => !Array.isArray(b) ? b : b[0]);
      }, gScene.currentBattle.waveIndex);
      if (biomes.length > 1 && gScene.findModifier(m => m instanceof MapModifier)) {
        let biomeChoices: Biome[] = [];
        gScene.executeWithSeedOffset(() => {
          biomeChoices = (!Array.isArray(biomeLinks[currentBiome])
            ? [ biomeLinks[currentBiome] as Biome ]
            : biomeLinks[currentBiome] as (Biome | [Biome, integer])[])
            .filter((b, i) => !Array.isArray(b) || !Utils.randSeedInt(b[1]))
            .map(b => Array.isArray(b) ? b[0] : b);
        }, gScene.currentBattle.waveIndex);
        const biomeSelectItems = biomeChoices.map(b => {
          const ret: OptionSelectItem = {
            label: getBiomeName(b),
            handler: () => {
              gScene.ui.setMode(Mode.MESSAGE);
              setNextBiome(b);
              return true;
            }
          };
          return ret;
        });
        gScene.ui.setMode(Mode.OPTION_SELECT, {
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
    if (!(gScene.currentBattle.waveIndex % 50)) {
      return Biome.END;
    }
    return gScene.generateRandomBiome(gScene.currentBattle.waveIndex);
  }
}
