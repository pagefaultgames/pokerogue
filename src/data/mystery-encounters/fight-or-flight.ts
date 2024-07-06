import BattleScene from "../../battle-scene";
import {ModifierTier} from "#app/modifier/modifier-tier";
import {
  EnemyPartyConfig,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle, queueEncounterMessage,
  setCustomEncounterRewards,
  showEncounterText
} from "#app/data/mystery-encounters/mystery-encounter-utils";
import MysteryEncounter, {MysteryEncounterBuilder, MysteryEncounterTier} from "../mystery-encounter";
import {MysteryEncounterType} from "#enums/mystery-encounter-type";
import {WaveCountRequirement} from "../mystery-encounter-requirements";
import {MysteryEncounterOptionBuilder} from "../mystery-encounter-option";
import {
  getPartyLuckValue,
  getPlayerModifierTypeOptions,
  ModifierPoolType,
  ModifierTypeOption,
  regenerateModifierPoolThresholds
} from "#app/modifier/modifier-type";
import {BattlerTagType} from "#enums/battler-tag-type";
import {StatChangePhase} from "#app/phases";
import {BattleStat} from "#app/data/battle-stat";
import Pokemon from "#app/field/pokemon";
import {randSeedInt} from "#app/utils";

export const FightOrFlightEncounter: MysteryEncounter = new MysteryEncounterBuilder()
  .withEncounterType(MysteryEncounterType.FIGHT_OR_FLIGHT)
  .withEncounterTier(MysteryEncounterTier.COMMON)
  .withIntroSpriteConfigs([]) // Set in onInit()
  .withSceneRequirement(new WaveCountRequirement([10, 180])) // waves 10 to 180
  .withCatchAllowed(true)
  .withHideWildIntroMessage(true)
  .withOnInit((scene: BattleScene) => {
    const encounter = scene.currentBattle.mysteryEncounter;

    // Calculate boss mon
    const bossSpecies = scene.arena.randomSpecies(scene.currentBattle.waveIndex, scene.currentBattle.waveIndex, 0, getPartyLuckValue(scene.getParty()), true);
    const config: EnemyPartyConfig = {
      levelAdditiveMultiplier: 1,
      pokemonConfigs: [{species: bossSpecies, isBoss: true}]
    };
    encounter.enemyPartyConfigs = [config];

    // Calculate item
    // 10-60 GREAT, 60-110 ULTRA, 110-160 ROGUE, 160-180 MASTER
    const tier = scene.currentBattle.waveIndex > 160 ? ModifierTier.MASTER : scene.currentBattle.waveIndex > 110 ? ModifierTier.ROGUE : scene.currentBattle.waveIndex > 60 ? ModifierTier.ULTRA : ModifierTier.GREAT;
    regenerateModifierPoolThresholds(scene.getParty(), ModifierPoolType.PLAYER, 0); // refresh player item pool
    const item = getPlayerModifierTypeOptions(1, scene.getParty(), [], { guaranteedModifierTiers: [tier]})[0];
    encounter.setDialogueToken("itemName", item.type.name);
    encounter.misc = item;

    encounter.spriteConfigs = [
      {
        spriteKey: item.type.iconImage,
        fileRoot: "items",
        hasShadow: false,
        x: 35,
        y: -5,
        scale: 0.75,
        isItem: true
      },
      {
        spriteKey: bossSpecies.speciesId.toString(),
        fileRoot: "pokemon",
        hasShadow: true,
        tint: 0.25,
        x: -5,
        repeat: true
      }
    ];

    return true;
  })
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
      // Pick battle
      const item = scene.currentBattle.mysteryEncounter.misc as ModifierTypeOption;
      setCustomEncounterRewards(scene, { guaranteedModifierTypeOptions: [item], fillRemaining: false});
      await initBattleWithEnemyConfig(scene, scene.currentBattle.mysteryEncounter.enemyPartyConfigs[0]);
    })
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
      // Pick steal
      const item = scene.currentBattle.mysteryEncounter.misc as ModifierTypeOption;
      setCustomEncounterRewards(scene, { guaranteedModifierTypeOptions: [item], fillRemaining: false});

      const roll = randSeedInt(16);
      if (roll > 6) {
        // Noticed and attacked by boss, gets +1 to all stats at start of fight (62.5%)
        const config = scene.currentBattle.mysteryEncounter.enemyPartyConfigs[0];
        config.pokemonConfigs[0].tags = [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON];
        config.pokemonConfigs[0].mysteryEncounterBattleEffects = (pokemon: Pokemon) => {
          pokemon.scene.currentBattle.mysteryEncounter.setDialogueToken("enemyPokemon", pokemon.name);
          queueEncounterMessage(pokemon.scene, "mysteryEncounter:fight_or_flight_boss_enraged");
          pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD], 1));
        };
        await showEncounterText(scene, "mysteryEncounter:fight_or_flight_option_2_bad_result");
        await initBattleWithEnemyConfig(scene, config);
      } else {
        // Steal item (37.5%)
        // Display result message then proceed to rewards
        await showEncounterText(scene, "mysteryEncounter:fight_or_flight_option_2_good_result")
          .then(() => leaveEncounterWithoutBattle(scene));
      }
    })
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withOptionPhase(async (scene: BattleScene) => {
      // Leave encounter with no rewards or exp
      leaveEncounterWithoutBattle(scene, true);
      return true;
    })
    .build())
  .build();
