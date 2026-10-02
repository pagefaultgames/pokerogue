import { globalScene } from "#app/global-scene";
import { RewardId } from "#enums/reward-id";
import { RarityTier } from "#enums/reward-tier";
import type { RewardPoolEntry } from "#types/rewards";
import { weightedPick } from "#utils/random";
import { generateRewardOptionFromId } from "./reward-utils";

export function findHiddenItems() {
  const onField = globalScene.getPlayerField();
  //  const biomeId = globalScene.arena.biomeId;

  const map = {};
  for (const pokemon of onField) {
    const rewardMap = new Map<RewardPoolEntry, number>();
    for (const entry of hiddenItemsPool) {
      rewardMap.set(entry, typeof entry.weight === "number" ? entry.weight : 0);
    }
    const pickedPoolEntry = weightedPick(rewardMap);

    const rewardOption = generateRewardOptionFromId(pickedPoolEntry.id, 0, RarityTier.COMMON, 0);

    map[pokemon.name] = rewardOption;

    globalScene.ui.showText(`${pokemon.name} found a hidden item: ${rewardOption.type.name}!`);

    const customShopRewards = { guaranteedRewardOptions: [rewardOption] };
    globalScene.phaseManager.unshiftNew("SelectRewardPhase", 0, undefined, customShopRewards, false, true);
  }
}

const hiddenItemsPool: RewardPoolEntry[] = [
  { id: RewardId.RARE_CANDY, weight: 1 },
  { id: RewardId.BERRY, weight: 1 },
];
