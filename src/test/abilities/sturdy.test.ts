import {afterEach, beforeAll, beforeEach, describe, expect, test, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {
  TurnEndPhase,
} from "#app/phases";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { EnemyPokemon } from "#app/field/pokemon.js";

const TIMEOUT = 20 * 1000;

describe("Abilities - Sturdy", () => {
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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);

    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.LUCARIO);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.CLOSE_COMBAT, Moves.FISSURE]);

    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.ARON);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(5);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.STURDY);
  });

  test(
    "Sturdy activates when user is at full HP",
    async () => {
      await game.startBattle();
      game.doAttack(getMovePosition(game.scene, 0, Moves.CLOSE_COMBAT));
      await game.phaseInterceptor.to(TurnEndPhase);
      expect(game.scene.getEnemyParty()[0].hp).toBe(1);
    },
    TIMEOUT
  );

  test(
    "Sturdy doesn't activate when user is not at full HP",
    async () => {
      await game.startBattle();
      const enemyPokemon: EnemyPokemon = game.scene.getEnemyParty()[0];
      enemyPokemon.hp = enemyPokemon.getMaxHp() - 1;
      game.doAttack(getMovePosition(game.scene, 0, Moves.CLOSE_COMBAT));
      await game.phaseInterceptor.to(TurnEndPhase);
      expect(enemyPokemon.hp).toBe(0);
      expect(enemyPokemon.isFainted()).toBe(true);
    },
    TIMEOUT
  );

  test(
    "Sturdy pokemon should be inmune to OHKO moves",
    async () => {
      await game.startBattle();
      game.doAttack(getMovePosition(game.scene, 0, Moves.FISSURE));
      await game.phaseInterceptor.to(TurnEndPhase);
      const enemyPokemon: EnemyPokemon = game.scene.getEnemyParty()[0];
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
    },
    TIMEOUT
  );

  test(
    "Sturdy is ignored by pokemon with `Abilities.MOLD_BREAKER`",
    async () => {
      vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.MOLD_BREAKER);

      await game.startBattle();
      game.doAttack(getMovePosition(game.scene, 0, Moves.CLOSE_COMBAT));
      await game.phaseInterceptor.to(TurnEndPhase);
      const enemyPokemon: EnemyPokemon = game.scene.getEnemyParty()[0];
      expect(enemyPokemon.hp).toBe(0);
      expect(enemyPokemon.isFainted()).toBe(true);
    },
    TIMEOUT
  );

});
