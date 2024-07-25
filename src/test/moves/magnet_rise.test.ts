import {beforeAll, afterEach, beforeEach, describe, vi, it, expect} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import Overrides from "#app/overrides";
import {Moves} from "#enums/moves";
import {Species} from "#enums/species";
import {CommandPhase, TurnEndPhase} from "#app/phases.js";

describe("Moves - Magnet Rise", () => {
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
    const moveToUse = Moves.MAGNET_RISE;
    game.override.battleType("single");
    game.override.starterSpecies(Species.MAGNEZONE);
    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyMoveset([Moves.DRILL_RUN, Moves.DRILL_RUN, Moves.DRILL_RUN, Moves.DRILL_RUN]);
    vi.spyOn(Overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(Overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(1);
    game.override.moveset([moveToUse, Moves.SPLASH, Moves.GRAVITY, Moves.BATON_PASS]);
  });

  it("MAGNET RISE", async () => {
    await game.startBattle();

    const startingHp = game.scene.getParty()[0].hp;
    game.doAttack(0);
    await game.phaseInterceptor.to(TurnEndPhase);
    const finalHp = game.scene.getParty()[0].hp;
    const hpLost = finalHp - startingHp;
    expect(hpLost).toBe(0);
  }, 20000);

  it("MAGNET RISE - Gravity", async () => {
    await game.startBattle();

    const startingHp = game.scene.getParty()[0].hp;
    game.doAttack(0);
    await game.phaseInterceptor.to(CommandPhase);
    let finalHp = game.scene.getParty()[0].hp;
    let hpLost = finalHp - startingHp;
    expect(hpLost).toBe(0);
    game.doAttack(2);
    await game.phaseInterceptor.to(TurnEndPhase);
    finalHp = game.scene.getParty()[0].hp;
    hpLost = finalHp - startingHp;
    expect(hpLost).not.toBe(0);
  }, 20000);
});
