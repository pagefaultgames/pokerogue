import { allBiomes, biomeDepths } from "#data/data-lists";
import { BiomeId } from "#enums/biome-id";
import { randSeedInt } from "#utils/common";

// TODO: figure out what this nonsense is

export function initBiomeDepths(): void {
  biomeDepths[BiomeId.TOWN] = [0, 1];

  traverseBiome(BiomeId.TOWN, 0);
  biomeDepths[BiomeId.END] = [
    Object.values(biomeDepths)
      .map(d => d[0])
      .reduce((max: number, value: number) => Math.max(max, value), 0) + 1,
    1,
  ];
}

function traverseBiome(biomeId: BiomeId, depth: number): void {
  if (biomeId === BiomeId.END) {
    const biomeList = Object.values(BiomeId);
    biomeList.pop(); // Removes BiomeId.END from the list
    const randIndex = randSeedInt(biomeList.length, 1); // Will never be BiomeId.TOWN
    biomeId = biomeList[randIndex];
  }

  const { biomeLinks } = allBiomes.get(biomeId);
  for (const linkedBiomeEntry of biomeLinks) {
    const linkedBiome = Array.isArray(linkedBiomeEntry) ? linkedBiomeEntry[0] : linkedBiomeEntry;
    const biomeChance = Array.isArray(linkedBiomeEntry) ? linkedBiomeEntry[1] : 1;
    if (
      !Object.hasOwn(biomeDepths, linkedBiome)
      || biomeChance < biomeDepths[linkedBiome][1]
      || (depth < biomeDepths[linkedBiome][0] && biomeChance === biomeDepths[linkedBiome][1])
    ) {
      biomeDepths[linkedBiome] = [depth + 1, biomeChance];
      traverseBiome(linkedBiome, depth + 1);
    }
  }
}
