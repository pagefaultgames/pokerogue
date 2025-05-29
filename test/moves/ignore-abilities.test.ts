import { BattlerIndex } from "#app/battle";
import { RandomMoveAttr } from "#app/data/moves/move";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .moveset([Moves.MOONGEIST_BEAM, Moves.SUNSTEEL_STRIKE, Moves.PHOTON_GEYSER, Moves.METRONOME])
      .ability(Abilities.STURDY)
      .startingLevel(200)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.STURDY)
      .enemyMoveset(Moves.SPLASH);
  });

  it.each<{ name: string; move: Moves }>([
    { name: "Sunsteel Strike", move: Moves.SUNSTEEL_STRIKE },
    { name: "Moongeist Beam", move: Moves.MOONGEIST_BEAM },
    { name: "Photon Geyser", move: Moves.PHOTON_GEYSER },
  ])("$name should ignore enemy abilities during move use", async ({move}) => {
    await game.classicMode.startBattle([Species.NECROZMA]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(move);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(game.scene.arena.ignoreAbilities).toBe(true);
    expect(game.scene.arena.ignoringEffectSource).toBe(player.getBattlerIndex());

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(game.scene.arena.ignoreAbilities).toBe(false);
    expect(enemy.isFainted()).toBe(true);
  });

  it("should not ignore enemy abilities when called by metronome", async () => {
    await game.classicMode.startBattle([Species.MILOTIC]);
    vi.spyOn(RandomMoveAttr.prototype, "getMoveOverride").mockReturnValue(Moves.PHOTON_GEYSER);

    const enemy = game.scene.getEnemyPokemon()!;
    game.move.select(Moves.METRONOME);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.isFainted()).toBe(false);
    expect(game.scene.getPlayerPokemon()?.getLastXMoves()[0].move).toBe(Moves.PHOTON_GEYSER);
  });

  it("should not ignore enemy abilities when called by Mirror Move", async () => {
    game.override.moveset(Moves.MIRROR_MOVE).enemyMoveset(Moves.SUNSTEEL_STRIKE);

    await game.classicMode.startBattle([Species.MILOTIC]);

    const enemy = game.scene.getEnemyPokemon()!;
    game.move.select(Moves.MIRROR_MOVE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.isFainted()).toBe(false);
    expect(game.scene.getPlayerPokemon()?.getLastXMoves()[0].move).toBe(Moves.SUNSTEEL_STRIKE);
  });

  // TODO: Verify this behavior on cart
  it("should ignore enemy abilities when called by Instruct", async () => {
    game.override.moveset([Moves.SUNSTEEL_STRIKE, Moves.INSTRUCT]).battleStyle("double");
    await game.classicMode.startBattle([Species.SOLGALEO, Species.LUNALA]);

    const solgaleo = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.SUNSTEEL_STRIKE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MoveEffectPhase"); // initial attack
    await game.phaseInterceptor.to("MoveEffectPhase"); // instruct
    await game.phaseInterceptor.to("MoveEffectPhase"); // instructed move use

    expect(game.scene.arena.ignoreAbilities).toBe(true);
    expect(game.scene.arena.ignoringEffectSource).toBe(solgaleo.getBattlerIndex());

    await game.phaseInterceptor.to("BerryPhase");

    // Both the initial and redirected instruct use ignored sturdy
    const [enemy1, enemy2] = game.scene.getEnemyField();
    expect(enemy1.isFainted()).toBe(true);
    expect(enemy2.isFainted()).toBe(true);
  });
});
