import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
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
      .enemySpecies(SpeciesId.SNORLAX)
      .startingLevel(100)
      .enemyLevel(100)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.TACKLE);
  });

  // TODO: Move to a global "charging moves" test file
  it.each([
    { name: "Fly", move: MoveId.FLY },
    { name: "Bounce", move: MoveId.BOUNCE },
  ])("should make the user semi-invulnerable, then attack over 2 turns", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    game.move.use(MoveId.FLY);
    await game.toEndOfTurn();

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    expect(player).toHaveBattlerTag(BattlerTagType.FLYING);
    expect(enemy.getLastXMoves(1)[0].result).toBe(MoveResult.MISS);
    expect(player.hp).toBe(player.getMaxHp());
    expect(enemy.hp).toBe(enemy.getMaxHp());
    expect(player.getMoveQueue()[0].move).toBe(MoveId.FLY);

    await game.toEndOfTurn();
    expect(player).not.toHaveBattlerTag(BattlerTagType.FLYING);
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
    expect(player.getMoveHistory()).toHaveLength(2);

    const playerFly = player.getMoveset().find(mv => mv && mv.moveId === MoveId.FLY);
    expect(playerFly?.ppUsed).toBe(1);
  });

  // TODO: Move to a No Guard test file
  it("should not allow the user to evade attacks from Pokemon with No Guard", async () => {
    game.override.enemyAbility(AbilityId.NO_GUARD);

    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.use(MoveId.FLY);

    await game.toEndOfTurn();
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
    expect(enemyPokemon.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);
  });

  // TODO: We currently cancel Fly/Bounce in a really scuffed way.
  // TODO: Does this consume pp?
  it.todo.each<{ name: string; move: MoveId }>([
    { name: "Smack Down", move: MoveId.SMACK_DOWN },
    { name: "Thousand Arrows", move: MoveId.THOUSAND_ARROWS },
    { name: "Gravity", move: MoveId.GRAVITY },
  ])("should be cancelled immediately when $name is used", async ({ move }) => {
    await game.classicMode.startBattle(SpeciesId.AZURILL);

    game.move.use(MoveId.BOUNCE);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    // Bounce should've worked
    const azurill = game.field.getPlayerPokemon();
    expect(azurill).toHaveBattlerTag(BattlerTagType.FLYING);

    await game.move.forceEnemyMove(move);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(azurill).not.toHaveBattlerTag(BattlerTagType.FLYING);
    expect(azurill).not.toHaveBattlerTag(BattlerTagType.CHARGING);
    expect(azurill.getMoveQueue()).toHaveLength(0);
    expect(azurill.visible).toBe(true);
    // check for tag addition for smack down/thousand arrows
    if (move !== MoveId.GRAVITY) {
      expect(azurill).not.toHaveFullHp();
      expect(azurill).toHaveBattlerTag(BattlerTagType.IGNORE_FLYING);
    }

    await game.toEndOfTurn();

    const snorlax = game.field.getEnemyPokemon();
    expect(snorlax).toHaveFullHp();
  });
});
