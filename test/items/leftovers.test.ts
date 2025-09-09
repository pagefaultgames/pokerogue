import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { DamageAnimPhase } from "#phases/damage-anim-phase";
import { GameManager } from "#test/test-utils/game-manager";
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
    game.override
      .battleStyle("single")
      .startingLevel(2000)
      .ability(AbilityId.UNNERVE)
      .moveset([MoveId.SPLASH])
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.UNNERVE)
      .enemyMoveset(MoveId.TACKLE)
      .startingHeldItems([{ name: "LEFTOVERS", count: 1 }]);
  });

  it("leftovers works", async () => {
    await game.classicMode.startBattle([SpeciesId.ARCANINE]);

    // Make sure leftovers are there
    expect(game.scene.modifiers[0].type.id).toBe("LEFTOVERS");

    const leadPokemon = game.field.getPlayerPokemon();

    // We should have full hp
    expect(leadPokemon.isFullHp()).toBe(true);

    game.move.select(MoveId.SPLASH);

    // We should have less hp after the attack
    await game.phaseInterceptor.to(DamageAnimPhase, false);
    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());

    const leadHpAfterDamage = leadPokemon.hp;

    // Check if leftovers heal us
    await game.phaseInterceptor.to("PokemonHealPhase");
    expect(leadPokemon.hp).toBeGreaterThan(leadHpAfterDamage);
  });
});
