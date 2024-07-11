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
import { leaveEncounterWithoutBattle } from "../mystery-encounter-utils";

const DAMAGE_PERCENTAGE: number = 30; // 0 - 100

/**
 * Lost at sea encounter.
 * @see {@link https://github.com/AsdarDevelops/PokeRogue-Events/issues/9|GitHub Issue #9}
 * @see For biome requirements check [mysteryEncountersByBiome](../mystery-encounters.ts)
 */
export const LostAtSeaEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(
    MysteryEncounterType.LOST_AT_SEA
  )
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
      const party = scene.getParty();
      const { mysteryEncounter } = scene.currentBattle;

      mysteryEncounter.setDialogueToken(
        "damagePercentage",
        String(DAMAGE_PERCENTAGE)
      );

      // check for water pokemon
      const waterPkm = findPokemonByType(party, Type.WATER);
      mysteryEncounter.setDialogueToken("waterPkm", waterPkm?.name ?? "<NONE>");

      // check for flying pokemon
      const flyingPkm = findPokemonByType(party, Type.FLYING);
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
        .withOptionPhase(async (scene: BattleScene) => {
          console.debug("Lost at sea: Option 1 - Water Pokemon");
          leaveEncounterWithoutBattle(scene);
        })
        .build()
    )
    /**
     * Option 2: Use a (non fainted) flying pokemon to guide you back.
     * Receives EXP similar to defeating a Lapras
     */
    .withOption(
      new MysteryEncounterOptionBuilder()
        .withPokemonTypeRequirement(Type.FLYING, true, 1)
        .withOptionPhase(async (scene: BattleScene) => {
          console.debug("Lost at sea: Option 2 - Flying Pokemon");
          leaveEncounterWithoutBattle(scene);
        })
        .build()
    )
    /**
     * Option 3: Wander aimlessly. All pokemons lose 30% of their HP (or KO on 0 HP).
     */
    .withOptionPhase(async (scene: BattleScene) => {
      const party = scene.getParty().filter((p) => !p.isFainted());
      party.forEach((pkm) => {
        const damage = Math.round(pkm.getMaxHp() / 3);
        pkm.hp = Math.min(pkm.hp, damage);
      });
      leaveEncounterWithoutBattle(scene);
      return true;
    })
    .build();

const findPokemonByType = (party: PlayerPokemon[], type: Type) => {
  return party.find((p) => p.getTypes(true).includes(type));
};
