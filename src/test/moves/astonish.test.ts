import { allMoves } from "#app/data/move.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { BerryPhase } from "#app/phases/berry-phase.js";
import { CommandPhase } from "#app/phases/command-phase.js";
import { MoveEndPhase } from "#app/phases/move-end-phase.js";
import { TurnEndPhase } from "#app/phases/turn-end-phase.js";

const TIMEOUT = 20 * 1000;

describe("Moves - Astonish", () => {
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
    game.override.moveset([Moves.ASTONISH, Moves.SPLASH]);
    game.override.enemySpecies(Species.BLASTOISE);
    game.override.enemyAbility(Abilities.INSOMNIA);
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
    game.override.startingLevel(100);
    game.override.enemyLevel(100);

    vi.spyOn(allMoves[Moves.ASTONISH], "chance", "get").mockReturnValue(100);
  });

  test(
    "move effect should cancel the target's move on the turn it applies",
    async () => {
      await game.classicMode.startBattle([Species.MEOWSCARADA]);

      const leadPokemon = game.scene.getPlayerPokemon()!;

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.doAttack(getMovePosition(game.scene, 0, Moves.ASTONISH));

      await game.phaseInterceptor.to(MoveEndPhase, false);

      expect(enemyPokemon.getTag(BattlerTagType.FLINCHED)).toBeDefined();

      await game.phaseInterceptor.to(TurnEndPhase);

      expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
      expect(enemyPokemon.getTag(BattlerTagType.FLINCHED)).toBeUndefined();

      await game.phaseInterceptor.to(CommandPhase, false);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

      await game.phaseInterceptor.to(BerryPhase, false);

      expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
    }, TIMEOUT
  );
});
