import { defaultStarterSpecies } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { speciesDataRegistry } from "#app/global-species-data-registry";
import type { IEggOptions } from "#data/egg";
import { DexAttr } from "#enums/dex-attr";
import { EggSourceType } from "#enums/egg-source-types";
import { EggTier } from "#enums/egg-type";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { EggData } from "#system/egg-data";
import { VoucherType } from "#system/voucher";
import type { DexData, DexEntry } from "#types/dex-data";
import type { SystemSaveMigrator } from "#types/save-migrators";
import type { AwaitableUiHandler } from "#ui/awaitable-ui-handler";
import { fixedInt, randSeedItem } from "#utils/common";
import i18next from "i18next";

const LEGENDARY_RATIO = 0.02;
const EPIC_RATIO = 0.08;
const RARE_RATIO = 0.2;

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
  const legendaryCount = Math.ceil(pullCount * LEGENDARY_RATIO);
  pullCount -= legendaryCount;
  const epicCount = Math.ceil(pullCount * EPIC_RATIO);
  pullCount -= epicCount;
  const rareCount = Math.ceil(pullCount * RARE_RATIO);
  pullCount -= rareCount;
  const commonCount = pullCount;
  const pullCounts = {
    [EggTier.LEGENDARY]: legendaryCount,
    [EggTier.EPIC]: epicCount,
    [EggTier.RARE]: rareCount,
    [EggTier.COMMON]: commonCount,
  };

  let pulledCount = 0;
  for (const [tier, count] of Object.entries(pullCounts)) {
    const eggTier = Number(tier) as EggTier;
    const ownedTierStarters = speciesDataRegistry
      .getSpeciesForEggTier(eggTier)
      .filter(ps => ownedStarters.includes(ps.speciesId));

    if (ownedTierStarters.length === 0) {
      pullCounts[eggTier] = 0;
      pullCounts[eggTier - 1] += count; // move to next lower tier

      console.warn("Comp: No available starters at tier:", EggTier[eggTier]);
      continue;
    }

    for (let i = 0; i < count; i++) {
      const species = randSeedItem(ownedTierStarters);
      const eggOptions: IEggOptions = {
        pulled: false,
        sourceType: EggSourceType.EVENT,
        hatchWaves: (Math.floor(pulledCount / 81) + 1) * 5,
        species: species.speciesId,
        isShiny: true,
        tier: eggTier, // needed as it break the id generation if not set
      };
      pulledCount++;

      eggs.push(new EggData(eggOptions));
    }
  }

  globalScene.time.delayedCall(fixedInt(2000), async () => {
    if (!globalScene.ui.getHandler<AwaitableUiHandler>().tutorialActive) {
      await globalScene.ui.setOverlayMode(
        UiMode.ALERT_MODAL,
        i18next.t("migrators:eggCompensation", { eggCount: eggs.length }),
        5000,
      );
    }
  });

  return eggs;
}

const shinyCompensationMigrator: SystemSaveMigrator = {
  version: "1.12.0.3",
  migrate: (data): void => {
    const defaultStarterCount = getStarters(
      data.dexData,
      d => d?.caughtAttr > 0n && d?.ivs?.every(iv => iv === 15) && d?.natureAttr === 1,
      false,
    ).length;

    // It is overwhelmingly unlikely to have even one 15/15/15/15/15/15 (non default) starter
    if (defaultStarterCount < 3) {
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
    const seed = (data.trainerId?.toString() ?? "EGGS") + (data.secretId?.toString() ?? "EGGS") + "EGGS";

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
  version: "1.12.0.3",
  migrate: (data): void => {
    if (
      !data?.voucherCounts
      || data.voucherCounts[VoucherType.PLUS] == null
      || data.voucherCounts[VoucherType.PREMIUM] == null
      || data.voucherCounts[VoucherType.GOLDEN] == null
    ) {
      console.warn("Missing voucherCounts in system save data.");
      return;
    }
    console.log("Applying voucher compensation");
    data.voucherCounts[VoucherType.PLUS] += 5;
    data.voucherCounts[VoucherType.PREMIUM] += 2;
    data.voucherCounts[VoucherType.GOLDEN] += 1;
  },
};

// a copy of the 1.12.0.1 migrator with the `.abilityAttr` check fixed
const fixDexData: SystemSaveMigrator = {
  version: "1.12.0.3",
  migrate: (data): void => {
    const defaultStarterAttr =
      DexAttr.NON_SHINY | DexAttr.MALE | DexAttr.FEMALE | DexAttr.DEFAULT_VARIANT | DexAttr.DEFAULT_FORM;

    for (const speciesId of speciesDataRegistry.getAllStarters()) {
      if (defaultStarterSpecies.includes(speciesId)) {
        continue;
      }

      const starterEntry = data.starterData[speciesId];
      const dexEntry = data.dexData[speciesId];

      const species = SpeciesId[speciesId];

      if (starterEntry == null) {
        console.warn("Missing starter data for %s (%d)!", species, speciesId);
      }
      if (dexEntry == null) {
        console.warn("Missing dex data for %s (%d)!", species, speciesId);
      }

      const hasStarterData =
        starterEntry.abilityAttr > 0 // starters are initialized with 0 and not 1
        || starterEntry.eggMoves > 0
        || starterEntry.moveset != null
        || starterEntry.passiveAttr > 0
        || starterEntry.valueReduction > 0;

      const noDexData = dexEntry.caughtCount === 0 && dexEntry.hatchedCount === 0 && dexEntry.caughtAttr === 0n;

      if (hasStarterData && noDexData) {
        console.warn("Missing dex data for %s (%d), creating backup data.", species, speciesId);

        data.dexData[speciesId] = {
          ...data.dexData[speciesId],
          caughtCount: 1,
          caughtAttr: defaultStarterAttr,
          natureAttr: 1,
          ivs: [15, 15, 15, 15, 15, 15],
        };
      }
    }
  },
};

export const systemMigrators: readonly SystemSaveMigrator[] = [
  fixDexData,
  shinyCompensationMigrator,
  voucherCompensationMigrator,
] as const;
