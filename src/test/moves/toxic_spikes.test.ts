import { CommandPhase } from "#app/phases/command-phase";
import GameManager from "#test/utils/gameManager";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {StatusEffect} from "#app/data/status-effect";
import {ArenaTagType} from "#enums/arena-tag-type";
import {ArenaTrapTag} from "#app/data/arena-tag";
import {decrypt, encrypt, GameData, SessionSaveData} from "#app/system/game-data";



// I am frankly, not that comfortable with the testing system, these could prob be more precise
describe("Moves - Toxic Spikes", () => {
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
    game.scene.battleStyle = 1;
    game.override.battleType("single");
    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyAbility(Abilities.HYDRATION);
    game.override.enemyPassiveAbility(Abilities.HYDRATION);
    game.override.ability(Abilities.NO_GUARD);
    game.override.passiveAbility(Abilities.HUGE_POWER);
    game.override.startingWave(3);
    game.override.enemyMoveset([Moves.SPLASH,Moves.SPLASH,Moves.SPLASH,Moves.SPLASH]);
    game.override.moveset([Moves.TOXIC_SPIKES,Moves.SPLASH, Moves.ROAR, Moves.GLACIAL_LANCE]);
  });

  it("no switches, no effect", async() => {
    game.override.enemySpecies(Species.RATTATA);
    // player set toxic spikes on the field and do splash for 3 turns
    // opponent do splash for 4 turns
    // nobody should take damage
    await game.classicMode.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    await game.phaseInterceptor.to(CommandPhase, true);
    const initialHp = game.scene.getEnemyParty()[0].hp;
    expect(game.scene.getEnemyParty()[0].hp).toBe(initialHp);
    game.doAttack(0);
    await game.toNextTurn();
    game.doAttack(1);
    await game.toNextTurn();
    game.doAttack(1);
    await game.toNextTurn();
    game.doAttack(1);
    await game.toNextTurn();
    game.doAttack(1);
    await game.toNextTurn();
    // Opponent should be full health and not statused
    expect(game.scene.getEnemyParty()[0].hp).toBe(initialHp);
    expect(!(game.scene.getEnemyParty()[0].status?.effect));
    console.log(game.textInterceptor.logs);
  }, 20000);

  it("user switch, no effect", async() => {
    game.override.enemySpecies(Species.RATTATA);
    // player set toxic spikes on the field and switch back to back
    // opponent do splash for 2 turns
    // nobody should be poisoned or damaged
    await game.classicMode.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    await game.phaseInterceptor.to(CommandPhase, false);

    const initialHp = game.scene.getParty()[0].hp;
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.run(CommandPhase);
    await game.phaseInterceptor.to(CommandPhase, false);

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.run(CommandPhase);
    await game.phaseInterceptor.to(CommandPhase, false);

    expect(game.scene.getParty()[0].hp).toBe(initialHp);
    expect(!(game.scene.getEnemyParty()[0].status?.effect));
  }, 20000);

  it("force enemy switch - poisoned", async() => {
    game.override.startingWave(5);
    game.override.enemySpecies(Species.RATTATA);
    // player sets 1 layer of toxic spikes
    // then forces a switch with roar
    // opponent should be damaged and poisoned at end of next turn
    await game.classicMode.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    await game.phaseInterceptor.to(CommandPhase, true);
    game.doAttack(0);
    await game.toNextTurn();
    game.doAttack(2);
    await game.toNextTurn();
    const opponent = game.scene.currentBattle.enemyParty[0];
    expect(opponent.hp).toBeLessThan(opponent.getMaxHp());
    expect(game.scene.currentBattle.enemyParty[0].status?.effect).toBe(StatusEffect.POISON);
  }, 20000);

  it("force enemy switch - toxic", async() => {
    game.override.startingWave(5);
    game.override.enemySpecies(Species.RATTATA);
    // player sets 1 layer of toxic spikes
    // then forces a switch with roar
    // opponent should be damaged and poisoned at end of next turn
    await game.classicMode.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    await game.phaseInterceptor.to(CommandPhase, true);
    game.doAttack(0);
    await game.toNextTurn();
    game.doAttack(0);
    await game.toNextTurn();
    game.doAttack(2);
    await game.toNextTurn();
    const opponent = game.scene.currentBattle.enemyParty[0];
    expect(opponent.hp).toBeLessThan(opponent.getMaxHp());
    expect(game.scene.currentBattle.enemyParty[0].status?.effect).toBe(StatusEffect.TOXIC);
  }, 20000);

  it("enemy switch - poison", async() => {
    game.override.startingWave(5);
    game.override.startingLevel(5000);
    game.override.enemySpecies(Species.RATTATA);
    // turn 1: player set toxic spikes, opponent do splash
    // turn 2: player do splash, opponent switch pokemon
    // opponent pokemon should trigger spikes and get poisoned
    await game.classicMode.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    await game.phaseInterceptor.to(CommandPhase, true);

    game.doAttack(0);
    await game.toNextTurn();

    game.forceOpponentToSwitch();
    game.doAttack(1);
    await game.toNextTurn();
    const opponent = game.scene.currentBattle.enemyParty[0];
    expect(opponent.hp).toBeLessThan(opponent.getMaxHp());
    expect(opponent.status?.effect).toBe(StatusEffect.POISON);
  }, 20000);

  it("enemy switch - toxic", async() => {
    game.override.startingWave(5);
    game.override.startingLevel(5000);
    game.override.enemySpecies(Species.RATTATA);
    // turn 1: player set toxic spikes, opponent do splash
    // turn 2: player do splash, opponent switch pokemon
    // opponent pokemon should trigger spikes and get poisoned
    await game.classicMode.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    await game.phaseInterceptor.to(CommandPhase, true);

    game.doAttack(0);
    await game.toNextTurn();

    game.doAttack(0);
    await game.toNextTurn();

    game.forceOpponentToSwitch();
    game.doAttack(1);
    await game.toNextTurn();
    const opponent = game.scene.currentBattle.enemyParty[0];
    expect(opponent.hp).toBeLessThan(opponent.getMaxHp());
    expect(opponent.status?.effect).toBe(StatusEffect.TOXIC);
  }, 20000);

  it("grounded poison switch - absorb ", async() => {
    game.override.startingWave(5);
    game.override.startingLevel(5000);
    game.override.enemySpecies(Species.GRIMER);
    // turn 1: player set toxic spikes, opponent do splash
    // turn 2: player do splash, opponent switch pokemon
    // opponent pokemon should trigger spikes and get poisoned
    await game.classicMode.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    await game.phaseInterceptor.to(CommandPhase, true);

    game.doAttack(0);
    await game.toNextTurn();

    game.doAttack(0);
    await game.toNextTurn();

    game.forceOpponentToSwitch();
    game.doAttack(1);
    await game.toNextTurn();
    const opponent = game.scene.currentBattle.enemyParty[0];

    // Enemy pokemon should be undamaged, and not poisoned
    expect(opponent.hp).toBe(opponent.getMaxHp());
    expect(!opponent.status?.effect);

    // There should be no Arena Tags, as the Toxic Spikes have been absorbed
    expect(game.scene.arena.tags.length === 0);
  }, 20000);

  it("doubles - one stack per use ", async() => {
    game.override.startingWave(5);
    game.override.startingLevel(5000);
    game.override.enemySpecies(Species.GRIMER);
    game.override.battleType("double");
    // turn 1: player set toxic spikes, verify one layer down
    // turn 2: player set toxic spikes, verify two layers down
    // turn 3: player do splash, opponent switch pokemon
    // incoming grimer should absorb all layers
    await game.classicMode.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    await game.phaseInterceptor.to(CommandPhase, true);
    game.doAttack(0);

    await game.phaseInterceptor.to(CommandPhase, true);
    game.doAttack(1);

    await game.toNextTurn();

    expect(game.scene.arena.tags[0].tagType).toBe(ArenaTagType.TOXIC_SPIKES);
    expect(game.scene.arena.tags[0] instanceof ArenaTrapTag);
    expect((game.scene.arena.tags[0] as ArenaTrapTag).layers).toBe(1);

    game.doAttack(0);
    await game.phaseInterceptor.to(CommandPhase, true);
    game.doAttack(1);
    await game.toNextTurn();
    expect(game.scene.arena.tags[0].tagType).toBe(ArenaTagType.TOXIC_SPIKES);
    expect(game.scene.arena.tags[0] instanceof ArenaTrapTag);
    expect((game.scene.arena.tags[0] as ArenaTrapTag).layers).toBe(2);

    game.forceOpponentToSwitch();
    game.doAttack(1);
    await game.toNextTurn();

    // There should ben o Arena Tags, as the Toxic Spikes have been absorbed
    expect(game.scene.arena.tags.length === 0);
  }, 20000);

  it("persist through reload", async() => {
    game.override.startingWave(5);
    game.override.startingLevel(5000);
    game.override.enemySpecies(Species.RATTATA);
    const scene = game.scene;
    const gameData = new GameData(scene);


    // turn 1: player set toxic spikes, opponent do splash
    // export, save, and then load session Data
    // tags should not change through reload.
    await game.classicMode.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    await game.phaseInterceptor.to(CommandPhase, true);

    game.doAttack(0);
    await game.toNextTurn();

    const sessionData : SessionSaveData = gameData["getSessionSaveData"](game.scene);
    localStorage.setItem("sessionTestData", encrypt(JSON.stringify(sessionData), true));
    const recoveredData : SessionSaveData = gameData.parseSessionData(decrypt(localStorage.getItem("sessionTestData")!, true));
    gameData.loadSession(game.scene,0,recoveredData);


    expect(sessionData.arena.tags).toEqual(recoveredData.arena.tags);
    localStorage.removeItem("sessionTestData");
  }, 20000);



});
