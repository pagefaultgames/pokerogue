/* eslint-disable */
import {describe, it, vi, expect, beforeAll, beforeEach} from "vitest";
import fs from "fs";
import { AES, enc } from "crypto-js";
import {decrypt, encrypt, GameData, GameDataType, getDataTypeKey} from "#app/system/game-data";
import BattleScene from "#app/battle-scene.js";
import GameWrapper from "#app/test/essentials/gameWrapper";
import {
  blobToString,
  waitUntil,
} from "#app/test/essentials/utils";
import {loggedInUser, setLoggedInUser} from "#app/account";
import {Mode} from "#app/ui/ui";
import infoHandler from "#app/test/essentials/fetchHandlers/infoHandler";
import {apiFetch} from "#app/utils";
import {GameModes} from "#app/game-mode";
import {TitlePhase} from "#app/phases";
import StarterSelectUiHandler from "#app/ui/starter-select-ui-handler";
const saveKey = "x0i2O7WRiANTqPmZ";


describe("Session import/export", () => {
  let game, scene, sessionData;

  beforeEach(async () => {
    game = new GameWrapper();
    scene = new BattleScene();
    game.scene.add("battle", scene);
    await waitUntil(() => scene.ui?.getMode() === Mode.TITLE);
  }, 100000);

  it('test fetch mock async', async () => {
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

  it('test apifetch mock async', async () => {
    const spy = vi.fn();
    await apiFetch('https://localhost:8080/account/info').then(response => {
      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
      return response.json();
    }).then(data => {
      spy(); // Call the spy function
      expect(data).toEqual(infoHandler);
    });
    expect(spy).toHaveBeenCalled();
  });

  it('test fetch mock sync', async () => {
    const response = await fetch('https://localhost:8080/account/info');
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(data).toEqual(infoHandler);
  });

  it('import session', () => {
    const cookiesStr = fs.readFileSync("./src/test/data/sessionData1_Greenlamp.cookies", {encoding: "utf8", flag: "r"});
    let dataStr = AES.decrypt(cookiesStr, saveKey).toString(enc.Utf8);
    sessionData = scene.gameData.parseSessionData(dataStr);
    const dataKey = `${getDataTypeKey(GameDataType.SESSION, 1)}_${loggedInUser.username}`;
    localStorage.setItem(dataKey, encrypt(dataStr, false));
  })

  it('export session, check integrity of data', () => {
    const cookiesStr = fs.readFileSync("./src/test/data/sessionData1_Greenlamp.cookies", {encoding: "utf8", flag: "r"});
    let dataStr = AES.decrypt(cookiesStr, saveKey).toString(enc.Utf8);
    sessionData = scene.gameData.parseSessionData(dataStr);
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

  it('testing wait phase queue', async () => {
    const fakeScene = {
      phaseQueue: [1, 2, 3] // Initially not empty
    };
    setTimeout(() => {
      fakeScene.phaseQueue = [];
}, 500);
    const spy = vi.fn();
    await waitUntil(() => fakeScene.phaseQueue.length === 0).then(result => {
      expect(result).toBe(true);
      spy(); // Call the spy function
    });
    expect(spy).toHaveBeenCalled();
  });

  it('Start at title mode', () => {
    const mode = scene.ui?.getMode();
    expect(mode).toBe(Mode.TITLE);
  });

  it('Select gamemode Classic new game to starter selection', async () => {
    const gameMode = GameModes.CLASSIC;
    scene.ui.setMode(Mode.MESSAGE);
    const titlePhase = new TitlePhase(scene);
    titlePhase.setGameMode(gameMode);
    titlePhase.end();
    await waitUntil(() => scene.ui.getMode() === Mode.STARTER_SELECT);
    const handler = scene.ui.getHandler() as StarterSelectUiHandler;
    expect(handler).toBeInstanceOf(StarterSelectUiHandler);
  });

  it('With gameWrapper: Select gamemode Classic new game to starter selection', async() => {
    await game.newGame(scene, GameModes.CLASSIC);
    const handler = scene.ui.getHandler() as StarterSelectUiHandler;
    expect(handler).toBeInstanceOf(StarterSelectUiHandler);
  });

  it.skip('Reach title mode', async () => {
    // scene.pushPhase(new LoginPhase(scene));
    // scene.pushPhase(new TitlePhase(scene));
    // scene.shiftPhase();
    // await waitMode(scene, Mode.TITLE);
    // scene.shiftPhase();
    // const gameMode = GameModes.CLASSIC;
    // // scene.ui.setMode(Mode.MESSAGE);
    // scene.pushPhase(new SelectStarterPhase(scene, gameMode));
    // scene.newArena(scene.gameMode.getStartingBiome(scene));
    // scene.pushPhase(new EncounterPhase(scene, false));
    // scene.shiftPhase();
    // let phase = scene.getCurrentPhase();
    // const starters = generateStarter(scene);
    // phase.initBattle(starters);
    // scene.newBattle();
    // scene.arena.init();
    // scene.shiftPhase();
    // await scene.getCurrentPhase().doEncounter();
    // phase = scene.getCurrentPhase();
    // phase = scene.getCurrentPhase();
    // the issue is that there is a check in frames that are renderered and add phase according to that
    // so we need some logic in these frames
  //   const spy = vi.fn();
  //   await waitFirstInPhaseQueueIs(scene, EnemyCommandPhase).then(result => {
  //     expect(result).toBe(true);
  //     phase = scene.getCurrentPhase();
  //     expect(phase).not.toBeInstanceOf(LoginPhase);
  //     expect(phase).toBeInstanceOf(CommandPhase);
  //     spy(); // Call the spy function
  //   });
  //   expect(spy).toHaveBeenCalled();
  }, 10000);
});

