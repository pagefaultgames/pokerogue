import { BattlerIndex } from "#app/battle";
import { MovePhase } from "#app/phases/move-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const TIMEOUT = 20 * 1000;

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
      .moveset([Moves.SWORDS_DANCE, Moves.SPLASH])
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.DANCER)
      .enemyMoveset(Array(4).fill(Moves.VICTORY_DANCE));
  });

  // Reference Link: https://bulbapedia.bulbagarden.net/wiki/Dancer_(Ability)

  it("triggers when dance moves are used, doesn't consume extra PP", async () => {
    await game.classicMode.startBattle([Species.ORICORIO, Species.FEEBAS]);

    const [oricorio] = game.scene.getPlayerField();

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.SWORDS_DANCE, 1);
    await game.setTurnOrder([BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2]);
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
  }, TIMEOUT);
});
