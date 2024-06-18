import {afterEach, beforeAll, beforeEach, describe, expect, test, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {
  CommandPhase,
  SelectTargetPhase,
  TurnEndPhase,
} from "#app/phases";
import {Stat} from "#app/data/pokemon-stat";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { BattlerIndex } from "#app/battle.js";

const TIMEOUT = 20 * 1000;

describe("Moves - Spotlight", () => {
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
    vi.spyOn(overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.AMOONGUSS);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.FOLLOW_ME, Moves.RAGE_POWDER, Moves.SPOTLIGHT, Moves.QUICK_ATTACK ]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE,Moves.TACKLE,Moves.TACKLE,Moves.TACKLE]);
  });

  test(
    "move should redirect attacks to the target",
    async () => {
      await game.startBattle([ Species.AMOONGUSS, Species.CHARIZARD ]);

      const playerPokemon = game.scene.getPlayerField();
      expect(playerPokemon.length).toBe(2);
      playerPokemon.forEach(p => expect(p).not.toBe(undefined));

      const enemyPokemon = game.scene.getEnemyField();
      expect(enemyPokemon.length).toBe(2);
      enemyPokemon.forEach(p => expect(p).not.toBe(undefined));

      enemyPokemon.forEach(p => p.hp = 200);

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPOTLIGHT));
      await game.phaseInterceptor.to(SelectTargetPhase, false);
      game.doSelectTarget(BattlerIndex.ENEMY);
      await game.phaseInterceptor.to(CommandPhase);

      game.doAttack(getMovePosition(game.scene, 1, Moves.QUICK_ATTACK));
      await game.phaseInterceptor.to(SelectTargetPhase, false);
      game.doSelectTarget(BattlerIndex.ENEMY_2);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(enemyPokemon[0].hp).toBeLessThan(200);
      expect(enemyPokemon[1].hp).toBe(200);
    }, TIMEOUT
  );

  test(
    "move should cause other redirection moves to fail",
    async () => {
      vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.FOLLOW_ME, Moves.FOLLOW_ME, Moves.FOLLOW_ME, Moves.FOLLOW_ME ]);

      await game.startBattle([ Species.AMOONGUSS, Species.CHARIZARD ]);

      const playerPokemon = game.scene.getPlayerField();
      expect(playerPokemon.length).toBe(2);
      playerPokemon.forEach(p => expect(p).not.toBe(undefined));

      const enemyPokemon = game.scene.getEnemyField();
      expect(enemyPokemon.length).toBe(2);
      enemyPokemon.forEach(p => expect(p).not.toBe(undefined));

      enemyPokemon.forEach(p => p.hp = 200);

      /**
       * Spotlight will target the slower enemy. In this situation without Spotlight being used,
       * the faster enemy would normally end up with the Center of Attention tag.
       */
      enemyPokemon.sort((a, b) => b.getBattleStat(Stat.SPD) - a.getBattleStat(Stat.SPD));
      const spotTarget = enemyPokemon[1].getBattlerIndex();
      const attackTarget = enemyPokemon[0].getBattlerIndex();

      game.doAttack(getMovePosition(game.scene, 0, Moves.SPOTLIGHT));
      await game.phaseInterceptor.to(SelectTargetPhase, false);
      game.doSelectTarget(spotTarget);
      await game.phaseInterceptor.to(CommandPhase);

      game.doAttack(getMovePosition(game.scene, 1, Moves.QUICK_ATTACK));
      await game.phaseInterceptor.to(SelectTargetPhase, false);
      game.doSelectTarget(attackTarget);
      await game.phaseInterceptor.to(TurnEndPhase);

      expect(enemyPokemon[1].hp).toBeLessThan(200);
      expect(enemyPokemon[0].hp).toBe(200);
    }, TIMEOUT
  );
});
