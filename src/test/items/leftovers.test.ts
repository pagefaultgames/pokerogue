import { DamagePhase } from "#app/phases/damage-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";


describe("Items - Leftovers", () => {
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
    game.override.startingLevel(2000);
    game.override.ability(Abilities.UNNERVE);
    game.override.moveset([Moves.SPLASH]);
    game.override.enemySpecies(Species.SHUCKLE);
    game.override.enemyAbility(Abilities.UNNERVE);
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
    game.override.startingHeldItems([{ name: "LEFTOVERS", count: 1 }]);
  });

  it("leftovers works", async () => {
    await game.startBattle([Species.ARCANINE]);

    // Make sure leftovers are there
    expect(game.scene.modifiers[0].type.id).toBe("LEFTOVERS");

    const leadPokemon = game.scene.getPlayerPokemon()!;

    // We should have full hp
    expect(leadPokemon.isFullHp()).toBe(true);

    game.move.select(Moves.SPLASH);

    // We should have less hp after the attack
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());

    const leadHpAfterDamage = leadPokemon.hp;

    // Check if leftovers heal us
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(leadPokemon.hp).toBeGreaterThan(leadHpAfterDamage);
  }, 20000);
});
