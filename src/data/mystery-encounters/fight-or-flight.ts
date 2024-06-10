import BattleScene from "../../battle-scene";
import {ModifierTier} from "#app/modifier/modifier-tier";
import {
  EnemyPartyConfig,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  setEncounterRewards,
  showEncounterText
} from "#app/utils/mystery-encounter-utils";
import MysteryEncounter, {MysteryEncounterBuilder} from "../mystery-encounter";
import * as Utils from "../../utils";
import {MysteryEncounterType} from "../enums/mystery-encounter-type";
import {WaveCountRequirement} from "../mystery-encounter-requirements";
import {MysteryEncounterOptionBuilder} from "../mystery-encounter-option";
import {
  getPartyLuckValue,
  getPlayerModifierTypeOptions,
  ModifierPoolType,
  ModifierTypeOption,
  modifierTypes,
  regenerateModifierPoolThresholds
} from "#app/modifier/modifier-type";

export const FightOrFlightEncounter: MysteryEncounter = new MysteryEncounterBuilder()
  .withEncounterType(MysteryEncounterType.FIGHT_OR_FLIGHT)
  .withIntroSpriteConfigs([]) // Set in onInit()
  .withRequirement(new WaveCountRequirement([2, 180])) // waves 2 to 180
  .withOnInit((scene: BattleScene) => {
    const instance = scene.currentBattle.mysteryEncounter;

    // Calculate boss mon
    const bossSpecies = scene.arena.randomSpecies(scene.currentBattle.waveIndex, scene.currentBattle.waveIndex, 0, getPartyLuckValue(scene.getParty()), true);
    const config: EnemyPartyConfig = {
      levelMultiplier: 1.5,
      pokemonBosses: [bossSpecies]
    };
    instance.enemyPartyConfigs = [config];

    // Calculate item
    // 1-60 ULTRA, 60-120 ROGUE, 120+ MASTER
    const tier = scene.currentBattle.waveIndex > 120 ? ModifierTier.MASTER : scene.currentBattle.waveIndex > 60 ? ModifierTier.ROGUE : ModifierTier.ULTRA;
    regenerateModifierPoolThresholds(scene.getParty(), ModifierPoolType.PLAYER, 0); // refresh player item pool
    const item = getPlayerModifierTypeOptions(1, scene.getParty(), [], { guaranteedModifierTiers: [tier]})[0];
    scene.currentBattle.mysteryEncounter.dialogueTokens.push([/@ec\{itemName\}/gi, item.type.name]);
    scene.currentBattle.mysteryEncounter.misc = item;

    instance.spriteConfigs = [
      {
        spriteKey: item.type.iconImage,
        fileRoot: "items",
        hasShadow: false,
        x: 30,
        y: -5,
        scale: 0.75,
        isItem: true
      },
      {
        spriteKey: bossSpecies.speciesId.toString(),
        fileRoot: "pokemon",
        hasShadow: true,
        tint: 0.25,
        repeat: true
      }
    ];

    return true;
  })
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
      // Pick battle
      const item = scene.currentBattle.mysteryEncounter.misc as ModifierTypeOption;
      setEncounterRewards(scene, null, [modifierTypes[item.type.id]]);
      await initBattleWithEnemyConfig(scene, scene.currentBattle.mysteryEncounter.enemyPartyConfigs[0]);
    })
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
      // Pick steal

      const roll = Utils.randSeedInt(16);
      if (roll > 4) {
        // Noticed and attacked by boss, item is knocked away (75%)
        await showEncounterText(scene, "mysteryEncounter:fight_or_flight_option_2_bad_result");
        await initBattleWithEnemyConfig(scene, scene.currentBattle.mysteryEncounter.enemyPartyConfigs[0]);
      } else {
        // Steal item (25%)
        const item = scene.currentBattle.mysteryEncounter.misc as ModifierTypeOption;
        setEncounterRewards(scene, null, [modifierTypes[item.type.id]]);
        // Display result message then proceed to rewards
        await showEncounterText(scene, "mysteryEncounter:fight_or_flight_option_2_good_result")
          .then(() => leaveEncounterWithoutBattle(scene));
      }
    })
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
      // Leave encounter with no rewards or exp
      leaveEncounterWithoutBattle(scene);
      return true;
    })
    .build())
  .build();
