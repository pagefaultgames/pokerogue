import { Moves } from "./enums/moves";
import { Species } from "./enums/species";
import { allMoves } from "./move";
import * as Utils from "../utils";


export const speciesEggMoves = {
};

function parseEggMoves(content: string): void {
  let output = '';

  const speciesNames = Utils.getEnumKeys(Species);
  const speciesValues = Utils.getEnumValues(Species);
  const lines = content.split(/\n/g);
  
  lines.forEach((line, l) => {
    const cols = line.split(',').slice(0, 5);
    const moveNames = allMoves.map(m => m.name.replace(/ \([A-Z]\)$/, '').toLowerCase());
    const enumSpeciesName = cols[0].toUpperCase().replace(/[ -]/g, '_');
    const species = speciesValues[speciesNames.findIndex(s => s === enumSpeciesName)];

    let eggMoves: Moves[] = [];

    for (let m = 0; m < 4; m++) {
      const moveName = cols[m + 1].trim();
      const moveIndex = moveName !== 'N/A' ? moveNames.findIndex(mn => mn === moveName.toLowerCase()) : -1;
      eggMoves.push(moveIndex > -1 ? moveIndex as Moves : Moves.NONE);
    }

    if (eggMoves.find(m => m !== Moves.NONE))
      output += `[Species.${Species[species]}]: [ ${eggMoves.map(m => `Moves.${Moves[m]}`).join(', ')} ],\n`;
  });

  console.log(output);
}

const eggMovesStr = ``;
if (eggMovesStr) {
  setTimeout(() => {
    parseEggMoves(eggMovesStr);
  }, 1000);
}