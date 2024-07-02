import { DisabledTag } from "#app/data/battler-tags.js";
import { Stat } from "#app/data/pokemon-stat.js";
import { Abilities } from "#app/enums/abilities.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { Moves } from "#app/enums/moves.js";
import { Species } from "#app/enums/species.js";
import { MoveResult } from "#app/field/pokemon.js";
import * as overrides from "#app/overrides";
import { TurnInitPhase } from "#app/phases.js";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import GameManager from "../utils/gameManager";
import { getMovePosition } from "../utils/gameManagerUtils";

describe("Moves - Disable", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const doAttack = (move?: Moves) => {
    move ??= Moves.DISABLE;
    game.doAttack(getMovePosition(game.scene, 0, move));
  };

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
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.NONE);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.DISABLE, Moves.SPLASH]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH,Moves.SPLASH,Moves.SPLASH,Moves.SPLASH]);
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.BIDOOF);
    vi.spyOn(overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
  });

  it("fails if enemy has no move history", async() => {
    await game.startBattle();

    game.scene.getParty()[0].stats[Stat.SPD] = 2;
    game.scene.getEnemyParty()[0].stats[Stat.SPD] = 1;

    doAttack();
    await game.phaseInterceptor.to(TurnInitPhase);

    expect(game.scene.getParty()[0].getMoveHistory().at(0).result).toBe(MoveResult.FAIL);
  }, 20000);

  it("works when user moves after enemy", async() => {
    await game.startBattle();

    game.scene.getParty()[0].stats[Stat.SPD] = 1;
    game.scene.getEnemyParty()[0].stats[Stat.SPD] = 2;

    doAttack();
    await game.phaseInterceptor.to(TurnInitPhase);

    expect(game.scene.getParty()[0].getMoveHistory().at(0).move).toBe(Moves.DISABLE);
    expect(game.scene.getParty()[0].getMoveHistory().at(0).result).toBe(MoveResult.SUCCESS);
    expect(game.scene.getEnemyParty()[0].getMoveHistory().at(0).move).toBe(Moves.SPLASH);
    expect(game.scene.getEnemyParty()[0].summonData.tags).toHaveLength(1);
    expect(game.scene.getEnemyParty()[0].summonData.tags[0]).toBeInstanceOf(DisabledTag);
    expect((game.scene.getEnemyParty()[0].getTag(BattlerTagType.DISABLED) as DisabledTag).moveId).toBe(Moves.SPLASH);
    expect(game.scene.getEnemyParty()[0].isMoveDisabled(Moves.SPLASH)).toBe(true);

    doAttack();
    await game.phaseInterceptor.to(TurnInitPhase);

    expect(game.scene.getEnemyParty()[0].getLastXMoves().at(0).move).toBe(Moves.STRUGGLE);
  }, 20000);

  it("interrupts target's move when user moves first", async() => {
    // Player goes first
    await game.startBattle();

    game.scene.getParty()[0].stats[Stat.SPD] = 2;
    game.scene.getEnemyParty()[0].stats[Stat.SPD] = 1;

    doAttack(Moves.SPLASH);
    await game.phaseInterceptor.to(TurnInitPhase);

    expect(game.scene.getEnemyParty()[0].getMoveHistory()).toHaveLength(1);

    // Both mons just used Splash last turn; now have player use Disable.

    doAttack(Moves.DISABLE);
    await game.phaseInterceptor.to(TurnInitPhase);

    expect(game.scene.getPlayerPokemon().getMoveHistory()).toHaveLength(2);
    expect(game.scene.getEnemyParty()[0].isMoveDisabled(Moves.SPLASH)).toBe(true);
    expect(game.scene.getEnemyParty()[0].getMoveHistory()).toHaveLength(2);
    expect(game.scene.getEnemyParty()[0].getLastXMoves().at(0).result).toBe(MoveResult.FAIL);
    expect(game.scene.getEnemyParty()[0].getLastXMoves().at(1).result).toBe(MoveResult.SUCCESS);
  }, 20000);

});
