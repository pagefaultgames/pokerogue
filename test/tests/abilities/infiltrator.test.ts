import { getPokemonNameWithAffix } from "#app/messages";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Infiltrator", () => {
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
      .ability(AbilityId.INFILTRATOR)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it.each([
    {
      effectName: "Light Screen",
      tagType: ArenaTagType.LIGHT_SCREEN,
      move: MoveId.WATER_GUN,
    },
    {
      effectName: "Reflect",
      tagType: ArenaTagType.REFLECT,
      move: MoveId.TACKLE,
    },
    {
      effectName: "Aurora Veil",
      tagType: ArenaTagType.AURORA_VEIL,
      move: MoveId.TACKLE,
    },
  ])("should bypass the target's $effectName when dealing damage", async ({ tagType, move }) => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();

    const preScreenDmg = karp.getAttackDamage({ source: feebas, move: allMoves[move] }).damage;

    game.scene.arena.addTag(tagType, 1, MoveId.NONE, karp.id, ArenaTagSide.ENEMY, true);

    const postScreenDmg = karp.getAttackDamage({ source: feebas, move: allMoves[move] }).damage;

    expect(postScreenDmg).toBe(preScreenDmg);
    expect(feebas).toHaveAbilityApplied(AbilityId.INFILTRATOR);
  });

  it("should bypass the target's Safeguard", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();
    game.scene.arena.addTag(ArenaTagType.SAFEGUARD, 1, MoveId.NONE, karp.id, ArenaTagSide.ENEMY, true);

    game.move.use(MoveId.SPORE);
    await game.toEndOfTurn();

    expect(feebas).toHaveAbilityApplied(AbilityId.INFILTRATOR);
    expect(karp).toHaveStatusEffect(StatusEffect.SLEEP);
  });

  it("should bypass the target's Mist", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();
    game.scene.arena.addTag(ArenaTagType.MIST, 1, MoveId.NONE, karp.id, ArenaTagSide.ENEMY, true);

    game.move.use(MoveId.BABY_DOLL_EYES);
    await game.toEndOfTurn();

    expect(feebas).toHaveAbilityApplied(AbilityId.INFILTRATOR);
    expect(karp).toHaveStatStage(Stat.ATK, -1);
    expect(game).not.toHaveShownMessage(
      i18next.t("arenaTag:mistApply", {
        pokemonNameWithAffix: getPokemonNameWithAffix(karp),
      }),
    );
  });

  it("should bypass the target's Substitute", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    const karp = game.field.getEnemyPokemon();
    karp.addTag(BattlerTagType.SUBSTITUTE, 1, MoveId.NONE, karp.id);

    game.move.use(MoveId.BREAKING_SWIPE);
    await game.toEndOfTurn();

    expect(feebas).toHaveAbilityApplied(AbilityId.INFILTRATOR);
    expect(karp).not.toHaveFullHp();
    expect(karp).toHaveStatStage(Stat.ATK, -1);
  });
});
