import { SessionSaveData } from "../../game-data";

/**
 *  Converts old lapsing modifiers (battle items, lures, and Dire Hit) and
 *  other miscellaneous modifiers (vitamins, White Herb) to any new class
 *  names and/or change in reload arguments.
 *  @param data {@linkcode SessionSaveData}
 */
export function migrateModifiers(data: SessionSaveData) {
  data.modifiers.forEach((m) => {
    if (m.className === "PokemonBaseStatModifier") {
      m.className = "BaseStatModifier";
    } else if (m.className === "PokemonResetNegativeStatStageModifier") {
      m.className = "ResetNegativeStatStageModifier";
    } else if (m.className === "TempBattleStatBoosterModifier") {
      const maxBattles = 5;
      // Dire Hit no longer a part of the TempBattleStatBoosterModifierTypeGenerator
      if (m.typeId !== "DIRE_HIT") {
        m.className = "TempStatStageBoosterModifier";
        m.typeId = "TEMP_STAT_STAGE_BOOSTER";

        // Migration from TempBattleStat to Stat
        const newStat = m.typePregenArgs[0] + 1;
        m.typePregenArgs[0] = newStat;

        // From [ stat, battlesLeft ] to [ stat, maxBattles, battleCount ]
        m.args = [ newStat, maxBattles, Math.min(m.args[1], maxBattles) ];
      } else {
        m.className = "TempCritBoosterModifier";
        m.typePregenArgs = [];

        // From [ stat, battlesLeft ] to [ maxBattles, battleCount ]
        m.args = [ maxBattles, Math.min(m.args[1], maxBattles) ];
      }
    } else if (m.className === "DoubleBattleChanceBoosterModifier" && m.args.length === 1) {
      let maxBattles: number;
      switch (m.typeId) {
      case "MAX_LURE":
        maxBattles = 30;
        break;
      case "SUPER_LURE":
        maxBattles = 15;
        break;
      default:
        maxBattles = 10;
        break;
      }

      // From [ battlesLeft ] to [ maxBattles, battleCount ]
      m.args = [ maxBattles, m.args[0] ];
    }
  });

  data.enemyModifiers.forEach((m) => {
    if (m.className === "PokemonBaseStatModifier") {
      m.className = "BaseStatModifier";
    } else if (m.className === "PokemonResetNegativeStatStageModifier") {
      m.className = "ResetNegativeStatStageModifier";
    }
  });
}
