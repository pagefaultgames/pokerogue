import { PartyMemberStrength } from "#enums/party-member-strength";
import type { Species } from "#enums/species";
import { globalScene } from "#app/global-scene";
import { PlayerPokemon } from "#app/field/pokemon";
import type { Starter } from "#app/ui/starter-select-ui-handler";
import * as Utils from "#app/utils";
import type { PokemonSpeciesForm } from "#app/data/pokemon-species";
import PokemonSpecies, { getPokemonSpecies, getPokemonSpeciesForm } from "#app/data/pokemon-species";
import { speciesStarterCosts } from "#app/data/balance/starters";
import { pokerogueApi } from "#app/plugins/api/pokerogue-api";

export interface DailyRunConfig {
  seed: integer;
  starters: Starter;
}

export function fetchDailyRunSeed(): Promise<string | null> {
  return new Promise<string | null>((resolve, reject) => {
    pokerogueApi.daily.getSeed().then(dailySeed => {
      resolve(dailySeed);
    });
  });
}

export function getDailyRunStarters(seed: string): Starter[] {
  const starters: Starter[] = [];

  globalScene.executeWithSeedOffset(() => {
    const startingLevel = globalScene.gameMode.getStartingLevel();

    if (/\d{18}$/.test(seed)) {
      for (let s = 0; s < 3; s++) {
        const offset = 6 + s * 6;
        const starterSpeciesForm = getPokemonSpeciesForm(parseInt(seed.slice(offset, offset + 4)) as Species, parseInt(seed.slice(offset + 4, offset + 6)));
        starters.push(getDailyRunStarter(starterSpeciesForm, startingLevel));
      }
      return;
    }

    const starterCosts: integer[] = [];
    starterCosts.push(Math.min(Math.round(3.5 + Math.abs(Utils.randSeedGauss(1))), 8));
    starterCosts.push(Utils.randSeedInt(9 - starterCosts[0], 1));
    starterCosts.push(10 - (starterCosts[0] + starterCosts[1]));

    for (let c = 0; c < starterCosts.length; c++) {
      const cost = starterCosts[c];
      const costSpecies = Object.keys(speciesStarterCosts)
        .map(s => parseInt(s) as Species)
        .filter(s => speciesStarterCosts[s] === cost);
      const randPkmSpecies = getPokemonSpecies(Utils.randSeedItem(costSpecies));
      const starterSpecies = getPokemonSpecies(randPkmSpecies.getTrainerSpeciesForLevel(startingLevel, true, PartyMemberStrength.STRONGER));
      starters.push(getDailyRunStarter(starterSpecies, startingLevel));
    }
  }, 0, seed);

  return starters;
}

function getDailyRunStarter(starterSpeciesForm: PokemonSpeciesForm, startingLevel: integer): Starter {
  const starterSpecies = starterSpeciesForm instanceof PokemonSpecies ? starterSpeciesForm : getPokemonSpecies(starterSpeciesForm.speciesId);
  const formIndex = starterSpeciesForm instanceof PokemonSpecies ? undefined : starterSpeciesForm.formIndex;
  const pokemon = new PlayerPokemon(starterSpecies, startingLevel, undefined, formIndex, undefined, undefined, undefined, undefined, undefined, undefined);
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
