import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import GameManager from "#test/utils/gameManager";
import { Abilities } from "#app/enums/abilities.js";
import { Moves } from "#app/enums/moves.js";
import { Species } from "#app/enums/species.js";
import { allMoves } from "#app/data/move.js";
import { BattlerIndex } from "#app/battle.js";
import { getMovePosition } from "../utils/gameManagerUtils";
import { BerryPhase, MoveEndPhase, MovePhase } from "#app/phases.js";
import { SPLASH_ONLY } from "../utils/testUtils";

const TIMEOUT = 20 * 1000;

describe("Moves - Shell Trap", () => {
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
      .battleType("double")
      .ability(Abilities.UNNERVE)
      .moveset([Moves.SHELL_TRAP, Moves.SPLASH])
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.INSOMNIA)
      .enemyMoveset(Array(4).fill(Moves.RAZOR_LEAF))
      .startingLevel(100)
      .enemyLevel(100);

    vi.spyOn(allMoves[Moves.RAZOR_LEAF], "accuracy", "get").mockReturnValue(100);
  });

  it(
    "should activate after the user is hit by a physical attack",
    async () => {
      await game.startBattle([Species.CHARIZARD, Species.TURTONATOR]);

      const playerPokemon = game.scene.getPlayerField();
      const enemyPokemon = game.scene.getEnemyField();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      game.doAttack(getMovePosition(game.scene, 1, Moves.SHELL_TRAP));

      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);

      await game.phaseInterceptor.to(MoveEndPhase);

      const movePhase = game.scene.getCurrentPhase();
      expect(movePhase instanceof MovePhase).toBeTruthy();
      expect((movePhase as MovePhase).pokemon).toBe(playerPokemon[1]);

      await game.phaseInterceptor.to(MoveEndPhase);
      enemyPokemon.forEach(p => expect(p.hp).toBeLessThan(p.getMaxHp()));
    }, TIMEOUT
  );

  it(
    "should fail if the user is only hit by special attacks",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.SWIFT));

      await game.startBattle([Species.CHARIZARD, Species.TURTONATOR]);

      const playerPokemon = game.scene.getPlayerField();
      const enemyPokemon = game.scene.getEnemyField();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      game.doAttack(getMovePosition(game.scene, 1, Moves.SHELL_TRAP));

      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);

      await game.phaseInterceptor.to(MoveEndPhase);

      const movePhase = game.scene.getCurrentPhase();
      expect(movePhase instanceof MovePhase).toBeTruthy();
      expect((movePhase as MovePhase).pokemon).not.toBe(playerPokemon[1]);

      await game.phaseInterceptor.to(BerryPhase, false);
      enemyPokemon.forEach(p => expect(p.hp).toBe(p.getMaxHp()));
    }, TIMEOUT
  );

  it(
    "should fail if the user isn't hit with any attack",
    async () => {
      game.override.enemyMoveset(SPLASH_ONLY);

      await game.startBattle([Species.CHARIZARD, Species.TURTONATOR]);

      const playerPokemon = game.scene.getPlayerField();
      const enemyPokemon = game.scene.getEnemyField();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      game.doAttack(getMovePosition(game.scene, 1, Moves.SHELL_TRAP));

      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);

      await game.phaseInterceptor.to(MoveEndPhase);

      const movePhase = game.scene.getCurrentPhase();
      expect(movePhase instanceof MovePhase).toBeTruthy();
      expect((movePhase as MovePhase).pokemon).not.toBe(playerPokemon[1]);

      await game.phaseInterceptor.to(BerryPhase, false);
      enemyPokemon.forEach(p => expect(p.hp).toBe(p.getMaxHp()));
    }, TIMEOUT
  );
});
