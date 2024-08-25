import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { HitResult } from "#app/field/pokemon";
import { BerryPhase } from "#app/phases/berry-phase";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Abilities - Galvanize", () => {
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
      .startingLevel(100)
      .ability(Abilities.GALVANIZE)
      .moveset([Moves.TACKLE, Moves.REVELATION_DANCE])
      .enemySpecies(Species.DUSCLOPS)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(SPLASH_ONLY)
      .enemyLevel(100);
  });

  it(
    "should change Normal-type attacks to Electric type",
    async () => {
      await game.startBattle();

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      vi.spyOn(enemyPokemon, "apply");

      game.move.select(Moves.TACKLE);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(enemyPokemon.apply).toHaveReturnedWith(HitResult.EFFECTIVE);
      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    }, TIMEOUT
  );

  it(
    "should cause Normal-type attacks to activate Volt Absorb",
    async () => {
      game.override.enemyAbility(Abilities.VOLT_ABSORB);

      await game.startBattle();

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      vi.spyOn(enemyPokemon, "apply");

      enemyPokemon.hp = Math.floor(enemyPokemon.getMaxHp() * 0.8);

      game.move.select(Moves.TACKLE);

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(enemyPokemon.apply).toHaveReturnedWith(HitResult.NO_EFFECT);
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    }, TIMEOUT
  );

  it(
    "should not change the type of variable-type moves",
    async () => {
      game.override.enemySpecies(Species.MIGHTYENA);

      await game.startBattle([Species.ESPEON]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;
      vi.spyOn(enemyPokemon, "apply");

      game.move.select(Moves.REVELATION_DANCE);
      await game.phaseInterceptor.to(BerryPhase, false);

      expect(enemyPokemon.apply).toHaveReturnedWith(HitResult.NO_EFFECT);
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    }
  );
});
