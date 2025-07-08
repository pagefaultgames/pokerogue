import { BattlerIndex } from "#enums/battler-index";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { BerryPhase } from "#app/phases/berry-phase";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Alluring Voice", () => {
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
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.ICE_SCALES)
      .enemyMoveset(MoveId.HOWL)
      .startingLevel(10)
      .enemyLevel(10)
      .ability(AbilityId.BALL_FETCH);
  });

  it("should confuse the opponent if their stat stages were raised", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.use(MoveId.ALLURING_VOICE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to(BerryPhase);

    expect(enemy.getTag(BattlerTagType.CONFUSED)?.tagType).toBe("CONFUSED");
  });
});
