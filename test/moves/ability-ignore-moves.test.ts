import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Ability-Ignoring Moves", () => {
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
      .moveset([MoveId.MOONGEIST_BEAM, MoveId.SUNSTEEL_STRIKE, MoveId.PHOTON_GEYSER, MoveId.METRONOME])
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
  ])("$name should ignore enemy abilities during move use", async ({ move }) => {
    await game.classicMode.startBattle([SpeciesId.NECROZMA]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.select(move);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(game.scene.arena.ignoreAbilities).toBe(true);
    expect(game.scene.arena.ignoringEffectSource).toBe(player.getBattlerIndex());

    await game.toEndOfTurn();
    expect(game.scene.arena.ignoreAbilities).toBe(false);
    expect(enemy.isFainted()).toBe(true);
  });

  it("should not ignore enemy abilities when called by Metronome", async () => {
    await game.classicMode.startBattle([SpeciesId.MILOTIC]);
    game.move.forceMetronomeMove(MoveId.PHOTON_GEYSER, true);

    const enemy = game.field.getEnemyPokemon();
    game.move.select(MoveId.METRONOME);
    await game.toEndOfTurn();

    expect(enemy.isFainted()).toBe(false);
    expect(game.field.getPlayerPokemon().getLastXMoves()[0].move).toBe(MoveId.PHOTON_GEYSER);
  });

  it("should not ignore enemy abilities when called by Mirror Move", async () => {
    game.override.moveset(MoveId.MIRROR_MOVE).enemyMoveset(MoveId.SUNSTEEL_STRIKE);

    await game.classicMode.startBattle([SpeciesId.MILOTIC]);

    const enemy = game.field.getEnemyPokemon();
    game.move.select(MoveId.MIRROR_MOVE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    expect(enemy.isFainted()).toBe(false);
    expect(game.field.getPlayerPokemon().getLastXMoves()[0].move).toBe(MoveId.SUNSTEEL_STRIKE);
  });

  // TODO: Verify this behavior on cart
  it("should ignore enemy abilities when called by Instruct", async () => {
    game.override.moveset([MoveId.SUNSTEEL_STRIKE, MoveId.INSTRUCT]).battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.SOLGALEO, SpeciesId.LUNALA]);

    const solgaleo = game.field.getPlayerPokemon();

    game.move.select(MoveId.SUNSTEEL_STRIKE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(MoveId.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MoveEffectPhase"); // initial attack
    await game.phaseInterceptor.to("MoveEffectPhase"); // instruct
    await game.phaseInterceptor.to("MoveEffectPhase"); // instructed move use

    expect(game.scene.arena.ignoreAbilities).toBe(true);
    expect(game.scene.arena.ignoringEffectSource).toBe(solgaleo.getBattlerIndex());

    await game.toEndOfTurn();

    // Both the initial and redirected instruct use ignored sturdy
    const [enemy1, enemy2] = game.scene.getEnemyField();
    expect(enemy1.isFainted()).toBe(true);
    expect(enemy2.isFainted()).toBe(true);
  });
});
