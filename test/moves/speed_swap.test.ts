import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/testUtils/gameManager";
import { SpeciesId } from "#enums/species-id";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { MoveId } from "#enums/move-id";
import { Stat } from "#enums/stat";
import { AbilityId } from "#enums/ability-id";

describe("Moves - Speed Swap", () => {
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
      .enemyAbility(AbilityId.NONE)
      .enemyMoveset(MoveId.SPLASH)
      .enemySpecies(SpeciesId.MEW)
      .enemyLevel(200)
      .moveset([MoveId.SPEED_SWAP])
      .ability(AbilityId.NONE);
  });

  it("should swap the user's SPD and the target's SPD stats", async () => {
    await game.classicMode.startBattle([SpeciesId.INDEEDEE]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    const playerSpd = player.getStat(Stat.SPD, false);
    const enemySpd = enemy.getStat(Stat.SPD, false);

    game.move.select(MoveId.SPEED_SWAP);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(player.getStat(Stat.SPD, false)).toBe(enemySpd);
    expect(enemy.getStat(Stat.SPD, false)).toBe(playerSpd);
  });
});
