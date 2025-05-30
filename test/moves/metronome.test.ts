import { BattlerIndex } from "#app/battle";
import { RechargingTag, SemiInvulnerableTag } from "#app/data/battler-tags";
import { RandomMoveAttr } from "#app/data/moves/move";
import { allMoves } from "#app/data/data-lists";
import { Abilities } from "#app/enums/abilities";
import { Stat } from "#app/enums/stat";
import { MoveResult } from "#app/field/pokemon";
import { CommandPhase } from "#app/phases/command-phase";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveUseType } from "#enums/move-use-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from "vitest";

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
    randomMoveAttr = allMoves[Moves.METRONOME].getAttrs(RandomMoveAttr)[0];
    game = new GameManager(phaserGame);
    game.override
      .moveset([Moves.METRONOME, Moves.SPLASH])
      .battleStyle("single")
      .startingLevel(100)
      .enemyLevel(100)
      .enemySpecies(Species.SHUCKLE)
      .enemyMoveset(Moves.SPLASH)
      .enemyAbility(Abilities.BALL_FETCH);
  });

  it("should have one semi-invulnerable turn and deal damage on the second turn when a semi-invulnerable move is called", async () => {
    await game.classicMode.startBattle([Species.REGIELEKI]);
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(Moves.DIVE);

    game.move.select(Moves.METRONOME);
    await game.toNextTurn();

    expect(player.getTag(SemiInvulnerableTag)).toBeTruthy();

    await game.toNextTurn();
    expect(player.getTag(SemiInvulnerableTag)).toBeFalsy();
    expect(enemy.isFullHp()).toBeFalsy();
  });

  it("should apply secondary effects of a move", async () => {
    await game.classicMode.startBattle([Species.REGIELEKI]);
    const player = game.scene.getPlayerPokemon()!;
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(Moves.WOOD_HAMMER);

    game.move.select(Moves.METRONOME);
    await game.toNextTurn();

    expect(player.isFullHp()).toBeFalsy();
  });

  it("should recharge after using recharge move", async () => {
    await game.classicMode.startBattle([Species.REGIELEKI]);
    const player = game.scene.getPlayerPokemon()!;
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(Moves.HYPER_BEAM);
    vi.spyOn(allMoves[Moves.HYPER_BEAM], "accuracy", "get").mockReturnValue(100);

    game.move.select(Moves.METRONOME);
    await game.toNextTurn();

    expect(player.getTag(RechargingTag)).toBeTruthy();
  });

  it("should charge for charging moves while still maintaining follow-up status", async () => {
    game.override.moveset([]).enemyMoveset(Moves.SPITE);
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(Moves.SOLAR_BEAM);
    await game.classicMode.startBattle([Species.REGIELEKI]);

    const player = game.scene.getPlayerPokemon()!;
    game.move.changeMoveset(player, [Moves.METRONOME, Moves.SOLAR_BEAM]);

    const [metronomeMove, solarBeamMove] = player.getMoveset();
    expect(metronomeMove).toBeDefined();
    expect(solarBeamMove).toBeDefined();

    game.move.select(Moves.METRONOME);
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
      move: Moves.SOLAR_BEAM,
      result: MoveResult.SUCCESS,
      useType: MoveUseType.FOLLOW_UP,
    });
  });

  it("should only target ally for Aromatic Mist", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([Species.REGIELEKI, Species.RATTATA]);
    const [leftPlayer, rightPlayer] = game.scene.getPlayerField();
    const [leftOpp, rightOpp] = game.scene.getEnemyField();
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(Moves.AROMATIC_MIST);

    game.move.select(Moves.METRONOME, 0);
    await game.phaseInterceptor.to(CommandPhase);
    game.move.select(Moves.SPLASH, 1);
    await game.toNextTurn();

    expect(rightPlayer.getStatStage(Stat.SPDEF)).toBe(1);
    expect(leftPlayer.getStatStage(Stat.SPDEF)).toBe(0);
    expect(leftOpp.getStatStage(Stat.SPDEF)).toBe(0);
    expect(rightOpp.getStatStage(Stat.SPDEF)).toBe(0);
  });

  it("should cause opponent to flee, and not crash for Roar", async () => {
    await game.classicMode.startBattle([Species.REGIELEKI]);
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(Moves.ROAR);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.METRONOME);
    await game.phaseInterceptor.to("BerryPhase");

    const isVisible = enemyPokemon.visible;
    const hasFled = enemyPokemon.switchOutStatus;
    expect(!isVisible && hasFled).toBe(true);

    await game.phaseInterceptor.to("CommandPhase");
  });
});
