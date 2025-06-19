import { allMoves } from "#app/data/data-lists";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { BerryPhase } from "#app/phases/berry-phase";
import { CommandPhase } from "#app/phases/command-phase";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
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

    const leadPokemon = game.scene.getPlayerPokemon()!;

    const enemyPokemon = game.scene.getEnemyPokemon()!;

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
