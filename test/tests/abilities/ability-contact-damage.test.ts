import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Contact Damage (Rough Skin, Iron Barbs)", () => {
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
      .battleType(BattleType.TRAINER)
      .ability(AbilityId.ROUGH_SKIN)
      .enemyAbility(AbilityId.WONDER_GUARD)
      .enemyLevel(1)
      .startingLevel(100)
      .startingWave(5);
  });

  it("shouldn't cause the replacement pokemon to faint when a pivot move user faints from contact damage", async () => {
    game.override.enemyMoveset([MoveId.U_TURN, MoveId.FLIP_TURN]);
    await game.classicMode.startBattle(SpeciesId.FURRET, SpeciesId.FEEBAS);

    const firstEnemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    expect(firstEnemy).toHaveFainted();
    const secondEnemy = game.field.getEnemyPokemon();
    expect(secondEnemy).not.toHaveFainted();

    // Second enemy uses Flip Turn and also faints from contact damage
    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(secondEnemy).toHaveFainted();
    expect(game.isVictory()).toBe(true);
  });
});
