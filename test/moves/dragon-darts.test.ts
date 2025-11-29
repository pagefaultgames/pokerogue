import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Dragon Darts", () => {
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
    game.override
      .moveset([MoveId.SPLASH, MoveId.DRAGON_DARTS, MoveId.FOLLOW_ME])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("double")
      .criticalHits(false)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should hit the same enemy twice in a single battle", async () => {
    game.override.battleStyle("single");

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.DRAGON_DARTS);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    for (let i = 0; i < 2; i++) {
      const enemyStartingHp = enemy.hp;
      await game.phaseInterceptor.to("MoveEffectPhase");
      expect(enemy.hp).toBeLessThan(enemyStartingHp);
    }

    expect(player.turnData.hitCount).toBe(2);
  });

  it("should hit both enemies in a double battle", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const player = game.scene.getPlayerField()[0];
    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.DRAGON_DARTS, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MoveEndPhase", false);

    enemyPokemon.forEach(p => expect(p.isFullHp()).toBeFalsy());
    expect(player.turnData.hitCount).toBe(2);
  });

  it("should hit the user's ally twice if targeted", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const [player1, player2] = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.DRAGON_DARTS, 0, BattlerIndex.PLAYER_2);
    game.move.select(MoveId.SPLASH, 1);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    for (let i = 0; i < 2; i++) {
      const allyStartingHp = player2.hp;
      await game.phaseInterceptor.to("MoveEffectPhase");
      expect(player2.hp).toBeLessThan(allyStartingHp);
    }

    expect(player1.isFullHp()).toBeTruthy();
    enemyPokemon.forEach(p => expect(p.isFullHp).toBeTruthy());
  });

  it("should hit an opponent twice if the other opponent is type immune", async () => {
    game.override.enemyMoveset([MoveId.DRAGON_DARTS, MoveId.SPLASH]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.CLEFFA]);

    const [magikarp, cleffa] = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.SPLASH, 0);
    game.move.select(MoveId.SPLASH, 1);

    await game.move.forceEnemyMove(MoveId.DRAGON_DARTS, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.SPLASH);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);

    for (let i = 0; i < 2; i++) {
      const magikarpStartingHp = magikarp.hp;
      await game.phaseInterceptor.to("MoveEffectPhase");
      expect(magikarp.hp).toBeLessThan(magikarpStartingHp);
    }

    expect(cleffa.isFullHp()).toBeTruthy();
    expect(enemyPokemon[0].turnData.hitCount).toBe(2);
  });

  it("should hit an enemy twice if the other enemy is protected", async () => {
    game.override.enemyMoveset([MoveId.PROTECT, MoveId.SPLASH]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const magikarp = game.scene.getPlayerField()[0];
    const enemy2 = game.scene.getEnemyField()[1];

    game.move.select(MoveId.DRAGON_DARTS, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);

    await game.move.forceEnemyMove(MoveId.PROTECT);
    await game.move.forceEnemyMove(MoveId.SPLASH);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    for (let i = 0; i < 2; i++) {
      const enemy2StartingHp = enemy2.hp;
      await game.phaseInterceptor.to("MoveEffectPhase");
      expect(enemy2.hp).toBeLessThan(enemy2StartingHp);
    }

    expect(magikarp.turnData.hitCount).toBe(2);
  });

  it("should hit an enemy twice if the other enemy is semi-invulnerable", async () => {
    game.override.enemyMoveset([MoveId.DIG, MoveId.SPLASH]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const magikarp = game.scene.getPlayerField()[0];
    const enemy2 = game.scene.getEnemyField()[1];

    game.move.select(MoveId.DRAGON_DARTS, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);

    await game.move.forceEnemyMove(MoveId.DIG, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.SPLASH);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2]);

    for (let i = 0; i < 2; i++) {
      const enemy2StartingHp = enemy2.hp;
      await game.phaseInterceptor.to("MoveEffectPhase");
      expect(enemy2.hp).toBeLessThan(enemy2StartingHp);
    }
    expect(magikarp.turnData.hitCount).toBe(2);
  });

  it("should hit Dondozo twice if its ally is a commanding Tatsugiri", async () => {
    game.override.enemyMoveset([MoveId.DRAGON_DARTS, MoveId.SPLASH]).ability(AbilityId.COMMANDER);
    vi.spyOn(game.scene, "triggerPokemonBattleAnim").mockReturnValue(true);

    await game.classicMode.startBattle([SpeciesId.TATSUGIRI, SpeciesId.DONDOZO]);

    const [tatsugiri, dondozo] = game.scene.getPlayerField();
    const enemy1 = game.scene.getEnemyField()[0];

    game.move.select(MoveId.SPLASH, 1);

    await game.move.forceEnemyMove(MoveId.DRAGON_DARTS, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.SPLASH);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2]);

    for (let i = 0; i < 2; i++) {
      const dondozoStartingHp = dondozo.hp;
      await game.phaseInterceptor.to("MoveEffectPhase");
      expect(dondozo.hp).toBeLessThan(dondozoStartingHp);
    }
    expect(tatsugiri.isFullHp()).toBeTruthy();
    expect(enemy1.turnData.hitCount).toBe(2);
  });

  it("should hit an enemy twice if the attack against the other enemy would miss", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const magikarp = game.scene.getPlayerField()[0];
    const [enemy1, enemy2] = game.scene.getEnemyField();

    game.move.select(MoveId.DRAGON_DARTS, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.move.forceMiss(true);

    for (let i = 0; i < 2; i++) {
      const enemy2StartingHp = enemy2.hp;
      await game.phaseInterceptor.to("MoveEffectPhase");
      expect(enemy2.hp).toBeLessThan(enemy2StartingHp);
    }
    expect(enemy1.isFullHp()).toBeTruthy();
    expect(magikarp.turnData.hitCount).toBe(2);
  });

  it("should not be protected against by Wide Guard", async () => {
    game.override.enemyMoveset([MoveId.WIDE_GUARD, MoveId.SPLASH]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const player = game.scene.getPlayerField()[0];
    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.DRAGON_DARTS, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);

    await game.move.forceEnemyMove(MoveId.WIDE_GUARD);
    await game.move.forceEnemyMove(MoveId.SPLASH);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("BerryPhase", false);

    enemyPokemon.forEach(p => expect(p.isFullHp()).toBeFalsy());
    expect(player.turnData.hitCount).toBe(2);
  });

  it("should not redirect if the original target has the Center of Attention status", async () => {
    game.override.enemyMoveset([MoveId.DRAGON_DARTS, MoveId.SPLASH]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.CLEFFA]);

    const playerPokemon = game.scene.getPlayerField();
    const enemy1 = game.scene.getEnemyField()[0];

    game.move.select(MoveId.SPLASH, 0);
    game.move.select(MoveId.FOLLOW_ME, 1);

    await game.move.forceEnemyMove(MoveId.DRAGON_DARTS, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.SPLASH);

    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("BerryPhase", false);

    playerPokemon.forEach(p => expect(p.isFullHp()).toBeTruthy());
    expect(enemy1.getLastXMoves()[0]?.result).toBe(MoveResult.MISS);
  });

  it("should not trigger ability effects when redirecting", async () => {
    game.override.enemyAbility(AbilityId.VOLT_ABSORB).moveset([MoveId.DRAGON_DARTS, MoveId.ELECTRIFY]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const enemyPokemon = game.scene.getEnemyField();
    enemyPokemon.forEach(p => (p.hp = 100));
    const enemyStartingHp = enemyPokemon.map(p => p.hp);

    game.move.select(MoveId.DRAGON_DARTS, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.ELECTRIFY, 1, BattlerIndex.PLAYER);

    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("BerryPhase", false);

    // Electrified Dragon Darts should have been redirected onto the second enemy, healing them
    expect(enemyPokemon[0].hp).toBe(enemyStartingHp[0]);
    expect(enemyPokemon[1].hp).toBeGreaterThan(enemyStartingHp[1]);
  });

  it("should strike the target's ally on the second hit when the target faints to the first", async () => {
    game.override.enemySpecies(SpeciesId.MAGIKARP).enemyLevel(1);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const player = game.scene.getPlayerField()[0];
    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.DRAGON_DARTS, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MoveEndPhase");

    enemyPokemon.forEach(p => expect(p.isFainted()).toBeTruthy());
    expect(player.turnData.hitCount).toBe(2);
  });

  // TODO: rework Pressure and implement this interaction
  it.todo("should deduct 1 extra PP for each targeted enemy with Pressure");

  // TODO: implement this interaction (good luck lol)
  it.todo("should respect immunity from Dark types when invoked by a Prankster-boosted Metronome");

  // TODO: fix this interaction (Wimp Out can only trigger from the second hit)
  it.todo("should activate a target's Wimp Out with only the first hit");
});
