import { STEALING_MOVES } from "#app/data/mystery-encounters/requirements/requirement-groups";
import { modifierTypes } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Species } from "#enums/species";
import BattleScene from "#app/battle-scene";
import { StatusEffect } from "#app/data/status-effect";
import IMysteryEncounter, { MysteryEncounterBuilder, MysteryEncounterTier, } from "../mystery-encounter";
import { EncounterOptionMode, MysteryEncounterOptionBuilder } from "../mystery-encounter-option";
import { MoveRequirement } from "../mystery-encounter-requirements";
import { EnemyPartyConfig, EnemyPokemonConfig, initBattleWithEnemyConfig, initCustomMovesForEncounter, leaveEncounterWithoutBattle, setEncounterExp, setEncounterRewards, } from "../utils/encounter-phase-utils";
import { queueEncounterMessage } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { Moves } from "#enums/moves";
import { BattlerIndex } from "#app/battle";
import { PokemonMove } from "#app/field/pokemon";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { PartyHealPhase } from "#app/phases";

/** i18n namespace for the encounter */
const namespace = "mysteryEncounter:sleeping_snorlax";

/**
 * Sleeping Snorlax encounter.
 * @see {@link https://github.com/AsdarDevelops/PokeRogue-Events/issues/103 | GitHub Issue #103}
 * @see For biome requirements check [mysteryEncountersByBiome](../mystery-encounters.ts)
 */
export const SleepingSnorlaxEncounter: IMysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(
    MysteryEncounterType.SLEEPING_SNORLAX
  )
    .withEncounterTier(MysteryEncounterTier.GREAT)
    .withSceneWaveRangeRequirement(10, 180) // waves 10 to 180
    .withCatchAllowed(true)
    .withHideWildIntroMessage(true)
    .withIntroSpriteConfigs([
      {
        spriteKey: Species.SNORLAX.toString(),
        fileRoot: "pokemon",
        hasShadow: true,
        tint: 0.25,
        scale: 1.5,
        repeat: true,
        y: 5,
      },
    ])
    .withIntroDialogue([
      {
        text: `${namespace}_intro_message`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;
      console.log(encounter);

      // Calculate boss mon
      const bossSpecies = getPokemonSpecies(Species.SNORLAX);
      const pokemonConfig: EnemyPokemonConfig = {
        species: bossSpecies,
        isBoss: true,
        status: [StatusEffect.SLEEP, 5], // Extra turns on timer for Snorlax's start of fight moves
        moveSet: [Moves.REST, Moves.SLEEP_TALK, Moves.CRUNCH, Moves.GIGA_IMPACT]
      };
      const config: EnemyPartyConfig = {
        levelAdditiveMultiplier: 0.5,
        pokemonConfigs: [pokemonConfig],
      };
      encounter.enemyPartyConfigs = [config];

      // Load animations/sfx for Snorlax fight start moves
      initCustomMovesForEncounter(scene, [Moves.SNORE]);

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
        const encounter = scene.currentBattle.mysteryEncounter;
        setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.LEFTOVERS], fillRemaining: true});
        encounter.startOfBattleEffects.push(
          {
            sourceBattlerIndex: BattlerIndex.ENEMY,
            targets: [BattlerIndex.PLAYER],
            move: new PokemonMove(Moves.SNORE),
            ignorePp: true
          },
          {
            sourceBattlerIndex: BattlerIndex.ENEMY,
            targets: [BattlerIndex.PLAYER],
            move: new PokemonMove(Moves.SNORE),
            ignorePp: true
          });
        await initBattleWithEnemyConfig(scene, encounter.enemyPartyConfigs[0]);
      }
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}_option_2_label`,
        buttonTooltip: `${namespace}_option_2_tooltip`,
        selected: [
          {
            text: `${namespace}_option_2_selected_message`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Fall asleep waiting for Snorlax
        // Full heal party
        scene.unshiftPhase(new PartyHealPhase(scene, true));
        queueEncounterMessage(scene, `${namespace}_option_2_good_result`);
        leaveEncounterWithoutBattle(scene);
      }
    )
    .withOption(
      new MysteryEncounterOptionBuilder()
        .withOptionMode(EncounterOptionMode.DISABLED_OR_SPECIAL)
        .withPrimaryPokemonRequirement(new MoveRequirement(STEALING_MOVES))
        .withDialogue({
          buttonLabel: `${namespace}_option_3_label`,
          buttonTooltip: `${namespace}_option_3_tooltip`,
          disabledButtonTooltip: `${namespace}_option_3_disabled_tooltip`,
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Steal the Snorlax's Leftovers
          const instance = scene.currentBattle.mysteryEncounter;
          setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.LEFTOVERS], fillRemaining: false });
          queueEncounterMessage(scene, `${namespace}_option_3_good_result`);
          // Snorlax exp to Pokemon that did the stealing
          setEncounterExp(scene, instance.primaryPokemon.id, getPokemonSpecies(Species.SNORLAX).baseExp);
          leaveEncounterWithoutBattle(scene);
        })
        .build()
    )
    .build();
