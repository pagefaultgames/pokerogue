import { pokerogueApi } from "#api/pokerogue-api";
import { BattleType } from "#enums/battle-type";
import { BiomeId } from "#enums/biome-id";
import { Challenges } from "#enums/challenges";
import { GameModes } from "#enums/game-modes";
import { MoveId } from "#enums/move-id";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { TrainerType } from "#enums/trainer-type";
import { GameManager } from "#test/test-utils/game-manager";
import { mockI18next } from "#test/test-utils/test-utils";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Helper function to run tests on cactching mons
 *
 * @remarks
 * - Starts a run on the desired game mode, then attempts to throw a ball
 * - If still in the command phase (meaning the ball did not catch) uses a move to proceed
 * - If expecting success, checks that party length has increased by 1
 * - Otherwise, checks that {@link i18next} has been called on the requested error key
 *
 * @param game - The {@link GameManager} instance
 * @param ball - The {@link PokeballType} to be used for the catch attempt
 * @param expectedResult - Either "success" if the enemy should be caught, or the expected locales error key
 * @param mode - One of "classic", "daily", or "challenge"; defaults to "classic".
 */
async function runPokeballTest(
  game: GameManager,
  ball: PokeballType,
  expectedResult: string,
  mode: "classic" | "daily" | "challenge" = "classic",
) {
  if (mode === "classic") {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
  } else if (mode === "daily") {
    // Have to do it this way because daily run is weird...
    await game.runToFinalBossEncounter([SpeciesId.MAGIKARP], GameModes.DAILY);
  } else if (mode === "challenge") {
    await game.challengeMode.startBattle([SpeciesId.MAGIKARP]);
  }

  const partyLength = game.scene.getPlayerParty().length;

  game.scene.pokeballCounts[ball] = 1;

  const tSpy = mockI18next();

  game.doThrowPokeball(ball);

  // If still in the command phase due to ball failing, use a move to go on
  if (game.isCurrentPhase("CommandPhase")) {
    game.move.select(MoveId.SPLASH);
  }

  await game.toEndOfTurn();
  if (expectedResult === "success") {
    // Check that a mon has been caught by noticing that party length has increased
    expect(game.scene.getPlayerParty()).toHaveLength(partyLength + 1);
  } else {
    expect(tSpy).toHaveBeenCalledWith(expectedResult);
  }
}

describe("Throwing balls in classic", () => {
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
      .startingWave(199)
      .startingBiome(BiomeId.END)
      .battleStyle("single")
      .moveset([MoveId.SPLASH])
      .enemyMoveset([MoveId.SPLASH])
      .startingLevel(9999);
  });

  it("throwing ball at two mons", async () => {
    game.override.startingWave(21).startingBiome(BiomeId.TOWN);
    game.override.battleStyle("double");
    await runPokeballTest(game, PokeballType.MASTER_BALL, "battle:noPokeballMulti");
  });

  it("throwing ball in end biome", async () => {
    await runPokeballTest(game, PokeballType.MASTER_BALL, "battle:noPokeballForce");
  });

  it("throwing ball at two mons in end biome", async () => {
    game.override.battleStyle("double");
    await runPokeballTest(game, PokeballType.MASTER_BALL, "battle:noPokeballForce");
  });

  it("throwing ball at two previously caught mon in end biome", async () => {
    await game.importData("./test/test-utils/saves/everything.prsv");
    await runPokeballTest(game, PokeballType.MASTER_BALL, "success");
  });

  it("throwing ball at two mons in end biome", async () => {
    game.override.battleStyle("double");
    await game.importData("./test/test-utils/saves/everything.prsv");
    await runPokeballTest(game, PokeballType.MASTER_BALL, "battle:noPokeballMulti");
  });

  it("throwing ball at final boss", async () => {
    game.override.startingWave(200);
    await runPokeballTest(game, PokeballType.MASTER_BALL, "battle:noPokeballForceFinalBoss");
  });

  it("throwing rogue ball at final boss with full dex", async () => {
    await game.importData("./test/test-utils/saves/everything.prsv");
    game.override.startingWave(200);
    await runPokeballTest(game, PokeballType.ROGUE_BALL, "battle:noPokeballForceFinalBossCatchable");
  });

  it("throwing master ball at final boss with full dex", async () => {
    await game.importData("./test/test-utils/saves/everything.prsv");
    game.override.startingWave(200);
    await runPokeballTest(game, PokeballType.MASTER_BALL, "success");
  });
});

describe("Throwing balls in fresh start challenge", () => {
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
    game.challengeMode.addChallenge(Challenges.FRESH_START, 2, 1);
    game.override
      .startingWave(199)
      .startingBiome(BiomeId.END)
      .battleStyle("single")
      .moveset([MoveId.SPLASH])
      .enemyMoveset([MoveId.SPLASH])
      .startingLevel(9999);
  });

  // Tests should give the same result as a normal classic run, except for the last one
  it("throwing ball in end biome", async () => {
    await runPokeballTest(game, PokeballType.MASTER_BALL, "battle:noPokeballForce", "challenge");
  });

  it("throwing ball at previously caught mon in end biome", async () => {
    await game.importData("./test/test-utils/saves/everything.prsv");
    await runPokeballTest(game, PokeballType.MASTER_BALL, "success", "challenge");
  });

  it("throwing ball at final boss", async () => {
    game.override.startingWave(200);
    await runPokeballTest(game, PokeballType.MASTER_BALL, "battle:noPokeballForceFinalBoss", "challenge");
  });

  it("throwing rogue ball at final boss with full dex", async () => {
    await game.importData("./test/test-utils/saves/everything.prsv");
    game.override.startingWave(200);
    await runPokeballTest(game, PokeballType.ROGUE_BALL, "battle:noPokeballForceFinalBossCatchable", "challenge");
  });

  // If a challenge is active, even if the dex is complete we still need to weaken the final boss to master ball it
  it("throwing ball at final boss with full dex", async () => {
    await game.importData("./test/test-utils/saves/everything.prsv");
    game.override.startingWave(200);
    await runPokeballTest(game, PokeballType.MASTER_BALL, "battle:noPokeballForceFinalBossCatchable", "challenge");
  });
});

describe("Throwing balls in full fresh start challenge", () => {
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
    game.challengeMode.addChallenge(Challenges.FRESH_START, 1, 1);
    game.override
      .startingWave(199)
      .startingBiome(BiomeId.END)
      .battleStyle("single")
      .moveset([MoveId.SPLASH])
      .enemyMoveset([MoveId.SPLASH])
      .startingLevel(9999);
  });

  // Paradox mons and final boss can NEVER be caught in the full fresh start challenge
  it("throwing ball at previously caught mon in end biome", async () => {
    await game.importData("./test/test-utils/saves/everything.prsv");
    await runPokeballTest(game, PokeballType.MASTER_BALL, "battle:noPokeballForce", "challenge");
  });

  it("throwing ball at final boss with full dex", async () => {
    await game.importData("./test/test-utils/saves/everything.prsv");
    game.override.startingWave(200);
    await runPokeballTest(game, PokeballType.MASTER_BALL, "battle:noPokeballForceFinalBoss", "challenge");
  });
});

describe("Throwing balls in daily run", () => {
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
    vi.spyOn(pokerogueApi.daily, "getSeed").mockResolvedValue("test-seed");
    game.override
      .startingWave(50)
      .startingBiome(BiomeId.END)
      .battleStyle("single")
      .moveset([MoveId.SPLASH])
      .enemyMoveset([MoveId.SPLASH])
      .startingLevel(9999);
  });

  it("throwing ball at daily run boss", async () => {
    await runPokeballTest(game, PokeballType.MASTER_BALL, "battle:noPokeballForceFinalBoss", "daily");
  });
});

describe("Throwing balls at trainers", () => {
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
      .battleType(BattleType.TRAINER)
      .randomTrainer({ trainerType: TrainerType.ACE_TRAINER })
      .moveset([MoveId.SPLASH])
      .enemyMoveset([MoveId.SPLASH])
      .startingLevel(9999);
  });

  it("throwing ball at a trainer", async () => {
    game.override.startingWave(21);
    await runPokeballTest(game, PokeballType.MASTER_BALL, "battle:noPokeballTrainer");
  });

  it("throwing ball at a trainer in a double battle", async () => {
    game.override.startingWave(21).randomTrainer({ trainerType: TrainerType.TWINS });
    await runPokeballTest(game, PokeballType.MASTER_BALL, "battle:noPokeballTrainer");
  });

  it("throwing ball at a trainer in the end biome", async () => {
    game.override.startingWave(195).startingBiome(BiomeId.END);
    await runPokeballTest(game, PokeballType.MASTER_BALL, "battle:noPokeballTrainer");
  });
});
