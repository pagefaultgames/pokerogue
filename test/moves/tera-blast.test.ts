import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import type { Move, TeraMoveCategoryAttr } from "#moves/move";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Tera Blast", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  let moveToCheck: Move;
  let teraBlastAttr: TeraMoveCategoryAttr;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    moveToCheck = allMoves[MoveId.TERA_BLAST];
    teraBlastAttr = moveToCheck.getAttrs("TeraMoveCategoryAttr")[0];
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override
      .battleStyle("single")
      .criticalHits(false)
      .starterSpecies(SpeciesId.FEEBAS)
      .moveset([MoveId.TERA_BLAST])
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.STURDY)
      .enemyLevel(50);

    vi.spyOn(moveToCheck, "calculateBattlePower");
  });

  it("changes type to match user's tera type", async () => {
    game.override.enemySpecies(SpeciesId.FURRET);
    await game.classicMode.startBattle();
    const enemyPokemon = game.field.getEnemyPokemon();
    const spy = vi.spyOn(enemyPokemon, "getMoveEffectiveness");

    const playerPokemon = game.field.getPlayerPokemon();
    playerPokemon.teraType = PokemonType.FIGHTING;
    playerPokemon.isTerastallized = true;

    game.move.select(MoveId.TERA_BLAST);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(spy).toHaveReturnedWith(2);
  });

  it("increases power if user is Stellar tera type", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.field.getPlayerPokemon();
    playerPokemon.teraType = PokemonType.STELLAR;
    playerPokemon.isTerastallized = true;

    game.move.select(MoveId.TERA_BLAST);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(100);
  });

  it("is super effective against terastallized targets if user is Stellar tera type", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.field.getPlayerPokemon();
    playerPokemon.teraType = PokemonType.STELLAR;
    playerPokemon.isTerastallized = true;

    const enemyPokemon = game.field.getEnemyPokemon();
    const spy = vi.spyOn(enemyPokemon, "getMoveEffectiveness");
    enemyPokemon.isTerastallized = true;

    game.move.select(MoveId.TERA_BLAST);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(spy).toHaveReturnedWith(2);
  });

  it("uses the higher ATK for damage calculation", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.field.getPlayerPokemon();
    playerPokemon.stats[Stat.ATK] = 100;
    playerPokemon.stats[Stat.SPATK] = 1;
    playerPokemon.isTerastallized = true;

    vi.spyOn(teraBlastAttr, "apply");

    game.move.select(MoveId.TERA_BLAST);
    await game.toNextTurn();
    expect(teraBlastAttr.apply).toHaveLastReturnedWith(true);
  });

  it("uses the higher SPATK for damage calculation", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.field.getPlayerPokemon();
    playerPokemon.stats[Stat.ATK] = 1;
    playerPokemon.stats[Stat.SPATK] = 100;

    vi.spyOn(teraBlastAttr, "apply");

    game.move.select(MoveId.TERA_BLAST);
    await game.toNextTurn();
    expect(teraBlastAttr.apply).toHaveLastReturnedWith(false);
  });

  it("should stay as a special move if ATK turns lower than SPATK mid-turn", async () => {
    game.override.enemyMoveset([MoveId.CHARM]);
    await game.classicMode.startBattle();

    const playerPokemon = game.field.getPlayerPokemon();
    playerPokemon.stats[Stat.ATK] = 51;
    playerPokemon.stats[Stat.SPATK] = 50;

    vi.spyOn(teraBlastAttr, "apply");

    game.move.select(MoveId.TERA_BLAST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();
    expect(teraBlastAttr.apply).toHaveLastReturnedWith(false);
  });

  it("does not change its move category from stat changes due to held items", async () => {
    game.override
      .startingHeldItems([{ name: "SPECIES_STAT_BOOSTER", type: "THICK_CLUB" }])
      .starterSpecies(SpeciesId.CUBONE);
    await game.classicMode.startBattle();

    const playerPokemon = game.field.getPlayerPokemon();

    playerPokemon.stats[Stat.ATK] = 50;
    playerPokemon.stats[Stat.SPATK] = 51;

    vi.spyOn(teraBlastAttr, "apply");

    game.move.select(MoveId.TERA_BLAST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(teraBlastAttr.apply).toHaveLastReturnedWith(false);
  });

  it("does not change its move category from stat changes due to abilities", async () => {
    game.override.ability(AbilityId.HUGE_POWER);
    await game.classicMode.startBattle();

    const playerPokemon = game.field.getPlayerPokemon();
    playerPokemon.stats[Stat.ATK] = 50;
    playerPokemon.stats[Stat.SPATK] = 51;

    vi.spyOn(teraBlastAttr, "apply");

    game.move.select(MoveId.TERA_BLAST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();
    expect(teraBlastAttr.apply).toHaveLastReturnedWith(false);
  });

  it("causes stat drops if user is Stellar tera type", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.field.getPlayerPokemon();
    playerPokemon.teraType = PokemonType.STELLAR;
    playerPokemon.isTerastallized = true;

    game.move.select(MoveId.TERA_BLAST);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);
  });

  it.each([
    { ab: "galvanize", ty: "electric", ab_id: AbilityId.GALVANIZE, ty_id: PokemonType.ELECTRIC },
    { ab: "refrigerate", ty: "ice", ab_id: AbilityId.REFRIGERATE, ty_id: PokemonType.ICE },
    { ab: "pixilate", ty: "fairy", ab_id: AbilityId.PIXILATE, ty_id: PokemonType.FAIRY },
    { ab: "aerilate", ty: "flying", ab_id: AbilityId.AERILATE, ty_id: PokemonType.FLYING },
  ])("should be $ty type if the user has $ab", async ({ ab_id, ty_id }) => {
    game.override.ability(ab_id).moveset([MoveId.TERA_BLAST]).enemyAbility(AbilityId.BALL_FETCH);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const playerPokemon = game.field.getPlayerPokemon();
    expect(playerPokemon.getMoveType(allMoves[MoveId.TERA_BLAST])).toBe(ty_id);
  });

  it("should not be affected by normalize when the user is terastallized with tera normal", async () => {
    game.override.moveset([MoveId.TERA_BLAST]).ability(AbilityId.NORMALIZE);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const playerPokemon = game.field.getPlayerPokemon();
    // override the tera state for the pokemon
    playerPokemon.isTerastallized = true;
    playerPokemon.teraType = PokemonType.NORMAL;

    const move = allMoves[MoveId.TERA_BLAST];
    const powerSpy = vi.spyOn(move, "calculateBattlePower");

    game.move.select(MoveId.TERA_BLAST);
    await game.phaseInterceptor.to("BerryPhase");
    expect(powerSpy).toHaveLastReturnedWith(move.power);
  });
});
