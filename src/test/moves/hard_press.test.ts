import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import { Species } from "#enums/species";
import {
  MoveEffectPhase,
} from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { NumberHolder } from "#app/utils.js";
import Move from "#app/data/move.js";
import Pokemon from "#app/field/pokemon.js";
import { allMoves, OpponentHighHpPowerAttr } from "#app/data/move.js";

describe("Moves - Hard Press", () => {
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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SNORLAX);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.HARD_PRESS]);
  });

  it("power varies between 1 and 100, and is greater the more HP the target has", async () => {
    await game.startBattle([Species.GRAVELER]);
    const moveToBeUsed = allMoves[Moves.HARD_PRESS];

    game.doAttack(getMovePosition(game.scene, 0, moveToBeUsed));
    await game.phaseInterceptor.to(MoveEffectPhase);

    const enemy = game.scene.getEnemyPokemon();
    const movePower = getMockedMovePower(enemy, game.scene.getPlayerPokemon(), moveToBeUsed);
    const moveMaxBasePower = getMoveMaxBasePower(moveToBeUsed);

    expect(movePower).toBe(moveMaxBasePower * enemy.getHpRatio());
  });
});

/**
 * Calculates the mocked move power based on the attributes of the move and the opponent's high HP.
 *
 * @param defender - The defending Pokémon.
 * @param attacker - The attacking Pokémon.
 * @param move - The move being used.
 * @returns The calculated move power.
 */
const getMockedMovePower = (defender: Pokemon, attacker: Pokemon, move: Move) => {
  const powerHolder = new NumberHolder(move.power);

  if (move.hasAttr(OpponentHighHpPowerAttr)) {
    const attr = move.getAttrs(OpponentHighHpPowerAttr);
    attr[0].apply(attacker, defender, move, [ powerHolder ]);
  }

  return powerHolder.value;
};

/**
 * Retrieves the maximum base power of a move based on its attributes.
 *
 * @param move - The move which maximum base power is being retrieved.
 * @returns The maximum base power of the move.
 */
const getMoveMaxBasePower = (move: Move) => {
  const attr = move.getAttrs(OpponentHighHpPowerAttr);

  return (attr[0] as OpponentHighHpPowerAttr)["maxBasePower"];
};
