/* eslint-disable */
import {describe, it, vi, expect, beforeAll} from "vitest";
import fs from "fs";
import { AES, enc } from "crypto-js";
import {GameData} from "#app/system/game-data";
import BattleScene from "#app/battle-scene.js";
import GameWrapper from "#app/test/essentials/gameWrapper";
import {Species} from "#app/data/enums/species";
import {Moves} from "#app/data/enums/moves";
import {Modifier} from "#app/modifier/modifier";
import ModifierData from "#app/system/modifier-data";
const saveKey = "x0i2O7WRiANTqPmZ";
describe("Session import/export", () => {
  let game, scene, gameData, sessionData;
  beforeAll(() => {
    game = new GameWrapper();
    scene = new BattleScene();
    game.scene.add("battle", scene);
    gameData = new GameData(scene);

    const cookiesStr = fs.readFileSync("./src/test/data/sessionData.prsv", {encoding: "utf8", flag: "r"});
    let dataStr = AES.decrypt(cookiesStr, saveKey).toString(enc.Utf8);
    sessionData = gameData.parseSessionData(dataStr);
  })

  it('check if session data is valid', () => {
    const valid = !!sessionData.party && !!sessionData.enemyParty && !!sessionData.timestamp;
    expect(valid).toBe(true);
  });

  it('check first pokemon in the party', () => {
    expect(sessionData.party.length).toBe(6);
    expect(sessionData.party[0].level).toBe(1269);
    expect(sessionData.party[0].species).toBe(Species.GARGANACL);
    expect(sessionData.party[0].hp).toBe(4007);
    expect(sessionData.party[0].moveset[0].moveId).toBe(Moves.SALT_CURE);
    expect(sessionData.party[0].fusionSpecies).toBe(Species.DRAGAPULT);
  });

  it('check opponent pokemon', () => {
    const data = sessionData;
    expect(sessionData.enemyParty[0].species).toBe(Species.DIGGERSBY);
    expect(sessionData.enemyParty[0].level).toBe(1324);
  });

  it('check player modifiers', () => {
    expect(sessionData.modifiers[0].typeId).toBe("EXP_CHARM");
    expect(sessionData.modifiers[0].stackCount).toBe(60);
  });

  it('start a login phase to create a new session', () => {
    scene.launchBattle();
  });
});

