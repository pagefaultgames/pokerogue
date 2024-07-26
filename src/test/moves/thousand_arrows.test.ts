import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import Overrides from "#app/overrides";
import {
  BerryPhase,
  MoveEffectPhase
} from "#app/phases";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { Abilities } from "#app/enums/abilities.js";

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
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.TOGETIC);
    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(Overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.THOUSAND_ARROWS ]);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH,Moves.SPLASH,Moves.SPLASH,Moves.SPLASH]);
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
      vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
      vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.LEVITATE);

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
      vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);

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
