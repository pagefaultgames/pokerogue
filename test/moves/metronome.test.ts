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
import type { RandomMoveAttr } from "#moves/move";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Metronome", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  let randomMoveAttr: RandomMoveAttr;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    randomMoveAttr = allMoves[MoveId.METRONOME].getAttrs("RandomMoveAttr")[0];
    game = new GameManager(phaserGame);
    game.override
      .moveset([MoveId.METRONOME, MoveId.SPLASH])
      .battleStyle("single")
      .startingLevel(100)
      .enemyLevel(100)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  it("should have one semi-invulnerable turn and deal damage on the second turn when a semi-invulnerable move is called", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);
    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(MoveId.DIVE);

    game.move.select(MoveId.METRONOME);
    await game.toNextTurn();

    expect(player.getTag(SemiInvulnerableTag)).toBeTruthy();

    await game.toNextTurn();
    expect(player.getTag(SemiInvulnerableTag)).toBeFalsy();
    expect(enemy.isFullHp()).toBeFalsy();
  });

  it("should apply secondary effects of a move", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);
    const player = game.field.getPlayerPokemon();
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(MoveId.WOOD_HAMMER);

    game.move.select(MoveId.METRONOME);
    await game.toNextTurn();

    expect(player.isFullHp()).toBeFalsy();
  });

  it("should recharge after using recharge move", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);
    const player = game.field.getPlayerPokemon();
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(MoveId.HYPER_BEAM);
    vi.spyOn(allMoves[MoveId.HYPER_BEAM], "accuracy", "get").mockReturnValue(100);

    game.move.select(MoveId.METRONOME);
    await game.toNextTurn();

    expect(player.getTag(RechargingTag)).toBeTruthy();
  });

  it("should charge for charging moves while still maintaining follow-up status", async () => {
    game.override.moveset([]).enemyMoveset(MoveId.SPITE);
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(MoveId.SOLAR_BEAM);
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    const player = game.field.getPlayerPokemon();
    game.move.changeMoveset(player, [MoveId.METRONOME, MoveId.SOLAR_BEAM]);

    const [metronomeMove, solarBeamMove] = player.getMoveset();
    expect(metronomeMove).toBeDefined();
    expect(solarBeamMove).toBeDefined();

    game.move.select(MoveId.METRONOME);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(player.getTag(BattlerTagType.CHARGING)).toBeTruthy();
    const turn1PpUsed = metronomeMove.ppUsed;
    expect.soft(turn1PpUsed).toBeGreaterThan(1);
    expect(solarBeamMove.ppUsed).toBe(0);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(player.getTag(BattlerTagType.CHARGING)).toBeFalsy();
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
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(MoveId.AROMATIC_MIST);

    game.move.select(MoveId.METRONOME, 0);
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    expect(rightPlayer.getStatStage(Stat.SPDEF)).toBe(1);
    expect(leftPlayer.getStatStage(Stat.SPDEF)).toBe(0);
    expect(leftOpp.getStatStage(Stat.SPDEF)).toBe(0);
    expect(rightOpp.getStatStage(Stat.SPDEF)).toBe(0);
  });

  it("should cause opponent to flee, and not crash for Roar", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(MoveId.ROAR);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.METRONOME);
    await game.phaseInterceptor.to("BerryPhase");

    const isVisible = enemyPokemon.visible;
    const hasFled = enemyPokemon.switchOutStatus;
    expect(!isVisible && hasFled).toBe(true);

    await game.toNextTurn();
  });
});
