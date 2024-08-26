import { Species } from "#app/enums/species";
import { StatusEffect } from "#app/enums/status-effect";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { toDmgValue } from "#app/utils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Heatproof", () => {
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
      .disableCrits()
      .enemySpecies(Species.CHARMANDER)
      .enemyAbility(Abilities.HEATPROOF)
      .enemyMoveset(SPLASH_ONLY)
      .enemyLevel(100)
      .starterSpecies(Species.CHANDELURE)
      .ability(Abilities.BALL_FETCH)
      .moveset([Moves.FLAMETHROWER, Moves.SPLASH])
      .startingLevel(100);
  });

  it("reduces Fire type damage by half", async () => {
    await game.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;
    const initialHP = 1000;
    enemy.hp = initialHP;

    game.move.select(Moves.FLAMETHROWER);
    await game.phaseInterceptor.to(TurnEndPhase);
    const heatproofDamage = initialHP - enemy.hp;

    enemy.hp = initialHP;
    game.override.enemyAbility(Abilities.BALL_FETCH);

    game.move.select(Moves.FLAMETHROWER);
    await game.phaseInterceptor.to(TurnEndPhase);
    const regularDamage = initialHP - enemy.hp;

    expect(heatproofDamage).toBeLessThanOrEqual((regularDamage / 2) + 1);
    expect(heatproofDamage).toBeGreaterThanOrEqual((regularDamage / 2) - 1);
  });

  it("reduces Burn damage by half", async () => {
    game.override
      .enemyStatusEffect(StatusEffect.BURN)
      .enemySpecies(Species.ABRA);
    await game.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    // Normal burn damage is /16
    expect(enemy.hp).toBe(enemy.getMaxHp() - toDmgValue(enemy.getMaxHp() / 32));
  });
});
