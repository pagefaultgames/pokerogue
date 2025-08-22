import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Move - Dragon Cheer", () => {
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
      .battleStyle("double")
      .ability(AbilityId.BALL_FETCH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(20);
  });

  it("should increase non-Dragon type allies' crit ratios by 1 stage", async () => {
    await game.classicMode.startBattle([SpeciesId.DRAGONAIR, SpeciesId.MAGIKARP]);

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getCritStage");

    game.move.use(MoveId.DRAGON_CHEER, BattlerIndex.PLAYER);
    game.move.use(MoveId.TACKLE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.toEndOfTurn();

    const [dragonair, magikarp] = game.scene.getPlayerField();
    expect(dragonair).not.toHaveBattlerTag(BattlerTagType.DRAGON_CHEER);
    expect(magikarp).toHaveBattlerTag({ tagType: BattlerTagType.DRAGON_CHEER, critStages: 1 });
    expect(enemy.getCritStage).toHaveReturnedWith(1); // getCritStage is called on defender
  });

  it("should increase Dragon-type allies' crit ratios by 2 stages", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.DRAGONAIR]);

    const enemy = game.field.getEnemyPokemon();
    vi.spyOn(enemy, "getCritStage");

    game.move.use(MoveId.DRAGON_CHEER, BattlerIndex.PLAYER);
    game.move.use(MoveId.TACKLE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.toEndOfTurn();

    const [magikarp, dragonair] = game.scene.getPlayerField();
    expect(magikarp).not.toHaveBattlerTag(BattlerTagType.DRAGON_CHEER);
    expect(dragonair).toHaveBattlerTag({ tagType: BattlerTagType.DRAGON_CHEER, critStages: 2 });
    expect(enemy.getCritStage).toHaveReturnedWith(2); // getCritStage is called on defender
  });

  it("should maintain crit boost amount even if user's type is changed", async () => {
    await game.classicMode.startBattle([SpeciesId.DRAGONAIR, SpeciesId.MAGIKARP]);

    // Use Reflect Type to become Dragon-type mid-turn
    game.move.use(MoveId.DRAGON_CHEER, BattlerIndex.PLAYER);
    game.move.use(MoveId.REFLECT_TYPE, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("MoveEndPhase");

    // Dragon cheer added +1 stages
    const magikarp = game.scene.getPlayerField()[1];
    expect(magikarp).toHaveBattlerTag({ tagType: BattlerTagType.DRAGON_CHEER, critStages: 1 });
    expect(magikarp).toHaveTypes([PokemonType.WATER]);

    await game.toEndOfTurn();

    // Should be dragon type, but still with a +1 stage boost
    expect(magikarp).toHaveTypes([PokemonType.DRAGON]);
    expect(magikarp).toHaveBattlerTag({ tagType: BattlerTagType.DRAGON_CHEER, critStages: 1 });
  });

  it.each([
    { name: "Focus Energy", tagType: BattlerTagType.CRIT_BOOST },
    { name: "Dragon Cheer", tagType: BattlerTagType.DRAGON_CHEER },
  ])("should fail if $name is already present", async ({ tagType }) => {
    await game.classicMode.startBattle([SpeciesId.DRAGONAIR, SpeciesId.MAGIKARP]);

    const [dragonair, magikarp] = game.scene.getPlayerField();
    magikarp.addTag(tagType);

    game.move.use(MoveId.DRAGON_CHEER, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    expect(dragonair).toHaveUsedMove({ move: MoveId.DRAGON_CHEER, result: MoveResult.FAIL });
    expect(magikarp).toHaveBattlerTag(tagType);
  });
});
