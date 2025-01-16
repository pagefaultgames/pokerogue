import { BattlerIndex } from "#app/battle";
import type { MovePhase } from "#app/phases/move-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";


describe("Abilities - Dancer", () => {
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
      .moveset([ Moves.SWORDS_DANCE, Moves.SPLASH ])
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.DANCER)
      .enemyMoveset([ Moves.VICTORY_DANCE ]);
  });

  // Reference Link: https://bulbapedia.bulbagarden.net/wiki/Dancer_(Ability)

  it("triggers when dance moves are used, doesn't consume extra PP", async () => {
    await game.classicMode.startBattle([ Species.ORICORIO, Species.FEEBAS ]);

    const [ oricorio ] = game.scene.getPlayerField();

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SWORDS_DANCE, 1);
    await game.setTurnOrder([ BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2 ]);
    await game.phaseInterceptor.to("MovePhase");
    // immediately copies ally move
    await game.phaseInterceptor.to("MovePhase", false);
    let currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(oricorio);
    expect(currentPhase.move.moveId).toBe(Moves.SWORDS_DANCE);
    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to("MovePhase");
    // immediately copies enemy move
    await game.phaseInterceptor.to("MovePhase", false);
    currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(oricorio);
    expect(currentPhase.move.moveId).toBe(Moves.VICTORY_DANCE);
    await game.phaseInterceptor.to("BerryPhase");

    // doesn't use PP if copied move is also in moveset
    expect(oricorio.moveset[0]?.ppUsed).toBe(0);
  });

  // TODO: Enable after move-calling move rework
  it.todo("should not count as the last move used for mirror move/instruct", async () => {
    game.override
      .moveset([ Moves.FIERY_DANCE, Moves.REVELATION_DANCE ])
      .enemyMoveset([ Moves.INSTRUCT, Moves.MIRROR_MOVE, Moves.SPLASH ])
      .enemySpecies(Species.DIALGA)
      .enemyLevel(100);
    await game.classicMode.startBattle([ Species.ORICORIO, Species.FEEBAS ]);

    const [ oricorio ] = game.scene.getPlayerField();
    const [ , dialga2 ] = game.scene.getEnemyField();

    game.move.select(Moves.REVELATION_DANCE, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    game.move.select(Moves.FIERY_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.forceEnemyMove(Moves.INSTRUCT, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.MIRROR_MOVE, BattlerIndex.PLAYER);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("MovePhase"); // Oricorio rev dance
    await game.phaseInterceptor.to("MovePhase"); // Feebas fiery dance
    await game.phaseInterceptor.to("MovePhase"); // Oricorio fiery dance
    await game.phaseInterceptor.to("MoveEndPhase", false);
    expect(oricorio.getLastXMoves(-1)[0].move).toBe(Moves.REVELATION_DANCE); // dancer copied move doesn't appear in move history

    await game.phaseInterceptor.to("MovePhase"); // dialga 2 mirror moves oricorio
    await game.phaseInterceptor.to("MovePhase"); // calls instructed rev dance
    let currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(dialga2);
    expect(currentPhase.move.moveId).toBe(Moves.REVELATION_DANCE);

    await game.phaseInterceptor.to("MovePhase"); // dialga 1 instructs oricorio
    await game.phaseInterceptor.to("MovePhase");
    currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase.pokemon).toBe(oricorio);
    expect(currentPhase.move.moveId).toBe(Moves.REVELATION_DANCE);

  });
});
