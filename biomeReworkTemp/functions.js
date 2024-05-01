import fs from 'fs';
import path from 'path';

async function countBiomes() {
  const filePath = path.join('.', 'pokemon.json');
  const data = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));

  const biomeCounts = data.reduce((counts, { species, biomes }) => {
    const count = biomes.length;
    counts[count] = (counts[count] || 0) + 1;
    return counts;
  }, {});

  const tableData = Object.entries(biomeCounts).map(([biomes, pokemon]) => [biomes, pokemon]);
  tableData.unshift(['No. of Biomes', 'No. of Pokemon']); // Add table headers
  console.log('Number of Pokemon that have a set amount of biomes they can appear in:');
  console.table(tableData);
}

async function displaySpeciesInMultipleBiomes() {
    const filePath = path.join('.', 'pokemon.json');
    const data = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
  
    const speciesInMultipleBiomes = data.filter(({ biomes }) => biomes.length >= 3);
  
    speciesInMultipleBiomes.sort((a, b) => {
      if (b.biomes.length !== a.biomes.length) {
        return b.biomes.length - a.biomes.length; // Sort by number of biomes in descending order
      }
      return a.species.localeCompare(b.species); // If number of biomes is the same, sort alphabetically
    });
  
    const tableData = speciesInMultipleBiomes.map(({ species, biomes }) => [biomes.length, species]);
    tableData.unshift(['No. of Biomes', 'Species']); // Add table headers
    console.log('Species that can appear in three or more biomes:');
    console.table(tableData);
}

async function displaySpeciesWithNoBiomes() {
    const filePath = path.join('.', 'pokemon.json');
    const data = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
  
    const speciesWithNoBiomes = data.filter(({ biomes }) => biomes.length === 0);
    if (speciesWithNoBiomes.length > 0) {
      console.log('Species with no biomes:');
      speciesWithNoBiomes.forEach(({ species }) => console.log(species));
    } else {
      console.log('All species have at least one biome.');
    }
}
  


countBiomes();
displaySpeciesInMultipleBiomes();
displaySpeciesWithNoBiomes();