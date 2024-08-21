import { allMoves } from "#app/data/move.js";
import { Abilities } from "#app/enums/abilities.js";
import { ArenaTagType } from "#app/enums/arena-tag-type.js";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MoveEffectPhase } from "#app/phases/move-effect-phase.js";
import { TurnEndPhase } from "#app/phases/turn-end-phase.js";
import { ArenaTagSide } from "#app/data/arena-tag.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";

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
    game.override.moveset([Moves.TACKLE, Moves.GRAVITY, Moves.FISSURE, Moves.FLY]);
    game.override.ability(Abilities.UNNERVE);
    game.override.enemyAbility(Abilities.BALL_FETCH);
    game.override.enemySpecies(Species.SHUCKLE);
    game.override.enemyMoveset(new Array(4).fill(Moves.GROWL)); // Splash is unselectable under gravity effects.
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

  it(
    "should last for 5 turns on both sides",
    async () => {
      await game.startBattle([Species.RATTATA]);

      game.doAttack(getMovePosition(game.scene, 0, Moves.GRAVITY));

      for (let i = 0; i < 4; i++) { // Gravity tag should be defined for 5 turns (1 turn before this loop, 4 turns from this loop)
        await game.toNextTurn();
        expect(game.scene.arena.getTagOnSide(ArenaTagType.GRAVITY, ArenaTagSide.PLAYER)).toBeDefined();
        expect(game.scene.arena.getTagOnSide(ArenaTagType.GRAVITY, ArenaTagSide.ENEMY)).toBeDefined();
        game.doAttack(getMovePosition(game.scene, 0, Moves.GROWL));
      }

      await game.toNextTurn();
      expect(game.scene.arena.getTagOnSide(ArenaTagType.GRAVITY, ArenaTagSide.PLAYER)).toBeUndefined();
      expect(game.scene.arena.getTagOnSide(ArenaTagType.GRAVITY, ArenaTagSide.ENEMY)).toBeUndefined();
    });

  it(
    "should interrupt any pokemon in the semi-invulnerable state of Fly",
    async () => {
      game.override.enemyMoveset(Array(4).fill(Moves.GRAVITY));
      await game.startBattle([Species.REGIELEKI]);
      const playerPokemon = game.scene.getPlayerPokemon()!;

      game.doAttack(getMovePosition(game.scene, 0, Moves.FLY));
      // Finish Fly's MoveEffectPhase and check for BattlerTagType.FLYING
      await game.phaseInterceptor.to(MoveEffectPhase, true);
      expect(playerPokemon.getTag(BattlerTagType.FLYING)).toBeTruthy();

      // Enemy Shuckle uses Gravity, removes playerPokemon from Fly
      await game.toNextTurn();
      expect(playerPokemon.getTag(BattlerTagType.FLYING)).toBeFalsy();
    });
});
