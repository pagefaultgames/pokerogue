import fs from 'fs';
import path from 'path';

const biomeDataDir = './biomeData';
const files = await fs.promises.readdir(biomeDataDir);

let speciesData = {};

for (const file of files) {
  const filePath = path.join(biomeDataDir, file);
  const biome = path.basename(file, '.json');
  const data = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));

  data.forEach(({ rarity, species, gym_leader, team }) => {
    if (species && Array.isArray(species)) {
      species.forEach(({ name, time }) => {
        if (!speciesData[name]) {
          speciesData[name] = { species: name, biomes: [] };
        }

        let biomeData = speciesData[name].biomes.find(b => b.biome === biome);
        if (!biomeData) {
          biomeData = { biome, rarities: [], gym_leaders: [] };
          speciesData[name].biomes.push(biomeData);
        }

        if (rarity) {
          biomeData.rarities.push({ rarity, time });
        }

        if (gym_leader) {
          if (!biomeData.gym_leaders.includes(gym_leader)) {
            biomeData.gym_leaders.push(gym_leader);
          }
        }
      });
    } else if (gym_leader && Array.isArray(team)) {
      team.forEach(name => {
        if (!speciesData[name]) {
          speciesData[name] = { species: name, biomes: [] };
        }

        let biomeData = speciesData[name].biomes.find(b => b.biome === biome);
        if (!biomeData) {
          biomeData = { biome, rarities: [], gym_leaders: [] };
          speciesData[name].biomes.push(biomeData);
        }

        if (!biomeData.gym_leaders.includes(gym_leader)) {
          biomeData.gym_leaders.push(gym_leader);
        }
      });
    }
  });
}

// Convert the species data object to an array and sort it by species name
speciesData = Object.values(speciesData).sort((a, b) => a.species.localeCompare(b.species));

// Write the final data to pokemon.json
await fs.promises.writeFile('./pokemon.json', JSON.stringify(speciesData, null, 2));