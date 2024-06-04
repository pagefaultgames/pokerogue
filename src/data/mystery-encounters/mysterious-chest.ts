import BattleScene from "../../battle-scene";
import { ModifierTier } from "../../modifier/modifier-tier";
import { leaveEncounter, setEncounterRewards } from "../../utils/mystery-encounter-utils";
import MysteryEncounter, { EncounterRequirements, MysteryEncounterWrapper, OptionSelectMysteryEncounter } from "../mystery-encounter";
import * as Utils from "../../utils";
import { MysteryEncounterType } from "../enums/mystery-encounter-type";
import { Species } from "../enums/species";

export class MysteriousChestEncounter implements MysteryEncounterWrapper {
  get(): MysteryEncounter {
    return new OptionSelectMysteryEncounter(MysteryEncounterType.MYSTERIOUS_CHALLENGERS)
      .introVisualsConfig([
        {
          spriteKey: Species.GIMMIGHOUL.toString(),
          fileRoot: "pokemon",
          hasShadow: true
        }
      ])
      .requirements(new EncounterRequirements(2, 180)) // waves 2 to 180
      .option(async (scene: BattleScene) => {
        // Open the chest
        const roll = Utils.randSeedInt(100);
        if (roll > 50) {
          // Choose between 5 GREAT tier items (5%)
          setEncounterRewards(scene, true, [ModifierTier.GREAT, ModifierTier.GREAT, ModifierTier.GREAT, ModifierTier.GREAT, ModifierTier.GREAT], false);
        } else if (roll > 30) {
          // Choose between 4 ULTRA tier items (5%)
          setEncounterRewards(scene, true, [ModifierTier.ULTRA, ModifierTier.ULTRA, ModifierTier.ULTRA, ModifierTier.ULTRA], false);
        } else if (roll > 25) {
          // Choose between 3 ROGUE tier items (5%)
          setEncounterRewards(scene, true, [ModifierTier.ROGUE, ModifierTier.ROGUE, ModifierTier.ROGUE], false);
        } else if (roll > 24) {
          // Choose 1 MASTER tier item (1%)
          setEncounterRewards(scene, true, [ModifierTier.MASTER], false);
        } else {
          // Your highest level Pok�mon gets OHKO. Progress with no rewards (24%)
          // TODO
        }
      })
      .option(async (scene: BattleScene) => {
        // Leave encounter with no rewards or exp
        leaveEncounter(scene);
        return true;
      });
  }
}
