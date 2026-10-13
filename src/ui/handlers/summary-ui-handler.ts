import type { Ability } from "#abilities/ability";
import { loggedInUser } from "#app/account";
import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import { speciesDataRegistry } from "#app/global-species-data-registry";
import { getStarterValueFriendshipCap } from "#balance/starters";
import { getLevelRelExp, getLevelTotalExp } from "#data/exp";
import { getGenderColor, getGenderSymbol } from "#data/gender";
import { getNatureName, getNatureStatMultiplier } from "#data/nature";
import { getPokeballAtlasKey } from "#data/pokeball";
import { getTypeRgb } from "#data/type";
import { Button } from "#enums/buttons";
import { MoveCategory } from "#enums/move-category";
import { Nature } from "#enums/nature";
import { PokemonType } from "#enums/pokemon-type";
import { getStatKey, PERMANENT_STATS, Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import type { PlayerPokemon } from "#field/pokemon";
import { modifierSortFunc, PokemonHeldItemModifier } from "#modifiers/modifier";
import type { Move } from "#moves/move";
import type { PokemonMove } from "#moves/pokemon-move";
import type { Variant } from "#sprites/variant";
import { getVariantTint } from "#sprites/variant";
import { achvs } from "#system/achv";
import type { ConfirmModeConfig, OptionSelectItem } from "#types/ui-types";
import { addBBCodeTextObject, addTextObject, getBBCodeFrag, getTextColor, updateCandyCountTextStyle } from "#ui/text";
import { UiHandler } from "#ui/ui-handler";
import { hasSpecialWrapSpace, wrapTextAtSpaces } from "#ui/utils/text-wrap";
import { argbFromRgba, rgbHexToRgba } from "#utils/color-utils";
import { fixedInt, formatStat, getBiomeName, getLocalizedSpriteKey, getShinyDescriptor, padInt } from "#utils/common";
import { getEnumValues } from "#utils/enums";
import { getDexNumber, getStarterColors } from "#utils/pokemon-utils";
import { toCamelCase, toTitleCase } from "#utils/strings";
import i18next from "i18next";

enum Page {
  PROFILE,
  STATS,
  MOVES,
}

export enum SummaryUiMode {
  DEFAULT,
  LEARN_MOVE,
}

/** Holds all objects related to an ability for each iteration */
interface AbilityContainer {
  /** An image displaying the summary label */
  labelImage: Phaser.GameObjects.Image;
  /** The ability object */
  ability: Ability | null;
  /** The text object displaying the name of the ability */
  nameText: Phaser.GameObjects.Text | null;
  /** The text object displaying the description of the ability */
  descriptionText: Phaser.GameObjects.Text | null;
}

export class SummaryUiHandler extends UiHandler {
  private summaryUiMode: SummaryUiMode;

  private summaryContainer: Phaser.GameObjects.Container;
  private summaryContainerDexNoLabel: Phaser.GameObjects.Image;
  private tabSprite: Phaser.GameObjects.Sprite;
  private shinyOverlay: Phaser.GameObjects.Image;
  private numberText: Phaser.GameObjects.Text;
  private pokemonSprite: Phaser.GameObjects.Sprite;
  private nameText: Phaser.GameObjects.Text;
  private splicedIcon: Phaser.GameObjects.Sprite;
  private pokeball: Phaser.GameObjects.Sprite;
  private levelText: Phaser.GameObjects.Text;
  private genderText: Phaser.GameObjects.Text;
  private shinyIcon: Phaser.GameObjects.Image;
  private fusionShinyIcon: Phaser.GameObjects.Image;
  private candyShadow: Phaser.GameObjects.Sprite;
  private candyIcon: Phaser.GameObjects.Sprite;
  private candyOverlay: Phaser.GameObjects.Sprite;
  private candyCountText: Phaser.GameObjects.Text;
  private championRibbon: Phaser.GameObjects.Image;
  private statusContainer: Phaser.GameObjects.Container;
  private status: Phaser.GameObjects.Image;
  /** The pixel button prompt indicating a passive is unlocked */
  private abilityPrompt: Phaser.GameObjects.Image;
  /** Object holding everything needed to display an ability */
  private abilityContainer: AbilityContainer;
  /** Object holding everything needed to display a passive */
  private passiveContainer: AbilityContainer;
  private summaryPageContainer: Phaser.GameObjects.Container;
  private movesContainer: Phaser.GameObjects.Container;
  private movesContainerMovesTitle: Phaser.GameObjects.Image;
  private movesContainerDescriptionsTitle: Phaser.GameObjects.Image;
  private moveDescriptionText: Phaser.GameObjects.Text;
  private moveCursorObj: Phaser.GameObjects.Sprite | null;
  private selectedMoveCursorObj: Phaser.GameObjects.Sprite | null;
  private moveRowsContainer: Phaser.GameObjects.Container;
  private extraMoveRowContainer: Phaser.GameObjects.Container;
  private moveEffectContainer: Phaser.GameObjects.Container;
  private moveEffectContainerTitle: Phaser.GameObjects.Image;
  private movePowerText: Phaser.GameObjects.Text;
  private moveAccuracyText: Phaser.GameObjects.Text;
  private moveCategoryIcon: Phaser.GameObjects.Sprite;
  private summaryPageTransitionContainer: Phaser.GameObjects.Container;
  private friendshipShadow: Phaser.GameObjects.Sprite;
  private friendshipText: Phaser.GameObjects.Text;
  private friendshipIcon: Phaser.GameObjects.Sprite;
  private friendshipOverlay: Phaser.GameObjects.Sprite;
  private permStatsContainer: Phaser.GameObjects.Container;
  private ivContainer: Phaser.GameObjects.Container;
  private statsContainer: Phaser.GameObjects.Container;
  private statsContainerItemTitle: Phaser.GameObjects.Image;
  private statsContainerStatsTitle: Phaser.GameObjects.Image;
  private statsContainerExpTitle: Phaser.GameObjects.Image;
  private statsContainerExpBarTitle: Phaser.GameObjects.Image;

  private descriptionScrollTween: Phaser.Tweens.Tween | null;
  private moveCursorBlinkTimer: Phaser.Time.TimerEvent | null;

  private pokemon: PlayerPokemon | null;
  private playerParty: boolean;
  /**This is set to false when checking the summary of a freshly caught Pokemon as it is not part of a player's party yet but still needs to display its items*/
  private newMove: Move | null;
  private moveSelectFunction: ((cursor: number) => void) | null;
  private transitioning: boolean;
  private statusVisible: boolean;
  private moveEffectsVisible: boolean;

  private moveSelect: boolean;
  private moveCursor: number;
  private selectedMoveIndex: number;
  private selectCallback: ((cursor: number) => void) | null;

  setup() {
    const ui = this.getUi();

    this.summaryContainer = globalScene.add.container(0, 0);
    this.summaryContainer.setVisible(false);
    ui.add(this.summaryContainer);

    const summaryBg = globalScene.add.image(0, 0, "summary_bg");
    summaryBg.setOrigin(0, 1);
    this.summaryContainer.add(summaryBg);

    this.tabSprite = globalScene.add.sprite(81, -summaryBg.displayHeight + 16, getLocalizedSpriteKey("summary_tabs_1")); // Pixel text 'STATUS' tab
    this.tabSprite.setOrigin(0, 1);
    this.summaryContainer.add(this.tabSprite);

    const summaryLabel = addTextObject(4, -165, i18next.t("pokemonSummary:pokemonInfo"), TextStyle.SUMMARY_HEADER);
    summaryLabel.setOrigin(0, 1);
    this.summaryContainer.add(summaryLabel);

    this.summaryContainerDexNoLabel = globalScene.add.image(6, -151, getLocalizedSpriteKey("summary_dexnb_label")); // Pixel text 'No'
    this.summaryContainerDexNoLabel.setOrigin(0, 1);
    this.summaryContainer.add(this.summaryContainerDexNoLabel);

    this.shinyOverlay = globalScene.add.image(6, -54, getLocalizedSpriteKey("summary_dexnb_label_overlay_shiny")); // Pixel text 'No' shiny
    this.shinyOverlay.setOrigin(0, 1);
    this.shinyOverlay.setVisible(false);
    this.summaryContainer.add(this.shinyOverlay);

    this.numberText = addTextObject(41, -149, "0000", TextStyle.SUMMARY_DEX_NUM);
    this.numberText.setOrigin(1, 1);
    this.summaryContainer.add(this.numberText);

    this.pokemonSprite = globalScene.initPokemonSprite(
      globalScene.add.sprite(56, -106, "pkmn__sub"),
      undefined,
      false,
      true,
    );
    this.summaryContainer.add(this.pokemonSprite);

    this.nameText = addTextObject(6, -53, "", TextStyle.SUMMARY);
    this.nameText.setOrigin(0, 0);
    this.summaryContainer.add(this.nameText);

    this.splicedIcon = globalScene.add.sprite(0, -54, "icon_spliced");
    this.splicedIcon.setVisible(false);
    this.splicedIcon.setOrigin(0, 0);
    this.splicedIcon.setScale(0.75);
    this.splicedIcon.setInteractive(new Phaser.Geom.Rectangle(0, 0, 12, 15), Phaser.Geom.Rectangle.Contains);
    this.summaryContainer.add(this.splicedIcon);

    this.shinyIcon = globalScene.add.image(0, -54, "shiny_star");
    this.shinyIcon.setVisible(false);
    this.shinyIcon.setOrigin(0, 0);
    this.shinyIcon.setScale(0.75);
    this.shinyIcon.setInteractive(new Phaser.Geom.Rectangle(0, 0, 12, 15), Phaser.Geom.Rectangle.Contains);
    this.summaryContainer.add(this.shinyIcon);

    this.fusionShinyIcon = globalScene.add.image(0, 0, "shiny_star_2");
    this.fusionShinyIcon.setVisible(false);
    this.fusionShinyIcon.setOrigin(0, 0);
    this.fusionShinyIcon.setScale(0.75);
    this.summaryContainer.add(this.fusionShinyIcon);

    this.pokeball = globalScene.add.sprite(6, -19, "pb");
    this.pokeball.setOrigin(0, 1);
    this.summaryContainer.add(this.pokeball);

    this.candyIcon = globalScene.add.sprite(13, -140, "candy");
    this.candyIcon.setScale(0.8);
    this.summaryContainer.add(this.candyIcon);

    this.candyOverlay = globalScene.add.sprite(13, -140, "candy_overlay");
    this.candyOverlay.setScale(0.8);
    this.summaryContainer.add(this.candyOverlay);

    this.candyShadow = globalScene.add.sprite(13, -140, "candy");
    this.candyShadow.setTint(0x000000);
    this.candyShadow.setAlpha(0.5);
    this.candyShadow.setScale(0.8);
    this.candyShadow.setInteractive(new Phaser.Geom.Rectangle(0, 0, 30, 16), Phaser.Geom.Rectangle.Contains);
    this.summaryContainer.add(this.candyShadow);

    this.candyCountText = addTextObject(20, -146, "×0", TextStyle.WINDOW_ALT, {
      fontSize: "76px",
    });
    this.candyCountText.setOrigin(0, 0);
    this.summaryContainer.add(this.candyCountText);

    this.friendshipIcon = globalScene.add.sprite(13, -60, "friendship");
    this.friendshipIcon.setScale(0.8);
    this.summaryContainer.add(this.friendshipIcon);

    this.friendshipOverlay = globalScene.add.sprite(13, -60, "friendship_overlay");
    this.friendshipOverlay.setScale(0.8);
    this.summaryContainer.add(this.friendshipOverlay);

    this.friendshipShadow = globalScene.add.sprite(13, -60, "friendship");
    this.friendshipShadow.setTint(0x000000);
    this.friendshipShadow.setAlpha(0.5);
    this.friendshipShadow.setScale(0.8);
    this.friendshipShadow.setInteractive(new Phaser.Geom.Rectangle(0, 0, 50, 16), Phaser.Geom.Rectangle.Contains);
    this.summaryContainer.add(this.friendshipShadow);

    this.friendshipText = addTextObject(20, -66, "×0", TextStyle.WINDOW_ALT, {
      fontSize: "76px",
    });
    this.friendshipText.setOrigin(0, 0);
    this.summaryContainer.add(this.friendshipText);

    this.championRibbon = globalScene.add.image(88, -146, "champion_ribbon");
    this.championRibbon.setOrigin(0, 0);
    //this.championRibbon.setScale(0.8);
    this.championRibbon.setScale(1.25);
    this.summaryContainer.add(this.championRibbon);
    this.championRibbon.setVisible(false);

    this.levelText = addTextObject(24, -17, "", TextStyle.SUMMARY_ALT);
    this.levelText.setOrigin(0, 1);
    this.summaryContainer.add(this.levelText);

    this.genderText = addTextObject(96, -17, "", TextStyle.SUMMARY);
    this.genderText.setOrigin(0, 1);
    this.summaryContainer.add(this.genderText);

    this.statusContainer = globalScene.add.container(-106, -16);

    const statusBg = globalScene.add.image(0, 0, "summary_status");
    statusBg.setOrigin(0, 0);

    this.statusContainer.add(statusBg);

    const statusLabel = addTextObject(3, 0, i18next.t("pokemonSummary:status"), TextStyle.SUMMARY);
    statusLabel.setOrigin(0, 0);

    this.statusContainer.add(statusLabel);

    this.status = globalScene.add.sprite(91, 4, getLocalizedSpriteKey("statuses"));
    this.status.setOrigin(0.5, 0);

    this.statusContainer.add(this.status);

    this.summaryContainer.add(this.statusContainer);

    this.moveEffectContainer = globalScene.add.container(106, -62);

    this.summaryContainer.add(this.moveEffectContainer);

    const moveEffectBg = globalScene.add.image(0, 0, "summary_moves_effect");
    moveEffectBg.setOrigin(0, 0);
    this.moveEffectContainer.add(moveEffectBg);

    this.moveEffectContainerTitle = globalScene.add.image(7, 7, getLocalizedSpriteKey("summary_moves_effect_title")); // Pixel text 'EFFECT'
    this.moveEffectContainerTitle.setOrigin(0, 0.5);
    this.moveEffectContainer.add(this.moveEffectContainerTitle);

    const moveEffectLabels = addTextObject(8, 13, i18next.t("pokemonSummary:powerAccuracyCategory"), TextStyle.SUMMARY);
    moveEffectLabels.setLineSpacing(9);
    moveEffectLabels.setOrigin(0, 0);

    this.moveEffectContainer.add(moveEffectLabels);

    this.movePowerText = addTextObject(99, 27, "0", TextStyle.WINDOW_ALT);
    this.movePowerText.setOrigin(1, 1);
    this.moveEffectContainer.add(this.movePowerText);

    this.moveAccuracyText = addTextObject(99, 43, "0", TextStyle.WINDOW_ALT);
    this.moveAccuracyText.setOrigin(1, 1);
    this.moveEffectContainer.add(this.moveAccuracyText);

    this.moveCategoryIcon = globalScene.add.sprite(99, 57, "categories");
    this.moveCategoryIcon.setOrigin(1, 1);
    this.moveEffectContainer.add(this.moveCategoryIcon);

    const getSummaryPageBg = () => {
      const ret = globalScene.add.sprite(0, 0, this.getPageKey(0));
      ret.setOrigin(0, 1);
      return ret;
    };

    this.summaryContainer.add((this.summaryPageContainer = globalScene.add.container(106, 0)));
    this.summaryPageContainer.add(getSummaryPageBg());
    this.summaryPageContainer.setVisible(false);
    this.summaryContainer.add((this.summaryPageTransitionContainer = globalScene.add.container(106, 0)));
    this.summaryPageTransitionContainer.add(getSummaryPageBg());
    this.summaryPageTransitionContainer.setVisible(false);
  }

  getPageKey(page?: number) {
    if (page === undefined) {
      page = this.cursor;
    }

    const safePage = typeof page === "number" && page >= 0 && page < getEnumValues(Page).length ? page : Page.PROFILE;
    const pageName = Page[safePage] ?? Page[Page.PROFILE] ?? "profile";
    return `summary_${String(pageName).toLowerCase()}`;
  }

  show(
    args: [
      pokemon: PlayerPokemon,
      uiMode?: SummaryUiMode.DEFAULT,
      startPage?: Page,
      selectCallback?: (cursor: number) => void,
      player?: boolean,
    ],
  ): boolean;
