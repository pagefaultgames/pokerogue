import { BattlerIndex } from "#app/battle";
import { Stat } from "#enums/stat";
import { allMoves, TeraMoveCategoryAttr } from "#app/data/moves/move";
import type Move from "#app/data/moves/move";
import { PokemonType } from "#enums/pokemon-type";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
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
    moveToCheck = allMoves[Moves.TERA_BLAST];
    teraBlastAttr = moveToCheck.getAttrs(TeraMoveCategoryAttr)[0];
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override
      .battleStyle("single")
      .disableCrits()
      .starterSpecies(Species.FEEBAS)
      .moveset([Moves.TERA_BLAST])
      .ability(Abilities.BALL_FETCH)
      .enemySpecies(Species.MAGIKARP)
      .enemyMoveset(Moves.SPLASH)
      .enemyAbility(Abilities.STURDY)
      .enemyLevel(50);

    vi.spyOn(moveToCheck, "calculateBattlePower");
  });

  it("changes type to match user's tera type", async () => {
    game.override.enemySpecies(Species.FURRET);
    await game.classicMode.startBattle();
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const spy = vi.spyOn(enemyPokemon, "getMoveEffectiveness");

    const playerPokemon = game.scene.getPlayerPokemon()!;
    playerPokemon.teraType = PokemonType.FIGHTING;
    playerPokemon.isTerastallized = true;

    game.move.select(Moves.TERA_BLAST);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(spy).toHaveReturnedWith(2);
  }, 20000);

  it("increases power if user is Stellar tera type", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    playerPokemon.teraType = PokemonType.STELLAR;
    playerPokemon.isTerastallized = true;

    game.move.select(Moves.TERA_BLAST);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(100);
  });

  it("is super effective against terastallized targets if user is Stellar tera type", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    playerPokemon.teraType = PokemonType.STELLAR;
    playerPokemon.isTerastallized = true;

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const spy = vi.spyOn(enemyPokemon, "getMoveEffectiveness");
    enemyPokemon.isTerastallized = true;

    game.move.select(Moves.TERA_BLAST);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(spy).toHaveReturnedWith(2);
  });

  it("uses the higher ATK for damage calculation", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    playerPokemon.stats[Stat.ATK] = 100;
    playerPokemon.stats[Stat.SPATK] = 1;
    playerPokemon.isTerastallized = true;

    vi.spyOn(teraBlastAttr, "apply");

    game.move.select(Moves.TERA_BLAST);
    await game.toNextTurn();
    expect(teraBlastAttr.apply).toHaveLastReturnedWith(true);
  });

  it("uses the higher SPATK for damage calculation", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    playerPokemon.stats[Stat.ATK] = 1;
    playerPokemon.stats[Stat.SPATK] = 100;

    vi.spyOn(teraBlastAttr, "apply");

    game.move.select(Moves.TERA_BLAST);
    await game.toNextTurn();
    expect(teraBlastAttr.apply).toHaveLastReturnedWith(false);
  });

  it("should stay as a special move if ATK turns lower than SPATK mid-turn", async () => {
    game.override.enemyMoveset([Moves.CHARM]);
    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    playerPokemon.stats[Stat.ATK] = 51;
    playerPokemon.stats[Stat.SPATK] = 50;

    vi.spyOn(teraBlastAttr, "apply");

    game.move.select(Moves.TERA_BLAST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();
    expect(teraBlastAttr.apply).toHaveLastReturnedWith(false);
  });

  it("does not change its move category from stat changes due to held items", async () => {
    game.override
      .startingHeldItems([{ name: "SPECIES_STAT_BOOSTER", type: "THICK_CLUB" }])
      .starterSpecies(Species.CUBONE);
    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;

    playerPokemon.stats[Stat.ATK] = 50;
    playerPokemon.stats[Stat.SPATK] = 51;

    vi.spyOn(teraBlastAttr, "apply");

    game.move.select(Moves.TERA_BLAST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(teraBlastAttr.apply).toHaveLastReturnedWith(false);
  });

  it("does not change its move category from stat changes due to abilities", async () => {
    game.override.ability(Abilities.HUGE_POWER);
    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    playerPokemon.stats[Stat.ATK] = 50;
    playerPokemon.stats[Stat.SPATK] = 51;

    vi.spyOn(teraBlastAttr, "apply");

    game.move.select(Moves.TERA_BLAST);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();
    expect(teraBlastAttr.apply).toHaveLastReturnedWith(false);
  });

  it("causes stat drops if user is Stellar tera type", async () => {
    await game.classicMode.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    playerPokemon.teraType = PokemonType.STELLAR;
    playerPokemon.isTerastallized = true;

    game.move.select(Moves.TERA_BLAST);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);
  });

  it.each([
    { ab: "galvanize", ty: "electric", ab_id: Abilities.GALVANIZE, ty_id: PokemonType.ELECTRIC },
    { ab: "refrigerate", ty: "ice", ab_id: Abilities.REFRIGERATE, ty_id: PokemonType.ICE },
    { ab: "pixilate", ty: "fairy", ab_id: Abilities.PIXILATE, ty_id: PokemonType.FAIRY },
    { ab: "aerilate", ty: "flying", ab_id: Abilities.AERILATE, ty_id: PokemonType.FLYING },
  ])("should be $ty type if the user has $ab", async ({ ab_id, ty_id }) => {
    game.override.ability(ab_id).moveset([Moves.TERA_BLAST]).enemyAbility(Abilities.BALL_FETCH);
    await game.classicMode.startBattle([Species.MAGIKARP]);
    const playerPokemon = game.scene.getPlayerPokemon()!;
    expect(playerPokemon.getMoveType(allMoves[Moves.TERA_BLAST])).toBe(ty_id);
  });

  it("should not be affected by normalize when the user is terastallized with tera normal", async () => {
    game.override.moveset([Moves.TERA_BLAST]).ability(Abilities.NORMALIZE);
    await game.classicMode.startBattle([Species.MAGIKARP]);
    const playerPokemon = game.scene.getPlayerPokemon()!;
    // override the tera state for the pokemon
    playerPokemon.isTerastallized = true;
    playerPokemon.teraType = PokemonType.NORMAL;

    const move = allMoves[Moves.TERA_BLAST];
    const powerSpy = vi.spyOn(move, "calculateBattlePower");

    game.move.select(Moves.TERA_BLAST);
    await game.phaseInterceptor.to("BerryPhase");
    expect(powerSpy).toHaveLastReturnedWith(move.power);
  });
});
