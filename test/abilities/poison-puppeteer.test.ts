import { allAbilities } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Poison Puppeteer", () => {
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
      .ability(AbilityId.POISON_PUPPETEER)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyLevel(100)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should confuse the target if the user poisons the target directly", async () => {
    await game.classicMode.startBattle([SpeciesId.MAREANIE]);

    game.move.use(MoveId.MORTAL_SPIN);
    await game.toEndOfTurn();

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon).toHaveStatusEffect(StatusEffect.POISON);
    expect(enemyPokemon).toHaveBattlerTag(BattlerTagType.CONFUSED);
  });

  it("should confuse the target if the user badly poisons the target directly", async () => {
    await game.classicMode.startBattle([SpeciesId.MAREANIE]);

    game.move.use(MoveId.TOXIC);
    await game.toEndOfTurn();

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon).toHaveStatusEffect(StatusEffect.TOXIC);
    expect(enemyPokemon).toHaveBattlerTag(BattlerTagType.CONFUSED);
  });

  it("should not confuse the target if the user poisons the target via Toxic Spikes", async () => {
    game.override.startingWave(5);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.TOXIC_SPIKES);
    await game.toNextTurn();

    game.move.use(MoveId.SPLASH);
    game.forceEnemyToSwitch();
    await game.toEndOfTurn();

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon).toHaveStatusEffect(StatusEffect.POISON);
    expect(enemyPokemon).not.toHaveBattlerTag(BattlerTagType.CONFUSED);
  });

  it("should not confuse the target if the user paralyzes the target", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.NUZZLE);
    await game.toEndOfTurn();

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon).toHaveStatusEffect(StatusEffect.PARALYSIS);
    expect(enemyPokemon).not.toHaveBattlerTag(BattlerTagType.CONFUSED);
  });

  it("should confuse the target if the target was poisoned due to Synchronize", async () => {
    game.override.passiveAbility(AbilityId.SYNCHRONIZE).enemyAbility(AbilityId.NO_GUARD);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.POISON_POWDER);
    await game.toEndOfTurn();

    expect(game.field.getEnemyPokemon()).toHaveStatusEffect(StatusEffect.POISON);
    expect(game.field.getEnemyPokemon()).toHaveBattlerTag(BattlerTagType.CONFUSED);
  });

  it("should confuse the target if the target was poisoned due to Toxic Chain", async () => {
    game.override.passiveAbility(AbilityId.TOXIC_CHAIN);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const toxicChainAttr = allAbilities[AbilityId.TOXIC_CHAIN].getAttrs("PostAttackApplyStatusEffectAbAttr")[0];
    // @ts-expect-error: `chance` is private
    vi.spyOn(toxicChainAttr, "chance", "get").mockReturnValue(100);

    game.move.use(MoveId.TACKLE);
    await game.toEndOfTurn();

    expect(game.field.getEnemyPokemon()).toHaveStatusEffect(StatusEffect.TOXIC);
    expect(game.field.getEnemyPokemon()).toHaveBattlerTag(BattlerTagType.CONFUSED);
  });
});
