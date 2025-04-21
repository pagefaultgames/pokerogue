import { Stat } from "#app/enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Entrainment", () => {
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
      .moveset([Moves.SPLASH, Moves.ENTRAINMENT])
      .ability(Abilities.ADAPTABILITY)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("gives its ability to the target", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.ENTRAINMENT);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getEnemyPokemon()?.getAbility().id).toBe(Abilities.ADAPTABILITY);
  });

  it("should activate post-summon abilities", async () => {
    game.override.ability(Abilities.INTIMIDATE);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.ENTRAINMENT);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerPokemon()?.getStatStage(Stat.ATK)).toBe(-1);
  });
});
