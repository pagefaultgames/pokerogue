import BattleScene from "../../battle-scene";
import { ModifierTier } from "#app/modifier/modifier-tier";
import {modifierTypes} from "#app/modifier/modifier-type";
import { EnemyPartyConfig, initBattleWithEnemyConfig, setCustomEncounterRewards } from "#app/data/mystery-encounters/mystery-encounter-utils";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import MysteryEncounter, {MysteryEncounterBuilder, MysteryEncounterTier} from "../mystery-encounter";
import { MysteryEncounterOptionBuilder } from "../mystery-encounter-option";
import { WaveCountRequirement } from "../mystery-encounter-requirements";
import {
  trainerConfigs,
  TrainerPartyCompoundTemplate,
  TrainerPartyTemplate,
  trainerPartyTemplates
} from "#app/data/trainer-config";
import * as Utils from "../../utils";
import {PartyMemberStrength} from "#enums/party-member-strength";

export const MysteriousChallengersEncounter: MysteryEncounter = new MysteryEncounterBuilder()
  .withEncounterType(MysteryEncounterType.MYSTERIOUS_CHALLENGERS)
  .withEncounterTier(MysteryEncounterTier.UNCOMMON)
  .withIntroSpriteConfigs([]) // These are set in onInit()
  .withSceneRequirement(new WaveCountRequirement([10, 180])) // waves 10 to 180
  .withOnInit((scene: BattleScene) => {
    const instance = scene.currentBattle.mysteryEncounter;
    // Calculates what trainers are available for battle in the encounter

    // Normal difficulty trainer is randomly pulled from biome
    const normalTrainerType = scene.arena.randomTrainerType(scene.currentBattle.waveIndex);
    const normalConfig = trainerConfigs[normalTrainerType].copy();
    let female = false;
    if (normalConfig.hasGenders) {
      female = !!(Utils.randSeedInt(2));
    }
    const normalSpriteKey = normalConfig.getSpriteKey(female, normalConfig.doubleOnly);
    instance.enemyPartyConfigs.push({
      trainerConfig: normalConfig,
      female: female
    });

    // Hard difficulty trainer is another random trainer, but with AVERAGE_BALANCED config
    // Number of mons is based off wave: 1-20 is 2, 20-40 is 3, etc. capping at 6 after wave 100
    const hardTrainerType = scene.arena.randomTrainerType(scene.currentBattle.waveIndex);
    const hardTemplate = new TrainerPartyCompoundTemplate(
      new TrainerPartyTemplate(1, PartyMemberStrength.STRONGER, false, true),
      new TrainerPartyTemplate(Math.min(Math.ceil(scene.currentBattle.waveIndex / 20), 5), PartyMemberStrength.AVERAGE, false, true));
    const hardConfig = trainerConfigs[hardTrainerType].copy();
    hardConfig.setPartyTemplates(hardTemplate);
    female = false;
    if (hardConfig.hasGenders) {
      female = !!(Utils.randSeedInt(2));
    }
    const hardSpriteKey = hardConfig.getSpriteKey(female, hardConfig.doubleOnly);
    instance.enemyPartyConfigs.push({
      trainerConfig: hardConfig,
      levelAdditiveMultiplier: 0.5,
      female: female,
    });

    // Brutal trainer is pulled from pool of boss trainers (gym leaders) for the biome
    // They are given an E4 template team, so will be stronger than usual boss encounter and always have 6 mons
    const brutalTrainerType = scene.arena.randomTrainerType(scene.currentBattle.waveIndex, true);
    const e4Template = trainerPartyTemplates.ELITE_FOUR;
    const brutalConfig = trainerConfigs[brutalTrainerType].copy();
    brutalConfig.setPartyTemplates(e4Template);
    brutalConfig.partyTemplateFunc = null; // Overrides gym leader party template func
    female = false;
    if (brutalConfig.hasGenders) {
      female = !!(Utils.randSeedInt(2));
    }
    const brutalSpriteKey = brutalConfig.getSpriteKey(female, brutalConfig.doubleOnly);
    instance.enemyPartyConfigs.push({
      trainerConfig: brutalConfig,
      levelAdditiveMultiplier: 1.1,
      female: female
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

      setCustomEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.TM_COMMON, modifierTypes.TM_GREAT, modifierTypes.MEMORY_MUSHROOM], fillRemaining: true });

      // Seed offsets to remove possibility of different trainers having exact same teams
      let ret;
      scene.executeWithSeedOffset(() => {
        ret = initBattleWithEnemyConfig(scene, config);
      }, scene.currentBattle.waveIndex * 10);
      return ret;
    })
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;
      // Spawn hard fight with ULTRA/GREAT reward (can improve with luck)
      const config: EnemyPartyConfig = encounter.enemyPartyConfigs[1];

      setCustomEncounterRewards(scene, { guaranteedModifierTiers: [ModifierTier.ULTRA, ModifierTier.GREAT, ModifierTier.GREAT], fillRemaining: true });

      // Seed offsets to remove possibility of different trainers having exact same teams
      let ret;
      scene.executeWithSeedOffset(() => {
        ret = initBattleWithEnemyConfig(scene, config);
      }, scene.currentBattle.waveIndex * 100);
      return ret;
    })
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;
      // Spawn brutal fight with ROGUE/ULTRA/GREAT reward (can improve with luck)
      const config: EnemyPartyConfig = encounter.enemyPartyConfigs[2];

      // To avoid player level snowballing from picking this option
      encounter.expMultiplier = 0.9;

      setCustomEncounterRewards(scene, { guaranteedModifierTiers: [ModifierTier.ROGUE, ModifierTier.ULTRA, ModifierTier.GREAT], fillRemaining: true });

      // Seed offsets to remove possibility of different trainers having exact same teams
      let ret;
      scene.executeWithSeedOffset(() => {
        ret = initBattleWithEnemyConfig(scene, config);
      }, scene.currentBattle.waveIndex * 1000);
      return ret;
    })
    .build())
  .build();
