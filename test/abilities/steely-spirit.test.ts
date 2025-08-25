import { allAbilities, allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Steely Spirit", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const steelySpiritMultiplier = 1.5;
  const moveToCheck = MoveId.IRON_HEAD;

  let ironHeadPower: number;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    ironHeadPower = allMoves[moveToCheck].power;
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("double")
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .moveset([MoveId.IRON_HEAD, MoveId.SPLASH])
      .enemyMoveset(MoveId.SPLASH);
    vi.spyOn(allMoves[moveToCheck], "calculateBattlePower");
  });

  it("increases Steel-type moves' power used by the user and its allies by 50%", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU, SpeciesId.SHUCKLE]);
    const boostSource = game.scene.getPlayerField()[1];
    const enemyToCheck = game.field.getEnemyPokemon();

    vi.spyOn(boostSource, "getAbility").mockReturnValue(allAbilities[AbilityId.STEELY_SPIRIT]);

    expect(boostSource.hasAbility(AbilityId.STEELY_SPIRIT)).toBe(true);

    game.move.select(moveToCheck, 0, enemyToCheck.getBattlerIndex());
    game.move.select(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(allMoves[moveToCheck].calculateBattlePower).toHaveReturnedWith(ironHeadPower * steelySpiritMultiplier);
  });

  it("stacks if multiple users with this ability are on the field.", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU, SpeciesId.PIKACHU]);
    const enemyToCheck = game.field.getEnemyPokemon();

    game.scene.getPlayerField().forEach(p => {
      vi.spyOn(p, "getAbility").mockReturnValue(allAbilities[AbilityId.STEELY_SPIRIT]);
    });

    expect(game.scene.getPlayerField().every(p => p.hasAbility(AbilityId.STEELY_SPIRIT))).toBe(true);

    game.move.select(moveToCheck, 0, enemyToCheck.getBattlerIndex());
    game.move.select(moveToCheck, 1, enemyToCheck.getBattlerIndex());
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(allMoves[moveToCheck].calculateBattlePower).toHaveReturnedWith(
      ironHeadPower * Math.pow(steelySpiritMultiplier, 2),
    );
  });

  it("does not take effect when suppressed", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU, SpeciesId.SHUCKLE]);
    const boostSource = game.scene.getPlayerField()[1];
    const enemyToCheck = game.field.getEnemyPokemon();

    vi.spyOn(boostSource, "getAbility").mockReturnValue(allAbilities[AbilityId.STEELY_SPIRIT]);
    expect(boostSource.hasAbility(AbilityId.STEELY_SPIRIT)).toBe(true);

    boostSource.summonData.abilitySuppressed = true;

    expect(boostSource.hasAbility(AbilityId.STEELY_SPIRIT)).toBe(false);
    expect(boostSource.summonData.abilitySuppressed).toBe(true);

    game.move.select(moveToCheck, 0, enemyToCheck.getBattlerIndex());
    game.move.select(MoveId.SPLASH, 1);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(allMoves[moveToCheck].calculateBattlePower).toHaveReturnedWith(ironHeadPower);
  });

  it("affects variable-type moves if their resolved type is Steel", async () => {
    game.override.ability(AbilityId.STEELY_SPIRIT).moveset([MoveId.REVELATION_DANCE]);

    const revelationDance = allMoves[MoveId.REVELATION_DANCE];
    vi.spyOn(revelationDance, "calculateBattlePower");

    await game.classicMode.startBattle([SpeciesId.KLINKLANG]);

    game.move.select(MoveId.REVELATION_DANCE);

    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(revelationDance.calculateBattlePower).toHaveReturnedWith(revelationDance.power * 1.5);
  });
});
