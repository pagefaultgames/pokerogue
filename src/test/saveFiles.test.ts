/* eslint-disable */
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {PlayerGender} from "#app/system/game-data";
import {generateStarter, getMovePosition, waitUntil,} from "#app/test/essentials/utils";
import {Mode} from "#app/ui/ui";
import {GameModes} from "#app/game-mode";
import {Species} from "#app/data/enums/species";
import * as overrides from '../overrides';
import {Command} from "#app/ui/command-ui-handler";
import {
  BattleEndPhase,
  BerryPhase,
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
  TitlePhase, ToggleDoublePositionPhase,
  TurnEndPhase,
  TurnStartPhase,
  VictoryPhase,
} from "#app/phases";
import {Moves} from "#app/data/enums/moves";
import GameManager from "#app/test/essentials/gameManager";

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
//   //
//   // it('Start at title mode', () => {
//   //   const mode = scene.ui?.getMode();
//   //   expect(mode).toBe(Mode.TITLE);
//   // });
//   //
//   // it('test new Battle', async() => {
//   //   await game.newGame(scene, GameModes.CLASSIC);
//   //   let mode = scene.ui?.getMode();
//   //   expect(mode).toBe(Mode.COMMAND);
//   // })
//   //
//   // it('Override starter species', async() => {
//   //   vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
//   //   await game.newGame(scene, GameModes.CLASSIC);
//   //   let mode = scene.ui?.getMode();
//   //   expect(mode).toBe(Mode.COMMAND);
//   // });
//   //
//   // it('Override opponent species', async() => {
//   //   vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
//   //   await game.newGame(scene, GameModes.CLASSIC);
//   //   let mode = scene.ui?.getMode();
//   //   expect(mode).toBe(Mode.COMMAND);
//   // });
//   //
//   // it('Override both species', async() => {
//   //   vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
//   //   vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
//   //   await game.newGame(scene, GameModes.CLASSIC);
//   //   let mode = scene.ui?.getMode();
//   //   expect(mode).toBe(Mode.COMMAND);
//   // });
//
//   // it('Do an attack with faint', async() => {
//   //   vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
//   //   vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.RATTATA);
//   //   vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(42);
//   //   vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.AURA_SPHERE]);
//   //   await game.newGame(scene, GameModes.CLASSIC);
//   //   let mode = scene.ui?.getMode();
//   //   expect(mode).toBe(Mode.COMMAND);
//   //   //Try to do the first attack
//   //   scene.ui.setMode(Mode.FIGHT, (scene.getCurrentPhase() as CommandPhase).getFieldIndex());
//   //   await waitUntil(() => scene.ui.getMode() === Mode.FIGHT);
//   //   const movePosition = await game.getMovePosition(scene, 0, Moves.AURA_SPHERE);
//   //   (scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false)
//   //   await waitUntil(() => scene.ui?.getMode() === Mode.MODIFIER_SELECT);
//   //   mode = scene.ui?.getMode();
//   //   expect(mode).toBe(Mode.MODIFIER_SELECT);
//   // }, 10000);
//
//   // it('one-line - Do an attack with faint', async() => {
//   //   vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
//   //   vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.RATTATA);
//   //   vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(42);
//   //   vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.AURA_SPHERE]);
//   //   await game.newGame(scene, GameModes.CLASSIC);
//   //   await game.doAttack(Moves.AURA_SPHERE);
//   //   await waitUntil(() => scene.ui?.getMode() === Mode.MODIFIER_SELECT);
//   //   const mode = scene.ui?.getMode();
//   //   expect(mode).toBe(Mode.MODIFIER_SELECT);
//   // }, 10000);
//
//   // it('one-line export data to save', async() => {
//   //   vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
//   //   vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.PIKACHU);
//   //   vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(42);
//   //   vi.spyOn(overrides, 'STARTING_WAVE_OVERRIDE', 'get').mockReturnValue(30);
//   //   vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.AURA_SPHERE]);
//   //   await game.newGame(scene, GameModes.CLASSIC);
//   //   const data = await game.exportSaveToTest();
//   //   expect(data).not.toBeUndefined();
//   //   console.log(data);
//   // }, 10000);
//
//   // it('test wave override - 3 - regular', async() => {
//   //   vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
//   //   vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.RATTATA);
//   //   vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(42);
//   //   vi.spyOn(overrides, 'STARTING_WAVE_OVERRIDE', 'get').mockReturnValue(3);
//   //   vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.AURA_SPHERE]);
//   //   await game.newGame(scene, GameModes.CLASSIC);
//   //   expect(scene.currentBattle.waveIndex).toBe(3);
//   // }, 10000);
//   //
//   // it('test wave override - 5 - trainer', async() => {
//   //   vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
//   //   vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.RATTATA);
//   //   vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(42);
//   //   vi.spyOn(overrides, 'STARTING_WAVE_OVERRIDE', 'get').mockReturnValue(5);
//   //   vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.AURA_SPHERE]);
//   //   await game.newGame(scene, GameModes.CLASSIC);
//   //   expect(scene.currentBattle.waveIndex).toBe(5);
//   // }, 10000);
//
//   // it('test wave override - 8 - rival', async() => {
//   //   vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
//   //   vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.RATTATA);
//   //   vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(42);
//   //   vi.spyOn(overrides, 'STARTING_WAVE_OVERRIDE', 'get').mockReturnValue(8);
//   //   vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.AURA_SPHERE]);
//   //   await game.newGame(scene, GameModes.CLASSIC);
//   //   expect(scene.currentBattle.waveIndex).toBe(8);
//   // }, 10000);
//   //
//   // it('test wave override - 10 - boss', async() => {
//   //   vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
//   //   vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.RATTATA);
//   //   vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(42);
//   //   vi.spyOn(overrides, 'STARTING_WAVE_OVERRIDE', 'get').mockReturnValue(10);
//   //   vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.AURA_SPHERE]);
//   //   await game.newGame(scene, GameModes.CLASSIC);
//   //   expect(scene.currentBattle.waveIndex).toBe(10);
//   // }, 10000);
//   //
//   // it('test double-battle', async() => {
//   //   vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
//   //   vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(42);
//   //   vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.AURA_SPHERE]);
//   //   vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.RATTATA);
//   //   vi.spyOn(overrides, 'DOUBLE_BATTLE_OVERRIDE', 'get').mockReturnValue(true);
//   //   await game.newGame(scene, GameModes.CLASSIC);
//   //   expect(scene.currentBattle.double).toBe(true);
//   // }, 10000);
//
//   // it('test attack no OHKO', async() => {
//   //   vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
//   //   vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MAGIKARP);
//   //   vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(25);
//   //   vi.spyOn(overrides, 'STARTING_WAVE_OVERRIDE', 'get').mockReturnValue(49);
//   //   vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.TACKLE]);
//   //   await game.newGame(scene, GameModes.CLASSIC);
//   //   const opponentLife = scene.currentBattle.enemyParty[0].hp;
//   //   const playerLife = scene.party[0].hp;
//   //   await game.doAttack(Moves.TACKLE);
//   //   expect(scene.currentBattle.enemyParty[0].hp).not.toBe(opponentLife);
//   //   expect(scene.party[0].hp).not.toBe(playerLife);
//   // }, 10000);
//
//   // it('test attack no OHKO on double', async() => {
//   //   vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
//   //   vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MAGIKARP);
//   //   vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(25);
//   //   vi.spyOn(overrides, 'STARTING_WAVE_OVERRIDE', 'get').mockReturnValue(49);
//   //   vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.TACKLE]);
//   //   vi.spyOn(overrides, 'DOUBLE_BATTLE_OVERRIDE', 'get').mockReturnValue(true);
//   //   await game.newGame(scene, GameModes.CLASSIC);
//   //   const opponentLife = scene.currentBattle.enemyParty[0].hp;
//   //   const opponentLife2 = scene.currentBattle.enemyParty[1].hp;
//   //   await game.doAttackDouble(Moves.TACKLE, Moves.TACKLE);
//   //   expect(scene.currentBattle.enemyParty[0].hp).not.toBe(opponentLife);
//   //   expect(scene.currentBattle.enemyParty[1].hp).toBe(opponentLife2);
//   // }, 10000);
//
//   // it('test message mode wrapper', async() => {
//   //   vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
//   //   vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.RATTATA);
//   //   vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(200);
//   //   vi.spyOn(overrides, 'STARTING_WAVE_OVERRIDE', 'get').mockReturnValue(30);
//   //   vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.SAND_ATTACK]);
//   //   vi.spyOn(overrides, 'DOUBLE_BATTLE_OVERRIDE', 'get').mockReturnValue(true);
//   //   await game.newGame(scene, GameModes.CLASSIC);
//   //   expect(scene.ui.getMode()).toBe(Mode.COMMAND);
//   //   await game.doAttackDouble(Moves.SAND_ATTACK, Moves.SAND_ATTACK);
//   //   expect(scene.currentBattle.double).toBe(true);
//   // }, 10000);
//
//   // it('test phase interceptor', async() => {
//   //   expect(phaseInterceptor.log.length).toEqual(2);
//   // }, 10000);
// });


describe("Phase interceptor", () => {
  let game;

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager();
  })

  it.skip('test phase interceptor with remove', async() => {
      game = new GameManager();
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

  it.skip('test phase interceptor with prompt', async() => {
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

  it.skip('test phase interceptor with prompt with preparation for a future prompt', async() => {
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

  it.skip('newGame one-liner', async() => {
      await game.newGame(GameModes.CLASSIC);
      expect(game.scene.ui?.getMode()).toBe(Mode.COMMAND);
      expect(game.scene.getCurrentPhase().constructor.name).toBe(CommandPhase.name);
  }, 100000)

  it.skip('do attack wave 3 - regular', async() => {
      vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
      vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.RATTATA);
      vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(2000);
      vi.spyOn(overrides, 'STARTING_WAVE_OVERRIDE', 'get').mockReturnValue(3);
      vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.AURA_SPHERE]);
      await game.newGame(GameModes.CLASSIC);
      game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
        game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
      });
      game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
        const movePosition = getMovePosition(game.scene, 0, Moves.AURA_SPHERE);
        (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
      });
      await game.phaseInterceptor.run(EnemyCommandPhase);
      await game.phaseInterceptor.run(TurnStartPhase);
      await game.phaseInterceptor.run(MovePhase);
      await game.phaseInterceptor.run(MessagePhase);
      await game.phaseInterceptor.run(MoveEffectPhase);
      await game.phaseInterceptor.run(DamagePhase);
      await game.phaseInterceptor.run(MessagePhase);
      await game.phaseInterceptor.run(FaintPhase);
      await game.phaseInterceptor.run(MessagePhase);
      // almost, but from here, it's not yet working
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

    it('ok', async() => {
        vi.spyOn(overrides, 'STARTER_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.MEWTWO);
        vi.spyOn(overrides, 'OPP_SPECIES_OVERRIDE', 'get').mockReturnValue(Species.RATTATA);
        vi.spyOn(overrides, 'STARTING_LEVEL_OVERRIDE', 'get').mockReturnValue(2000);
        vi.spyOn(overrides, 'STARTING_WAVE_OVERRIDE', 'get').mockReturnValue(3);
        vi.spyOn(overrides, 'MOVESET_OVERRIDE', 'get').mockReturnValue([Moves.AURA_SPHERE]);
        vi.spyOn(overrides, 'DOUBLE_BATTLE_OVERRIDE', 'get').mockReturnValue(true);
        await game.phaseInterceptor.run(LoginPhase);
        game.onNextPrompt("SelectGenderPhase", Mode.OPTION_SELECT, () => {
          game.scene.gameData.gender = PlayerGender.MALE;
          game.endPhase();
        });
        await game.phaseInterceptor.run(SelectGenderPhase, () => game.isCurrentPhase(TitlePhase));
        await game.phaseInterceptor.run(TitlePhase);
        game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
          const starters = generateStarter(game.scene);
          const selectStarterPhase = new SelectStarterPhase(game.scene, GameModes.CLASSIC);
          game.scene.pushPhase(new EncounterPhase(game.scene, false));
          selectStarterPhase.initBattle(starters);
        });
        await game.phaseInterceptor.run(EncounterPhase);
        await game.phaseInterceptor.run(PostSummonPhase);
        // need to handle double fight !
        await game.phaseInterceptor.whenAboutToRun(ToggleDoublePositionPhase);
        expect(game.scene.getCurrentPhase().constructor.name).toBe(ToggleDoublePositionPhase.name);
    }, 50000);
});

