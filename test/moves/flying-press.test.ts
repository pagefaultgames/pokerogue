import { allAbilities, allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import type { PlayerPokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import { getEnumValues } from "#utils/enums";
import { toTitleCase } from "#utils/strings";
import Phaser from "phaser";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

describe.sequential("Move - Flying Press", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let hawlucha: PlayerPokemon;

  beforeAll(async () => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });

    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);

    await game.classicMode.startBattle([SpeciesId.HAWLUCHA]);
    hawlucha = game.field.getPlayerPokemon();
  });

  afterAll(() => {
    game.phaseInterceptor.restoreOg();
  });

  // Reset temporary summon data overrides to reset effects
  afterEach(() => {
    hawlucha.resetSummonData();
    expect(hawlucha).not.toHaveBattlerTag(BattlerTagType.ELECTRIFIED);
    expect(hawlucha.hasAbility(AbilityId.NORMALIZE)).toBe(false);
  });

  const pokemonTypes = getEnumValues(PokemonType);

  function checkEffForAllTypes(primaryType: PokemonType) {
    const enemy = game.field.getEnemyPokemon();
    for (const type of pokemonTypes) {
      enemy.summonData.types = [type];
      const primaryEff = enemy.getAttackTypeEffectiveness(primaryType, { source: hawlucha });
      const flyingEff = enemy.getAttackTypeEffectiveness(PokemonType.FLYING, { source: hawlucha });
      const flyingPressEff = enemy.getAttackTypeEffectiveness(hawlucha.getMoveType(allMoves[MoveId.FLYING_PRESS]), {
        source: hawlucha,
        move: allMoves[MoveId.FLYING_PRESS],
      });
      expect
        .soft(
          flyingPressEff,
          `Flying Press effectiveness against ${toTitleCase(PokemonType[type])} was incorrect!` +
            `\nExpected: ${flyingPressEff},` +
            `\nActual: ${primaryEff * flyingEff} (=${primaryEff} * ${flyingEff})`,
        )
        .toBe(primaryEff * flyingEff);
    }
  }

  describe("Normal", () => {
    it("should deal damage as a Fighting/Flying type move by default", async () => {
      checkEffForAllTypes(PokemonType.FIGHTING);
    });

    it("should deal damage as an Electric/Flying type move when Electrify is active", async () => {
      hawlucha.addTag(BattlerTagType.ELECTRIFIED);
      checkEffForAllTypes(PokemonType.ELECTRIC);
    });

    it("should deal damage as a Normal/Flying type move when Normalize is active", async () => {
      hawlucha.setTempAbility(allAbilities[AbilityId.NORMALIZE]);
      checkEffForAllTypes(PokemonType.NORMAL);
    });
  });

  describe("Inverse", () => {
    beforeAll(() => {
      game.challengeMode.addChallenge(Challenges.INVERSE_BATTLE, 1, 1);
    });
    it("should deal damage as a Fighting/Flying type move by default", async () => {
      checkEffForAllTypes(PokemonType.FIGHTING);
    });

    it("should deal damage as an Electric/Flying type move when Electrify is active", async () => {
      hawlucha.addTag(BattlerTagType.ELECTRIFIED);
      checkEffForAllTypes(PokemonType.ELECTRIC);
    });

    it("should deal damage as a Normal/Flying type move when Normalize is active", async () => {
      hawlucha.setTempAbility(allAbilities[AbilityId.NORMALIZE]);
      checkEffForAllTypes(PokemonType.NORMAL);
    });
  });

  it("should deal 2x to Wonder Guard Shedinja under Electrify", () => {
    const enemy = game.field.getEnemyPokemon();
    game.field.mockAbility(enemy, AbilityId.WONDER_GUARD);
    enemy.resetSummonData();

    hawlucha.addTag(BattlerTagType.ELECTRIFIED);

    const flyingPressEff = enemy.getAttackTypeEffectiveness(hawlucha.getMoveType(allMoves[MoveId.FLYING_PRESS]), {
      source: hawlucha,
      move: allMoves[MoveId.FLYING_PRESS],
    });
    expect(flyingPressEff).toBe(2);
  });
});
