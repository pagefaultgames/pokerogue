import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "../../../battle-scene";
import MysteryEncounter, {
  MysteryEncounterBuilder,
  MysteryEncounterTier,
} from "../mystery-encounter";

/**
 * Getting lost at the sea encounter.
 * @see {@link https://github.com/AsdarDevelops/PokeRogue-Events/issues/9|GitHub Issue #9}
 * @see {@linkcode MysteryEncounter|Dialogues}
 * @see For biome requirements check [mysteryEncountersByBiome](../mystery-encounters.ts)
 */
export const GettingLostAtTheSeaEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(
    MysteryEncounterType.GETTING_LOST_AT_THE_SEA
  )
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withIntroSpriteConfigs([
      {
        fileRoot: "pokemon",
        spriteKey: "130", // gyarados for now
        hasShadow: false,
        scale: 4,
        y: 100,
        x: 130,
        tint: .25
      },
    ])
    .withSceneWaveRangeRequirement(11, 179)
    .withOnInit((_scene: BattleScene) => {
      console.log("GettingLostAtTheSeaEncounter OnInit");
      return true;
    })
    .withOptionPhase(async (scene: BattleScene) => {
      // OPTION 1
    })
    .withOptionPhase(async (scene: BattleScene) => {
      // OPTION 2
    })
    .withOptionPhase(async (scene: BattleScene) => {
      // OPTION 3
      return true;
    })
    .build();
