import BattleScene from "../../battle-scene";
import { AddPokeballModifierType } from "../../modifier/modifier-type";
import { EnemyPartyConfig, generateEnemyPartyForBattle, getRandomSpeciesByEggTier, initBattleFromEncounter, leaveEncounterWithoutBattle, getRandomPlayerPokemon } from "../../utils/mystery-encounter-utils";
import MysteryEncounter, { MysteryEncounterFactory, OptionSelectMysteryEncounter } from "../mystery-encounter";
import { ModifierRewardPhase } from "../../phases";
import { getPokemonSpecies } from "../pokemon-species";
import { Species } from "../enums/species";
import { MysteryEncounterType } from "../enums/mystery-encounter-type";
import { PokeballType } from "../pokeball";
import { EggTier } from "../enums/egg-type";
import { MysteryEncounterRequirements } from "../mystery-encounter-requirements";

export class DarkDealEncounter implements MysteryEncounterFactory {
  getEncounter(): MysteryEncounter<OptionSelectMysteryEncounter> {
    return new OptionSelectMysteryEncounter(MysteryEncounterType.DARK_DEAL)
      .introVisualsConfig([
        {
          spriteKey: "mad_scientist_m",
          fileRoot: "mystery-encounters",
          hasShadow: true
        },
        {
          spriteKey: Species.PORYGON.toString(),
          fileRoot: "pokemon",
          hasShadow: true,
          repeat: true
        }
      ])
      .requirements(new MysteryEncounterRequirements(2, 180)) // waves 2 to 180
      .option(
        // onSelect
        async (scene: BattleScene) => {
          // Give the player 10 Rogue Balls
          scene.unshiftPhase(new ModifierRewardPhase(scene, () => new AddPokeballModifierType("rb", PokeballType.ROGUE_BALL, 10)));

          // Start encounter with random legendary (7-10 starter strength)
          const bossSpecies = getPokemonSpecies(getRandomSpeciesByEggTier(scene, [EggTier.ULTRA, EggTier.MASTER]));
          const config: EnemyPartyConfig = {
            pokemonBosses: [bossSpecies]
          };
          generateEnemyPartyForBattle(scene, config);
          initBattleFromEncounter(scene);
        },
        // onPreSelect
        (scene: BattleScene) => {
          // Removes random pokemon from party and adds name to data tokens
          const removedPokemon = getRandomPlayerPokemon(scene, true);
          scene.removePokemonFromPlayerParty(removedPokemon);
          scene.currentBattle.mysteryEncounter.dialogueTokens.push([/@ec\{pokeName\}/gi, removedPokemon.name]);
        }
      )
      .option(async (scene: BattleScene) => {
        // Leave encounter with no rewards or exp
        leaveEncounterWithoutBattle(scene);
        return true;
      });
  }
}
