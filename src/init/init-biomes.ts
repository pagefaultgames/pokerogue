import { abyssBiome } from "#biomes/abyss";
import { badlandsBiome } from "#biomes/badlands";
import { beachBiome } from "#biomes/beach";
import { caveBiome } from "#biomes/cave";
import { constructionSiteBiome } from "#biomes/construction-site";
import { desertBiome } from "#biomes/desert";
import { dojoBiome } from "#biomes/dojo";
import { endBiome } from "#biomes/end";
import { factoryBiome } from "#biomes/factory";
import { fairyCaveBiome } from "#biomes/fairy-cave";
import { forestBiome } from "#biomes/forest";
import { grassBiome } from "#biomes/grass";
import { graveyardBiome } from "#biomes/graveyard";
import { iceCaveBiome } from "#biomes/ice-cave";
import { islandBiome } from "#biomes/island";
import { jungleBiome } from "#biomes/jungle";
import { laboratoryBiome } from "#biomes/laboratory";
import { lakeBiome } from "#biomes/lake";
import { meadowBiome } from "#biomes/meadow";
import { metropolisBiome } from "#biomes/metropolis";
import { mountainBiome } from "#biomes/mountain";
import { plainsBiome } from "#biomes/plains";
import { powerPlantBiome } from "#biomes/power-plant";
import { ruinsBiome } from "#biomes/ruins";
import { seaBiome } from "#biomes/sea";
import { seabedBiome } from "#biomes/seabed";
import { slumBiome } from "#biomes/slum";
import { snowyForestBiome } from "#biomes/snowy-forest";
import { spaceBiome } from "#biomes/space";
import { swampBiome } from "#biomes/swamp";
import { tallGrassBiome } from "#biomes/tall-grass";
import { templeBiome } from "#biomes/temple";
import { townBiome } from "#biomes/town";
import { volcanoBiome } from "#biomes/volcano";
import { wastelandBiome } from "#biomes/wasteland";
import type { Biome } from "#data/biome";
import { allBiomes } from "#data/data-lists";

export function initBiomes(): void {
  const rawAllBiomes: readonly Biome[] = [
    townBiome,
    plainsBiome,
    grassBiome,
    tallGrassBiome,
    metropolisBiome,
    forestBiome,
    seaBiome,
    swampBiome,
    beachBiome,
    lakeBiome,
    seabedBiome,
    mountainBiome,
    badlandsBiome,
    caveBiome,
    desertBiome,
    iceCaveBiome,
    meadowBiome,
    powerPlantBiome,
    volcanoBiome,
    graveyardBiome,
    dojoBiome,
    factoryBiome,
    ruinsBiome,
    wastelandBiome,
    abyssBiome,
    spaceBiome,
    constructionSiteBiome,
    jungleBiome,
    fairyCaveBiome,
    templeBiome,
    slumBiome,
    snowyForestBiome,
    islandBiome,
    laboratoryBiome,
    endBiome,
  ];

  for (const biome of rawAllBiomes) {
    allBiomes.set(biome.biomeId, biome);
  }
}
