import { BattlerIndex } from "#enums/battler-index";
import type Pokemon from "#app/field/pokemon";
import { MoveResult } from "#enums/move-result";
import { MovePhase } from "#app/phases/move-phase";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveUseMode } from "#enums/move-use-mode";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { toDmgValue } from "#app/utils/common";
import { allMoves, allAbilities } from "#app/data/data-lists";
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
      .criticalHits(false)
      .ability(AbilityId.DANCER)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(100)
      .startingLevel(100);
  });

  /**
   * Check that the specified {@linkcode Pokemon} is using the specified move
   * in the current {@linkcode MovePhase} against the specified targets.
   */
  function checkCurrentMoveUser(
    pokemon: Pokemon,
    move: MoveId,
    targets?: BattlerIndex[],
    useMode: MoveUseMode = MoveUseMode.INDIRECT,
  ) {
    const currentPhase = game.scene.phaseManager.getCurrentPhase() as MovePhase;
    expect(currentPhase).not.toBeNull();
    expect(currentPhase).toBeInstanceOf(MovePhase);
    expect(currentPhase.pokemon).toBe(pokemon);
    expect(currentPhase.move.moveId).toBe(move);
    if (targets) {
      expect(currentPhase.targets).toHaveLength(targets.length);
      expect(currentPhase.targets).toEqual(expect.arrayContaining(targets));
    }
    expect(currentPhase.useMode).toBe(useMode);
  }

  /** Go to and stop right before using the next move. */
  async function toNextMove() {
    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to("MovePhase", false);
  }

  // Reference Link: https://bulbapedia.bulbagarden.net/wiki/Dancer_(Ability).

  it("should copy dance moves without consuming extra PP", async () => {
    game.override.enemyAbility(AbilityId.DANCER);
    await game.classicMode.startBattle([SpeciesId.ORICORIO]);

    const oricorio = game.field.getPlayerPokemon();
    const shuckle = game.field.getEnemyPokemon();

    game.move.changeMoveset(oricorio, [MoveId.VICTORY_DANCE, MoveId.SWORDS_DANCE]);
    game.move.changeMoveset(shuckle, [MoveId.VICTORY_DANCE, MoveId.SWORDS_DANCE]);

    game.move.select(MoveId.SWORDS_DANCE);
    await game.move.selectEnemyMove(MoveId.VICTORY_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    // shpuldn't use PP if copied move is also in moveset
    expect(oricorio.moveset.map(m => m.ppUsed)).toEqual([0, 1]);
    expect(shuckle.moveset.map(m => m.ppUsed)).toEqual([1, 0]);

    // effects were applied correctly
    expect(oricorio.getStatStage(Stat.ATK)).toBe(3);
    expect(shuckle.getStatStage(Stat.ATK)).toBe(3);

    // moves showed up in history
    expect(oricorio.getLastXMoves(-1)).toHaveLength(2);
    expect(oricorio.getLastXMoves(-1)).toEqual([
      expect.objectContaining({ move: MoveId.VICTORY_DANCE, useMode: MoveUseMode.INDIRECT }),
      expect.objectContaining({ move: MoveId.SWORDS_DANCE, useMode: MoveUseMode.NORMAL }),
    ]);
    expect(shuckle.getLastXMoves(-1)).toHaveLength(2);
    expect(shuckle.getLastXMoves(-1)).toEqual([
      expect.objectContaining({ move: MoveId.VICTORY_DANCE, useMode: MoveUseMode.NORMAL }),
      expect.objectContaining({ move: MoveId.SWORDS_DANCE, useMode: MoveUseMode.INDIRECT }),
    ]);
  });

  it("should redirect copied move if ally target faints", async () => {
    game.override.battleStyle("double").startingLevel(500);
    await game.classicMode.startBattle([SpeciesId.ORICORIO, SpeciesId.FEEBAS]);

    const [oricorio, feebas] = game.scene.getPlayerField();

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.REVELATION_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MovePhase", false); // feebas rev dance
    checkCurrentMoveUser(feebas, MoveId.REVELATION_DANCE, [BattlerIndex.ENEMY_2], MoveUseMode.NORMAL);
    await toNextMove();

    // attack should redirect
    const [shuckle1, shuckle2] = game.scene.getEnemyField();
    expect(shuckle2.isFainted()).toBe(true);
    checkCurrentMoveUser(oricorio, MoveId.REVELATION_DANCE, [BattlerIndex.ENEMY]);

    await game.toEndOfTurn();

    expect(shuckle1.isFainted()).toBe(true);
  });

  it("should redirect copied move if source enemy faints", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.ORICORIO]);

    const oricorio = game.field.getPlayerPokemon();
    const [shuckle1, shuckle2] = game.scene.getEnemyField();
    shuckle1.hp = 1;
    vi.spyOn(shuckle2, "getAbility").mockReturnValue(allAbilities[AbilityId.ROUGH_SKIN]);

    // Enemy 1 hits enemy 2 and gets pwned
    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.AQUA_STEP, BattlerIndex.ENEMY_2);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("MovePhase"); // shuckle aqua steps its ally and kills itself
    await toNextMove(); // Oricorio copies
    expect(shuckle1.isFainted()).toBe(true);

    // attack should redirect to other shuckle
    checkCurrentMoveUser(oricorio, MoveId.AQUA_STEP, [BattlerIndex.ENEMY_2]);

    await game.toEndOfTurn();
    expect(oricorio.isFullHp()).toBe(false);
  });

  it("should target correctly in double battles", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.ORICORIO, SpeciesId.FEEBAS]);

    const [oricorio, feebas] = game.scene.getPlayerField();

    // oricorio feather dances feebas, everyone else dances like crazy
    game.move.use(MoveId.FEATHER_DANCE, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.use(MoveId.REVELATION_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.move.forceEnemyMove(MoveId.FIERY_DANCE, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MovePhase", false); // oricorio feather dance
    checkCurrentMoveUser(oricorio, MoveId.FEATHER_DANCE, [BattlerIndex.PLAYER_2], MoveUseMode.NORMAL);
    await toNextMove(); // feebas copies feather dance against oricorio
    checkCurrentMoveUser(feebas, MoveId.FEATHER_DANCE, [BattlerIndex.PLAYER]);

    await toNextMove(); // feebas uses rev dance on shuckle #2
    checkCurrentMoveUser(feebas, MoveId.REVELATION_DANCE, [BattlerIndex.ENEMY_2], MoveUseMode.NORMAL);
    await toNextMove(); // oricorio copies rev dance against same target
    checkCurrentMoveUser(oricorio, MoveId.REVELATION_DANCE, [BattlerIndex.ENEMY_2]);

    await toNextMove(); // shuckle 1 uses fiery dance
    await toNextMove(); // oricorio copies fiery dance against it
    checkCurrentMoveUser(oricorio, MoveId.FIERY_DANCE, [BattlerIndex.ENEMY]);
    await toNextMove(); // feebas copies fiery dance
    checkCurrentMoveUser(feebas, MoveId.FIERY_DANCE, [BattlerIndex.ENEMY]);

    await toNextMove(); // shuckle 2 uses swords dance
    await toNextMove(); // oricorio copies swords dance
    checkCurrentMoveUser(oricorio, MoveId.SWORDS_DANCE, [BattlerIndex.PLAYER]);
    await toNextMove(); // feebas copies swords dance
    checkCurrentMoveUser(feebas, MoveId.SWORDS_DANCE, [BattlerIndex.PLAYER_2]);

    await game.toEndOfTurn();
  });

  it("should display ability flyouts right before move use", async () => {
    game.override.battleStyle("double").enemyAbility(AbilityId.DANCER);
    await game.classicMode.startBattle([SpeciesId.ORICORIO, SpeciesId.FEEBAS]);

    // TODO: uncomment once dynamic spd order added
    // game.scene
    //   .getField()
    //   .forEach((pkmn, i) => pkmn.setStat(Stat.SPD, 5 - i));

    game.move.use(MoveId.SWORDS_DANCE, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("DancerPhase", false);
    game.phaseInterceptor.clearLogs();
    await game.toEndOfTurn();

    const showAbPhases: number[] = [];
    const hideAbPhases: number[] = [];
    const movePhases: number[] = [];
    const moveEndPhases: number[] = [];

    const log = game.phaseInterceptor.log;
    for (const [index, phase] of log.entries()) {
      switch (phase) {
        case "ShowAbilityPhase":
          showAbPhases.push(index);
          break;
        case "HideAbilityPhase":
          hideAbPhases.push(index);
          break;
        case "MovePhase":
          movePhases.push(index);
          break;
        case "MoveEndPhase":
        case "DancerPhase": // also count the initial dancer phase (which occurs right after the initial usage anyhow)
          moveEndPhases.push(index);
          break;
      }
    }

    expect(showAbPhases).toHaveLength(3);
    expect(hideAbPhases).toHaveLength(3);

    // Each dancer's ShowAbilityPhase must be immediately preceded by a MoveEndPhase and HideAbilityPhase,
    // and followed by a MovePhase.
    // We do not check the move phases directly as other pokemon may have moved themselves.
    for (const i of showAbPhases) {
      expect(moveEndPhases).toContain(i - 2);
      expect(hideAbPhases).toContain(i - 1);
      expect(movePhases).toContain(i + 1);
    }
  });

  // TODO: Enable once abilities start proccing in speed order
  it.todo("should respect speed order during doubles", async () => {
    game.override
      .battleStyle("double")
      .enemyAbility(AbilityId.DANCER)
      .moveset([MoveId.QUIVER_DANCE, MoveId.SPLASH])
      .enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.ORICORIO, SpeciesId.FEEBAS]);

    // Set the mons in reverse speed order - P1, P2, E1, E2
    // Used in place of `setTurnOrder` as the latter only applies for turn start phase
    game.scene.getField().forEach((pkmn, i) => pkmn.setStat(Stat.SPD, 5 - i));
    const orderSpy = vi.spyOn(MovePhase.prototype, "start");
    const showAbSpy = vi.spyOn(ShowAbilityPhase.prototype, "start");

    game.move.select(MoveId.QUIVER_DANCE, BattlerIndex.PLAYER);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    const [oricorio, feebas, shuckle1, shuckle2] = game.scene.getField();

    const expectedOrder = [
      // Oricorio quiver dance, then copies
      oricorio,
      feebas,
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
    game.override.battleStyle("double");

    await game.classicMode.startBattle([SpeciesId.ORICORIO, SpeciesId.SNIVY]);

    const [oricorio, _snivy] = game.scene.getPlayerField();
    const [shuckle1, shuckle2] = game.scene.getEnemyField();

    const enemyDmgSpy = vi.spyOn(shuckle2, "damageAndUpdate");

    // snivy attacks enemy 2, prompting oricorio to do the same
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.REVELATION_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.killPokemon(shuckle1);
    await game.move.forceEnemyMove(MoveId.METAL_BURST);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2]);

    // ORDER:
    // oricorio splash
    // shuckle 1 splash
    // snivy rev dance vs shuckle 2
    // oricorio copies rev dance vs shuckle 2
    // shuckle 2 metal burst vs Oricorio

    await game.toEndOfTurn();
    expect(shuckle2.getLastXMoves(-1)[0].move).toBe(MoveId.METAL_BURST);
    expect(shuckle2.getLastXMoves(-1)[0].targets).toEqual([BattlerIndex.PLAYER]);

    expect(enemyDmgSpy).toHaveBeenCalledTimes(2);
    const lastDmgTaken = enemyDmgSpy.mock.lastCall?.[0]!;
    expect(oricorio.getInverseHp()).toBe(toDmgValue(lastDmgTaken * 1.5));
  });

  it.each<{ name: string; move?: MoveId; enemyMove: MoveId }>([
    { name: "protected moves", enemyMove: MoveId.FIERY_DANCE, move: MoveId.PROTECT },
    { name: "missed moves", enemyMove: MoveId.AQUA_STEP },
    { name: "ineffective moves", enemyMove: MoveId.REVELATION_DANCE }, // ground type
    // TODO: These currently don't work as the moves are still considered "successful"
    // if all targets are unaffected
    // { name: "failed Teeter Dance", enemyMove: Moves.TEETER_DANCE },
    // { name: "capped stat-boosting moves", enemyMove: Moves.FEATHER_DANCE },
    // { name: "capped stat-lowering moves", enemyMove: Moves.QUIVER_DANCE },
  ])("should not trigger on $name", async ({ move = MoveId.SPLASH, enemyMove }) => {
    game.override.enemySpecies(SpeciesId.GROUDON);
    // force aqua step to whiff
    vi.spyOn(allMoves[MoveId.AQUA_STEP], "accuracy", "get").mockReturnValue(0);
    await game.classicMode.startBattle([SpeciesId.ORICORIO]);

    const oricorio = game.field.getPlayerPokemon();

    oricorio.setStatStage(Stat.ATK, -6);
    oricorio.setStatStage(Stat.SPATK, +6);
    oricorio.setStatStage(Stat.SPDEF, +6);
    oricorio.setStatStage(Stat.SPD, +6);
    oricorio.addTag(BattlerTagType.CONFUSED, 12, MoveId.CONFUSE_RAY, game.field.getEnemyPokemon().id);

    game.move.use(move);
    await game.move.forceEnemyMove(enemyMove);
    await game.toNextTurn();

    expect(oricorio.getLastXMoves(-1)).toEqual([
      expect.objectContaining({ move, result: MoveResult.SUCCESS, useMode: MoveUseMode.NORMAL }),
    ]);
    expect(oricorio.waveData.abilityRevealed).toBe(false);
  });

  it("should trigger confusion self-damage, even when protected against", async () => {
    game.override.confusionActivation(false); // disable confusion unless forced by mocks
    await game.classicMode.startBattle([SpeciesId.ORICORIO]);

    const oricorio = game.field.getPlayerPokemon();

    // get confused
    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.CONFUSE_RAY);
    await game.toNextTurn();

    expect(oricorio.getTag(BattlerTagType.CONFUSED)).toBeDefined();

    // Protect, then copy swords dance
    game.move.use(MoveId.PROTECT);
    await game.move.forceEnemyMove(MoveId.SWORDS_DANCE);

    await game.phaseInterceptor.to("MovePhase"); // protect
    await game.phaseInterceptor.to("MoveEndPhase"); // Swords dance
    await game.move.forceConfusionActivation(true); // force confusion proc during swords dance copy
    await game.toEndOfTurn();

    // took damage from confusion instead of using move; player remains confused
    expect(oricorio.hp).toBeLessThan(oricorio.getMaxHp());
    expect(oricorio.getTag(BattlerTagType.CONFUSED)).toBeDefined();
    expect(game.field.getEnemyPokemon()?.getTag(BattlerTagType.CONFUSED)).toBeUndefined();
  });

  it("should respect full paralysis", async () => {
    game.override.statusEffect(StatusEffect.PARALYSIS).statusActivation(true);
    await game.classicMode.startBattle([SpeciesId.ORICORIO]);

    const oricorio = game.field.getPlayerPokemon();
    expect(oricorio.status).not.toBeNull();

    // attempt to copy swords dance and get para'd
    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(oricorio.getLastXMoves(-1)[0]).toMatchObject({ move: MoveId.NONE });
    expect(oricorio.status).toBeTruthy();
    expect(oricorio.getStatStage(Stat.ATK)).toBe(0);
  });

  it.each<{ name: string; status: StatusEffect }>([
    { name: "Sleep", status: StatusEffect.SLEEP },
    { name: "Freeze", status: StatusEffect.FREEZE },
  ])("should cure $name when copying move", async ({ status }) => {
    game.override.statusEffect(status).statusActivation(true);
    await game.classicMode.startBattle([SpeciesId.ORICORIO]);

    const oricorio = game.field.getPlayerPokemon();
    expect(oricorio.status?.effect).toBe(status);

    game.move.use(MoveId.ACROBATICS);
    await game.move.forceEnemyMove(MoveId.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("MoveEffectPhase"); // enemy SD
    await game.phaseInterceptor.to("MovePhase"); // player dancer attempt (curing happens inside MP)
    expect(oricorio.status).toBeNull();

    await game.toEndOfTurn();
    expect(oricorio.getStatStage(Stat.ATK)).toBe(2);
    expect(game.field.getEnemyPokemon().isFullHp()).toBe(false);
  });

  // TODO: This more or less requires an overhaul of Frenzy moves
  it.todo("should not lock user into Petal Dance or reduce its duration", async () => {
    game.override.enemyMoveset(MoveId.PETAL_DANCE);
    await game.classicMode.startBattle([SpeciesId.ORICORIO]);

    // Mock RNG to make frenzy always last for max duration
    const oricorio = game.field.getPlayerPokemon();
    vi.spyOn(oricorio, "randBattleSeedIntRange").mockImplementation((_, max) => max);

    game.move.changeMoveset(oricorio, [MoveId.SPLASH, MoveId.PETAL_DANCE]);

    const shuckle = game.field.getEnemyPokemon();

    // Enemy uses petal dance and we copy
    game.move.select(MoveId.SPLASH);
    await game.toEndOfTurn();

    // used petal dance without being locked into move
    expect(oricorio.getLastXMoves(-1)[0]).toMatchObject({ move: MoveId.PETAL_DANCE, useMode: MoveUseMode.INDIRECT });
    expect(oricorio.getMoveQueue()).toHaveLength(0);
    expect(oricorio.getTag(BattlerTagType.FRENZY)).toBeUndefined();
    expect(shuckle.turnData.attacksReceived).toHaveLength(1);
    await game.toNextTurn();

    // Use petal dance ourselves and copy enemy one
    game.move.select(MoveId.PETAL_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");
    const prevQueueLength = oricorio.getMoveQueue().length;
    await game.toEndOfTurn();

    // locked into Petal Dance for 2 more turns (not 1)
    expect(oricorio.getMoveQueue()).toHaveLength(prevQueueLength);
    expect(oricorio.getTag(BattlerTagType.FRENZY)).toBeDefined();
    expect(oricorio.getMoveset().find(m => m.moveId === MoveId.PETAL_DANCE)?.ppUsed).toBe(1);
  });

  it("should lapse Truant and respect its disables", async () => {
    game.override.passiveAbility(AbilityId.TRUANT).moveset(MoveId.SPLASH).enemyMoveset(MoveId.SWORDS_DANCE);
    await game.classicMode.startBattle([SpeciesId.ORICORIO]);

    const oricorio = game.field.getPlayerPokemon();

    // turn 1: Splash --> truanted Dancer SD
    game.move.select(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(oricorio.getLastXMoves(2)).toEqual([
      expect.objectContaining({
        move: MoveId.NONE,
        result: MoveResult.FAIL,
        useMode: MoveUseMode.INDIRECT,
      }),
      expect.objectContaining({
        move: MoveId.SPLASH,
        result: MoveResult.SUCCESS,
        useMode: MoveUseMode.NORMAL,
      }),
    ]);
    expect(oricorio.getStatStage(Stat.ATK)).toBe(0);

    // Turn 2: Dancer SD --> truanted Splash
    game.move.select(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(oricorio.getLastXMoves(2)).toEqual([
      expect.objectContaining({
        move: MoveId.NONE,
        result: MoveResult.FAIL,
        useMode: MoveUseMode.NORMAL,
      }),
      expect.objectContaining({
        move: MoveId.SWORDS_DANCE,
        result: MoveResult.SUCCESS,
        useMode: MoveUseMode.INDIRECT,
      }),
    ]);
    expect(oricorio.getStatStage(Stat.ATK)).toBe(2);
  });

  it.each<{ name: string; move: MoveId }>([
    { name: "Mirror Move", move: MoveId.MIRROR_MOVE },
    { name: "Copycat", move: MoveId.COPYCAT },
  ])("should not count as last move used for $name", async ({ move }) => {
    await game.classicMode.startBattle([SpeciesId.ORICORIO]);

    const shuckle = game.field.getEnemyPokemon();

    // select splash first so we have a clear indicator of what move got copied
    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(move);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(shuckle.getLastXMoves()[0]).toMatchObject({ move: MoveId.SPLASH, useMode: MoveUseMode.FOLLOW_UP });
  });

  it("should not count as the last move used for Instruct", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.ORICORIO, SpeciesId.FEEBAS]);

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.FIERY_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.INSTRUCT, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MovePhase"); // Oricorio uses splash

    await game.phaseInterceptor.to("MovePhase"); // Feebas uses fiery dance
    await game.phaseInterceptor.to("MovePhase"); // Oricorio copies fiery dance

    await game.phaseInterceptor.to("MovePhase"); // shuckle 2 instructs oricorio
    await toNextMove(); // instructed move used

    checkCurrentMoveUser(game.field.getPlayerPokemon(), MoveId.SPLASH, [BattlerIndex.PLAYER], MoveUseMode.NORMAL);
  });

  ("");
});
