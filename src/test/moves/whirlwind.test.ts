import { BattlerTagType } from "#app/enums/battler-tag-type";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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

    game.move.select(move);
    await game.toNextTurn();

    expect(staraptor.findTag((t) => t.tagType === BattlerTagType.FLYING)).toBeDefined();
    expect(game.scene.getEnemyPokemon()!.getLastXMoves(1)[0].result).toBe(MoveResult.MISS);
  });
});
