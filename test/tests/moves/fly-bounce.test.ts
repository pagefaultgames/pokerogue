import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Fly and Bounce", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .ability(AbilityId.COMPOUND_EYES)
      .enemySpecies(SpeciesId.MAGIKARP)
      .startingLevel(100)
      .enemyLevel(100)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.TACKLE);
  });

  // TODO: Move to a global "semi-invuln charging moves" test file
  it.each([
    { name: "Fly", move: MoveId.FLY },
    { name: "Bounce", move: MoveId.BOUNCE },
  ])("$name should make the user semi-invulnerable, then attack over 2 turns", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.FLY);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    expect(player).toHaveUsedMove({ move: MoveId.FLY, result: MoveResult.OTHER });
    expect(player).toHaveBattlerTag(BattlerTagType.FLYING);
    expect(enemy).toHaveUsedMove({ move: MoveId.TACKLE, result: MoveResult.MISS });
    expect(enemy).toHaveFullHp();
    expect(player.getMoveQueue()[0]?.move).toBe(MoveId.FLY);

    await game.toNextTurn();

    expect(player).toHaveUsedMove({ move: MoveId.FLY, result: MoveResult.SUCCESS });
    expect(player).not.toHaveBattlerTag(BattlerTagType.FLYING);
    expect(player).toHaveUsedPP(MoveId.FLY, 1);
  });

  // TODO: Move to a No Guard test file
  it("should not allow the user to evade attacks from Pokemon with No Guard", async () => {
    game.override.enemyAbility(AbilityId.NO_GUARD);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.FLY);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(player).not.toHaveFullHp();
    expect(enemy).toHaveUsedMove({ move: MoveId.TACKLE, result: MoveResult.SUCCESS });
  });

  // TODO: We currently cancel Fly/Bounce in a really scuffed way.
  // TODO: Does this consume pp?
  it.todo.each<{ name: string; move: MoveId }>([
    { name: "Smack Down", move: MoveId.SMACK_DOWN },
    { name: "Thousand Arrows", move: MoveId.THOUSAND_ARROWS },
    { name: "Gravity", move: MoveId.GRAVITY },
  ])("should be cancelled immediately when $name is used", async ({ move }) => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.BOUNCE);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    // Bounce should've worked
    const player = game.field.getPlayerPokemon();
    expect(player).toHaveBattlerTag(BattlerTagType.FLYING);

    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.move.forceEnemyMove(move);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(player).not.toHaveBattlerTag(BattlerTagType.FLYING);
    expect(player).not.toHaveBattlerTag(BattlerTagType.CHARGING);
    expect(player.getMoveQueue()).toHaveLength(0);
    expect(player.visible).toBe(true);
    // check for tag addition for smack down/thousand arrows
    if (move !== MoveId.GRAVITY) {
      expect(player).not.toHaveFullHp();
      expect(player).toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
    }

    await game.toEndOfTurn();

    const enemy = game.field.getEnemyPokemon();
    expect(enemy).toHaveFullHp();
  });
});
