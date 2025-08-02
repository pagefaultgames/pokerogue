import { SubstituteTag } from "#data/battler-tags";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { MoveEndPhase } from "#phases/move-end-phase";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import type { ArenaTrapTagType } from "#types/arena-tags";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Tidy Up", () => {
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
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .ability(AbilityId.BALL_FETCH);
  });

  it.each<{ name: string; hazard: ArenaTrapTagType }>([{ name: "Spikes", hazard: ArenaTagType.SPIKES }])(
    "should remove $name from both sides of the field",
    async ({ hazard }) => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      // Add tag to both sides of the field
      game.scene.arena.addTag(hazard, 1, undefined, game.field.getPlayerPokemon().id, ArenaTagSide.PLAYER);
      game.scene.arena.addTag(hazard, 1, undefined, game.field.getPlayerPokemon().id, ArenaTagSide.ENEMY);

      expect(game.scene.arena.getTag());
      game.move.use(MoveId.TIDY_UP);
      await game.toEndOfTurn();
      expect(game.scene.arena.getTag(ArenaTagType.SPIKES)).toBeUndefined();
    },
  );

  it("substitutes are cleared", async () => {
    game.override.moveset([MoveId.SUBSTITUTE, MoveId.TIDY_UP]).enemyMoveset(MoveId.SUBSTITUTE);

    await game.classicMode.startBattle();

    game.move.select(MoveId.SUBSTITUTE);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.move.select(MoveId.TIDY_UP);
    await game.phaseInterceptor.to(MoveEndPhase);

    const pokemon = [game.scene.getPlayerPokemon()!, game.scene.getEnemyPokemon()!];
    pokemon.forEach(p => {
      expect(p).toBeDefined();
      expect(p!.getTag(SubstituteTag)).toBeUndefined();
    });
  });

  it("user's stats are raised with no traps set", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(0);

    game.move.select(MoveId.TIDY_UP);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(1);
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(1);
  });
});
