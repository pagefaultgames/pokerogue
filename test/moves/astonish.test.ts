import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { BerryPhase } from "#phases/berry-phase";
import { CommandPhase } from "#phases/command-phase";
import { MoveEndPhase } from "#phases/move-end-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

describe("Moves - Astonish", () => {
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
      .battleStyle("single")
      .moveset([MoveId.ASTONISH, MoveId.SPLASH])
      .enemySpecies(SpeciesId.BLASTOISE)
      .enemyAbility(AbilityId.INSOMNIA)
      .enemyMoveset(MoveId.TACKLE)
      .startingLevel(100)
      .enemyLevel(100);

    vi.spyOn(allMoves[MoveId.ASTONISH], "chance", "get").mockReturnValue(100);
  });

  test("move effect should cancel the target's move on the turn it applies", async () => {
    await game.classicMode.startBattle([SpeciesId.MEOWSCARADA]);

    const leadPokemon = game.field.getPlayerPokemon();

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.ASTONISH);

    await game.phaseInterceptor.to(MoveEndPhase, false);

    expect(enemyPokemon.getTag(BattlerTagType.FLINCHED)).toBeDefined();

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(leadPokemon.hp).toBe(leadPokemon.getMaxHp());
    expect(enemyPokemon.getTag(BattlerTagType.FLINCHED)).toBeUndefined();

    await game.phaseInterceptor.to(CommandPhase, false);

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to(BerryPhase, false);

    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
  });
});
