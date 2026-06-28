import { defaultStarterSpecies } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { speciesDataRegistry } from "#app/global-species-data-registry";
import type { IEggOptions } from "#data/egg";
import { DexAttr } from "#enums/dex-attr";
import { EggSourceType } from "#enums/egg-source-types";
import type { SpeciesId } from "#enums/species-id";
import { EggData } from "#system/egg-data";
import { VoucherType } from "#system/voucher";
import type { DexData, DexEntry } from "#types/dex-data";
import type { SystemSaveMigrator } from "#types/save-migrators";
import { randSeedItem } from "#utils/common";

function getStarters(
  dexData: DexData | undefined,
  dexEntryPredicate: (entry: DexEntry) => boolean,
  includeDefaults: boolean,
): SpeciesId[] {
  if (dexData == null) {
    return [];
  }

  const starterKeys = speciesDataRegistry.getAllStarters();
  const starters: SpeciesId[] = [];
  for (const s of starterKeys) {
    if (!includeDefaults && defaultStarterSpecies.includes(s)) {
      continue;
    }

    const starterDexEntry = dexData[s];
    if (dexEntryPredicate(starterDexEntry)) {
      starters.push(s);
    }
  }
  return starters;
}

function pullEggs(pullCount: number, ownedStarters: SpeciesId[]): EggData[] {
  const eggs: EggData[] = [];
  for (let i = 1; i <= pullCount; i++) {
    const species = randSeedItem(ownedStarters);
    const eggOptions: IEggOptions = {
      pulled: false,
      sourceType: EggSourceType.EVENT,
      hatchWaves: (Math.floor(i / 81) + 1) * 5,
      species,
      isShiny: true,
    };

    eggs.push(new EggData(eggOptions));
  }
  return eggs;
}

const shinyCompensationMigrator: SystemSaveMigrator = {
  version: "1.12.0.2",
  migrate: (data): void => {
    const defaultStarterCount = getStarters(
      data.dexData,
      d => d?.caughtAttr > 0n && d?.ivs?.every(iv => iv === 15) && d?.natureAttr === 1,
      false,
    ).length;
    const totalStarterCount = Math.max(getStarters(data.dexData, d => d?.caughtAttr > 0n, false).length, 1);

    const defaultRatio = defaultStarterCount / totalStarterCount;
    // It is overwhelmingly unlikely to have even one 15/15/15/15/15/15 starter
    if (defaultStarterCount < 3 && defaultRatio < 0.1) {
      return;
    }

    console.warn("Save data loss detected; applying egg compensation");

    const ownedStarters = getStarters(data.dexData, d => d?.caughtAttr > 0n, true);
    const shinyStarterCount = getStarters(
      data.dexData,
      d => d?.caughtAttr > 0n && !!(d.caughtAttr & DexAttr.SHINY),
      true,
    ).length;
    const foundShinyCount = (data.gameStats?.shinyPokemonSeen ?? 0) + (data.gameStats?.shinyPokemonHatched ?? 0);
    const eggsToPull = foundShinyCount - shinyStarterCount;
    if (eggsToPull <= 0) {
      return;
    }
    console.log("Adding %d eggs", eggsToPull);

    // set seed to avoid save scumming eggs
    // coalesced values are an abundance of caution but will never be used on a well-formatted save
    const seed = (data.trainerId.toString() ?? "EGGS") + (data.secretId.toString() ?? "EGGS") + "EGGS";

    globalScene.executeWithSeedOffset(
      () => {
        const eggs = pullEggs(eggsToPull, ownedStarters);
        if (data.eggs == null) {
          data.eggs = [];
        }
        data.eggs.push(...eggs);
      },
      0,
      seed.toString(),
    );
  },
};

const voucherCompensationMigrator: SystemSaveMigrator = {
  version: "1.12.0.2",
  migrate: (data): void => {
    if (
      !data?.voucherCounts
      || data.voucherCounts[VoucherType.PLUS] == null
      || data.voucherCounts[VoucherType.GOLDEN] == null
    ) {
      console.warn("Missing voucherCounts in system save data.");
      return;
    }
    console.log("Applying voucher compensation");
    data.voucherCounts[VoucherType.PLUS] += 5;
    data.voucherCounts[VoucherType.GOLDEN] += 1;
  },
};

export const systemMigrators: readonly SystemSaveMigrator[] = [
  shinyCompensationMigrator,
  voucherCompensationMigrator,
] as const;
