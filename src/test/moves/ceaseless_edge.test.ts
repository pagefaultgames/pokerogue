import {afterEach, beforeAll, beforeEach, describe, expect, test, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {
  MoveEffectPhase,
  TurnEndPhase
} from "#app/phases";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { ArenaTagType } from "#app/enums/arena-tag-type";
import { allMoves } from "#app/data/move";
import { ArenaTagSide, ArenaTrapTag } from "#app/data/arena-tag";
import { Abilities } from "#app/enums/abilities";

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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.RUN_AWAY);
    vi.spyOn(overrides, "OPP_PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.RUN_AWAY);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([ Moves.CEASELESS_EDGE, Moves.SPLASH, Moves.ROAR ]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH,Moves.SPLASH,Moves.SPLASH,Moves.SPLASH]);
    vi.spyOn(allMoves[Moves.CEASELESS_EDGE], "accuracy", "get").mockReturnValue(100);

  });

  test(
    "move should hit and apply spikes",
    async () => {
      await game.startBattle([ Species.ILLUMISE ]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      const enemyStartingHp = enemyPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.CEASELESS_EDGE));

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
      vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "MULTI_LENS"}]);
      await game.startBattle([ Species.ILLUMISE ]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      const enemyStartingHp = enemyPokemon.hp;

      game.doAttack(getMovePosition(game.scene, 0, Moves.CEASELESS_EDGE));

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
      vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "MULTI_LENS"}]);
      vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(5);

      await game.startBattle([ Species.ILLUMISE ]);

      const leadPokemon = game.scene.getPlayerPokemon();
      expect(leadPokemon).toBeDefined();

      const enemyPokemon = game.scene.getEnemyPokemon();
      expect(enemyPokemon).toBeDefined();

      game.doAttack(getMovePosition(game.scene, 0, Moves.CEASELESS_EDGE));
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
      game.forceOpponentToSwitch();
      game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
      await game.phaseInterceptor.to(TurnEndPhase, false);
      expect(game.scene.currentBattle.enemyParty[0].hp).toBeLessThan(hpBeforeSpikes);
    }, TIMEOUT
  );
});
