import BattleScene from "../../../battle-scene";
import {
  EnemyPartyConfig,
  EnemyPokemonConfig, generateModifierType,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle, queueEncounterMessage,
  setEncounterRewards
} from "../mystery-encounter-utils";
import MysteryEncounter, { MysteryEncounterBuilder, MysteryEncounterTier } from "../mystery-encounter";
import * as Utils from "../../../utils";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { MoveRequirement, WaveCountRequirement } from "../mystery-encounter-requirements";
import { MysteryEncounterOptionBuilder } from "../mystery-encounter-option";
import {
  ModifierTypeOption,
  modifierTypes
} from "#app/modifier/modifier-type";
import { getPokemonSpecies } from "../../pokemon-species";
import { Species } from "#enums/species";
import { Status, StatusEffect } from "../../status-effect";
import { Moves } from "#enums/moves";
import { BerryType } from "#enums/berry-type";

export const SleepingSnorlaxEncounter: MysteryEncounter = MysteryEncounterBuilder
  .withEncounterType(MysteryEncounterType.SLEEPING_SNORLAX)
  .withEncounterTier(MysteryEncounterTier.ULTRA)
  .withIntroSpriteConfigs([
    {
      spriteKey: Species.SNORLAX.toString(),
      fileRoot: "pokemon",
      hasShadow: true,
      tint: 0.25,
      repeat: true
    }
  ])
  .withSceneRequirement(new WaveCountRequirement([10, 180])) // waves 10 to 180
  .withCatchAllowed(true)
  .withHideWildIntroMessage(true)
  .withOnInit((scene: BattleScene) => {
    const encounter = scene.currentBattle.mysteryEncounter;
    console.log(encounter);

    // Calculate boss mon
    const bossSpecies = getPokemonSpecies(Species.SNORLAX);
    const pokemonConfig: EnemyPokemonConfig = {
      species: bossSpecies,
      isBoss: true,
      status: StatusEffect.SLEEP
    };
    const config: EnemyPartyConfig = {
      levelAdditiveMultiplier: 2,
      pokemonConfigs: [pokemonConfig]
    };
    encounter.enemyPartyConfigs = [config];
    return true;
  })
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
      // Pick battle
      // TODO: do we want special rewards for this?
      // setCustomEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.LEFTOVERS], fillRemaining: true});
      await initBattleWithEnemyConfig(scene, scene.currentBattle.mysteryEncounter.enemyPartyConfigs[0]);
    })
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
      const instance = scene.currentBattle.mysteryEncounter;
      let roll: integer;
      scene.executeWithSeedOffset(() => {
        roll = Utils.randSeedInt(16, 0);
      }, scene.currentBattle.waveIndex);
      console.log(roll);
      if (roll > 4) {
        // Fall asleep and get a sitrus berry (75%)
        const p = instance.primaryPokemon;
        p.status = new Status(StatusEffect.SLEEP, 0, 3);
        p.updateInfo(true);
        // const sitrus = (modifierTypes.BERRY?.() as ModifierTypeGenerator).generateType(scene.getParty(), [BerryType.SITRUS]);
        const sitrus = generateModifierType(scene, modifierTypes.BERRY, [BerryType.SITRUS]);

        setEncounterRewards(scene, { guaranteedModifierTypeOptions: [new ModifierTypeOption(sitrus, 0)], fillRemaining: false });
        queueEncounterMessage(scene, "mysteryEncounter:sleeping_snorlax_option_2_bad_result");
        leaveEncounterWithoutBattle(scene);
      } else {
        // Heal to full (25%)
        for (const pokemon of scene.getParty()) {
          pokemon.hp = pokemon.getMaxHp();
          pokemon.resetStatus();
          for (const move of pokemon.moveset) {
            move.ppUsed = 0;
          }
          pokemon.updateInfo(true);
        }

        queueEncounterMessage(scene, "mysteryEncounter:sleeping_snorlax_option_2_good_result");
        leaveEncounterWithoutBattle(scene);
      }
    })
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withPrimaryPokemonRequirement(new MoveRequirement([Moves.PLUCK, Moves.COVET, Moves.KNOCK_OFF, Moves.THIEF, Moves.TRICK, Moves.SWITCHEROO]))
    .withOptionPhase(async (scene: BattleScene) => {
      // Leave encounter with no rewards or exp
      setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.LEFTOVERS], fillRemaining: false });
      queueEncounterMessage(scene, "mysteryEncounter:sleeping_snorlax_option_3_good_result");
      leaveEncounterWithoutBattle(scene);
    })
    .build())
  .build();
