import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Wind Rider", () => {
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
      .enemySpecies(SpeciesId.SHIFTRY)
      .enemyAbility(AbilityId.WIND_RIDER)
      .moveset([MoveId.TAILWIND, MoveId.SPLASH, MoveId.PETAL_BLIZZARD, MoveId.SANDSTORM])
      .enemyMoveset(MoveId.SPLASH);
  });

  it("takes no damage from wind moves and its ATK stat stage is raised by 1 when hit by one", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const shiftry = game.field.getEnemyPokemon();

    expect(shiftry.getStatStage(Stat.ATK)).toBe(0);

    game.move.select(MoveId.PETAL_BLIZZARD);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(shiftry.isFullHp()).toBe(true);
    expect(shiftry.getStatStage(Stat.ATK)).toBe(1);
  });

  it("ATK stat stage is raised by 1 when Tailwind is present on its side", async () => {
    game.override.enemySpecies(SpeciesId.MAGIKARP).ability(AbilityId.WIND_RIDER);

    await game.classicMode.startBattle([SpeciesId.SHIFTRY]);
    const shiftry = game.field.getPlayerPokemon();

    expect(shiftry.getStatStage(Stat.ATK)).toBe(0);

    game.move.select(MoveId.TAILWIND);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(shiftry.getStatStage(Stat.ATK)).toBe(1);
  });

  it("does not raise ATK stat stage when Tailwind is present on opposing side", async () => {
    game.override.enemySpecies(SpeciesId.MAGIKARP).ability(AbilityId.WIND_RIDER);

    await game.classicMode.startBattle([SpeciesId.SHIFTRY]);
    const magikarp = game.field.getEnemyPokemon();
    const shiftry = game.field.getPlayerPokemon();

    expect(shiftry.getStatStage(Stat.ATK)).toBe(0);
    expect(magikarp.getStatStage(Stat.ATK)).toBe(0);

    game.move.select(MoveId.TAILWIND);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(shiftry.getStatStage(Stat.ATK)).toBe(1);
    expect(magikarp.getStatStage(Stat.ATK)).toBe(0);
  });

  it("does not raise ATK stat stage when Tailwind is present on opposing side", async () => {
    game.override.enemySpecies(SpeciesId.MAGIKARP).ability(AbilityId.WIND_RIDER);

    await game.classicMode.startBattle([SpeciesId.SHIFTRY]);
    const magikarp = game.field.getEnemyPokemon();
    const shiftry = game.field.getPlayerPokemon();

    expect(shiftry.getStatStage(Stat.ATK)).toBe(0);
    expect(magikarp.getStatStage(Stat.ATK)).toBe(0);

    game.move.select(MoveId.TAILWIND);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(shiftry.getStatStage(Stat.ATK)).toBe(1);
    expect(magikarp.getStatStage(Stat.ATK)).toBe(0);
  });

  it("does not interact with Sandstorm", async () => {
    game.override.enemySpecies(SpeciesId.MAGIKARP);

    await game.classicMode.startBattle([SpeciesId.SHIFTRY]);
    const shiftry = game.field.getPlayerPokemon();

    expect(shiftry.getStatStage(Stat.ATK)).toBe(0);
    expect(shiftry.isFullHp()).toBe(true);

    game.move.select(MoveId.SANDSTORM);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(shiftry.getStatStage(Stat.ATK)).toBe(0);
    expect(shiftry.hp).lessThan(shiftry.getMaxHp());
  });
});
