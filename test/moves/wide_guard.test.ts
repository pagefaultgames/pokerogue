import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";
import GameManager from "#test/testUtils/gameManager";
import { SpeciesId } from "#enums/species-id";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { Stat } from "#enums/stat";
import { BerryPhase } from "#app/phases/berry-phase";
import { CommandPhase } from "#app/phases/command-phase";

describe("Moves - Wide Guard", () => {
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
      .moveset([MoveId.WIDE_GUARD, MoveId.SPLASH, MoveId.SURF])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyMoveset(MoveId.SWIFT)
      .enemyAbility(AbilityId.INSOMNIA)
      .startingLevel(100)
      .enemyLevel(100);
  });

  test("should protect the user and allies from multi-target attack moves", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const leadPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.WIDE_GUARD);

    await game.phaseInterceptor.to(CommandPhase);

    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to(BerryPhase, false);

    leadPokemon.forEach(p => expect(p.hp).toBe(p.getMaxHp()));
  });

  test("should protect the user and allies from multi-target status moves", async () => {
    game.override.enemyMoveset([MoveId.GROWL]);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const leadPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.WIDE_GUARD);

    await game.phaseInterceptor.to(CommandPhase);

    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to(BerryPhase, false);

    leadPokemon.forEach(p => expect(p.getStatStage(Stat.ATK)).toBe(0));
  });

  test("should not protect the user and allies from single-target moves", async () => {
    game.override.enemyMoveset([MoveId.TACKLE]);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const leadPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.WIDE_GUARD);

    await game.phaseInterceptor.to(CommandPhase);

    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to(BerryPhase, false);

    expect(leadPokemon.some(p => p.hp < p.getMaxHp())).toBeTruthy();
  });

  test("should protect the user from its ally's multi-target move", async () => {
    game.override.enemyMoveset([MoveId.SPLASH]);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const leadPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.WIDE_GUARD);

    await game.phaseInterceptor.to(CommandPhase);

    game.move.select(MoveId.SURF, 1);

    await game.phaseInterceptor.to(BerryPhase, false);

    expect(leadPokemon[0].hp).toBe(leadPokemon[0].getMaxHp());
    enemyPokemon.forEach(p => expect(p.hp).toBeLessThan(p.getMaxHp()));
  });
});
