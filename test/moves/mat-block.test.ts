import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";

describe("Moves - Mat Block", () => {
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
      .battleStyle("double")
      .moveset([MoveId.MAT_BLOCK, MoveId.SPLASH])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyMoveset([MoveId.TACKLE])
      .enemyAbility(AbilityId.INSOMNIA)
      .startingLevel(100)
      .enemyLevel(100);
  });

  test("should protect the user and allies from attack moves", async () => {
    await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.BLASTOISE);

    const leadPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.MAT_BLOCK);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase", false);

    leadPokemon.forEach(p => expect(p.hp).toBe(p.getMaxHp()));
    expect(game.textInterceptor.logs).toContain(
      i18next.t("arenaTag:matBlockApply", {
        attackName: allMoves[MoveId.TACKLE].name,
      }),
    );
  });

  test("should not protect the user and allies from status moves", async () => {
    game.override.enemyMoveset([MoveId.GROWL]);

    await game.classicMode.startBattle(SpeciesId.CHARIZARD, SpeciesId.BLASTOISE);

    const leadPokemon = game.scene.getPlayerField();

    game.move.select(MoveId.MAT_BLOCK);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase", false);

    leadPokemon.forEach(p => expect(p.getStatStage(Stat.ATK)).toBe(-2));
  });

  // first turn behavior covered inside first-turn-moves.test.ts
});
