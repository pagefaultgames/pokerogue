import { getPokemonNameWithAffix } from "#app/messages";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import { getEnumValues } from "#utils/enums";
import { toTitleCase } from "#utils/strings";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Healing Moves", () => {
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
      .ability(AbilityId.MAGIC_GUARD) // prevents passive weather damage
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.CHANSEY)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  describe("Self-Healing Moves", () => {
    describe.each<{ name: string; move: MoveId }>([
      { name: "Recover", move: MoveId.RECOVER },
      { name: "Soft-Boiled", move: MoveId.SOFT_BOILED },
      { name: "Milk Drink", move: MoveId.MILK_DRINK },
      { name: "Slack Off", move: MoveId.SLACK_OFF },
      { name: "Heal Order", move: MoveId.HEAL_ORDER },
      { name: "Roost", move: MoveId.ROOST },
      { name: "Weather-based Healing Moves", move: MoveId.SYNTHESIS },
      { name: "Shore Up", move: MoveId.SHORE_UP },
    ])("$name", ({ move }) => {
      it("should heal 50% of the user's maximum HP, rounded half up", async () => {
        await game.classicMode.startBattle([SpeciesId.BLISSEY]);

        const blissey = game.field.getPlayerPokemon();
        blissey.hp = 1;

        game.move.use(move);
        await game.toEndOfTurn();

        expect(game.phaseInterceptor.log).toContain("PokemonHealPhase");
        expect(game).toHaveShownMessage(
          i18next.t("moveTriggers:healHp", { pokemonName: getPokemonNameWithAffix(blissey) }),
        );
        expect(blissey).toHaveHp(blissey.getMaxHp() / 2 + 1, { rounding: "half up" });
      });

      it("should fail if the user is at full HP", async () => {
        await game.classicMode.startBattle([SpeciesId.BLISSEY]);

        const blissey = game.field.getPlayerPokemon();
        expect(blissey).toHaveFullHp();

        game.move.use(move);
        await game.toEndOfTurn();

        expect(blissey).toHaveFullHp();
        expect(game).toHaveShownMessage(
          i18next.t("battle:hpIsFull", {
            pokemonName: getPokemonNameWithAffix(blissey),
          }),
        );
        expect(game.phaseInterceptor.log).not.toContain("PokemonHealPhase");
        expect(blissey).toHaveUsedMove({ move, result: MoveResult.FAIL });
      });
    });

    describe("Weather-based Healing Moves", () => {
      it.each([
        { name: "Harsh Sunlight", weather: WeatherType.SUNNY },
        { name: "Extremely Harsh Sunlight", weather: WeatherType.HARSH_SUN },
      ])("should heal 66% of the user's maximum HP under $name", async ({ weather }) => {
        game.override.weather(weather);
        await game.classicMode.startBattle([SpeciesId.BLISSEY]);

        const blissey = game.field.getPlayerPokemon();
        blissey.hp = 1;

        game.move.use(MoveId.MOONLIGHT);
        await game.toEndOfTurn();

        expect(blissey).toHaveHp((blissey.getMaxHp() * 2) / 3 + 1, { rounding: "half up" });
      });

      const nonSunWTs = getEnumValues(WeatherType)
        .filter(
          wt => ![WeatherType.SUNNY, WeatherType.HARSH_SUN, WeatherType.NONE, WeatherType.STRONG_WINDS].includes(wt),
        )
        .map(wt => ({
          name: toTitleCase(WeatherType[wt]),
          weather: wt,
        }));

      it.each(nonSunWTs)("should heal 25% of the user's maximum HP under $name", async ({ weather }) => {
        game.override.weather(weather);
        await game.classicMode.startBattle([SpeciesId.BLISSEY]);

        const blissey = game.field.getPlayerPokemon();
        blissey.hp = 1;

        game.move.use(MoveId.MOONLIGHT);
        await game.toEndOfTurn();

        expect(blissey).toHaveHp(blissey.getMaxHp() * 0.25 + 1, { rounding: "half up" });
      });

      it("should heal normal HP amount under strong winds", async () => {
        game.override.ability(AbilityId.DELTA_STREAM);
        await game.classicMode.startBattle([SpeciesId.BLISSEY]);

        const blissey = game.field.getPlayerPokemon();
        blissey.hp = 1;

        game.move.use(MoveId.MOONLIGHT);
        await game.toEndOfTurn();

        expect(blissey).toHaveHp(blissey.getMaxHp() / 2 + 1, { rounding: "half up" });
      });
    });

    describe("Shore Up", () => {
      it("should heal 66% of the user's maximum HP in a sandstorm", async () => {
        game.override.weather(WeatherType.SANDSTORM);
        await game.classicMode.startBattle([SpeciesId.BLISSEY]);

        const blissey = game.field.getPlayerPokemon();
        blissey.hp = 1;

        game.move.use(MoveId.SHORE_UP);
        await game.toEndOfTurn();

        expect(blissey).toHaveHp((blissey.getMaxHp() * 2) / 3 + 1, { rounding: "half up" });
      });
    });
  });

  describe("Target-Healing Moves", () => {
    describe.each([
      {
        name: "Heal Pulse",
        move: MoveId.HEAL_PULSE,
        percent: 3 / 4,
        ability: AbilityId.MEGA_LAUNCHER,
        condText: "user has Mega Launcher",
      },
      {
        name: "Floral Healing",
        move: MoveId.FLORAL_HEALING,
        percent: 2 / 3,
        ability: AbilityId.GRASSY_SURGE,
        condText: "Grassy Terrain is active",
      },
    ])("$name", ({ move, percent, ability, condText }) => {
      it("should heal 50% of the target's maximum HP, rounded half up", async () => {
        // NB: These moves round down heal amounts in mainline if their boost conditions are met,
        // but we keep them the same regardless for consistency
        await game.classicMode.startBattle([SpeciesId.BLISSEY]);

        const chansey = game.field.getEnemyPokemon();
        chansey.hp = 1;

        game.move.use(move);
        await game.toEndOfTurn();

        expect(game.phaseInterceptor.log).toContain("PokemonHealPhase");
        expect(game).toHaveShownMessage(
          i18next.t("moveTriggers:healHp", { pokemonName: getPokemonNameWithAffix(chansey) }),
        );
        expect(chansey).toHaveHp(chansey.getMaxHp() / 2 + 1, { rounding: "half up" });
      });

      it("should fail if the target is at full HP", async () => {
        await game.classicMode.startBattle([SpeciesId.BLISSEY]);

        game.move.use(move);
        await game.toEndOfTurn();

        const blissey = game.field.getPlayerPokemon();
        const chansey = game.field.getEnemyPokemon();
        expect(chansey).toHaveFullHp();
        expect(game).toHaveShownMessage(
          i18next.t("battle:hpIsFull", {
            pokemonName: getPokemonNameWithAffix(chansey),
          }),
        );
        expect(game.phaseInterceptor.log).not.toContain("PokemonHealPhase");
        expect(blissey).toHaveUsedMove({ move, result: MoveResult.FAIL });
      });

      it(`should heal ${(percent * 100).toPrecision(2)}% of the target's maximum HP if ${condText}`, async () => {
        // Give enemy Levitate to prevent them from receiving Grassy Terrain passive heal
        game.override.ability(ability).enemyAbility(AbilityId.LEVITATE);
        await game.classicMode.startBattle([SpeciesId.BLISSEY]);

        const chansey = game.field.getEnemyPokemon();
        chansey.hp = 1;

        game.move.use(move);
        await game.toEndOfTurn();

        expect(chansey).toHaveHp(percent * chansey.getMaxHp() + 1, { rounding: "half up" });
      });
    });

    describe("Pollen Puff", () => {
      it("should damage an enemy when used, or heal an ally for 50% max HP", async () => {
        game.override.battleStyle("double");
        await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.OMANYTE]);

        const [_, omantye, karp1] = game.scene.getField();
        omantye.hp = 1;

        game.move.use(MoveId.POLLEN_PUFF, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
        game.move.use(MoveId.POLLEN_PUFF, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
        await game.toNextTurn();

        expect(karp1).not.toHaveFullHp();
        expect(omantye).toHaveHp(omantye.getMaxHp() / 2 + 1, { rounding: "half up" });
        // Only omantye received a healing phase
        expect(game.phaseInterceptor.log.filter(p => p === "PokemonHealPhase")).toHaveLength(1);
      });

      it("should display message & fail when healing a full HP ally", async () => {
        game.override.battleStyle("double");
        await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.OMANYTE]);

        const [bulbasaur, omantye] = game.scene.getPlayerField();

        game.move.use(MoveId.POLLEN_PUFF, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
        game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
        await game.toEndOfTurn();

        // move failed without unshifting a heal phase
        expect(omantye).toHaveFullHp();
        expect(bulbasaur).toHaveUsedMove({ move: MoveId.POLLEN_PUFF, result: MoveResult.FAIL });
        expect(game).toHaveShownMessage(
          i18next.t("battle:hpIsFull", {
            pokemonName: getPokemonNameWithAffix(omantye),
          }),
        );
        expect(game.phaseInterceptor.log).not.toContain("PokemonHealPhase");
      });

      it("should not heal an ally multiple times if the user has a source of multi-hit", async () => {
        game.override.battleStyle("double").ability(AbilityId.PARENTAL_BOND);
        await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.OMANYTE]);

        const [bulbasaur, omantye] = game.scene.getPlayerField();
        omantye.hp = 1;

        game.move.use(MoveId.POLLEN_PUFF, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
        game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
        await game.toEndOfTurn();

        expect(bulbasaur.turnData.hitCount).toBe(1);
        expect(omantye).toHaveHp(omantye.getMaxHp() / 2 + 1, { rounding: "half up" });
        expect(game.phaseInterceptor.log.filter(l => l === "PokemonHealPhase")).toHaveLength(1);
      });

      it("should damage an enemy multiple times if the user has a source of multi-hit", async () => {
        game.override.ability(AbilityId.PARENTAL_BOND);
        await game.classicMode.startBattle([SpeciesId.FEEBAS]);

        game.move.use(MoveId.POLLEN_PUFF);
        await game.toEndOfTurn();

        const feebas = game.field.getPlayerPokemon();
        expect(feebas.turnData.hitCount).toBe(2);
      });

      it("should be unable to target Heal Blocked allies, but should work against Heal Blocked enemies", async () => {
        game.override.battleStyle("double");
        await game.classicMode.startBattle([SpeciesId.BLISSEY, SpeciesId.SNORLAX]);

        const [blissey, snorlax, chansey] = game.scene.getField();
        snorlax.hp = 1;
        snorlax.addTag(BattlerTagType.HEAL_BLOCK);
        chansey.addTag(BattlerTagType.HEAL_BLOCK);
        expect(snorlax).toHaveBattlerTag(BattlerTagType.HEAL_BLOCK);
        expect(chansey).toHaveBattlerTag(BattlerTagType.HEAL_BLOCK);

        // Blissey should not be able to use Pollen Puff on Snorlax (who has heal block), while
        // Snorlax should still be able to target Blissey despite being Heal Blocked themself.
        // Chansey, being an enemy, should be targetable by both
        expect(blissey.isMoveTargetRestricted(MoveId.POLLEN_PUFF, snorlax)).toBe(true);
        expect(snorlax.isMoveTargetRestricted(MoveId.POLLEN_PUFF, blissey)).toBe(false);
        expect(blissey.isMoveTargetRestricted(MoveId.POLLEN_PUFF, chansey)).toBe(false);
        expect(snorlax.isMoveTargetRestricted(MoveId.POLLEN_PUFF, chansey)).toBe(false);

        // Remove heal blocks for the duration of the `CommandPhases`,
        // then re-add them after move selection
        snorlax.removeTag(BattlerTagType.HEAL_BLOCK);
        chansey.removeTag(BattlerTagType.HEAL_BLOCK);

        game.move.use(MoveId.POLLEN_PUFF, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
        game.move.use(MoveId.POLLEN_PUFF, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
        await game.phaseInterceptor.to("EnemyCommandPhase", false);
        snorlax.addTag(BattlerTagType.HEAL_BLOCK);
        chansey.addTag(BattlerTagType.HEAL_BLOCK);
        await game.toEndOfTurn();

        // Ally-targeting PP didn't heal; enemy-targeting PP damaged correctly
        expect(blissey).toHaveUsedMove({ move: MoveId.POLLEN_PUFF, result: MoveResult.FAIL });
        expect(snorlax).toHaveHp(1);
        expect(chansey).not.toHaveFullHp();
        expect(snorlax).toHaveUsedMove({ move: MoveId.POLLEN_PUFF, result: MoveResult.SUCCESS });
        expect(game).toHaveShownMessage(
          i18next.t("battle:moveDisabledHealBlock", {
            pokemonNameWithAffix: getPokemonNameWithAffix(snorlax),
            moveName: allMoves[MoveId.POLLEN_PUFF].name,
            healBlockName: allMoves[MoveId.HEAL_BLOCK].name,
          }),
        );
        expect(game).not.toHaveShownMessage(
          i18next.t("battle:moveDisabledHealBlock", {
            pokemonNameWithAffix: getPokemonNameWithAffix(chansey),
            moveName: allMoves[MoveId.POLLEN_PUFF].name,
            healBlockName: allMoves[MoveId.HEAL_BLOCK].name,
          }),
        );
        // nobody got healed
        expect(game.phaseInterceptor.log).not.toContain("PokemonHealPhase");
      });
    });
  });
});
