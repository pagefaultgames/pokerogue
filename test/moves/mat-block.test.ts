import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { BerryPhase } from "#phases/berry-phase";
import { CommandPhase } from "#phases/command-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

describe("Moves - Mat Block", () => {
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
      .battleStyle("double")
      .moveset([MoveId.MAT_BLOCK, MoveId.SPLASH])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyMoveset([MoveId.TACKLE])
      .enemyAbility(AbilityId.INSOMNIA)
      .startingLevel(100)
      .enemyLevel(100);
  });

  test("should protect the user and allies from attack moves", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const leadPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.MAT_BLOCK);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to(BerryPhase, false);

    leadPokemon.forEach(p => expect(p.hp).toBe(p.getMaxHp()));
  });

  test("should not protect the user and allies from status moves", async () => {
    game.override.enemyMoveset([MoveId.GROWL]);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const leadPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.MAT_BLOCK);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to(BerryPhase, false);

    leadPokemon.forEach(p => expect(p.getStatStage(Stat.ATK)).toBe(-2));
  });

  test("should fail when used after the first turn", async () => {
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);

    const leadPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to(TurnEndPhase);

    const leadStartingHp = leadPokemon.map(p => p.hp);

    await game.phaseInterceptor.to(CommandPhase, false);
    game.move.select(MoveId.MAT_BLOCK);
    game.move.select(MoveId.MAT_BLOCK, 1);

    await game.phaseInterceptor.to(BerryPhase, false);

    expect(leadPokemon.some((p, i) => p.hp < leadStartingHp[i])).toBeTruthy();
  });
});
