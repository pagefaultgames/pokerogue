import type { Ability } from "#abilities/ability";
import { loggedInUser } from "#app/account";
import { globalScene } from "#app/global-scene";
import { starterColors } from "#app/global-vars/starter-colors";
import { getBiomeName } from "#balance/biomes";
import { getStarterValueFriendshipCap, speciesStarterCosts } from "#balance/starters";
import { getLevelRelExp, getLevelTotalExp } from "#data/exp";
import { getGenderColor, getGenderSymbol } from "#data/gender";
import { getNatureName, getNatureStatMultiplier } from "#data/nature";
import { getPokeballAtlasKey } from "#data/pokeball";
import { getTypeRgb } from "#data/type";
import { Button } from "#enums/buttons";
import { MoveCategory } from "#enums/move-category";
import { Nature } from "#enums/nature";
import { PlayerGender } from "#enums/player-gender";
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
import { UiHandler } from "#ui/handlers/ui-handler";
import { addBBCodeTextObject, addTextObject, getBBCodeFrag, getTextColor } from "#ui/text";
import {
  fixedInt,
  formatStat,
  getLocalizedSpriteKey,
  getShinyDescriptor,
  isNullOrUndefined,
  padInt,
  rgbHexToRgba,
} from "#utils/common";
import { getEnumValues } from "#utils/enums";
import { toCamelCase, toTitleCase } from "#utils/strings";
import { argbFromRgba } from "@material/material-color-utilities";
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
interface abilityContainer {
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
  private abilityContainer: abilityContainer;
  /** Object holding everything needed to display a passive */
  private passiveContainer: abilityContainer;
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
  private moveSelectFunction: Function | null;
  private transitioning: boolean;
  private statusVisible: boolean;
  private moveEffectsVisible: boolean;

  private moveSelect: boolean;
  private moveCursor: number;
  private selectedMoveIndex: number;
  private selectCallback: Function | null;

  constructor() {
    super(UiMode.SUMMARY);
  }

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

    this.numberText = addTextObject(17, -149, "0000", TextStyle.SUMMARY);
    this.numberText.setOrigin(0, 1);
    this.summaryContainer.add(this.numberText);

    this.pokemonSprite = globalScene.initPokemonSprite(
      globalScene.add.sprite(56, -106, "pkmn__sub"),
      undefined,
      false,
      true,
    );
    this.summaryContainer.add(this.pokemonSprite);

    this.nameText = addTextObject(6, -54, "", TextStyle.SUMMARY);
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

    this.candyCountText = addTextObject(20, -146, "x0", TextStyle.WINDOW_ALT, {
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

    this.friendshipText = addTextObject(20, -66, "x0", TextStyle.WINDOW_ALT, {
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

    const moveEffectLabels = addTextObject(8, 12, i18next.t("pokemonSummary:powerAccuracyCategory"), TextStyle.SUMMARY);
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
    return `summary_${Page[page].toLowerCase()}`;
  }

  show(args: any[]): boolean {
    super.show(args);

    /* args[] information
     * args[0] : the Pokemon displayed in the Summary-UI
     * args[1] : the summaryUiMode (defaults to 0)
     * args[2] : the start page (defaults to Page.PROFILE)
     * args[3] : contains the function executed when the user exits out of Summary UI
     * args[4] : optional boolean used to determine if the Pokemon is part of the player's party or not (defaults to true, necessary for PR #2921 to display all relevant information)
     */
    this.pokemon = args[0] as PlayerPokemon;
    this.summaryUiMode = args.length > 1 ? (args[1] as SummaryUiMode) : SummaryUiMode.DEFAULT;
    this.playerParty = args[4] ?? true;
    globalScene.ui.bringToTop(this.summaryContainer);

    this.summaryContainer.setVisible(true);
    this.cursor = -1;

    this.shinyOverlay.setVisible(this.pokemon.isShiny());

    const colorScheme = starterColors[this.pokemon.species.getRootSpeciesId()];
    this.candyIcon.setTint(argbFromRgba(rgbHexToRgba(colorScheme[0])));
    this.candyOverlay.setTint(argbFromRgba(rgbHexToRgba(colorScheme[1])));

    this.numberText.setText(padInt(this.pokemon.species.speciesId, 4));
    this.numberText.setColor(getTextColor(!this.pokemon.isShiny() ? TextStyle.SUMMARY : TextStyle.SUMMARY_GOLD));
    this.numberText.setShadowColor(
      getTextColor(!this.pokemon.isShiny() ? TextStyle.SUMMARY : TextStyle.SUMMARY_GOLD, true),
    );
    const spriteKey = this.pokemon.getSpriteKey(true);
    try {
      this.pokemonSprite.play(spriteKey);
    } catch (err: unknown) {
      console.error(`Failed to play animation for ${spriteKey}`, err);
    }
    this.pokemonSprite
      .setPipelineData("teraColor", getTypeRgb(this.pokemon.getTeraType()))
      .setPipelineData("isTerastallized", this.pokemon.isTerastallized)
      .setPipelineData("ignoreTimeTint", true)
      .setPipelineData("spriteKey", this.pokemon.getSpriteKey())
      .setPipelineData("shiny", this.pokemon.shiny)
      .setPipelineData("variant", this.pokemon.variant);
    ["spriteColors", "fusionSpriteColors"].map(k => {
      delete this.pokemonSprite.pipelineData[`${k}Base`];
      if (this.pokemon?.summonData.speciesForm) {
        k += "Base";
      }
      this.pokemonSprite.pipelineData[k] = this.pokemon?.getSprite().pipelineData[k];
    });
    this.pokemon.cry();

    this.nameText.setText(this.pokemon.getNameToRender(false));

    const isFusion = this.pokemon.isFusion();

    this.splicedIcon.setPositionRelative(this.nameText, this.nameText.displayWidth + 2, 3);
    this.splicedIcon.setVisible(isFusion);
    if (this.splicedIcon.visible) {
      this.splicedIcon.on("pointerover", () =>
        globalScene.ui.showTooltip(
          "",
          `${this.pokemon?.species.getName(this.pokemon.formIndex)}/${this.pokemon?.fusionSpecies?.getName(this.pokemon?.fusionFormIndex)}`,
          true,
        ),
      );
      this.splicedIcon.on("pointerout", () => globalScene.ui.hideTooltip());
    }

    if (
      globalScene.gameData.starterData[this.pokemon.species.getRootSpeciesId()].classicWinCount > 0
      && globalScene.gameData.starterData[this.pokemon.species.getRootSpeciesId(true)].classicWinCount > 0
    ) {
      this.championRibbon.setVisible(true);
    } else {
      this.championRibbon.setVisible(false);
    }

    let currentFriendship = globalScene.gameData.starterData[this.pokemon.species.getRootSpeciesId()].friendship;
    if (!currentFriendship || currentFriendship === undefined) {
      currentFriendship = 0;
    }

    const friendshipCap = getStarterValueFriendshipCap(speciesStarterCosts[this.pokemon.species.getRootSpeciesId()]);
    const candyCropY = 16 - 16 * (currentFriendship / friendshipCap);

    if (this.candyShadow.visible) {
      this.candyShadow.on("pointerover", () =>
        globalScene.ui.showTooltip("", `${currentFriendship}/${friendshipCap}`, true),
      );
      this.candyShadow.on("pointerout", () => globalScene.ui.hideTooltip());
    }

    this.candyCountText.setText(
      `×${globalScene.gameData.starterData[this.pokemon.species.getRootSpeciesId()].candyCount}`,
    );

    this.candyShadow.setCrop(0, 0, 16, candyCropY);

    if (this.friendshipShadow.visible) {
      this.friendshipShadow.on("pointerover", () =>
        globalScene.ui.showTooltip("", `${i18next.t("pokemonSummary:friendship")}`, true),
      );
      this.friendshipShadow.on("pointerout", () => globalScene.ui.hideTooltip());
    }

    this.friendshipText.setText(` ${this.pokemon?.friendship || "0"}/255`);

    this.friendshipShadow.setCrop(0, 0, 16, 16 - 16 * ((this.pokemon?.friendship || 0) / 255));

    const doubleShiny = this.pokemon.isDoubleShiny(false);
    const bigIconVariant = doubleShiny ? this.pokemon.getBaseVariant(doubleShiny) : this.pokemon.getVariant();

    this.shinyIcon.setPositionRelative(
      this.nameText,
      this.nameText.displayWidth + (this.splicedIcon.visible ? this.splicedIcon.displayWidth + 1 : 0) + 1,
      3,
    );
    this.shinyIcon
      .setTexture(`shiny_star${doubleShiny ? "_1" : ""}`)
      .setVisible(this.pokemon.isShiny(false))
      .setTint(getVariantTint(bigIconVariant));
    if (this.shinyIcon.visible) {
      let shinyDescriptor = "";
      if (doubleShiny || bigIconVariant) {
        shinyDescriptor = " (" + getShinyDescriptor(bigIconVariant);
        if (doubleShiny) {
          shinyDescriptor += "/" + getShinyDescriptor(this.pokemon.fusionVariant);
        }
        shinyDescriptor += ")";
      }
      this.shinyIcon
        .on("pointerover", () =>
          globalScene.ui.showTooltip("", i18next.t("common:shinyOnHover") + shinyDescriptor, true),
        )
        .on("pointerout", () => globalScene.ui.hideTooltip());
    }

    this.fusionShinyIcon.setPosition(this.shinyIcon.x, this.shinyIcon.y);
    this.fusionShinyIcon.setVisible(doubleShiny);
    if (isFusion) {
      this.fusionShinyIcon.setTint(getVariantTint(this.pokemon.fusionVariant));
    }

    this.pokeball.setFrame(getPokeballAtlasKey(this.pokemon.pokeball));
    this.levelText.setText(`${i18next.t("pokemonSummary:lv")}${this.pokemon.level.toString()}`);
    this.genderText.setText(getGenderSymbol(this.pokemon.getGender(true)));
    this.genderText.setColor(getGenderColor(this.pokemon.getGender(true)));
    this.genderText.setShadowColor(getGenderColor(this.pokemon.getGender(true), true));

    switch (this.summaryUiMode) {
      case SummaryUiMode.DEFAULT: {
        const page = args.length < 2 ? Page.PROFILE : (args[2] as Page);
        this.hideMoveEffect(true);
        this.setCursor(page);
        if (args.length > 3) {
          this.selectCallback = args[3];
        }
        break;
      }
      case SummaryUiMode.LEARN_MOVE:
        this.newMove = args[2] as Move;
        this.moveSelectFunction = args[3] as Function;

        this.showMoveEffect(true);
        this.setCursor(Page.MOVES);
        this.showMoveSelect();
        break;
    }

    const fromSummary = args.length >= 2;

    if (this.pokemon.status || this.pokemon.pokerus) {
      this.showStatus(!fromSummary);
      this.status.setFrame(this.pokemon.status ? StatusEffect[this.pokemon.status.effect].toLowerCase() : "pokerus");
    } else {
      this.hideStatus(!fromSummary);
    }

    return true;
  }

  processInput(button: Button): boolean {
    if (this.transitioning) {
      return false;
    }

    const ui = this.getUi();
    const fromPartyMode = ui.handlers[UiMode.PARTY].active;
    let success = false;
    let error = false;

    if (this.moveSelect) {
      if (button === Button.ACTION) {
        if (this.pokemon && this.moveCursor < this.pokemon.moveset.length) {
          if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE) {
            this.moveSelectFunction?.(this.moveCursor);
          } else if (this.selectedMoveIndex === -1) {
            this.selectedMoveIndex = this.moveCursor;
            this.setCursor(this.moveCursor);
          } else {
            if (this.selectedMoveIndex !== this.moveCursor) {
              const tempMove = this.pokemon?.moveset[this.selectedMoveIndex];
              this.pokemon.moveset[this.selectedMoveIndex] = this.pokemon.moveset[this.moveCursor];
              this.pokemon.moveset[this.moveCursor] = tempMove;

              const selectedMoveRow = this.moveRowsContainer.getAt(
                this.selectedMoveIndex,
              ) as Phaser.GameObjects.Container;
              const switchMoveRow = this.moveRowsContainer.getAt(this.moveCursor) as Phaser.GameObjects.Container;

              this.moveRowsContainer.moveTo(selectedMoveRow, this.moveCursor);
              this.moveRowsContainer.moveTo(switchMoveRow, this.selectedMoveIndex);

              selectedMoveRow.setY(this.moveCursor * 16);
              switchMoveRow.setY(this.selectedMoveIndex * 16);
            }

            this.selectedMoveIndex = -1;
            if (this.selectedMoveCursorObj) {
              this.selectedMoveCursorObj.destroy();
              this.selectedMoveCursorObj = null;
            }
          }
          success = true;
        } else if (this.moveCursor === 4) {
          return this.processInput(Button.CANCEL);
        } else {
          error = true;
        }
      } else if (button === Button.CANCEL) {
        this.hideMoveSelect();
        success = true;
      } else {
        switch (button) {
          case Button.UP:
            success = this.setCursor(this.moveCursor ? this.moveCursor - 1 : 4);
            break;
          case Button.DOWN:
            success = this.setCursor(this.moveCursor < 4 ? this.moveCursor + 1 : 0);
            break;
          case Button.LEFT:
            this.moveSelect = false;
            this.setCursor(Page.STATS);
            if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE) {
              this.hideMoveEffect();
              this.destroyBlinkCursor();
              success = true;
              break;
            }
            this.hideMoveSelect();
            success = true;
            break;
        }
      }
    } else if (button === Button.ACTION) {
      if (this.cursor === Page.MOVES) {
        this.showMoveSelect();
        success = true;
      } else if (this.cursor === Page.PROFILE && this.pokemon?.hasPassive()) {
        // if we're on the PROFILE page and this pokemon has a passive unlocked..
        // Since abilities are displayed by default, all we need to do is toggle visibility on all elements to show passives
        this.abilityContainer.nameText?.setVisible(!this.abilityContainer.descriptionText?.visible);
        this.abilityContainer.descriptionText?.setVisible(!this.abilityContainer.descriptionText.visible);
        this.abilityContainer.labelImage.setVisible(!this.abilityContainer.labelImage.visible);

        this.passiveContainer.nameText?.setVisible(!this.passiveContainer.descriptionText?.visible);
        this.passiveContainer.descriptionText?.setVisible(!this.passiveContainer.descriptionText.visible);
        this.passiveContainer.labelImage.setVisible(!this.passiveContainer.labelImage.visible);
      } else if (this.cursor === Page.STATS) {
        //Show IVs
        this.permStatsContainer.setVisible(!this.permStatsContainer.visible);
        this.ivContainer.setVisible(!this.ivContainer.visible);
      }
    } else if (button === Button.CANCEL) {
      if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE) {
        this.hideMoveSelect();
      } else {
        if (this.selectCallback instanceof Function) {
          const selectCallback = this.selectCallback;
          this.selectCallback = null;
          selectCallback();
        }

        if (!fromPartyMode) {
          ui.setMode(UiMode.MESSAGE);
        } else {
          ui.setMode(UiMode.PARTY);
        }
      }
      success = true;
    } else {
      const pages = getEnumValues(Page);
      switch (button) {
        case Button.UP:
        case Button.DOWN: {
          if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE) {
            break;
          }
          if (!fromPartyMode) {
            break;
          }
          const isDown = button === Button.DOWN;
          const party = globalScene.getPlayerParty();
          const partyMemberIndex = this.pokemon ? party.indexOf(this.pokemon) : -1;
          if ((isDown && partyMemberIndex < party.length - 1) || (!isDown && partyMemberIndex)) {
            const page = this.cursor;
            this.clear();
            this.show([party[partyMemberIndex + (isDown ? 1 : -1)], this.summaryUiMode, page]);
          }
          break;
        }
        case Button.LEFT:
          if (this.cursor) {
            success = this.setCursor(this.cursor - 1);
          }
          break;
        case Button.RIGHT:
          if (this.cursor < pages.length - 1) {
            success = this.setCursor(this.cursor + 1);
            if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE && this.cursor === Page.MOVES) {
              this.moveSelect = true;
            }
          }
          break;
      }
    }

    if (success) {
      ui.playSelect();
    } else if (error) {
      ui.playError();
    }

    return success || error;
  }

  setCursor(cursor: number, overrideChanged = false): boolean {
    let changed: boolean = overrideChanged || this.moveCursor !== cursor;

    if (this.moveSelect) {
      this.moveCursor = cursor;

      const selectedMove = this.getSelectedMove();

      if (selectedMove) {
        this.moveDescriptionText.setY(84);
        this.movePowerText.setText(selectedMove.power >= 0 ? selectedMove.power.toString() : "---");
        this.moveAccuracyText.setText(selectedMove.accuracy >= 0 ? selectedMove.accuracy.toString() : "---");
        this.moveCategoryIcon.setFrame(MoveCategory[selectedMove.category].toLowerCase());
        this.showMoveEffect();
      } else {
        this.hideMoveEffect();
      }

      this.moveDescriptionText.setText(selectedMove?.effect || "");
      const moveDescriptionLineCount = Math.floor(this.moveDescriptionText.displayHeight / 14.83);

      if (this.descriptionScrollTween) {
        this.descriptionScrollTween.remove();
        this.descriptionScrollTween = null;
      }

      if (moveDescriptionLineCount > 3) {
        this.descriptionScrollTween = globalScene.tweens.add({
          targets: this.moveDescriptionText,
          delay: fixedInt(2000),
          loop: -1,
          hold: fixedInt(2000),
          duration: fixedInt((moveDescriptionLineCount - 3) * 2000),
          y: `-=${14.83 * (moveDescriptionLineCount - 3)}`,
        });
      }

      if (!this.moveCursorObj) {
        this.moveCursorObj = globalScene.add.sprite(-2, 0, "summary_moves_cursor", "highlight");
        this.moveCursorObj.setOrigin(0, 1);
        this.movesContainer.add(this.moveCursorObj);
      }

      this.moveCursorObj.setY(16 * this.moveCursor + 1);

      if (this.moveCursorBlinkTimer) {
        this.moveCursorBlinkTimer.destroy();
      }
      this.moveCursorObj.setVisible(true);
      this.moveCursorBlinkTimer = globalScene.time.addEvent({
        loop: true,
        delay: fixedInt(600),
        callback: () => {
          this.moveCursorObj?.setVisible(false);
          globalScene.time.delayedCall(fixedInt(100), () => {
            if (!this.moveCursorObj) {
              return;
            }
            this.moveCursorObj.setVisible(true);
          });
        },
      });
      if (this.selectedMoveIndex > -1) {
        if (!this.selectedMoveCursorObj) {
          this.selectedMoveCursorObj = globalScene.add.sprite(-2, 0, "summary_moves_cursor", "select");
          this.selectedMoveCursorObj.setOrigin(0, 1);
          this.movesContainer.add(this.selectedMoveCursorObj);
          this.movesContainer.moveBelow(this.selectedMoveCursorObj, this.moveCursorObj);
        }

        this.selectedMoveCursorObj.setY(16 * this.selectedMoveIndex + 1);
      }
    } else {
      changed = this.cursor !== cursor;
      if (changed) {
        const forward = this.cursor < cursor;
        this.cursor = cursor;

        this.tabSprite.setTexture(getLocalizedSpriteKey(`summary_tabs_${this.cursor + 1}`)); // Pixel text 'STATUS' and "MOVES" tabs

        this.getUi().hideTooltip();

        if (this.summaryPageContainer.visible) {
          this.transitioning = true;
          this.populatePageContainer(this.summaryPageTransitionContainer, forward ? cursor : cursor + 1);
          if (forward) {
            this.summaryPageTransitionContainer.x += 214;
          } else {
            this.populatePageContainer(this.summaryPageContainer);
          }
          globalScene.tweens.add({
            targets: this.summaryPageTransitionContainer,
            x: forward ? "-=214" : "+=214",
            duration: 250,
            onComplete: () => {
              if (forward) {
                this.populatePageContainer(this.summaryPageContainer);
                if (this.cursor === Page.MOVES) {
                  this.moveCursorObj = null;
                  this.showMoveSelect();
                  this.showMoveEffect();
                }
              } else {
                this.summaryPageTransitionContainer.x -= 214;
              }
              this.summaryPageTransitionContainer.setVisible(false);
              this.transitioning = false;
            },
          });
          this.summaryPageTransitionContainer.setVisible(true);
        } else {
          this.populatePageContainer(this.summaryPageContainer);
          this.summaryPageContainer.setVisible(true);
        }
      }
    }

    return changed;
  }

  populatePageContainer(pageContainer: Phaser.GameObjects.Container, page?: Page) {
    if (page === undefined) {
      page = this.cursor;
    }

    if (pageContainer.getAll().length > 1) {
      pageContainer.each((o: Phaser.GameObjects.GameObject) => {
        if (o instanceof Phaser.GameObjects.Container) {
          o.removeAll(true);
        }
      });
      pageContainer.removeBetween(1, undefined, true);
    }
    const pageBg = pageContainer.getAt(0) as Phaser.GameObjects.Sprite;
    pageBg.setTexture(this.getPageKey(page));

    if (this.descriptionScrollTween) {
      this.descriptionScrollTween.remove();
      this.descriptionScrollTween = null;
    }

    switch (page) {
      case Page.PROFILE: {
        const profileContainer = globalScene.add.container(0, -pageBg.height);
        pageContainer.add(profileContainer);
        const otColor =
          globalScene.gameData.gender === PlayerGender.FEMALE ? TextStyle.SUMMARY_PINK : TextStyle.SUMMARY_BLUE;
        const usernameReplacement =
          globalScene.gameData.gender === PlayerGender.FEMALE
            ? i18next.t("trainerNames:playerF")
            : i18next.t("trainerNames:playerM");

        const profileContainerProfilTitle = globalScene.add.image(
          7,
          4,
          getLocalizedSpriteKey("summary_profile_profile_title"), // Pixel text 'PROFIL'
        );
        profileContainerProfilTitle.setOrigin(0, 0.5);
        profileContainer.add(profileContainerProfilTitle);

        // TODO: should add field for original trainer name to Pokemon object, to support gift/traded Pokemon from MEs
        const trainerText = addBBCodeTextObject(
          7,
          12,
          `${i18next.t("pokemonSummary:ot")}/${getBBCodeFrag(
            !globalScene.hideUsername
              ? loggedInUser?.username || i18next.t("pokemonSummary:unknown")
              : usernameReplacement,
            otColor,
          )}`,
          TextStyle.SUMMARY_ALT,
        ).setOrigin(0);
        profileContainer.add(trainerText);

        const idToDisplay = globalScene.hideUsername ? "*****" : globalScene.gameData.trainerId.toString();
        const trainerIdText = addTextObject(
          141,
          12,
          `${i18next.t("pokemonSummary:idNo")}${idToDisplay}`,
          TextStyle.SUMMARY_ALT,
        ).setOrigin(0);
        profileContainer.add(trainerIdText);

        const typeLabel = addTextObject(7, 28, `${i18next.t("pokemonSummary:type")}/`, TextStyle.WINDOW_ALT);
        typeLabel.setOrigin(0, 0);
        profileContainer.add(typeLabel);

        const getTypeIcon = (index: number, type: PokemonType, tera = false) => {
          const xCoord = typeLabel.width * typeLabel.scale + 9 + 34 * index;
          const typeIcon = !tera
            ? globalScene.add.sprite(xCoord, 42, getLocalizedSpriteKey("types"), PokemonType[type].toLowerCase())
            : globalScene.add.sprite(xCoord, 42, "type_tera");
          if (tera) {
            typeIcon.setScale(0.5);
            const typeRgb = getTypeRgb(type);
            typeIcon.setTint(Phaser.Display.Color.GetColor(typeRgb[0], typeRgb[1], typeRgb[2]));
          }
          typeIcon.setOrigin(0, 1);
          return typeIcon;
        };

        const types = this.pokemon?.getTypes(false, false, true, false)!; // TODO: is this bang correct?
        profileContainer.add(getTypeIcon(0, types[0]));
        if (types.length > 1) {
          profileContainer.add(getTypeIcon(1, types[1]));
        }

        if (this.pokemon?.getLuck()) {
          const luckLabelText = addTextObject(141, 28, i18next.t("common:luckIndicator"), TextStyle.SUMMARY_ALT);
          luckLabelText.setOrigin(0, 0);
          profileContainer.add(luckLabelText);

          const luckText = addTextObject(
            141 + luckLabelText.displayWidth + 2,
            28,
            this.pokemon.getLuck().toString(),
            TextStyle.LUCK_VALUE,
          );
          luckText.setOrigin(0, 0);
          luckText.setTint(getVariantTint(Math.min(this.pokemon.getLuck() - 1, 2) as Variant));
          profileContainer.add(luckText);
        }

        if (
          globalScene.gameData.achvUnlocks.hasOwnProperty(achvs.TERASTALLIZE.id)
          && !isNullOrUndefined(this.pokemon)
        ) {
          const teraIcon = globalScene.add.sprite(123, 26, "button_tera");
          teraIcon.setName("terastallize-icon");
          teraIcon.setFrame(PokemonType[this.pokemon.getTeraType()].toLowerCase());
          profileContainer.add(teraIcon);
        }

        this.abilityContainer = {
          labelImage: globalScene.add.image(0, 0, getLocalizedSpriteKey("summary_profile_ability")), // Pixel text 'ABILITY'
          ability: this.pokemon?.getAbility(true)!, // TODO: is this bang correct?
          nameText: null,
          descriptionText: null,
        };

        const allAbilityInfo = [this.abilityContainer]; // Creates an array to iterate through
        // Only add to the array and set up displaying a passive if it's unlocked
        if (this.pokemon?.hasPassive()) {
          this.passiveContainer = {
            labelImage: globalScene.add.image(0, 0, getLocalizedSpriteKey("summary_profile_passive")), // Pixel text 'PASSIVE'
            ability: this.pokemon.getPassiveAbility(),
            nameText: null,
            descriptionText: null,
          };
          allAbilityInfo.push(this.passiveContainer);

          // Sets up the pixel button prompt image
          this.abilityPrompt = globalScene.add.image(
            0,
            0,
            !globalScene.inputController?.gamepadSupport ? "summary_profile_prompt_z" : "summary_profile_prompt_a",
          );
          this.abilityPrompt.setPosition(8, 43);
          this.abilityPrompt.setVisible(true);
          this.abilityPrompt.setOrigin(0, 0);
          profileContainer.add(this.abilityPrompt);
        }

        allAbilityInfo.forEach(abilityInfo => {
          abilityInfo.labelImage.setPosition(17, 47);
          abilityInfo.labelImage.setVisible(true);
          abilityInfo.labelImage.setOrigin(0, 0.5);
          profileContainer.add(abilityInfo.labelImage);

          abilityInfo.nameText = addTextObject(7, 68, abilityInfo.ability?.name!, TextStyle.SUMMARY_ALT); // TODO: is this bang correct?
          abilityInfo.nameText.setOrigin(0, 1);
          profileContainer.add(abilityInfo.nameText);

          abilityInfo.descriptionText = addTextObject(7, 71, abilityInfo.ability?.description!, TextStyle.WINDOW_ALT, {
            wordWrap: { width: 1224 },
          }); // TODO: is this bang correct?
          abilityInfo.descriptionText.setOrigin(0, 0);
          profileContainer.add(abilityInfo.descriptionText);

          // Sets up the mask that hides the description text to give an illusion of scrolling
          const descriptionTextMaskRect = globalScene.make.graphics({});
          descriptionTextMaskRect.setScale(6);
          descriptionTextMaskRect.fillStyle(0xffffff);
          descriptionTextMaskRect.beginPath();
          descriptionTextMaskRect.fillRect(110, 90.5, 206, 31);

          const abilityDescriptionTextMask = descriptionTextMaskRect.createGeometryMask();

          abilityInfo.descriptionText.setMask(abilityDescriptionTextMask);

          const abilityDescriptionLineCount = Math.floor(abilityInfo.descriptionText.displayHeight / 14.83);

          // Animates the description text moving upwards
          if (abilityDescriptionLineCount > 2) {
            abilityInfo.descriptionText.setY(69);
            this.descriptionScrollTween = globalScene.tweens.add({
              targets: abilityInfo.descriptionText,
              delay: fixedInt(2000),
              loop: -1,
              hold: fixedInt(2000),
              duration: fixedInt((abilityDescriptionLineCount - 2) * 2000),
              y: `-=${14.83 * (abilityDescriptionLineCount - 2)}`,
            });
          }
        });
        // Turn off visibility of passive info by default
        this.passiveContainer?.labelImage.setVisible(false);
        this.passiveContainer?.nameText?.setVisible(false);
        this.passiveContainer?.descriptionText?.setVisible(false);

        const closeFragment = getBBCodeFrag("", TextStyle.WINDOW_ALT);
        const rawNature = toCamelCase(Nature[this.pokemon?.getNature()!]); // TODO: is this bang correct?
        const nature = `${getBBCodeFrag(toTitleCase(getNatureName(this.pokemon?.getNature()!)), TextStyle.SUMMARY_RED)}${closeFragment}`; // TODO: is this bang correct?

        const profileContainerMemoTitle = globalScene.add.image(
          7,
          107,
          getLocalizedSpriteKey("summary_profile_memo_title"), // Pixel text 'TRAINER MEMO'
        );
        profileContainerMemoTitle.setOrigin(0, 0.5);
        profileContainer.add(profileContainerMemoTitle);

        const memoString = i18next.t("pokemonSummary:memoString", {
          metFragment: i18next.t(
            `pokemonSummary:metFragment.${this.pokemon?.metBiome === -1 ? "apparently" : "normal"}`,
            {
              biome: `${getBBCodeFrag(getBiomeName(this.pokemon?.metBiome!), TextStyle.SUMMARY_RED)}${closeFragment}`, // TODO: is this bang correct?
              level: `${getBBCodeFrag(this.pokemon?.metLevel.toString()!, TextStyle.SUMMARY_RED)}${closeFragment}`, // TODO: is this bang correct?
              wave: `${getBBCodeFrag(this.pokemon?.metWave ? this.pokemon.metWave.toString()! : i18next.t("pokemonSummary:unknownTrainer"), TextStyle.SUMMARY_RED)}${closeFragment}`,
            },
          ),
          natureFragment: i18next.t(`pokemonSummary:natureFragment.${rawNature}`, { nature }),
        });

        const memoText = addBBCodeTextObject(7, 113, String(memoString), TextStyle.WINDOW_ALT);
        memoText.setOrigin(0, 0);
        profileContainer.add(memoText);
        break;
      }
      case Page.STATS: {
        this.statsContainer = globalScene.add.container(0, -pageBg.height);
        pageContainer.add(this.statsContainer);
        this.permStatsContainer = globalScene.add.container(27, 56);
        this.statsContainer.add(this.permStatsContainer);
        this.ivContainer = globalScene.add.container(27, 56);
        this.statsContainer.add(this.ivContainer);
        this.statsContainer.setVisible(true);

        this.statsContainerItemTitle = globalScene.add.image(7, 4, getLocalizedSpriteKey("summary_stats_item_title")); // Pixel text 'ITEM'
        this.statsContainerItemTitle.setOrigin(0, 0.5);
        this.statsContainer.add(this.statsContainerItemTitle);

        this.statsContainerStatsTitle = globalScene.add.image(
          16,
          51,
          getLocalizedSpriteKey("summary_stats_stats_title"), // Pixel text 'STATS'
        );
        this.statsContainerStatsTitle.setOrigin(0, 0.5);
        this.statsContainer.add(this.statsContainerStatsTitle);

        this.statsContainerExpTitle = globalScene.add.image(7, 107, getLocalizedSpriteKey("summary_stats_exp_title")); // Pixel text 'EXP.'
        this.statsContainerExpTitle.setOrigin(0, 0.5);
        this.statsContainer.add(this.statsContainerExpTitle);

        this.statsContainerExpBarTitle = globalScene.add.image(
          126,
          144,
          getLocalizedSpriteKey("summary_stats_expbar_title"), // Pixel mini text 'EXP'
        );
        this.statsContainerExpBarTitle.setOrigin(0, 0);
        this.statsContainer.add(this.statsContainerExpBarTitle);

        PERMANENT_STATS.forEach((stat, s) => {
          const statName = i18next.t(getStatKey(stat));
          const rowIndex = s % 3;
          const colIndex = Math.floor(s / 3);

          const natureStatMultiplier = getNatureStatMultiplier(this.pokemon?.getNature()!, s); // TODO: is this bang correct?

          const statLabel = addTextObject(
            115 * colIndex + (colIndex === 1 ? 5 : 0),
            16 * rowIndex,
            statName,
            natureStatMultiplier === 1
              ? TextStyle.SUMMARY_STATS
              : natureStatMultiplier > 1
                ? TextStyle.SUMMARY_STATS_PINK
                : TextStyle.SUMMARY_STATS_BLUE,
          );
          const ivLabel = addTextObject(
            115 * colIndex + (colIndex === 1 ? 5 : 0),
            16 * rowIndex,
            statName,
            this.pokemon?.ivs[stat] === 31 ? TextStyle.SUMMARY_STATS_GOLD : TextStyle.SUMMARY_STATS,
          );

          statLabel.setOrigin(0.5, 0);
          ivLabel.setOrigin(0.5, 0);
          this.permStatsContainer.add(statLabel);
          this.ivContainer.add(ivLabel);

          const statValueText =
            stat !== Stat.HP
              ? formatStat(this.pokemon?.getStat(stat)!) // TODO: is this bang correct?
              : `${formatStat(this.pokemon?.hp!, true)}/${formatStat(this.pokemon?.getMaxHp()!, true)}`; // TODO: are those bangs correct?
          const ivText = `${this.pokemon?.ivs[stat]}/31`;

          const statValue = addTextObject(93 + 88 * colIndex, 16 * rowIndex, statValueText, TextStyle.WINDOW_ALT);
          statValue.setOrigin(1, 0);
          this.permStatsContainer.add(statValue);
          const ivValue = addTextObject(93 + 88 * colIndex, 16 * rowIndex, ivText, TextStyle.WINDOW_ALT);
          ivValue.setOrigin(1, 0);
          this.ivContainer.add(ivValue);
        });
        this.ivContainer.setVisible(false);

        const itemModifiers = (
          globalScene.findModifiers(
            m => m instanceof PokemonHeldItemModifier && m.pokemonId === this.pokemon?.id,
            this.playerParty,
          ) as PokemonHeldItemModifier[]
        ).sort(modifierSortFunc);

        itemModifiers.forEach((item, i) => {
          const icon = item.getIcon(true);

          icon.setPosition((i % 17) * 12 + 3, 14 * Math.floor(i / 17) + 15);
          this.statsContainer.add(icon);

          icon.setInteractive(new Phaser.Geom.Rectangle(0, 0, 32, 32), Phaser.Geom.Rectangle.Contains);
          icon.on("pointerover", () => globalScene.ui.showTooltip(item.type.name, item.type.getDescription(), true));
          icon.on("pointerout", () => globalScene.ui.hideTooltip());
        });

        const pkmLvl = this.pokemon?.level!; // TODO: is this bang correct?
        const pkmLvlExp = this.pokemon?.levelExp!; // TODO: is this bang correct?
        const pkmExp = this.pokemon?.exp!; // TODO: is this bang correct?
        const pkmSpeciesGrowthRate = this.pokemon?.species.growthRate!; // TODO: is this bang correct?
        const relLvExp = getLevelRelExp(pkmLvl + 1, pkmSpeciesGrowthRate);
        const expRatio = pkmLvl < globalScene.getMaxExpLevel() ? pkmLvlExp / relLvExp : 0;

        const expLabel = addTextObject(6, 112, i18next.t("pokemonSummary:expPoints"), TextStyle.SUMMARY);
        expLabel.setOrigin(0, 0);
        this.statsContainer.add(expLabel);

        const nextLvExpLabel = addTextObject(6, 128, i18next.t("pokemonSummary:nextLv"), TextStyle.SUMMARY);
        nextLvExpLabel.setOrigin(0, 0);
        this.statsContainer.add(nextLvExpLabel);

        const expText = addTextObject(208, 112, pkmExp.toString(), TextStyle.WINDOW_ALT);
        expText.setOrigin(1, 0);
        this.statsContainer.add(expText);

        const nextLvExp =
          pkmLvl < globalScene.getMaxExpLevel() ? getLevelTotalExp(pkmLvl + 1, pkmSpeciesGrowthRate) - pkmExp : 0;
        const nextLvExpText = addTextObject(208, 128, nextLvExp.toString(), TextStyle.WINDOW_ALT);
        nextLvExpText.setOrigin(1, 0);
        this.statsContainer.add(nextLvExpText);

        const expOverlay = globalScene.add.image(140, 145, "summary_stats_overlay_exp");
        expOverlay.setOrigin(0, 0);
        this.statsContainer.add(expOverlay);

        const expMaskRect = globalScene.make.graphics({});
        expMaskRect.setScale(6);
        expMaskRect.fillStyle(0xffffff);
        expMaskRect.beginPath();
        expMaskRect.fillRect(140 + pageContainer.x, 145 + pageContainer.y + 21, Math.floor(expRatio * 64), 3);

        const expMask = expMaskRect.createGeometryMask();

        expOverlay.setMask(expMask);
        this.abilityPrompt = globalScene.add.image(
          0,
          0,
          !globalScene.inputController?.gamepadSupport ? "summary_profile_prompt_z" : "summary_profile_prompt_a",
        );
        this.abilityPrompt.setPosition(8, 47);
        this.abilityPrompt.setVisible(true);
        this.abilityPrompt.setOrigin(0, 0);
        this.statsContainer.add(this.abilityPrompt);
        break;
      }
      case Page.MOVES: {
        this.movesContainer = globalScene.add.container(5, -pageBg.height + 26);
        pageContainer.add(this.movesContainer);

        this.movesContainerMovesTitle = globalScene.add.image(
          2,
          -22,
          getLocalizedSpriteKey("summary_moves_moves_title"),
        ); // Pixel text 'MOVES'
        this.movesContainerMovesTitle.setOrigin(0, 0.5);
        this.movesContainer.add(this.movesContainerMovesTitle);

        this.movesContainerDescriptionsTitle = globalScene.add.image(
          2,
          78,
          getLocalizedSpriteKey("summary_moves_descriptions_title"),
        ); // Pixel text 'DESCRIPTIONS'
        this.movesContainerDescriptionsTitle.setOrigin(0, 0.5);
        this.movesContainer.add(this.movesContainerDescriptionsTitle);

        this.extraMoveRowContainer = globalScene.add.container(0, 64);
        this.extraMoveRowContainer.setVisible(false);
        this.movesContainer.add(this.extraMoveRowContainer);

        const extraRowOverlay = globalScene.add.image(-2, 1, "summary_moves_overlay_row");
        extraRowOverlay.setOrigin(0, 1);
        this.extraMoveRowContainer.add(extraRowOverlay);

        const extraRowText = addTextObject(
          35,
          0,
          this.summaryUiMode === SummaryUiMode.LEARN_MOVE && this.newMove
            ? this.newMove.name
            : i18next.t("pokemonSummary:cancel"),
          this.summaryUiMode === SummaryUiMode.LEARN_MOVE ? TextStyle.SUMMARY_PINK : TextStyle.SUMMARY,
        );
        extraRowText.setOrigin(0, 1);
        this.extraMoveRowContainer.add(extraRowText);

        if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE) {
          this.extraMoveRowContainer.setVisible(true);

          if (this.newMove && this.pokemon) {
            const spriteKey = getLocalizedSpriteKey("types");
            const moveType = this.pokemon.getMoveType(this.newMove);
            const newMoveTypeIcon = globalScene.add.sprite(0, 0, spriteKey, PokemonType[moveType].toLowerCase());
            newMoveTypeIcon.setOrigin(0, 1);
            this.extraMoveRowContainer.add(newMoveTypeIcon);
          }
          const ppOverlay = globalScene.add.image(172, -5, getLocalizedSpriteKey("summary_moves_overlay_pp")); // Pixel text 'PP'
          ppOverlay.setOrigin(1, 0.5);
          this.extraMoveRowContainer.add(ppOverlay);

          const pp = padInt(this.newMove?.pp!, 2, "  "); // TODO: is this bang correct?
          const ppText = addTextObject(173, 1, `${pp}/${pp}`, TextStyle.WINDOW);
          ppText.setOrigin(0, 1);
          this.extraMoveRowContainer.add(ppText);
        }

        this.moveRowsContainer = globalScene.add.container(0, 0);
        this.movesContainer.add(this.moveRowsContainer);

        for (let m = 0; m < 4; m++) {
          const move: PokemonMove | null =
            this.pokemon && this.pokemon.moveset.length > m ? this.pokemon?.moveset[m] : null;
          const moveRowContainer = globalScene.add.container(0, 16 * m);
          this.moveRowsContainer.add(moveRowContainer);

          if (move && this.pokemon) {
            const spriteKey = getLocalizedSpriteKey("types");
            const moveType = this.pokemon.getMoveType(move.getMove());
            const typeIcon = globalScene.add.sprite(0, 0, spriteKey, PokemonType[moveType].toLowerCase());
            typeIcon.setOrigin(0, 1);
            moveRowContainer.add(typeIcon);
          }

          const moveText = addTextObject(35, 0, move ? move.getName() : "-", TextStyle.SUMMARY);
          moveText.setOrigin(0, 1);
          moveRowContainer.add(moveText);

          const ppOverlay = globalScene.add.image(172, -5, getLocalizedSpriteKey("summary_moves_overlay_pp")); // Pixel text 'PP'
          ppOverlay.setOrigin(1, 0.5);
          moveRowContainer.add(ppOverlay);

          const ppText = addTextObject(173, 1, "--/--", TextStyle.WINDOW);
          ppText.setOrigin(0, 1);

          if (move) {
            const maxPP = move.getMovePp();
            const pp = maxPP - move.ppUsed;
            ppText.setText(`${padInt(pp, 2, "  ")}/${padInt(maxPP, 2, "  ")}`);
          }

          moveRowContainer.add(ppText);
        }

        this.moveDescriptionText = addTextObject(2, 84, "", TextStyle.WINDOW_ALT, { wordWrap: { width: 1212 } });
        this.movesContainer.add(this.moveDescriptionText);

        const moveDescriptionTextMaskRect = globalScene.make.graphics({});
        moveDescriptionTextMaskRect.setScale(6);
        moveDescriptionTextMaskRect.fillStyle(0xffffff);
        moveDescriptionTextMaskRect.beginPath();
        moveDescriptionTextMaskRect.fillRect(112, 130, 202, 46);

        const moveDescriptionTextMask = moveDescriptionTextMaskRect.createGeometryMask();

        this.moveDescriptionText.setMask(moveDescriptionTextMask);
        break;
      }
    }
  }

  showStatus(instant?: boolean) {
    if (this.statusVisible) {
      return;
    }
    this.statusVisible = true;
    globalScene.tweens.add({
      targets: this.statusContainer,
      x: 0,
      duration: instant ? 0 : 250,
      ease: "Sine.easeOut",
    });
  }

  hideStatus(instant?: boolean) {
    if (!this.statusVisible) {
      return;
    }
    this.statusVisible = false;
    globalScene.tweens.add({
      targets: this.statusContainer,
      x: -106,
      duration: instant ? 0 : 250,
      ease: "Sine.easeIn",
    });
  }

  getSelectedMove(): Move | null {
    if (this.cursor !== Page.MOVES) {
      return null;
    }

    if (this.moveCursor < 4 && this.pokemon && this.moveCursor < this.pokemon.moveset.length) {
      return this.pokemon.moveset[this.moveCursor].getMove();
    }
    if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE && this.moveCursor === 4) {
      return this.newMove;
    }
    return null;
  }

  showMoveSelect() {
    this.moveSelect = true;
    this.extraMoveRowContainer.setVisible(true);
    this.selectedMoveIndex = -1;
    this.setCursor(this.summaryUiMode === SummaryUiMode.LEARN_MOVE ? 4 : 0);
    this.showMoveEffect();
  }

  hideMoveSelect() {
    if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE) {
      this.moveSelectFunction?.(4);
      return;
    }

    this.moveSelect = false;
    this.extraMoveRowContainer.setVisible(false);
    this.moveDescriptionText.setText("");

    this.destroyBlinkCursor();
    this.hideMoveEffect();
  }

  destroyBlinkCursor() {
    if (this.moveCursorBlinkTimer) {
      this.moveCursorBlinkTimer.destroy();
      this.moveCursorBlinkTimer = null;
    }
    if (this.moveCursorObj) {
      this.moveCursorObj.destroy();
      this.moveCursorObj = null;
    }
    if (this.selectedMoveCursorObj) {
      this.selectedMoveCursorObj.destroy();
      this.selectedMoveCursorObj = null;
    }
  }

  showMoveEffect(instant?: boolean) {
    if (this.moveEffectsVisible) {
      return;
    }
    this.moveEffectsVisible = true;
    globalScene.tweens.add({
      targets: this.moveEffectContainer,
      x: 6,
      duration: instant ? 0 : 250,
      ease: "Sine.easeOut",
    });
  }

  hideMoveEffect(instant?: boolean) {
    if (!this.moveEffectsVisible) {
      return;
    }
    this.moveEffectsVisible = false;
    globalScene.tweens.add({
      targets: this.moveEffectContainer,
      x: 106,
      duration: instant ? 0 : 250,
      ease: "Sine.easeIn",
    });
  }

  clear() {
    super.clear();
    this.pokemon = null;
    this.cursor = -1;
    this.newMove = null;
    if (this.moveSelect) {
      this.moveSelect = false;
      this.moveSelectFunction = null;
      this.extraMoveRowContainer.setVisible(false);
      if (this.moveCursorBlinkTimer) {
        this.moveCursorBlinkTimer.destroy();
        this.moveCursorBlinkTimer = null;
      }
      if (this.moveCursorObj) {
        this.moveCursorObj.destroy();
        this.moveCursorObj = null;
      }
      if (this.selectedMoveCursorObj) {
        this.selectedMoveCursorObj.destroy();
        this.selectedMoveCursorObj = null;
      }
      this.hideMoveEffect(true);
    }
    this.summaryContainer.setVisible(false);
    this.summaryPageContainer.setVisible(false);
  }
}
