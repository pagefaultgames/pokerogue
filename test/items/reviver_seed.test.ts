import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { HitResult } from "#enums/hit-result";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { PokemonInstantReviveModifier } from "#modifiers/modifier";
import { GameManager } from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Reviver Seed", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.NO_GUARD)
      .startingHeldItems([{ name: "REVIVER_SEED" }])
      .enemyHeldItems([{ name: "REVIVER_SEED" }])
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100); // makes hp tests more accurate due to rounding
  });

  it("should be consumed upon fainting to revive the holder, removing temporary effects and healing to 50% max HP", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemy = game.field.getEnemyPokemon()!;
    enemy.hp = 1;
    enemy.setStatStage(Stat.ATK, 6);

    expect(enemy.getHeldItems()[0]).toBeInstanceOf(PokemonInstantReviveModifier);
    game.move.use(MoveId.TACKLE);
    await game.phaseInterceptor.to("TurnEndPhase");

    // Enemy ate seed, was revived and healed to half HP, clearing its attack boost at the same time.
    expect(enemy.isFainted()).toBeFalsy();
    expect(enemy.getHpRatio()).toBeCloseTo(0.5);
    expect(enemy.getHeldItems()[0]).toBeUndefined();
    expect(enemy.getStatStage(Stat.ATK)).toBe(0);
    expect(enemy.turnData.acted).toBe(true);
  });

  it("should nullify move effects on the killing blow and interrupt multi hits", async () => {
    // Give player a 4 hit lumina crash that lowers spdef by 2 stages per hit
    game.override.ability(AbilityId.PARENTAL_BOND).startingHeldItems([
      { name: "REVIVER_SEED", count: 1 },
      { name: "MULTI_LENS", count: 2 },
    ]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    // give enemy 3 hp, dying 3 hits into the move
    const enemy = game.field.getEnemyPokemon()!;
    enemy.hp = 3;
    vi.spyOn(enemy, "getAttackDamage").mockReturnValue({ cancelled: false, damage: 1, result: HitResult.EFFECTIVE });

    game.move.use(MoveId.LUMINA_CRASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("FaintPhase", false);

    expect(enemy.getStatStage(Stat.SPDEF)).toBe(-4); // killing hit effect got nullified due to fainting the target
    expect(enemy.getAttackDamage).toHaveBeenCalledTimes(3);

    await game.toEndOfTurn();

    // Attack was cut short due to lack of targets, after which the enemy was revived and their stat stages reset
    expect(enemy.isFainted()).toBeFalsy();
    expect(enemy.getStatStage(Stat.SPDEF)).toBe(0);
    expect(enemy.getHpRatio()).toBeCloseTo(0.5);
    expect(enemy.getHeldItems()[0]).toBeUndefined();

    const player = game.scene.getPlayerPokemon()!;
    expect(player.turnData.hitsLeft).toBe(1);
  });

  it.each([
    { moveType: "Special Moves", move: MoveId.WATER_GUN },
    { moveType: "Physical Moves", move: MoveId.TACKLE },
    { moveType: "Fixed Damage Moves", move: MoveId.SEISMIC_TOSS },
    { moveType: "Final Gambit", move: MoveId.FINAL_GAMBIT },
    { moveType: "Counter Moves", move: MoveId.COUNTER },
    { moveType: "OHKOs", move: MoveId.SHEER_COLD },
    { moveType: "Confusion Self-hits", move: MoveId.CONFUSE_RAY },
  ])("should activate from $moveType", async ({ move }) => {
    game.override.enemyMoveset(move).confusionActivation(true);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);
    const player = game.scene.getPlayerPokemon()!;
    player.hp = 1;

    const reviverSeed = player.getHeldItems()[0] as PokemonInstantReviveModifier;
    const seedSpy = vi.spyOn(reviverSeed, "apply");

    game.move.use(MoveId.TACKLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(player.isFainted()).toBe(false);
    expect(seedSpy).toHaveBeenCalled();
  });

  // Damaging tests
  it.each([
    { moveType: "Salt Cure", move: MoveId.SALT_CURE },
    { moveType: "Leech Seed", move: MoveId.LEECH_SEED },
    { moveType: "Partial Trapping Move", move: MoveId.WHIRLPOOL },
    { moveType: "Status Effect", move: MoveId.WILL_O_WISP },
    { moveType: "Weather", move: MoveId.SANDSTORM },
  ])("should not activate from $moveType damage", async ({ move }) => {
    game.override.enemyMoveset(MoveId.ENDURE);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);
    const enemy = game.field.getEnemyPokemon();
    enemy.hp = 1;

    game.move.use(move);
    await game.toEndOfTurn();

    expect(enemy.isFainted()).toBe(true);
  });

  // Self-damage tests
  it.each([
    { moveType: "Recoil", move: MoveId.DOUBLE_EDGE },
    { moveType: "Sacrificial", move: MoveId.EXPLOSION },
    { moveType: "Ghost-type Curse", move: MoveId.CURSE },
    { moveType: "Liquid Ooze", move: MoveId.GIGA_DRAIN },
  ])("should not activate from $moveType self-damage", async ({ move }) => {
    game.override.enemyAbility(AbilityId.LIQUID_OOZE);
    await game.classicMode.startBattle([SpeciesId.GASTLY, SpeciesId.FEEBAS]);
    const player = game.scene.getPlayerPokemon()!;
    player.hp = 1;

    const playerSeed = player.getHeldItems()[0] as PokemonInstantReviveModifier;
    const seedSpy = vi.spyOn(playerSeed, "apply");

    game.move.use(move);
    await game.toEndOfTurn();

    expect(player.isFainted()).toBe(true);
    expect(seedSpy).not.toHaveBeenCalled();
  });

  it("should not activate from Destiny Bond fainting", async () => {
    game.override
      .enemyLevel(100)
      .startingLevel(1)
      .enemySpecies(SpeciesId.MAGIKARP)
      .moveset(MoveId.DESTINY_BOND)
      .startingHeldItems([]) // reset held items to nothing so user doesn't revive and not trigger Destiny Bond
      .enemyMoveset(MoveId.TACKLE);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);
    const player = game.field.getPlayerPokemon();
    player.hp = 1;
    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.DESTINY_BOND);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.isFainted()).toBeTruthy();
  });
});
