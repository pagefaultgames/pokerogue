import { Stat } from "#enums/stat";
import GameManager from "#test/testUtils/gameManager";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { EnemyCommandPhase } from "#app/phases/enemy-command-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";

describe("Moves - Growth", () => {
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
      .battleStyle("single")
      .enemyAbility(AbilityId.MOXIE)
      .ability(AbilityId.INSOMNIA)
      .moveset([MoveId.GROWTH])
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should raise SPATK stat stage by 1", async () => {
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(0);

    game.move.select(MoveId.GROWTH);
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnInitPhase);

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(1);
  });
});
