import { BattlerTagType } from "#app/enums/battler-tag-type";
import { allMoves } from "#app/data/move";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from "vitest";

describe("Moves - Telekinesis", () => {
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
      .moveset([ Moves.TELEKINESIS, Moves.TACKLE, Moves.MUD_SHOT ])
      .battleType("single")
      .enemySpecies(Species.SNORLAX)
      .enemyLevel(60)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("test case", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const enemyOpponent = game.scene.getEnemyPokemon();
    expect(enemyOpponent).toBeDefined();

    game.move.select(Moves.TELEKINESIS);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent?.getTag(BattlerTagType.TELEKINESIS)).toBeDefined();
    expect(enemyOpponent?.getTag(BattlerTagType.FLOATING)).toBeDefined();

    await game.toNextTurn();
    vi.spyOn(allMoves[Moves.TACKLE], "accuracy", "get").mockReturnValue(0);
    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent?.hp).toBeLessThan(enemyOpponent?.getMaxHp()!);
  });
});
