import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Sweet Veil", () => {
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
      .moveset([MoveId.SPLASH, MoveId.REST, MoveId.YAWN])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.POWDER);
  });

  it("prevents the user and its allies from falling asleep", async () => {
    await game.classicMode.startBattle([SpeciesId.SWIRLIX, SpeciesId.MAGIKARP]);

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerField().every(p => p.status?.effect)).toBe(false);
  });

  it("causes Rest to fail when used by the user or its allies", async () => {
    game.override.enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.SWIRLIX, SpeciesId.MAGIKARP]);

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.REST, 1);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerField().every(p => p.status?.effect)).toBe(false);
  });

  it("causes Yawn to fail if used on the user or its allies", async () => {
    game.override.enemyMoveset(MoveId.YAWN);
    await game.classicMode.startBattle([SpeciesId.SWIRLIX, SpeciesId.MAGIKARP]);

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getPlayerField().every(p => !!p.getTag(BattlerTagType.DROWSY))).toBe(false);
  });

  it("prevents the user and its allies already drowsy due to Yawn from falling asleep.", async () => {
    game.override.enemySpecies(SpeciesId.PIKACHU).enemyLevel(5).startingLevel(5).enemyMoveset(MoveId.SPLASH);

    await game.classicMode.startBattle([SpeciesId.SHUCKLE, SpeciesId.SHUCKLE, SpeciesId.SWIRLIX]);

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.YAWN, 1, BattlerIndex.PLAYER);

    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.getPlayerField().some(p => !!p.getTag(BattlerTagType.DROWSY))).toBe(true);

    game.move.select(MoveId.SPLASH);
    game.doSwitchPokemon(2);

    expect(game.scene.getPlayerField().every(p => p.status?.effect)).toBe(false);
  });
});
