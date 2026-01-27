import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Ability-Ignoring Moves", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .startingLevel(200)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.STURDY)
      .enemyMoveset(MoveId.SPLASH);
  });

  it.each<{ name: string; move: MoveId }>([
    { name: "Sunsteel Strike", move: MoveId.SUNSTEEL_STRIKE },
    { name: "Moongeist Beam", move: MoveId.MOONGEIST_BEAM },
    { name: "Photon Geyser", move: MoveId.PHOTON_GEYSER },
  ])("$name should ignore ignorable enemy abilities during move use", async ({ move }) => {
    await game.classicMode.startBattle(SpeciesId.NECROZMA);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.use(move);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(game.scene.arena.ignoreAbilities).toBe(true);
    expect(game.scene.arena.ignoringEffectSource).toBe(player.getBattlerIndex());

    await game.toEndOfTurn();

    // should bypass sturdy OKHO prevention
    expect(game.scene.arena.ignoreAbilities).toBe(false);
    expect(enemy).not.toHaveAbilityApplied(AbilityId.STURDY);
    expect(enemy.isFainted()).toBe(true);
  });

  it("should not ignore enemy abilities when called by move-calling moves", async () => {
    await game.classicMode.startBattle(SpeciesId.MILOTIC);

    game.move.use(MoveId.METRONOME);
    game.move.forceMetronomeMove(MoveId.PHOTON_GEYSER, true);
    // TODO: This has to change to `MoveEffectPhase` once move-calling moves are refactored
    // to not create a new `MovePhase`
    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to("MoveEndPhase", false);

    expect(game.field.getPlayerPokemon()).toHaveUsedMove(MoveId.PHOTON_GEYSER);
    expect(game.scene.arena.ignoreAbilities).toBe(false);
  });

  // TODO: Verify this behavior on cart
  it("should ignore enemy abilities when called by Instruct", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.SOLGALEO, SpeciesId.LUNALA);

    const solgaleo = game.field.getPlayerPokemon();

    game.move.use(MoveId.SUNSTEEL_STRIKE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MoveEffectPhase"); // initial attack
    await game.phaseInterceptor.to("MoveEffectPhase"); // instruct
    await game.phaseInterceptor.to("MoveEffectPhase"); // instructed move use

    expect(game.scene.arena.ignoreAbilities).toBe(true);
    expect(game.scene.arena.ignoringEffectSource).toBe(solgaleo.getBattlerIndex());

    await game.toEndOfTurn();

    // Both the initial and redirected instruct use ignored sturdy
    const [enemy1, enemy2] = game.scene.getEnemyField();
    expect(enemy1).not.toHaveAbilityApplied(AbilityId.STURDY);
    expect(enemy2).not.toHaveAbilityApplied(AbilityId.STURDY);
    expect(enemy1).toHaveFainted();
    expect(enemy2).toHaveFainted();
  });
});
