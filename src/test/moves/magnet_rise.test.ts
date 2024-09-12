import { CommandPhase } from "#app/phases/command-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Magnet Rise", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const moveToUse = Moves.MAGNET_RISE;

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
    game.override.battleType("single");
    game.override.starterSpecies(Species.MAGNEZONE);
    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyMoveset([Moves.DRILL_RUN, Moves.DRILL_RUN, Moves.DRILL_RUN, Moves.DRILL_RUN]);
    game.override.disableCrits();
    game.override.enemyLevel(1);
    game.override.moveset([moveToUse, Moves.SPLASH, Moves.GRAVITY, Moves.BATON_PASS]);
  });

  it("MAGNET RISE", async () => {
    await game.startBattle();

    const startingHp = game.scene.getParty()[0].hp;
    game.move.select(moveToUse);
    await game.phaseInterceptor.to(TurnEndPhase);
    const finalHp = game.scene.getParty()[0].hp;
    const hpLost = finalHp - startingHp;
    expect(hpLost).toBe(0);
  }, 20000);

  it("MAGNET RISE - Gravity", async () => {
    await game.startBattle();

    const startingHp = game.scene.getParty()[0].hp;
    game.move.select(moveToUse);
    await game.phaseInterceptor.to(CommandPhase);
    let finalHp = game.scene.getParty()[0].hp;
    let hpLost = finalHp - startingHp;
    expect(hpLost).toBe(0);
    game.move.select(Moves.GRAVITY);
    await game.phaseInterceptor.to(TurnEndPhase);
    finalHp = game.scene.getParty()[0].hp;
    hpLost = finalHp - startingHp;
    expect(hpLost).not.toBe(0);
  }, 20000);
});
