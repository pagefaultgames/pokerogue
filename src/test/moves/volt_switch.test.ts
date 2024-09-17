import { BerryPhase } from "#app/phases/berry-phase";
import { Mode } from "#app/ui/ui";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Volt Switch", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const TIMEOUT = 20 * 1000;

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
      .moveset([Moves.SPLASH])
      .battleType("single")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("does not switch out the user if the move fails", async () => {
    game.override
      .enemySpecies(Species.DUGTRIO)
      .moveset(Moves.VOLT_SWITCH);
    await game.classicMode.startBattle([Species.RAICHU, Species.SHUCKLE]);

    game.move.select(Moves.VOLT_SWITCH);
    game.onNextPrompt("SwitchPhase", Mode.PARTY, () => {
      expect.fail("Switch was forced");
    }, () => game.isCurrentPhase(BerryPhase));
    await game.phaseInterceptor.to(BerryPhase, false);

    const playerPkm = game.scene.getPlayerPokemon()!;
    expect(playerPkm.species.speciesId).toEqual(Species.RAICHU);
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
  }, TIMEOUT);
});
