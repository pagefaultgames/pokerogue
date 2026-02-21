import { allAbilities, allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import type { EnemyPokemon, PlayerPokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import { getEnumValues } from "#utils/enums";
import { toTitleCase } from "#utils/strings";
import Phaser from "phaser";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

describe("Move - Flying Press", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let hawlucha: PlayerPokemon;
  let enemy: EnemyPokemon;

  beforeAll(async () => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });

    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);

    await game.classicMode.startBattle(SpeciesId.HAWLUCHA);

    hawlucha = game.field.getPlayerPokemon();
    enemy = game.field.getEnemyPokemon();
  });

  // Reset temp data after each test
  afterEach(() => {
    hawlucha.resetSummonData();
    enemy.resetSummonData();
  });

  const pokemonTypes = getEnumValues(PokemonType);

  function checkEffForAllTypes(primaryType: PokemonType) {
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
          `Flying Press effectiveness against ${toTitleCase(PokemonType[type])} was incorrect!`
            + `\nExpected: ${flyingPressEff},`
            + `\nActual: ${primaryEff * flyingEff} (=${primaryEff} * ${flyingEff})`,
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

    it("should deal 8x damage against a Normal/Ice type with Grass added", () => {
      enemy.summonData.types = [PokemonType.NORMAL, PokemonType.ICE];
      enemy.summonData.addedType = PokemonType.GRASS;

      const moveType = hawlucha.getMoveType(allMoves[MoveId.FLYING_PRESS]);
      const flyingPressEff = enemy.getAttackTypeEffectiveness(moveType, {
        source: hawlucha,
        move: allMoves[MoveId.FLYING_PRESS],
      });
      expect(flyingPressEff).toBe(8);
    });
  });

  describe("Inverse Battle", () => {
    beforeAll(() => {
      game.challengeMode.overrideGameWithChallenges(Challenges.INVERSE_BATTLE, 1, 1);
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

    it("should deal 0.125x damage against a Normal/Ice type with Grass added", () => {
      enemy.summonData.types = [PokemonType.NORMAL, PokemonType.ICE];
      enemy.summonData.addedType = PokemonType.GRASS;

      const moveType = hawlucha.getMoveType(allMoves[MoveId.FLYING_PRESS]);
      const flyingPressEff = enemy.getAttackTypeEffectiveness(moveType, {
        source: hawlucha,
        move: allMoves[MoveId.FLYING_PRESS],
      });
      expect(flyingPressEff).toBe(0.125);
    });
  });
});
