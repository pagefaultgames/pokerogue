import { BattlerIndex } from "#app/battle";
import type Pokemon from "#app/field/pokemon";
import { MoveResult } from "#app/field/pokemon";
import { MovePhase } from "#app/phases/move-phase";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveUseType } from "#enums/move-use-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Dancer", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  /**
   * Check that the specified {@linkcode Pokemon} is using the specified move
   * in the current {@linkcode MovePhase} against the specified targets.
   */
  function checkCurrentMoveUser(
    pokemon: Pokemon | undefined,
    move: Moves,
    targets?: BattlerIndex[],
    useType: MoveUseType = MoveUseType.INDIRECT,
  ) {
    const currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase).not.toBeNull();
    expect(currentPhase).toBeInstanceOf(MovePhase);
    expect.soft(currentPhase.pokemon).toBe(pokemon);
    expect.soft(currentPhase.move.moveId).toBe(move);
    if (targets) {
      expect.soft(currentPhase.targets).toHaveLength(targets.length);
      expect.soft(currentPhase.targets).toEqual(expect.arrayContaining(targets));
    }
    // ENABLE ONCE RULE TURNS ON // biome-ignore lint/complexity/useLiteralKeys: Needed to check protected class property
    expect.soft(currentPhase["useType"]).toBe(useType);
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
      .disableCrits()
      .ability(Abilities.DANCER)
      .enemySpecies(Species.SHUCKLE)
      .enemyLevel(100)
      .startingLevel(100);
  });

  // Reference Link: https://bulbapedia.bulbagarden.net/wiki/Dancer_(Ability).

  it("should copy dance moves without consuming extra PP", async () => {
    game.override.enemyAbility(Abilities.DANCER);
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    expect(oricorio).toBeDefined();
    const shuckle = game.scene.getEnemyPokemon()!;
    expect(shuckle).toBeDefined();

    game.move.changeMoveset(oricorio, [Moves.VICTORY_DANCE, Moves.SWORDS_DANCE]);
    game.move.changeMoveset(shuckle, [Moves.VICTORY_DANCE, Moves.SWORDS_DANCE]);

    game.move.select(Moves.SWORDS_DANCE);
    await game.forceEnemyMove(Moves.VICTORY_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase");

    // shpuldn't use PP if copied move is also in moveset
    expect(oricorio.moveset.map(m => m.ppUsed)).toEqual([0, 1]);
    expect(shuckle.moveset.map(m => m.ppUsed)).toEqual([1, 0]);

    // effects were applied correctly
    expect(oricorio.getStatStage(Stat.ATK)).toBe(3);
    expect(shuckle.getStatStage(Stat.ATK)).toBe(3);

    // moves showed up in history
    expect(oricorio.getLastXMoves(-1)).toHaveLength(2);
    expect(oricorio.getLastXMoves(-1)).toEqual([
      expect.objectContaining({ move: Moves.VICTORY_DANCE, useType: MoveUseType.INDIRECT }),
      expect.objectContaining({ move: Moves.SWORDS_DANCE, useType: MoveUseType.NORMAL }),
    ]);
    expect(shuckle.getLastXMoves(-1)).toHaveLength(2);
    expect(shuckle.getLastXMoves(-1)).toEqual([
      expect.objectContaining({ move: Moves.VICTORY_DANCE, useType: MoveUseType.NORMAL }),
      expect.objectContaining({ move: Moves.SWORDS_DANCE, useType: MoveUseType.INDIRECT }),
    ]);
  });

  // TODO: Enable once abilities start proccing in speed order
  it.todo("should target correctly & respect speed order during doubles", async () => {
    game.override
      .battleStyle("double")
      .enemyAbility(Abilities.DANCER)
      .moveset([Moves.REVELATION_DANCE, Moves.SPLASH])
      .enemyMoveset([Moves.FIERY_DANCE, Moves.SWORDS_DANCE]);
    await game.classicMode.startBattle([Species.ORICORIO, Species.FEEBAS]);

    const [oricorio, feebas, shuckle1, shuckle2] = game.scene.getField();
    expect(oricorio).toBeDefined();
    expect(feebas).toBeDefined();
    expect(shuckle1).toBeDefined();
    expect(shuckle2).toBeDefined();
    // Set the mons in reverse speed order - P1, P2, E1, E2
    // Used in place of `setTurnOrder` as the latter only applies for current phase
    game.scene.getField().forEach((pok, i) => pok.setStat(Stat.SPD, 5 - i));

    // oricorio uses splash, everyone else dances like crazy
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.REVELATION_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.forceEnemyMove(Moves.FIERY_DANCE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SWORDS_DANCE);

    await game.phaseInterceptor.to("MovePhase", false); // oricorio splash
    checkCurrentMoveUser(oricorio, Moves.SPLASH, [BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("MovePhase", false); // feebas uses rev dance on shuckle #2
    checkCurrentMoveUser(feebas, Moves.REVELATION_DANCE, [BattlerIndex.PLAYER_2]);

    await game.phaseInterceptor.to("MovePhase", false); // oricorio copies rev dance against same target
    checkCurrentMoveUser(oricorio, Moves.REVELATION_DANCE, [BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("MovePhase", false); // shuckle 1 copies rev dance vs feebas
    checkCurrentMoveUser(shuckle1, Moves.REVELATION_DANCE, [BattlerIndex.PLAYER_2]);
    await game.phaseInterceptor.to("MovePhase", false); // shuckle 2 copies rev dance vs feebas
    checkCurrentMoveUser(shuckle2, Moves.REVELATION_DANCE, [BattlerIndex.PLAYER_2]);

    await game.phaseInterceptor.to("MovePhase", false); // oricorio copies fiery dance
    checkCurrentMoveUser(oricorio, Moves.FIERY_DANCE, [BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MovePhase"); // shuckle 2 uses fiery dance
    await game.phaseInterceptor.to("MovePhase", false); // oricorio copies fiery dance

    checkCurrentMoveUser(oricorio, Moves.FIERY_DANCE, [BattlerIndex.ENEMY_2]);
  });

  it("should count as last attack recieved for counter moves", async () => {
    game.override
      .battleStyle("double")
      .moveset([Moves.REVELATION_DANCE, Moves.SPLASH])
      .enemyMoveset([Moves.METAL_BURST, Moves.SPLASH]);

    await game.classicMode.startBattle([Species.ORICORIO, Species.SNIVY]);

    const [oricorio, snivy, shuckle1, shuckle2] = game.scene.getField();
    expect(oricorio).toBeDefined();
    expect(snivy).toBeDefined();
    expect(shuckle1).toBeDefined();
    expect(shuckle2).toBeDefined();
    // set snivy's stats to very low number to guarantee we only do 1 dmg
    vi.spyOn(snivy, "getStats").mockReturnValue([1, 1, 1, 1, 1, 1]);

    // Feebas attacks enemy 2, prompting oricorio to do the same
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.REVELATION_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.forceEnemyMove(Moves.METAL_BURST);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2]);

    // ORDER:
    // oricorio splash
    // shuckle 1 splash
    // snivy rev dance vs shuckle 2
    // oricorio copies rev dance vs shuckle 2
    // shuckle 2 metal burst

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(shuckle2.getLastXMoves(-1)[0].move).toBe(Moves.METAL_BURST);
    expect(shuckle2.getLastXMoves(-1)[0].targets).toEqual([BattlerIndex.PLAYER]);

    //
    const oricorioDmgTaken = oricorio.getInverseHp();
    expect(oricorioDmgTaken).toBeCloseTo(Math.ceil(shuckle2.getInverseHp() * 1.5) - 1, 0);
  });

  it("should not trigger on protected, immune or missed moves", async () => {
    game.override
      .moveset([Moves.SPLASH, Moves.PROTECT])
      .enemySpecies(Species.GROUDON)
      .enemyMoveset([Moves.FEATHER_DANCE, Moves.REVELATION_DANCE, Moves.AQUA_STEP]);
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    const groudon = game.scene.getEnemyPokemon()!;
    expect(oricorio).toBeDefined();
    expect(groudon).toBeDefined();

    // Protect
    game.move.select(Moves.PROTECT);
    await game.forceEnemyMove(Moves.FEATHER_DANCE);
    await game.toNextTurn();

    // wasn't copied due to being blocked
    expect(oricorio.getStatStage(Stat.ATK)).toBe(0);
    expect(groudon.getStatStage(Stat.ATK)).toBe(0);

    // Enemy uses ground-type rev dance
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.REVELATION_DANCE);
    await game.toNextTurn();

    // wasn't copied due to being ineffective
    expect(oricorio.hp).toBe(oricorio.getMaxHp());
    expect(groudon.hp).toBe(groudon.getMaxHp());

    // Force a miss
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.AQUA_STEP);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.move.forceMiss();
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(oricorio.hp).toBe(oricorio.getMaxHp());
    expect(groudon.hp).toBe(groudon.getMaxHp());
  });

  // TODO: Verify this
  it.todo("should not trigger on status moves acting past cap", async () => {
    game.override
      .moveset([Moves.SPLASH, Moves.PROTECT])
      .enemySpecies(Species.GROUDON)
      .enemyMoveset([Moves.FEATHER_DANCE, Moves.REVELATION_DANCE]);
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    const groudon = game.scene.getEnemyPokemon()!;
    expect(oricorio).toBeDefined();
    expect(groudon).toBeDefined();

    // minimize attack and use feather dance
    oricorio.setStatStage(Stat.ATK, -6);
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.FEATHER_DANCE);
    await game.toNextTurn();

    expect(oricorio.getStatStage(Stat.ATK)).toBe(-6);
    expect(groudon.getStatStage(Stat.ATK)).toBe(0);

    // max enemy spatk/spatk/spd to max and use quiver dance
    groudon.setStatStage(Stat.SPATK, 6);
    groudon.setStatStage(Stat.SPDEF, 6);
    groudon.setStatStage(Stat.SPD, 6);
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.QUIVER_DANCE);
    await game.toNextTurn();

    // wasn't copied due to stats already being at +6
    expect(oricorio.getStatStage(Stat.SPATK)).toBe(0);
    expect(groudon.getStatStage(Stat.SPATK)).toBe(6);
  });

  it("should trigger confusion self-damage, even when protected against", async () => {
    game.override
      .moveset([Moves.PROTECT, Moves.SPLASH])
      .enemyMoveset([Moves.CONFUSE_RAY, Moves.SWORDS_DANCE])
      .confusionActivation(false); // disable confusion unless forced by mocks
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    expect(oricorio).toBeDefined();

    // get confused
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.CONFUSE_RAY);
    await game.toNextTurn();

    // Protect, then copy swords dance
    game.move.select(Moves.PROTECT);
    await game.forceEnemyMove(Moves.SWORDS_DANCE);

    await game.phaseInterceptor.to("MovePhase"); // protect
    await game.phaseInterceptor.to("MovePhase"); // Swords dance
    await game.move.forceConfusionActivation(true); // force confusion proc during swords dance copy
    await game.phaseInterceptor.to("TurnEndPhase");

    // took damage from confusion instead of using move; player remains confused
    expect(oricorio.hp).toBeLessThan(oricorio.getMaxHp());
    expect(oricorio.getTag(BattlerTagType.CONFUSED)).toBeDefined();
    expect(game.scene.getEnemyPokemon()?.getTag(BattlerTagType.CONFUSED)).toBeUndefined();
  });

  it("should not trigger while fully paralyzed", async () => {
    game.override
      .moveset(Moves.SPLASH)
      .enemyMoveset(Moves.SWORDS_DANCE)
      .statusEffect(StatusEffect.PARALYSIS)
      .statusActivation(true);
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    expect(oricorio).toBeDefined();
    expect(oricorio.status).not.toBeNull();

    // attempt to copy swords dance and get para'd
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(oricorio.getLastXMoves(-1)[0]).toMatchObject({ move: Moves.NONE });
    expect(oricorio.status).toBeTruthy();
    expect(oricorio.getStatStage(Stat.ATK)).toBe(0);
  });

  // TODO: verify on cart
  it("should wake user up upon copying move", async () => {
    game.override.moveset(Moves.ACROBATICS).enemyMoveset(Moves.SWORDS_DANCE).statusEffect(StatusEffect.SLEEP);
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    expect(oricorio).toBeDefined();
    expect(oricorio.status).not.toBeNull();
    expect(oricorio.status!.sleepTurnsRemaining).toBeGreaterThan(0);

    // wake up by copying swords dance
    game.move.select(Moves.ACROBATICS);
    await game.forceEnemyMove(Moves.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("MoveEffectPhase"); // enemy SD
    await game.phaseInterceptor.to("MovePhase", false); // player dancer attempt (curing happens inside MP)
    expect(oricorio.status).not.toBeNull();
    expect(oricorio.status!.sleepTurnsRemaining).toBeGreaterThan(0);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(oricorio.status).toBeNull();

    expect(oricorio.getStatStage(Stat.ATK)).toBe(2);
    expect(game.scene.getEnemyPokemon()!.isFullHp()).toBe(false);
  });

  it.todo("should not lock user into Petal Dance or reduce its duration", async () => {
    game.override.enemyMoveset(Moves.PETAL_DANCE);
    await game.classicMode.startBattle([Species.ORICORIO]);

    // Mock RNG to make frenzy always last for max duration
    const oricorio = game.scene.getPlayerPokemon()!;
    expect(oricorio).toBeDefined();
    vi.spyOn(oricorio, "randSeedIntRange").mockImplementation((_, max) => max);

    game.move.changeMoveset(oricorio, [Moves.SPLASH, Moves.PETAL_DANCE]);

    const shuckle = game.scene.getEnemyPokemon()!;
    expect(shuckle).toBeDefined();

    // Enemy uses petal dance and we copy
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    // used petal dance without being locked into move
    expect(oricorio.getLastXMoves(-1)[0]).toMatchObject({ move: Moves.PETAL_DANCE, useType: MoveUseType.INDIRECT });
    expect(oricorio.getMoveQueue()).toHaveLength(0);
    expect(oricorio.getTag(BattlerTagType.FRENZY)).toBeUndefined();
    expect(shuckle.turnData.attacksReceived).toHaveLength(1);
    await game.toNextTurn();

    // Use petal dance ourselves and copy enemy one
    game.move.select(Moves.PETAL_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");
    const prevQueueLength = oricorio.getMoveQueue().length;
    await game.phaseInterceptor.to("TurnEndPhase");

    // locked into Petal Dance for 2 more turns (not 1)
    expect(oricorio.getMoveQueue()).toHaveLength(prevQueueLength);
    expect(oricorio.getTag(BattlerTagType.FRENZY)).toBeDefined();
    expect(oricorio.getMoveset().find(m => m.moveId === Moves.PETAL_DANCE)?.ppUsed).toBe(1);
  });

  it("should not trigger while flinched", async () => {
    game.override.battleStyle("double").moveset(Moves.SPLASH).enemyMoveset([Moves.SWORDS_DANCE, Moves.FAKE_OUT]);
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    expect(oricorio).toBeDefined();

    // get faked out and copy swords dance
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SWORDS_DANCE);
    await game.forceEnemyMove(Moves.FAKE_OUT, BattlerIndex.PLAYER);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(oricorio.getLastXMoves(-1)[0]).toMatchObject({
      move: Moves.NONE,
      result: MoveResult.FAIL,
      useType: MoveUseType.INDIRECT,
    });
    expect(oricorio.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should lapse Truant and respect its disables", async () => {
    game.override.passiveAbility(Abilities.TRUANT).moveset(Moves.SPLASH).enemyMoveset(Moves.SWORDS_DANCE);
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    expect(oricorio).toBeDefined();

    game.move.select(Moves.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(oricorio.getLastXMoves(2)).toEqual([
      expect.objectContaining({
        move: Moves.NONE,
        result: MoveResult.FAIL,
        useType: MoveUseType.INDIRECT,
      }),
      expect.objectContaining({
        move: Moves.SPLASH,
        result: MoveResult.SUCCESS,
        useType: MoveUseType.NORMAL,
      }),
    ]);
    expect(oricorio.getStatStage(Stat.ATK)).toBe(0);

    game.move.select(Moves.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(oricorio.getLastXMoves(2)).toEqual([
      expect.objectContaining({
        move: Moves.NONE,
        result: MoveResult.FAIL,
        useType: MoveUseType.NORMAL,
      }),
      expect.objectContaining({
        move: Moves.SWORDS_DANCE,
        result: MoveResult.SUCCESS,
        useType: MoveUseType.INDIRECT,
      }),
    ]);
    expect(oricorio.getStatStage(Stat.ATK)).toBe(2);
  });

  it("should not count as last move used for mirror move", async () => {
    game.override.moveset(Moves.SPLASH).enemyMoveset([Moves.MIRROR_MOVE, Moves.SWORDS_DANCE]);
    await game.classicMode.startBattle([Species.ORICORIO]);

    const shuckle = game.scene.getEnemyPokemon()!;

    // select splash first so we have a clear indicator of what move got copied
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.MIRROR_MOVE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(shuckle.getLastXMoves()[0]).toMatchObject({ move: Moves.SPLASH, useType: MoveUseType.FOLLOW_UP });
  });

  it("should not count as last move used for mirror move", async () => {
    game.override.moveset(Moves.SPLASH).enemyMoveset([Moves.MIRROR_MOVE, Moves.SWORDS_DANCE]);
    await game.classicMode.startBattle([Species.ORICORIO]);

    const shuckle = game.scene.getEnemyPokemon()!;

    // select splash first so we have a clear indicator of what move got copied
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.MIRROR_MOVE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(shuckle.getLastXMoves()[0]).toMatchObject({ move: Moves.SPLASH, useType: MoveUseType.FOLLOW_UP });
  });

  it("should not count as the last move used for Instruct", async () => {
    game.override
      .battleStyle("double")
      .moveset([Moves.FIERY_DANCE, Moves.SPLASH])
      .enemyMoveset([Moves.INSTRUCT, Moves.SPLASH]);
    await game.classicMode.startBattle([Species.ORICORIO, Species.FEEBAS]);

    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.FIERY_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.forceEnemyMove(Moves.INSTRUCT, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MovePhase"); // Oricorio uses splash
    await game.phaseInterceptor.to("MovePhase"); // Feebas uses fiery dance
    await game.phaseInterceptor.to("MovePhase"); // Oricorio copies fiery dance

    await game.phaseInterceptor.to("MovePhase"); // shuckle 2 instructs oricorio
    await game.phaseInterceptor.to("MovePhase", false); // instructed move used

    checkCurrentMoveUser(game.scene.getPlayerPokemon(), Moves.SPLASH, [BattlerIndex.PLAYER], MoveUseType.NORMAL);
  });
});
