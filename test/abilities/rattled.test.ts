import { MoveId } from "#enums/move-id";
import { AbilityId } from "#enums/ability-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BattleType } from "#enums/battle-type";
import { getStatKey, getStatStageChangeDescriptionKey, Stat } from "#enums/stat";
import { BattlerIndex } from "#app/battle";
import i18next from "i18next";
import { getPokemonNameWithAffix } from "#app/messages";

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
      .disableCrits()
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
    expect(gimmighoul.getStatStage(Stat.SPD)).toBe(enemyHits);
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
    expect(gimmighoul.getStatStage(Stat.SPD)).toBe(0);
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
    expect(game.phaseInterceptor.log).not.toContain("StatStageChangePhase");
  });

  it("should activate after Intimidate attack drop on initial send out", async () => {
    // `runToSummon` used instead of `startBattle` to avoid skipping past initial "post send out" effects
    await game.classicMode.runToSummon([SpeciesId.GIMMIGHOUL]);

    // Intimidate
    await game.phaseInterceptor.to("StatStageChangePhase");

    const playerPokemon = game.field.getPlayerPokemon();
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(0);
    game.phaseInterceptor.clearLogs();

    // Rattled
    await game.phaseInterceptor.to("StatStageChangePhase");

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(1);
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
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-2);
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(1);

    await game.phaseInterceptor.to("StatStageChangePhase");
    expect(playerPokemon.getStatStage(Stat.SPD)).toBe(2);
  });
});
