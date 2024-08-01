import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import Overrides from "#app/overrides";
import { Species } from "#app/enums/species.js";
import { Moves } from "#app/enums/moves.js";
import { Abilities } from "#app/enums/abilities.js";
import { getMovePosition } from "../utils/gameManagerUtils";
import { MoveEffectPhase } from "#app/phases.js";
import { StatusEffect } from "#app/enums/status-effect.js";

const TIMEOUT = 20 * 1000; // 20 sec timeout

describe("Moves - Beat Up", () => {
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
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");

    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(Overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.SPLASH));
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);

    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.BEAT_UP]);
  });

  it(
    "should hit once for each healthy player Pokemon",
    async () => {
      await game.startBattle([Species.MAGIKARP, Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE, Species.PIKACHU, Species.EEVEE]);

      const playerPokemon = game.scene.getPlayerPokemon();
      const enemyPokemon = game.scene.getEnemyPokemon();
      let enemyStartingHp = enemyPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.BEAT_UP));

      await game.phaseInterceptor.to(MoveEffectPhase);

      expect(playerPokemon.turnData.hitCount).toBe(6);
      expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);

      while (playerPokemon.turnData.hitsLeft > 0) {
        enemyStartingHp = enemyPokemon.hp;
        await game.phaseInterceptor.to(MoveEffectPhase);
        expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
      }
    }, TIMEOUT
  );

  it(
    "should not count player Pokemon with status effects towards hit count",
    async () => {
      await game.startBattle([Species.MAGIKARP, Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE, Species.PIKACHU, Species.EEVEE]);

      const playerPokemon = game.scene.getPlayerPokemon();

      game.scene.getParty()[1].trySetStatus(StatusEffect.BURN);

      game.doAttack(getMovePosition(game.scene, 0, Moves.BEAT_UP));

      await game.phaseInterceptor.to(MoveEffectPhase);

      expect(playerPokemon.turnData.hitCount).toBe(5);
    }, TIMEOUT
  );

  it(
    "should hit twice for each player Pokemon if the user has Multi-Lens",
    async () => {
      vi.spyOn(Overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "MULTI_LENS", count: 1}]);
      await game.startBattle([Species.MAGIKARP, Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE, Species.PIKACHU, Species.EEVEE]);

      const playerPokemon = game.scene.getPlayerPokemon();
      const enemyPokemon = game.scene.getEnemyPokemon();
      let enemyStartingHp = enemyPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.BEAT_UP));

      await game.phaseInterceptor.to(MoveEffectPhase);

      expect(playerPokemon.turnData.hitCount).toBe(12);
      expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);

      while (playerPokemon.turnData.hitsLeft > 0) {
        enemyStartingHp = enemyPokemon.hp;
        await game.phaseInterceptor.to(MoveEffectPhase);
        expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
      }
    }, TIMEOUT
  );
});
