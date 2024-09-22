import { SemiInvulnerableTag } from "#app/data/battler-tags";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from "vitest";

describe("Moves - Metronome", () => {
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
      .moveset([Moves.METRONOME])
      .battleType("single")
      .startingLevel(100)
      .enemyLevel(100)
      .enemySpecies(Species.SHUCKLE)
      .enemyMoveset(Moves.SPLASH)
      .enemyAbility(Abilities.BALL_FETCH);
  });

  it("should have one semi-invulnerable turn and deal damage on the second turn when a semi-invulnerable move is called", async () => {
    await game.classicMode.startBattle([Species.REGIELEKI]);
    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;
    vi.spyOn(player, "randSeedInt").mockReturnValue(Moves.DIVE);

    game.move.select(Moves.METRONOME);
    await game.toNextTurn();

    expect(player.getTag(SemiInvulnerableTag)).toBeTruthy();
    await game.move.forceHit(); // Force hit on Dive, required due to randSeedInt mock making hitCheck return false every time.

    await game.toNextTurn();
    expect(player.getTag(SemiInvulnerableTag)).toBeFalsy();
    expect(enemy.isFullHp()).toBeFalsy();
  });

  // FAILS UNTIL KEV'S MOVE PHASE REFACTOR IS PUT IN
  // it("should apply secondary effects of a move", async () => {
  //   await game.classicMode.startBattle([Species.REGIELEKI]);
  //   const player = game.scene.getPlayerPokemon()!;
  //   vi.spyOn(player, "randSeedInt").mockReturnValue(Moves.WOOD_HAMMER);

  //   game.move.select(Moves.METRONOME);
  //   await game.phaseInterceptor.to("MoveEffectPhase"); // Metronome has its own MoveEffectPhase, followed by Wood Hammer's MoveEffectPhase
  //   await game.move.forceHit(); // Calls forceHit on Wood Hammer's MoveEffectPhase, required due to randSeedInt mock making hitCheck return false every time.
  //   await game.toNextTurn();

  //   expect(player.isFullHp()).toBeFalsy();
  // });
});
