import {afterEach, beforeAll, beforeEach, describe, expect, test, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import {
  TurnEndPhase,
} from "#app/phases";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";

const TIMEOUT = 20 * 1000;
const PREDAMAGE = 50;

describe("Moves - Heal Block", () => {
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
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.HEAL_BLOCK, Moves.SPLASH, Moves.TACKLE, Moves.SPLASH ]);
  });

  test("HP-draining moves should still inflict damage, but fail to restore HP",
  	async() => {
  		vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.ABSORB, Moves.ABSORB, Moves.ABSORB, Moves.ABSORB ]);

  	 	await game.startBattle([Species.MAGIKARP]);

     	const leadPokemon = game.scene.getPlayerPokemon();
    	expect(leadPokemon).toBeDefined();

    	const enemyPokemon = game.scene.getEnemyPokemon();
      	expect(enemyPokemon).toBeDefined();

      	enemyPokemon.hp = enemyPokemon.getMaxHp()-PREDAMAGE;

      	game.doAttack(getMovePosition(game.scene, 0, Moves.HEAL_BLOCK));
      	await game.phaseInterceptor.to(TurnEndPhase);

      	expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
      	expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp()-PREDAMAGE);
  	}, TIMEOUT
  );

  test("Grassy Terrain will fail to restore HP to Pokemon under Heal Block",
  	async() => {
  		vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH ]);
  		vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.GRASSY_SURGE);

  	 	await game.startBattle([Species.MAGIKARP]);

     	const leadPokemon = game.scene.getPlayerPokemon();
    	expect(leadPokemon).toBeDefined();

    	const enemyPokemon = game.scene.getEnemyPokemon();
      	expect(enemyPokemon).toBeDefined();

      	leadPokemon.hp = leadPokemon.getMaxHp()-PREDAMAGE;
      	enemyPokemon.hp = enemyPokemon.getMaxHp()-PREDAMAGE;

      	game.doAttack(getMovePosition(game.scene, 0, Moves.HEAL_BLOCK));
      	await game.phaseInterceptor.to(TurnEndPhase);

      	expect(leadPokemon.hp).toBeGreaterThan(leadPokemon.getMaxHp()-PREDAMAGE);
      	expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp()-PREDAMAGE);
  	}, TIMEOUT
  );

  test("HP-recovery move-states will fail to restore HP",
  	async() => {
  		vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.AQUA_RING, Moves.AQUA_RING, Moves.AQUA_RING, Moves.AQUA_RING ]);

  	 	await game.startBattle([Species.MAGIKARP]);

     	const leadPokemon = game.scene.getPlayerPokemon();
    	expect(leadPokemon).toBeDefined();

    	const enemyPokemon = game.scene.getEnemyPokemon();
      	expect(enemyPokemon).toBeDefined();

      	enemyPokemon.hp = enemyPokemon.getMaxHp()-PREDAMAGE;

      	game.doAttack(getMovePosition(game.scene, 0, Moves.HEAL_BLOCK));
      	await game.phaseInterceptor.to(TurnEndPhase);

      	expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp()-PREDAMAGE);
  	}, TIMEOUT
  );



});
