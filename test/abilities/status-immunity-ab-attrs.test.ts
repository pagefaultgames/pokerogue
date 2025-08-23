import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { StatusEffectAttr } from "#moves/move";
import { GameManager } from "#test/test-utils/game-manager";
import { toTitleCase } from "#utils/strings";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe.each<{ name: string; ability: AbilityId; status: StatusEffect }>([
  { name: "Vital Spirit", ability: AbilityId.VITAL_SPIRIT, status: StatusEffect.SLEEP },
  { name: "Insomnia", ability: AbilityId.INSOMNIA, status: StatusEffect.SLEEP },
  { name: "Immunity", ability: AbilityId.IMMUNITY, status: StatusEffect.POISON },
  { name: "Magma Armor", ability: AbilityId.MAGMA_ARMOR, status: StatusEffect.FREEZE },
  { name: "Limber", ability: AbilityId.LIMBER, status: StatusEffect.PARALYSIS },
  { name: "Thermal Exchange", ability: AbilityId.THERMAL_EXCHANGE, status: StatusEffect.BURN },
  { name: "Water Veil", ability: AbilityId.WATER_VEIL, status: StatusEffect.BURN },
  { name: "Water Bubble", ability: AbilityId.WATER_BUBBLE, status: StatusEffect.BURN },
])("Abilities - $name", ({ ability, status }) => {
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
      .criticalHits(false)
      .enemyLevel(100)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(ability)
      .enemyMoveset(MoveId.SPLASH);

    // Mock Lumina Crash and Spore to be our status-inflicting moves of choice
    vi.spyOn(allMoves[MoveId.LUMINA_CRASH], "attrs", "get").mockReturnValue([new StatusEffectAttr(status, false)]);
    vi.spyOn(allMoves[MoveId.SPORE], "attrs", "get").mockReturnValue([new StatusEffectAttr(status, false)]);
  });

  const statusStr = toTitleCase(StatusEffect[status]);

  it(`should prevent application of ${statusStr} without failing damaging moves`, async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const karp = game.field.getEnemyPokemon();
    expect(karp.status?.effect).toBeUndefined();
    expect(karp.canSetStatus(status)).toBe(false);

    game.move.use(MoveId.LUMINA_CRASH);
    await game.toEndOfTurn();

    expect(karp.status?.effect).toBeUndefined();
    expect(game.field.getPlayerPokemon().getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
  });

  it(`should cure ${statusStr} upon being gained`, async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    feebas.doSetStatus(status);
    expect(feebas.status?.effect).toBe(status);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SKILL_SWAP);
    await game.toEndOfTurn();

    expect(feebas.status?.effect).toBeUndefined();
  });

  // TODO: This does not propagate failures currently
  it.todo(
    `should cause status moves inflicting ${statusStr} to count as failed if no other effects can be applied`,
    async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      game.move.use(MoveId.SPORE);
      await game.toEndOfTurn();

      const karp = game.field.getEnemyPokemon();
      expect(karp.status?.effect).toBeUndefined();
      expect(game.field.getPlayerPokemon().getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    },
  );
});
