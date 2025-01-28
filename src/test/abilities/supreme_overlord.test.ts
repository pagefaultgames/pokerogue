import { Moves } from "#app/enums/moves";
import { Abilities } from "#enums/abilities";
import { Species } from "#enums/species";
import { BattlerIndex } from "#app/battle";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { MessagePhase } from "#app/phases/message-phase";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { allMoves } from "#app/data/move";

describe("Abilities - Supreme Overlord", () => {
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
      .battleType("single")
      .enemySpecies(Species.MAGIKARP)
      .enemyLevel(100)
      .startingLevel(1)
      .enemyAbility(Abilities.BALL_FETCH)
      .ability(Abilities.SUPREME_OVERLORD)
      .enemyMoveset([ Moves.SPLASH ])
      .moveset([ Moves.TACKLE, Moves.EXPLOSION ]);
  });

  it("should increase Power by 20% if 2 Pokemon are fainted in the party", async() => {
    await game.startBattle([ Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE ]);

    const moveToCheck = allMoves[Moves.TACKLE];
    const basePower = moveToCheck.power;

    vi.spyOn(moveToCheck, "calculateBattlePower");

    game.move.select(Moves.EXPLOSION);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.move.select(Moves.EXPLOSION);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    game.doSelectPartyPokemon(2);
    await game.toNextTurn();

    game.move.select(Moves.TACKLE);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to(MoveEffectPhase);

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(basePower * 1.2);
  });
});
