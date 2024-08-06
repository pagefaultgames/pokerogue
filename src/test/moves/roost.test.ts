import { Abilities } from "#app/enums/abilities.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { Moves } from "#app/enums/moves.js";
import { Species } from "#app/enums/species.js";
import { MoveEffectPhase, TurnEndPhase } from "#app/phases.js";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { getMovePosition } from "#test/utils/gameManagerUtils";

const TIMEOUT = 20 * 1000;

describe("Moves - Roost", () => {
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
    game.override.enemySpecies(Species.STARAPTOR);
    game.override.enemyAbility(Abilities.INSOMNIA);
    game.override.startingLevel(100);
    game.override.enemyLevel(100);
    game.override.moveset([ Moves.STOMPING_TANTRUM ]);
    game.override.enemyMoveset([Moves.ROOST,Moves.ROOST,Moves.ROOST,Moves.ROOST]);
  });

  test(
    "move should ground the user until the end of turn",
    async () => {
      await game.startBattle([Species.MAGIKARP]);

      const enemyPokemon = game.scene.getEnemyPokemon();

      const enemyStartingHp = enemyPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.STOMPING_TANTRUM));

      await game.phaseInterceptor.to(MoveEffectPhase);

      expect(enemyPokemon.getTag(BattlerTagType.ROOSTED)).toBeDefined();

      await game.phaseInterceptor.to(TurnEndPhase);

      expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
      expect(enemyPokemon.getTag(BattlerTagType.ROOSTED)).toBeUndefined();
    }, TIMEOUT
  );
});
