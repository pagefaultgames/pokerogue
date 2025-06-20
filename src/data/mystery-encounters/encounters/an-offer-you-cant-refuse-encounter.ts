import {
  generateModifierType,
  leaveEncounterWithoutBattle,
  setEncounterExp,
  updatePlayerMoney,
} from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { modifierTypes } from "#app/data/data-lists";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { globalScene } from "#app/global-scene";
import type MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import {
  AbilityRequirement,
  CombinationPokemonRequirement,
  MoveRequirement,
} from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { getHighestStatTotalPlayerPokemon } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { EXTORTION_ABILITIES, EXTORTION_MOVES } from "#app/data/mystery-encounters/requirements/requirement-groups";
import { getPokemonSpecies } from "#app/utils/pokemon-utils";
import { speciesStarterCosts } from "#app/data/balance/starters";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import i18next from "i18next";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounters/anOfferYouCantRefuse";

/**
 * Money offered starts at base value of Relic Gold, increasing linearly up to 3x Relic Gold based on the starter tier of the Pokemon being purchased
 * Starter value 1-3 -> Relic Gold
 * Starter value 10 -> 3 * Relic Gold
 */
const MONEY_MINIMUM_MULTIPLIER = 10;
const MONEY_MAXIMUM_MULTIPLIER = 30;

/**
 * An Offer You Can't Refuse encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3808 | GitHub Issue #3808}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const AnOfferYouCantRefuseEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE,
)
  .withEncounterTier(MysteryEncounterTier.GREAT)
  .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
  .withScenePartySizeRequirement(2, 6, true) // Must have at least 2 pokemon in party
  .withIntroSpriteConfigs([
    {
      spriteKey: SpeciesId.LIEPARD.toString(),
      fileRoot: "pokemon",
      hasShadow: true,
      repeat: true,
      x: 0,
      y: -4,
      yShadow: -4,
    },
    {
      spriteKey: "rich_kid_m",
      fileRoot: "trainer",
      hasShadow: true,
      x: 2,
      y: 5,
      yShadow: 5,
    },
  ])
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
    {
      text: `${namespace}:intro_dialogue`,
      speaker: `${namespace}:speaker`,
    },
  ])
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withOnInit(() => {
    const encounter = globalScene.currentBattle.mysteryEncounter!;
    const pokemon = getHighestStatTotalPlayerPokemon(true, true);

    const baseSpecies = pokemon.getSpeciesForm().getRootSpeciesId();
    const starterValue: number = speciesStarterCosts[baseSpecies] ?? 1;
    const multiplier = Math.max((MONEY_MAXIMUM_MULTIPLIER / 10) * starterValue, MONEY_MINIMUM_MULTIPLIER);
    const price = globalScene.getWaveMoneyAmount(multiplier);

    encounter.setDialogueToken("strongestPokemon", pokemon.getNameToRender());
    encounter.setDialogueToken("price", price.toString());

    // Store pokemon and price
    encounter.misc = {
      pokemon: pokemon,
      price: price,
    };

    // If player meets the combo OR requirements for option 2, populate the token
    const opt2Req = encounter.options[1].primaryPokemonRequirements[0];
    if (opt2Req.meetsRequirement()) {
      const abilityToken = encounter.dialogueTokens["option2PrimaryAbility"];
      const moveToken = encounter.dialogueTokens["option2PrimaryMove"];
      if (abilityToken) {
        encounter.setDialogueToken("moveOrAbility", abilityToken);
      } else if (moveToken) {
        encounter.setDialogueToken("moveOrAbility", moveToken);
      }
    }

    const shinyCharm = generateModifierType(modifierTypes.SHINY_CHARM);
    encounter.setDialogueToken("itemName", shinyCharm?.name ?? i18next.t("modifierType:ModifierType.SHINY_CHARM.name"));
    encounter.setDialogueToken("liepardName", getPokemonSpecies(SpeciesId.LIEPARD).getName());

    return true;
  })
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withDialogue({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            text: `${namespace}:option.1.selected`,
            speaker: `${namespace}:speaker`,
          },
        ],
      })
      .withPreOptionPhase(async (): Promise<boolean> => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        // Update money and remove pokemon from party
        updatePlayerMoney(encounter.misc.price);
        globalScene.removePokemonFromPlayerParty(encounter.misc.pokemon);
        return true;
      })
      .withOptionPhase(async () => {
        // Give the player a Shiny Charm
        globalScene.phaseManager.unshiftNew("ModifierRewardPhase", modifierTypes.SHINY_CHARM);
        leaveEncounterWithoutBattle(true);
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
      .withPrimaryPokemonRequirement(
        CombinationPokemonRequirement.Some(
          new MoveRequirement(EXTORTION_MOVES, true),
          new AbilityRequirement(EXTORTION_ABILITIES, true),
        ),
      )
      .withDialogue({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        disabledButtonTooltip: `${namespace}:option.2.tooltip_disabled`,
        selected: [
          {
            speaker: `${namespace}:speaker`,
            text: `${namespace}:option.2.selected`,
          },
        ],
      })
      .withOptionPhase(async () => {
        // Extort the rich kid for money
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        // Update money and remove pokemon from party
        updatePlayerMoney(encounter.misc.price);

        setEncounterExp(encounter.options[1].primaryPokemon!.id, getPokemonSpecies(SpeciesId.LIEPARD).baseExp, true);

        leaveEncounterWithoutBattle(true);
      })
      .build(),
  )
  .withSimpleOption(
    {
      buttonLabel: `${namespace}:option.3.label`,
      buttonTooltip: `${namespace}:option.3.tooltip`,
      selected: [
        {
          speaker: `${namespace}:speaker`,
          text: `${namespace}:option.3.selected`,
        },
      ],
    },
    async () => {
      // Leave encounter with no rewards or exp
      leaveEncounterWithoutBattle(true);
      return true;
    },
  )
  .build();
