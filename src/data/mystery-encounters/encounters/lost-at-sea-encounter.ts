import { Type } from "#app/data/type.js";
import { Species } from "#app/enums/species.js";
import { PlayerPokemon } from "#app/field/pokemon.js";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "../../../battle-scene";
import MysteryEncounter, {
  MysteryEncounterBuilder,
  MysteryEncounterTier,
} from "../mystery-encounter";
import { MysteryEncounterOptionBuilder } from "../mystery-encounter-option";
import {
  applyDamageToPokemon,
  leaveEncounterWithoutBattle,
  setEncounterExp,
} from "../mystery-encounter-utils";

/**
 * Damage percentage taken when wandering aimlessly.
 * Can be a number between `0` - `100`.
 * The higher the more damage taken (100% = instant KO).
 */
const DAMAGE_PERCENTAGE: number = 30; // 0 - 100

let waterPkm: PlayerPokemon;
let flyingPkm: PlayerPokemon;

/**
 * Lost at sea encounter.
 * @see {@link https://github.com/AsdarDevelops/PokeRogue-Events/issues/9 | GitHub Issue #9}
 * @see For biome requirements check [mysteryEncountersByBiome](../mystery-encounters.ts)
 */
export const LostAtSeaEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.LOST_AT_SEA)
    .withEncounterTier(MysteryEncounterTier.COMMON)
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
    .withSceneWaveRangeRequirement(11, 179)
    .withOnInit((scene: BattleScene) => {
      const allowedPokemon = scene
        .getParty()
        .filter((p) => p.isAllowedInBattle());
      const { mysteryEncounter } = scene.currentBattle;

      mysteryEncounter.setDialogueToken(
        "damagePercentage",
        String(DAMAGE_PERCENTAGE)
      );

      // check for water pokemon
      waterPkm = findPokemonByType(allowedPokemon, Type.WATER);
      mysteryEncounter.setDialogueToken("waterPkm", waterPkm?.name ?? "<NONE>");

      // check for flying pokemon
      flyingPkm = findPokemonByType(allowedPokemon, Type.FLYING);
      mysteryEncounter.setDialogueToken(
        "flyingPkm",
        flyingPkm?.name ?? "<NONE>"
      );

      return true;
    })
    /**
     * Option 1: Use a (non fainted) water pokemon to guide you back.
     * Receives EXP similar to defeating a Lapras
     */
    .withOption(
      new MysteryEncounterOptionBuilder()
        .withPokemonTypeRequirement(Type.WATER, true, 1)
        .withOptionPhase(async (scene: BattleScene) =>
          handleGuidingOption(scene, waterPkm)
        )
        .build()
    )
    /**
     * Option 2: Use a (non fainted) flying pokemon to guide you back.
     * Receives EXP similar to defeating a Lapras
     */
    .withOption(
      new MysteryEncounterOptionBuilder()
        .withPokemonTypeRequirement(Type.FLYING, true, 1)
        .withOptionPhase(async (scene: BattleScene) =>
          handleGuidingOption(scene, flyingPkm)
        )
        .build()
    )
    /**
     * Option 3: Wander aimlessly. All pokemons lose 30% of their HP (or KO on 0 HP).
     */
    .withOptionPhase(async (scene: BattleScene) => {
      const allowedPokemon = scene
        .getParty()
        .filter((p) => p.isAllowedInBattle());

      allowedPokemon.forEach((pkm) => {
        const percentage = DAMAGE_PERCENTAGE / 100;
        const damage = Math.floor(pkm.getMaxHp() * percentage);
        return applyDamageToPokemon(pkm, damage);
      });
      leaveEncounterWithoutBattle(scene);
      return true;
    })
    .build();

/**
 * Find a pokemon inside the given party by a given type
 *
 * @param party player pokemon party
 * @param type type to search for
 * @returns
 */
function findPokemonByType(party: PlayerPokemon[], type: Type) {
  return party.find((p) => p.getTypes(true).includes(type));
}

/**
 * Generic handler for using a guiding pokemon to guide you back.
 *
 * @param scene Battle scene
 * @param guidePokemon pokemon choosen as a guide
 */
function handleGuidingOption(scene: BattleScene, guidePokemon: PlayerPokemon) {
  /** Base EXP value for guiding pokemon. Currently Lapras base-value */
  const baseExpValue: number = 187;

  if (guidePokemon) {
    setEncounterExp(scene, guidePokemon.id, baseExpValue, true);
  } else {
    console.warn(
      "Lost at sea: No guide pokemon found but pokemon guides player. huh!?"
    );
  }

  leaveEncounterWithoutBattle(scene);
}
