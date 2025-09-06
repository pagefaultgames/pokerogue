import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Move - Focus Energy", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should increase the user's crit ratio by 2 stages", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.FOCUS_ENERGY);
    await game.toNextTurn();

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveBattlerTag({ tagType: BattlerTagType.CRIT_BOOST, critStages: 2 });

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getCritStage");

    game.move.use(MoveId.TACKLE);
    await game.toEndOfTurn();

    expect(enemy.getCritStage).toHaveReturnedWith(2);
  });

  it.each([
    { name: "Focus Energy", tagType: BattlerTagType.CRIT_BOOST },
    { name: "Dragon Cheer", tagType: BattlerTagType.DRAGON_CHEER },
  ])("should fail if $name is already present", async ({ tagType }) => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    feebas.addTag(tagType);

    game.move.use(MoveId.FOCUS_ENERGY);
    await game.toEndOfTurn();

    expect(feebas).toHaveUsedMove({ move: MoveId.FOCUS_ENERGY, result: MoveResult.FAIL });
  });
});
