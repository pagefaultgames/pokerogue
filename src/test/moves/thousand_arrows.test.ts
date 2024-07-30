import { Abilities } from "#app/enums/abilities.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import {
  BerryPhase,
  MoveEffectPhase
} from "#app/phases";
import GameManager from "#app/test/utils/gameManager";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Moves - Thousand Arrows", () => {
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
    game.override.battleType("single");
    game.override.enemySpecies(Species.TOGETIC);
    game.override.startingLevel(100);
    game.override.enemyLevel(100);
    game.override.moveset([ Moves.THOUSAND_ARROWS ]);
    game.override.enemyMoveset([Moves.SPLASH,Moves.SPLASH,Moves.SPLASH,Moves.SPLASH]);
  });

  it(
    "move should hit and ground Flying-type targets",
    async () => {
      await game.startBattle([ Species.ILLUMISE ]);

      const enemyPokemon = game.scene.getEnemyPokemon();

      game.doAttack(getMovePosition(game.scene, 0, Moves.THOUSAND_ARROWS));

      await game.phaseInterceptor.to(MoveEffectPhase, false);
      // Enemy should not be grounded before move effect is applied
      expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeUndefined();

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    }, TIMEOUT
  );

  it(
    "move should hit and ground targets with Levitate",
    async () => {
      game.override.enemySpecies(Species.SNORLAX);
      game.override.enemyAbility(Abilities.LEVITATE);

      await game.startBattle([ Species.ILLUMISE ]);

      const enemyPokemon = game.scene.getEnemyPokemon();

      game.doAttack(getMovePosition(game.scene, 0, Moves.THOUSAND_ARROWS));

      await game.phaseInterceptor.to(MoveEffectPhase, false);
      // Enemy should not be grounded before move effect is applied
      expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeUndefined();

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    }, TIMEOUT
  );

  it(
    "move should hit and ground targets under the effects of Magnet Rise",
    async () => {
      game.override.enemySpecies(Species.SNORLAX);

      await game.startBattle([ Species.ILLUMISE ]);

      const enemyPokemon = game.scene.getEnemyPokemon();

      enemyPokemon.addTag(BattlerTagType.MAGNET_RISEN, null, Moves.MAGNET_RISE);

      game.doAttack(getMovePosition(game.scene, 0, Moves.THOUSAND_ARROWS));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(enemyPokemon.getTag(BattlerTagType.MAGNET_RISEN)).toBeUndefined();
      expect(enemyPokemon.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
      expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    }
  );
});
