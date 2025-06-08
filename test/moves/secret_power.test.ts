import { AbilityId } from "#enums/ability-id";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { Stat } from "#enums/stat";
import { allMoves } from "#app/data/data-lists";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { StatusEffect } from "#enums/status-effect";
import { BattlerIndex } from "#app/battle";
import { ArenaTagType } from "#enums/arena-tag-type";
import { ArenaTagSide } from "#app/data/arena-tag";
import { MoveEffectChanceMultiplierAbAttr } from "#app/data/abilities/ability";
import { allAbilities } from "#app/data/data-lists";

describe("Moves - Secret Power", () => {
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
      .moveset([MoveId.SECRET_POWER])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyLevel(60)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  it("Secret Power checks for an active terrain first then looks at the biome for its secondary effect", async () => {
    game.override.startingBiome(BiomeId.VOLCANO).enemyMoveset([MoveId.SPLASH, MoveId.MISTY_TERRAIN]);
    vi.spyOn(allMoves[MoveId.SECRET_POWER], "chance", "get").mockReturnValue(100);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    // No Terrain + BiomeId.VOLCANO --> Burn
    game.move.select(MoveId.SECRET_POWER);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyPokemon.status?.effect).toBe(StatusEffect.BURN);

    // Misty Terrain --> SpAtk -1
    game.move.select(MoveId.SECRET_POWER);
    await game.move.selectEnemyMove(MoveId.MISTY_TERRAIN);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyPokemon.getStatStage(Stat.SPATK)).toBe(-1);
  });

  it("Secret Power's effect chance is doubled by Serene Grace, but not by the 'rainbow' effect from Fire/Water Pledge", async () => {
    game.override
      .moveset([MoveId.FIRE_PLEDGE, MoveId.WATER_PLEDGE, MoveId.SECRET_POWER, MoveId.SPLASH])
      .ability(AbilityId.SERENE_GRACE)
      .enemyMoveset([MoveId.SPLASH])
      .battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);

    const sereneGraceAttr = allAbilities[AbilityId.SERENE_GRACE].getAttrs(MoveEffectChanceMultiplierAbAttr)[0];
    vi.spyOn(sereneGraceAttr, "canApply");

    game.move.select(MoveId.WATER_PLEDGE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.FIRE_PLEDGE, 1, BattlerIndex.ENEMY_2);

    await game.phaseInterceptor.to("TurnEndPhase");

    let rainbowEffect = game.scene.arena.getTagOnSide(ArenaTagType.WATER_FIRE_PLEDGE, ArenaTagSide.PLAYER);
    expect(rainbowEffect).toBeDefined();

    rainbowEffect = rainbowEffect!;
    vi.spyOn(rainbowEffect, "apply");

    game.move.select(MoveId.SECRET_POWER, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(sereneGraceAttr.canApply).toHaveBeenCalledOnce();
    expect(sereneGraceAttr.canApply).toHaveLastReturnedWith(true);

    expect(rainbowEffect.apply).toHaveBeenCalledTimes(0);
  });
});
