
const typeEffectiveness: { [key: string]: { [key: string]: number } } = {
  NORMAL: { ROCK: 0.5, GHOST: 0, STEEL: 0.5, STELLAR: 1 },
  FIRE: { FIRE: 0.5, WATER: 0.5, GRASS: 2, ICE: 2, BUG: 2, ROCK: 0.5, DRAGON: 0.5, STEEL: 2, STELLAR: 1 },
  WATER: { FIRE: 2, WATER: 0.5, GRASS: 0.5, GROUND: 2, ROCK: 2, DRAGON: 0.5, STELLAR: 1 },
  ELECTRIC: { WATER: 2, ELECTRIC: 0.5, GRASS: 0.5, GROUND: 0, FLYING: 2, DRAGON: 0.5, STELLAR: 1 },
  GRASS: { FIRE: 0.5, WATER: 2, GRASS: 0.5, POISON: 0.5, GROUND: 2, FLYING: 0.5, BUG: 0.5, ROCK: 2, DRAGON: 0.5, STEEL: 0.5, STELLAR: 1 },
  ICE: { FIRE: 0.5, WATER: 0.5, GRASS: 2, ICE: 0.5, GROUND: 2, FLYING: 2, DRAGON: 2, STEEL: 0.5, STELLAR: 1 },
  FIGHTING: { NORMAL: 2, ICE: 2, POISON: 0.5, FLYING: 0.5, PSYCHIC: 0.5, BUG: 0.5, ROCK: 2, GHOST: 0, DARK: 2, STEEL: 2, FAIRY: 0.5, STELLAR: 1 },
  POISON: { GRASS: 2, POISON: 0.5, GROUND: 0.5, ROCK: 0.5, GHOST: 0.5, STEEL: 0, FAIRY: 2, STELLAR: 1 },
  GROUND: { FIRE: 2, ELECTRIC: 2, GRASS: 0.5, POISON: 2, FLYING: 0, BUG: 0.5, ROCK: 2, STEEL: 2, STELLAR: 1 },
  FLYING: { ELECTRIC: 0.5, GRASS: 2, FIGHTING: 2, BUG: 2, ROCK: 0.5, STEEL: 0.5, STELLAR: 1 },
  PSYCHIC: { FIGHTING: 2, PSYCHIC: 0.5, DARK: 0, STEEL: 0.5, STELLAR: 1 },
  BUG: { FIRE: 0.5, GRASS: 2, FIGHTING: 0.5, POISON: 0.5, FLYING: 0.5, PSYCHIC: 2, GHOST: 0.5, DARK: 2, STEEL: 0.5, FAIRY: 0.5, STELLAR: 1 },
  ROCK: { FIRE: 2, ICE: 2, FIGHTING: 0.5, GROUND: 0.5, FLYING: 2, BUG: 2, STEEL: 0.5, STELLAR: 1 },
  GHOST: { NORMAL: 0, PSYCHIC: 2, GHOST: 2, DARK: 0.5, STELLAR: 1 },
  DRAGON: { DRAGON: 2, STEEL: 0.5, FAIRY: 0, STELLAR: 1 },
  DARK: { FIGHTING: 0.5, PSYCHIC: 2, GHOST: 2, DARK: 0.5, FAIRY: 0.5, STELLAR: 1 },
  STEEL: { FIRE: 0.5, WATER: 0.5, ELECTRIC: 0.5, ICE: 2, ROCK: 2, STEEL: 0.5, FAIRY: 2, STELLAR: 1 },
  FAIRY: { FIRE: 0.5, FIGHTING: 2, POISON: 0.5, DRAGON: 2, DARK: 2, STEEL: 0.5, STELLAR: 1 },
  STELLAR: { NORMAL: 1, FIRE: 1, WATER: 1, ELECTRIC: 1, GRASS: 1, ICE: 1, FIGHTING: 1, POISON: 1, GROUND: 1, FLYING: 1, PSYCHIC: 1, BUG: 1, ROCK: 1, GHOST: 1, DRAGON: 1, DARK: 1, STEEL: 1, FAIRY: 1 }  // Define interactions of Stellar type with other types
};


export function calculateAndSortDamageMultipliers(defenderTypes: string[], pokemonIndex: integer, pokemonName:string) {
  const result: { [key: string]: string[] } = {
    x4: [],
    x2: [],
    x1: [],
    x0_5: [],
    x0_25: [],
    x0: []
  };

  for (const moveType in typeEffectiveness) {
    let multiplier = 1;
    for (const defenderType of defenderTypes) {
      if (defenderType === undefined) {
        continue;
      }
      const upperCaseDefenderType = defenderType.toUpperCase();
      if (typeEffectiveness[moveType] && typeEffectiveness[moveType][upperCaseDefenderType] !== undefined) {
        multiplier *= typeEffectiveness[moveType][upperCaseDefenderType];
      } else {
        multiplier *= 1;  // Neutral effectiveness if no specific interaction is defined
      }
    }

    if (multiplier === 4) {
      result.x4.push(moveType);
    } else if (multiplier === 2) {
      result.x2.push(moveType);
    } else if (multiplier === 1) {
      result.x1.push(moveType);
    } else if (multiplier === 0.5) {
      result.x0_5.push(moveType);
    } else if (multiplier === 0.25) {
      result.x0_25.push(moveType);
    } else if (multiplier === 0) {
      result.x0.push(moveType);
    }
  }

  let name:HTMLElement;
  let eff4:HTMLElement;
  let eff2 :HTMLElement;
  let eff1 :HTMLElement;
  let eff05 :HTMLElement;
  let eff025:HTMLElement;
  let eff0 :HTMLElement;


  if (pokemonIndex === 1) {
    name = document.getElementById("pkm1name");
    eff4 = document.getElementById("pkm14x");
    eff2 = document.getElementById("pkm12x");
    eff1 = document.getElementById("pkm11x");
    eff05 = document.getElementById("pkm10.5x");
    eff025 = document.getElementById("pkm10.25x");
    eff0 = document.getElementById("pkm10x");
  } else {
    name = document.getElementById("pkm2name");
    eff4 = document.getElementById("pkm24x");
    eff2 = document.getElementById("pkm22x");
    eff1 = document.getElementById("pkm21x");
    eff05 = document.getElementById("pkm20.5x");
    eff025 = document.getElementById("pkm20.25x");
    eff0 = document.getElementById("pkm20x");
  }

  name.textContent = "Name: " + pokemonName;
  eff4.textContent = "4x: "+result.x4.toString();
  eff2.textContent = "2x: "+result.x2.toString();
  eff1.textContent = "1x: "+result.x1.toString();
  eff05.textContent = "0.5x: "+result.x0_5.toString();
  eff025.textContent = "0.25x: "+result.x0_25.toString();
  eff0.textContent = "0x: "+result.x0.toString();




}







