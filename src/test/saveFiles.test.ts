/* eslint-disable */
import {describe} from "vitest";
import fs from "fs";
import parseSessionData from "#app/system/misc/parseSessionData";
import {GameData, GameDataType} from "#app/system/game-data";
import BattleScene from "#app/battle-scene.js";
import GameWrapper from "#app/test/wrappers/gameWrapper";
import {LoginPhase} from "#app/phases";


describe("Check integrity of save files", () => {
  const game = new GameWrapper();
  const scene = new BattleScene();
  game.scene.add("battle-scene", scene);

  const mode = scene.ui.getMode();

  const gameData= new GameData(scene);
  const loginPhase = new LoginPhase(scene);
  loginPhase.start();
  scene.gameData.importData(GameDataType.SESSION, 0);
  const sessionDataStr = fs.readFileSync("./src/test/data/sessionData.json", {encoding: "utf8", flag: "r"});
  const sessionData = parseSessionData(sessionDataStr);
  const test = gameData.loadSession(scene, 0, sessionData);
});
