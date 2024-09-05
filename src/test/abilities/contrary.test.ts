import { Stat } from "#enums/stat";
import GameManager from "#test/utils/gameManager";
import { Abilities } from "#enums/abilities";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";
import { Moves } from "#app/enums/moves";

describe("Abilities - Contrary", () => {
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
      .enemySpecies(Species.BULBASAUR)
      .enemyAbility(Abilities.CONTRARY)
      .ability(Abilities.INTIMIDATE)
      .enemyMoveset(SPLASH_ONLY);
  });

  it("should invert stat changes when applied", async() => {
    await game.classicMode.startBattle([
      Species.SLOWBRO
    ]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  }, 20000);

  describe("With Clear Body", () => {
    it("should apply positive effects", async () => {
      game.override
        .enemyPassiveAbility(Abilities.CLEAR_BODY)
        .moveset([Moves.TAIL_WHIP]);
      await game.classicMode.startBattle([Species.SLOWBRO]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);

      game.move.select(Moves.TAIL_WHIP);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(1);
    });

    it("should block negative effects", async () => {
      game.override
        .enemyPassiveAbility(Abilities.CLEAR_BODY)
        .enemyMoveset([Moves.HOWL, Moves.HOWL, Moves.HOWL, Moves.HOWL])
        .moveset([Moves.SPLASH]);
      await game.classicMode.startBattle([Species.SLOWBRO]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);

      game.move.select(Moves.SPLASH);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
    });
  });
});
