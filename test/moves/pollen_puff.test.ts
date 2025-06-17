import { BattlerIndex } from "#enums/battler-index";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MoveResult } from "#enums/move-result";
import { getPokemonNameWithAffix } from "#app/messages";
import i18next from "i18next";

describe("Moves - Pollen Puff", () => {
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
      .startingLevel(100)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should damage an enemy when used, or heal an ally for 50% max HP", async () => {
    game.override.battleStyle("double").ability(AbilityId.PARENTAL_BOND);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.OMANYTE]);

    const [_, omantye, karp1] = game.scene.getField();
    omantye.hp = 1;

    game.move.use(MoveId.POLLEN_PUFF, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.use(MoveId.POLLEN_PUFF, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.toEndOfTurn();

    expect(karp1.hp).toBeLessThan(karp1.getMaxHp());
    expect(omantye.hp).toBeCloseTo(0.5 * omantye.getMaxHp() + 1, 1);
    expect(game.phaseInterceptor.log).toContain("PokemonHealPhase");
  });

  it("should display message & count as failed when hitting a full HP ally", async () => {
    game.override.battleStyle("double").ability(AbilityId.PARENTAL_BOND);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.OMANYTE]);

    const [bulbasaur, omantye] = game.scene.getPlayerField();

    game.move.use(MoveId.POLLEN_PUFF, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    // move failed without unshifting a phase
    expect(omantye.hp).toBe(omantye.getMaxHp());
    expect(bulbasaur.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    expect(game.textInterceptor.logs).toContain(
      i18next.t("battle:hpIsFull", {
        pokemonName: getPokemonNameWithAffix(omantye),
      }),
    );
    expect(game.phaseInterceptor.log).not.toContain("PokemonHealPhase");
  });

  it("should not heal more than once if the user has a source of multi-hit", async () => {
    game.override.battleStyle("double").ability(AbilityId.PARENTAL_BOND);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.OMANYTE]);

    const [bulbasaur, omantye] = game.scene.getPlayerField();

    omantye.hp = 1;

    game.move.use(MoveId.POLLEN_PUFF, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    expect(bulbasaur.turnData.hitCount).toBe(0);
    expect(omantye.hp).toBeLessThanOrEqual(0.5 * omantye.getMaxHp() + 1);
    expect(game.phaseInterceptor.log.filter(l => l === "PokemonHealPhase")).toHaveLength(1);
  });

  it("should damage an enemy multiple times when the user has a source of multi-hit", async () => {
    game.override.ability(AbilityId.PARENTAL_BOND);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.use(MoveId.POLLEN_PUFF);
    await game.toEndOfTurn();

    const target = game.scene.getEnemyPokemon()!;
    expect(target.battleData.hitCount).toBe(2);
  });
});
