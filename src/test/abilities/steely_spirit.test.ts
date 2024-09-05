import { allAbilities } from "#app/data/ability";
import { allMoves } from "#app/data/move";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Steely Spirit", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const steelySpiritMultiplier = 1.5;
  const moveToCheck = Moves.IRON_HEAD;
  const ironHeadPower = allMoves[moveToCheck].power;

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
    game.override.battleType("double");
    game.override.enemySpecies(Species.SHUCKLE);
    game.override.enemyAbility(Abilities.BALL_FETCH);
    game.override.moveset([Moves.IRON_HEAD, Moves.SPLASH]);
    game.override.enemyMoveset(SPLASH_ONLY);
    vi.spyOn(allMoves[moveToCheck], "calculateBattlePower");
  });

  it("increases Steel-type moves' power used by the user and its allies by 50%", async () => {
    await game.classicMode.startBattle([Species.PIKACHU, Species.SHUCKLE]);
    const boostSource = game.scene.getPlayerField()[1];
    const enemyToCheck = game.scene.getEnemyPokemon()!;

    vi.spyOn(boostSource, "getAbility").mockReturnValue(allAbilities[Abilities.STEELY_SPIRIT]);

    expect(boostSource.hasAbility(Abilities.STEELY_SPIRIT)).toBe(true);

    game.move.select(moveToCheck, 0, enemyToCheck.getBattlerIndex());
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(allMoves[moveToCheck].calculateBattlePower).toHaveReturnedWith(ironHeadPower * steelySpiritMultiplier);
  });

  it("stacks if multiple users with this ability are on the field.", async () => {
    await game.classicMode.startBattle([Species.PIKACHU, Species.PIKACHU]);
    const enemyToCheck = game.scene.getEnemyPokemon()!;

    game.scene.getPlayerField().forEach(p => {
      vi.spyOn(p, "getAbility").mockReturnValue(allAbilities[Abilities.STEELY_SPIRIT]);
    });

    expect(game.scene.getPlayerField().every(p => p.hasAbility(Abilities.STEELY_SPIRIT))).toBe(true);

    game.move.select(moveToCheck, 0, enemyToCheck.getBattlerIndex());
    game.move.select(moveToCheck, 1, enemyToCheck.getBattlerIndex());
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(allMoves[moveToCheck].calculateBattlePower).toHaveReturnedWith(ironHeadPower * Math.pow(steelySpiritMultiplier, 2));
  });

  it("does not take effect when suppressed", async () => {
    await game.classicMode.startBattle([Species.PIKACHU, Species.SHUCKLE]);
    const boostSource = game.scene.getPlayerField()[1];
    const enemyToCheck = game.scene.getEnemyPokemon()!;

    vi.spyOn(boostSource, "getAbility").mockReturnValue(allAbilities[Abilities.STEELY_SPIRIT]);
    expect(boostSource.hasAbility(Abilities.STEELY_SPIRIT)).toBe(true);

    boostSource.summonData.abilitySuppressed = true;

    expect(boostSource.hasAbility(Abilities.STEELY_SPIRIT)).toBe(false);
    expect(boostSource.summonData.abilitySuppressed).toBe(true);

    game.move.select(moveToCheck, 0, enemyToCheck.getBattlerIndex());
    game.move.select(Moves.SPLASH, 1);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(allMoves[moveToCheck].calculateBattlePower).toHaveReturnedWith(ironHeadPower);
  });

  it("affects variable-type moves if their resolved type is Steel", async () => {
    game.override
      .ability(Abilities.STEELY_SPIRIT)
      .moveset([Moves.REVELATION_DANCE]);

    const revelationDance = allMoves[Moves.REVELATION_DANCE];
    vi.spyOn(revelationDance, "calculateBattlePower");

    await game.classicMode.startBattle([Species.KLINKLANG]);

    game.move.select(Moves.REVELATION_DANCE);

    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(revelationDance.calculateBattlePower).toHaveReturnedWith(revelationDance.power * 1.5);
  });
});
