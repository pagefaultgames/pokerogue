import { PartyMemberStrength } from "#enums/party-member-strength";
import { Species } from "#enums/species";
import BattleScene from "../battle-scene";
import { PlayerPokemon } from "../field/pokemon";
import { Starter } from "../ui/starter-select-ui-handler";
import * as Utils from "../utils";
import PokemonSpecies, { PokemonSpeciesForm, getPokemonSpecies, getPokemonSpeciesForm, speciesStarters } from "./pokemon-species";

export interface DailyRunConfig {
  seed: integer;
  starters: Starter;
}

export function fetchDailyRunSeed(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    Utils.apiFetch("daily/seed").then(response => {
      if (!response.ok) {
        resolve(null);
        return;
      }
      return response.text();
    }).then(seed => resolve(seed))
      .catch(err => reject(err));
  });
}

export function getDailyRunStarters(scene: BattleScene, seed: string): Starter[] {
  const starters: Starter[] = [];

  scene.executeWithSeedOffset(() => {
    const startingLevel = scene.gameMode.getStartingLevel();

    if (/\d{18}$/.test(seed)) {
      for (let s = 0; s < 3; s++) {
        const offset = 6 + s * 6;
        const starterSpeciesForm = getPokemonSpeciesForm(parseInt(seed.slice(offset, offset + 4)) as Species, parseInt(seed.slice(offset + 4, offset + 6)));
        starters.push(getDailyRunStarter(scene, starterSpeciesForm, startingLevel));
      }
      return;
    }

    const starterCosts: integer[] = [];
    starterCosts.push(Math.round(3.5 + Math.abs(Utils.randSeedGauss(1))));
    starterCosts.push(Utils.randSeedInt(9 - starterCosts[0], 1));
    starterCosts.push(10 - (starterCosts[0] + starterCosts[1]));

    for (let c = 0; c < starterCosts.length; c++) {
      const cost = starterCosts[c];
      const costSpecies = Object.keys(speciesStarters)
        .map(s => parseInt(s) as Species)
        .filter(s => speciesStarters[s] === cost);
      const starterSpecies = getPokemonSpecies(getPokemonSpecies(Utils.randSeedItem(costSpecies)).getTrainerSpeciesForLevel(startingLevel, true, PartyMemberStrength.STRONGER));
      starters.push(getDailyRunStarter(scene, starterSpecies, startingLevel));
    }
  }, 0, seed);

  return starters;
}

function getDailyRunStarter(scene: BattleScene, starterSpeciesForm: PokemonSpeciesForm, startingLevel: integer): Starter {
  const starterSpecies = starterSpeciesForm instanceof PokemonSpecies ? starterSpeciesForm : getPokemonSpecies(starterSpeciesForm.speciesId);
  const formIndex = starterSpeciesForm instanceof PokemonSpecies ? undefined : starterSpeciesForm.formIndex;
  const pokemon = new PlayerPokemon(scene, starterSpecies, startingLevel, undefined, formIndex, undefined, undefined, undefined, undefined, undefined, undefined);
  const starter: Starter = {
    species: starterSpecies,
    dexAttr: pokemon.getDexAttr(),
    abilityIndex: pokemon.abilityIndex,
    passive: false,
    nature: pokemon.getNature(),
    pokerus: pokemon.pokerus
  };
  pokemon.destroy();
  return starter;
}
