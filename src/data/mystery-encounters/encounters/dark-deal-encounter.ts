import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { modifierTypes } from "#data/data-lists";
import { Challenges } from "#enums/challenges";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import type { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import type { PokemonHeldItemModifier } from "#modifiers/modifier";
import { PokemonFormChangeItemModifier } from "#modifiers/modifier";
import type { EnemyPartyConfig, EnemyPokemonConfig } from "#mystery-encounters/encounter-phase-utils";
import { initBattleWithEnemyConfig, leaveEncounterWithoutBattle } from "#mystery-encounters/encounter-phase-utils";
import { getRandomPlayerPokemon, getRandomSpeciesByStarterCost } from "#mystery-encounters/encounter-pokemon-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import { randSeedInt } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";

/** i18n namespace for encounter */
const namespace = "mysteryEncounters/darkDeal";

/** Exclude Ultra Beasts (inludes Cosmog/Solgaleo/Lunala/Necrozma), Paradox (includes Miraidon/Koraidon), Eternatus, and Mythicals */
const excludedBosses = [SpeciesId.ETERNATUS];

/**
 * Dark Deal encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3806 | GitHub Issue #3806}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const DarkDealEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.DARK_DEAL,
)
  .withEncounterTier(MysteryEncounterTier.ROGUE)
  .withDisallowedChallenges(Challenges.HARDCORE)
  .withIntroSpriteConfigs([
    {
      spriteKey: "dark_deal_scientist",
      fileRoot: "mystery-encounters",
      hasShadow: true,
    },
    {
      spriteKey: "dark_deal_porygon",
      fileRoot: "mystery-encounters",
      hasShadow: true,
      repeat: true,
    },
  ])
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
    {
      speaker: `${namespace}:speaker`,
      text: `${namespace}:introDialogue`,
    },
  ])
  .withSceneWaveRangeRequirement(30, CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES[1])
  .withScenePartySizeRequirement(2, 6, true) // Must have at least 2 pokemon in party
  .withCatchAllowed(true)
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withDialogue({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            speaker: `${namespace}:speaker`,
            text: `${namespace}:option.1.selectedDialogue`,
          },
          {
            text: `${namespace}:option.1.selectedMessage`,
          },
        ],
      })
      .withPreOptionPhase(async () => {
        // Removes random pokemon (including fainted) from party and adds name to dialogue data tokens
        // Will never return last battle able mon and instead pick fainted/unable to battle
        const removedPokemon = getRandomPlayerPokemon(true, false, true);

        // Get all the pokemon's held items
        const modifiers = removedPokemon.getHeldItems().filter(m => !(m instanceof PokemonFormChangeItemModifier));
        globalScene.removePokemonFromPlayerParty(removedPokemon);

        const encounter = globalScene.currentBattle.mysteryEncounter!;
        encounter.setDialogueToken("pokeName", removedPokemon.getNameToRender());

        // Store removed pokemon types
        encounter.misc = {
          removedTypes: removedPokemon.getTypes(),
          modifiers,
        };
      })
      .withOptionPhase(async () => {
        // Give the player 5 Rogue Balls
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        globalScene.phaseManager.unshiftNew("ModifierRewardPhase", modifierTypes.ROGUE_BALL);

        // Start encounter with random legendary (7-10 starter strength) that has level additive
        // If this is a mono-type challenge, always ensure the required type is filtered for
        let bossTypes: PokemonType[] = encounter.misc.removedTypes;
        const singleTypeChallenges = globalScene.gameMode.challenges.filter(
          c => c.value && c.id === Challenges.SINGLE_TYPE,
        );
        if (globalScene.gameMode.isChallenge && singleTypeChallenges.length > 0) {
          bossTypes = singleTypeChallenges.map(c => (c.value - 1) as PokemonType);
        }

        const bossModifiers: PokemonHeldItemModifier[] = encounter.misc.modifiers;
        // Starter egg tier, 35/50/10/5 %odds for tiers 6/7/8/9+
        const roll = randSeedInt(100);
        const starterTier: number | [number, number] = roll >= 65 ? 6 : roll >= 15 ? 7 : roll >= 5 ? 8 : [9, 10];
        const bossSpecies = getPokemonSpecies(
          getRandomSpeciesByStarterCost(starterTier, excludedBosses, bossTypes, true, true, false, false),
        );
        const pokemonConfig: EnemyPokemonConfig = {
          species: bossSpecies,
          isBoss: true,
          modifierConfigs: bossModifiers.map(m => {
            return {
              modifier: m,
              stackCount: m.getStackCount(),
            };
          }),
        };
        if (bossSpecies.forms != null && bossSpecies.forms.length > 0) {
          pokemonConfig.formIndex = 0;
        }
        const config: EnemyPartyConfig = {
          pokemonConfigs: [pokemonConfig],
        };
        await initBattleWithEnemyConfig(config);
      })
      .build(),
  )
  .withSimpleOption(
    {
      buttonLabel: `${namespace}:option.2.label`,
      buttonTooltip: `${namespace}:option.2.tooltip`,
      selected: [
        {
          speaker: `${namespace}:speaker`,
          text: `${namespace}:option.2.selected`,
        },
      ],
    },
    async () => {
      // Leave encounter with no rewards or exp
      leaveEncounterWithoutBattle(true);
      return true;
    },
  )
  .withOutroDialogue([
    {
      text: `${namespace}:outro`,
    },
  ])
  .build();
