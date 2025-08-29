import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattleType } from "#enums/battle-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import { getEnumValues } from "#utils/enums";
import { toTitleCase } from "#utils/strings";
import i18next from "i18next";
import Phaser from "phaser";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Arena Tags", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let playerId: number;

  afterAll(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeAll(async () => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });

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

    await game.classicMode.startBattle([SpeciesId.MORELULL]);

    playerId = game.field.getPlayerPokemon().id;
  });

  beforeEach(() => {
    // Mock the message queue function to not unshift phases and just spit the text out directly
    vi.spyOn(game.scene.phaseManager, "queueMessage").mockImplementation((text, callbackDelay, prompt, promptDelay) =>
      game.scene.ui.showText(text, null, null, callbackDelay, prompt, promptDelay),
    );
    game.textInterceptor.logs = [];
  });

  // These tags are either ineligible or just jaaaaaaaaaaank
  const FORBIDDEN_TAGS = [ArenaTagType.NONE, ArenaTagType.NEUTRALIZING_GAS] as const;

  const arenaTags = Object.values(ArenaTagType)
    .filter(t => !(FORBIDDEN_TAGS as readonly ArenaTagType[]).includes(t))
    .map(t => ({
      tagType: t,
      name: toTitleCase(t),
    }));
  describe.each(arenaTags)("$name", ({ tagType }) => {
    it.each(getEnumValues(ArenaTagSide))(
      "should display a message on addition, and a separate one on removal",
      side => {
        game.scene.arena.addTag(tagType, 0, undefined, playerId, side);

        expect(game).toHaveArenaTag(tagType, side);
        const tag = game.scene.arena.getTagOnSide(tagType, side)!;

        if (tag["onAddMessageKey"]) {
          expect(game.textInterceptor.logs).toContain(
            i18next.t(tag["onAddMessageKey"], {
              pokemonNameWithAffix: getPokemonNameWithAffix(tag["getSourcePokemon"]()),
              moveName: tag["getMoveName"](),
            }),
          );
        } else {
          expect(game.textInterceptor.logs).toHaveLength(0);
        }

        game.textInterceptor.logs = [];

        game.scene.arena.removeTagOnSide(tagType, side, false);
        if (tag["onRemoveMessageKey"]) {
          expect(game.textInterceptor.logs).toContain(
            i18next.t(tag["onRemoveMessageKey"], {
              pokemonNameWithAffix: getPokemonNameWithAffix(tag["getSourcePokemon"]()),
              moveName: tag["getMoveName"](),
            }),
          );
        } else {
          expect(game.textInterceptor.logs).toHaveLength(0);
        }

        expect(game).not.toHaveArenaTag(tagType, side);
      },
    );
  });
});
