import { getPokemonSpecies } from "#app/data/pokemon-species.js";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species.js";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "../../../battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder, MysteryEncounterTier } from "../mystery-encounter";
import { EncounterOptionMode, MysteryEncounterOptionBuilder } from "../mystery-encounter-option";
import { leaveEncounterWithoutBattle, setEncounterExp } from "../utils/encounter-phase-utils";
import { applyDamageToPokemon } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";

const OPTION_1_REQUIRED_MOVE = Moves.SURF;
const OPTION_2_REQUIRED_MOVE = Moves.FLY;
/**
 * Damage percentage taken when wandering aimlessly.
 * Can be a number between `0` - `100`.
 * The higher the more damage taken (100% = instant KO).
 */
const DAMAGE_PERCENTAGE: number = 25;
/** The i18n namespace for the encounter */
const namespace = "mysteryEncounter:lostAtSea";

/**
 * Lost at sea encounter.
 * @see {@link https://github.com/AsdarDevelops/PokeRogue-Events/issues/9 | GitHub Issue #9}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const LostAtSeaEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.LOST_AT_SEA)
  .withEncounterTier(MysteryEncounterTier.COMMON)
  .withSceneWaveRangeRequirement(11, 179)
  .withIntroSpriteConfigs([
    {
      fileRoot: "mystery-encounters",
      spriteKey: "buoy",
      hasShadow: false,
      x: 20,
      y: 3,
    },
  ])
  .withIntroDialogue([{ text: `${namespace}:intro` }])
  .withOnInit((scene: BattleScene) => {
    const { mysteryEncounter } = scene.currentBattle;

    mysteryEncounter.setDialogueToken("damagePercentage", String(DAMAGE_PERCENTAGE));
    mysteryEncounter.setDialogueToken("option1RequiredMove", Moves[OPTION_1_REQUIRED_MOVE]);
    mysteryEncounter.setDialogueToken("option2RequiredMove", Moves[OPTION_2_REQUIRED_MOVE]);

    return true;
  })
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withOption(
    // Option 1: Use a (non fainted) pokemon that can learn Surf to guide you back/
    new MysteryEncounterOptionBuilder()
      .withPokemonCanLearnMoveRequirement(OPTION_1_REQUIRED_MOVE)
      .withOptionMode(EncounterOptionMode.DISABLED_OR_DEFAULT)
      .withDialogue({
        buttonLabel: `${namespace}:option:1:label`,
        disabledButtonLabel: `${namespace}:option:1:label_disabled`,
        buttonTooltip: `${namespace}:option:1:tooltip`,
        disabledButtonTooltip: `${namespace}:option:1:tooltip_disabled`,
        selected: [
          {
            text: `${namespace}:option:1:selected`,
          },
        ],
      })
      .withOptionPhase(async (scene: BattleScene) => handlePokemonGuidingYouPhase(scene))
      .build()
  )
  .withOption(
    //Option 2: Use a (non fainted) pokemon that can learn fly to guide you back.
    new MysteryEncounterOptionBuilder()
      .withPokemonCanLearnMoveRequirement(OPTION_2_REQUIRED_MOVE)
      .withOptionMode(EncounterOptionMode.DISABLED_OR_DEFAULT)
      .withDialogue({
        buttonLabel: `${namespace}:option:2:label`,
        disabledButtonLabel: `${namespace}:option:2:label_disabled`,
        buttonTooltip: `${namespace}:option:2:tooltip`,
        disabledButtonTooltip: `${namespace}:option:2:tooltip_disabled`,
        selected: [
          {
            text: `${namespace}:option:2:selected`,
          },
        ],
      })
      .withOptionPhase(async (scene: BattleScene) => handlePokemonGuidingYouPhase(scene))
      .build()
  )
  .withSimpleOption(
    // Option 3: Wander aimlessly
    {
      buttonLabel: `${namespace}:option:3:label`,
      buttonTooltip: `${namespace}:option:3:tooltip`,
      selected: [
        {
          text: `${namespace}:option:3:selected`,
        },
      ],
    },
    async (scene: BattleScene) => {
      const allowedPokemon = scene.getParty().filter((p) => p.isAllowedInBattle());

      for (const pkm of allowedPokemon) {
        const percentage = DAMAGE_PERCENTAGE / 100;
        const damage = Math.floor(pkm.getMaxHp() * percentage);
        applyDamageToPokemon(scene, pkm, damage);
      }

      leaveEncounterWithoutBattle(scene);

      return true;
    }
  )
  .withOutroDialogue([
    {
      text: `${namespace}:outro`,
    },
  ])
  .build();

/**
 * Generic handler for using a guiding pokemon to guide you back.
 *
 * @param scene Battle scene
 * @param guidePokemon pokemon choosen as a guide
 */
function handlePokemonGuidingYouPhase(scene: BattleScene) {
  const laprasSpecies = getPokemonSpecies(Species.LAPRAS);
  const { mysteryEncounter } = scene.currentBattle;

  if (mysteryEncounter.selectedOption) {
    setEncounterExp(scene, mysteryEncounter.selectedOption.primaryPokemon.id, laprasSpecies.baseExp, true);
  } else {
    console.warn("Lost at sea: No guide pokemon found but pokemon guides player. huh!?");
  }

  leaveEncounterWithoutBattle(scene);
  return true;
}
