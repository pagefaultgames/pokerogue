import { allMoves } from "#app/data/move";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { TrainerSlot } from "#app/data/trainer-config";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import * as Messages from "#app/messages";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

function testMoveEffectiveness(game: GameManager, move: Moves, targetSpecies: Species,
  expected: number, targetAbility: Abilities = Abilities.BALL_FETCH): void {
  // Suppress getPokemonNameWithAffix because it calls on a null battle spec
  vi.spyOn(Messages, "getPokemonNameWithAffix").mockReturnValue("");
  game.override.enemyAbility(targetAbility);
  const user = game.scene.addPlayerPokemon(getPokemonSpecies(Species.SNORLAX), 5);
  const target = game.scene.addEnemyPokemon(getPokemonSpecies(targetSpecies), 5, TrainerSlot.NONE);

  expect(target.getMoveEffectiveness(user, allMoves[move])).toBe(expected);
}

describe("Moves - Type Effectiveness", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    game = new GameManager(phaserGame);
    game.override.ability(Abilities.BALL_FETCH);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("Normal-type attacks are neutrally effective against Normal-type Pokemon",
    () => testMoveEffectiveness(game, Moves.TACKLE, Species.SNORLAX, 1)
  );

  it("Normal-type attacks are not very effective against Steel-type Pokemon",
    () => testMoveEffectiveness(game, Moves.TACKLE, Species.REGISTEEL, 0.5)
  );

  it("Normal-type attacks are doubly resisted by Steel/Rock-type Pokemon",
    () => testMoveEffectiveness(game, Moves.TACKLE, Species.AGGRON, 0.25)
  );

  it("Normal-type attacks have no effect on Ghost-type Pokemon",
    () => testMoveEffectiveness(game, Moves.TACKLE, Species.DUSCLOPS, 0)
  );

  it("Normal-type status moves are not affected by type matchups",
    () => testMoveEffectiveness(game, Moves.GROWL, Species.DUSCLOPS, 1)
  );

  it("Electric-type attacks are super-effective against Water-type Pokemon",
    () => testMoveEffectiveness(game, Moves.THUNDERBOLT, Species.BLASTOISE, 2)
  );

  it("Electric-type attacks are doubly super-effective against Water/Flying-type Pokemon",
    () => testMoveEffectiveness(game, Moves.THUNDERBOLT, Species.GYARADOS, 4)
  );

  it("Electric-type attacks are negated by Volt Absorb",
    () => testMoveEffectiveness(game, Moves.THUNDERBOLT, Species.GYARADOS, 0, Abilities.VOLT_ABSORB)
  );
});
