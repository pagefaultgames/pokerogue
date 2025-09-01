import { getPokemonNameWithAffix } from "#app/messages";
import { allMoves } from "#data/data-lists";
import type { TypeDamageMultiplier } from "#data/type";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import type { EntryHazardTagType } from "#types/arena-tags";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Entry Hazards", () => {
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
      .enemySpecies(SpeciesId.BLISSEY)
      .startingLevel(100)
      .enemyLevel(100)
      .enemyAbility(AbilityId.BALL_FETCH)
      .ability(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .battleType(BattleType.TRAINER);
  });

  describe.each<{ name: string; move: MoveId; tagType: EntryHazardTagType }>([
    { name: "Spikes", move: MoveId.SPIKES, tagType: ArenaTagType.SPIKES },
    {
      name: "Toxic Spikes",
      move: MoveId.TOXIC_SPIKES,
      tagType: ArenaTagType.TOXIC_SPIKES,
    },
    {
      name: "Stealth Rock",
      move: MoveId.STEALTH_ROCK,
      tagType: ArenaTagType.STEALTH_ROCK,
    },
    {
      name: "Sticky Web",
      move: MoveId.STICKY_WEB,
      tagType: ArenaTagType.STICKY_WEB,
    },
  ])("General checks - $name", ({ move, tagType }) => {
    it("should add a persistent tag to the opposing side of the field", async () => {
      await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA]);

      expect(game).not.toHaveArenaTag(tagType);

      game.move.use(move);
      await game.toNextTurn();

      // Tag should've been added to the opposing side of the field
      expect(game).not.toHaveArenaTag(tagType, ArenaTagSide.PLAYER);
      expect(game).toHaveArenaTag(tagType, ArenaTagSide.ENEMY);
    });

    // TODO: re-enable after re-fixing hazards moves
    it.todo("should work when all targets fainted", async () => {
      game.override.battleStyle("double");
      await game.classicMode.startBattle([SpeciesId.RAYQUAZA, SpeciesId.SHUCKLE]);

      const [enemy1, enemy2] = game.scene.getEnemyField();

      game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
      game.move.use(move, BattlerIndex.PLAYER_2);
      await game.doKillOpponents();
      await game.toEndOfTurn();

      expect(enemy1.isFainted()).toBe(true);
      expect(enemy2.isFainted()).toBe(true);
      expect(game).toHaveArenaTag(tagType, ArenaTagSide.ENEMY);
    });

    const maxLayers = tagType === ArenaTagType.SPIKES ? 3 : tagType === ArenaTagType.TOXIC_SPIKES ? 2 : 1;
    const msgText =
      maxLayers === 1
        ? "should fail if added while already present"
        : `can be added up to ${maxLayers} times in a row before failing`;

    it(msgText, async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      const feebas = game.field.getPlayerPokemon();

      // set up hazards until at max layers
      for (let i = 0; i < maxLayers; i++) {
        game.move.use(move);
        await game.toNextTurn();

        expect(feebas).toHaveUsedMove({ move, result: MoveResult.SUCCESS });
        expect(game).toHaveArenaTag({ tagType, side: ArenaTagSide.ENEMY, layers: i + 1 });
      }

      game.move.use(move);
      await game.toNextTurn();

      expect(feebas).toHaveUsedMove({ move, result: MoveResult.FAIL });
      expect(game).toHaveArenaTag({ tagType, side: ArenaTagSide.ENEMY, layers: maxLayers });
    });
  });

  describe("Spikes", () => {
    it.each<{ layers: number; damage: number }>([
      { layers: 1, damage: 12.5 },
      { layers: 2, damage: 100 / 6 },
      { layers: 3, damage: 25 },
    ])("should play message and deal $damage% of the target's max HP at $layers", async ({ layers, damage }) => {
      for (let i = 0; i < layers; i++) {
        game.scene.arena.addTag(ArenaTagType.SPIKES, 0, undefined, 0, ArenaTagSide.ENEMY);
      }

      await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA]);

      const enemy = game.field.getEnemyPokemon();
      expect(enemy).toHaveTakenDamage((enemy.getMaxHp() * damage) / 100);
      expect(game.textInterceptor.logs).toContain(
        i18next.t("arenaTag:spikesActivateTrap", {
          pokemonNameWithAffix: getPokemonNameWithAffix(enemy),
        }),
      );
    });
  });

  describe("Toxic Spikes", () => {
    it.each<{ name: string; layers: number; status: StatusEffect }>([
      { name: "Poison", layers: 1, status: StatusEffect.POISON },
      { name: "Toxic", layers: 2, status: StatusEffect.TOXIC },
    ])("should apply $name at $layers without displaying neutralization msg", async ({ layers, status }) => {
      for (let i = 0; i < layers; i++) {
        game.scene.arena.addTag(ArenaTagType.TOXIC_SPIKES, 0, undefined, 0, ArenaTagSide.ENEMY);
      }
      await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.POOCHYENA]);

      const enemy = game.field.getEnemyPokemon();
      expect(enemy).toHaveStatusEffect(status);
      expect(game.textInterceptor.logs).not.toContain(
        i18next.t("arenaTag:toxicSpikesActivateTrapPoison", {
          pokemonNameWithAffix: getPokemonNameWithAffix(enemy),
          moveName: allMoves[MoveId.TOXIC_SPIKES].name,
        }),
      );
    });
  });

  it("should be removed without triggering upon a grounded Poison-type switching in", async () => {
    await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.EKANS]);

    game.scene.arena.addTag(ArenaTagType.TOXIC_SPIKES, 0, undefined, 0, ArenaTagSide.ENEMY);

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    const ekans = game.field.getPlayerPokemon();
    expect(game).not.toHaveArenaTag(ArenaTagType.TOXIC_SPIKES, ArenaTagSide.PLAYER);
    expect(game.textInterceptor.logs).not.toContain(
      i18next.t("arenaTag:toxicSpikesActivateTrapPoison", {
        pokemonNameWithAffix: getPokemonNameWithAffix(ekans),
        moveName: allMoves[MoveId.TOXIC_SPIKES].name,
      }),
    );
    expect(ekans).not.toHaveStatusEffect(StatusEffect.POISON);
  });

  describe("Stealth Rock", () => {
    it.each<{ multi: TypeDamageMultiplier; species: SpeciesId }>([
      { multi: 0.25, species: SpeciesId.LUCARIO },
      { multi: 0.5, species: SpeciesId.DURALUDON },
      { multi: 1, species: SpeciesId.LICKILICKY },
      { multi: 2, species: SpeciesId.DARMANITAN },
      { multi: 4, species: SpeciesId.DELIBIRD },
    ])("should deal damage based on the target's weakness to Rock - $multi", async ({ multi, species }) => {
      game.override.enemySpecies(species);
      game.scene.arena.addTag(ArenaTagType.STEALTH_ROCK, 0, undefined, 0, ArenaTagSide.ENEMY);
      await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.EKANS]);

      const enemy = game.field.getEnemyPokemon();
      expect(enemy.getAttackTypeEffectiveness(PokemonType.ROCK, undefined, true)).toBe(multi);
      expect(enemy).toHaveTakenDamage(enemy.getMaxHp() * 0.125 * multi);
      expect(game.textInterceptor.logs).toContain(
        i18next.t("arenaTag:stealthRockActivateTrap", {
          pokemonNameWithAffix: getPokemonNameWithAffix(enemy),
        }),
      );
    });

    it("should ignore strong winds for type effectiveness", async () => {
      game.override.enemyAbility(AbilityId.DELTA_STREAM).enemySpecies(SpeciesId.RAYQUAZA);
      game.scene.arena.addTag(ArenaTagType.STEALTH_ROCK, 0, undefined, 0, ArenaTagSide.ENEMY);
      await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.EKANS]);

      const rayquaza = game.field.getEnemyPokemon();
      // took 25% damage despite strong winds halving effectiveness
      expect(rayquaza).toHaveTakenDamage(rayquaza.getMaxHp() * 0.25);
    });
  });

  describe("Sticky Web", () => {
    it("should lower the target's speed by 1 stage on entry", async () => {
      game.scene.arena.addTag(ArenaTagType.STICKY_WEB, 0, undefined, 0, ArenaTagSide.ENEMY);
      await game.classicMode.startBattle([SpeciesId.MIGHTYENA, SpeciesId.EKANS]);

      const enemy = game.field.getEnemyPokemon();
      expect(enemy).toHaveStatStage(Stat.SPD, -1);
      expect(game.textInterceptor.logs).toContain(
        i18next.t("arenaTag:stickyWebActivateTrap", {
          pokemonName: enemy.getNameToRender(),
        }),
      );
    });
  });
});
