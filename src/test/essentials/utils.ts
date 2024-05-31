// Function to convert Blob to string
import {getDailyRunStarters} from "#app/data/daily-run";
import {Gender} from "#app/data/gender";

export function blobToString(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("Error reading Blob as string"));
    };

    reader.readAsText(blob);
  });
}


export function holdOn(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateStarter(scene) {
  const seed = "test";
  const starters = getDailyRunStarters(scene, seed);
  const startingLevel = scene.gameMode.getStartingLevel();
  for (const starter of starters) {
    const starterProps = scene.gameData.getSpeciesDexAttrProps(starter.species, starter.dexAttr);
    const starterFormIndex = Math.min(starterProps.formIndex, Math.max(starter.species.forms.length - 1, 0));
    const starterGender = starter.species.malePercent !== null
      ? !starterProps.female ? Gender.MALE : Gender.FEMALE
      : Gender.GENDERLESS;
    const starterPokemon = scene.addPlayerPokemon(starter.species, startingLevel, starter.abilityIndex, starterFormIndex, starterGender, starterProps.shiny, starterProps.variant, undefined, starter.nature);
    starter.moveset = starterPokemon.moveset;
  }
  return starters;
}

export function waitUntil(truth) {
  return new Promise(resolve => {
    const interval = setInterval(() => {
      if (truth()) {
        clearInterval(interval);
        resolve(true);
      }
    }, 1000);
  });
}

export function setPositionRelative(guideObject: any, x: number, y: number) {
  if (guideObject && guideObject instanceof Phaser.GameObjects.GameObject) {
    const offsetX = guideObject.width * (-0.5 + (0.5 - guideObject.originX));
    const offsetY = guideObject.height * (-0.5 + (0.5 - guideObject.originY));
    this.setPosition(guideObject.x + offsetX + x, guideObject.y + offsetY + y);
    return;
  }

  this.setPosition(x, y);
}

export async function getMovePosition(scene, pokemonIndex, moveIndex): Promise<number> {
  return new Promise(async (resolve) => {
    const playerPokemon = scene.getPlayerField()[pokemonIndex];
    const moveSet = playerPokemon.getMoveset();
    const index = moveSet.findIndex((move) => move.moveId === moveIndex);
    return resolve(index);
  });
}
