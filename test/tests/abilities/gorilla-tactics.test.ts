import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Gorilla Tactics", () => {
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
      .battleStyle("single")
      .criticalHits(false)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH)
      .enemyLevel(30)
      .moveset([MoveId.SPLASH, MoveId.TACKLE, MoveId.GROWL, MoveId.METRONOME])
      .ability(AbilityId.GORILLA_TACTICS);
  });

  it("should boost the Pokémon's Attack by 50%, but limits the Pokémon to using only one move", async () => {
    await game.classicMode.startBattle(SpeciesId.GALAR_DARMANITAN);

    const player = game.field.getPlayerPokemon();
    const initialAtkStat = player.getStat(Stat.ATK);

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(player.getStat(Stat.ATK, false)).toBeCloseTo(initialAtkStat * 1.5);
    // Other moves should be restricted
    expect(player.hasRestrictingTag(MoveId.TACKLE)).toBe(true);
    expect(player.hasRestrictingTag(MoveId.SPLASH)).toBe(false);
  });

  it("should struggle if the only usable move is disabled", async () => {
    await game.classicMode.startBattle(SpeciesId.GALAR_DARMANITAN);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    // First turn, lock move to Growl
    game.move.use(MoveId.GROWL);
    await game.toNextTurn();

    // Second turn, Growl is interrupted by Disable
    game.move.use(MoveId.GROWL);
    await game.move.forceEnemyMove(MoveId.DISABLE);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    // Only the effect of the first Growl should be applied
    expect(enemy).toHaveStatStage(Stat.ATK, -1);

    // Third turn, Struggle is used
    game.move.use(MoveId.TACKLE);
    await game.move.forceEnemyMove(MoveId.SPLASH); // prevent disable from being used again
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");

    await game.toEndOfTurn();
    expect(player).toHaveUsedMove(MoveId.STRUGGLE);
  });

  it("should lock into calling moves, even if also in moveset", async () => {
    game.move.forceMetronomeMove(MoveId.TACKLE);
    await game.classicMode.startBattle(SpeciesId.GALAR_DARMANITAN);

    const player = game.field.getPlayerPokemon();

    game.move.use(MoveId.METRONOME);
    await game.phaseInterceptor.to("TurnEndPhase");

    // Gorilla Tactics should lock into Metronome, not tackle
    expect(player.hasRestrictingTag(MoveId.TACKLE)).toBe(true);
    expect(player.hasRestrictingTag(MoveId.METRONOME)).toBe(false);
    expect(player).toHaveUsedMove({ move: MoveId.TACKLE, result: MoveResult.SUCCESS, useMode: MoveUseMode.FOLLOW_UP });
    expect(player).toHaveUsedMove({ move: MoveId.METRONOME, result: MoveResult.SUCCESS, useMode: MoveUseMode.NORMAL }, 1)
  });

  it("should activate when the opponenet protects", async () => {
    await game.classicMode.startBattle(SpeciesId.GALAR_DARMANITAN);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.TACKLE);
    await game.move.forceEnemyMove(MoveId.PROTECT);
    await game.toEndOfTurn();

    expect(player.hasRestrictingTag(MoveId.SPLASH)).toBe(true);
    expect(player.hasRestrictingTag(MoveId.TACKLE)).toBe(false);

    expect(enemy).toHaveFullHp();
  });

  it("should activate when a move is succesfully executed but misses", async () => {
    await game.classicMode.startBattle(SpeciesId.GALAR_DARMANITAN);

    const player = game.field.getPlayerPokemon();

    game.move.use(MoveId.TACKLE);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceMiss();
    await game.toEndOfTurn();

    expect(player.hasRestrictingTag(MoveId.SPLASH)).toBe(true);
    expect(player.hasRestrictingTag(MoveId.TACKLE)).toBe(false);
  });

  it("should remove all effects when disabled", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();

    game.move.use(MoveId.TACKLE);
    await game.move.forceEnemyMove(MoveId.GASTRO_ACID);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(player.hasRestrictingTag(MoveId.TACKLE), "still locked into move").toBe(false);
    expect(player).toHaveEffectiveStat(Stat.ATK, player.getStat(Stat.ATK));
    expect(player).not.toHaveBattlerTag(BattlerTagType.GORILLA_TACTICS)
  })
});
