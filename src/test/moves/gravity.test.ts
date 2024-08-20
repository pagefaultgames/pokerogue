import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "#test/utils/gameManager";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { ArenaTagType } from "#app/enums/arena-tag-type.js";
import { ArenaTagSide } from "#app/data/arena-tag.js";

const TIMEOUT = 20 * 1000;

describe("Moves - Beak Blast", () => {
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
      .ability(Abilities.BALL_FETCH)
      .moveset([Moves.GRAVITY, Moves.GROWL])
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Array(4).fill(Moves.GROWL)) // cannot use Splash because Gravity blocks Splash from being selected.
      .startingLevel(100)
      .enemyLevel(100);
  });

  it(
    "should last for 5 turns on both sides",
    async () => {
      await game.startBattle([Species.RATTATA]);

      game.doAttack(getMovePosition(game.scene, 0, Moves.GRAVITY));

      for (let i = 0; i < 4; i++) { // Gravity tag should be defined for 5 turns (1 turn before this loop, 4 turns from this loop)
        await game.toNextTurn();
        expect(game.scene.arena.getTagOnSide(ArenaTagType.GRAVITY, ArenaTagSide.PLAYER)).toBeDefined();
        expect(game.scene.arena.getTagOnSide(ArenaTagType.GRAVITY, ArenaTagSide.ENEMY)).toBeDefined();
        game.doAttack(getMovePosition(game.scene, 0, Moves.GROWL));
      }

      await game.toNextTurn();
      expect(game.scene.arena.getTagOnSide(ArenaTagType.GRAVITY, ArenaTagSide.PLAYER)).toBeUndefined();
      expect(game.scene.arena.getTagOnSide(ArenaTagType.GRAVITY, ArenaTagSide.ENEMY)).toBeUndefined();

    }, TIMEOUT
  );
});
