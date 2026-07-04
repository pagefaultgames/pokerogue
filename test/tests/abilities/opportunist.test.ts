import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Opportunist", () => {
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
      .ability(AbilityId.OPPORTUNIST)
      .battleStyle("single")
      .criticalHits(false)
      .startingLevel(200)
      .enemyLevel(200)
      .enemySpecies(SpeciesId.FEEBAS)
      .enemyAbility(AbilityId.OPPORTUNIST)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should not loop when opposing Pokemon both have the ability", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    game.move.use(MoveId.SWORDS_DANCE);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).toHaveStatStage(Stat.ATK, 2);
    expect(game.field.getEnemyPokemon()).toHaveStatStage(Stat.ATK, 2);
  });
});
