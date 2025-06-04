import { BattlerIndex } from "#app/battle";
import type Pokemon from "#app/field/pokemon";
import { MoveResult } from "#app/field/pokemon";
import type { MovePhase } from "#app/phases/move-phase";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Instruct", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  function instructSuccess(target: Pokemon, move: MoveId): void {
    expect(target.getLastXMoves(-1)[0].move).toBe(move);
    expect(target.getLastXMoves(-1)[1].move).toBe(target.getLastXMoves()[0].move);
    expect(target.getMoveset().find(m => m?.moveId === move)?.ppUsed).toBe(2);
  }

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
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.NO_GUARD)
      .enemyLevel(100)
      .startingLevel(100)
      .disableCrits();
  });

  it("should repeat target's last used move", async () => {
    game.override.moveset(MoveId.INSTRUCT).enemyLevel(1000); // ensures shuckle no die
    await game.classicMode.startBattle([SpeciesId.AMOONGUSS]);

    const enemy = game.scene.getEnemyPokemon()!;
    game.move.changeMoveset(enemy, MoveId.SONIC_BOOM);

    game.move.select(MoveId.INSTRUCT);
    await game.move.selectEnemyMove(MoveId.SONIC_BOOM);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("MovePhase"); // enemy attacks us
    await game.phaseInterceptor.to("MovePhase", false); // instruct
    let currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(game.scene.getPlayerPokemon());
    await game.phaseInterceptor.to("MoveEndPhase");

    await game.phaseInterceptor.to("MovePhase", false); // enemy repeats move
    currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(enemy);
    expect(currentPhase.move.moveId).toBe(MoveId.SONIC_BOOM);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    instructSuccess(enemy, MoveId.SONIC_BOOM);
    expect(game.scene.getPlayerPokemon()?.getInverseHp()).toBe(40);
  });

  it("should repeat enemy's move through substitute", async () => {
    game.override.moveset([MoveId.INSTRUCT, MoveId.SPLASH]);
    await game.classicMode.startBattle([SpeciesId.AMOONGUSS]);

    const enemy = game.scene.getEnemyPokemon()!;
    game.move.changeMoveset(enemy, [MoveId.SONIC_BOOM, MoveId.SUBSTITUTE]);

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SUBSTITUTE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    game.move.select(MoveId.INSTRUCT);
    await game.move.selectEnemyMove(MoveId.SONIC_BOOM);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    instructSuccess(game.scene.getEnemyPokemon()!, MoveId.SONIC_BOOM);
    expect(game.scene.getPlayerPokemon()?.getInverseHp()).toBe(40);
  });

  it("should repeat ally's attack on enemy", async () => {
    game.override.battleStyle("double").enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.AMOONGUSS, SpeciesId.SHUCKLE]);

    const [amoonguss, shuckle] = game.scene.getPlayerField();
    game.move.changeMoveset(amoonguss, [MoveId.INSTRUCT, MoveId.SONIC_BOOM]);
    game.move.changeMoveset(shuckle, [MoveId.INSTRUCT, MoveId.SONIC_BOOM]);

    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.select(MoveId.SONIC_BOOM, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    instructSuccess(shuckle, MoveId.SONIC_BOOM);
    expect(game.scene.getEnemyField()[0].getInverseHp()).toBe(40);
  });

  // TODO: Enable test case once gigaton hammer (and blood moon) are reworked
  it.todo("should repeat enemy's Gigaton Hammer", async () => {
    game.override.moveset(MoveId.INSTRUCT).enemyLevel(5);
    await game.classicMode.startBattle([SpeciesId.AMOONGUSS]);

    const enemy = game.scene.getEnemyPokemon()!;
    game.move.changeMoveset(enemy, [MoveId.GIGATON_HAMMER, MoveId.BLOOD_MOON]);

    game.move.select(MoveId.INSTRUCT);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    instructSuccess(enemy, MoveId.GIGATON_HAMMER);
    expect(game.scene.getPlayerPokemon()!.turnData.attacksReceived.length).toBe(2);
  });

  it("should add moves to move queue for copycat", async () => {
    game.override.battleStyle("double").moveset(MoveId.INSTRUCT).enemyLevel(5);
    await game.classicMode.startBattle([SpeciesId.AMOONGUSS]);

    const [enemy1, enemy2] = game.scene.getEnemyField()!;
    game.move.changeMoveset(enemy1, MoveId.WATER_GUN);
    game.move.changeMoveset(enemy2, MoveId.COPYCAT);

    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("BerryPhase");

    instructSuccess(enemy1, MoveId.WATER_GUN);
    // amoonguss gets hit by water gun thrice; once by original attack, once by instructed use and once by copycat
    expect(game.scene.getPlayerPokemon()!.turnData.attacksReceived.length).toBe(3);
  });

  it("should respect enemy's status condition", async () => {
    game.override.moveset([MoveId.INSTRUCT, MoveId.THUNDER_WAVE]).enemyMoveset(MoveId.SONIC_BOOM);
    await game.classicMode.startBattle([SpeciesId.AMOONGUSS]);

    game.move.select(MoveId.THUNDER_WAVE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    game.move.select(MoveId.INSTRUCT);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MovePhase");
    // force enemy's instructed move to bork and then immediately thaw out
    await game.move.forceStatusActivation(true);
    await game.move.forceStatusActivation(false);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    const moveHistory = game.scene.getEnemyPokemon()?.getLastXMoves(-1)!;
    expect(moveHistory.map(m => m.move)).toEqual([MoveId.SONIC_BOOM, MoveId.NONE, MoveId.SONIC_BOOM]);
    expect(game.scene.getPlayerPokemon()?.getInverseHp()).toBe(40);
  });

  it("should not repeat enemy's out of pp move", async () => {
    game.override.moveset(MoveId.INSTRUCT).enemySpecies(SpeciesId.UNOWN);
    await game.classicMode.startBattle([SpeciesId.AMOONGUSS]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    game.move.changeMoveset(enemyPokemon, MoveId.HIDDEN_POWER);
    const moveUsed = enemyPokemon.moveset.find(m => m?.moveId === MoveId.HIDDEN_POWER)!;
    moveUsed.ppUsed = moveUsed.getMovePp() - 1;

    game.move.select(MoveId.INSTRUCT);
    await game.move.selectEnemyMove(MoveId.HIDDEN_POWER);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    const playerMoves = game.scene.getPlayerPokemon()!.getLastXMoves(-1)!;
    expect(playerMoves[0].result).toBe(MoveResult.FAIL);
    expect(enemyPokemon.getMoveHistory().length).toBe(1);
  });

  it("should redirect attacking moves if enemy faints", async () => {
    game.override.battleStyle("double").enemyMoveset(MoveId.SPLASH).enemySpecies(SpeciesId.MAGIKARP).enemyLevel(1);
    await game.classicMode.startBattle([SpeciesId.HISUI_ELECTRODE, SpeciesId.KOMMO_O]);

    const [electrode, kommo_o] = game.scene.getPlayerField()!;
    game.move.changeMoveset(electrode, MoveId.CHLOROBLAST);
    game.move.changeMoveset(kommo_o, MoveId.INSTRUCT);

    game.move.select(MoveId.CHLOROBLAST, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("BerryPhase");

    // Chloroblast always deals 50% max HP% recoil UNLESS you whiff
    // due to lack of targets or similar,
    // so all we have to do is check whether electrode fainted or not.
    // Naturally, both karps should also be dead as well.
    expect(electrode.isFainted()).toBe(true);
    const [karp1, karp2] = game.scene.getEnemyField()!;
    expect(karp1.isFainted()).toBe(true);
    expect(karp2.isFainted()).toBe(true);
  });
  it("should allow for dancer copying of instructed dance move", async () => {
    game.override.battleStyle("double").enemyMoveset([MoveId.INSTRUCT, MoveId.SPLASH]).enemyLevel(1000);
    await game.classicMode.startBattle([SpeciesId.ORICORIO, SpeciesId.VOLCARONA]);

    const [oricorio, volcarona] = game.scene.getPlayerField();
    game.move.changeMoveset(oricorio, MoveId.SPLASH);
    game.move.changeMoveset(volcarona, MoveId.FIERY_DANCE);

    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.select(MoveId.FIERY_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.move.selectEnemyMove(MoveId.INSTRUCT, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("BerryPhase");

    // fiery dance triggered dancer successfully for a total of 4 hits
    // Enemy level is set to a high value so that it does not faint even after all 4 hits
    instructSuccess(volcarona, MoveId.FIERY_DANCE);
    expect(game.scene.getEnemyField()[0].turnData.attacksReceived.length).toBe(4);
  });

  it("should not repeat move when switching out", async () => {
    game.override.enemyMoveset(MoveId.INSTRUCT).enemySpecies(SpeciesId.UNOWN);
    await game.classicMode.startBattle([SpeciesId.AMOONGUSS, SpeciesId.TOXICROAK]);

    const amoonguss = game.scene.getPlayerPokemon()!;
    game.move.changeMoveset(amoonguss, MoveId.SEED_BOMB);

    amoonguss.summonData.moveHistory = [
      {
        move: MoveId.SEED_BOMB,
        targets: [BattlerIndex.ENEMY],
        result: MoveResult.SUCCESS,
      },
    ];

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    const enemyMoves = game.scene.getEnemyPokemon()!.getLastXMoves(-1)!;
    expect(enemyMoves[0].result).toBe(MoveResult.FAIL);
  });

  it("should fail if no move has yet been used by target", async () => {
    game.override.moveset(MoveId.INSTRUCT).enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.AMOONGUSS]);

    game.move.select(MoveId.INSTRUCT);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(game.scene.getPlayerPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should attempt to call enemy's disabled move, but move use itself should fail", async () => {
    game.override.moveset([MoveId.INSTRUCT, MoveId.DISABLE]).battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.AMOONGUSS, SpeciesId.DROWZEE]);

    const [enemy1, enemy2] = game.scene.getEnemyField();
    game.move.changeMoveset(enemy1, MoveId.SONIC_BOOM);
    game.move.changeMoveset(enemy2, MoveId.SPLASH);

    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(MoveId.DISABLE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.move.selectEnemyMove(MoveId.SONIC_BOOM, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(game.scene.getPlayerField()[0].getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    const enemyMove = game.scene.getEnemyField()[0]!.getLastXMoves()[0];
    expect(enemyMove.result).toBe(MoveResult.FAIL);
    expect(
      game.scene
        .getEnemyField()[0]
        .getMoveset()
        .find(m => m?.moveId === MoveId.SONIC_BOOM)?.ppUsed,
    ).toBe(1);
  });

  it("should not repeat enemy's move through protect", async () => {
    game.override.moveset([MoveId.INSTRUCT]);
    await game.classicMode.startBattle([SpeciesId.AMOONGUSS]);

    const enemy = game.scene.getEnemyPokemon()!;
    game.move.changeMoveset(enemy, MoveId.PROTECT);
    game.move.select(MoveId.INSTRUCT);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(enemy.getLastXMoves(-1)[0].move).toBe(MoveId.PROTECT);
    expect(enemy.getLastXMoves(-1)[1]).toBeUndefined(); // undefined because instruct failed and didn't repeat
    expect(enemy.getMoveset().find(m => m?.moveId === MoveId.PROTECT)?.ppUsed).toBe(1);
  });

  it("should not repeat enemy's charging move", async () => {
    game.override.moveset([MoveId.INSTRUCT]).enemyMoveset([MoveId.SONIC_BOOM, MoveId.HYPER_BEAM]);
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.summonData.moveHistory = [
      {
        move: MoveId.SONIC_BOOM,
        targets: [BattlerIndex.PLAYER],
        result: MoveResult.SUCCESS,
        virtual: false,
      },
    ];

    game.move.select(MoveId.INSTRUCT);
    await game.move.selectEnemyMove(MoveId.HYPER_BEAM);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    // instruct fails at copying last move due to charging turn (rather than instructing sonic boom)
    expect(player.getLastXMoves()[0].result).toBe(MoveResult.FAIL);

    game.move.select(MoveId.INSTRUCT);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(player.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should not repeat move since forgotten by target", async () => {
    game.override.enemyMoveset(MoveId.INSTRUCT);
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    const regieleki = game.scene.getPlayerPokemon()!;
    regieleki.pushMoveHistory({
      move: MoveId.ELECTRO_DRIFT,
      targets: [BattlerIndex.PLAYER],
      result: MoveResult.SUCCESS,
      virtual: false,
    });

    game.move.select(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();
    expect(game.field.getEnemyPokemon().getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should disregard priority of instructed move on use", async () => {
    game.override.enemyMoveset([MoveId.SPLASH, MoveId.WHIRLWIND]).moveset(MoveId.INSTRUCT);
    await game.classicMode.startBattle([SpeciesId.LUCARIO, SpeciesId.BANETTE]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    enemyPokemon.summonData.moveHistory = [
      {
        move: MoveId.WHIRLWIND,
        targets: [BattlerIndex.PLAYER],
        result: MoveResult.SUCCESS,
        virtual: false,
      },
    ];

    game.move.select(MoveId.INSTRUCT);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // lucario instructed enemy whirlwind at 0 priority to switch itself out
    const instructedMove = enemyPokemon.getLastXMoves(-1)[1];
    expect(instructedMove.result).toBe(MoveResult.SUCCESS);
    expect(instructedMove.move).toBe(MoveId.WHIRLWIND);
    expect(game.scene.getPlayerPokemon()?.species.speciesId).toBe(SpeciesId.BANETTE);
  });

  it("should respect moves' original priority for psychic terrain", async () => {
    game.override
      .battleStyle("double")
      .moveset([MoveId.QUICK_ATTACK, MoveId.SPLASH, MoveId.INSTRUCT])
      .enemyMoveset([MoveId.SPLASH, MoveId.PSYCHIC_TERRAIN]);
    await game.classicMode.startBattle([SpeciesId.BANETTE, SpeciesId.KLEFKI]);

    game.move.select(MoveId.QUICK_ATTACK, BattlerIndex.PLAYER, BattlerIndex.ENEMY); // succeeds due to terrain no
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.PSYCHIC_TERRAIN);
    await game.toNextTurn();

    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // quick attack failed when instructed
    const banette = game.scene.getPlayerPokemon()!;
    expect(banette.getLastXMoves(-1)[1].move).toBe(MoveId.QUICK_ATTACK);
    expect(banette.getLastXMoves(-1)[1].result).toBe(MoveResult.FAIL);
  });

  it("should still work w/ prankster in psychic terrain", async () => {
    game.override.battleStyle("double").enemyMoveset([MoveId.SPLASH, MoveId.PSYCHIC_TERRAIN]);
    await game.classicMode.startBattle([SpeciesId.BANETTE, SpeciesId.KLEFKI]);

    const [banette, klefki] = game.scene.getPlayerField()!;
    game.move.changeMoveset(banette, [MoveId.VINE_WHIP, MoveId.SPLASH]);
    game.move.changeMoveset(klefki, [MoveId.INSTRUCT, MoveId.SPLASH]);

    game.move.select(MoveId.VINE_WHIP, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.PSYCHIC_TERRAIN);
    await game.toNextTurn();

    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER); // copies vine whip
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("TurnEndPhase", false);
    expect(banette.getLastXMoves(-1)[1].move).toBe(MoveId.VINE_WHIP);
    expect(banette.getLastXMoves(-1)[2].move).toBe(MoveId.VINE_WHIP);
    expect(banette.getMoveset().find(m => m?.moveId === MoveId.VINE_WHIP)?.ppUsed).toBe(2);
  });

  it("should cause spread moves to correctly hit targets in doubles after singles", async () => {
    game.override
      .battleStyle("even-doubles")
      .moveset([MoveId.BREAKING_SWIPE, MoveId.INSTRUCT, MoveId.SPLASH])
      .enemyMoveset(MoveId.SONIC_BOOM)
      .enemySpecies(SpeciesId.AXEW)
      .startingLevel(500);
    await game.classicMode.startBattle([SpeciesId.KORAIDON, SpeciesId.KLEFKI]);

    const koraidon = game.scene.getPlayerField()[0]!;

    game.move.select(MoveId.BREAKING_SWIPE);
    await game.phaseInterceptor.to("TurnEndPhase", false);
    expect(koraidon.getInverseHp()).toBe(0);
    expect(koraidon.getLastXMoves(-1)[0].targets).toEqual([BattlerIndex.ENEMY]);
    await game.toNextWave();

    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("TurnEndPhase", false);
    // did not take damage since enemies died beforehand;
    // last move used hit both enemies
    expect(koraidon.getInverseHp()).toBe(0);
    expect(koraidon.getLastXMoves(-1)[1].targets?.sort()).toEqual([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
  });

  it("should cause AoE moves to correctly hit everyone in doubles after singles", async () => {
    game.override
      .battleStyle("even-doubles")
      .moveset([MoveId.BRUTAL_SWING, MoveId.INSTRUCT, MoveId.SPLASH])
      .enemySpecies(SpeciesId.AXEW)
      .enemyMoveset(MoveId.SONIC_BOOM)
      .startingLevel(500);
    await game.classicMode.startBattle([SpeciesId.KORAIDON, SpeciesId.KLEFKI]);

    const koraidon = game.scene.getPlayerField()[0]!;

    game.move.select(MoveId.BRUTAL_SWING);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("TurnEndPhase", false);
    expect(koraidon.getInverseHp()).toBe(0);
    expect(koraidon.getLastXMoves(-1)[0].targets).toEqual([BattlerIndex.ENEMY]);
    await game.toNextWave();

    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("TurnEndPhase", false);
    // did not take damage since enemies died beforehand;
    // last move used hit everything around it
    expect(koraidon.getInverseHp()).toBe(0);
    expect(koraidon.getLastXMoves(-1)[1].targets?.sort()).toEqual([
      BattlerIndex.PLAYER_2,
      BattlerIndex.ENEMY,
      BattlerIndex.ENEMY_2,
    ]);
  });

  it("should cause multi-hit moves to hit the appropriate number of times in singles", async () => {
    game.override
      .enemyAbility(AbilityId.SKILL_LINK)
      .moveset([MoveId.SPLASH, MoveId.INSTRUCT])
      .enemyMoveset(MoveId.BULLET_SEED);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);

    const bulbasaur = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    game.move.select(MoveId.INSTRUCT);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(bulbasaur.turnData.attacksReceived.length).toBe(10);

    await game.toNextTurn();
    game.move.select(MoveId.INSTRUCT);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(bulbasaur.turnData.attacksReceived.length).toBe(10);
  });

  it("should cause multi-hit moves to hit the appropriate number of times in doubles", async () => {
    game.override
      .battleStyle("double")
      .enemyAbility(AbilityId.SKILL_LINK)
      .moveset([MoveId.SPLASH, MoveId.INSTRUCT])
      .enemyMoveset([MoveId.BULLET_SEED, MoveId.SPLASH])
      .enemyLevel(5);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.IVYSAUR]);

    const [, ivysaur] = game.scene.getPlayerField();

    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.BULLET_SEED, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.move.selectEnemyMove(MoveId.BULLET_SEED, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(ivysaur.turnData.attacksReceived.length).toBe(15);

    await game.toNextTurn();
    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.move.selectEnemyMove(MoveId.BULLET_SEED, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(ivysaur.turnData.attacksReceived.length).toBe(15);
  });
});
