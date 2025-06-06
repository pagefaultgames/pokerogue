import { MoveId } from "#enums/move-id";
import { AbilityId } from "#enums/ability-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
      .battleStyle("single")
      .enemySpecies(SpeciesId.BULBASAUR)
      .enemyAbility(AbilityId.CONTRARY)
      .ability(AbilityId.INTIMIDATE)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should invert stat changes when applied", async () => {
    await game.classicMode.startBattle([SpeciesId.SLOWBRO]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  }, 20000);

  describe("With Clear Body", () => {
    it("should apply positive effects", async () => {
      game.override.enemyPassiveAbility(AbilityId.CLEAR_BODY).moveset([MoveId.TAIL_WHIP]);
      await game.classicMode.startBattle([SpeciesId.SLOWBRO]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);

      game.move.select(MoveId.TAIL_WHIP);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(enemyPokemon.getStatStage(Stat.DEF)).toBe(1);
    });

    it("should block negative effects", async () => {
      game.override.enemyPassiveAbility(AbilityId.CLEAR_BODY).enemyMoveset(MoveId.HOWL).moveset([MoveId.SPLASH]);
      await game.classicMode.startBattle([SpeciesId.SLOWBRO]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);

      game.move.select(MoveId.SPLASH);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
    });
  });
});
