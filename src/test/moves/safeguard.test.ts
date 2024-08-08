import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import { CommandPhase, SelectTargetPhase, TurnEndPhase } from "#app/phases";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { BattlerIndex } from "#app/battle.js";
import { Abilities } from "#app/enums/abilities.js";
import { mockTurnOrder } from "../utils/testUtils";

const TIMEOUT = 20 * 1000;

describe("Moves - Safeguard", () => {
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
      .enemySpecies(Species.DRATINI)
      .enemyMoveset(Array(4).fill(Moves.SAFEGUARD))
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyLevel(5)
      .starterSpecies(Species.DRATINI)
      .moveset([Moves.NUZZLE, Moves.SPORE])
      .ability(Abilities.BALL_FETCH);
  });
  it("protects from nuzzle status",
    async () => {
      await game.startBattle();
      const enemy = game.scene.getEnemyPokemon()!;

      game.doAttack(getMovePosition(game.scene, 0, Moves.NUZZLE));
      await mockTurnOrder(game, [BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toNextTurn();

      expect(enemy.status).toBeUndefined();
    }, TIMEOUT
  );
  it("protects from spore",
    async () => {

      await game.startBattle();
      const enemyPokemon = game.scene.getEnemyPokemon()!;

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPORE));
      await mockTurnOrder(game, [BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
      await game.toNextTurn();

      expect(enemyPokemon.status).toBeUndefined();
    }, TIMEOUT
  );
  it("protects ally from status",
    async () => {
      game.override.battleType("double");

      await game.startBattle();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPORE));
      await game.phaseInterceptor.to(SelectTargetPhase, false);
      game.doSelectTarget(BattlerIndex.ENEMY_2);

      await game.phaseInterceptor.to(CommandPhase);

      game.doAttack(getMovePosition(game.scene, 1, Moves.NUZZLE));
      await game.phaseInterceptor.to(SelectTargetPhase, false);
      game.doSelectTarget(BattlerIndex.ENEMY_2);

      await mockTurnOrder(game, [BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2]);

      await game.phaseInterceptor.to(TurnEndPhase);

      const enemyPokemon = game.scene.getEnemyField();

      expect(enemyPokemon[0].status).toBeUndefined();
      expect(enemyPokemon[1].status).toBeUndefined();
    }, TIMEOUT
  );
});
