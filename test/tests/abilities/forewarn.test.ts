import { getPokemonNameWithAffix } from "#app/messages";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Forewarn", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.PIDGEY)
      .enemyAbility(AbilityId.FOREWARN)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  // TODO: write more tests

  it("should prioritize warning attacking moves over status moves", async () => {
    game.override.moveset([MoveId.AGILITY, MoveId.DRAIN_PUNCH, MoveId.HONE_CLAWS, MoveId.MINIMIZE]);
    await game.classicMode.startBattle(SpeciesId.PIDGEY);

    const enemy = game.field.getEnemyPokemon();

    expect(game).toHaveShownMessage(
      i18next.t("abilityTriggers:forewarn", {
        pokemonNameWithAffix: getPokemonNameWithAffix(enemy),
        moveName: allMoves[MoveId.DRAIN_PUNCH].name,
      }),
    );
  });
});
