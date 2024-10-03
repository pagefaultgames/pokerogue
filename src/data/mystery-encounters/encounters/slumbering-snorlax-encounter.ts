import { STEALING_MOVES } from "#app/data/mystery-encounters/requirements/requirement-groups";
import { modifierTypes, PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Species } from "#enums/species";
import BattleScene from "#app/battle-scene";
import { StatusEffect } from "#app/data/status-effect";
import MysteryEncounter, { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { MoveRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { EnemyPartyConfig, EnemyPokemonConfig, generateModifierType, initBattleWithEnemyConfig, leaveEncounterWithoutBattle, loadCustomMovesForEncounter, setEncounterExp, setEncounterRewards, } from "../utils/encounter-phase-utils";
import { queueEncounterMessage } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { Moves } from "#enums/moves";
import { BattlerIndex } from "#app/battle";
import { AiType, PokemonMove } from "#app/field/pokemon";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { PartyHealPhase } from "#app/phases/party-heal-phase";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";
import { BerryType } from "#enums/berry-type";
import { MysteryEncounterPokemonData } from "#app/data/mystery-encounters/mystery-encounter-pokemon-data";

/** i18n namespace for the encounter */
const namespace = "mysteryEncounters/slumberingSnorlax";

/**
 * Sleeping Snorlax encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3815 | GitHub Issue #3815}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const SlumberingSnorlaxEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.SLUMBERING_SNORLAX)
    .withEncounterTier(MysteryEncounterTier.GREAT)
    .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
    .withCatchAllowed(true)
    .withHideWildIntroMessage(true)
    .withFleeAllowed(false)
    .withIntroSpriteConfigs([
      {
        spriteKey: Species.SNORLAX.toString(),
        fileRoot: "pokemon",
        hasShadow: true,
        tint: 0.25,
        scale: 1.25,
        repeat: true,
        y: 5,
      },
    ])
    .withIntroDialogue([
      {
        text: `${namespace}:intro`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter!;
      console.log(encounter);

      // Calculate boss mon
      const bossSpecies = getPokemonSpecies(Species.SNORLAX);
      const pokemonConfig: EnemyPokemonConfig = {
        species: bossSpecies,
        isBoss: true,
        status: [StatusEffect.SLEEP, 5], // Extra turns on timer for Snorlax's start of fight moves
        moveSet: [Moves.REST, Moves.SLEEP_TALK, Moves.CRUNCH, Moves.GIGA_IMPACT],
        modifierConfigs: [
          {
            modifier: generateModifierType(scene, modifierTypes.BERRY, [BerryType.SITRUS]) as PokemonHeldItemModifierType,
            stackCount: 2
          },
          {
            modifier: generateModifierType(scene, modifierTypes.BERRY, [BerryType.ENIGMA]) as PokemonHeldItemModifierType,
            stackCount: 2
          },
        ],
        mysteryEncounterPokemonData: new MysteryEncounterPokemonData({ spriteScale: 1.25 }),
        aiType: AiType.SMART // Required to ensure Snorlax uses Sleep Talk while it is asleep
      };
      const config: EnemyPartyConfig = {
        levelAdditiveModifier: 0.5,
        pokemonConfigs: [pokemonConfig],
      };
      encounter.enemyPartyConfigs = [config];

      // Load animations/sfx for Snorlax fight start moves
      loadCustomMovesForEncounter(scene, [Moves.SNORE]);

      encounter.setDialogueToken("snorlaxName", getPokemonSpecies(Species.SNORLAX).getName());

      return true;
    })
    .setLocalizationKey(`${namespace}`)
    .withTitle(`${namespace}:title`)
    .withDescription(`${namespace}:description`)
    .withQuery(`${namespace}:query`)
    .withSimpleOption(
      {
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            text: `${namespace}:option.1.selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Pick battle
        const encounter = scene.currentBattle.mysteryEncounter!;
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
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        selected: [
          {
            text: `${namespace}:option.2.selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Fall asleep waiting for Snorlax
        // Full heal party
        scene.unshiftPhase(new PartyHealPhase(scene, true));
        queueEncounterMessage(scene, `${namespace}:option.2.rest_result`);
        leaveEncounterWithoutBattle(scene);
      }
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
        .withPrimaryPokemonRequirement(new MoveRequirement(STEALING_MOVES))
        .withDialogue({
          buttonLabel: `${namespace}:option.3.label`,
          buttonTooltip: `${namespace}:option.3.tooltip`,
          disabledButtonTooltip: `${namespace}:option.3.disabled_tooltip`,
          selected: [
            {
              text: `${namespace}:option.3.selected`
            }
          ]
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Steal the Snorlax's Leftovers
          const instance = scene.currentBattle.mysteryEncounter!;
          setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.LEFTOVERS], fillRemaining: false });
          // Snorlax exp to Pokemon that did the stealing
          setEncounterExp(scene, instance.primaryPokemon!.id, getPokemonSpecies(Species.SNORLAX).baseExp);
          leaveEncounterWithoutBattle(scene);
        })
        .build()
    )
    .build();
