import { globalScene } from "#app/global-scene";
import { allBiomes } from "#data/data-lists";
import { BiomeId } from "#enums/biome-id";
import { ChallengeType } from "#enums/challenge-type";
import { UiMode } from "#enums/ui-mode";
import { MapModifier, MoneyInterestModifier } from "#modifiers/modifier";
import { BattlePhase } from "#phases/battle-phase";
import type { OptionSelectItem } from "#ui/abstract-option-select-ui-handler";
import { applyChallenges } from "#utils/challenge-utils";
import { BooleanHolder, getBiomeName, randSeedInt, randSeedItem } from "#utils/common";
import { enumValueToKey } from "#utils/enums";

export class SelectBiomePhase extends BattlePhase {
  public readonly phaseName = "SelectBiomePhase";

  start() {
    super.start();

    globalScene.resetSeed();

    const gameMode = globalScene.gameMode;
    const currentBiome = globalScene.arena.biomeId;
    const currentWaveIndex = globalScene.currentBattle.waveIndex;
    const nextWaveIndex = currentWaveIndex + 1;

    if (
      (gameMode.isClassic && gameMode.isWaveFinal(nextWaveIndex + 9))
      || (gameMode.isDaily && gameMode.isWaveFinal(nextWaveIndex))
      || (gameMode.hasShortBiomes && !(nextWaveIndex % 50))
    ) {
      this.setNextBiomeAndEnd(BiomeId.END);
      return;
    }

    if (gameMode.hasRandomBiomes) {
      this.setNextBiomeAndEnd(this.generateNextBiome(nextWaveIndex));
      return;
    }

    const { biomeLinks } = allBiomes.get(currentBiome);
    if (biomeLinks.length > 1) {
      const biomes: BiomeId[] = biomeLinks
        .filter(b => !Array.isArray(b) || !randSeedInt(b[1]))
        .map(b => (Array.isArray(b) ? b[0] : b));

      if (biomes.length > 1 && globalScene.findModifier(m => m instanceof MapModifier)) {
        const biomeSelectItems = biomes.map(b => {
          return {
            label: getBiomeName(b),
            handler: () => {
              globalScene.ui.setMode(UiMode.MESSAGE);
              this.setNextBiomeAndEnd(b);
              return true;
            },
          } satisfies OptionSelectItem as OptionSelectItem;
        });
        globalScene.ui.setMode(UiMode.OPTION_SELECT, {
          options: biomeSelectItems,
          delay: 1000,
        });
      } else {
        this.setNextBiomeAndEnd(randSeedItem(biomes));
      }
      return;
    }

    if (biomeLinks.length === 1) {
      if (Array.isArray(biomeLinks[0])) {
        console.warn(
          "Biomes with a link to a single other biome should not have a weight assigned to the link.\n",
          "Biome:",
          enumValueToKey(BiomeId, allBiomes.get(currentBiome).biomeId),
          "| Links:",
          biomeLinks,
        );
        // @ts-expect-error: failsafe for invalid biome links structure
        biomeLinks[0] = biomeLinks[0][0];
      }
      this.setNextBiomeAndEnd(biomeLinks[0] as BiomeId);
      return;
    }

    this.setNextBiomeAndEnd(this.generateNextBiome(nextWaveIndex));
  }

  private generateNextBiome(waveIndex: number): BiomeId {
    return waveIndex % 50 === 0 ? BiomeId.END : globalScene.generateRandomBiome(waveIndex);
  }

  private setNextBiomeAndEnd(nextBiome: BiomeId): void {
    const gameMode = globalScene.gameMode;
    const currentWaveIndex = globalScene.currentBattle.waveIndex;
    const nextWaveIndex = currentWaveIndex + 1;

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
  }
}
