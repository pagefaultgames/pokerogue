import BattleScene from "../../battle-scene";
import { ModifierTier } from "#app/modifier/modifier-tier";
import {modifierTypes} from "#app/modifier/modifier-type";
import { EnemyPartyConfig, initBattleWithEnemyConfig, setEncounterRewards } from "#app/utils/mystery-encounter-utils";
import { MysteryEncounterType } from "../enums/mystery-encounter-type";
import MysteryEncounter, { MysteryEncounterBuilder } from "../mystery-encounter";
import { MysteryEncounterOptionBuilder } from "../mystery-encounter-option";
import { WaveCountRequirement } from "../mystery-encounter-requirements";
import {PartyMemberStrength} from "#app/data/enums/party-member-strength";
import {
  trainerConfigs,
  TrainerPartyCompoundTemplate,
  TrainerPartyTemplate,
  trainerPartyTemplates
} from "#app/data/trainer-config";
import * as Utils from "../../utils";

export const MysteriousChallengersEncounter: MysteryEncounter = new MysteryEncounterBuilder()
  .withEncounterType(MysteryEncounterType.MYSTERIOUS_CHALLENGERS)
  .withIntroSpriteConfigs([]) // These are set in onInit()
  .withRequirement(new WaveCountRequirement([2, 180])) // waves 2 to 180
  .withOnInit((scene: BattleScene) => {
    const instance = scene.currentBattle.mysteryEncounter;
    // Calculates what trainers are available for battle in the encounter

    // Normal difficulty trainer is randomly pulled from biome
    const normalTrainerType = scene.arena.randomTrainerType(scene.currentBattle.waveIndex);
    const normalConfig = trainerConfigs[normalTrainerType].copy();
    const normalSpriteKey = normalConfig.getSpriteKey(normalConfig.hasGenders ? !!Utils.randSeedInt(2) : false, normalConfig.doubleOnly);
    instance.enemyPartyConfigs.push({
      trainerConfig: normalConfig
    });

    // Hard difficulty trainer is another random trainer, but with AVERAGE_BALANCED config
    // Number of mons is based off wave: 1-20 is 2, 20-40 is 3, etc. capping at 6 after wave 100
    const hardTrainerType = scene.arena.randomTrainerType(scene.currentBattle.waveIndex);
    const hardTemplate = new TrainerPartyCompoundTemplate(
      new TrainerPartyTemplate(1, PartyMemberStrength.STRONG, false, true),
      new TrainerPartyTemplate(Math.min(Math.ceil(scene.currentBattle.waveIndex / 20), 5), PartyMemberStrength.AVERAGE, false, true));
    const hardConfig = trainerConfigs[hardTrainerType].copy();
    hardConfig.setPartyTemplates(hardTemplate);
    const hardSpriteKey = hardConfig.getSpriteKey(normalConfig.hasGenders ? !!Utils.randSeedInt(2) : false, normalConfig.doubleOnly);
    instance.enemyPartyConfigs.push({
      trainerConfig: hardConfig
    });

    // Brutal trainer is pulled from pool of boss trainers (gym leaders) for the biome
    // They are given an E4 template team, so will be stronger than usual boss encounter and always have 6 mons
    const brutalTrainerType = scene.arena.randomTrainerType(scene.currentBattle.waveIndex, true);
    const e4Template = trainerPartyTemplates.ELITE_FOUR;
    const brutalConfig = trainerConfigs[brutalTrainerType].copy();
    brutalConfig.setPartyTemplates(e4Template);
    brutalConfig.partyTemplateFunc = null; // Overrides gym leader party template func
    const brutalSpriteKey = brutalConfig.getSpriteKey(normalConfig.hasGenders ? !!Utils.randSeedInt(2) : false, normalConfig.doubleOnly);
    instance.enemyPartyConfigs.push({
      levelMultiplier: 1.25,
      trainerConfig: brutalConfig
    });

    instance.spriteConfigs = [
      {
        spriteKey: normalSpriteKey,
        fileRoot: "trainer",
        hasShadow: true,
        tint: 1
      },
      {
        spriteKey: hardSpriteKey,
        fileRoot: "trainer",
        hasShadow: true,
        tint: 1
      },
      {
        spriteKey: brutalSpriteKey,
        fileRoot: "trainer",
        hasShadow: true,
        tint: 1
      }
    ];

    return true;
  })
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;

      // Spawn standard trainer battle with memory mushroom reward
      const config: EnemyPartyConfig = encounter.enemyPartyConfigs[0];

      setEncounterRewards(scene, { guaranteedModifiers: [modifierTypes.MEMORY_MUSHROOM, modifierTypes.MEMORY_MUSHROOM, modifierTypes.MEMORY_MUSHROOM, modifierTypes.MEMORY_MUSHROOM, modifierTypes.MEMORY_MUSHROOM], fillRemaining: true });

      return initBattleWithEnemyConfig(scene, config);
    })
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;
      // Spawn medium fight (standard strength) with ULTRA/GREAT reward (can improve with luck)
      const config: EnemyPartyConfig = encounter.enemyPartyConfigs[1];

      setEncounterRewards(scene, { guaranteedModifierTiers: [ModifierTier.ULTRA, ModifierTier.GREAT], fillRemaining: true });

      return initBattleWithEnemyConfig(scene, config);
    })
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;
      // Spawn hard fight (125% standard strength) with ROGUE/ULTRA/GREAT reward (can improve with luck)
      const config: EnemyPartyConfig = encounter.enemyPartyConfigs[2];

      setEncounterRewards(scene, { guaranteedModifierTiers: [ModifierTier.ROGUE, ModifierTier.ULTRA, ModifierTier.GREAT], fillRemaining: true });

      return initBattleWithEnemyConfig(scene, config);
    })
    .build())
  .build();
