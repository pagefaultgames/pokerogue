import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { Move } from "#moves/move";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Natural Gift", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  let moveToCheck: Move;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    moveToCheck = allMoves[MoveId.NATURAL_GIFT];
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override
      .battleStyle("single")
      .criticalHits(false)
      .ability(AbilityId.STURDY)
      .moveset(MoveId.NATURAL_GIFT)
      .enemySpecies(SpeciesId.DRAGONITE)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.STURDY)
      .enemyLevel(50);

    vi.spyOn(moveToCheck, "calculateBattlePower");
  });

  it("changes type to match the consumed berry when used by a player pokemon", async () => {
    // Berry that turns into an ice type attack
    game.override.startingHeldItems([{ entry: HeldItemId.GANLON_BERRY }]);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);
    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    const spy = vi.spyOn(enemyPokemon, "getMoveEffectiveness");

    game.move.useWithItem(MoveId.NATURAL_GIFT);

    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(spy).toHaveReturnedWith(4);

    // Berry that turns into a ground type attack
    playerPokemon.heldItemManager.add(HeldItemId.APICOT_BERRY);

    game.move.useWithItem(MoveId.NATURAL_GIFT);

    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(spy).toHaveReturnedWith(0);
  });

  it("changes type to match the consumed berry when used by an enemy pokemon", async () => {
    game.override.enemyHeldItems([{ entry: HeldItemId.GANLON_BERRY }]).enemyMoveset(MoveId.NATURAL_GIFT);

    await game.classicMode.startBattle(SpeciesId.DRAGONITE);
    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    const spy = vi.spyOn(playerPokemon, "getMoveEffectiveness");

    game.move.use(MoveId.SPLASH);

    await game.move.forceEnemyMove(MoveId.NATURAL_GIFT);
    await game.toEndOfTurn();

    expect(spy).toHaveReturnedWith(4);

    // Berry that turns into a ground type attack
    enemyPokemon.heldItemManager.add(HeldItemId.APICOT_BERRY);

    game.move.use(MoveId.SPLASH);

    await game.move.forceEnemyMove(MoveId.NATURAL_GIFT);
    await game.toEndOfTurn();

    expect(spy).toHaveReturnedWith(0);
  });
});
