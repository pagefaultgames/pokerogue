import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Fusion Bolt", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const fusionBolt = MoveId.FUSION_BOLT;

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
      .moveset([fusionBolt])
      .startingLevel(1)
      .enemySpecies(SpeciesId.RESHIRAM)
      .enemyAbility(AbilityId.ROUGH_SKIN)
      .enemyMoveset(MoveId.SPLASH)
      .battleStyle("single")
      .startingWave(97)
      .criticalHits(false);
  });

  it("should not make contact", async () => {
    await game.classicMode.startBattle([SpeciesId.ZEKROM]);

    const partyMember = game.field.getPlayerPokemon();
    const initialHp = partyMember.hp;

    game.move.select(fusionBolt);

    await game.toNextTurn();

    expect(initialHp - partyMember.hp).toBe(0);
  });
});
