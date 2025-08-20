import { globalScene } from "#app/global-scene";
import type { PlayerPokemon } from "#field/pokemon";
import type { StarterDataEntry } from "#system/game-data";
import type { DexEntry } from "#types/dex-data";

/**
 * Stores data associated with a specific egg and the hatched pokemon
 * Allows hatch info to be stored at hatch then retrieved for display during egg summary
 */
export class EggHatchData {
  /** the pokemon that hatched from the file (including shiny, IVs, ability) */
  public pokemon: PlayerPokemon;
  /** index of the egg move from the hatched pokemon (not stored in PlayerPokemon) */
  public eggMoveIndex: number;
  /** boolean indicating if the egg move for the hatch is new */
  public eggMoveUnlocked: boolean;
  /** stored copy of the hatched pokemon's dex entry before it was updated due to hatch */
  public dexEntryBeforeUpdate: DexEntry;
  /** stored copy of the hatched pokemon's starter entry before it was updated due to hatch */
  public starterDataEntryBeforeUpdate: StarterDataEntry;

  constructor(pokemon: PlayerPokemon, eggMoveIndex: number) {
    this.pokemon = pokemon;
    this.eggMoveIndex = eggMoveIndex;
  }

  /**
   * Sets the boolean for if the egg move for the hatch is a new unlock
   * @param unlocked True if the EM is new
   */
  setEggMoveUnlocked(unlocked: boolean) {
    this.eggMoveUnlocked = unlocked;
  }

  /**
   * Stores a copy of the current DexEntry of the pokemon and StarterDataEntry of its starter
   * Used before updating the dex, so comparing the pokemon to these entries will show the new attributes
   */
  setDex() {
    const currDexEntry = globalScene.gameData.dexData[this.pokemon.species.speciesId];
    const currStarterDataEntry = globalScene.gameData.starterData[this.pokemon.species.getRootSpeciesId()];
    this.dexEntryBeforeUpdate = {
      seenAttr: currDexEntry.seenAttr,
      caughtAttr: currDexEntry.caughtAttr,
      natureAttr: currDexEntry.natureAttr,
      seenCount: currDexEntry.seenCount,
      caughtCount: currDexEntry.caughtCount,
      hatchedCount: currDexEntry.hatchedCount,
      ivs: [...currDexEntry.ivs],
      ribbons: currDexEntry.ribbons,
    };
    this.starterDataEntryBeforeUpdate = {
      moveset: currStarterDataEntry.moveset,
      eggMoves: currStarterDataEntry.eggMoves,
      candyCount: currStarterDataEntry.candyCount,
      friendship: currStarterDataEntry.friendship,
      abilityAttr: currStarterDataEntry.abilityAttr,
      passiveAttr: currStarterDataEntry.passiveAttr,
      valueReduction: currStarterDataEntry.valueReduction,
      classicWinCount: currStarterDataEntry.classicWinCount,
    };
  }

  /**
   * Gets the dex entry before update
   * @returns Dex Entry corresponding to this pokemon before the pokemon was added / updated to dex
   */
  getDex(): DexEntry {
    return this.dexEntryBeforeUpdate;
  }

  /**
   * Gets the starter dex entry before update
   * @returns Starter Dex Entry corresponding to this pokemon before the pokemon was added / updated to dex
   */
  getStarterEntry(): StarterDataEntry {
    return this.starterDataEntryBeforeUpdate;
  }

  /**
   * Update the pokedex data corresponding with the new hatch's pokemon data
   * Also sets whether the egg move is a new unlock or not
   * @param showMessage boolean to show messages for the new catches and egg moves (false by default)
   * @returns
   */
  updatePokemon(showMessage = false) {
    return new Promise<void>(resolve => {
      globalScene.gameData.setPokemonCaught(this.pokemon, true, true, showMessage).then(() => {
        globalScene.gameData.updateSpeciesDexIvs(this.pokemon.species.speciesId, this.pokemon.ivs);
        globalScene.gameData.setEggMoveUnlocked(this.pokemon.species, this.eggMoveIndex, showMessage).then(value => {
          this.setEggMoveUnlocked(value);
          resolve();
        });
      });
    });
  }
}
