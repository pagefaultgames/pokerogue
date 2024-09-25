import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BattlerTagType } from "#enums/battler-tag-type";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#app/battle";

describe("Moves - Aroma Veil", () => {
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
      .battleType("double")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([Moves.HEAL_BLOCK, Moves.IMPRISON, Moves.SPLASH])
      .enemySpecies(Species.SHUCKLE)
      .ability(Abilities.AROMA_VEIL)
      .moveset([Moves.GROWL]);
  });

  it("Aroma Veil protects the Pokemon's side against most Move Restriction Battler Tags", async () => {
    await game.classicMode.startBattle([Species.REGIELEKI, Species.BULBASAUR]);

    const party = game.scene.getParty()!;

    game.move.select(Moves.GROWL);
    game.move.select(Moves.GROWL);
    await game.forceEnemyMove(Moves.HEAL_BLOCK);
    await game.toNextTurn();
    for (const pokemon in party) {
      expect(pokemon.getTag(BattlerTagType.HEAL_BLOCK)).toBeUndefined();
    }
  });

  it("Aroma Veil does not protect against Imprison", async () => {
    await game.classicMode.startBattle([Species.REGIELEKI, Species.BULBASAUR]);

    const party = game.scene.getParty()!;

    game.move.select(Moves.GROWL);
    game.move.select(Moves.GROWL, 1);
    await game.forceEnemyMove(Moves.IMPRISON, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    expect(game.scene.arena.getTag(ArenaTagType.IMPRISON)).toBeDefined();
    for (const pokemon in party) {
      expect(pokemon.getTag(BattlerTagType.IMPRISON)).toBeDefined();
    }
  });
});
