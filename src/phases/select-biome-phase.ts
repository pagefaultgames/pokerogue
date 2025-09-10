import { globalScene } from "#app/global-scene";
import { biomeLinks, getBiomeName } from "#balance/biomes";
import { BiomeId } from "#enums/biome-id";
import { ChallengeType } from "#enums/challenge-type";
import { UiMode } from "#enums/ui-mode";
import { MapModifier, MoneyInterestModifier } from "#modifiers/modifier";
import { BattlePhase } from "#phases/battle-phase";
import type { OptionSelectItem } from "#ui/handlers/abstract-option-select-ui-handler";
import { applyChallenges } from "#utils/challenge-utils";
import { BooleanHolder, randSeedInt } from "#utils/common";

export class SelectBiomePhase extends BattlePhase {
  public readonly phaseName = "SelectBiomePhase";
  start() {
    super.start();

    globalScene.resetSeed();

    const gameMode = globalScene.gameMode;
    const currentBiome = globalScene.arena.biomeType;
    const currentWaveIndex = globalScene.currentBattle.waveIndex;
    const nextWaveIndex = currentWaveIndex + 1;

    const setNextBiome = (nextBiome: BiomeId) => {
      if (nextWaveIndex % 10 === 1) {
        globalScene.applyModifiers(MoneyInterestModifier, true);
        const healStatus = new BooleanHolder(true);
        applyChallenges(ChallengeType.PARTY_HEAL, healStatus);
        if (healStatus.value) {
          globalScene.phaseManager.unshiftNew("PartyHealPhase", false);
        } else {
          globalScene.phaseManager.unshiftNew(
            "SelectModifierPhase",
            undefined,
            undefined,
            gameMode.isFixedBattle(currentWaveIndex)
              ? gameMode.getFixedBattle(currentWaveIndex).customModifierRewardSettings
              : undefined,
          );
        }
      }
      globalScene.phaseManager.unshiftNew("SwitchBiomePhase", nextBiome);
      this.end();
    };

    if (
      (gameMode.isClassic && gameMode.isWaveFinal(nextWaveIndex + 9))
      || (gameMode.isDaily && gameMode.isWaveFinal(nextWaveIndex))
      || (gameMode.hasShortBiomes && !(nextWaveIndex % 50))
    ) {
      setNextBiome(BiomeId.END);
    } else if (gameMode.hasRandomBiomes) {
      setNextBiome(this.generateNextBiome(nextWaveIndex));
    } else if (Array.isArray(biomeLinks[currentBiome])) {
      const biomes: BiomeId[] = (biomeLinks[currentBiome] as (BiomeId | [BiomeId, number])[])
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
        // TODO: should this use `randSeedItem`?
        setNextBiome(biomes[randSeedInt(biomes.length)]);
      }
    } else if (biomeLinks.hasOwnProperty(currentBiome)) {
      setNextBiome(biomeLinks[currentBiome] as BiomeId);
    } else {
      setNextBiome(this.generateNextBiome(nextWaveIndex));
    }
  }

  generateNextBiome(waveIndex: number): BiomeId {
    return waveIndex % 50 === 0 ? BiomeId.END : globalScene.generateRandomBiome(waveIndex);
  }
}
