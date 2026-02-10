import { allAbilities, allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import type { Pokemon } from "#field/pokemon";
import type { MovePhase } from "#phases/move-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Dancer", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
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
    expect(game).toBeAtPhase("MovePhase");
    const currentPhase = game.scene.phaseManager.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(pokemon);
    expect(currentPhase.move.moveId).toBe(move);
    if (targets) {
      expect(currentPhase.targets).toEqualUnsorted(targets);
    }
    expect(currentPhase.useMode).toBe(useMode);
  }

  /** Helper function to advance to and stop **right before** the next move is used in a turn. */
  async function toNextMove(): Promise<void> {
    if (game.scene.phaseManager.getCurrentPhase().is("MovePhase")) {
      await game.phaseInterceptor.to("MoveEndPhase");
    }
    await game.phaseInterceptor.to("MovePhase", false);
  }

  // Reference Link: https://bulbapedia.bulbagarden.net/wiki/Dancer_(Ability).

  it("should copy dance moves without consuming extra PP", async () => {
    game.override.enemyAbility(AbilityId.DANCER);
    await game.classicMode.startBattle(SpeciesId.ORICORIO);

    const oricorio = game.field.getPlayerPokemon();
    const shuckle = game.field.getEnemyPokemon();
    game.move.changeMoveset(oricorio, [MoveId.VICTORY_DANCE, MoveId.SWORDS_DANCE]);
    game.move.changeMoveset(shuckle, [MoveId.VICTORY_DANCE, MoveId.SWORDS_DANCE]);

    game.move.select(MoveId.SWORDS_DANCE);
    await game.move.selectEnemyMove(MoveId.VICTORY_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(oricorio).toHaveAbilityApplied(AbilityId.DANCER);
    expect(shuckle).toHaveAbilityApplied(AbilityId.DANCER);
    expect(game.phaseInterceptor.log).toContain("DancerPhase");

    // shpuldn't use PP if copied move is also in moveset
    expect(oricorio).toHaveUsedPP(MoveId.SWORDS_DANCE, 1);
    expect(oricorio).toHaveUsedPP(MoveId.VICTORY_DANCE, 0);
    expect(shuckle).toHaveUsedPP(MoveId.SWORDS_DANCE, 0);
    expect(shuckle).toHaveUsedPP(MoveId.VICTORY_DANCE, 1);

    // effects were applied correctly
    expect(oricorio).toHaveStatStage(Stat.ATK, 3);
    expect(shuckle).toHaveStatStage(Stat.ATK, 3);

    // moves showed up in history
    expect(oricorio).toHaveUsedMove({ move: MoveId.VICTORY_DANCE, useMode: MoveUseMode.INDIRECT });
    expect(oricorio).toHaveUsedMove({ move: MoveId.SWORDS_DANCE, useMode: MoveUseMode.NORMAL }, 1);
    expect(shuckle).toHaveUsedMove({ move: MoveId.VICTORY_DANCE, useMode: MoveUseMode.NORMAL });
    expect(shuckle).toHaveUsedMove({ move: MoveId.SWORDS_DANCE, useMode: MoveUseMode.INDIRECT }, 1);
  });

  it("should target correctly in double battles", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.ORICORIO, SpeciesId.FEEBAS);

    const [oricorio, feebas] = game.scene.getPlayerField();

    game.move.use(MoveId.FEATHER_DANCE, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.use(MoveId.REVELATION_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.move.forceEnemyMove(MoveId.FIERY_DANCE, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await toNextMove(); // initial use
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

    // run to turn end to make sure nothing bad happens
    await game.toEndOfTurn();
  });

  it("should redirect copied moves if the original target faints", async () => {
    game.override.battleStyle("double").passiveAbility(AbilityId.ROUGH_SKIN);
    await game.classicMode.startBattle(SpeciesId.ORICORIO);

    const oricorio = game.field.getPlayerPokemon();
    const shuckle1 = game.field.getEnemyPokemon();
    shuckle1.hp = 1;

    // shuckle 1 hits us and faints, then we copy their attack (against their partner)
    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.AQUA_STEP, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER]);

    await toNextMove(); // initial attack
    await toNextMove(); // dancer copy

    expect(shuckle1).toHaveFainted();
    // attack should be aimed at the other (non-fainted) enemy
    checkCurrentMoveUser(oricorio, MoveId.AQUA_STEP, [BattlerIndex.ENEMY_2]);
  });

  it("should respect speed order during doubles", async () => {
    game.override.battleStyle("double").enemyAbility(AbilityId.DANCER);
    await game.classicMode.startBattle(SpeciesId.ORICORIO, SpeciesId.FEEBAS);

    // TODO: Use `game.setTurnOrder` once it persists between turns and isn't limited to just move phases
    const [oricorio, feebas, shuckle1, shuckle2] = game.scene.getField();
    oricorio.setStat(Stat.SPD, 1);
    feebas.setStat(Stat.SPD, 2);
    shuckle1.setStat(Stat.SPD, 4);
    shuckle2.setStat(Stat.SPD, 3);
    shuckle1.name = "Shuckle 1";
    shuckle2.name = "Shuckle 2";

    const dancerSpy = vi.spyOn(allAbilities[AbilityId.DANCER].getAttrs("PostDancingMoveAbAttr")[0], "apply");

    game.move.use(MoveId.QUIVER_DANCE, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    const expectedOrder = [shuckle1.name, shuckle2.name, feebas.name] as const;

    const abOrder = dancerSpy.mock.calls.map(([{ pokemon }]) => pokemon.name);
    expect(abOrder).toEqual(expectedOrder);
  });

  it("should count as the last attack received for counter moves", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.ORICORIO, SpeciesId.FEEBAS);

    const oricorio = game.field.getPlayerPokemon();
    const shuckle = game.field.getEnemyPokemon();
    const enemyDmgSpy = vi.spyOn(shuckle, "damageAndUpdate");

    // feebas attacks enemy 2, prompting oricorio to do the same
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.REVELATION_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.move.forceEnemyMove(MoveId.METAL_BURST);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.toEndOfTurn();

    expect(enemyDmgSpy).toHaveBeenCalledTimes(2);
    expect(shuckle).toHaveUsedMove({ move: MoveId.METAL_BURST, targets: [BattlerIndex.PLAYER] });
    expect(oricorio).not.toHaveFullHp();
  });

  it.each<{ name: string; move?: MoveId; enemyMove: MoveId }>([
    { name: "protected moves", enemyMove: MoveId.FIERY_DANCE, move: MoveId.PROTECT },
    { name: "missed moves", enemyMove: MoveId.AQUA_STEP },
    { name: "ineffective moves", enemyMove: MoveId.REVELATION_DANCE }, // type immunity
    // TODO: These currently don't work as the moves are still considered "successful"
    // if all targets are unaffected
    // { name: "failed Teeter Dance", enemyMove: MoveId.TEETER_DANCE },
    // { name: "capped stat-raising moves", enemyMove: MoveId.QUIVER_DANCE },
    // { name: "capped stat-lowering moves", enemyMove: MoveId.FEATHER_DANCE },
  ])("should not trigger on $name", async ({ move = MoveId.SPLASH, enemyMove }) => {
    game.override.enemySpecies(SpeciesId.GROUDON);
    // force aqua step to whiff
    vi.spyOn(allMoves[MoveId.AQUA_STEP], "accuracy", "get").mockReturnValue(0);
    await game.classicMode.startBattle(SpeciesId.ORICORIO);

    const oricorio = game.field.getPlayerPokemon();
    const groudon = game.field.getEnemyPokemon();

    oricorio.setStatStage(Stat.ATK, -6);
    oricorio.setStatStage(Stat.SPATK, +6);
    oricorio.setStatStage(Stat.SPDEF, +6);
    oricorio.setStatStage(Stat.SPD, +6);
    oricorio.addTag(BattlerTagType.CONFUSED, 0, MoveId.CONFUSE_RAY, game.field.getEnemyPokemon().id);

    game.move.use(move);
    await game.move.forceEnemyMove(enemyMove);
    await game.toEndOfTurn();

    expect(groudon).toHaveUsedMove({
      move: enemyMove,
      result: expect.toBeOneOf([MoveResult.MISS, MoveResult.FAIL]),
      useMode: MoveUseMode.NORMAL,
    });
    expect(oricorio).not.toHaveAbilityApplied(AbilityId.DANCER);
  });

  it("should trigger confusion self-damage, even through Protect", async () => {
    await game.classicMode.startBattle(SpeciesId.ORICORIO);

    const oricorio = game.field.getPlayerPokemon();

    // Protect, then copy swords dance and hit self in confusion
    game.move.use(MoveId.PROTECT);
    await game.move.forceEnemyMove(MoveId.SWORDS_DANCE);

    await toNextMove();
    await toNextMove();
    await toNextMove(); // right before copying move phase
    expect(oricorio).toHaveBattlerTag(BattlerTagType.PROTECTED);
    oricorio.addTag(BattlerTagType.CONFUSED, 5, MoveId.CONFUSE_RAY, game.field.getEnemyPokemon().id);
    await game.move.forceConfusionActivation(true);
    await game.toEndOfTurn();

    expect(oricorio).not.toHaveFullHp();
    expect(oricorio).toHaveStatStage(Stat.ATK, 0);
    expect(oricorio).toHaveBattlerTag(BattlerTagType.CONFUSED);
  });

  it("should respect full paralysis", async () => {
    game.override.statusEffect(StatusEffect.PARALYSIS).statusActivation(true);
    await game.classicMode.startBattle(SpeciesId.ORICORIO);

    const oricorio = game.field.getPlayerPokemon();
    expect(oricorio).toHaveStatusEffect(StatusEffect.PARALYSIS);

    // attempt to copy swords dance and get para'd
    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(oricorio).toHaveUsedMove(MoveId.NONE);
    expect(oricorio).toHaveStatStage(Stat.ATK, 0);
  });

  it("should not inherit ability ignore status from the original move", async () => {
    game.override.enemyAbility(AbilityId.MOLD_BREAKER).enemyPassiveAbility(AbilityId.WONDER_GUARD);
    await game.classicMode.startBattle(SpeciesId.ORICORIO);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.REVELATION_DANCE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MovePhase");

    expect(game.scene.arena.ignoreAbilities).toBe(true);

    await game.phaseInterceptor.to("MovePhase");

    // flag was cleared before copying took place
    expect(game.scene.arena.ignoreAbilities).toBe(false);

    await game.toEndOfTurn();

    const oricorio = game.field.getPlayerPokemon();
    expect(oricorio).toHaveUsedMove(
      {
        move: MoveId.REVELATION_DANCE,
        useMode: MoveUseMode.INDIRECT,
        result: MoveResult.MISS,
      },
      1,
    );
  });

  it.each<{ name: string; status: StatusEffect }>([
    { name: "Sleep", status: StatusEffect.SLEEP },
    { name: "Freeze", status: StatusEffect.FREEZE },
  ])("should cure $name when copying a move", async ({ status }) => {
    game.override.statusEffect(status).statusActivation(true);
    await game.classicMode.startBattle(SpeciesId.ORICORIO);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    const oricorio = game.field.getPlayerPokemon();
    expect(oricorio).toHaveStatStage(Stat.ATK, 2);
    expect(oricorio).toHaveStatusEffect(StatusEffect.NONE);
  });

  // TODO: This more or less requires an overhaul of Frenzy moves
  it.todo("should not lock the user into Petal Dance or reduce its duration", async () => {
    game.override.enemyMoveset(MoveId.PETAL_DANCE);
    await game.classicMode.startBattle(SpeciesId.ORICORIO);

    const oricorio = game.field.getPlayerPokemon();

    game.move.changeMoveset(oricorio, [MoveId.SPLASH, MoveId.PETAL_DANCE]);

    game.move.select(MoveId.SPLASH);
    await game.toEndOfTurn();

    // used petal dance without being locked in
    expect(oricorio).toHaveUsedMove({ move: MoveId.PETAL_DANCE, useMode: MoveUseMode.INDIRECT });
    expect(oricorio.getMoveQueue()).toHaveLength(0);
    expect(oricorio).not.toHaveBattlerTag(BattlerTagType.FRENZY);
    await game.toNextTurn();

    // Use petal dance ourselves and copy enemy one in same turn
    game.move.select(MoveId.PETAL_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");

    const prevQueueLength = oricorio.getMoveQueue().length;

    await game.toEndOfTurn();

    // should not have ticked down petal dance the 2nd time
    expect(oricorio.getMoveQueue()).toHaveLength(prevQueueLength);
    expect(oricorio).toHaveBattlerTag(BattlerTagType.FRENZY);
    expect(oricorio).toHaveUsedPP(MoveId.PETAL_DANCE, 1);
  });

  it("should lapse Truant and respect its disables", async () => {
    game.override.passiveAbility(AbilityId.TRUANT).enemyMoveset(MoveId.SWORDS_DANCE);
    await game.classicMode.startBattle(SpeciesId.ORICORIO);

    const oricorio = game.field.getPlayerPokemon();

    // turn 1: Splash --> truanted SD (gets blocked)
    game.move.use(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(oricorio).toHaveUsedMove({
      move: MoveId.NONE,
      result: MoveResult.FAIL,
      useMode: MoveUseMode.INDIRECT,
    });
    expect(oricorio).toHaveUsedMove(
      {
        move: MoveId.SPLASH,
        result: MoveResult.SUCCESS,
        useMode: MoveUseMode.NORMAL,
      },
      1,
    );
    expect(oricorio).toHaveStatStage(Stat.ATK, 0);

    // Turn 2: Dancer SD --> truanted Splash
    game.move.use(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(oricorio).toHaveUsedMove({
      move: MoveId.NONE,
      result: MoveResult.FAIL,
      useMode: MoveUseMode.NORMAL,
    });
    expect(oricorio).toHaveUsedMove(
      {
        move: MoveId.SWORDS_DANCE,
        result: MoveResult.SUCCESS,
        useMode: MoveUseMode.INDIRECT,
      },
      1,
    );
    expect(oricorio).toHaveStatStage(Stat.ATK, 2);
  });

  it.each<{ name: string; move: MoveId }>([
    { name: "Mirror Move", move: MoveId.MIRROR_MOVE },
    { name: "Copycat", move: MoveId.COPYCAT },
  ])("should be ignored by $name", async ({ move }) => {
    await game.classicMode.startBattle(SpeciesId.ORICORIO);

    const oricorio = game.field.getPlayerPokemon();
    const shuckle = game.field.getEnemyPokemon();

    // select splash first so we have a clear indicator of what move got copied
    game.scene.currentBattle.lastMove = MoveId.SPLASH;
    oricorio.pushMoveHistory({ move: MoveId.SPLASH, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL });

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(move);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(shuckle).toHaveUsedMove({ move: MoveId.SPLASH, useMode: MoveUseMode.FOLLOW_UP });
  });
});
