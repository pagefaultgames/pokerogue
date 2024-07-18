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
import { WeatherType } from "#app/data/weather";
import { SeedTag } from "#app/data/battler-tags";
import { ArenaTagType } from "#enums/arena-tag-type";
import { ArenaTagSide } from "#app/data/arena-tag";
import { BattlerTagType } from "#enums/battler-tag-type";

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
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.HEAL_BLOCK, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH ]);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NO_GUARD);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
  });

  //Bulbapedia Reference: https://bulbapedia.bulbagarden.net/wiki/Heal_Block_(move)

  test("Heal Block lasts 5 turns on the afflicted Pokemon",
    async() => {
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH ]);

      await game.startBattle([Species.MAGIKARP]);

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.HEAL_BLOCK));
      await game.phaseInterceptor.to(TurnEndPhase);

      let count = 1;
      expect(enemyPokemon.getTag(BattlerTagType.HEAL_BLOCK)).toBeDefined();
      while (enemyPokemon.getTag(BattlerTagType.HEAL_BLOCK)) {
        game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
        await game.phaseInterceptor.to(TurnEndPhase);
        count++;
      }
      /**
    * Expect:
    * - The enemy Pokemon has Heal Block
    * - Heal Block lasts 5 turns
    */
      expect(count).toBe(5);
    }, TIMEOUT
  );


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

      /**
    * Expect:
    * - The player Pokemon has taken damage from the HP-draining move
    * - The enemy Pokemon (Heal Block applied) has not recovered HP
    */
      expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp()-PREDAMAGE);
  	}, TIMEOUT
  );

  test("Liquid Ooze damage should still happen under Heal Block",
    async() => {
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.ABSORB, Moves.ABSORB, Moves.ABSORB, Moves.ABSORB ]);
      vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.LIQUID_OOZE);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.HEAL_BLOCK));
      await game.phaseInterceptor.to(TurnEndPhase);

      /**
    * Expect:
    * - The player Pokemon has taken damage from the HP-draining move
    * - The enemy Pokemon (Heal Block applied) has not recovered HP and instead is damaged by Liquid Ooze
    */
      expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    }, TIMEOUT
  );

  test("Wish's heal will fail under Heal Block",
    async() => {
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.HEAL_BLOCK, Moves.HEAL_BLOCK, Moves.HEAL_BLOCK, Moves.HEAL_BLOCK ]);
      vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.WISH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH ]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      leadPokemon.hp = leadPokemon.getMaxHp()-PREDAMAGE;

      game.doAttack(getMovePosition(game.scene, 0, Moves.WISH));
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(game.scene.arena.getTagOnSide(ArenaTagType.WISH, ArenaTagSide.PLAYER)).toBeDefined();
      while (game.scene.arena.getTagOnSide(ArenaTagType.WISH, ArenaTagSide.PLAYER)) {
        game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
        await game.phaseInterceptor.to(TurnEndPhase);
      }

      /**
    * Expect:
    * - ArenaTagType.WISH is present during this test run
    * - When Wish activates, the Pokemon targeted failed to recover HP because of Heal Block
    */
      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp()-PREDAMAGE);
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

      /**
    * Expect:
    * - leadPokemon (no Heal Block) recovers HP
    * - enemyPokemon (Heal Block) does not recover HP
    */
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

      /**
    * Expect:
    * - enemyPokemon (Heal Block) does not recover HP from Aqua Ring
    * - enemyPokemon has BattlerTagType.AQUA_RING
    */
      expect(enemyPokemon.getTag(BattlerTagType.AQUA_RING)).toBeDefined();
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp()-PREDAMAGE);
  	}, TIMEOUT
  );

  test("Abilities that restore HP on the field will fail and not restore HP",
    async() => {
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH ]);
      vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.RAIN_DISH);
      vi.spyOn(overrides, "WEATHER_OVERRIDE", "get").mockReturnValue(WeatherType.RAIN);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      enemyPokemon.hp = enemyPokemon.getMaxHp()-PREDAMAGE;

      game.doAttack(getMovePosition(game.scene, 0, Moves.HEAL_BLOCK));
      await game.phaseInterceptor.to(TurnEndPhase);

      /**
    * Expect:
    * - enemyPokemon (Heal Block) does not recover HP from its ability
    */
      expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp()-PREDAMAGE);
    }, TIMEOUT
  );

  test("Leech Seed will continue to damage the seeded Pokemon, but will not restore HP to the Pokemon under Heal Block",
    async() => {
      vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.LEECH_SEED, Moves.LEECH_SEED, Moves.LEECH_SEED, Moves.LEECH_SEED ]);
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.HEAL_BLOCK, Moves.HEAL_BLOCK, Moves.HEAL_BLOCK, Moves.HEAL_BLOCK ]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();
      leadPokemon.hp = leadPokemon.getMaxHp()-PREDAMAGE;

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.LEECH_SEED));
      await game.phaseInterceptor.to(TurnEndPhase);

      /**
    * Expect:
    * - enemyPokemon (no Heal Block) is seeded
    * - enemyPokemon (no Heal Block) loses HP from seeded status
    * - leadPokemon (Heal Block) does not recover HP
    */
      expect(enemyPokemon.getTag(SeedTag)).toBeDefined();
      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp()-PREDAMAGE);
      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    }, TIMEOUT
  );

  test("Leftovers will not heal with Heal Block active",
    async() => {
      vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "LEFTOVERS", count: 1}]);
      vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH ]);
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.HEAL_BLOCK, Moves.HEAL_BLOCK, Moves.HEAL_BLOCK, Moves.HEAL_BLOCK ]);

      await game.startBattle([Species.MAGIKARP]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();
      leadPokemon.hp = leadPokemon.getMaxHp()-PREDAMAGE;

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      await game.phaseInterceptor.to(TurnEndPhase);

      /**
    * Expect:
    * - leadPokemon (Heal Block) does not recover HP from leftovers item
    */
      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp()-PREDAMAGE);
    }, TIMEOUT
  );

  test("Shell Bell will not heal with Heal Block active",
    async() => {
      vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "SHELL_BELL", count: 1}]);
      vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE ]);
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.HEAL_BLOCK, Moves.HEAL_BLOCK, Moves.HEAL_BLOCK, Moves.HEAL_BLOCK ]);

      await game.startBattle([Species.SHUCKLE]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();
      leadPokemon.hp = leadPokemon.getMaxHp()-PREDAMAGE;

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));
      await game.phaseInterceptor.to(TurnEndPhase);

      /**
    * Expect:
    * - leadPokemon (Heal Block) does not recover HP from attacking holding shell bell item
    * - enemyPokemon lost HP from leadPokemon's attack
    */
      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp()-PREDAMAGE);
      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    }, TIMEOUT
  );
});
