import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import type { EnemyPokemon, PlayerPokemon } from "#field/pokemon";
import { TurnEndPhase } from "#phases/turn-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Dragon Rage", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let partyPokemon: PlayerPokemon;
  let enemyPokemon: EnemyPokemon;

  const dragonRageDamage = 40;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(async () => {
    game = new GameManager(phaserGame);

    game.override
      .battleStyle("single")
      .starterSpecies(SpeciesId.SNORLAX)
      .moveset([MoveId.DRAGON_RAGE])
      .ability(AbilityId.BALL_FETCH)
      .passiveAbility(AbilityId.BALL_FETCH)
      .startingLevel(100)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyPassiveAbility(AbilityId.BALL_FETCH)
      .enemyLevel(100);

    await game.classicMode.startBattle();

    partyPokemon = game.field.getPlayerPokemon();
    enemyPokemon = game.field.getEnemyPokemon();
  });

  it("ignores weaknesses", async () => {
    game.override.criticalHits(false);
    vi.spyOn(enemyPokemon, "getTypes").mockReturnValue([PokemonType.DRAGON]);

    game.move.select(MoveId.DRAGON_RAGE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getInverseHp()).toBe(dragonRageDamage);
  });

  it("ignores resistances", async () => {
    game.override.criticalHits(false);
    vi.spyOn(enemyPokemon, "getTypes").mockReturnValue([PokemonType.STEEL]);

    game.move.select(MoveId.DRAGON_RAGE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getInverseHp()).toBe(dragonRageDamage);
  });

  it("ignores SPATK stat stages", async () => {
    game.override.criticalHits(false);
    partyPokemon.setStatStage(Stat.SPATK, 2);

    game.move.select(MoveId.DRAGON_RAGE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getInverseHp()).toBe(dragonRageDamage);
  });

  it("ignores stab", async () => {
    game.override.criticalHits(false);
    vi.spyOn(partyPokemon, "getTypes").mockReturnValue([PokemonType.DRAGON]);

    game.move.select(MoveId.DRAGON_RAGE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getInverseHp()).toBe(dragonRageDamage);
  });

  it("ignores criticals", async () => {
    partyPokemon.addTag(BattlerTagType.ALWAYS_CRIT, 99);

    game.move.select(MoveId.DRAGON_RAGE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getInverseHp()).toBe(dragonRageDamage);
  });

  it("ignores damage modification from abilities, for example ICE_SCALES", async () => {
    game.override.criticalHits(false).enemyAbility(AbilityId.ICE_SCALES);

    game.move.select(MoveId.DRAGON_RAGE);
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.getInverseHp()).toBe(dragonRageDamage);
  });
});
