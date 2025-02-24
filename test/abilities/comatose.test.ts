import { BattlerIndex } from "#app/battle";
import { allAbilities } from "#app/data/ability";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Comatose", () => {
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
      .moveset([ Moves.SPLASH ])
      .ability(Abilities.BALL_FETCH)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should remove status when reactivated", async () => {
    game.override.enemyAbility(Abilities.BALL_FETCH)
      .moveset([ Moves.SPORE, Moves.SPLASH ])
      .enemyMoveset(Moves.SPLASH),

    await game.classicMode.startBattle([ Species.FEEBAS ]);
    const enemy = game.scene.getEnemyPokemon();
    game.move.select(Moves.SPORE);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(enemy?.status?.effect).toBe(StatusEffect.SLEEP);

    enemy?.setTempAbility(allAbilities[Abilities.COMATOSE]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy?.status).toBeNull();
  });
});
