import { StatusEffect } from "#app/enums/status-effect";
import { CommandPhase } from "#app/phases/command-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
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
      .moveset([ Moves.LUNAR_DANCE, Moves.SPLASH ])
      .statusEffect(StatusEffect.BURN)
      .battleType("double")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should full restore HP, PP and status of switched in pokemon, using lunar dance after should fail because no pokemon in party", async () => {
    await game.classicMode.startBattle([ Species.BULBASAUR, Species.ODDISH, Species.RATTATA ]);
    let leftPlayer = game.scene.getPlayerParty()[0];

    game.move.select(Moves.SPLASH, 0);
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to(CommandPhase);
    await game.toNextTurn();

    // Bulbasaur should still be burned and have used a PP for splash and not at max hp
    expect(leftPlayer.status?.effect).toBe(StatusEffect.BURN);
    expect(leftPlayer.moveset[1]?.ppUsed).toBe(1);
    expect(leftPlayer.hp).toBeLessThan(leftPlayer.getMaxHp());

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
    expect(leftPlayer.status?.effect).toBeUndefined();
    expect(leftPlayer.moveset[1]?.ppUsed).toBe(0);
    expect(leftPlayer.hp).toBe(leftPlayer.getMaxHp());

    game.move.select(Moves.SPLASH, 0);
    game.move.select(Moves.LUNAR_DANCE);
    await game.phaseInterceptor.to(CommandPhase);
    await game.toNextTurn();

    leftPlayer = game.scene.getPlayerParty()[0];

    // Using Lunar dance again should fail because nothing in party and rattata should be alive
    expect(leftPlayer.status?.effect).toBe(StatusEffect.BURN);
    expect(leftPlayer.hp).toBeLessThan(leftPlayer.getMaxHp());
  });
});
