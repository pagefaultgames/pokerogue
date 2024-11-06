import { BattlerTagType } from "#enums/battler-tag-type";
import { BattlerIndex } from "#app/battle";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Encore", () => {
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
      .moveset([ Moves.SPLASH, Moves.ENCORE ])
      .ability(Abilities.BALL_FETCH)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([ Moves.SPLASH, Moves.TACKLE ])
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should prevent the target from using any move except the last used move", async () => {
    await game.classicMode.startBattle([ Species.SNORLAX ]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.ENCORE);
    await game.forceEnemyMove(Moves.SPLASH);

    await game.toNextTurn();
    expect(enemyPokemon.getTag(BattlerTagType.ENCORE)).toBeDefined();

    game.move.select(Moves.SPLASH);
    // The enemy AI would normally be inclined to use Tackle, but should be
    // forced into using Splash.
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon.getLastXMoves().every(turnMove => turnMove.move === Moves.SPLASH)).toBeTruthy();
  });

  describe("should fail against the following moves:", () => {
    it.each([
      { moveId: Moves.TRANSFORM, name: "Transform", delay: false },
      { moveId: Moves.MIMIC, name: "Mimic", delay: true },
      { moveId: Moves.SKETCH, name: "Sketch", delay: true },
      { moveId: Moves.ENCORE, name: "Encore", delay: false },
      { moveId: Moves.STRUGGLE, name: "Struggle", delay: false }
    ])("$name", async ({ moveId, delay }) => {
      game.override.enemyMoveset(moveId);

      await game.classicMode.startBattle([ Species.SNORLAX ]);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      if (delay) {
        game.move.select(Moves.SPLASH);
        await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
        await game.toNextTurn();
      }

      game.move.select(Moves.ENCORE);

      const turnOrder = delay
        ? [ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]
        : [ BattlerIndex.ENEMY, BattlerIndex.PLAYER ];
      await game.setTurnOrder(turnOrder);

      await game.phaseInterceptor.to("BerryPhase", false);
      expect(playerPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
      expect(enemyPokemon.getTag(BattlerTagType.ENCORE)).toBeUndefined();
    });
  });

  it("Pokemon under both Encore and Torment should alternate between Struggle and restricted move", async () => {
    const turnOrder = [ BattlerIndex.ENEMY, BattlerIndex.PLAYER ];
    game.override.moveset([ Moves.ENCORE, Moves.TORMENT, Moves.SPLASH ]);
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    const enemyPokemon = game.scene.getEnemyPokemon();
    game.move.select(Moves.ENCORE);
    await game.setTurnOrder(turnOrder);
    await game.phaseInterceptor.to("BerryPhase");
    expect(enemyPokemon?.getTag(BattlerTagType.ENCORE)).toBeDefined();

    await game.toNextTurn();
    game.move.select(Moves.TORMENT);
    await game.setTurnOrder(turnOrder);
    await game.phaseInterceptor.to("BerryPhase");
    expect(enemyPokemon?.getTag(BattlerTagType.TORMENT)).toBeDefined();

    await game.toNextTurn();
    game.move.select(Moves.SPLASH);
    await game.setTurnOrder(turnOrder);
    await game.phaseInterceptor.to("BerryPhase");
    const lastMove = enemyPokemon?.getLastXMoves()[0];
    expect(lastMove?.move).toBe(Moves.STRUGGLE);
  });
});
