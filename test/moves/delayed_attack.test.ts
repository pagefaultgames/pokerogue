import { BattlerIndex } from "#app/battle";
import { DelayedAttackTag } from "#app/data/arena-tag";
import { allAbilities } from "#app/data/data-lists";
import { allMoves, RandomMoveAttr } from "#app/data/moves/move";
import { MoveResult } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import { AttackTypeBoosterModifier } from "#app/modifier/modifier";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { PokemonType } from "#enums/pokemon-type";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .moveset([Moves.FUTURE_SIGHT, Moves.DOOM_DESIRE, Moves.METRONOME, Moves.SPLASH])
      .ability(Abilities.NO_GUARD)
      .battleStyle("single")
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.STURDY)
      .enemyMoveset(Moves.SPLASH);
  });

  /**
   * Wait until a number of turns have passed.
   * @param numTurns - Number of turns to pass
   */
  async function passTurns(numTurns: number) {
    for (let i = 0; i < numTurns; i++) {
      game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
      if (game.scene.currentBattle.double && game.scene.getPlayerField()[1]) {
        game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
        await game.phaseInterceptor.to("TurnInitPhase");
      }
      await game.toNextTurn();
    }
  }

  function expectFutureSightActive(numAttacks = 1) {
    const tag = game.scene.arena.getTag(DelayedAttackTag)!;
    expect(tag).toBeDefined();
    expect(tag.delayedAttacks.length).toBe(numAttacks);
  }

  it.each<{ name: string; move: Moves }>([
    { name: "Future Sight", move: Moves.FUTURE_SIGHT },
    { name: "Doom Desire", move: Moves.DOOM_DESIRE },
  ])("$name should show message and strike 2 turns after use, ignoring switches", async ({ move }) => {
    game.override.moveset([move, Moves.SPLASH]);
    await game.classicMode.startBattle([Species.FEEBAS, Species.MILOTIC]);

    game.move.select(move);
    await game.toNextTurn();

    expectFutureSightActive();

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    const enemy = game.scene.getEnemyPokemon()!;
    expect(enemy.isFullHp()).toBe(false);
    expect(game.textInterceptor.logs).toContain(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(enemy),
        moveName: allMoves[move].name,
      }),
    );
  });

  it("should fail (preserving prior instance) when used against the same target", async () => {
    await game.classicMode.startBattle([Species.BRONZONG]);

    game.move.select(Moves.FUTURE_SIGHT);
    await game.toNextTurn();

    expectFutureSightActive();
    const bronzong = game.scene.getPlayerPokemon()!;
    expect(bronzong.getLastXMoves()[0].result).toBe(MoveResult.OTHER);

    game.move.select(Moves.FUTURE_SIGHT);
    await game.toNextTurn();

    expectFutureSightActive();
    expect(bronzong.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should still be delayed when used via Metronome", async () => {
    await game.classicMode.startBattle([Species.BRONZONG]);

    vi.spyOn(RandomMoveAttr.prototype, "getMoveOverride").mockReturnValue(Moves.FUTURE_SIGHT);

    game.move.select(Moves.METRONOME);
    await game.toNextTurn();

    const enemy = game.scene.getEnemyPokemon()!;
    expect(enemy.isFullHp()).toBe(true);

    expectFutureSightActive();

    await passTurns(2);

    expect(enemy.isFullHp()).toBe(false);
  });

  it("should work when used against different targets", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);

    const [karp, feebas] = game.scene.getPlayerField();
    const [enemy1, enemy2] = game.scene.getEnemyField();

    game.move.select(Moves.FUTURE_SIGHT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(Moves.FUTURE_SIGHT, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expectFutureSightActive(2);
    expect(enemy1.isFullHp()).toBe(true);
    expect(enemy2.isFullHp()).toBe(true);
    expect(karp.getLastXMoves()[0].result).toBe(MoveResult.OTHER);
    expect(feebas.getLastXMoves()[0].result).toBe(MoveResult.OTHER);

    await passTurns(2);

    expect(enemy1.isFullHp()).toBe(true);
    expect(enemy2.isFullHp()).toBe(true);
  });

  it("should vanish silently if it would otherwise hit the user", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS, Species.MIENFOO]);

    const [karp, feebas] = game.scene.getPlayerField();

    game.move.select(Moves.FUTURE_SIGHT, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    // Karp / Feebas // milotic
    game.doSwitchPokemon(2);
    await game.toNextTurn();
    await game.toNextTurn();

    expectFutureSightActive(1);

    // Milotic / Feebas // Karp
    game.doSwitchPokemon(2);
    // Feebas / Karp // Milotic
    game.doSwitchPokemon(2);
    await game.toNextTurn();
    await game.toNextTurn();

    await passTurns(1);

    expect(karp.isFullHp()).toBe(true);
    expect(feebas.isFullHp()).toBe(true);
    expect(game.textInterceptor.logs).not.toContain(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(karp),
        moveName: allMoves[Moves.FUTURE_SIGHT].name,
      }),
    );
  });

  it("should redirect normally if target is fainted when attack is launched", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const [enemy1, enemy2] = game.scene.getEnemyField();

    game.move.select(Moves.FUTURE_SIGHT, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    await game.killPokemon(enemy2);
    await game.toNextTurn();

    expect(enemy2.isFainted()).toBe(true);
    expectFutureSightActive(1);

    await passTurns(2);

    expect(enemy1.isFullHp()).toBe(false);
    expect(game.textInterceptor.logs).toContain(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(enemy1),
        moveName: allMoves[Moves.FUTURE_SIGHT].name,
      }),
    );
  });

  it("should vanish silently if target is fainted when attack lands", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const [enemy1, enemy2] = game.scene.getEnemyField();

    game.move.select(Moves.FUTURE_SIGHT, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    await game.toNextTurn();

    expectFutureSightActive(1);

    await passTurns(1);

    game.move.select(Moves.SPLASH);
    await game.killPokemon(enemy2);
    await game.toNextTurn();

    expect(enemy1.isFullHp()).toBe(true);
    expect(game.textInterceptor.logs).not.toContain(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(enemy1),
        moveName: allMoves[Moves.FUTURE_SIGHT].name,
      }),
    );
  });

  // TODO: ArenaTags currently proc after battler tags
  it.todo("should consider type changes at moment of execution & ignore Lightning Rod redirection", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([Species.MAGIKARP]);

    // fake left enemy having lightning rod
    const [enemy1, enemy2] = game.scene.getEnemyField();
    vi.spyOn(enemy1, "getAbility").mockReturnValue(allAbilities[Abilities.LIGHTNING_ROD]);
    vi.spyOn(enemy1, "getNameToRender").mockReturnValue("Karp 1");
    vi.spyOn(enemy2, "getNameToRender").mockReturnValue("Karp 2");

    game.move.select(Moves.FUTURE_SIGHT, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    await game.toNextTurn();

    expectFutureSightActive(1);

    await passTurns(1);

    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.changeMoveset(enemy1, Moves.ELECTRIFY);
    await game.forceEnemyMove(Moves.ELECTRIFY, BattlerIndex.PLAYER);
    await game.phaseInterceptor.to("TurnEndPhase");
    await game.phaseInterceptor.to("MoveEffectPhase", false);

    // Wait until all normal attacks have triggered, then check pending MEP
    const karp = game.scene.getPlayerPokemon()!;
    const typeMock = vi.spyOn(karp, "getMoveType");

    await game.toNextTurn();

    expect(enemy1.isFullHp()).toBe(true);
    expect(enemy2.isFullHp()).toBe(false);
    expect(game.textInterceptor.logs).toContain(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(enemy2),
        moveName: allMoves[Moves.FUTURE_SIGHT].name,
      }),
    );
    expect(typeMock).toHaveLastReturnedWith(PokemonType.ELECTRIC);
  });

  // TODO: Enable once code is added to MEP to do this
  it.todo("should not apply the user's abilities when dealing damage if the user is inactive", async () => {
    game.override.ability(Abilities.NORMALIZE).enemySpecies(Species.LUNALA);
    await game.classicMode.startBattle([Species.FEEBAS, Species.MILOTIC]);

    game.move.select(Moves.DOOM_DESIRE);
    await game.toNextTurn();

    expectFutureSightActive();

    await passTurns(1);

    game.doSwitchPokemon(1);
    const karp = game.scene.getPlayerPokemon()!;
    const typeMock = vi.spyOn(karp, "getMoveType");
    await game.toNextTurn();

    const enemy = game.scene.getEnemyPokemon()!;
    expect(enemy.isFullHp()).toBe(true);
    expect(game.textInterceptor.logs).toContain(
      i18next.t("moveTriggers:tookMoveAttack", {
        pokemonName: getPokemonNameWithAffix(enemy),
        moveName: allMoves[Moves.FUTURE_SIGHT].name,
      }),
    );
    expect(typeMock).toHaveLastReturnedWith(PokemonType.NORMAL);
  });

  it.todo("should not apply the user's held items when dealing damage if the user is inactive", async () => {
    game.override.startingHeldItems([{ name: "ATTACK_TYPE_BOOSTER", count: 99, type: PokemonType.STEEL }]);
    await game.classicMode.startBattle([Species.FEEBAS, Species.MILOTIC]);

    game.move.select(Moves.DOOM_DESIRE);
    await game.toNextTurn();

    expectFutureSightActive();

    await passTurns(1);

    game.doSwitchPokemon(1);

    const powerMock = vi.spyOn(allMoves[Moves.DOOM_DESIRE], "calculateBattlePower");
    const typeBoostSpy = vi.spyOn(AttackTypeBoosterModifier.prototype, "apply");

    await game.toNextTurn();

    expect(powerMock).toHaveLastReturnedWith(120);
    expect(typeBoostSpy).not.toHaveBeenCalled();
  });
});
