import { allMoves } from "#data/data-lists";
import type { TypeDamageMultiplier } from "#data/type";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import type { EnemyPokemon, PlayerPokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import { stringifyEnumArray } from "#test/test-utils/string-utils";
import Phaser from "phaser";
import type { IntClosedRange, TupleOf } from "type-fest";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

type TypesArray = TupleOf<IntClosedRange<1, 3>, PokemonType>;

describe("Move - Freeze-Dry", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let feebas: PlayerPokemon;
  let enemy: EnemyPokemon;

  beforeAll(async () => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });

    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .ability(AbilityId.BALL_FETCH);

    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    feebas = game.field.getPlayerPokemon();
    enemy = game.field.getEnemyPokemon();
  });

  // Reset temp data after each test
  afterEach(() => {
    feebas.resetSummonData();
    enemy.resetSummonData();
    enemy.isTerastallized = false;
  });

  /**
   * Check that Freeze-Dry is the given effectiveness against the given type.
   * @param types - The base {@linkcode PokemonType}s to set; will populate `addedType` if above 3
   * @param expectedMult - The expected {@linkcode TypeDamageMultiplier}
   */
  function expectEffectiveness(types: TypesArray, expectedMult: TypeDamageMultiplier): void {
    enemy.summonData.types = types.slice(0, 2);
    if (types[2] !== undefined) {
      enemy.summonData.addedType = types[2];
    }

    const moveType = feebas.getMoveType(allMoves[MoveId.FREEZE_DRY]);
    const eff = enemy.getAttackTypeEffectiveness(moveType, { source: feebas, move: allMoves[MoveId.FREEZE_DRY] });
    expect(
      eff,
      `Freeze-dry effectiveness against ${stringifyEnumArray(PokemonType, types)} was ${eff} instead of ${expectedMult}!`,
    ).toBe(expectedMult);
  }

  describe("Normal", () => {
    it.each<{ name: string; types: TypesArray; eff: TypeDamageMultiplier }>([
      { name: "Pure Water", types: [PokemonType.WATER], eff: 2 },
      { name: "Water/Ground", types: [PokemonType.WATER, PokemonType.GROUND], eff: 4 },
      { name: "Water/Flying/Grass", types: [PokemonType.WATER, PokemonType.FLYING, PokemonType.GRASS], eff: 8 },
      { name: "Water/Fire", types: [PokemonType.WATER, PokemonType.FIRE], eff: 1 },
    ])("should be $effx effective against a $name-type opponent", ({ types, eff }) => {
      expectEffectiveness(types, eff);
    });

    it("should deal 2x dmg against soaked wonder guard target", async () => {
      game.field.mockAbility(enemy, AbilityId.WONDER_GUARD);

      expectEffectiveness([PokemonType.WATER], 2);
    });

    it("should consider the target's Tera Type", async () => {
      // Steel type terastallized into Water; 2x
      enemy.teraType = PokemonType.WATER;
      enemy.isTerastallized = true;

      expectEffectiveness([PokemonType.STEEL], 2);

      // Water type terastallized into steel; 0.5x
      enemy.teraType = PokemonType.STEEL;
      expectEffectiveness([PokemonType.WATER], 0.5);
    });

    it.each<{ name: string; types: TypesArray; eff: TypeDamageMultiplier }>([
      { name: "Pure Water", types: [PokemonType.WATER], eff: 2 },
      { name: "Water/Ghost", types: [PokemonType.WATER, PokemonType.GHOST], eff: 0 },
    ])("should be $effx effective against a $name-type opponent with Normalize", ({ types, eff }) => {
      game.field.mockAbility(feebas, AbilityId.NORMALIZE);
      expectEffectiveness(types, eff);
    });

    it("should not stack with Electrify", async () => {
      feebas.addTag(BattlerTagType.ELECTRIFIED);
      expect(feebas.getMoveType(allMoves[MoveId.FREEZE_DRY])).toBe(PokemonType.ELECTRIC);

      expectEffectiveness([PokemonType.WATER], 2);
    });
  });

  describe("Inverse Battle", () => {
    beforeAll(() => {
      game.challengeMode.overrideGameWithChallenges(Challenges.INVERSE_BATTLE, 1, 1);
    });

    it("should deal 2x damage to Water type", async () => {
      expectEffectiveness([PokemonType.WATER], 2);
    });

    it("should deal 2x damage to Water type under Normalize", async () => {
      game.field.mockAbility(feebas, AbilityId.NORMALIZE);
      expectEffectiveness([PokemonType.WATER], 2);
    });

    it("should still deal 2x damage to Water type under Electrify", async () => {
      feebas.addTag(BattlerTagType.ELECTRIFIED);
      expectEffectiveness([PokemonType.WATER], 2);
    });

    it("should deal 1x damage to Water/Flying type under Electrify", async () => {
      feebas.addTag(BattlerTagType.ELECTRIFIED);
      expectEffectiveness([PokemonType.WATER, PokemonType.FLYING], 1);
    });
  });
});
