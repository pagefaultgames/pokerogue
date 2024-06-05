/* eslint-disable */
import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {GameDataType, PlayerGender} from "#app/system/game-data";
import {generateStarter, getMovePosition, waitUntil,} from "#app/test/utils/testUtils";
import {Mode} from "#app/ui/ui";
import {GameModes} from "#app/game-mode";
import {Species} from "#app/data/enums/species";
import * as overrides from '../overrides';
import {Command} from "#app/ui/command-ui-handler";
import {
  BattleEndPhase,
  BerryPhase,
  CheckSwitchPhase,
  CommandPhase,
  DamagePhase,
  EggLapsePhase,
  EncounterPhase,
  EnemyCommandPhase,
  FaintPhase,
  LoginPhase,
  MessagePhase,
  MoveEffectPhase,
  MoveEndPhase,
  MovePhase,
  PostSummonPhase,
  SelectGenderPhase,
  SelectModifierPhase,
  SelectStarterPhase,
  ShowAbilityPhase, StatChangePhase,
  SummonPhase,
  TitlePhase,
  ToggleDoublePositionPhase,
  TurnEndPhase,
  TurnInitPhase,
  TurnStartPhase,
  VictoryPhase,
} from "#app/phases";
import {Moves} from "#app/data/enums/moves";
import GameManager from "#app/test/utils/gameManager";
import fs from "fs";
import Phaser from "phaser";
import {allSpecies, speciesStarters, starterPassiveAbilities} from "#app/data/pokemon-species";
import {Abilities} from "#app/data/enums/abilities";

const saveKey = "x0i2O7WRiANTqPmZ";


// describe("Test helpers", () => {
//   let game, scene, sessionData, messages, phaseInterceptor;
//
//   beforeEach(async () => {
//     game = new GameWrapper();
//     scene = new BattleScene();
//   });
//
//   // it('test fetch mock async', async () => {
//   //   const spy = vi.fn();
//   //   await fetch('https://localhost:8080/account/info').then(response => {
//   //     expect(response.status).toBe(200);
//   //     expect(response.ok).toBe(true);
//   //     return response.json();
//   //   }).then(data => {
//   //     spy(); // Call the spy function
//   //     expect(data).toEqual(infoHandler);
//   //   });
//   //   expect(spy).toHaveBeenCalled();
//   // });
//   //
//   // it('test apifetch mock async', async () => {
//   //   const spy = vi.fn();
//   //   await apiFetch('https://localhost:8080/account/info').then(response => {
//   //     expect(response.status).toBe(200);
//   //     expect(response.ok).toBe(true);
//   //     return response.json();
//   //   }).then(data => {
//   //     spy(); // Call the spy function
//   //     expect(data).toEqual(infoHandler);
//   //   });
//   //   expect(spy).toHaveBeenCalled();
//   // });
//   //
//   // it('test fetch mock sync', async () => {
//   //   const response = await fetch('https://localhost:8080/account/info');
//   //   const data = await response.json();
//   //
//   //   expect(response.ok).toBe(true);
//   //   expect(response.status).toBe(200);
//   //   expect(data).toEqual(infoHandler);
//   // });
//   //
//   // it('test apifetch mock sync', async () => {
//   //   const data = await scene.cachedFetch(`./battle-anims/splishy-splash.json`);
//   //   expect(data).not.toBeUndefined();
//   // });
//
//   // it('import session', () => {
//   //   const cookiesStr = fs.readFileSync("./src/test/data/sessionData1_Greenlamp.cookies", {encoding: "utf8", flag: "r"});
//   //   let dataStr = AES.decrypt(cookiesStr, saveKey).toString(enc.Utf8);
//   //   sessionData = scene.gameData.parseSessionData(dataStr);
//   //   const dataKey = `${getDataTypeKey(GameDataType.SESSION, 1)}_${loggedInUser.username}`;
//   //   localStorage.setItem(dataKey, encrypt(dataStr, false));
//   // })
//   //
//   // it('export session, check integrity of data', () => {
//   //   const cookiesStr = fs.readFileSync("./src/test/data/sessionData1_Greenlamp.cookies", {encoding: "utf8", flag: "r"});
//   //   let dataStr = AES.decrypt(cookiesStr, saveKey).toString(enc.Utf8);
//   //   sessionData = scene.gameData.parseSessionData(dataStr);
//   //   const dataKey = `${getDataTypeKey(GameDataType.SESSION, 1)}_${loggedInUser.username}`;
//   //   localStorage.setItem(dataKey, encrypt(dataStr, false));
//   //
//   //   const slotId = 1;
//   //   const encryptedData = localStorage.getItem(`sessionData${slotId ? slotId : ""}_${loggedInUser.username}`);
//   //   const decryptedData = decrypt(encryptedData, false);
//   //   const reEncryptedData = AES.encrypt(decryptedData, saveKey);
//   //   const blob = new Blob([ reEncryptedData.toString() ], {type: "text/json"});
//   //   expect(blob.size).toBe(32128)
//   //   blobToString(blob).then(result => {
//   //     const decryptedData = decrypt(result as string, false);
//   //     expect(decryptedData).toBe(dataStr);
//   //   });
//   // })
//   //
//   // it('testing wait phase queue', async () => {
//   //   const fakeScene = {
//   //     phaseQueue: [1, 2, 3] // Initially not empty
//   //   };
//   //   setTimeout(() => {
//   //     fakeScene.phaseQueue = [];
//   //   }, 500);
//   //   const spy = vi.fn();
//   //   await waitUntil(() => fakeScene.phaseQueue.length === 0).then(result => {
//   //     expect(result).toBe(true);
//   //     spy(); // Call the spy function
//   //   });
//   //   expect(spy).toHaveBeenCalled();
//   // });


describe("Test Battle Phase", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
  })

  it('test phase interceptor with remove', async() => {
      await game.phaseInterceptor.run(LoginPhase);

      await game.phaseInterceptor.run(LoginPhase, () => {
        return game.phaseInterceptor.log.includes('LoginPhase');
      });

      game.scene.gameData.gender = PlayerGender.MALE;
      await game.phaseInterceptor.remove(SelectGenderPhase, () => game.isCurrentPhase(TitlePhase));

      await game.phaseInterceptor.run(TitlePhase);
      await waitUntil(() => game.scene.ui?.getMode() === Mode.TITLE);

      expect(game.scene.ui?.getMode()).toBe(Mode.TITLE);
  }, 100000);

  it('test phase interceptor with prompt', async() => {
      await game.phaseInterceptor.run(LoginPhase);

      game.onNextPrompt('SelectGenderPhase', Mode.OPTION_SELECT, () => {
          game.scene.gameData.gender = PlayerGender.MALE;
          game.endPhase();
      })

      await game.phaseInterceptor.run(SelectGenderPhase);

      await game.phaseInterceptor.run(TitlePhase);
      await game.waitMode(Mode.TITLE)


      expect(game.scene.ui?.getMode()).toBe(Mode.TITLE);
      expect(game.scene.gameData.gender).toBe(PlayerGender.MALE);
  }, 100000);

  it('test phase interceptor with prompt with preparation for a future prompt', async() => {
      await game.phaseInterceptor.run(LoginPhase);

      game.onNextPrompt('SelectGenderPhase', Mode.OPTION_SELECT, () => {
          game.scene.gameData.gender = PlayerGender.MALE;
          game.endPhase();
      })

      game.onNextPrompt('CheckSwitchPhase', Mode.CONFIRM, () => {
        game.setMode(Mode.MESSAGE);
        game.endPhase();
      })
      await game.phaseInterceptor.run(SelectGenderPhase);

      await game.phaseInterceptor.run(TitlePhase);
      await game.waitMode(Mode.TITLE)


      expect(game.scene.ui?.getMode()).toBe(Mode.TITLE);
      expect(game.scene.gameData.gender).toBe(PlayerGender.MALE);
  }, 100000);

  it('newGame one-liner', async() => {
      await game.startBattle();
      expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
      expect(game.scene.getCurrentPhase().constructor.name).toBe(CommandPhase.name);
  }, 100000)

  it('do attack wave 3 - single battle - regular - OHKO', async() => {
      vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
      vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.RATTATA);
      vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(2000);
      vi.spyOn(overrides, 'STARTING_WAVE_OVERRIDE', 'get').mockReturnValue(3);
      vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.TACKLE]);
      vi.spyOn(overrides, 'SINGLE_BATTLE_OVERRIDE', 'get').mockReturnValue(true);
      await game.startBattle();
      game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
        game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
      });
      game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
        const movePosition = getMovePosition(game.scene, 0, Moves.TACKLE);
        (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
      });
      await game.phaseInterceptor.run(EnemyCommandPhase);
      await game.phaseInterceptor.run(TurnStartPhase);

      await game.phaseInterceptor.run(MovePhase);
      await game.phaseInterceptor.run(MessagePhase);
      await game.phaseInterceptor.run(MoveEffectPhase);
      await game.phaseInterceptor.run(DamagePhase);
      await game.phaseInterceptor.run(MessagePhase, () => game.isCurrentPhase(FaintPhase));
      await game.phaseInterceptor.run(FaintPhase);
      await game.phaseInterceptor.run(MessagePhase);

      await game.phaseInterceptor.run(VictoryPhase);
      await game.phaseInterceptor.run(MoveEndPhase);
      await game.phaseInterceptor.run(MovePhase);
      await game.phaseInterceptor.run(BerryPhase);
      await game.phaseInterceptor.run(TurnEndPhase);
      await game.phaseInterceptor.run(BattleEndPhase);
      await game.phaseInterceptor.run(EggLapsePhase);
      await game.phaseInterceptor.run(SelectModifierPhase);
      expect(game.scene.ui?.getMode()).toBe(Mode.MODIFIER_SELECT);
      expect(game.scene.getCurrentPhase().constructor.name).toBe(SelectModifierPhase.name);
  }, 100000);

  it('do attack wave 3 - single battle - regular - NO OHKO with opponent using non damage attack', async() => {
      vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
      vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.RATTATA);
      vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(5);
      vi.spyOn(overrides, 'STARTING_WAVE_OVERRIDE', 'get').mockReturnValue(3);
      vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.TACKLE]);
      vi.spyOn(overrides, 'OPP_MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.TAIL_WHIP]);
      vi.spyOn(overrides, 'SINGLE_BATTLE_OVERRIDE', 'get').mockReturnValue(true);
      await game.startBattle();
      game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
        game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
      });
      game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
        const movePosition = getMovePosition(game.scene, 0, Moves.TACKLE);
        (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
      });
      await game.phaseInterceptor.run(EnemyCommandPhase);
      await game.phaseInterceptor.run(TurnStartPhase);

      await game.phaseInterceptor.run(MovePhase);
      await game.phaseInterceptor.run(MessagePhase);
      await game.phaseInterceptor.run(MoveEffectPhase);
      await game.phaseInterceptor.run(DamagePhase);
      await game.phaseInterceptor.run(MessagePhase, () => game.isCurrentPhase(MoveEndPhase));
      await game.phaseInterceptor.run(MoveEndPhase);

      await game.phaseInterceptor.run(MovePhase);
      await game.phaseInterceptor.run(MessagePhase, () => game.isCurrentPhase(MoveEffectPhase));
      await game.phaseInterceptor.run(MoveEffectPhase);
      game.scene.moveAnimations = null; // Mandatory to avoid the crash
      await game.phaseInterceptor.run(StatChangePhase, () => game.isCurrentPhase(MessagePhase) || game.isCurrentPhase(MoveEndPhase) || game.isCurrentPhase(DamagePhase));
      await game.phaseInterceptor.run(DamagePhase, () => game.isCurrentPhase(MessagePhase) || game.isCurrentPhase(MoveEndPhase));
      await game.phaseInterceptor.run(MessagePhase, () => game.isCurrentPhase(MoveEndPhase));
      await game.phaseInterceptor.run(MoveEndPhase);

      await game.phaseInterceptor.run(BerryPhase);
      await game.phaseInterceptor.run(MessagePhase, () => game.isCurrentPhase(TurnEndPhase));
      await game.phaseInterceptor.run(TurnEndPhase);

      await game.phaseInterceptor.run(TurnInitPhase);
      await game.phaseInterceptor.run(CommandPhase);
      await waitUntil(() => game.scene.ui?.getMode() === Mode.COMMAND);
      expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
      expect(game.scene.getCurrentPhase().constructor.name).toBe(CommandPhase.name);
  }, 100000);

  it('load 100% data file', async() => {
      await game.importData('src/test/utils/saves/everything.prsv');
      const caughtCount = Object.keys(game.scene.gameData.dexData).filter((key) => {
        const species = game.scene.gameData.dexData[key];
        return species.caughtAttr !== 0n;
      }).length
      expect(caughtCount).toBe(Object.keys(allSpecies).length);
  }, 50000);

  it('start battle with selected team', async() => {
      await game.startBattle([
        Species.CHARIZARD,
        Species.CHANSEY,
        Species.MEW
      ]);
      expect(game.scene.getParty()[0].species.speciesId).toBe(Species.CHARIZARD);
      expect(game.scene.getParty()[1].species.speciesId).toBe(Species.CHANSEY);
      expect(game.scene.getParty()[2].species.speciesId).toBe(Species.MEW);
  }, 50000);

  it('assert next phase', async() => {
      await game.phaseInterceptor.run(LoginPhase);
      game.onNextPrompt("SelectGenderPhase", Mode.OPTION_SELECT, () => {
        game.scene.gameData.gender = PlayerGender.MALE;
        game.endPhase();
      }, () => game.isCurrentPhase(TitlePhase));
      await game.phaseInterceptor.mustRun(SelectGenderPhase).catch((error) => expect(error).toBe(SelectGenderPhase));
      await game.phaseInterceptor.mustRun(TitlePhase).catch((error) => expect(error).toBe(TitlePhase));
      game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
        const starters = generateStarter(game.scene);
        const selectStarterPhase = new SelectStarterPhase(game.scene, GameModes.CLASSIC);
        game.scene.pushPhase(new EncounterPhase(game.scene, false));
        selectStarterPhase.initBattle(starters);
      });
      await game.phaseInterceptor.mustRun(EncounterPhase).catch((error) => expect(error).toBe(EncounterPhase));
      await game.phaseInterceptor.mustRun(PostSummonPhase).catch((error) => expect(error).toBe(PostSummonPhase));
  }, 50000);

  it("test remove random battle seed int", async() => {
    for (const i in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      const rand = game.scene.randBattleSeedInt(15);
      expect(rand).toBe(14);
    }
  });
});

