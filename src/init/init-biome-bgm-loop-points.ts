import { assignBiomeBgmLoopPoints } from "#data/biome-bgm-loop-points";
import { cachedFetch } from "#utils/fetch-utils";

export function initBiomeBgmLoopPoints(): void {
  cachedFetch("./biome-bgm-loop-points.json")
    .then(res => res.json())
    .then(bgmLoopPoints => assignBiomeBgmLoopPoints(bgmLoopPoints));
}
