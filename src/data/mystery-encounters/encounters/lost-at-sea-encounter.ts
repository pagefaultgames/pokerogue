import { Type } from "#app/data/type.js";
import { Moves } from "#app/enums/moves.js";
import { Species } from "#app/enums/species.js";
import { PlayerPokemon } from "#app/field/pokemon.js";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "../../../battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder, MysteryEncounterTier } from "../mystery-encounter";
import { EncounterOptionMode, MysteryEncounterOptionBuilder } from "../mystery-encounter-option";
import { applyDamageToPokemon, leaveEncounterWithoutBattle, setEncounterExp } from "../mystery-encounter-utils";

/**
 * Damage percentage taken when wandering aimlessly.
 * Can be a number between `0` - `100`.
 * The higher the more damage taken (100% = instant KO).
 */
const DAMAGE_PERCENTAGE: number = 30; // 0 - 100
/** The i18n namespace for the encounter */
const namepsace = "mysteryEncounter:lostAtSea";

let surfablePkm: PlayerPokemon;
let flyingPkm: PlayerPokemon;

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
      fileRoot: "pokemon",
      spriteKey: `${Species.GYARADOS}`,
      hasShadow: false,
      scale: 4,
      y: 100,
      x: 130,
      tint: 0.75,
      alpha: 0.25,
    },
  ])
  .withIntroDialogue([{ text: `${namepsace}:intro` }])
  .withOnInit((scene: BattleScene) => {
    // const allowedPokemon = scene.getParty().filter((p) => p.isAllowedInBattle());
    const { mysteryEncounter } = scene.currentBattle;

    mysteryEncounter.setDialogueToken("damagePercentage", String(DAMAGE_PERCENTAGE));

    // check for water pokemon
    // surfablePkm = findPokemonThatCanLearnMove(allowedPokemon, Type.WATER);
    // mysteryEncounter.setDialogueToken("waterPkm", surfablePkm?.name ?? "");

    // check for flying pokemon
    // flyingPkm = findPokemonThatCanLearnMove(allowedPokemon, Type.FLYING);
    // mysteryEncounter.setDialogueToken("flyingPkm", flyingPkm?.name ?? "");

    return true;
  })
  .withTitle(`${namepsace}:title`)
  .withDescription(`${namepsace}:description`)
  .withQuery(`${namepsace}:query`)
  .withOption(
    /**
     * Option 1: Use a (non fainted) water pokemon to guide you back.
     * Receives EXP similar to defeating a Lapras
     */
    new MysteryEncounterOptionBuilder()
      .withPokemonCanLearnMoveRequirement(Moves.SURF)
      .withOptionMode(EncounterOptionMode.DISABLED_OR_DEFAULT)
      .withDialogue({
        buttonLabel: `${namepsace}:option:1:label`,
        buttonTooltip: `${namepsace}:option:1:tooltip`,
        selected: [
          {
            text: `${namepsace}:option:1:selected`,
          },
        ],
      })
      .withOptionPhase(async (scene: BattleScene) => handleGuidingOptionPhase(scene, surfablePkm))
      .build()
  )
  .withOption(
    /**
     * Option 2: Use a (non fainted) flying pokemon to guide you back.
     * Receives EXP similar to defeating a Lapras
     */
    new MysteryEncounterOptionBuilder()
      .withPokemonTypeRequirement(Type.FLYING, true, 1)
      .withOptionMode(EncounterOptionMode.DISABLED_OR_DEFAULT)
      .withDialogue({
        buttonLabel: `${namepsace}:option:2:label`,
        buttonTooltip: `${namepsace}:option:2:tooltip`,
        selected: [
          {
            text: `${namepsace}:option:2:selected`,
          },
        ],
      })
      .withOptionPhase(async (scene: BattleScene) => handleGuidingOptionPhase(scene, flyingPkm))
      .build()
  )
  .withSimpleOption(
    /**
     * Option 3: Wander aimlessly. All pokemons lose {@linkcode DAMAGE_PERCENTAGE}}% of their HP (or KO on 0 HP).
     */
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
        return applyDamageToPokemon(pkm, damage);
      });
      leaveEncounterWithoutBattle(scene);

      return true;
    }
  )
  .build();

/**
 * Generic handler for using a guiding pokemon to guide you back.
 *
 * @param scene Battle scene
 * @param guidePokemon pokemon choosen as a guide
 */
function handleGuidingOptionPhase(scene: BattleScene, guidePokemon: PlayerPokemon) {
  /** Base EXP value for guiding pokemon. Currently Lapras base-value */
  const baseExpValue: number = 187;

  if (guidePokemon) {
    setEncounterExp(scene, guidePokemon.id, baseExpValue, true);
  } else {
    console.warn("Lost at sea: No guide pokemon found but pokemon guides player. huh!?");
  }

  leaveEncounterWithoutBattle(scene);
}
