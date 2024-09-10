import { Stat } from "#enums/stat";
import GameManager from "#test/utils/gameManager";
import { CommandPhase } from "#app/phases/command-phase";
import { Abilities } from "#enums/abilities";
import { Species } from "#enums/species";
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
    game.override.battleType("single");
    game.override.enemySpecies(Species.ZACIAN);
    game.override.enemyAbility(Abilities.INTREPID_SWORD);
    game.override.ability(Abilities.INTREPID_SWORD);
  });

  it("should raise ATK stat stage by 1 on entry", async() => {
    await game.classicMode.runToSummon([
      Species.ZACIAN,
    ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;
    const enemyPokemon = game.scene.getEnemyPokemon()!;

    await game.phaseInterceptor.to(CommandPhase, false);

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(1);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  }, 20000);
});
