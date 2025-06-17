import { STEALING_MOVES } from "#app/data/mystery-encounters/requirements/requirement-groups";
import type { PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import { modifierTypes } from "#app/data/data-lists";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { globalScene } from "#app/global-scene";
import { StatusEffect } from "#enums/status-effect";
import type MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { MoveRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import type { EnemyPartyConfig, EnemyPokemonConfig } from "../utils/encounter-phase-utils";
import {
  generateModifierType,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  loadCustomMovesForEncounter,
  setEncounterExp,
  setEncounterRewards,
} from "../utils/encounter-phase-utils";
import { queueEncounterMessage } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { Nature } from "#enums/nature";
import { MoveId } from "#enums/move-id";
import { BattlerIndex } from "#enums/battler-index";
import { PokemonMove } from "#app/data/moves/pokemon-move";
import { AiType } from "#enums/ai-type";
import { getPokemonSpecies } from "#app/utils/pokemon-utils";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { BerryType } from "#enums/berry-type";
import { Stat } from "#enums/stat";
import { CustomPokemonData } from "#app/data/custom-pokemon-data";
import { randSeedInt } from "#app/utils/common";
import { MoveUseMode } from "#enums/move-use-mode";

/** i18n namespace for the encounter */
const namespace = "mysteryEncounters/slumberingSnorlax";

/**
 * Sleeping Snorlax encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3815 | GitHub Issue #3815}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const SlumberingSnorlaxEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.SLUMBERING_SNORLAX,
)
  .withEncounterTier(MysteryEncounterTier.GREAT)
  .withSceneWaveRangeRequirement(15, 150)
  .withCatchAllowed(true)
  .withHideWildIntroMessage(true)
  .withFleeAllowed(false)
  .withIntroSpriteConfigs([
    {
      spriteKey: SpeciesId.SNORLAX.toString(),
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
  .withOnInit(() => {
    const encounter = globalScene.currentBattle.mysteryEncounter!;
    console.log(encounter);

    // Calculate boss mon
    const bossSpecies = getPokemonSpecies(SpeciesId.SNORLAX);
    const pokemonConfig: EnemyPokemonConfig = {
      species: bossSpecies,
      isBoss: true,
      shiny: false, // Shiny lock because shiny is rolled only if the battle option is picked
      status: [StatusEffect.SLEEP, 6], // Extra turns on timer for Snorlax's start of fight moves
      nature: Nature.DOCILE,
      moveSet: [MoveId.BODY_SLAM, MoveId.CRUNCH, MoveId.SLEEP_TALK, MoveId.REST],
      modifierConfigs: [
        {
          modifier: generateModifierType(modifierTypes.BERRY, [BerryType.SITRUS]) as PokemonHeldItemModifierType,
        },
        {
          modifier: generateModifierType(modifierTypes.BERRY, [BerryType.ENIGMA]) as PokemonHeldItemModifierType,
        },
        {
          modifier: generateModifierType(modifierTypes.BASE_STAT_BOOSTER, [Stat.HP]) as PokemonHeldItemModifierType,
        },
        {
          modifier: generateModifierType(modifierTypes.SOOTHE_BELL) as PokemonHeldItemModifierType,
          stackCount: randSeedInt(2, 0),
        },
        {
          modifier: generateModifierType(modifierTypes.LUCKY_EGG) as PokemonHeldItemModifierType,
          stackCount: randSeedInt(2, 0),
        },
      ],
      customPokemonData: new CustomPokemonData({ spriteScale: 1.25 }),
      aiType: AiType.SMART, // Required to ensure Snorlax uses Sleep Talk while it is asleep
    };
    const config: EnemyPartyConfig = {
      levelAdditiveModifier: 0.5,
      pokemonConfigs: [pokemonConfig],
    };
    encounter.enemyPartyConfigs = [config];

    // Load animations/sfx for Snorlax fight start moves
    loadCustomMovesForEncounter([MoveId.SNORE]);

    encounter.setDialogueToken("snorlaxName", getPokemonSpecies(SpeciesId.SNORLAX).getName());

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
    async () => {
      // Pick battle
      const encounter = globalScene.currentBattle.mysteryEncounter!;
      setEncounterRewards({
        guaranteedModifierTypeFuncs: [modifierTypes.LEFTOVERS],
        fillRemaining: true,
      });
      encounter.startOfBattleEffects.push({
        sourceBattlerIndex: BattlerIndex.ENEMY,
        targets: [BattlerIndex.PLAYER],
        move: new PokemonMove(MoveId.SNORE),
        useMode: MoveUseMode.IGNORE_PP,
      });
      await initBattleWithEnemyConfig(encounter.enemyPartyConfigs[0]);
    },
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
    async () => {
      // Fall asleep waiting for Snorlax
      // Full heal party
      globalScene.phaseManager.unshiftNew("PartyHealPhase", true);
      queueEncounterMessage(`${namespace}:option.2.rest_result`);
      leaveEncounterWithoutBattle();
    },
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
      .withPrimaryPokemonRequirement(new MoveRequirement(STEALING_MOVES, true))
      .withDialogue({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        disabledButtonTooltip: `${namespace}:option.3.disabled_tooltip`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      })
      .withOptionPhase(async () => {
        // Steal the Snorlax's Leftovers
        const instance = globalScene.currentBattle.mysteryEncounter!;
        setEncounterRewards({
          guaranteedModifierTypeFuncs: [modifierTypes.LEFTOVERS],
          fillRemaining: false,
        });
        // Snorlax exp to Pokemon that did the stealing
        setEncounterExp(instance.primaryPokemon!.id, getPokemonSpecies(SpeciesId.SNORLAX).baseExp);
        leaveEncounterWithoutBattle();
      })
      .build(),
  )
  .build();
