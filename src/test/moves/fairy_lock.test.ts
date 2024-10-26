import { ArenaTagSide } from "#app/data/arena-tag";
import { ArenaTagType } from "#app/enums/arena-tag-type";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Fairy Lock", () => {
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
      .moveset([ Moves.FAIRY_LOCK, Moves.SPLASH ])
      .ability(Abilities.BALL_FETCH)
      .battleType("double")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([ Moves.SPLASH, Moves.U_TURN ]);
  });

  it("Applies Fairy Lock tag for one turn, then apply Trapped tag for one turn", async () => {
    await game.classicMode.startBattle([ Species.KLEFKI, Species.TYRUNT ]);
    const playerPokemon = game.scene.getPlayerField();
    const enemyField = game.scene.getEnemyField();

    game.move.select(Moves.FAIRY_LOCK);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.PLAYER)).toBeDefined();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.ENEMY)).toBeDefined();

    await game.toNextTurn();

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("BerryPhase");
    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.PLAYER)).not.toBeDefined();
    expect(game.scene.arena.getTagOnSide(ArenaTagType.FAIRY_LOCK, ArenaTagSide.ENEMY)).not.toBeDefined();

    expect(playerPokemon[0].getTag(BattlerTagType.TRAPPED)).toBeDefined();
    expect(playerPokemon[1].getTag(BattlerTagType.TRAPPED)).toBeDefined();
    expect(enemyField[0].getTag(BattlerTagType.TRAPPED)).toBeDefined();
    expect(enemyField[1].getTag(BattlerTagType.TRAPPED)).toBeDefined();

    await game.toNextTurn();
    expect(playerPokemon[0].getTag(BattlerTagType.TRAPPED)).not.toBeDefined();
    expect(playerPokemon[1].getTag(BattlerTagType.TRAPPED)).not.toBeDefined();
    expect(enemyField[0].getTag(BattlerTagType.TRAPPED)).not.toBeDefined();
    expect(enemyField[1].getTag(BattlerTagType.TRAPPED)).not.toBeDefined();
  });
});
