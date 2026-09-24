import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Early Bird", () => {
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
      .ability(AbilityId.EARLY_BIRD)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should halve the number of turns a Pokemon is asleep for", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    player.doSetStatus(StatusEffect.SLEEP, 4);

    expect(player).toHaveStatusEffect({ effect: StatusEffect.SLEEP, sleepTurnsRemaining: 4 });

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player).toHaveAbilityApplied(AbilityId.EARLY_BIRD);
    // should have decremented by 2 instead of 1
    expect(player).toHaveStatusEffect({ effect: StatusEffect.SLEEP, sleepTurnsRemaining: 2 });

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(player).toHaveStatusEffect(StatusEffect.NONE);
  });

  it("should cause Rest-induced sleep to last half as long", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    player.hp = 1;

    game.move.use(MoveId.REST);
    await game.toNextTurn();

    expect(player).toHaveStatusEffect({ effect: StatusEffect.SLEEP, sleepTurnsRemaining: 3 });
    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    // still asleep
    expect(player).toHaveStatusEffect({ effect: StatusEffect.SLEEP, sleepTurnsRemaining: 1 });

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player).toHaveStatusEffect(StatusEffect.NONE);
  });
});
