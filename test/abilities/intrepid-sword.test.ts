import { AbilityId } from "#enums/ability-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { CommandPhase } from "#phases/command-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Intrepid Sword", () => {
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
      .enemySpecies(SpeciesId.ZACIAN)
      .enemyAbility(AbilityId.INTREPID_SWORD)
      .ability(AbilityId.INTREPID_SWORD);
  });

  it("should raise ATK stat stage by 1 on entry", async () => {
    await game.classicMode.runToSummon([SpeciesId.ZACIAN]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    await game.phaseInterceptor.to(CommandPhase, false);

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(1);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  });
});
