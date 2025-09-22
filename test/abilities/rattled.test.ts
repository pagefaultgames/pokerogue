import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { getStatKey, getStatStageChangeDescriptionKey, Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Rattled", () => {
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
      .ability(AbilityId.RATTLED)
      .battleType(BattleType.TRAINER)
      .criticalHits(false)
      .battleStyle("single")
      .enemySpecies(SpeciesId.DUSKULL)
      .enemyAbility(AbilityId.INTIMIDATE)
      .enemyPassiveAbility(AbilityId.NO_GUARD);
  });

  it.each<{ type: string; move: MoveId }>([
    { type: "Bug", move: MoveId.TWINEEDLE },
    { type: "Ghost", move: MoveId.ASTONISH },
    { type: "Dark", move: MoveId.BEAT_UP },
  ])("should raise the user's Speed by 1 stage for each hit of a $type-type move", async ({ move }) => {
    game.override.enemyAbility(AbilityId.BALL_FETCH);
    await game.classicMode.startBattle([SpeciesId.GIMMIGHOUL]);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(move);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    game.phaseInterceptor.clearLogs();

    await game.phaseInterceptor.to("MoveEffectPhase");
    const enemyHits = game.field.getEnemyPokemon().turnData.hitCount;
    await game.phaseInterceptor.to("MoveEndPhase");

    // Rattled should've raised speed once per hit, displaying a separate message each time
    const gimmighoul = game.field.getPlayerPokemon();
    expect(gimmighoul).toHaveStatStage(Stat.SPD, enemyHits);;
    expect(game.phaseInterceptor.log.filter(p => p === "ShowAbilityPhase")).toHaveLength(enemyHits);
    expect(game.phaseInterceptor.log.filter(p => p === "StatStageChangePhase")).toHaveLength(enemyHits);
    const statChangeText = i18next.t(getStatStageChangeDescriptionKey(1, true), {
      pokemonNameWithAffix: getPokemonNameWithAffix(gimmighoul),
      stats: i18next.t(getStatKey(Stat.SPD)),
      count: 1,
    });
    expect(game.textInterceptor.logs.filter(t => t === statChangeText)).toHaveLength(enemyHits);
  });

  it.each<{ type: string; move: MoveId }>([
    { type: "Bug", move: MoveId.POWDER },
    { type: "Ghost", move: MoveId.CONFUSE_RAY },
    { type: "Dark", move: MoveId.TAUNT },
  ])("should not trigger from $type-type status moves", async ({ move }) => {
    game.override.enemyAbility(AbilityId.BALL_FETCH);
    await game.classicMode.startBattle([SpeciesId.GIMMIGHOUL]);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(move);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");

    const gimmighoul = game.field.getPlayerPokemon();
    expect(gimmighoul).toHaveStatStage(Stat.SPD, 0);;
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
    expect(game.phaseInterceptor.log).not.toContain("StatStageChangePhase");
  });

  // TODO: This test is flaky until ordering of stat stage changes on the same mon
  // can be addressed
  it.todo("should activate after Intimidate attack drop on initial send out", async () => {
    // `runToSummon` used instead of `startBattle` to avoid skipping past initial "post send out" effects
    await game.classicMode.runToSummon([SpeciesId.GIMMIGHOUL]);

    // Intimidate
    await game.phaseInterceptor.to("StatStageChangePhase");

    const playerPokemon = game.field.getPlayerPokemon();
    expect(playerPokemon).toHaveStatStage(Stat.SPD, 0);
    expect(playerPokemon).toHaveStatStage(Stat.ATK, -1);;
    game.phaseInterceptor.clearLogs();

    // Rattled
    await game.phaseInterceptor.to("StatStageChangePhase", true);

    expect(playerPokemon).toHaveStatStage(Stat.ATK, -1);;
    expect(playerPokemon).toHaveStatStage(Stat.SPD, 1);;
    // Nothing but show/hide ability phases should be visible
    for (const log of game.phaseInterceptor.log) {
      expect(log).toBeOneOf(["ShowAbilityPhase", "HideAbilityPhase", "StatStageChangePhase", "MessagePhase"]);
    }
  });

  it("should activate after Intimidate from enemy switch", async () => {
    await game.classicMode.startBattle([SpeciesId.GIMMIGHOUL, SpeciesId.BULBASAUR]);

    game.move.use(MoveId.SPLASH);
    game.forceEnemyToSwitch();
    await game.phaseInterceptor.to("StatStageChangePhase");

    const playerPokemon = game.field.getPlayerPokemon();
    expect(playerPokemon).toHaveStatStage(Stat.ATK, -2);
    expect(playerPokemon).toHaveStatStage(Stat.SPD, 1);;

    await game.phaseInterceptor.to("StatStageChangePhase");
    expect(playerPokemon).toHaveStatStage(Stat.SPD, 2);;
  });
});
