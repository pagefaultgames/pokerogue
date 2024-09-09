import BattleScene from "#app/battle-scene.js";
import { biomeLinks, getBiomeName } from "#app/data/biomes.js";
import { Biome } from "#app/enums/biome.js";
import { MoneyInterestModifier, MapModifier } from "#app/modifier/modifier.js";
import { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler.js";
import { Mode } from "#app/ui/ui.js";
import { BattlePhase } from "./battle-phase";
import * as Utils from "#app/utils.js";
import { PartyHealPhase } from "./party-heal-phase";
import { SwitchBiomePhase } from "./switch-biome-phase";

export class SelectBiomePhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    const currentBiome = this.scene.arena.biomeType;

    const setNextBiome = (nextBiome: Biome) => {
      if (this.scene.currentBattle.waveIndex % 10 === 1) {
        this.scene.applyModifiers(MoneyInterestModifier, true, this.scene);
        this.scene.unshiftPhase(new PartyHealPhase(this.scene, false));
      }
      this.scene.unshiftPhase(new SwitchBiomePhase(this.scene, nextBiome));
      this.end();
    };

    if ((this.scene.gameMode.isClassic && this.scene.gameMode.isWaveFinal(this.scene.currentBattle.waveIndex + 9))
        || (this.scene.gameMode.isDaily && this.scene.gameMode.isWaveFinal(this.scene.currentBattle.waveIndex))
        || (this.scene.gameMode.hasShortBiomes && !(this.scene.currentBattle.waveIndex % 50))) {
      setNextBiome(Biome.END);
    } else if (this.scene.gameMode.hasRandomBiomes) {
      setNextBiome(this.generateNextBiome());
    } else if (Array.isArray(biomeLinks[currentBiome])) {
      let biomes: Biome[] = [];
      this.scene.executeWithSeedOffset(() => {
        biomes = (biomeLinks[currentBiome] as (Biome | [Biome, integer])[])
          .filter(b => !Array.isArray(b) || !Utils.randSeedInt(b[1]))
          .map(b => !Array.isArray(b) ? b : b[0]);
      }, this.scene.currentBattle.waveIndex);
      if (biomes.length > 1 && this.scene.findModifier(m => m instanceof MapModifier)) {
        let biomeChoices: Biome[] = [];
        this.scene.executeWithSeedOffset(() => {
          biomeChoices = (!Array.isArray(biomeLinks[currentBiome])
            ? [biomeLinks[currentBiome] as Biome]
            : biomeLinks[currentBiome] as (Biome | [Biome, integer])[])
            .filter((b, i) => !Array.isArray(b) || !Utils.randSeedInt(b[1]))
            .map(b => Array.isArray(b) ? b[0] : b);
        }, this.scene.currentBattle.waveIndex);
        const biomeSelectItems = biomeChoices.map(b => {
          const ret: OptionSelectItem = {
            label: getBiomeName(b),
            handler: () => {
              this.scene.ui.setMode(Mode.MESSAGE);
              setNextBiome(b);
              return true;
            }
          };
          return ret;
        });
        this.scene.ui.setMode(Mode.OPTION_SELECT, {
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
    if (!(this.scene.currentBattle.waveIndex % 50)) {
      return Biome.END;
    }
    return this.scene.generateRandomBiome(this.scene.currentBattle.waveIndex);
  }
}
