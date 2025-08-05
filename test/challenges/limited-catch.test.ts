import { AbilityId } from "#enums/ability-id";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Challenges - Limited Catch", () => {
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

    game.challengeMode.addChallenge(Challenges.LIMITED_CATCH, 1, 1);
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.VOLTORB)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingModifier([{ name: "MASTER_BALL", count: 1 }])
      .moveset(MoveId.RAZOR_LEAF);
  });

  it("allows Pokémon to be caught on X1 waves", async () => {
    game.override.startingWave(31);
    await game.challengeMode.startBattle([SpeciesId.NUZLEAF]);

    game.doThrowPokeball(PokeballType.MASTER_BALL);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.getPlayerParty().length).toBe(2);
  });

  it("prevents Pokémon from being caught on waves that aren't X1 waves", async () => {
    game.override.startingWave(53);
    await game.challengeMode.startBattle([SpeciesId.NUZLEAF]);

    game.doThrowPokeball(PokeballType.MASTER_BALL);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.getPlayerParty().length).toBe(1);
  });
});
