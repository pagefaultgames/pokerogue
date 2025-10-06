import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Wind Power", () => {
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
      .enemyAbility(AbilityId.WIND_POWER)
      .moveset([MoveId.TAILWIND, MoveId.SPLASH, MoveId.PETAL_BLIZZARD, MoveId.SANDSTORM])
      .enemyMoveset(MoveId.SPLASH);
  });

  it("becomes charged when hit by wind moves", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const shiftry = game.field.getEnemyPokemon();

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeUndefined();

    game.move.select(MoveId.PETAL_BLIZZARD);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeDefined();
  });

  it("becomes charged when Tailwind takes effect on its side", async () => {
    game.override.ability(AbilityId.WIND_POWER).enemySpecies(SpeciesId.MAGIKARP);

    await game.classicMode.startBattle([SpeciesId.SHIFTRY]);
    const shiftry = game.field.getPlayerPokemon();

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeUndefined();

    game.move.select(MoveId.TAILWIND);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeDefined();
  });

  it("does not become charged when Tailwind takes effect on opposing side", async () => {
    game.override.enemySpecies(SpeciesId.MAGIKARP).ability(AbilityId.WIND_POWER);

    await game.classicMode.startBattle([SpeciesId.SHIFTRY]);
    const magikarp = game.field.getEnemyPokemon();
    const shiftry = game.field.getPlayerPokemon();

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeUndefined();
    expect(magikarp.getTag(BattlerTagType.CHARGED)).toBeUndefined();

    game.move.select(MoveId.TAILWIND);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeDefined();
    expect(magikarp.getTag(BattlerTagType.CHARGED)).toBeUndefined();
  });

  it("does not interact with Sandstorm", async () => {
    game.override.enemySpecies(SpeciesId.MAGIKARP);

    await game.classicMode.startBattle([SpeciesId.SHIFTRY]);
    const shiftry = game.field.getPlayerPokemon();

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeUndefined();

    game.move.select(MoveId.SANDSTORM);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeUndefined();
  });
});
