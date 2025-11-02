import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Roost", () => {
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
      .battleStyle("single")
      .enemySpecies(SpeciesId.SHUCKLE)
      .ability(AbilityId.BALL_FETCH)
      .startingLevel(100)
      .enemyLevel(100)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should remove the user's Flying type until end of turn", async () => {
    await game.classicMode.startBattle([SpeciesId.HAWLUCHA]);

    const hawlucha = game.field.getPlayerPokemon();
    hawlucha.hp = 1;

    game.move.use(MoveId.ROOST);
    await game.phaseInterceptor.to("MoveEffectPhase");

    // Should lose flying type temporarily
    expect(hawlucha).toHaveBattlerTag(BattlerTagType.ROOSTED);
    expect(hawlucha).toHaveTypes([PokemonType.FIGHTING]);
    expect(hawlucha.isGrounded()).toBe(true);

    await game.toEndOfTurn();

    // Should have changed back to fighting/flying
    expect(hawlucha).toHaveTypes([PokemonType.FIGHTING, PokemonType.FLYING]);
    expect(hawlucha.isGrounded()).toBe(false);
  });

  it("should preserve types of non-Flying type Pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.MEW]);

    const mew = game.field.getPlayerPokemon();
    mew.hp = 1;

    game.move.use(MoveId.ROOST);
    await game.toEndOfTurn(false);

    // Should remain psychic type
    expect(mew).toHaveTypes([PokemonType.PSYCHIC]);
    expect(mew.isGrounded()).toBe(true);
  });

  it("should not remove the user's Tera Type", async () => {
    await game.classicMode.startBattle([SpeciesId.PIDGEOT]);

    const pidgeot = game.field.getPlayerPokemon();
    pidgeot.hp = 1;
    pidgeot.teraType = PokemonType.FLYING;

    game.move.use(MoveId.ROOST, BattlerIndex.PLAYER, undefined, true);
    await game.toEndOfTurn(false);

    // Should remain flying type
    expect(pidgeot).toHaveTypes([PokemonType.FLYING], { args: [true] });
    expect(pidgeot.isGrounded()).toBe(false);
  });

  it("should convert pure Flying types into normal types", async () => {
    await game.classicMode.startBattle([SpeciesId.TORNADUS]);

    const tornadus = game.field.getPlayerPokemon();
    tornadus.hp = 1;

    game.move.use(MoveId.ROOST);
    await game.toEndOfTurn(false);

    // Should only be normal type, and NOT flying type
    expect(tornadus).toHaveTypes([PokemonType.NORMAL]);
    expect(tornadus.isGrounded()).toBe(true);
  });

  it.each<{ name: string; move: MoveId; species: SpeciesId }>([
    { name: "Burn Up", move: MoveId.BURN_UP, species: SpeciesId.MOLTRES },
    { name: "Double Shock", move: MoveId.DOUBLE_SHOCK, species: SpeciesId.ZAPDOS },
  ])("should render user typeless when roosting after using $name", async ({ move, species }) => {
    await game.classicMode.startBattle([species]);

    const player = game.field.getPlayerPokemon();
    player.hp = 1;

    game.move.use(move);
    await game.toNextTurn();

    // Should be pure flying type
    expect(player).toHaveTypes([PokemonType.FLYING]);
    expect(player.isGrounded()).toBe(false);

    game.move.use(MoveId.ROOST);
    await game.phaseInterceptor.to("MoveEffectPhase");

    // Should be typeless
    expect(player).toHaveBattlerTag(BattlerTagType.ROOSTED);
    expect(player).toHaveTypes([PokemonType.UNKNOWN]);
    expect(player.isGrounded()).toBe(true);

    await game.toEndOfTurn();

    // Should go back to being pure flying
    expect(player).toHaveTypes([PokemonType.FLYING]);
    expect(player.isGrounded()).toBe(false);
  });
});
