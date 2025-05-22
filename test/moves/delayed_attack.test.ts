import { BattlerIndex } from "#enums/battler-index";
import { allMoves } from "#app/data/data-lists";
import { DelayedAttackTag } from "#app/data/arena-tag";
import { allAbilities } from "#app/data/data-lists";
import { RandomMoveAttr } from "#app/data/moves/move";
import { MoveResult } from "#enums/move-result";
import { getPokemonNameWithAffix } from "#app/messages";
import { AttackTypeBoosterModifier } from "#app/modifier/modifier";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BattleType } from "#enums/battle-type";
import { MoveTypePowerBoostAbAttr } from "#app/data/abilities/ability";

describe("Moves - Delayed Attacks", () => {
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
      .ability(AbilityId.NO_GUARD)
      .battleStyle("single")
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.STURDY)
      .enemyMoveset(MoveId.SPLASH);
  });

  /**
   * Wait until a number of turns have passed.
   * @param numTurns - Number of turns to pass.
   * @returns: A Promise that resolves once the specified number of turns has elapsed.
   */
  async function passTurns(numTurns: number): Promise<void> {
    for (let i = 0; i < numTurns; i++) {
      game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
      if (game.scene.currentBattle.double && game.scene.getPlayerField()[1]) {
        game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
      }
      await game.toNextTurn();
    }
  }

  /**
   * Expect that future sight is active with the specified number of attacks.
   * @param numAttacks - The number of delayed attacks that should be queued; default `1`
   */
  function expectFutureSightActive(numAttacks = 1) {
    const tag = game.scene.arena.getTag(DelayedAttackTag)!;
    expect(tag).toBeDefined();
    expect(tag["delayedAttacks"]).toHaveLength(numAttacks);
  }

  it.each<{ name: string; move: MoveId }>([
    { name: "Future Sight", move: MoveId.FUTURE_SIGHT },
    { name: "Doom Desire", move: MoveId.DOOM_DESIRE },
  ])("$name should show message and strike 2 turns after use, ignoring player/enemy switches", async ({ move }) => {
    game.override.battleType(BattleType.TRAINER)
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    game.move.use(move);
    await game.toNextTurn();

    expectFutureSightActive();

    game.doSwitchPokemon(1);
    game.forceEnemyToSwitch();
    await game.toNextTurn();

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    const enemy = game.field.getEnemyPokemon();
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
    expect(game.textInterceptor.logs).toContain(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(enemy),
        moveName: allMoves[move].name,
      }),
    );
  });

  it("should fail (preserving prior instances) when used against the same target", async () => {
    await game.classicMode.startBattle([SpeciesId.BRONZONG]);

    game.move.use(MoveId.FUTURE_SIGHT);
    await game.toNextTurn();

    expectFutureSightActive();
    const bronzong = game.field.getPlayerPokemon();
    expect(bronzong.getLastXMoves()[0].result).toBe(MoveResult.OTHER);

    game.move.use(MoveId.FUTURE_SIGHT);
    await game.toNextTurn();

    expectFutureSightActive();
    expect(bronzong.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should still be delayed when copied by other moves", async () => {
    vi.spyOn(RandomMoveAttr.prototype, "getMoveOverride").mockReturnValue(MoveId.FUTURE_SIGHT);
    await game.classicMode.startBattle([SpeciesId.BRONZONG]);

    game.move.use(MoveId.METRONOME);
    await game.toNextTurn();

    const enemy = game.field.getEnemyPokemon();
    expect(enemy.hp).toBe(enemy.getMaxHp());

    expectFutureSightActive();

    await passTurns(2);

    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });

  it("should work when used against different targets in doubles", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const [karp, feebas, enemy1, enemy2] = game.scene.getField();

    game.move.use(MoveId.FUTURE_SIGHT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.FUTURE_SIGHT, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.toEndOfTurn()

    expectFutureSightActive(2);
    expect(enemy1.hp).toBe(enemy1.getMaxHp());
    expect(enemy2.hp).toBe(enemy2.getMaxHp());
    expect(karp.getLastXMoves()[0].result).toBe(MoveResult.OTHER);
    expect(feebas.getLastXMoves()[0].result).toBe(MoveResult.OTHER);

    await passTurns(2);

    expect(enemy1.hp).toBeLessThan(enemy1.getMaxHp());
    expect(enemy2.hp).toBeLessThan(enemy2.getMaxHp());
  });

  it("should vanish silently if it would otherwise hit the user", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS, SpeciesId.MIENFOO]);

    const [karp, feebas] = game.scene.getPlayerField();

    game.move.use(MoveId.FUTURE_SIGHT, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    // Karp / Feebas / Milotic
    game.doSwitchPokemon(2);
    await game.toNextTurn();

    expectFutureSightActive(1);

    // Milotic / Feebas // Karp
    game.doSwitchPokemon(2);
    // Feebas / Karp // Milotic
    game.doSwitchPokemon(2);
    await game.toNextTurn();

    await passTurns(1);

    expect(karp.hp).toBe(karp.getMaxHp());
    expect(feebas.hp).toBe(feebas.getMaxHp());
    expect(game.textInterceptor.logs).not.toContain(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(karp),
        moveName: allMoves[MoveId.FUTURE_SIGHT].name,
      }),
    );
  });

  it("should redirect normally if target is fainted when attack is launched", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const [enemy1, enemy2] = game.scene.getEnemyField();

    game.move.use(MoveId.FUTURE_SIGHT, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    await game.killPokemon(enemy2);
    await game.toNextTurn();

    expect(enemy2.isFainted()).toBe(true);
    expectFutureSightActive(1);

    await passTurns(2);

    expect(enemy1.hp).toBeLessThan(enemy1.getMaxHp());
    expect(game.textInterceptor.logs).toContain(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(enemy1),
        moveName: allMoves[MoveId.FUTURE_SIGHT].name,
      }),
    );
  });

  it("should vanish silently if target is fainted when attack lands", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const [enemy1, enemy2] = game.scene.getEnemyField();

    game.move.use(MoveId.FUTURE_SIGHT, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    await game.toNextTurn();

    expectFutureSightActive(1);

    await passTurns(1);

    game.move.use(MoveId.SPLASH);
    await game.killPokemon(enemy2);
    await game.toNextTurn();

    expect(enemy1.hp).toBe(enemy1.getMaxHp());
    expect(game.textInterceptor.logs).not.toContain(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(enemy1),
        moveName: allMoves[MoveId.FUTURE_SIGHT].name,
      }),
    );
  });

  // TODO: The move phase unshifting happens after Electrify has been removed
  it.todo("should consider type changes at moment of execution & ignore Lightning Rod redirection", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    // fake left enemy having lightning rod
    const [enemy1, enemy2] = game.scene.getEnemyField();
    vi.spyOn(enemy1, "getAbility").mockReturnValue(allAbilities[AbilityId.LIGHTNING_ROD]);
    // helps with logging
    vi.spyOn(enemy1, "getNameToRender").mockReturnValue("Karp 1");
    vi.spyOn(enemy2, "getNameToRender").mockReturnValue("Karp 2");

    game.move.use(MoveId.FUTURE_SIGHT, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    await game.toNextTurn();

    expectFutureSightActive(1);

    await passTurns(1);

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.changeMoveset(enemy1, MoveId.ELECTRIFY);
    await game.move.forceEnemyMove(MoveId.ELECTRIFY, BattlerIndex.PLAYER);
    await game.phaseInterceptor.to("TurnEndPhase");
    await game.phaseInterceptor.to("MoveEffectPhase", false);

    // Wait until all normal attacks have triggered, then check pending MEP
    const karp = game.field.getPlayerPokemon();
    const typeMock = vi.spyOn(karp, "getMoveType");

    await game.toNextTurn();

    expect(enemy1.hp).toBe(enemy1.getMaxHp());
    expect(enemy2.hp).toBeLessThan(enemy2.getMaxHp());
    expect(game.textInterceptor.logs).toContain(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(enemy2),
        moveName: allMoves[MoveId.FUTURE_SIGHT].name,
      }),
    );
    expect(typeMock).toHaveLastReturnedWith(PokemonType.ELECTRIC);
  });

  // TODO: Enable once code is added to MEP to do this
  it.todo("should not apply the user's abilities when dealing damage if the user is inactive", async () => {
    game.override.ability(AbilityId.NORMALIZE).enemySpecies(SpeciesId.LUNALA);
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    game.move.use(MoveId.DOOM_DESIRE);
    await game.toNextTurn();

    expectFutureSightActive();

    await passTurns(1);

    game.doSwitchPokemon(1);
    const karp = game.field.getPlayerPokemon();
    const typeMock = vi.spyOn(karp, "getMoveType");
    await game.toNextTurn();

    const enemy = game.field.getEnemyPokemon();
    expect(enemy.hp).toBe(enemy.getMaxHp());
    expect(game.textInterceptor.logs).toContain(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(enemy),
        moveName: allMoves[MoveId.FUTURE_SIGHT].name,
      }),
    );
    expect(typeMock).toHaveLastReturnedWith(PokemonType.NORMAL);
  });

  it.todo("should not apply the user's held items when dealing damage if the user is inactive", async () => {
    game.override.startingHeldItems([{ name: "ATTACK_TYPE_BOOSTER", count: 99, type: PokemonType.STEEL }]);
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

    game.move.use(MoveId.DOOM_DESIRE);
    await game.toNextTurn();

    expectFutureSightActive();

    await passTurns(1);

    game.doSwitchPokemon(1);

    const powerMock = vi.spyOn(allMoves[MoveId.DOOM_DESIRE], "calculateBattlePower");
    const typeBoostSpy = vi.spyOn(AttackTypeBoosterModifier.prototype, "apply");

    await game.toNextTurn();

    expect(powerMock).toHaveLastReturnedWith(120);
    expect(typeBoostSpy).not.toHaveBeenCalled();
  });
});
