import { RechargingTag, SemiInvulnerableTag } from "#data/battler-tags";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Metronome", () => {
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
      .startingLevel(100)
      .enemyLevel(100)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.STURDY);
  });

  it("should not be able to copy MoveId.NONE", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    // Pick the first move available to use
    const player = game.field.getPlayerPokemon();
    vi.spyOn(player, "randBattleSeedInt").mockReturnValue(0);
    game.move.use(MoveId.METRONOME);
    await game.toNextTurn();

    const lastMoveStr = MoveId[player.getLastXMoves()[0].move];
    expect(lastMoveStr).not.toBe(MoveId[MoveId.NONE]);
    expect(lastMoveStr).toBe(MoveId[1]);
  });

  it("should become semi-invulnerable when using phasing moves", async () => {
    game.move.forceMetronomeMove(MoveId.DIVE);
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    const player = game.field.getPlayerPokemon();
    expect(player.getTag(SemiInvulnerableTag)).toBeUndefined();
    expect(player.visible).toBe(true);

    game.move.use(MoveId.METRONOME);
    await game.toNextTurn();

    expect(player.getTag(SemiInvulnerableTag)).toBeDefined();
    expect(player.visible).toBe(false);

    await game.toEndOfTurn();

    expect(player.getTag(SemiInvulnerableTag)).toBeUndefined();
    expect(player.visible).toBe(true);

    const enemy = game.field.getEnemyPokemon();
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });

  it("should apply secondary effects of the called move", async () => {
    game.move.forceMetronomeMove(MoveId.WOOD_HAMMER);
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    game.move.use(MoveId.METRONOME);
    await game.toNextTurn();

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    expect(player.hp).toBeLessThan(player.getMaxHp());
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });

  it("should count as last move used for Copycat/Mirror Move", async () => {
    game.move.forceMetronomeMove(MoveId.ABSORB, true);
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    game.move.use(MoveId.METRONOME);
    await game.move.forceEnemyMove(MoveId.MIRROR_MOVE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    expect(player.hp).toBeLessThan(player.getMaxHp());
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
    expect(enemy.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
  });

  it("should recharge after using recharge moves", async () => {
    game.move.forceMetronomeMove(MoveId.HYPER_BEAM);
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    const player = game.field.getPlayerPokemon();
    vi.spyOn(allMoves[MoveId.HYPER_BEAM], "accuracy", "get").mockReturnValue(100);

    game.move.select(MoveId.METRONOME);
    await game.toNextTurn();

    expect(player.getTag(RechargingTag)).toBeDefined();
  });

  it("should charge for charging moves while still maintaining follow-up status", async () => {
    game.move.forceMetronomeMove(MoveId.SOLAR_BEAM);
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    // We need to override movesets here
    const player = game.field.getPlayerPokemon();
    game.move.changeMoveset(player, [MoveId.METRONOME, MoveId.SOLAR_BEAM]);

    const [metronomeMove, solarBeamMove] = player.getMoveset();
    expect(metronomeMove).toBeDefined();
    expect(solarBeamMove).toBeDefined();

    game.move.use(MoveId.METRONOME);
    await game.move.forceEnemyMove(MoveId.SPITE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    // Solar beam charged up, but did not block Spite from reducing Metronome's PP
    expect(player.getTag(BattlerTagType.CHARGING)).toBeDefined();
    const turn1PpUsed = metronomeMove.ppUsed;
    expect.soft(turn1PpUsed).toBeGreaterThan(1);
    expect(solarBeamMove.ppUsed).toBe(0);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(player.getTag(BattlerTagType.CHARGING)).toBeUndefined();
    const turn2PpUsed = metronomeMove.ppUsed - turn1PpUsed;
    expect(turn2PpUsed).toBeGreaterThan(1);
    expect(solarBeamMove.ppUsed).toBe(0);
    expect(player.getLastXMoves()[0]).toMatchObject({
      move: MoveId.SOLAR_BEAM,
      result: MoveResult.SUCCESS,
      useMode: MoveUseMode.FOLLOW_UP,
    });
  });

  it("should only target ally for Aromatic Mist", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.REGIELEKI, SpeciesId.RATTATA]);

    const [leftPlayer, rightPlayer] = game.scene.getPlayerField();
    const [leftOpp, rightOpp] = game.scene.getEnemyField();
    game.move.forceMetronomeMove(MoveId.AROMATIC_MIST);

    game.move.use(MoveId.METRONOME, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    expect(rightPlayer.getStatStage(Stat.SPDEF)).toBe(1);
    expect(leftPlayer.getStatStage(Stat.SPDEF)).toBe(0);
    expect(leftOpp.getStatStage(Stat.SPDEF)).toBe(0);
    expect(rightOpp.getStatStage(Stat.SPDEF)).toBe(0);
  });

  it("should cause opponent to flee when using Roar", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);
    game.move.forceMetronomeMove(MoveId.ROAR);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.use(MoveId.METRONOME);
    await game.toEndOfTurn();

    const isVisible = enemyPokemon.visible;
    const hasFled = enemyPokemon.switchOutStatus;
    expect(isVisible).toBe(false);
    expect(hasFled).toBe(true);

    await game.toNextTurn();
  });
});
