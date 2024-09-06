import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Abilities - Aftermath", () => {
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
      .ability(Abilities.BALL_FETCH)
      .moveset([Moves.TACKLE, Moves.WATER_GUN])
      .enemyAbility(Abilities.AFTERMATH)
      .enemyMoveset(SPLASH_ONLY)
      .enemySpecies(Species.BIDOOF);
  });

  it("deals 25% of attacker's HP as damage to attacker when defeated by contact move", async () => {
    await game.classicMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    enemy.hp = 1;

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to("VictoryPhase");

    expect(game.phaseInterceptor.log).toContain("FaintPhase");
    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
    expect(player.hp).toBe(Math.ceil(player.getMaxHp() * 0.75));
  }, TIMEOUT);

  it("does not activate on non-contact moves", async () => {
    await game.classicMode.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    enemy.hp = 1;

    game.move.select(Moves.WATER_GUN);

    await game.phaseInterceptor.to("VictoryPhase");

    expect(game.phaseInterceptor.log).toContain("FaintPhase");
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
    expect(player.isFullHp()).toBe(true);
  }, TIMEOUT);
});
