import { BattleStat } from "#app/data/battle-stat";
import { EncounterOptionMode, MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import {
  EnemyPartyConfig,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  setEncounterRewards
} from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { STEALING_MOVES } from "#app/data/mystery-encounters/requirements/requirement-groups";
import Pokemon from "#app/field/pokemon";
import { ModifierTier } from "#app/modifier/modifier-tier";
import {
  getPartyLuckValue,
  getPlayerModifierTypeOptions,
  ModifierPoolType,
  ModifierTypeOption,
  regenerateModifierPoolThresholds,
} from "#app/modifier/modifier-type";
import { StatChangePhase } from "#app/phases";
import { randSeedInt } from "#app/utils";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "../../../battle-scene";
import IMysteryEncounter, {
  MysteryEncounterBuilder,
  MysteryEncounterTier,
} from "../mystery-encounter";
import { MoveRequirement } from "../mystery-encounter-requirements";
import { queueEncounterMessage, showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounter:fight_or_flight";

export const FightOrFlightEncounter: IMysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(
    MysteryEncounterType.FIGHT_OR_FLIGHT
  )
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withSceneWaveRangeRequirement(10, 180) // waves 10 to 180
    .withCatchAllowed(true)
    .withHideWildIntroMessage(true)
    .withIntroSpriteConfigs([]) // Set in onInit()
    .withIntroDialogue([
      {
        text: `${namespace}_intro_message`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;

      // Calculate boss mon
      const bossSpecies = scene.arena.randomSpecies(scene.currentBattle.waveIndex, scene.currentBattle.waveIndex, 0, getPartyLuckValue(scene.getParty()), true);
      const config: EnemyPartyConfig = {
        levelAdditiveMultiplier: 1,
        pokemonConfigs: [{ species: bossSpecies, isBoss: true }],
      };
      encounter.enemyPartyConfigs = [config];

      // Calculate item
      // 10-60 GREAT, 60-110 ULTRA, 110-160 ROGUE, 160-180 MASTER
      const tier =
        scene.currentBattle.waveIndex > 160
          ? ModifierTier.MASTER
          : scene.currentBattle.waveIndex > 110
            ? ModifierTier.ROGUE
            : scene.currentBattle.waveIndex > 60
              ? ModifierTier.ULTRA
              : ModifierTier.GREAT;
      regenerateModifierPoolThresholds(scene.getParty(), ModifierPoolType.PLAYER, 0);
      const item = getPlayerModifierTypeOptions(1, scene.getParty(), [], { guaranteedModifierTiers: [tier] })[0];
      encounter.setDialogueToken("itemName", item.type.name);
      encounter.misc = item;

      const bossSpriteKey = bossSpecies.getSpriteId(false, bossSpecies.forms ? 0 : null, false, bossSpecies.hasVariants() ? 0 : null);
      encounter.spriteConfigs = [
        {
          spriteKey: item.type.iconImage,
          fileRoot: "items",
          hasShadow: false,
          x: 35,
          y: -5,
          scale: 0.75,
          isItem: true,
        },
        {
          spriteKey: bossSpriteKey,
          fileRoot: "pokemon",
          hasShadow: true,
          tint: 0.25,
          x: -5,
          repeat: true,
        },
      ];

      // If player has a stealing move, they succeed automatically
      encounter.options[1].meetsRequirements(scene);
      const primaryPokemon = encounter.options[1].primaryPokemon;
      if (primaryPokemon) {
        // Use primaryPokemon to execute the thievery
        encounter.options[1].dialogue.buttonTooltip = `${namespace}_option_2_steal_tooltip`;
      } else {
        encounter.options[1].dialogue.buttonTooltip = `${namespace}_option_2_tooltip`;
      }

      return true;
    })
    .withTitle(`${namespace}_title`)
    .withDescription(`${namespace}_description`)
    .withQuery(`${namespace}_query`)
    .withSimpleOption(
      {
        buttonLabel: `${namespace}_option_1_label`,
        buttonTooltip: `${namespace}_option_1_tooltip`,
        selected: [
          {
            text: `${namespace}_option_1_selected_message`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Pick battle
        const item = scene.currentBattle.mysteryEncounter
          .misc as ModifierTypeOption;
        setEncounterRewards(scene, { guaranteedModifierTypeOptions: [item], fillRemaining: false });
        await initBattleWithEnemyConfig(scene, scene.currentBattle.mysteryEncounter.enemyPartyConfigs[0]);
      }
    )
    .withOption(
      new MysteryEncounterOptionBuilder()
        .withOptionMode(EncounterOptionMode.DEFAULT_OR_SPECIAL)
        .withPrimaryPokemonRequirement(new MoveRequirement(STEALING_MOVES)) // Will set option2PrimaryName and option2PrimaryMove dialogue tokens automatically
        .withDialogue({
          buttonLabel: `${namespace}_option_2_label`,
          buttonTooltip: `${namespace}_option_2_tooltip`,
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Pick steal
          const encounter = scene.currentBattle.mysteryEncounter;
          const item = scene.currentBattle.mysteryEncounter.misc as ModifierTypeOption;
          setEncounterRewards(scene, { guaranteedModifierTypeOptions: [item], fillRemaining: false });

          // If player has a stealing move, they succeed automatically
          const primaryPokemon = encounter.options[1].primaryPokemon;
          if (primaryPokemon) {
            // Use primaryPokemon to execute the thievery
            await showEncounterText(scene, `${namespace}_option_2_steal_result`);
            leaveEncounterWithoutBattle(scene);
            return;
          }

          const roll = randSeedInt(16);
          if (roll > 6) {
            // Noticed and attacked by boss, gets +1 to all stats at start of fight (62.5%)
            const config = scene.currentBattle.mysteryEncounter.enemyPartyConfigs[0];
            config.pokemonConfigs[0].tags = [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON];
            config.pokemonConfigs[0].mysteryEncounterBattleEffects = (pokemon: Pokemon) => {
              pokemon.scene.currentBattle.mysteryEncounter.setDialogueToken("enemyPokemon", pokemon.name);
              queueEncounterMessage(pokemon.scene, `${namespace}_boss_enraged`);
              pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD], 1));
            };
            await showEncounterText(scene, `${namespace}_option_2_bad_result`);
            await initBattleWithEnemyConfig(scene, config);
          } else {
            // Steal item (37.5%)
            // Display result message then proceed to rewards
            await showEncounterText(scene, `${namespace}_option_2_good_result`);
            leaveEncounterWithoutBattle(scene);
          }
        })
        .build()
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}_option_3_label`,
        buttonTooltip: `${namespace}_option_3_tooltip`,
        selected: [
          {
            text: `${namespace}_option_3_selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Leave encounter with no rewards or exp
        leaveEncounterWithoutBattle(scene, true);
        return true;
      }
    )
    .build();
