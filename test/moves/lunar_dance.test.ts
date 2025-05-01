import { StatusEffect } from "#app/enums/status-effect";
import { CommandPhase } from "#app/phases/command-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect } from "vitest";

describe("Moves - Lunar Dance", () => {
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
      .statusEffect(StatusEffect.BURN)
      .battleStyle("double")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should full restore HP, PP and status of switched in pokemon, then fail second use because no remaining backup pokemon in party", async () => {
    await game.classicMode.startBattle([Species.BULBASAUR, Species.ODDISH, Species.RATTATA]);

    const [bulbasaur, oddish, rattata] = game.scene.getPlayerParty();
    game.move.changeMoveset(bulbasaur, [Moves.LUNAR_DANCE, Moves.SPLASH]);
    game.move.changeMoveset(oddish, [Moves.LUNAR_DANCE, Moves.SPLASH]);
    game.move.changeMoveset(rattata, [Moves.LUNAR_DANCE, Moves.SPLASH]);

    game.move.select(Moves.SPLASH, 0);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to(CommandPhase);
    await game.toNextTurn();

    // Bulbasaur should still be burned and have used a PP for splash and not at max hp
    expect(bulbasaur.status?.effect).toBe(StatusEffect.BURN);
    expect(bulbasaur.moveset[1]?.ppUsed).toBe(1);
    expect(bulbasaur.hp).toBeLessThan(bulbasaur.getMaxHp());

    // Switch out Bulbasaur for Rattata so we can swtich bulbasaur back in with lunar dance
    game.doSwitchPokemon(2);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to(CommandPhase);
    await game.toNextTurn();

    game.move.select(Moves.SPLASH, 0);
    game.move.select(Moves.LUNAR_DANCE);
    game.doSelectPartyPokemon(2);
    await game.phaseInterceptor.to("SwitchPhase", false);
    await game.toNextTurn();

    // Bulbasaur should NOT have any status and have full PP for splash and be at max hp
    expect(bulbasaur.status?.effect).toBeUndefined();
    expect(bulbasaur.moveset[1]?.ppUsed).toBe(0);
    expect(bulbasaur.isFullHp()).toBe(true);

    game.move.select(Moves.SPLASH, 0);
    game.move.select(Moves.LUNAR_DANCE);
    await game.phaseInterceptor.to(CommandPhase);
    await game.toNextTurn();

    // Using Lunar dance again should fail because nothing in party and rattata should be alive
    expect(rattata.status?.effect).toBe(StatusEffect.BURN);
    expect(rattata.hp).toBeLessThan(rattata.getMaxHp());
  });
});
