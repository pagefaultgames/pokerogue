import { allMoves } from "#app/data/move.js";
import { Abilities } from "#app/enums/abilities.js";
import { ArenaTagType } from "#app/enums/arena-tag-type.js";
import { MoveEffectPhase, TurnEndPhase } from "#app/phases";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Arena - Gravity", () => {
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
    game.override.battleType("single");
    game.override.moveset([Moves.TACKLE, Moves.GRAVITY, Moves.FISSURE]);
    game.override.ability(Abilities.UNNERVE);
    game.override.enemyAbility(Abilities.BALL_FETCH);
    game.override.enemySpecies(Species.SHUCKLE);
    game.override.enemyMoveset(new Array(4).fill(Moves.SPLASH));
  });

  it("non-OHKO move accuracy is multiplied by 1.67", async () => {
    const moveToCheck = allMoves[Moves.TACKLE];

    vi.spyOn(moveToCheck, "calculateBattleAccuracy");

    // Setup Gravity on first turn
    await game.startBattle([Species.PIKACHU]);
    game.doAttack(getMovePosition(game.scene, 0, Moves.GRAVITY));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();

    // Use non-OHKO move on second turn
    await game.toNextTurn();
    game.doAttack(getMovePosition(game.scene, 0, Moves.TACKLE));
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattleAccuracy).toHaveReturnedWith(100 * 1.67);
  });

  it("OHKO move accuracy is not affected", async () => {
    game.override.startingLevel(5);
    game.override.enemyLevel(5);

    /** See Fissure {@link https://bulbapedia.bulbagarden.net/wiki/Fissure_(move)} */
    const moveToCheck = allMoves[Moves.FISSURE];

    vi.spyOn(moveToCheck, "calculateBattleAccuracy");

    // Setup Gravity on first turn
    await game.startBattle([Species.PIKACHU]);
    game.doAttack(getMovePosition(game.scene, 0, Moves.GRAVITY));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();

    // Use OHKO move on second turn
    await game.toNextTurn();
    game.doAttack(getMovePosition(game.scene, 0, Moves.FISSURE));
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattleAccuracy).toHaveReturnedWith(30);
  });
});
