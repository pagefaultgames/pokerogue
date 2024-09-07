import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import { Species } from "#enums/species";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Stat, BATTLE_STATS, EFFECTIVE_STATS } from "#enums/stat";
import { Abilities } from "#enums/abilities";
import { SPLASH_ONLY } from "../utils/testUtils";

// TODO: Add more tests once Transform is fully implemented
describe("Moves - Transform", () => {
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
      .enemySpecies(Species.MEW)
      .enemyLevel(200)
      .enemyAbility(Abilities.BEAST_BOOST)
      .enemyPassiveAbility(Abilities.BALL_FETCH)
      .enemyMoveset(SPLASH_ONLY)
      .ability(Abilities.INTIMIDATE)
      .moveset([ Moves.TRANSFORM ]);
  });

  it("should copy species, ability, gender, all stats except HP, all stat stages, moveset, and types of target", async () => {
    await game.startBattle([
      Species.DITTO
    ]);

    game.move.select(Moves.TRANSFORM);
    await game.phaseInterceptor.to(TurnEndPhase);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    expect(player.getSpeciesForm().speciesId).toBe(enemy.getSpeciesForm().speciesId);
    expect(player.getAbility()).toBe(enemy.getAbility());
    expect(player.getGender()).toBe(enemy.getGender());

    expect(player.getStat(Stat.HP, false)).not.toBe(enemy.getStat(Stat.HP));
    for (const s of EFFECTIVE_STATS) {
      expect(player.getStat(s, false)).toBe(enemy.getStat(s, false));
    }

    for (const s of BATTLE_STATS) {
      expect(player.getStatStage(s)).toBe(enemy.getStatStage(s));
    }

    const playerMoveset = player.getMoveset();
    const enemyMoveset = player.getMoveset();

    for (let i = 0; i < playerMoveset.length && i < enemyMoveset.length; i++) {
      // TODO: Checks for 5 PP should be done here when that gets addressed
      expect(playerMoveset[i]?.moveId).toBe(enemyMoveset[i]?.moveId);
    }

    const playerTypes = player.getTypes();
    const enemyTypes = enemy.getTypes();

    for (let i = 0; i < playerTypes.length && i < enemyTypes.length; i++) {
      expect(playerTypes[i]).toBe(enemyTypes[i]);
    }
  }, 20000);

  it("should copy in-battle overridden stats", async () => {
    game.override.enemyMoveset(new Array(4).fill(Moves.POWER_SPLIT));

    await game.startBattle([
      Species.DITTO
    ]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    const avgAtk = Math.floor((player.getStat(Stat.ATK, false) + enemy.getStat(Stat.ATK, false)) / 2);
    const avgSpAtk = Math.floor((player.getStat(Stat.SPATK, false) + enemy.getStat(Stat.SPATK, false)) / 2);

    game.move.select(Moves.TRANSFORM);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStat(Stat.ATK, false)).toBe(avgAtk);
    expect(enemy.getStat(Stat.ATK, false)).toBe(avgAtk);

    expect(player.getStat(Stat.SPATK, false)).toBe(avgSpAtk);
    expect(enemy.getStat(Stat.SPATK, false)).toBe(avgSpAtk);
  });
});
