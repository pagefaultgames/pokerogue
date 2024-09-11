import { ArenaTagSide, ArenaTrapTag } from "#app/data/arena-tag";
import { allMoves } from "#app/data/move";
import { Abilities } from "#app/enums/abilities";
import { ArenaTagType } from "#app/enums/arena-tag-type";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Moves - Ceaseless Edge", () => {
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
    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyAbility(Abilities.RUN_AWAY);
    game.override.enemyPassiveAbility(Abilities.RUN_AWAY);
    game.override.startingLevel(100);
    game.override.enemyLevel(100);
    game.override.moveset([Moves.CEASELESS_EDGE, Moves.SPLASH, Moves.ROAR]);
    game.override.enemyMoveset([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    vi.spyOn(allMoves[Moves.CEASELESS_EDGE], "accuracy", "get").mockReturnValue(100);

  });

  test(
    "move should hit and apply spikes",
    async () => {
      await game.startBattle([Species.ILLUMISE]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      const enemyStartingHp = enemyPokemon.hp;

      game.move.select(Moves.CEASELESS_EDGE);

      await game.phaseInterceptor.to(MoveEffectPhase, false);
      // Spikes should not have any layers before move effect is applied
      const tagBefore = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY) as ArenaTrapTag;
      expect(tagBefore instanceof ArenaTrapTag).toBeFalsy();

      await game.phaseInterceptor.to(TurnEndPhase);
      const tagAfter = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY) as ArenaTrapTag;
      expect(tagAfter instanceof ArenaTrapTag).toBeTruthy();
      expect(tagAfter.layers).toBe(1);
      expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
    }, TIMEOUT
  );

  test(
    "move should hit twice with multi lens and apply two layers of spikes",
    async () => {
      game.override.startingHeldItems([{ name: "MULTI_LENS" }]);
      await game.startBattle([Species.ILLUMISE]);

      const enemyPokemon = game.scene.getEnemyPokemon()!;

      const enemyStartingHp = enemyPokemon.hp;

      game.move.select(Moves.CEASELESS_EDGE);

      await game.phaseInterceptor.to(MoveEffectPhase, false);
      // Spikes should not have any layers before move effect is applied
      const tagBefore = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY) as ArenaTrapTag;
      expect(tagBefore instanceof ArenaTrapTag).toBeFalsy();

      await game.phaseInterceptor.to(TurnEndPhase);
      const tagAfter = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY) as ArenaTrapTag;
      expect(tagAfter instanceof ArenaTrapTag).toBeTruthy();
      expect(tagAfter.layers).toBe(2);
      expect(enemyPokemon.hp).toBeLessThan(enemyStartingHp);
    }, TIMEOUT
  );

  test(
    "trainer - move should hit twice, apply two layers of spikes, force switch opponent - opponent takes damage",
    async () => {
      game.override.startingHeldItems([{ name: "MULTI_LENS" }]);
      game.override.startingWave(5);

      await game.startBattle([Species.ILLUMISE]);

      game.move.select(Moves.CEASELESS_EDGE);
      await game.phaseInterceptor.to(MoveEffectPhase, false);
      // Spikes should not have any layers before move effect is applied
      const tagBefore = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY) as ArenaTrapTag;
      expect(tagBefore instanceof ArenaTrapTag).toBeFalsy();

      await game.phaseInterceptor.to(TurnEndPhase, false);
      const tagAfter = game.scene.arena.getTagOnSide(ArenaTagType.SPIKES, ArenaTagSide.ENEMY) as ArenaTrapTag;
      expect(tagAfter instanceof ArenaTrapTag).toBeTruthy();
      expect(tagAfter.layers).toBe(2);

      const hpBeforeSpikes = game.scene.currentBattle.enemyParty[1].hp;
      // Check HP of pokemon that WILL BE switched in (index 1)
      game.forceEnemyToSwitch();
      game.move.select(Moves.SPLASH);
      await game.phaseInterceptor.to(TurnEndPhase, false);
      expect(game.scene.currentBattle.enemyParty[0].hp).toBeLessThan(hpBeforeSpikes);
    }, TIMEOUT
  );
});
