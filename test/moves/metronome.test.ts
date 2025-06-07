import { BattlerIndex } from "#app/battle";
import { RechargingTag, SemiInvulnerableTag } from "#app/data/battler-tags";
import { RandomMoveAttr } from "#app/data/moves/move";
import { allMoves } from "#app/data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { Stat } from "#app/enums/stat";
import { MoveResult } from "#app/field/pokemon";
import { CommandPhase } from "#app/phases/command-phase";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
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
    randomMoveAttr = allMoves[MoveId.METRONOME].getAttrs(RandomMoveAttr)[0];
    game = new GameManager(phaserGame);
    game.override
      .moveset([MoveId.METRONOME, MoveId.SPLASH])
      .battleStyle("single")
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.STURDY);
  });

  it("should not be able to copy Moves.NONE", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    // Pick the first move available to use
    const player = game.field.getPlayerPokemon();
    vi.spyOn(player, "randBattleSeedInt").mockReturnValue(0);
    game.move.select(MoveId.METRONOME);
    await game.toNextTurn();

    const lastMoveStr = MoveId[player.getLastXMoves()[0].move];
    expect(lastMoveStr).not.toBe(MoveId[MoveId.NONE]);
    expect(lastMoveStr).toBe(MoveId[1]);
  });

  it("should become semi-invulnerable when using phasing moves", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);
    vi.spyOn(randomMoveAttr, "getMove").mockReturnValue(MoveId.DIVE);

    const player = game.scene.getPlayerPokemon()!;
    expect(player.getTag(SemiInvulnerableTag)).toBeUndefined();
    expect(player.visible).toBe(true);

    game.move.select(MoveId.METRONOME);
    await game.toNextTurn();

    expect(player.getTag(SemiInvulnerableTag)).toBeDefined();
    expect(player.visible).toBe(false);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(player.getTag(SemiInvulnerableTag)).toBeUndefined();
    expect(player.visible).toBe(true);

    const enemy = game.scene.getEnemyPokemon()!;
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });

  it("should apply secondary effects of the called move", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);
    vi.spyOn(randomMoveAttr, "getMove").mockReturnValue(MoveId.WOOD_HAMMER);

    game.move.select(MoveId.METRONOME);
    await game.toNextTurn();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    expect(player.hp).toBeLessThan(player.getMaxHp());
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });

  it("should count as last move used for Copycat/Mirror Move", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);
    vi.spyOn(randomMoveAttr, "getMove").mockReturnValue(MoveId.ABSORB);

    game.move.select(MoveId.METRONOME);
    await game.move.forceEnemyMove(MoveId.MIRROR_MOVE)
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    expect(player.hp).toBeLessThan(player.getMaxHp());
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
    expect(enemy.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
  });

  it("should recharge after using recharge moves", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);
    const player = game.scene.getPlayerPokemon()!;
    vi.spyOn(randomMoveAttr, "getMove").mockReturnValue(MoveId.HYPER_BEAM);
    vi.spyOn(allMoves[MoveId.HYPER_BEAM], "accuracy", "get").mockReturnValue(100);

    game.move.select(MoveId.METRONOME);
    await game.toNextTurn();

    expect(player.getTag(RechargingTag)).toBeDefined();
  });

  it("should only target ally for Aromatic Mist", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.REGIELEKI, SpeciesId.RATTATA]);

    const [leftPlayer, rightPlayer] = game.scene.getPlayerField();
    const [leftOpp, rightOpp] = game.scene.getEnemyField();
    vi.spyOn(randomMoveAttr, "getMove").mockReturnValue(MoveId.AROMATIC_MIST);

    game.move.select(MoveId.METRONOME, 0);
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    expect(rightPlayer.getStatStage(Stat.SPDEF)).toBe(1);
    expect(leftPlayer.getStatStage(Stat.SPDEF)).toBe(0);
    expect(leftOpp.getStatStage(Stat.SPDEF)).toBe(0);
    expect(rightOpp.getStatStage(Stat.SPDEF)).toBe(0);
  });

  it("should cause opponent to flee when using Roar", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);
    vi.spyOn(randomMoveAttr, "getMove").mockReturnValue(MoveId.ROAR);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.METRONOME);
    await game.phaseInterceptor.to("BerryPhase");

    const isVisible = enemyPokemon.visible;
    const hasFled = enemyPokemon.switchOutStatus;
    expect(isVisible).toBe(false);
    expect(hasFled).toBe(true);

    await game.toNextTurn(); // Check no crash
  });
});
