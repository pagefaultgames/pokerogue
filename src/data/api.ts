import { MainClient, NamedAPIResource } from "pokenode-ts";
import { MoveTarget, allMoves } from "./move";
import * as Utils from "../utils";
import fs from "vite-plugin-fs/browser";
import PokemonSpecies, { PokemonForm, SpeciesFormKey, allSpecies } from "./pokemon-species";
import { GrowthRate } from "./exp";
import { Type } from "./type";
import { allAbilities } from "./ability";
import { pokemonFormLevelMoves } from "./pokemon-level-moves";
import { tmSpecies } from "./tms";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";

const targetMap = {
  "specific-move": MoveTarget.ATTACKER,
  "selected-pokemon-me-first": MoveTarget.NEAR_ENEMY,
  "ally": MoveTarget.NEAR_ALLY,
  "users-field": MoveTarget.USER_SIDE,
  "user-or-ally": MoveTarget.USER_OR_NEAR_ALLY,
  "opponents-field": MoveTarget.ENEMY_SIDE,
  "user": MoveTarget.USER,
  "random-opponent": MoveTarget.RANDOM_NEAR_ENEMY,
  "all-other-pokemon": MoveTarget.ALL_NEAR_OTHERS,
  "selected-pokemon": MoveTarget.NEAR_OTHER,
  "all-opponents": MoveTarget.ALL_NEAR_ENEMIES,
  "entire-field": MoveTarget.BOTH_SIDES,
  "user-and-allies": MoveTarget.USER_AND_ALLIES,
  "all-pokemon": MoveTarget.ALL,
  "all-allies": MoveTarget.NEAR_ALLY,
  "fainting-pokemon": MoveTarget.NEAR_OTHER
};

const generationMap = {
  "generation-i": 1,
  "generation-ii": 2,
  "generation-iii": 3,
  "generation-iv": 4,
  "generation-v": 5,
  "generation-vi": 6,
  "generation-vii": 7,
  "generation-viii": 8,
  "generation-ix": 9
};

const growthRateMap = {
  "slow-then-very-fast": GrowthRate.ERRATIC,
  "fast": GrowthRate.FAST,
  "medium": GrowthRate.MEDIUM_FAST,
  "medium-slow": GrowthRate.MEDIUM_SLOW,
  "slow": GrowthRate.SLOW,
  "fast-then-very-slow": GrowthRate.FLUCTUATING
};

const regionalForms = [ "alola", "galar", "hisui", "paldea" ];

const ignoredForms = [ "gmax", "totem", "cap", "starter" ];

const generationDexNumbers = {
  1: 151,
  2: 251,
  3: 386,
  4: 494,
  5: 649,
  6: 721,
  7: 809,
  8: 905,
  9: 1010
};

const versions = [ "scarlet-violet", "sword-shield", "sun-moon" ];

type LevelMove = [level: integer, moveId: integer];

interface SpeciesLevelMoves {
  [key: string]: LevelMove[]
}

interface FormLevelMoves {
  [key: integer]: LevelMove[]
}

interface SpeciesFormLevelMoves {
  [key: string]: FormLevelMoves
}

interface TmSpecies {
  [key: string]: Array<string | string[]>
}

export async function printPokemon() {
  const api = new MainClient();

  const useExistingTmList = true;

  let enumStr = "export enum Species {\n";
  let pokemonSpeciesStr = "\tallSpecies.push(\n";
  const speciesLevelMoves: SpeciesLevelMoves = {};
  const speciesFormLevelMoves: SpeciesFormLevelMoves = {};
  const moveTmSpecies: TmSpecies = {};

  let pokemonArr: NamedAPIResource[] = [];

  const offset = 0;
  const pokemonResponse = await api.pokemon.listPokemons(offset, 2000);

  pokemonArr = pokemonResponse.results;

  const types = Utils.getEnumKeys(Type).map(t => t.toLowerCase());
  const abilities = Utils.getEnumKeys(Abilities).map(a => a.toLowerCase().replace(/\_/g, "-"));

  const pokemonSpeciesList: PokemonSpecies[] = [];

  for (const p of pokemonArr) {
    const pokemon = await api.pokemon.getPokemonByName(p.name);

    let region: string = "";

    if (pokemon.id > 10000) {
      const dexIdMatch = /\/(\d+)\//.exec(pokemon.species.url);
      if (!dexIdMatch) {
        continue;
      }

      const matchingSpecies = pokemonSpeciesList[parseInt(dexIdMatch[1]) - 1];

      if (!matchingSpecies) {
        continue;
      }

      const speciesKey = (matchingSpecies as any).key as string;

      const formName = pokemon.name.slice(speciesKey.length + 1);

      if (ignoredForms.filter(f => formName.indexOf(f) > -1).length) {
        continue;
      }

      const shortFormName = formName.indexOf("-") > -1
        ? formName.slice(0, formName.indexOf("-"))
        : formName;

      if (regionalForms.indexOf(shortFormName) > -1) {
        region = shortFormName.toUpperCase();
      } else {
        const formBaseStats: integer[] = [];
        let formBaseTotal = 0;
        // Assume correct stat order in API result
        for (const stat of pokemon.stats) {
          formBaseStats.push(stat.base_stat);
          formBaseTotal += stat.base_stat;
        }

        const [ formType1, formType2 ] = [ types.indexOf(pokemon.types.find(t => t.slot === 1).type.name), types.indexOf(pokemon.types.find(t => t.slot === 2)?.type.name) ];
        const [ formAbility1, formAbility2, formAbilityHidden ] = [
          Math.max(abilities.indexOf(pokemon.abilities.find(a => a.slot === 1)?.ability.name), 0),
          Math.max(abilities.indexOf(pokemon.abilities.find(a => a.slot === 2)?.ability.name), 0),
          Math.max(abilities.indexOf(pokemon.abilities.find(a => a.slot === 3)?.ability.name), 0)
        ];

        const pokemonForm = new PokemonForm(formName, formName, formType1 as Type, formType2 > -1 ? formType2 as Type : null, pokemon.height / 10, pokemon.weight / 10,
          formAbility1 as Abilities, formAbility2 as Abilities, formAbilityHidden as Abilities, formBaseTotal, formBaseStats[0], formBaseStats[1], formBaseStats[2], formBaseStats[3], formBaseStats[4], formBaseStats[5],
          matchingSpecies.catchRate, matchingSpecies.baseFriendship, matchingSpecies.baseExp, matchingSpecies.genderDiffs);
        pokemonForm.speciesId = matchingSpecies.speciesId;
        pokemonForm.formIndex = matchingSpecies.forms.length;
        pokemonForm.generation = matchingSpecies.generation;

        let moveVer: string;

        if (!speciesFormLevelMoves.hasOwnProperty(speciesKey)) {
          speciesFormLevelMoves[speciesKey] = [];
        }
        speciesFormLevelMoves[speciesKey][pokemonForm.formIndex] = [];

        for (const version of versions) {
          if (pokemon.moves.find(m => m.version_group_details.find(v => v.version_group.name === version && v.move_learn_method.name === "level-up"))) {
            moveVer = version;
            break;
          }
        }

        if (moveVer) {
          pokemon.moves.forEach(moveData => {
            moveData.version_group_details.filter(v => versions.indexOf(v.version_group.name) > -1).forEach(verData => {
              const isMoveVer = verData.version_group.name === moveVer;

              const moveName = moveData.move.name.toUpperCase().replace(/\_/g, "").replace(/\-/g, "_");
              const moveId = Math.max(Utils.getEnumKeys(Moves).indexOf(moveName), 0);

              const learnMethod = verData.move_learn_method.name;

              if (isMoveVer && learnMethod === "level-up") {
                speciesFormLevelMoves[speciesKey][pokemonForm.formIndex].push([ verData.level_learned_at, moveId ]);
              }

              if ([ "machine", "tutor" ].indexOf(learnMethod) > -1 || (useExistingTmList && tmSpecies.hasOwnProperty(moveId as Moves) && learnMethod === "level-up")) {
                if (!moveTmSpecies.hasOwnProperty(moveId)) {
                  moveTmSpecies[moveId] = [];
                }
                const speciesIndex = moveTmSpecies[moveId].findIndex(s => s[0] === speciesKey);
                if (speciesIndex === -1) {
                  moveTmSpecies[moveId].push([ speciesKey, formName ]);
                } else {
                  (moveTmSpecies[moveId][speciesIndex] as string[]).push(formName);
                }
              }
            });
          });

          if (JSON.stringify(speciesLevelMoves[speciesKey]) === JSON.stringify(speciesFormLevelMoves[speciesKey][pokemonForm.formIndex])) {
            delete speciesFormLevelMoves[speciesKey][pokemonForm.formIndex];
            if (!Object.keys(speciesFormLevelMoves[speciesKey]).length) {
              delete speciesFormLevelMoves[speciesKey];
            }
          }
        }

        matchingSpecies.forms.push(pokemonForm);
        continue;
      }
    }

    const species = await api.pokemon.getPokemonSpeciesByName(pokemon.species.name);

    let speciesKey = species.name.toUpperCase().replace(/\-/g, "_");

    const matchingExistingSpecies = allSpecies.find(s => Species[s.speciesId] === speciesKey);

    let dexId = species.id;

    if (region) {
      dexId += (regionalForms.indexOf(region.toLowerCase()) + 1) * 2000;
      speciesKey = `${region}_${speciesKey}`;
    }

    let generationIndex = 0;

    if (!region) {
      while (++generationIndex < 9 && dexId > generationDexNumbers[generationIndex]) {}
    } else {
      generationIndex = regionalForms.indexOf(region.toLowerCase()) + 6;
    }

    const baseStats: integer[] = [];
    let baseTotal = 0;
    // Assume correct stat order in API result
    for (const stat of pokemon.stats) {
      baseStats.push(stat.base_stat);
      baseTotal += stat.base_stat;
    }

    console.log(pokemon);

    const [ type1, type2 ] = [ types.indexOf(pokemon.types.find(t => t.slot === 1).type.name), types.indexOf(pokemon.types.find(t => t.slot === 2)?.type.name) ];
    const [ ability1, ability2, abilityHidden ] = [
      Math.max(abilities.indexOf(pokemon.abilities.find(a => a.slot === 1)?.ability.name), 0),
      Math.max(abilities.indexOf(pokemon.abilities.find(a => a.slot === 2)?.ability.name), 0),
      Math.max(abilities.indexOf(pokemon.abilities.find(a => a.slot === 3)?.ability.name), 0)
    ];

    const pokemonSpecies = new PokemonSpecies(dexId, generationIndex, species.is_legendary && baseTotal < 660, species.is_legendary && baseTotal >= 660, species.is_mythical,
      species.genera.find(g => g.language.name === "en")?.genus, type1 as Type, type2 > -1 ? type2 as Type : null, pokemon.height / 10, pokemon.weight / 10, ability1 as Abilities, ability2 as Abilities, abilityHidden as Abilities,
      baseTotal, baseStats[0], baseStats[1], baseStats[2], baseStats[3], baseStats[4], baseStats[5], species.capture_rate, species.base_happiness, pokemon.base_experience, growthRateMap[species.growth_rate.name],
      species.gender_rate < 9 ? 100 - (species.gender_rate * 12.5) : null, species.has_gender_differences, species.forms_switchable);

    (pokemonSpecies as any).key = speciesKey;

    pokemonSpeciesList.push(pokemonSpecies);

    let moveVer: string;

    speciesLevelMoves[speciesKey] = [];

    for (const version of versions) {
      if (pokemon.moves.find(m => m.version_group_details.find(v => v.version_group.name === version && v.move_learn_method.name === "level-up"))) {
        moveVer = version;
        break;
      }
    }

    const speciesTmMoves: integer[] = [];

    if (moveVer) {
      pokemon.moves.forEach(moveData => {
        const verData = moveData.version_group_details.find(v => v.version_group.name === moveVer);
        if (!verData) {
          return;
        }

        const moveName = moveData.move.name.toUpperCase().replace(/\_/g, "").replace(/\-/g, "_");
        const moveId = Math.max(Utils.getEnumKeys(Moves).indexOf(moveName), 0);

        switch (verData.move_learn_method.name) {
        case "level-up":
          speciesLevelMoves[speciesKey].push([ verData.level_learned_at, moveId ]);
          break;
        case "machine":
        case "tutor":
          if (moveId > 0) {
            if (!moveTmSpecies.hasOwnProperty(moveId)) {
              moveTmSpecies[moveId] = [];
            }
            if (moveTmSpecies[moveId].indexOf(speciesKey) === -1) {
              moveTmSpecies[moveId].push(speciesKey);
            }
            speciesTmMoves.push(moveId);
          }
          break;
        }
      });
    }

    for (const f of pokemon.forms) {
      const form = await api.pokemon.getPokemonFormByName(f.name);
      const formIndex = pokemonSpecies.forms.length;

      const matchingForm = matchingExistingSpecies && matchingExistingSpecies.forms.length > formIndex
        ? matchingExistingSpecies.forms.find(f2 => f2.formKey === form.form_name || f2.formName === form.form_name) || matchingExistingSpecies.forms[formIndex]
        : null;
      const formName = matchingForm
        ? matchingForm.formName
        : form.form_names.find(fn => fn.language.name === "en")?.name || form.form_name;
      const formKey = matchingForm
        ? matchingForm.formKey
        : form.form_name;

      const [ formType1, formType2 ] = [ types.indexOf(form.types.find(t => t.slot === 1).type.name), types.indexOf(form.types.find(t => t.slot === 2)?.type.name) ];
      const pokemonForm = new PokemonForm(formName, formKey, formType1 as Type, formType2 > -1 ? formType2 as Type : null,
        pokemonSpecies.height, pokemonSpecies.weight, pokemonSpecies.ability1, pokemonSpecies.ability2, pokemonSpecies.abilityHidden, baseTotal, baseStats[0], baseStats[1], baseStats[2], baseStats[3], baseStats[4], baseStats[5],
        pokemonSpecies.catchRate, pokemonSpecies.baseFriendship, pokemonSpecies.baseExp, pokemonSpecies.genderDiffs);
      pokemonForm.speciesId = pokemonSpecies.speciesId;
      pokemonForm.formIndex = formIndex;
      pokemonForm.generation = pokemonSpecies.generation;

      if (!pokemonForm.formIndex && speciesTmMoves.length) {
        for (const moveId of speciesTmMoves) {
          const speciesIndex = moveTmSpecies[moveId].findIndex(s => s === speciesKey);
          moveTmSpecies[moveId][speciesIndex] = [
            speciesKey,
            formKey
          ];
        }
      }

      pokemonSpecies.forms.push(pokemonForm);
    }

    console.log(pokemonSpecies.name, pokemonSpecies);
  }

  for (const pokemonSpecies of pokemonSpeciesList) {
    const speciesKey = (pokemonSpecies as any).key as string;

    enumStr += `  ${speciesKey}${pokemonSpecies.speciesId >= 2000 ? ` = ${pokemonSpecies.speciesId}` : ""},\n`;
    pokemonSpeciesStr += `    new PokemonSpecies(Species.${speciesKey}, "${pokemonSpecies.name}", ${pokemonSpecies.generation}, ${pokemonSpecies.subLegendary}, ${pokemonSpecies.legendary}, ${pokemonSpecies.mythical}, "${pokemonSpecies.species}", Type.${Type[pokemonSpecies.type1]}, ${pokemonSpecies.type2 ? `Type.${Type[pokemonSpecies.type2]}` : "null"}, ${pokemonSpecies.height}, ${pokemonSpecies.weight}, Abilities.${Abilities[pokemonSpecies.ability1]}, Abilities.${Abilities[pokemonSpecies.ability2]}, Abilities.${Abilities[pokemonSpecies.abilityHidden]}, ${pokemonSpecies.baseTotal}, ${pokemonSpecies.baseStats[0]}, ${pokemonSpecies.baseStats[1]}, ${pokemonSpecies.baseStats[2]}, ${pokemonSpecies.baseStats[3]}, ${pokemonSpecies.baseStats[4]}, ${pokemonSpecies.baseStats[5]}, ${pokemonSpecies.catchRate}, ${pokemonSpecies.baseFriendship}, ${pokemonSpecies.baseExp}, GrowthRate.${GrowthRate[pokemonSpecies.growthRate]}, ${pokemonSpecies.malePercent}, ${pokemonSpecies.genderDiffs}`;
    if (pokemonSpecies.forms.length > 1) {
      pokemonSpeciesStr += `, ${pokemonSpecies.canChangeForm},`;
      for (const form of pokemonSpecies.forms) {
        pokemonSpeciesStr += `\n      new PokemonForm("${form.formName}", "${form.formName}", Type.${Type[form.type1]}, ${form.type2 ? `Type.${Type[form.type2]}` : "null"}, ${form.height}, ${form.weight}, Abilities.${Abilities[form.ability1]}, Abilities.${Abilities[form.ability2]}, Abilities.${Abilities[form.abilityHidden]}, ${form.baseTotal}, ${form.baseStats[0]}, ${form.baseStats[1]}, ${form.baseStats[2]}, ${form.baseStats[3]}, ${form.baseStats[4]}, ${form.baseStats[5]}, ${form.catchRate}, ${form.baseFriendship}, ${form.baseExp}${form.genderDiffs ? ", true" : ""}),`;
      }
      pokemonSpeciesStr += "\n    ";
    }
    pokemonSpeciesStr += "),\n";
  }

  let speciesLevelMovesStr = "export const pokemonSpeciesLevelMoves: PokemonSpeciesLevelMoves = {\n";
  let speciesFormLevelMovesStr = "export const pokemonFormLevelMoves: PokemonSpeciesFormLevelMoves = {\n";
  let tmSpeciesStr = "export const tmSpecies: TmSpecies = {\n";

  for (const species of Object.keys(speciesLevelMoves)) {
    speciesLevelMovesStr += `  [Species.${species}]: [\n`;

    const orderedLevelMoves = speciesLevelMoves[species].sort((a: LevelMove, b: LevelMove) => {
      if (a[0] !== b[0]) {
        return a[0] < b[0] ? -1 : 1;
      }
      return a[1] < b[1] ? -1 : 1;
    });

    for (const lm of orderedLevelMoves) {
      speciesLevelMovesStr += `    [ ${lm[0]}, Moves.${Moves[lm[1]]} ],\n`;
    }

    speciesLevelMovesStr += "  ],\n";
  }

  for (const species of Object.keys(speciesFormLevelMoves)) {
    speciesFormLevelMovesStr += `  [Species.${species}]: {\n`;

    for (const f of Object.keys(speciesFormLevelMoves[species])) {
      speciesFormLevelMovesStr += `    ${f}: [\n`;

      const orderedLevelMoves = speciesFormLevelMoves[species][f].sort((a: LevelMove, b: LevelMove) => {
        if (a[0] !== b[0]) {
          return a[0] < b[0] ? -1 : 1;
        }
        return a[1] < b[1] ? -1 : 1;
      });

      for (const lm of orderedLevelMoves) {
        speciesFormLevelMovesStr += `      [ ${lm[0]}, Moves.${Moves[lm[1]]} ],\n`;
      }

      speciesFormLevelMovesStr += "    ],\n";
    }

    speciesFormLevelMovesStr += "  },\n";
  }

  for (const moveId of Object.keys(moveTmSpecies)) {
    tmSpeciesStr += `  [Moves.${Moves[parseInt(moveId)]}]: [\n`;
    for (const species of moveTmSpecies[moveId]) {
      if (typeof species === "string") {
        tmSpeciesStr += `    Species.${species},\n`;
      } else {
        const matchingExistingSpecies = allSpecies.find(s => Species[s.speciesId] === species[0]);
        const forms = (species as string[]).slice(1);
        if (matchingExistingSpecies && (!pokemonFormLevelMoves.hasOwnProperty(matchingExistingSpecies.speciesId) || matchingExistingSpecies.forms.length <= 1 || (matchingExistingSpecies.forms.length === 2 && matchingExistingSpecies.forms[1].formKey.indexOf(SpeciesFormKey.MEGA) > -1) || matchingExistingSpecies.forms.length === forms.length)) {
          tmSpeciesStr += `    Species.${species[0]},\n`;
        } else {
          tmSpeciesStr += `    [\n      Species.${species[0]},\n`;
          for (const form of forms) {
            tmSpeciesStr += `      '${form}',\n`;
          }
          tmSpeciesStr += "    ],\n";
        }
      }
    }
    tmSpeciesStr += "  ],\n";
  }

  enumStr += "\n};";
  pokemonSpeciesStr += "  );";
  speciesLevelMovesStr += "\n};";
  speciesFormLevelMovesStr += "\n};";
  tmSpeciesStr += "\n};";

  console.log(enumStr);
  console.log(pokemonSpeciesStr);
  console.log(speciesLevelMovesStr);
  console.log(speciesFormLevelMovesStr);
  console.log(tmSpeciesStr);

  console.log(moveTmSpecies);
}

export async function printAbilities() {
  const replaceText = true;

  let abilityContent: string = await fs.readFile("./src/data/ability.ts");

  const api = new MainClient();

  let enumStr = "export enum Abilities {\n  NONE,";
  let abilityStr = "  allAbilities.push(";

  abilityContent = abilityContent.slice(abilityContent.indexOf(abilityStr));

  let abilities: NamedAPIResource[] = [];
  const offset = 0;
  const abilitiesResponse = await api.pokemon.listAbilities(offset, 2000);
  abilities = abilitiesResponse.results;

  for (const a of abilities) {
    const ability = await api.pokemon.getAbilityByName(a.name);
    const abilityEnumName = ability.name.toUpperCase().replace(/\_/g, "").replace(/\-/g, "_");
    enumStr += `\n  ${abilityEnumName},`;
    console.log(ability.name, ability);

    const matchingLineIndex = abilityContent.search(new RegExp(`new Ability\\\(Abilities.${abilityEnumName},`));
    let matchingLine = matchingLineIndex > -1 ? abilityContent.slice(matchingLineIndex) : null;
    if (matchingLine) {
      matchingLine = matchingLine.slice(0, matchingLine.search(/,(?: \/\/.*?)?(?:\r)?\n[ \t]+(?:new|\);)/));
    }

    let abilityName = ability.names.find(ln => ln.language.name === "en").name;
    [ "N", "P" ].every(s => {
      if (!matchingLine || matchingLine.indexOf(` (${s})`) > -1) {
        abilityName += ` (${s})`;
        return false;
      }
      return true;
    });

    let flavorText: string;
    if (!matchingLine || replaceText) {
      for (const version of versions) {
        if ((flavorText = ability.flavor_text_entries.find(fte => fte.language.name === "en" && fte.version_group.name === version)?.flavor_text) || "") {
          if (flavorText.indexOf("forgotten") > -1) {
            continue;
          }
          break;
        }
      }
    } else if (matchingLine) {
      flavorText = allAbilities[ability.id].description;
    }
    abilityStr += `\n    new Ability(Abilities.${abilityEnumName}, "${abilityName}", "${flavorText?.replace(/\n/g, "\\n").replace(/  /g, " ").replace(/’/g, "'") || ""}", ${generationMap[ability.generation.name]})`;
    if (matchingLine && matchingLine.length > 1) {
      const newLineIndex = matchingLine.indexOf("\n");
      if (newLineIndex > -1) {
        abilityStr += matchingLine.slice(newLineIndex);
      }
    }
    abilityStr += ",";
  }

  enumStr += "\n};";
  abilityStr += "\n);";

  console.log(enumStr);
  console.log(abilityStr);
}

export async function printMoves() {
  const replaceText = true;

  let moveContent: string = await fs.readFile("./src/data/move.ts");

  const api = new MainClient();

  let enumStr = "export enum Moves {\n  NONE,";
  let moveStr = "  allMoves.push(";

  moveContent = moveContent.slice(moveContent.indexOf(moveStr));

  let moves: NamedAPIResource[] = [];
  const offset = 0;
  const movesResponse = await api.move.listMoves(offset, 2000);
  moves = movesResponse.results;

  console.log(moves);

  for (const m of moves) {
    const move = await api.move.getMoveByName(m.name);
    const moveEnumName = move.name.toUpperCase().replace(/\_/g, "").replace(/\-/g, "_");
    enumStr += `\n  ${moveEnumName},`;
    console.log(move.name, move);

    const matchingLineIndex = moveContent.search(new RegExp(`new (?:Attack|(?:Self)?Status)Move\\\(Moves.${Moves[move.id]},`));
    let matchingLine = matchingLineIndex > -1 ? moveContent.slice(matchingLineIndex) : null;
    if (matchingLine) {
      matchingLine = matchingLine.slice(0, matchingLine.search(/,(?: \/\/.*?)?(?:\r)?\n[ \t]+(?:new|\);)/));
    }

    let moveName = move.names.find(ln => ln.language.name === "en").name;
    [ "N", "P" ].every(s => {
      if (!matchingLine || matchingLine.indexOf(` (${s})`) > -1) {
        moveName += ` (${s})`;
        return false;
      }
      return true;
    });

    let flavorText: string;
    if (!matchingLine || replaceText) {
      for (const version of versions) {
        if ((flavorText = move.flavor_text_entries.find(fte => fte.language.name === "en" && fte.version_group.name === version)?.flavor_text) || "") {
          if (flavorText.indexOf("forgotten") > -1) {
            continue;
          }
          break;
        }
      }
    } else if (matchingLine) {
      flavorText = allMoves[move.id].effect;
    }
    const moveTarget = targetMap[move.target.name];
    moveStr += `\n    new ${move.damage_class.name !== "status" ? "Attack" : (moveTarget === MoveTarget.USER ? "Self" : "") + "Status"}Move(Moves.${moveEnumName}, "${moveName}", Type.${move.type.name.toUpperCase()}${move.damage_class.name !== "status" ? `, MoveCategory.${move.damage_class.name.toUpperCase()}` : ""}${move.damage_class.name !== "status" ? `, ${move.power || -1}` : ""}, ${move.accuracy || -1}, ${move.pp}, "${flavorText?.replace(/\n/g, "\\n").replace(/  /g, " ").replace(/’/g, "'") || ""}", ${move.effect_chance || -1}, ${move.priority}, ${generationMap[move.generation.name]})`;
    const expectedTarget = move.damage_class.name !== "status" || moveTarget !== MoveTarget.USER ? MoveTarget.NEAR_OTHER : MoveTarget.USER;
    if (matchingLine && matchingLine.length > 1) {
      const newLineIndex = matchingLine.indexOf("\n");
      if (newLineIndex > -1) {
        console.log(matchingLine.slice(newLineIndex).replace(/(?:\r)?\n[ \t]+.target\(.*?\)/g, ""), newLineIndex);
        moveStr += matchingLine.slice(newLineIndex).replace(/(?:\r)?\n[ \t]+.target\(.*?\)/g, "");
      }
    }
    if (moveTarget !== expectedTarget) {
      moveStr += `\n      .target(MoveTarget.${MoveTarget[moveTarget]})`;
    }
    moveStr += ",";
  }

  enumStr += "\n};";
  moveStr += "\n);";

  console.log(enumStr);
  console.log(moveStr);
}

export async function printTmSpecies() {
  const moveTmSpecies: TmSpecies = {};

  const api = new MainClient();

  const moveIds = Object.keys(tmSpecies).map(k => parseInt(k) as Moves);

  for (const moveId of moveIds) {
    const move = await api.move.getMoveById(moveId);

    moveTmSpecies[moveId] = [];

    for (const species of move.learned_by_pokemon) {
      const dexIdMatch = /\/(\d+)\//.exec(species.url);
      if (!dexIdMatch) {
        continue;
      }

      const dexId = parseInt(dexIdMatch[1]);

      let matchingSpecies: PokemonSpecies;
      let formKey = "";

      console.log(species.name);

      if (dexId < 10000) {
        matchingSpecies = allSpecies[dexId - 1];
      } else {
        const pokemon = await api.pokemon.getPokemonById(dexId);

        const speciesDexIdMatch = /\/(\d+)\//.exec(pokemon.species.url);
        if (!speciesDexIdMatch) {
          continue;
        }

        const speciesDexId = parseInt(speciesDexIdMatch[1]);

        const speciesKey = Species[allSpecies[speciesDexId - 1].speciesId];

        formKey = species.name.slice(speciesKey.length + 1);

        const regionKey = regionalForms.find(r => formKey.indexOf(r) > -1);

        if (regionKey) {
          formKey = formKey.slice(regionKey.length + 1);
          matchingSpecies = allSpecies.find(s => Species[s.speciesId] === `${regionKey.toUpperCase()}_${speciesKey}`);
        } else {
          matchingSpecies = allSpecies[speciesDexId - 1];
        }
      }

      if (!matchingSpecies) {
        console.log("NO MATCH", species.name);
        continue;
      }

      const speciesKey = Species[matchingSpecies.speciesId];

      const matchingIndex = moveTmSpecies[moveId].findIndex(s => Array.isArray(s) ? s[0] === speciesKey : s === speciesKey);

      if (matchingIndex === -1) {
        moveTmSpecies[moveId].push(!formKey ? speciesKey : [ speciesKey, formKey ]);
      } else {
        if (!Array.isArray(moveTmSpecies[moveId][matchingIndex])) {
          moveTmSpecies[moveId][matchingIndex] = [ moveTmSpecies[moveId][matchingIndex] as string, "" ];
        }
        (moveTmSpecies[moveId][matchingIndex] as string[]).push(formKey);
      }
    }
  }

  let tmSpeciesStr = "export const tmSpecies: TmSpecies = {\n";

  for (const moveId of Object.keys(moveTmSpecies)) {
    tmSpeciesStr += `  [Moves.${Moves[parseInt(moveId)]}]: [\n`;
    for (const species of moveTmSpecies[moveId]) {
      if (typeof species === "string") {
        tmSpeciesStr += `    Species.${species},\n`;
      } else {
        const matchingExistingSpecies = allSpecies.find(s => Species[s.speciesId] === species[0]);
        const forms = (species as string[]).slice(1);
        if (matchingExistingSpecies && (!pokemonFormLevelMoves.hasOwnProperty(matchingExistingSpecies.speciesId) || matchingExistingSpecies.forms.length <= 1 || (matchingExistingSpecies.forms.length === 2 && matchingExistingSpecies.forms[1].formKey.indexOf(SpeciesFormKey.MEGA) > -1) || matchingExistingSpecies.forms.length === forms.length)) {
          tmSpeciesStr += `    Species.${species[0]},\n`;
        } else {
          tmSpeciesStr += `    [\n      Species.${species[0]},\n`;
          for (const form of forms) {
            tmSpeciesStr += `      '${form}',\n`;
          }
          tmSpeciesStr += "    ],\n";
        }
      }
    }
    tmSpeciesStr += "  ],\n";
  }

  tmSpeciesStr += "\n};";

  console.log(tmSpeciesStr);
}
