import { CommandPhase } from "#app/phases/command-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Magnet Rise", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const moveToUse = MoveId.MAGNET_RISE;

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
      .battleStyle("single")
      .starterSpecies(SpeciesId.MAGNEZONE)
      .enemySpecies(SpeciesId.RATTATA)
      .enemyMoveset(MoveId.DRILL_RUN)
      .criticalHits(false)
      .enemyLevel(1)
      .moveset([moveToUse, MoveId.SPLASH, MoveId.GRAVITY, MoveId.BATON_PASS]);
  });

  it("MAGNET RISE", async () => {
    await game.classicMode.startBattle();

    const startingHp = game.scene.getPlayerParty()[0].hp;
    game.move.select(moveToUse);
    await game.phaseInterceptor.to(TurnEndPhase);
    const finalHp = game.scene.getPlayerParty()[0].hp;
    const hpLost = finalHp - startingHp;
    expect(hpLost).toBe(0);
  });

  it("MAGNET RISE - Gravity", async () => {
    await game.classicMode.startBattle();

    const startingHp = game.scene.getPlayerParty()[0].hp;
    game.move.select(moveToUse);
    await game.phaseInterceptor.to(CommandPhase);
    let finalHp = game.scene.getPlayerParty()[0].hp;
    let hpLost = finalHp - startingHp;
    expect(hpLost).toBe(0);
    game.move.select(MoveId.GRAVITY);
    await game.phaseInterceptor.to(TurnEndPhase);
    finalHp = game.scene.getPlayerParty()[0].hp;
    hpLost = finalHp - startingHp;
    expect(hpLost).not.toBe(0);
  });
});
