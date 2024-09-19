import { BattlerIndex } from "#app/battle";
import { allMoves } from "#app/data/move";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from "vitest";

describe("Moves - Whirlwind", () => {
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
      .battleType("single")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.WHIRLWIND)
      .enemySpecies(Species.PIDGEY);
  });

  it.each([
    { move: Moves.FLY, name: "Fly" },
    { move: Moves.BOUNCE, name: "Bounce" },
    { move: Moves.SKY_DROP, name: "Sky Drop" },
  ])("should not hit a flying target: $name (=$move)", async ({ move }) => {
    game.override.moveset([move]);
    await game.classicMode.startBattle([Species.STARAPTOR]);

    const staraptor = game.scene.getPlayerPokemon()!;
    const whirlwind = allMoves[Moves.WHIRLWIND];
    vi.spyOn(whirlwind, "getFailedText");

    game.move.select(move);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(staraptor.findTag((t) => t.tagType === BattlerTagType.FLYING)).toBeDefined();
    expect(whirlwind.getFailedText).toHaveBeenCalledOnce();
  });
});
