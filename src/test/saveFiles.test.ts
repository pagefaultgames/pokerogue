/* eslint-disable */
import {describe, it, vi, expect, beforeAll} from "vitest";
import fs from "fs";
import { AES, enc } from "crypto-js";
import {decrypt, encrypt, GameData, GameDataType, getDataTypeKey} from "#app/system/game-data";
import BattleScene from "#app/battle-scene.js";
import GameWrapper from "#app/test/essentials/gameWrapper";
import {Species} from "#app/data/enums/species";
import {Moves} from "#app/data/enums/moves";
import {CommandPhase, EncounterPhase, EnemyCommandPhase, LoginPhase, SelectStarterPhase, TitlePhase} from "#app/phases";
import mockLocalStorage from "#app/test/essentials/mockLocalStorage";
import {
  blobToString,
  generateStarter,
  holdOn, waitFirstInPhaseQueueIs,
} from "#app/test/essentials/utils";
import * as Utils from "#app/utils";
import {loggedInUser, setLoggedInUser} from "#app/account";
import {GameModes} from "#app/game-mode";
import mockConsoleLog from "#app/test/essentials/mockConsoleLog";
import {Mode} from "#app/ui/ui";
import {MockFetch} from "#app/test/essentials/mockFetch";
import infoHandler from "#app/test/essentials/fetchHandlers/infoHandler";
const saveKey = "x0i2O7WRiANTqPmZ";
describe("Session import/export", () => {
  let game, scene, gameData, sessionData;
  beforeAll(() => {
    game = new GameWrapper();
    setLoggedInUser("Greenlamp", 1);
    scene = new BattleScene();
    game.scene.add("battle", scene);
    gameData = new GameData(scene);

    Utils.setCookie(Utils.sessionIdKey, 'fake_token');

    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage(),
    });
    Object.defineProperty(window, "console", {
      value: mockConsoleLog(),
    });

    global.fetch = vi.fn(MockFetch);

    const cookiesStr = fs.readFileSync("./src/test/data/sessionData.prsv", {encoding: "utf8", flag: "r"});
    let dataStr = AES.decrypt(cookiesStr, saveKey).toString(enc.Utf8);
    sessionData = gameData.parseSessionData(dataStr);
  })

  it.skip('check if session data is valid', () => {
    const valid = !!sessionData.party && !!sessionData.enemyParty && !!sessionData.timestamp;
    expect(valid).toBe(true);
  });

  it.skip('test fetch mock async', async () => {
    const spy = vi.fn();
    await fetch('https://localhost:8080/account/info').then(response => {
      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
      return response.json();
    }).then(data => {
      spy(); // Call the spy function
      expect(data).toEqual(infoHandler);
    });
    expect(spy).toHaveBeenCalled();
  });

  it.skip('test fetch mock sync', async () => {
    const response = await fetch('https://localhost:8080/account/info');
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(data).toEqual(infoHandler);
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

  it.skip('testing wait phase queue', async () => {
    const fakeScene = {
      phaseQueue: [1, 2, 3] // Initially not empty
    };
    setTimeout(() => {
      fakeScene.phaseQueue = [];
}, 500);
    const spy = vi.fn();
    await waitPhaseQueueCountIs(fakeScene, 0).then(result => {
      expect(result).toBe(true);
      spy(); // Call the spy function
    });
    expect(spy).toHaveBeenCalled();
  });

  it('select new Game', async () => {
    scene.launchBattle();
    scene.pushPhase(new LoginPhase(scene));
    scene.pushPhase(new TitlePhase(scene));
    scene.shiftPhase();
    scene.shiftPhase();
    const gameMode = GameModes.CLASSIC;
    // scene.ui.setMode(Mode.MESSAGE);
    scene.pushPhase(new SelectStarterPhase(scene, gameMode));
    scene.newArena(scene.gameMode.getStartingBiome(scene));
    scene.pushPhase(new EncounterPhase(scene, false));
    scene.shiftPhase();
    let phase = scene.getCurrentPhase();
    const starters = generateStarter(scene);
    phase.initBattle(starters);
    scene.newBattle();
    scene.arena.init();
    scene.shiftPhase();
    await scene.getCurrentPhase().doEncounter();
    await holdOn(2000)
    phase = scene.getCurrentPhase();
    phase = scene.getCurrentPhase();
  //   const spy = vi.fn();
  //   await waitFirstInPhaseQueueIs(scene, EnemyCommandPhase).then(result => {
  //     expect(result).toBe(true);
  //     phase = scene.getCurrentPhase();
  //     expect(phase).not.toBeInstanceOf(LoginPhase);
  //     expect(phase).toBeInstanceOf(CommandPhase);
  //     spy(); // Call the spy function
  //   });
  //   expect(spy).toHaveBeenCalled();
  });
});

