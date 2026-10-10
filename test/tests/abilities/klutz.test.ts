import { AbilityId } from "#enums/ability-id";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Klutz", () => {
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
      .ability(AbilityId.KLUTZ)
      .enemySpecies(SpeciesId.DRAGONITE)
      .enemyMoveset(MoveId.FALSE_SWIPE)
      .enemyLevel(50);
  });

  it("fails to eat berries", async () => {
    // Berry that turns into an ice type attack
    game.override.startingHeldItems([{ entry: HeldItemId.GANLON_BERRY }, { entry: HeldItemId.SITRUS_BERRY }]);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);
    const playerPokemon = game.field.getPlayerPokemon();

    game.move.use(MoveId.SPLASH);

    await game.move.forceEnemyMove(MoveId.FALSE_SWIPE);
    await game.toEndOfTurn();

    expect(playerPokemon).toHaveHp(1);
    expect(playerPokemon.heldItemManager.getStack(HeldItemId.GANLON_BERRY)).toBe(1);
    expect(playerPokemon.heldItemManager.getStack(HeldItemId.SITRUS_BERRY)).toBe(1);
  });
});
