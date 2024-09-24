import { leaveEncounterWithoutBattle, setEncounterExp, updatePlayerMoney, } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { modifierTypes } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Species } from "#enums/species";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { AbilityRequirement, CombinationPokemonRequirement, MoveRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { getHighestStatTotalPlayerPokemon } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { EXTORTION_ABILITIES, EXTORTION_MOVES } from "#app/data/mystery-encounters/requirements/requirement-groups";
import { getPokemonSpecies, speciesStarters } from "#app/data/pokemon-species";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { ModifierRewardPhase } from "#app/phases/modifier-reward-phase";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounter:offerYouCantRefuse";

/**
 * An Offer You Can't Refuse encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3808 | GitHub Issue #3808}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const AnOfferYouCantRefuseEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.AN_OFFER_YOU_CANT_REFUSE)
    .withEncounterTier(MysteryEncounterTier.GREAT)
    .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
    .withScenePartySizeRequirement(2, 6, true) // Must have at least 2 pokemon in party
    .withIntroSpriteConfigs([
      {
        spriteKey: Species.LIEPARD.toString(),
        fileRoot: "pokemon",
        hasShadow: true,
        repeat: true,
        x: 0,
        y: -4,
        yShadow: -4
      },
      {
        spriteKey: "rich_kid_m",
        fileRoot: "trainer",
        hasShadow: true,
        x: 2,
        y: 5,
        yShadow: 5
      },
    ])
    .withIntroDialogue([
      {
        text: `${namespace}.intro`,
      },
      {
        text: `${namespace}.intro_dialogue`,
        speaker: `${namespace}.speaker`,
      },
    ])
    .withTitle(`${namespace}.title`)
    .withDescription(`${namespace}.description`)
    .withQuery(`${namespace}.query`)
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter!;
      const pokemon = getHighestStatTotalPlayerPokemon(scene, true, true);

      // Base value of Relic Gold, increased linearly up to 3x Relic Gold based on the starter tier of the Pokemon being purchased
      // Starter value 1-3 -> 10x
      // Starter value 10 -> 30x
      const baseSpecies = pokemon.getSpeciesForm().getRootSpeciesId(true);
      const starterValue: number = speciesStarters[baseSpecies] ?? 1;
      const multiplier = Math.max(3 * starterValue, 10);
      const price = scene.getWaveMoneyAmount(multiplier);

      encounter.setDialogueToken("strongestPokemon", pokemon.getNameToRender());
      encounter.setDialogueToken("price", price.toString());

      // Store pokemon and price
      encounter.misc = {
        pokemon: pokemon,
        price: price
      };

      // If player meets the combo OR requirements for option 2, populate the token
      const opt2Req = encounter.options[1].primaryPokemonRequirements[0];
      if (opt2Req.meetsRequirement(scene)) {
        const abilityToken = encounter.dialogueTokens["option2PrimaryAbility"];
        const moveToken = encounter.dialogueTokens["option2PrimaryMove"];
        if (abilityToken) {
          encounter.setDialogueToken("moveOrAbility", abilityToken);
        } else if (moveToken) {
          encounter.setDialogueToken("moveOrAbility", moveToken);
        }
      }

      encounter.setDialogueToken("liepardName", getPokemonSpecies(Species.LIEPARD).getName());

      return true;
    })
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}.option.1.label`,
          buttonTooltip: `${namespace}.option.1.tooltip`,
          selected: [
            {
              text: `${namespace}.option.1.selected`,
              speaker: `${namespace}.speaker`,
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          // Update money and remove pokemon from party
          updatePlayerMoney(scene, encounter.misc.price);
          scene.removePokemonFromPlayerParty(encounter.misc.pokemon);
          return true;
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Give the player a Shiny charm
          scene.unshiftPhase(new ModifierRewardPhase(scene, modifierTypes.SHINY_CHARM));
          leaveEncounterWithoutBattle(scene, true);
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
        .withPrimaryPokemonRequirement(new CombinationPokemonRequirement(
          new MoveRequirement(EXTORTION_MOVES),
          new AbilityRequirement(EXTORTION_ABILITIES))
        )
        .withDialogue({
          buttonLabel: `${namespace}.option.2.label`,
          buttonTooltip: `${namespace}.option.2.tooltip`,
          disabledButtonTooltip: `${namespace}.option.2.tooltip_disabled`,
          selected: [
            {
              speaker: `${namespace}.speaker`,
              text: `${namespace}.option.2.selected`,
            },
          ],
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Extort the rich kid for money
          const encounter = scene.currentBattle.mysteryEncounter!;
          // Update money and remove pokemon from party
          updatePlayerMoney(scene, encounter.misc.price);

          setEncounterExp(scene, encounter.options[1].primaryPokemon!.id, getPokemonSpecies(Species.LIEPARD).baseExp, true);

          leaveEncounterWithoutBattle(scene, true);
        })
        .build()
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}.option.3.label`,
        buttonTooltip: `${namespace}.option.3.tooltip`,
        selected: [
          {
            speaker: `${namespace}.speaker`,
            text: `${namespace}.option.3.selected`,
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
