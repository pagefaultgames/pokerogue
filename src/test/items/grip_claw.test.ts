import { BattlerIndex } from "#app/battle";
import { ContactHeldItemTransferChanceModifier } from "#app/modifier/modifier";
import { Abilities } from "#enums/abilities";
import { BerryType } from "#enums/berry-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phase from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Grip Claw", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phase.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override
      .battleType("double")
      .moveset([ Moves.TACKLE, Moves.SPLASH ])
      .startingHeldItems([
        { name: "GRIP_CLAW", count: 1 },
      ])
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.UNNERVE)
      .ability(Abilities.UNNERVE)
      .enemyMoveset(Moves.SPLASH)
      .enemyHeldItems([
        { name: "BERRY", type: BerryType.SITRUS, count: 2 },
        { name: "BERRY", type: BerryType.LUM, count: 2 },
      ])
      .enemyLevel(100);

  });

  it("should steal items on contact and only from the attack target", async () => {
    await game.classicMode.startBattle([ Species.FEEBAS, Species.MILOTIC ]);

    const [ player, ] = game.scene.getPlayerField();
    const gripClaw = player.getHeldItems()[0] as ContactHeldItemTransferChanceModifier;
    vi.spyOn(gripClaw, "chance", "get").mockReturnValue(100);

    const enemyPokemon = game.scene.getEnemyField();

    const enemy1HeldItemCounts = enemyPokemon[0].getHeldItems().map((item) => item.getStackCount());
    const enemy1HeldItemTotal = enemy1HeldItemCounts[0] + enemy1HeldItemCounts[1];
    const enemy2HeldItemCounts = enemyPokemon[1].getHeldItems().map((item) => item.getStackCount());
    const enemy2HeldItemTotal = enemy2HeldItemCounts[0] + enemy2HeldItemCounts[1];

    game.move.select(Moves.TACKLE, 0, BattlerIndex.ENEMY_2);
    game.move.select(Moves.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase", false);

    const enemy1HeldItemCountsAfter = enemyPokemon[0].getHeldItems().map((item) => item.getStackCount());
    const enemy1HeldItemTotalAfter = enemy1HeldItemCountsAfter[0] + enemy1HeldItemCountsAfter[1];
    const enemy2HeldItemCountsAfter = enemyPokemon[1].getHeldItems().map((item) => item.getStackCount());
    const enemy2HeldItemTotalAfter = enemy2HeldItemCountsAfter[0] + enemy2HeldItemCountsAfter[1];

    expect(enemy1HeldItemTotalAfter).toBe(enemy1HeldItemTotal);
    expect(enemy2HeldItemTotalAfter).toBe(enemy2HeldItemTotal - 1);
  });
});
