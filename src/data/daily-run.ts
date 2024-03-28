import BattleScene from "../battle-scene";
import { PlayerPokemon } from "../field/pokemon";
import { GameModes, gameModes } from "../game-mode";
import { Starter } from "../ui/starter-select-ui-handler";
import * as Utils from "../utils";
import { Species } from "./enums/species";
import { getPokemonSpecies, speciesStarters } from "./pokemon-species";
import { PartyMemberStrength } from "./enums/party-member-strength";

export interface DailyRunConfig {
  seed: integer;
  starters: Starter;
}

export function fetchDailyRunSeed(): Promise<string> {
  return new Promise<string>(resolve => {
    Utils.apiFetch('daily/seed').then(response => {
      if (!response.ok) {
        resolve(null);
        return;
      }
      return response.text();
    }).then(seed => resolve(seed));
  });
}

export function getDailyRunStarters(scene: BattleScene, seed: string): Starter[] {
  const starters: Starter[] = [];

  scene.executeWithSeedOffset(() => {
    const starterWeights = [];
    starterWeights.push(Math.round(3.5 + Math.abs(Utils.randSeedGauss(1))));
    starterWeights.push(Utils.randSeedInt(9 - starterWeights[0], 1));
    starterWeights.push(10 - (starterWeights[0] + starterWeights[1]));

    const startingLevel = gameModes[GameModes.DAILY].getStartingLevel();

    for (let s = 0; s < starterWeights.length; s++) {
      const weight = starterWeights[s];
      const weightSpecies = Object.keys(speciesStarters)
        .map(s => parseInt(s) as Species)
        .filter(s => speciesStarters[s] === weight);
      const starterSpecies = getPokemonSpecies(getPokemonSpecies(Utils.randSeedItem(weightSpecies)).getTrainerSpeciesForLevel(startingLevel, true, PartyMemberStrength.STRONGER));
      const pokemon = new PlayerPokemon(scene, starterSpecies, startingLevel, undefined, undefined, undefined, undefined, undefined, undefined, undefined);
      const starter: Starter = {
        species: starterSpecies,
        dexAttr: pokemon.getDexAttr(),
        nature: pokemon.nature,
        pokerus: pokemon.pokerus
      };
      starters.push(starter);
      pokemon.destroy();
    }
  }, 0, seed);
  return starters;
}