import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import GameManager from "../utils/gameManager";
import * as Overrides from "#app/overrides";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { getMovePosition } from "../utils/gameManagerUtils";
import { BerryPhase, CommandPhase } from "#app/phases.js";
import { BattleStat } from "#app/data/battle-stat.js";

const TIMEOUT = 20 * 1000;

describe("Moves - Quick Guard", () => {
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
    vi.spyOn(Overrides, "DOUBLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.QUICK_GUARD, Moves.SPLASH, Moves.FOLLOW_ME]);
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.INSOMNIA);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.QUICK_ATTACK, Moves.QUICK_ATTACK, Moves.QUICK_ATTACK, Moves.QUICK_ATTACK]);
    vi.spyOn(Overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(Overrides, "OPP_LEVEL_OVERRIDE", "get").mockReturnValue(100);
  });

  test(
    "should protect the user and allies from priority moves",
    async () => {
      await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerField();
      leadPokemon.forEach(p => expect(p).toBeDefined());

      const enemyPokemon = game.scene.getEnemyField();
      enemyPokemon.forEach(p => expect(p).toBeDefined());

      game.doAttack(getMovePosition(game.scene, 0, Moves.QUICK_GUARD));

      await game.phaseInterceptor.to(CommandPhase);

      game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

      await game.phaseInterceptor.to(BerryPhase, false);

      leadPokemon.forEach(p => expect(p.hp).toBe(p.getMaxHp()));
    }, TIMEOUT
  );

  test(
    "should protect the user and allies from Prankster-boosted moves",
    async () => {
      vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.PRANKSTER);
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.GROWL, Moves.GROWL, Moves.GROWL, Moves.GROWL]);

      await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerField();
      leadPokemon.forEach(p => expect(p).toBeDefined());

      const enemyPokemon = game.scene.getEnemyField();
      enemyPokemon.forEach(p => expect(p).toBeDefined());

      game.doAttack(getMovePosition(game.scene, 0, Moves.QUICK_GUARD));

      await game.phaseInterceptor.to(CommandPhase);

      game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

      await game.phaseInterceptor.to(BerryPhase, false);

      leadPokemon.forEach(p => expect(p.summonData.battleStats[BattleStat.ATK]).toBe(0));
    }, TIMEOUT
  );

  test(
    "should stop subsequent hits of a multi-hit priority move",
    async () => {
      vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.WATER_SHURIKEN, Moves.WATER_SHURIKEN, Moves.WATER_SHURIKEN, Moves.WATER_SHURIKEN]);

      await game.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

      const leadPokemon = game.scene.getPlayerField();
      leadPokemon.forEach(p => expect(p).toBeDefined());

      const enemyPokemon = game.scene.getEnemyField();
      enemyPokemon.forEach(p => expect(p).toBeDefined());

      game.doAttack(getMovePosition(game.scene, 0, Moves.QUICK_GUARD));

      await game.phaseInterceptor.to(CommandPhase);

      game.doAttack(getMovePosition(game.scene, 1, Moves.FOLLOW_ME));

      await game.phaseInterceptor.to(BerryPhase, false);

      leadPokemon.forEach(p => expect(p.hp).toBe(p.getMaxHp()));
      enemyPokemon.forEach(p => expect(p.turnData.hitCount).toBe(1));
    }
  );
});
