/* eslint-disable */
import {describe, it, vi, expect, beforeAll, beforeEach} from "vitest";
import fs from "fs";
import { AES, enc } from "crypto-js";
import {decrypt, encrypt, GameDataType, getDataTypeKey} from "#app/system/game-data";
import BattleScene from "#app/battle-scene.js";
import GameWrapper from "#app/test/essentials/gameWrapper";
import {
  blobToString,
  waitUntil,
} from "#app/test/essentials/utils";
import {loggedInUser} from "#app/account";
import {Mode} from "#app/ui/ui";
import infoHandler from "#app/test/essentials/fetchHandlers/infoHandler";
import {apiFetch} from "#app/utils";
import {GameModes} from "#app/game-mode";
import {Button} from "#app/enums/buttons";
import {Species} from "#app/data/enums/species";
import OptionSelectUiHandler from "#app/ui/option-select-ui-handler";
const saveKey = "x0i2O7WRiANTqPmZ";
import * as overrides from '../overrides';
import {Command} from "#app/ui/command-ui-handler";
import {
  CommandPhase,
} from "#app/phases";
import {Moves} from "#app/data/enums/moves";



describe("Session import/export", () => {
  let game, scene, sessionData;

  beforeEach(async () => {
    game = new GameWrapper();
    scene = new BattleScene();
    game.scene.add("battle", scene);
    await waitUntil(() => scene.ui?.getMode() === Mode.OPTION_SELECT);
    let handler = scene.ui.getHandler() as OptionSelectUiHandler;
    handler.processInput(Button.ACTION);
    await waitUntil(() => scene.ui?.getMode() === Mode.TITLE);
  }, 10000);

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

  it.skip('test apifetch mock async', async () => {
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

  it.skip('test fetch mock sync', async () => {
    const response = await fetch('https://localhost:8080/account/info');
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(data).toEqual(infoHandler);
  });

  it.skip('import session', () => {
    const cookiesStr = fs.readFileSync("./src/test/data/sessionData1_Greenlamp.cookies", {encoding: "utf8", flag: "r"});
    let dataStr = AES.decrypt(cookiesStr, saveKey).toString(enc.Utf8);
    sessionData = scene.gameData.parseSessionData(dataStr);
    const dataKey = `${getDataTypeKey(GameDataType.SESSION, 1)}_${loggedInUser.username}`;
    localStorage.setItem(dataKey, encrypt(dataStr, false));
  })

  it.skip('export session, check integrity of data', () => {
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

  it.skip('testing wait phase queue', async () => {
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

  it.skip('Start at title mode', () => {
    const mode = scene.ui?.getMode();
    expect(mode).toBe(Mode.TITLE);
  });

  it.skip('test new Battle', async() => {
    await game.newGame(scene, GameModes.CLASSIC);
    let mode = scene.ui?.getMode();
    expect(mode).toBe(Mode.COMMAND);
  }, 10000)

  it.skip('Override starter species', async() => {
    vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
    await game.newGame(scene, GameModes.CLASSIC);
    let mode = scene.ui?.getMode();
    expect(mode).toBe(Mode.COMMAND);
  }, 10000);

  it.skip('Override opponent species', async() => {
    vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
    await game.newGame(scene, GameModes.CLASSIC);
    let mode = scene.ui?.getMode();
    expect(mode).toBe(Mode.COMMAND);
  }, 10000);

  it.skip('Override both species', async() => {
    vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
    vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
    await game.newGame(scene, GameModes.CLASSIC);
    let mode = scene.ui?.getMode();
    expect(mode).toBe(Mode.COMMAND);
  }, 10000);

  it.skip('Do an attack with faint', async() => {
    vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
    vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.RATTATA);
    vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(42);
    vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.AURA_SPHERE]);
    await game.newGame(scene, GameModes.CLASSIC);
    let mode = scene.ui?.getMode();
    expect(mode).toBe(Mode.COMMAND);
    //Try to do the first attack
    scene.ui.setMode(Mode.FIGHT, (scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    await waitUntil(() => scene.ui.getMode() === Mode.FIGHT);
    const movePosition = await game.getMovePosition(scene, 0, Moves.AURA_SPHERE);
    (scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false)
    await waitUntil(() => scene.ui?.getMode() === Mode.MODIFIER_SELECT);
    mode = scene.ui?.getMode();
    expect(mode).toBe(Mode.MODIFIER_SELECT);
  }, 100000);

  it.skip('one-line - Do an attack with faint', async() => {
    vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
    vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.RATTATA);
    vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(42);
    vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.AURA_SPHERE]);
    await game.newGame(scene, GameModes.CLASSIC);
    await game.doAttack(Moves.AURA_SPHERE);
    await waitUntil(() => scene.ui?.getMode() === Mode.MODIFIER_SELECT);
    const mode = scene.ui?.getMode();
    expect(mode).toBe(Mode.MODIFIER_SELECT);
  }, 100000);

  it.skip('one-line export data to save', async() => {
    vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
    vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.PIKACHU);
    vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(42);
    vi.spyOn(overrides, 'STARTING_WAVE_OVERRIDE', 'get').mockReturnValue(30);
    vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.AURA_SPHERE]);
    await game.newGame(scene, GameModes.CLASSIC);
    const data = await game.exportSaveToTest();
    expect(data).not.toBeUndefined();
    console.log(data);
  }, 100000);

  it('test wave override', async() => {
    vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
    vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.PIKACHU);
    vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(42);
    vi.spyOn(overrides, 'STARTING_WAVE_OVERRIDE', 'get').mockReturnValue(30);
    vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.AURA_SPHERE]);
    await game.newGame(scene, GameModes.CLASSIC);
    expect(scene.currentBattle.waveIndex).toBe(30);
  }, 100000);

  // it('Override starter species', async() => {
  //   vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
  //   vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
  //   vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(42);
  //   await game.newGame(scene, GameModes.CLASSIC);
  //   // WE ARE IN BATTLE, WE CAN CHOOSE ATTACK, SWITCH, ITEM, RUN !!!
  //   await scene.gameData.saveAll(scene, true, true, true, true);
  //   scene.reset(true);
  //   await waitUntil(() => scene.ui?.getMode() === Mode.TITLE);
  //   await scene.gameData.tryExportData(GameDataType.SESSION, 0)
  // }, 50000);
});

