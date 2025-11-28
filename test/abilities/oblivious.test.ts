import { Gender } from "#data/gender";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Oblivious", () => {
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
      .ability(AbilityId.OBLIVIOUS)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .playerGender(Gender.FEMALE)
      .enemyGender(Gender.MALE);
  });

  it("should remove taunt when gained", async () => {
    game.override
      .ability(AbilityId.OBLIVIOUS)
      .enemyAbility(AbilityId.BALL_FETCH)
      .moveset(MoveId.SKILL_SWAP)
      .enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);
    const enemy = game.field.getEnemyPokemon();
    enemy.addTag(BattlerTagType.TAUNT);
    expect(enemy.getTag(BattlerTagType.TAUNT)).toBeDefined();

    game.move.select(MoveId.SKILL_SWAP);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.getTag(BattlerTagType.TAUNT)).toBeUndefined();
  });

  it("should remove infatuation when gained", async () => {
    game.override
      .ability(AbilityId.OBLIVIOUS)
      .enemyAbility(AbilityId.BALL_FETCH)
      .moveset(MoveId.SKILL_SWAP)
      .enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "isOppositeGender").mockReturnValue(true);
    enemy.addTag(BattlerTagType.INFATUATED, 5, MoveId.JUDGMENT, game.field.getPlayerPokemon().id); // sourceID needs to be defined
    expect(enemy.getTag(BattlerTagType.INFATUATED)).toBeTruthy();

    game.move.select(MoveId.SKILL_SWAP);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.getTag(BattlerTagType.INFATUATED)).toBeFalsy();
  });

  it("should make the user immune to Captivate", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    expect(feebas.isOppositeGender(enemy)).toBe(true);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.CAPTIVATE);
    await game.toNextTurn();

    expect(feebas).toHaveAbilityApplied(AbilityId.OBLIVIOUS);
    // TODO: This returning MISS instead of FAIL is unintuitive
    expect(enemy).toHaveUsedMove({ move: MoveId.CAPTIVATE, result: MoveResult.MISS });
    expect(feebas).toHaveStatStage(Stat.SPATK, 0);
  });
});
