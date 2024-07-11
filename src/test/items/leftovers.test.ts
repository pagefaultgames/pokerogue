import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { DamagePhase, TurnEndPhase } from "#app/phases";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";


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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(2000);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.UNNERVE);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SHUCKLE);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.UNNERVE);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
    vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "LEFTOVERS", count: 1}]);
  });

  it("leftovers works", async() => {
    await game.startBattle([Species.ARCANINE]);

    // Make sure leftovers are there
    expect(game.scene.modifiers[0].type.id).toBe("LEFTOVERS");

    const leadPokemon = game.scene.getPlayerPokemon();
    expect(leadPokemon).toBeDefined();

    const enemyPokemon = game.scene.getEnemyPokemon();
    expect(enemyPokemon).toBeDefined();

    // We should have full hp
    expect(leadPokemon.isFullHp()).toBe(true);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));

    // We should have less hp after the attack
    await game.phaseInterceptor.to(DamagePhase, false);
    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());

    const leadHpAfterDamage = leadPokemon.hp;

    // Check if leftovers heal us
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(leadPokemon.hp).toBeGreaterThan(leadHpAfterDamage);
  }, 20000);
});
