/* eslint-disable */
import {describe, it, vi, expect, beforeAll} from "vitest";
import fs from "fs";
import { AES, enc } from "crypto-js";
import {decrypt, encrypt, GameData, GameDataType, getDataTypeKey} from "#app/system/game-data";
import BattleScene from "#app/battle-scene.js";
import GameWrapper from "#app/test/essentials/gameWrapper";
import {Species} from "#app/data/enums/species";
import {Moves} from "#app/data/enums/moves";
import {LoginPhase, TitlePhase} from "#app/phases";
import mockLocalStorage from "#app/test/essentials/mockLocalStorage";
import {blobToString} from "#app/test/essentials/utils";
const saveKey = "x0i2O7WRiANTqPmZ";
describe("Session import/export", () => {
  let game, scene, gameData, sessionData, loggedInUser;
  beforeAll(() => {
    game = new GameWrapper();
    loggedInUser = {username: "Greenlamp"};
    scene = new BattleScene();
    game.scene.add("battle", scene);
    gameData = new GameData(scene);

    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage(),
    });

    const cookiesStr = fs.readFileSync("./src/test/data/sessionData.prsv", {encoding: "utf8", flag: "r"});
    let dataStr = AES.decrypt(cookiesStr, saveKey).toString(enc.Utf8);
    sessionData = gameData.parseSessionData(dataStr);
  })

  it('check if session data is valid', () => {
    const valid = !!sessionData.party && !!sessionData.enemyParty && !!sessionData.timestamp;
    expect(valid).toBe(true);
  });

  it.skip('check first pokemon in the party', () => {
    expect(sessionData.party.length).toBe(6);
    expect(sessionData.party[0].level).toBe(1269);
    expect(sessionData.party[0].species).toBe(Species.GARGANACL);
    expect(sessionData.party[0].hp).toBe(4007);
    expect(sessionData.party[0].moveset[0].moveId).toBe(Moves.SALT_CURE);
    expect(sessionData.party[0].fusionSpecies).toBe(Species.DRAGAPULT);
  });

  it.skip('check opponent pokemon', () => {
    const data = sessionData;
    expect(sessionData.enemyParty[0].species).toBe(Species.DIGGERSBY);
    expect(sessionData.enemyParty[0].level).toBe(1324);
  });

  it.skip('check player modifiers', () => {
    expect(sessionData.modifiers[0].typeId).toBe("EXP_CHARM");
    expect(sessionData.modifiers[0].stackCount).toBe(60);
  });

  it.skip('import session', () => {
    const cookiesStr = fs.readFileSync("./src/test/data/sessionData1_Greenlamp.cookies", {encoding: "utf8", flag: "r"});
    let dataStr = AES.decrypt(cookiesStr, saveKey).toString(enc.Utf8);
    sessionData = gameData.parseSessionData(dataStr);
    const dataName = "session";
    const loggedInUser = {username: "Greenlamp"};
    const dataKey = `${getDataTypeKey(GameDataType.SESSION, 1)}_${loggedInUser.username}`;
    localStorage.setItem(dataKey, encrypt(dataStr, false));
  })

  it.skip('export session, check integrity of data', () => {
    const cookiesStr = fs.readFileSync("./src/test/data/sessionData1_Greenlamp.cookies", {encoding: "utf8", flag: "r"});
    let dataStr = AES.decrypt(cookiesStr, saveKey).toString(enc.Utf8);
    sessionData = gameData.parseSessionData(dataStr);
    const dataKey = `${getDataTypeKey(GameDataType.SESSION, 1)}_${loggedInUser.username}`;
    localStorage.setItem(dataKey, encrypt(dataStr, false));

    const slotId = 1;
    const encryptedData = localStorage.getItem(`sessionData${slotId ? slotId : ""}_${loggedInUser.username}`);
    const decryptedData = decrypt(encryptedData, false);
    const reEncryptedData = AES.encrypt(decryptedData, saveKey);
    const blob = new Blob([ reEncryptedData.toString() ], {type: "text/json"});
    expect(blob.size).toBe(32128)
    blobToString(blob).then(result => {
      const decryptedData = decrypt(result as string, false);
      expect(decryptedData).toBe(dataStr);
    });
  })

  it('start a login phase to create a new session', () => {
    scene.launchBattle();
    scene.pushPhase(new LoginPhase(scene));
    scene.pushPhase(new TitlePhase(scene));
    const queue = scene.nextCommandPhaseQueue;
    const queue2 = scene.phaseQueue;
    scene.shiftPhase();
    scene.gameData.saveAll(scene, true, true, true, true).then(() => scene.reset(true));
  });
});

