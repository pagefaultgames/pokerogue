import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Heatproof", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.CHARMANDER)
      .enemyAbility(AbilityId.HEATPROOF)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(100)
      .ability(AbilityId.BALL_FETCH)
      .startingLevel(100);
  });

  it("reduces Fire type damage by half", async () => {
    await game.classicMode.startBattle(SpeciesId.CHANDELURE);

    const enemy = game.field.getEnemyPokemon();
    const initialHP = 1000;
    enemy.hp = initialHP;

    game.move.use(MoveId.FLAMETHROWER);
    await game.phaseInterceptor.to("TurnEndPhase");
    const heatproofDamage = initialHP - enemy.hp;

    enemy.hp = initialHP;
    game.override.enemyAbility(AbilityId.BALL_FETCH);

    game.move.use(MoveId.FLAMETHROWER);
    await game.phaseInterceptor.to("TurnEndPhase");
    const regularDamage = initialHP - enemy.hp;

    expect(heatproofDamage).toBeLessThanOrEqual(regularDamage / 2 + 1);
    expect(heatproofDamage).toBeGreaterThanOrEqual(regularDamage / 2 - 1);
  });

  it("reduces Burn damage by half", async () => {
    game.override.enemyStatusEffect(StatusEffect.BURN).enemySpecies(SpeciesId.ABRA);
    await game.classicMode.startBattle(SpeciesId.CHANDELURE);

    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    // Normal burn damage is /16
    expect(enemy.hp).toBe(enemy.getMaxHp() - toDmgValue(enemy.getMaxHp() / 32));
  });
});
