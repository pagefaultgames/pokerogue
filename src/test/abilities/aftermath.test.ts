import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Abilities } from "#enums/abilities";
import { Species } from "#enums/species";
import { TurnEndPhase } from "#app/phases.js";
import { SPLASH_ONLY } from "../utils/testUtils";

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
    game.override.battleType("single");
    game.override.ability(Abilities.NONE);
    game.override.enemyAbility(Abilities.AFTERMATH);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.enemySpecies(Species.BIDOOF);
  });

  it("deals 25% of attacker's HP as damage to attacker when defeated by contact move", async () => {
    const moveToUse = Moves.TACKLE;
    game.override.moveset(Array(4).fill(moveToUse));

    await game.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    enemy.hp = 1;

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.phaseInterceptor.log).toContain("FaintPhase");
    expect(game.phaseInterceptor.log).toContain("ShowAbilityPhase");
    expect(player.hp).toBeCloseTo(Math.floor(player.getMaxHp() * 0.75));
  }, TIMEOUT);

  it("does not activate on non-contact moves", async () => {
    const moveToUse = Moves.WATER_GUN;
    game.override.moveset(Array(4).fill(moveToUse));

    await game.startBattle();

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    enemy.hp = 1;

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.phaseInterceptor.log).toContain("FaintPhase");
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
    expect(player.getHpRatio()).toBeCloseTo(1);
  }, TIMEOUT);
});
