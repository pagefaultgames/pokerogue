import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should full restore HP, PP and status of switched in pokemon, then fail second use because no remaining backup pokemon in party", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.ODDISH, SpeciesId.RATTATA]);

    const [bulbasaur, oddish, rattata] = game.scene.getPlayerParty();
    game.move.changeMoveset(bulbasaur, [MoveId.LUNAR_DANCE, MoveId.SPLASH]);
    game.move.changeMoveset(oddish, [MoveId.LUNAR_DANCE, MoveId.SPLASH]);
    game.move.changeMoveset(rattata, [MoveId.LUNAR_DANCE, MoveId.SPLASH]);

    game.move.select(MoveId.SPLASH, 0);
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    // Bulbasaur should still be burned and have used a PP for splash and not at max hp
    expect(bulbasaur.status?.effect).toBe(StatusEffect.BURN);
    expect(bulbasaur.moveset[1]?.ppUsed).toBe(1);
    expect(bulbasaur.hp).toBeLessThan(bulbasaur.getMaxHp());

    // Switch out Bulbasaur for Rattata so we can swtich bulbasaur back in with lunar dance
    game.doSwitchPokemon(2);
    game.move.select(MoveId.SPLASH, 1);
    await game.toNextTurn();

    game.move.select(MoveId.SPLASH, 0);
    game.move.select(MoveId.LUNAR_DANCE);
    game.doSelectPartyPokemon(2);
    await game.phaseInterceptor.to("SwitchPhase", false);
    await game.toNextTurn();

    // Bulbasaur should NOT have any status and have full PP for splash and be at max hp
    expect(bulbasaur.status?.effect).toBeUndefined();
    expect(bulbasaur.moveset[1]?.ppUsed).toBe(0);
    expect(bulbasaur.isFullHp()).toBe(true);

    game.move.select(MoveId.SPLASH, 0);
    game.move.select(MoveId.LUNAR_DANCE);
    await game.toNextTurn();

    // Using Lunar dance again should fail because nothing in party and rattata should be alive
    expect(rattata.status?.effect).toBe(StatusEffect.BURN);
    expect(rattata.hp).toBeLessThan(rattata.getMaxHp());
  });
});
