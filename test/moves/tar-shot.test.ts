import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Tar Shot", () => {
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
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .enemySpecies(SpeciesId.TANGELA)
      .enemyLevel(1000)
      .moveset([MoveId.TAR_SHOT, MoveId.FIRE_PUNCH])
      .criticalHits(false);
  });

  it("lowers the target's Speed stat by one stage and doubles the effectiveness of Fire-type moves used on the target", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const enemy = game.field.getEnemyPokemon();

    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.TAR_SHOT);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.getStatStage(Stat.SPD)).toBe(-1);

    await game.toNextTurn();

    game.move.select(MoveId.FIRE_PUNCH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(4);
  });

  it("will not double the effectiveness of Fire-type moves used on a target that is already under the effect of Tar Shot (but may still lower its Speed)", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const enemy = game.field.getEnemyPokemon();

    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.TAR_SHOT);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.getStatStage(Stat.SPD)).toBe(-1);

    await game.toNextTurn();

    game.move.select(MoveId.TAR_SHOT);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.getStatStage(Stat.SPD)).toBe(-2);

    await game.toNextTurn();

    game.move.select(MoveId.FIRE_PUNCH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(4);
  });

  it("does not double the effectiveness of Fire-type moves against a Pokémon that is Terastallized", async () => {
    game.override.enemySpecies(SpeciesId.SPRIGATITO);
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const enemy = game.field.getEnemyPokemon();
    enemy.teraType = PokemonType.GRASS;
    enemy.isTerastallized = true;

    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.TAR_SHOT);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.getStatStage(Stat.SPD)).toBe(-1);

    await game.toNextTurn();

    game.move.select(MoveId.FIRE_PUNCH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(2);
  });

  it("doubles the effectiveness of Fire-type moves against a Pokémon that is already under the effects of Tar Shot before it Terastallized", async () => {
    game.override.enemySpecies(SpeciesId.SPRIGATITO);
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const enemy = game.field.getEnemyPokemon();

    vi.spyOn(enemy, "getMoveEffectiveness");

    game.move.select(MoveId.TAR_SHOT);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemy.getStatStage(Stat.SPD)).toBe(-1);

    await game.toNextTurn();

    enemy.teraType = PokemonType.GRASS;
    enemy.isTerastallized = true;

    game.move.select(MoveId.FIRE_PUNCH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemy.getMoveEffectiveness).toHaveReturnedWith(4);
  });
});
