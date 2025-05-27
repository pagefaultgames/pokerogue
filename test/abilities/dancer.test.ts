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
import { toDmgValue } from "#app/utils/common";
import { allMoves } from "#app/data/moves/move";
import { allAbilities } from "#app/data/data-lists";
import { ShowAbilityPhase } from "#app/phases/show-ability-phase";

describe("Abilities - Dancer", () => {
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
      .battleStyle("single")
      .disableCrits()
      .ability(Abilities.DANCER)
      .enemySpecies(Species.SHUCKLE)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .enemyLevel(100)
      .startingLevel(100);
  });

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
    expect(currentPhase.pokemon).toBe(pokemon);
    expect(currentPhase.move.moveId).toBe(move);
    if (targets) {
      expect(currentPhase.targets).toHaveLength(targets.length);
      expect(currentPhase.targets).toEqual(expect.arrayContaining(targets));
    }
    expect(currentPhase.useType).toBe(useType);
  }

  async function toNextMove() {
    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to("MovePhase", false);
  }

  // Reference Link: https://bulbapedia.bulbagarden.net/wiki/Dancer_(Ability).

  it("should copy dance moves without consuming extra PP", async () => {
    game.override.enemyAbility(Abilities.DANCER).enemyMoveset([]);
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    const shuckle = game.scene.getEnemyPokemon()!;
    expect(oricorio).toBeDefined();
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

  it("should redirect copied move if ally target faints", async () => {
    game.override.battleStyle("double").startingLevel(500).moveset([Moves.REVELATION_DANCE, Moves.SPLASH]);
    await game.classicMode.startBattle([Species.ORICORIO, Species.FEEBAS]);

    const [oricorio, feebas] = game.scene.getPlayerField();

    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.select(Moves.REVELATION_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MovePhase", false); // feebas rev dance
    checkCurrentMoveUser(feebas, Moves.REVELATION_DANCE, [BattlerIndex.ENEMY_2], MoveUseType.NORMAL);
    await toNextMove();

    // attack should redirect
    const [shuckle1, shuckle2] = game.scene.getEnemyField();
    expect(shuckle2.isFainted()).toBe(true);
    checkCurrentMoveUser(oricorio, Moves.REVELATION_DANCE, [BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(shuckle1.isFainted()).toBe(true);
  });

  it("should redirect copied move if source enemy faints", async () => {
    game.override.battleStyle("double").enemyMoveset([Moves.AQUA_STEP, Moves.SPLASH]);
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    const [shuckle1, shuckle2] = game.scene.getEnemyField();
    shuckle1.hp = 1;
    vi.spyOn(shuckle2, "getAbility").mockReturnValue(allAbilities[Abilities.ROUGH_SKIN]);

    // Enemy 1 hits enemy 2 and gets pwneed
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.AQUA_STEP, BattlerIndex.ENEMY_2);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("MovePhase"); // shuckle aqua steps its ally and kills itself
    await toNextMove(); // Oricorio copies
    expect(shuckle1.isFainted()).toBe(true);

    // attack should redirect to other shuckle
    checkCurrentMoveUser(oricorio, Moves.AQUA_STEP, [BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(oricorio.isFullHp()).toBe(false);
  });

  it("should not break subsequent last hit only moves", async () => {
    game.override.battleStyle("single").enemyMoveset(Moves.SWORDS_DANCE).moveset(Moves.BATON_PASS);
    await game.classicMode.startBattle([Species.ORICORIO, Species.FEEBAS]);

    const [oricorio, feebas] = game.scene.getPlayerParty();

    game.move.select(Moves.BATON_PASS);
    game.doSelectPartyPokemon(1);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()).toBe(feebas);
    expect(feebas.getStatStage(Stat.ATK)).toBe(2);
    expect(oricorio.isOnField()).toBe(false);
    expect(oricorio.visible).toBe(false);
  });

  it("should target correctly in double battles", async () => {
    game.override
      .battleStyle("double")
      .moveset([Moves.FEATHER_DANCE, Moves.REVELATION_DANCE])
      .enemyMoveset([Moves.FIERY_DANCE, Moves.SWORDS_DANCE]);
    await game.classicMode.startBattle([Species.ORICORIO, Species.FEEBAS]);

    const [oricorio, feebas] = game.scene.getPlayerField();
    expect(oricorio).toBeDefined();
    expect(feebas).toBeDefined();

    // oricorio feather dances feebas, everyone else dances like crazy
    game.move.select(Moves.FEATHER_DANCE, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.select(Moves.REVELATION_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.forceEnemyMove(Moves.FIERY_DANCE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MovePhase", false); // oricorio feather dance
    checkCurrentMoveUser(oricorio, Moves.FEATHER_DANCE, [BattlerIndex.PLAYER_2], MoveUseType.NORMAL);
    await toNextMove(); // feebas copies feather dance against oricorio
    checkCurrentMoveUser(feebas, Moves.FEATHER_DANCE, [BattlerIndex.PLAYER]);

    await toNextMove(); // feebas uses rev dance on shuckle #2
    checkCurrentMoveUser(feebas, Moves.REVELATION_DANCE, [BattlerIndex.ENEMY_2], MoveUseType.NORMAL);
    await toNextMove(); // oricorio copies rev dance against same target
    checkCurrentMoveUser(oricorio, Moves.REVELATION_DANCE, [BattlerIndex.ENEMY_2]);

    await toNextMove(); // shuckle 1 uses fiery dance
    await toNextMove(); // oricorio copies fiery dance against it
    checkCurrentMoveUser(oricorio, Moves.FIERY_DANCE, [BattlerIndex.ENEMY]);
    await toNextMove(); // feebas copies fiery dance
    checkCurrentMoveUser(feebas, Moves.FIERY_DANCE, [BattlerIndex.ENEMY]);

    await toNextMove(); // shuckle 2 uses swords dance
    await toNextMove(); // oricorio copies swords dance
    checkCurrentMoveUser(oricorio, Moves.SWORDS_DANCE, [BattlerIndex.PLAYER]);
    await toNextMove(); // feebas copies swords dance
    checkCurrentMoveUser(feebas, Moves.SWORDS_DANCE, [BattlerIndex.PLAYER_2]);

    await game.phaseInterceptor.to("TurnEndPhase");
  });

  // TODO: Enable once abilities start proccing in speed order
  // TODO: Fix display order - currently we display them all right at the start in REVERSE ORDER...?
  it.todo("should respect speed order during doubles and display in order", async () => {
    game.override
      .battleStyle("double")
      .enemyAbility(Abilities.DANCER)
      .moveset([Moves.QUIVER_DANCE, Moves.SWORDS_DANCE])
      .enemyMoveset(Moves.SPLASH);
    await game.classicMode.startBattle([Species.ORICORIO, Species.FEEBAS]);

    // Set the mons in reverse speed order - P1, P2, E1, E2
    // Used in place of `setTurnOrder` as the latter only applies for turn start phase
    game.scene.getField().forEach((pkmn, i) => pkmn.setStat(Stat.SPD, 5 - i));
    const orderSpy = vi.spyOn(MovePhase.prototype, "start");
    const showAbSpy = vi.spyOn(ShowAbilityPhase.prototype, "start");

    game.move.select(Moves.QUIVER_DANCE, BattlerIndex.PLAYER);
    game.move.select(Moves.SWORDS_DANCE, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    const [oricorio, feebas, shuckle1, shuckle2] = game.scene.getField();

    const expectedOrder = [
      // Oricorio quiver dance
      oricorio,
      feebas,
      shuckle1,
      shuckle2,
      // Feebas swords dance
      feebas,
      oricorio,
      shuckle1,
      shuckle2,
    ];

    const order = (orderSpy.mock.contexts as MovePhase[]).map(mp => mp.pokemon);
    const abOrder = (showAbSpy.mock.contexts as ShowAbilityPhase[]).map(sap => sap.getPokemon());
    expect(order).toEqual(expectedOrder);
    expect(abOrder).toEqual(expectedOrder);
  });

  // TODO: Currently this is bugged as counter moves don't work at all
  it.todo("should count as last attack recieved for counter moves", async () => {
    game.override
      .battleStyle("double")
      .moveset([Moves.REVELATION_DANCE, Moves.SPLASH])
      .enemyMoveset([Moves.METAL_BURST, Moves.SPLASH]);

    await game.classicMode.startBattle([Species.ORICORIO, Species.SNIVY]);

    const [oricorio, snivy] = game.scene.getPlayerField();
    const [shuckle1, shuckle2] = game.scene.getEnemyField();
    expect(oricorio).toBeDefined();
    expect(snivy).toBeDefined();
    expect(shuckle1).toBeDefined();
    expect(shuckle2).toBeDefined();

    const enemyDmgSpy = vi.spyOn(shuckle2, "damageAndUpdate");

    // snivy attacks enemy 2, prompting oricorio to do the same
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.REVELATION_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.killPokemon(shuckle1);
    await game.forceEnemyMove(Moves.METAL_BURST);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2]);

    // ORDER:
    // oricorio splash
    // shuckle 1 splash
    // snivy rev dance vs shuckle 2
    // oricorio copies rev dance vs shuckle 2
    // shuckle 2 metal burst vs Oricorio

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(shuckle2.getLastXMoves(-1)[0].move).toBe(Moves.METAL_BURST);
    expect(shuckle2.getLastXMoves(-1)[0].targets).toEqual([BattlerIndex.PLAYER]);

    expect(enemyDmgSpy).toHaveBeenCalledTimes(2);
    const lastDmgTaken = enemyDmgSpy.mock.lastCall?.[0]!;
    expect(oricorio.getInverseHp()).toBe(toDmgValue(lastDmgTaken * 1.5));
  });

  it.each<{ name: string; move?: Moves; enemyMove: Moves }>([
    { name: "protected moves", enemyMove: Moves.FIERY_DANCE, move: Moves.PROTECT },
    { name: "missed moves", enemyMove: Moves.AQUA_STEP },
    { name: "ineffective moves", enemyMove: Moves.REVELATION_DANCE }, // ground type
    // TODO: These currently don't work as the moves are still considered "successful"
    // if all targets are already confused
    // { name: "failed Teeter Dance", enemyMove: Moves.TEETER_DANCE },
    // { name: "capped stat-boosting moves", enemyMove: Moves.FEATHER_DANCE },
    // { name: "capped stat-lowering moves", enemyMove: Moves.QUIVER_DANCE },
  ])("should not trigger on $name", async ({ move = Moves.SPLASH, enemyMove }) => {
    game.override.moveset(move).enemyMoveset(enemyMove).enemySpecies(Species.GROUDON);
    // force aqua step to whiff
    vi.spyOn(allMoves[Moves.AQUA_STEP], "accuracy", "get").mockReturnValue(0);
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    expect(oricorio).toBeDefined();

    oricorio.setStatStage(Stat.ATK, -6);
    oricorio.setStatStage(Stat.SPATK, +6);
    oricorio.setStatStage(Stat.SPDEF, +6);
    oricorio.setStatStage(Stat.SPD, +6);
    oricorio.addTag(BattlerTagType.CONFUSED, 12, Moves.CONFUSE_RAY, game.scene.getEnemyPokemon()!.id);

    game.move.select(move);
    await game.toNextTurn();

    console.log(game.scene.getEnemyPokemon()!.getLastXMoves()[0]);

    expect(oricorio.getLastXMoves(-1)).toEqual([
      expect.objectContaining({ move, result: MoveResult.SUCCESS, useType: MoveUseType.NORMAL }),
    ]);
    expect(oricorio.waveData.abilityRevealed).toBe(false);
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

  it("should respect full paralysis", async () => {
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

  it.each<{ name: string; status: StatusEffect }>([
    { name: "Sleep", status: StatusEffect.SLEEP },
    { name: "Freeze", status: StatusEffect.FREEZE },
  ])("should cure $name when copying move", async ({ status }) => {
    game.override
      .moveset(Moves.ACROBATICS)
      .enemyMoveset(Moves.SWORDS_DANCE)
      .statusEffect(status)
      .statusActivation(true);
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    expect(oricorio).toBeDefined();
    expect(oricorio.status?.effect).toBe(status);

    game.move.select(Moves.ACROBATICS);
    await game.forceEnemyMove(Moves.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("MoveEffectPhase"); // enemy SD
    await game.phaseInterceptor.to("MovePhase"); // player dancer attempt (curing happens inside MP)
    expect(oricorio.status).toBeNull();

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(oricorio.getStatStage(Stat.ATK)).toBe(2);
    expect(game.scene.getEnemyPokemon()!.isFullHp()).toBe(false);
  });

  // TODO: This more or less requires an overhaul of Frenzy moves
  it.todo("should not lock user into Petal Dance or reduce its duration", async () => {
    game.override.enemyMoveset(Moves.PETAL_DANCE);
    await game.classicMode.startBattle([Species.ORICORIO]);

    // Mock RNG to make frenzy always last for max duration
    const oricorio = game.scene.getPlayerPokemon()!;
    expect(oricorio).toBeDefined();
    vi.spyOn(oricorio, "randBattleSeedIntRange").mockImplementation((_, max) => max);

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

    // turn 1: Splash --> truanted Dancer SD
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

    // Turn 2: Dancer SD --> truanted Splash
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
    await toNextMove(); // instructed move used

    checkCurrentMoveUser(game.scene.getPlayerPokemon(), Moves.SPLASH, [BattlerIndex.PLAYER], MoveUseType.NORMAL);
  });
});
