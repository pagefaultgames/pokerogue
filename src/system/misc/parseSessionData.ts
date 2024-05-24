import PokemonData from "#app/system/pokemon-data";
import TrainerData from "#app/system/trainer-data";
import PersistentModifierData from "#app/system/modifier-data";
import ArenaData from "#app/system/arena-data";
import {SessionSaveData} from "#app/system/game-data";


export default function parseSessionData(dataStr: string): SessionSaveData {
  return JSON.parse(dataStr, (k: string, v: any) => {
    if (k === "party" || k === "enemyParty") {
      const ret: PokemonData[] = [];
      if (v === null) {
        v = [];
      }
      for (const pd of v) {
        ret.push(new PokemonData(pd));
      }
      return ret;
    }

    if (k === "trainer") {
      return v ? new TrainerData(v) : null;
    }

    if (k === "modifiers" || k === "enemyModifiers") {
      const player = k === "modifiers";
      const ret: PersistentModifierData[] = [];
      if (v === null) {
        v = [];
      }
      for (const md of v) {
        if (md?.className === "ExpBalanceModifier") { // Temporarily limit EXP Balance until it gets reworked
          md.stackCount = Math.min(md.stackCount, 4);
        }
        ret.push(new PersistentModifierData(md, player));
      }
      return ret;
    }

    if (k === "arena") {
      return new ArenaData(v);
    }

    return v;
  }) as SessionSaveData;
}
