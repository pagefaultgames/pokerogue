import { abandonedLabBiome } from "#biomes/abandoned-lab";
import { abyssBiome } from "#biomes/abyss";
import { ancientRuinsBiome } from "#biomes/ancient-ruins";
import { badlandsBiome } from "#biomes/badlands";
import { beachBiome } from "#biomes/beach";
import { caveBiome } from "#biomes/cave";
import { constructionSiteBiome } from "#biomes/construction-site";
import { crystalCavernBiome } from "#biomes/crystal-cavern";
import { desertBiome } from "#biomes/desert";
import { dojoBiome } from "#biomes/dojo";
import { enchantedCaveBiome } from "#biomes/enchanted-cave";
import { endBiome } from "#biomes/end";
import { factoryBiome } from "#biomes/factory";
import { forestBiome } from "#biomes/forest";
import { frozenPathBiome } from "#biomes/frozen-path";
import { hauntedPassBiome } from "#biomes/haunted-pass";
import { islandBiome } from "#biomes/island";
import { jungleBiome } from "#biomes/jungle";
import { lakeBiome } from "#biomes/lake";
import { meadowBiome } from "#biomes/meadow";
import { metropolisBiome } from "#biomes/metropolis";
import { mountainBiome } from "#biomes/mountain";
import { oceanBiome } from "#biomes/ocean";
import { overgrownTempleBiome } from "#biomes/overgrown-temple";
import { plainsBiome } from "#biomes/plains";
import { rockyCoastBiome } from "#biomes/rocky-coast";
import { rollingFieldsBiome } from "#biomes/rolling-fields";
import { savannahBiome } from "#biomes/savannah";
import { seabedBiome } from "#biomes/seabed";
import { slumBiome } from "#biomes/slum";
import { snowyTaigaBiome } from "#biomes/snowy-taiga";
import { spaceBiome } from "#biomes/space";
import { summitBiome } from "#biomes/summit";
import { swampBiome } from "#biomes/swamp";
import { tallGrassBiome } from "#biomes/tall-grass";
import { thermalPlantBiome } from "#biomes/thermal-plant";
import { townBiome } from "#biomes/town";
import { undergroundWellBiome } from "#biomes/underground-well";
import { volcanoBiome } from "#biomes/volcano";
import { wastelandBiome } from "#biomes/wasteland";
import { allBiomes } from "#data/data-lists";
import type { Biome } from "#types/biomes";

export function initBiomes(): void {
  const rawAllBiomes: readonly Biome[] = [
    townBiome,
    plainsBiome,
    rollingFieldsBiome,
    tallGrassBiome,
    metropolisBiome,
    forestBiome,
    oceanBiome,
    swampBiome,
    beachBiome,
    lakeBiome,
    seabedBiome,
    mountainBiome,
    badlandsBiome,
    caveBiome,
    desertBiome,
    frozenPathBiome,
    meadowBiome,
    thermalPlantBiome,
    volcanoBiome,
    hauntedPassBiome,
    dojoBiome,
    factoryBiome,
    ancientRuinsBiome,
    wastelandBiome,
    abyssBiome,
    spaceBiome,
    constructionSiteBiome,
    jungleBiome,
    enchantedCaveBiome,
    overgrownTempleBiome,
    slumBiome,
    snowyTaigaBiome,
    undergroundWellBiome,
    rockyCoastBiome,
    summitBiome,
    savannahBiome,
    crystalCavernBiome,
    islandBiome,
    abandonedLabBiome,
    endBiome,
  ];

  for (const biome of rawAllBiomes) {
    allBiomes.set(biome.biomeId, biome);
  }
}
