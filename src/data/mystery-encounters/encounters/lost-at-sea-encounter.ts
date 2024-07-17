import { Moves } from "#app/enums/moves";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "../../../battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder, MysteryEncounterTier } from "../mystery-encounter";
import { EncounterOptionMode, MysteryEncounterOptionBuilder } from "../mystery-encounter-option";
import { applyDamageToPokemon, leaveEncounterWithoutBattle, setEncounterExp } from "../utils/encounter-phase-utils";

const OPTION_1_REQUIRED_MOVE = Moves.SURF;
const OPTION_2_REQUIRED_MOVE = Moves.FLY;
/**
 * Damage percentage taken when wandering aimlessly.
 * Can be a number between `0` - `100`.
 * The higher the more damage taken (100% = instant KO).
 */
const DAMAGE_PERCENTAGE: number = 25;
/** The i18n namespace for the encounter */
const namepsace = "mysteryEncounter:lostAtSea";

/**
 * Lost at sea encounter.
 * @see {@link https://github.com/AsdarDevelops/PokeRogue-Events/issues/9 | GitHub Issue #9}
 * @see For biome requirements check [mysteryEncountersByBiome](../mystery-encounters.ts)
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
  .withIntroDialogue([{ text: `${namepsace}:intro` }])
  .withOnInit((scene: BattleScene) => {
    const { mysteryEncounter } = scene.currentBattle;

    mysteryEncounter.setDialogueToken("damagePercentage", String(DAMAGE_PERCENTAGE));
    mysteryEncounter.setDialogueToken("option1RequiredMove", Moves[OPTION_1_REQUIRED_MOVE]);
    mysteryEncounter.setDialogueToken("option2RequiredMove", Moves[OPTION_2_REQUIRED_MOVE]);

    return true;
  })
  .withTitle(`${namepsace}:title`)
  .withDescription(`${namepsace}:description`)
  .withQuery(`${namepsace}:query`)
  .withOption(
    // Option 1: Use a (non fainted) pokemon that can learn Surf to guide you back/
    new MysteryEncounterOptionBuilder()
      .withPokemonCanLearnMoveRequirement(OPTION_1_REQUIRED_MOVE)
      .withOptionMode(EncounterOptionMode.DISABLED_OR_DEFAULT)
      .withDialogue({
        buttonLabel: `${namepsace}:option:1:label`,
        disabledButtonLabel: `${namepsace}:option:1:label_disabled`,
        buttonTooltip: `${namepsace}:option:1:tooltip`,
        disabledButtonTooltip: `${namepsace}:option:1:tooltip_disabled`,
        selected: [
          {
            text: `${namepsace}:option:1:selected`,
          },
        ],
      })
      .withOptionPhase(async (scene: BattleScene) => handlePokemongGuidingYouPhase(scene))
      .build()
  )
  .withOption(
    //Option 2: Use a (non fainted) pokemon that can learn fly to guide you back.
    new MysteryEncounterOptionBuilder()
      .withPokemonCanLearnMoveRequirement(OPTION_2_REQUIRED_MOVE)
      .withOptionMode(EncounterOptionMode.DISABLED_OR_DEFAULT)
      .withDialogue({
        buttonLabel: `${namepsace}:option:2:label`,
        disabledButtonLabel: `${namepsace}:option:2:label_disabled`,
        buttonTooltip: `${namepsace}:option:2:tooltip`,
        disabledButtonTooltip: `${namepsace}:option:2:tooltip_disabled`,
        selected: [
          {
            text: `${namepsace}:option:2:selected`,
          },
        ],
      })
      .withOptionPhase(async (scene: BattleScene) => handlePokemongGuidingYouPhase(scene))
      .build()
  )
  .withSimpleOption(
    // Option 3: Wander aimlessly
    {
      buttonLabel: `${namepsace}:option:3:label`,
      buttonTooltip: `${namepsace}:option:3:tooltip`,
      selected: [
        {
          text: `${namepsace}:option:3:selected`,
        },
      ],
    },
    async (scene: BattleScene) => {
      const allowedPokemon = scene.getParty().filter((p) => p.isAllowedInBattle());

      allowedPokemon.forEach((pkm) => {
        const percentage = DAMAGE_PERCENTAGE / 100;
        const damage = Math.floor(pkm.getMaxHp() * percentage);
        applyDamageToPokemon(pkm, damage);
        if (pkm.isFainted()) {
          scene.currentBattle.mysteryEncounter.dialogue.outro.push({
            text: `${pkm.name} fainted!`,
          });
        }
      });
      leaveEncounterWithoutBattle(scene);

      return true;
    }
  )
  .withOutroDialogue([
    {
      text: `${namepsace}:outro`,
    },
  ])
  .build();

/**
 * Generic handler for using a guiding pokemon to guide you back.
 *
 * @param scene Battle scene
 * @param guidePokemon pokemon choosen as a guide
 */
function handlePokemongGuidingYouPhase(scene: BattleScene) {
  /** Base EXP value for guiding pokemon. Currently Lapras base-value */
  const baseExpValue: number = 187;
  const { mysteryEncounter } = scene.currentBattle;

  if (mysteryEncounter.selectedOption) {
    setEncounterExp(scene, mysteryEncounter.selectedOption.primaryPokemon.id, baseExpValue, true);
  } else {
    console.warn("Lost at sea: No guide pokemon found but pokemon guides player. huh!?");
  }

  leaveEncounterWithoutBattle(scene);
  return true;
}
