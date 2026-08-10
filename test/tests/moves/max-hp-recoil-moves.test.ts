import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Max HP% Recoil Moves", () => {
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
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  it.each([
    { move: MoveId.CHLOROBLAST, name: "Chloroblast" },
    { move: MoveId.STEEL_BEAM, name: "Steel Beam" },
    { move: MoveId.MIND_BLOWN, name: "Mind Blown" },
  ])("$name should deal recoil damage equal to half the user's maximum HP on success", async ({ move }) => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(move);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();
    await game.toEndOfTurn();

    const player = game.field.getPlayerPokemon();
    expect(player).toHaveUsedMove({ move, result: MoveResult.SUCCESS });
    expect(player).toHaveTakenDamage(player.getMaxHp() / 2);
  });

  // NB: According to https://www.smogon.com/forums/threads/sword-shield-battle-mechanics-research.3655528/page-54#post-8548957,
  // Steel Beam uniquely deals recoil damage if the move misses (unlike other moves with this trait).
  // Given how trivial and wildly inconsistent this is, we count it as a minor buff to Steel Beam.
  it("should not deal recoil damage if the move misses", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.STEEL_BEAM);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceMiss();
    await game.toEndOfTurn();

    const player = game.field.getPlayerPokemon();
    expect(player).toHaveUsedMove({ move: MoveId.STEEL_BEAM, result: MoveResult.MISS });
    expect(player).toHaveFullHp();
  });

  it("should be able to KO the user", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

    const player = game.field.getPlayerPokemon();
    player.hp = toDmgValue(player.getMaxHp() / 2);

    game.move.use(MoveId.CHLOROBLAST);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    game.doSelectPartyPokemon(1); // queue an input to switch pokemon so the game doesn't stall
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();

    // TODO: see if we can skip to turn end directly once switch refactor is merged
    // I am 90% sure the leaving pokemon's summon data gets cleared unnecessarily
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(player).toHaveUsedMove({ move: MoveId.CHLOROBLAST, result: MoveResult.SUCCESS });

    await game.toEndOfTurn();
    expect(player).toHaveFainted();
  });

  it("should not deal recoil damage if the opponent uses protect", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.CHLOROBLAST);
    await game.move.forceEnemyMove(MoveId.PROTECT);
    await game.toEndOfTurn();

    const player = game.field.getPlayerPokemon();
    expect(player).toHaveUsedMove({ move: MoveId.CHLOROBLAST, result: MoveResult.MISS });
    expect(player).toHaveFullHp();
  });
});
