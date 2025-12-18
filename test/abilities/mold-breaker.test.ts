import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Mold Breaker", () => {
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
      .ability(AbilityId.MOLD_BREAKER)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.STURDY)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should turn off the ignore abilities arena variable after the user's move", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();

    game.move.use(MoveId.X_SCISSOR);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(game.scene.arena.ignoreAbilities).toBe(true);
    expect(game.scene.arena.ignoringEffectSource).toBe(feebas.getBattlerIndex());

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(game.scene.arena.ignoreAbilities).toBe(false);

    await game.toEndOfTurn();

    expect(karp).toHaveFainted();
  });

  it("should keep Levitate opponents grounded when using force switch moves", async () => {
    game.override.enemyAbility(AbilityId.LEVITATE).enemySpecies(SpeciesId.WEEZING).battleType(BattleType.TRAINER);

    // Setup toxic spikes and spikes
    game.scene.arena.addTag(ArenaTagType.TOXIC_SPIKES, -1, MoveId.TOXIC_SPIKES, 1, ArenaTagSide.ENEMY);
    game.scene.arena.addTag(ArenaTagType.SPIKES, -1, MoveId.CEASELESS_EDGE, 1, ArenaTagSide.ENEMY);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const [weezing1, weezing2] = game.scene.getEnemyParty();

    // Weezing's levitate prevented removal of Toxic Spikes, ignored Spikes damage
    expect(game).toHaveArenaTag(ArenaTagType.TOXIC_SPIKES, ArenaTagSide.ENEMY);
    expect(weezing1).toHaveFullHp();

    game.move.use(MoveId.DRAGON_TAIL);
    await game.toEndOfTurn();

    // Levitate was ignored during the switch, causing Toxic Spikes to be removed and Spikes to deal damage
    expect(weezing1.isOnField()).toBe(false);
    expect(weezing2.isOnField()).toBe(true);
    expect(weezing2).not.toHaveFullHp();
    expect(game).not.toHaveArenaTag(ArenaTagType.TOXIC_SPIKES, ArenaTagSide.ENEMY);
  });
});
