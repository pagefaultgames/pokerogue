import { globalScene } from "#app/global-scene";
import { settings } from "#app/global-settings-manager";
import { speciesDataRegistry } from "#app/global-species-data-registry";
import { speciesEggMoves } from "#balance/egg-moves";
import { allAbilities, allMoves } from "#data/data-lists";
import { GrowthRate, getGrowthRateColor } from "#data/exp";
import { Gender, getGenderColor, getGenderSymbol } from "#data/gender";
import { getNatureName } from "#data/nature";
import type { PokemonSpecies } from "#data/pokemon-species";
import { Challenges } from "#enums/challenges";
import { Passive } from "#enums/passive";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TextStyle } from "#enums/text-style";
import { getVariantIcon, getVariantTint, type Variant } from "#sprites/variant";
import { achvs } from "#system/achv";
import type { StarterMoveset, StarterPreferences } from "#types/save-data";
import type { DefinedSpeciesDetails } from "#types/starter-select-types";
import type { StarterSpeciesId } from "#types/starter-species-id";
import {
  getDexAttrFromPreferences,
  getFriendship,
  getStarterData,
  getStarterSelectTextSettings,
} from "#ui/starter-select-ui-utils";
import { StatsContainer } from "#ui/stats-container";
import { addBBCodeTextObject, addTextObject, getTextColor, updateCandyCountTextStyle } from "#ui/text";
import { argbFromRgba, rgbHexToRgba } from "#utils/color-utils";
import { getLocalizedSpriteKey, padInt, truncateString } from "#utils/common";
import { getPokemonSpeciesForm, getStarterColors } from "#utils/pokemon-utils";
import { toCamelCase, toTitleCase } from "#utils/strings";
import i18next from "i18next";
import type { GameObjects } from "phaser";
import type BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";

export class StarterSummary extends Phaser.GameObjects.Container {
  private readonly pokemonSprite: Phaser.GameObjects.Sprite;
  private readonly pokemonNumberText: Phaser.GameObjects.Text;
  private readonly shinyOverlay: Phaser.GameObjects.Image;
  private readonly pokemonNameText: Phaser.GameObjects.Text;
  private pokemonGrowthRateLabelText: Phaser.GameObjects.Text;
  private pokemonGrowthRateText: Phaser.GameObjects.Text;
  private type1Icon: Phaser.GameObjects.Sprite;
  private type2Icon: Phaser.GameObjects.Sprite;
  private pokemonLuckLabelText: Phaser.GameObjects.Text;
  private pokemonLuckText: Phaser.GameObjects.Text;
  private pokemonGenderText: Phaser.GameObjects.Text;
  private readonly pokemonUncaughtText: Phaser.GameObjects.Text;
  private pokemonAbilityLabelText: Phaser.GameObjects.Text;
  private pokemonAbilityText: Phaser.GameObjects.Text;
  private pokemonPassiveLabelText: Phaser.GameObjects.Text;
  private pokemonPassiveText: Phaser.GameObjects.Text;
  private pokemonNatureLabelText: Phaser.GameObjects.Text;
  private pokemonNatureText: BBCodeText;
  private pokemonMovesContainer: Phaser.GameObjects.Container;
  private readonly pokemonMoveContainers: Phaser.GameObjects.Container[];
  private readonly pokemonMoveBgs: Phaser.GameObjects.NineSlice[];
  private readonly pokemonMoveLabels: Phaser.GameObjects.Text[];
  private readonly pokemonAdditionalMoveCountLabel: Phaser.GameObjects.Text;
  private readonly eggMovesLabel: Phaser.GameObjects.Text;
  private readonly pokemonEggMovesContainer: Phaser.GameObjects.Container;
  private readonly pokemonEggMoveContainers: Phaser.GameObjects.Container[];
  private readonly pokemonEggMoveBgs: Phaser.GameObjects.NineSlice[];
  private readonly pokemonEggMoveLabels: Phaser.GameObjects.Text[];
  private pokemonCandyContainer: Phaser.GameObjects.Container;
  private pokemonCandyIcon: Phaser.GameObjects.Sprite;
  private pokemonCandyDarknessOverlay: Phaser.GameObjects.Sprite;
  private pokemonCandyOverlayIcon: Phaser.GameObjects.Sprite;
  private pokemonCandyCountText: Phaser.GameObjects.Text;
  private pokemonCaughtHatchedContainer: Phaser.GameObjects.Container;
  private pokemonCaughtCountText: Phaser.GameObjects.Text;
  private pokemonFormText: Phaser.GameObjects.Text;
  private pokemonHatchedIcon: Phaser.GameObjects.Sprite;
  private pokemonHatchedCountText: Phaser.GameObjects.Text;
  private pokemonShinyIcon: Phaser.GameObjects.Sprite;
  private pokemonPassiveDisabledIcon: Phaser.GameObjects.Sprite;
  private pokemonPassiveLockedIcon: Phaser.GameObjects.Sprite;
  private teraIcon: Phaser.GameObjects.Sprite;

  /** Whether the tera type icon should be displayed */
  private allowTera: boolean;

  /** Container for ivs, whether they should be shown */
  private readonly statsContainer: StatsContainer;
  private statsMode = false;

  /** Which of the tooltips is displayed (on mouse hover) */
  private activeTooltip: "ABILITY" | "PASSIVE" | "CANDY" | undefined;

  /** Container for type, growth rate, luck */
  private readonly pokemonPermanentInfoContainer: GameObjects.Container;
  /** Container for numbers of caught pokémon, eggs */
  private readonly pokemonStatisticsContainer: GameObjects.Container;
  /** Container for everything that's a preference (abilities, nature, form...) */
  private readonly pokemonPreferencesContainer: GameObjects.Container;

  private speciesId: StarterSpeciesId;

  constructor(x: number, y: number) {
    super(globalScene, x, y);

    this.pokemonSprite = globalScene.add //
      .sprite(53, 63, "pkmn__sub")
      .setPipeline(globalScene.spritePipeline, { tone: [0.0, 0.0, 0.0, 0.0], ignoreTimeTint: true });

    this.shinyOverlay = globalScene.add
      .image(6, 111, getLocalizedSpriteKey("summary_dexnb_label_overlay_shiny"))
      .setOrigin(0, 1)
      .setVisible(false); // Pixel text 'No' shiny

    this.pokemonNumberText = addTextObject(41, 1, "0000", TextStyle.SUMMARY_DEX_NUM) //
      .setOrigin(1, 0);

    this.pokemonNameText = addTextObject(6, 112, "", TextStyle.SUMMARY) //
      .setOrigin(0);

    this.pokemonUncaughtText = addTextObject(
      6,
      127,
      i18next.t("starterSelectUiHandler:uncaught"),
      TextStyle.SUMMARY_ALT,
      { fontSize: "56px" },
    ) //
      .setOrigin(0);

    this.pokemonMoveContainers = [];
    this.pokemonMoveBgs = [];
    this.pokemonMoveLabels = [];

    this.pokemonEggMoveContainers = [];
    this.pokemonEggMoveBgs = [];
    this.pokemonEggMoveLabels = [];

    this.pokemonPreferencesContainer = this.setupPokemonPreferencesContainer();
    this.pokemonPermanentInfoContainer = this.setupPokemonPermanentInfoContainer();
    this.pokemonStatisticsContainer = this.setupPokemonStatisticsContainer();

    for (let m = 0; m < 4; m++) {
      const moveContainer = globalScene.add.container(0, 14 * m);

      const moveBg = globalScene.add //
        .nineslice(0, 0, "type_bgs", "unknown", 92, 14, 2, 2, 2, 2)
        .setOrigin(1, 0);

      const moveLabel = addTextObject(-moveBg.width / 2, 0, "-", TextStyle.MOVE_LABEL) //
        .setOrigin(0.5, 0);

      this.pokemonMoveBgs.push(moveBg);
      this.pokemonMoveLabels.push(moveLabel);

      moveContainer.add([moveBg, moveLabel]);

      this.pokemonMoveContainers.push(moveContainer);
      this.pokemonMovesContainer.add(moveContainer);
    }

    this.pokemonAdditionalMoveCountLabel = addTextObject(
      -this.pokemonMoveBgs[0].width / 2,
      56,
      "(+0)",
      TextStyle.MOVE_LABEL,
    )
      .setOrigin(0.5, 0)
      .setColor(getTextColor(TextStyle.WINDOW_ALT))
      .setShadowColor(getTextColor(TextStyle.WINDOW_ALT, true));

    this.pokemonMovesContainer.add(this.pokemonAdditionalMoveCountLabel);

    this.pokemonEggMovesContainer = globalScene.add //
      .container(102, 85)
      .setScale(0.375);

    this.eggMovesLabel = addTextObject(-46, 0, i18next.t("starterSelectUiHandler:eggMoves"), TextStyle.WINDOW_ALT) //
      .setOrigin(0.5, 0);

    this.pokemonEggMovesContainer.add(this.eggMovesLabel);

    for (let m = 0; m < 4; m++) {
      const eggMoveContainer = globalScene.add.container(0, 16 + 14 * m);

      const eggMoveBg = globalScene.add //
        .nineslice(0, 0, "type_bgs", "unknown", 92, 14, 2, 2, 2, 2)
        .setOrigin(1, 0);

      const eggMoveLabel = addTextObject(-eggMoveBg.width / 2, 0, "???", TextStyle.MOVE_LABEL) //
        .setOrigin(0.5, 0);

      this.pokemonEggMoveBgs.push(eggMoveBg);
      this.pokemonEggMoveLabels.push(eggMoveLabel);

      eggMoveContainer.add([eggMoveBg, eggMoveLabel]);

      this.pokemonEggMoveContainers.push(eggMoveContainer);

      this.pokemonEggMovesContainer.add(eggMoveContainer);
    }

    this.statsContainer = new StatsContainer(6, 16) //
      .setVisible(false);

    globalScene.add.existing(this.statsContainer);

    this.add([
      this.pokemonSprite,
      this.shinyOverlay,
      this.pokemonNumberText,
      this.pokemonNameText,
      this.pokemonUncaughtText,
      this.pokemonPreferencesContainer,
      this.pokemonPermanentInfoContainer,
      this.pokemonStatisticsContainer,
      this.pokemonMovesContainer,
      this.pokemonEggMovesContainer,
      this.statsContainer,
    ]);
  }

  private setupPokemonPreferencesContainer(): GameObjects.Container {
    const pokemonPreferencesContainer = globalScene.add.container(0, 0);

    const textSettings = getStarterSelectTextSettings();

    // The position should be set per language
    const starterInfoXPos = textSettings?.starterInfoXPos ?? 31;
    const starterInfoYOffset = textSettings?.starterInfoYOffset ?? 0;

    // The font size should be set per language
    const starterInfoTextSize = textSettings?.starterInfoTextSize ?? 56;

    this.pokemonGenderText = addTextObject(96, 112, "", TextStyle.SUMMARY_ALT) //
      .setOrigin(0);

    this.pokemonFormText = addTextObject(6, 42, "Form", TextStyle.WINDOW_ALT, { fontSize: "42px" }) //
      .setOrigin(0);

    this.pokemonAbilityLabelText = addTextObject(
      6,
      127 + starterInfoYOffset,
      i18next.t("starterSelectUiHandler:ability"),
      TextStyle.SUMMARY_ALT,
      { fontSize: starterInfoTextSize },
    ) //
      .setOrigin(0);

    this.pokemonAbilityText = addTextObject(starterInfoXPos, 127 + starterInfoYOffset, "", TextStyle.SUMMARY_ALT, {
      fontSize: starterInfoTextSize,
    })
      .setOrigin(0)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, 250, 55), Phaser.Geom.Rectangle.Contains);

    this.pokemonPassiveLabelText = addTextObject(
      6,
      136 + starterInfoYOffset,
      i18next.t("starterSelectUiHandler:passive"),
      TextStyle.SUMMARY_ALT,
      { fontSize: starterInfoTextSize },
    ) //
      .setOrigin(0);

    this.pokemonPassiveText = addTextObject(starterInfoXPos, 136 + starterInfoYOffset, "", TextStyle.SUMMARY_ALT, {
      fontSize: starterInfoTextSize,
    })
      .setOrigin(0)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, 250, 55), Phaser.Geom.Rectangle.Contains);

    this.pokemonPassiveDisabledIcon = globalScene.add
      .sprite(starterInfoXPos, 137 + starterInfoYOffset, "icon_stop")
      .setOrigin(0, 0.5)
      .setScale(0.35)
      .setVisible(false);

    this.pokemonPassiveLockedIcon = globalScene.add
      .sprite(starterInfoXPos, 137 + starterInfoYOffset, "icon_lock")
      .setOrigin(0, 0.5)
      .setScale(0.42, 0.38)
      .setVisible(false);

    this.pokemonNatureLabelText = addTextObject(
      6,
      145 + starterInfoYOffset,
      i18next.t("starterSelectUiHandler:nature"),
      TextStyle.SUMMARY_ALT,
      { fontSize: starterInfoTextSize },
    ) //
      .setOrigin(0);

    this.pokemonNatureText = addBBCodeTextObject(starterInfoXPos, 145 + starterInfoYOffset, "", TextStyle.SUMMARY_ALT, {
      fontSize: starterInfoTextSize,
    }) //
      .setOrigin(0);

    this.pokemonShinyIcon = globalScene.add //
      .sprite(12, 0, "shiny_icons")
      .setScale(0.5);

    this.teraIcon = globalScene.add //
      .sprite(85, 63, "button_tera")
      .setName("terastallize-icon")
      .setFrame("fire");

    pokemonPreferencesContainer.add([
      this.pokemonGenderText,
      this.pokemonFormText,
      this.pokemonAbilityLabelText,
      this.pokemonAbilityText,
      this.pokemonPassiveLabelText,
      this.pokemonPassiveText,
      this.pokemonPassiveDisabledIcon,
      this.pokemonPassiveLockedIcon,
      this.pokemonNatureLabelText,
      this.pokemonNatureText,
      this.pokemonShinyIcon,
      this.teraIcon,
    ]);

    return pokemonPreferencesContainer;
  }

  private setupPokemonPermanentInfoContainer(): GameObjects.Container {
    const pokemonPermanentInfoContainer = globalScene.add.container(0, 0);

    this.type1Icon = globalScene.add //
      .sprite(8, 98, getLocalizedSpriteKey("types"))
      .setScale(0.5)
      .setOrigin(0);
    this.type2Icon = globalScene.add //
      .sprite(26, 98, getLocalizedSpriteKey("types"))
      .setScale(0.5)
      .setOrigin(0);

    this.pokemonGrowthRateLabelText = addTextObject(
      8,
      106,
      i18next.t("starterSelectUiHandler:growthRate"),
      TextStyle.WINDOW_ALT,
      { fontSize: "36px" },
    ) //
      .setOrigin(0);

    this.pokemonGrowthRateText = addTextObject(34, 106, "", TextStyle.GROWTH_RATE_TYPE, { fontSize: "36px" }) //
      .setOrigin(0);

    this.pokemonLuckLabelText = addTextObject(8, 89, i18next.t("common:luckIndicator"), TextStyle.WINDOW_ALT, {
      fontSize: "56px",
    }) //
      .setOrigin(0);

    this.pokemonLuckText = addTextObject(
      8 + this.pokemonLuckLabelText.displayWidth + 2,
      89,
      "0",
      TextStyle.LUCK_VALUE,
      { fontSize: "56px" },
    ) //
      .setOrigin(0);

    pokemonPermanentInfoContainer.add([
      this.type1Icon,
      this.type2Icon,
      this.pokemonGrowthRateLabelText,
      this.pokemonGrowthRateText,
      this.pokemonLuckLabelText,
      this.pokemonLuckText,
    ]);

    return pokemonPermanentInfoContainer;
  }

  private setupPokemonStatisticsContainer(): GameObjects.Container {
    const pokemonStatisticsContainer = globalScene.add.container(0, 0);

    // Candy icon and count
    this.pokemonCandyContainer = globalScene.add
      .container(settings.isLegacyTheme ? 7 : 4.5, 18)
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, 30, 20), Phaser.Geom.Rectangle.Contains);
    this.pokemonCandyIcon = globalScene.add //
      .sprite(0, 0, "candy")
      .setScale(0.5)
      .setOrigin(0);
    this.pokemonCandyOverlayIcon = globalScene.add //
      .sprite(0, 0, "candy_overlay")
      .setScale(0.5)
      .setOrigin(0);
    this.pokemonCandyDarknessOverlay = globalScene.add
      .sprite(0, 0, "candy")
      .setScale(0.5)
      .setOrigin(0)
      .setTint(0x000000)
      .setAlpha(0.5);

    this.pokemonCandyCountText = addTextObject(9.5, 0, "x0", TextStyle.WINDOW_ALT, { fontSize: "56px" }) //
      .setOrigin(0);
    this.pokemonCandyContainer.add([
      this.pokemonCandyIcon,
      this.pokemonCandyOverlayIcon,
      this.pokemonCandyDarknessOverlay,
      this.pokemonCandyCountText,
    ]);

    this.pokemonCaughtHatchedContainer = globalScene.add //
      .container(settings.isLegacyTheme ? 4.5 : 2, 25)
      .setScale(0.5);

    const pokemonCaughtIcon = globalScene.add //
      .sprite(1, 0, "items", "pb")
      .setOrigin(0)
      .setScale(0.75);

    this.pokemonCaughtCountText = addTextObject(24, 4, "0", TextStyle.WINDOW_ALT) //
      .setOrigin(0);
    this.pokemonHatchedIcon = globalScene.add //
      .sprite(1, 14, "egg_icons")
      .setOrigin(0.15, 0.2)
      .setScale(0.8);
    this.pokemonHatchedCountText = addTextObject(24, 19, "0", TextStyle.WINDOW_ALT) //
      .setOrigin(0);
    this.pokemonMovesContainer = globalScene.add //
      .container(102, 16)
      .setScale(0.375);
    this.pokemonCaughtHatchedContainer.add([
      pokemonCaughtIcon,
      this.pokemonCaughtCountText,
      this.pokemonHatchedIcon,
      this.pokemonHatchedCountText,
    ]);

    pokemonStatisticsContainer.add([this.pokemonCandyContainer, this.pokemonCaughtHatchedContainer]);

    return pokemonStatisticsContainer;
  }

  public applyChallengeVisibility(): void {
    const notFreshStart = !globalScene.gameMode.hasChallenge(Challenges.FRESH_START);

    for (const container of this.pokemonEggMoveContainers) {
      container.setVisible(notFreshStart);
    }
    this.eggMovesLabel.setVisible(notFreshStart);
    // This is not enough, we need individual checks in setStarterSpecies too! :)
    this.pokemonPassiveDisabledIcon.setVisible(notFreshStart);
    this.pokemonPassiveLabelText.setVisible(notFreshStart);
    this.pokemonPassiveLockedIcon.setVisible(notFreshStart);
    this.pokemonPassiveText.setVisible(notFreshStart);
  }

  public updateName(name: string): void {
    this.pokemonNameText.setText(name);
    this.truncateName();
  }

  public updateCandyCount(count: number): void {
    this.pokemonCandyCountText.setText(`×${count}`);
    updateCandyCountTextStyle(this.pokemonCandyCountText, count);
  }

  private setNameAndNumber(species: PokemonSpecies, starterPreferences: StarterPreferences): void {
    this.pokemonNumberText.setText(padInt(species.speciesId, 4));

    if (starterPreferences?.nickname) {
      const name = decodeURIComponent(escape(atob(starterPreferences.nickname)));
      this.pokemonNameText.setText(name);
    } else {
      this.pokemonNameText.setText(species.name);
    }
  }

  protected setTypeIcons(type1: PokemonType, type2: PokemonType | null): void {
    this.type1Icon //
      .setVisible(true)
      .setFrame(PokemonType[type1].toLowerCase());

    if (type2 === null) {
      this.type2Icon.setVisible(false);
    } else {
      this.type2Icon //
        .setVisible(true)
        .setFrame(PokemonType[type2].toLowerCase());
    }
  }

  private setShinyIcon(shiny = true, variant: Variant = 0): void {
    this.pokemonShinyIcon //
      .setFrame(getVariantIcon(variant))
      .setTint(getVariantTint(variant))
      .setVisible(shiny);
  }

  public setNoStarter(): void {
    if (globalScene.ui.getTooltip().visible) {
      globalScene.ui.hideTooltip();
    }

    this.pokemonAbilityText.off("pointerover");
    this.pokemonPassiveText.off("pointerover");

    if (this.statsMode) {
      this.statsContainer.setVisible(false);
    }

    this.cleanStarterSprite();
  }

  public setStarter(starterId: StarterSpeciesId, starterPreferences: StarterPreferences): void {
    // Checking here to ensure achievements are loaded, and updated if unlocked while playing
    this.allowTera = Object.hasOwn(globalScene.gameData.achvUnlocks, achvs.TERASTALLIZE.id);

    this.speciesId = starterId;
    const species = speciesDataRegistry.getSpecies(starterId);

    const { dexEntry } = getStarterData(starterId);

    this.pokemonAbilityText.off("pointerover");
    this.pokemonPassiveText.off("pointerover");

    if (this.statsMode) {
      if (dexEntry?.caughtAttr) {
        this.statsContainer.setVisible(true);
        this.showStats();
      } else {
        this.statsContainer.setVisible(false);
      }
    }

    if (dexEntry.caughtAttr) {
      this.setNameAndNumber(species, starterPreferences);

      const colorScheme = getStarterColors(species.speciesId);

      this.pokemonUncaughtText.setVisible(false);
      this.pokemonPermanentInfoContainer.setVisible(true);
      this.pokemonStatisticsContainer.setVisible(true);

      const luck = globalScene.gameData.getDexAttrLuck(dexEntry.caughtAttr);
      this.pokemonLuckText
        .setVisible(!!luck)
        .setText(luck.toString())
        .setTint(getVariantTint(Phaser.Math.Clamp(luck - 1, 0, 2) as Variant));
      this.pokemonLuckLabelText.setVisible(this.pokemonLuckText.visible);

      let growthReadable = toTitleCase(GrowthRate[species.growthRate]);
      const growthAux = toCamelCase(growthReadable);
      if (i18next.exists("growth:" + growthAux)) {
        growthReadable = i18next.t(("growth:" + growthAux) as any);
      }
      this.pokemonGrowthRateText
        .setText(growthReadable)
        .setColor(getGrowthRateColor(species.growthRate))
        .setShadowColor(getGrowthRateColor(species.growthRate, true));

      this.pokemonCaughtCountText.setText(`${dexEntry.caughtCount}`);
      if (species.speciesId === SpeciesId.MANAPHY || species.speciesId === SpeciesId.PHIONE) {
        this.pokemonHatchedIcon.setFrame("manaphy");
      } else {
        this.pokemonHatchedIcon.setFrame(speciesDataRegistry.getEggTier(species.speciesId));
      }
      this.pokemonHatchedCountText.setText(`${dexEntry.hatchedCount}`);

      const defaultDexAttr = getDexAttrFromPreferences(starterId, starterPreferences);

      if (speciesDataRegistry.hasPrevolution(species.speciesId)) {
        this.pokemonCaughtHatchedContainer.setVisible(false);
        this.pokemonShinyIcon.setY(104);
        this.pokemonFormText.setY(25);
      } else {
        this.pokemonCaughtHatchedContainer.setVisible(true);
        this.pokemonShinyIcon.setY(86);
        this.pokemonCandyIcon.setTint(argbFromRgba(rgbHexToRgba(colorScheme[0])));
        this.pokemonCandyOverlayIcon.setTint(argbFromRgba(rgbHexToRgba(colorScheme[1])));
        this.updateCandyCount(globalScene.gameData.starterData[species.speciesId].candyCount);
        this.pokemonFormText.setY(42);
        this.pokemonHatchedIcon.setVisible(true);
        this.pokemonHatchedCountText.setVisible(true);

        const { currentFriendship, friendshipCap } = getFriendship(species.speciesId as StarterSpeciesId);
        const candyCropY = 16 - 16 * (currentFriendship / friendshipCap);
        this.pokemonCandyDarknessOverlay.setCrop(0, 0, 16, candyCropY);

        this.pokemonCandyContainer
          .setVisible(true)
          .on("pointerover", () => {
            globalScene.ui.showTooltip("", `${currentFriendship}/${friendshipCap}`, true);
            this.activeTooltip = "CANDY";
          })
          .on("pointerout", () => {
            globalScene.ui.hideTooltip();
            this.activeTooltip = undefined;
          });
      }

      const props = globalScene.gameData.getDexAttrProps(defaultDexAttr);
      props.formIndex = starterPreferences?.formIndex ?? props.formIndex;
      const speciesForm = getPokemonSpeciesForm(species.speciesId, props.formIndex);
      this.setTypeIcons(speciesForm.type1, speciesForm.type2);

      this.pokemonSprite.clearTint();
      return;
    }

    this.cleanStarterSprite(species, !!dexEntry.seenAttr);

    const { female, formIndex, shiny, variant } = globalScene.gameData.getSpeciesDefaultDexAttrProps(starterId);

    this.updateSprite(species, female, formIndex, shiny, variant);
    this.pokemonSprite //
      .setVisible(true)
      .setTint(dexEntry.seenAttr ? 0x808080 : 0x000000);
  }

  private cleanStarterSprite(species?: PokemonSpecies, isSeen = false): void {
    if (isSeen && species) {
      this.setNameAndNumber(species, {});
    } else {
      this.pokemonNumberText.setText(padInt(0, 4));
      this.pokemonNameText.setText(species ? "???" : "");
    }

    this.pokemonSprite.setVisible(!!species);
    this.pokemonUncaughtText.setVisible(!!species);

    this.pokemonPermanentInfoContainer.setVisible(false);
    this.pokemonStatisticsContainer.setVisible(false);
    this.resetSpeciesDetails();
  }

  private resetSpeciesDetails(): void {
    globalScene.ui.hideTooltip();

    this.pokemonPreferencesContainer.setVisible(false);

    this.shinyOverlay.setVisible(false);
    this.pokemonNumberText
      .setColor(getTextColor(TextStyle.SUMMARY))
      .setShadowColor(getTextColor(TextStyle.SUMMARY, true));

    for (let m = 0; m < 4; m++) {
      this.pokemonMoveContainers[m].setVisible(false);
    }
    this.pokemonEggMovesContainer.setVisible(false);
    this.pokemonAdditionalMoveCountLabel.setVisible(false);
  }

  public setStarterDetails(starterId: StarterSpeciesId, options: DefinedSpeciesDetails): void {
    const { shiny, formIndex, female, variant, abilityIndex, natureIndex, teraType } = options;

    const species = speciesDataRegistry.getSpecies(starterId);

    // We will only update the sprite if there is a change to form, shiny/variant
    // or gender for species with gender sprite differences
    const shouldUpdateSprite =
      (species.genderDiffs && female != null) || formIndex != null || shiny != null || variant != null;

    this.updateCandyTooltip();

    this.pokemonSprite.setVisible(false);
    this.teraIcon.setVisible(false);

    this.pokemonPreferencesContainer.setVisible(true);

    this.shinyOverlay.setVisible(shiny);
    this.pokemonNumberText.setColor(
      getTextColor(shiny ? TextStyle.SUMMARY_DEX_NUM_GOLD : TextStyle.SUMMARY_DEX_NUM, false),
    );
    this.pokemonNumberText.setShadowColor(
      getTextColor(shiny ? TextStyle.SUMMARY_DEX_NUM_GOLD : TextStyle.SUMMARY_DEX_NUM, true),
    );

    this.setShinyIcon(shiny, variant);

    if (shouldUpdateSprite) {
      this.updateSprite(species, female, formIndex, shiny, variant);
    } else {
      this.pokemonSprite.setVisible(!this.statsMode);
    }

    if (species.malePercent === null) {
      this.pokemonGenderText.setText("");
    } else {
      const gender = female ? Gender.FEMALE : Gender.MALE;
      this.pokemonGenderText
        .setText(getGenderSymbol(gender))
        .setColor(getGenderColor(gender))
        .setShadowColor(getGenderColor(gender, true));
    }

    const speciesOrForm = species.forms.length > 1 ? species.forms[formIndex] : species;
    const ability = allAbilities[speciesOrForm.getAbility(abilityIndex)];

    const isHidden = abilityIndex === (species.ability2 ? 2 : 1);
    const textStyle = isHidden ? TextStyle.SUMMARY_GOLD : TextStyle.SUMMARY_ALT;
    this.pokemonAbilityText
      .setText(ability.name)
      .setColor(getTextColor(textStyle))
      .setShadowColor(getTextColor(textStyle, true));

    if (this.pokemonAbilityText.visible) {
      if (this.activeTooltip === "ABILITY") {
        globalScene.ui.editTooltip(`${ability.name}`, `${ability.description}`);
      }

      this.pokemonAbilityText.on("pointerover", () => {
        globalScene.ui.showTooltip(`${ability.name}`, `${ability.description}`, true);
        this.activeTooltip = "ABILITY";
      });
      this.pokemonAbilityText.on("pointerout", () => {
        globalScene.ui.hideTooltip();
        this.activeTooltip = undefined;
      });
    }

    this.updatePassiveDisplay(starterId, formIndex);

    this.pokemonNatureText.setText(getNatureName(natureIndex, true, true, false));

    const speciesForm = getPokemonSpeciesForm(starterId, formIndex);
    const formText = species.getFormNameToDisplay(formIndex);
    this.pokemonFormText.setText(formText);

    this.setTypeIcons(speciesForm.type1, speciesForm.type2);

    const newTeraType = teraType;
    this.teraIcon.setFrame(PokemonType[newTeraType].toLowerCase());
    this.teraIcon.setVisible(!this.statsMode && this.allowTera);
  }

  protected showStats(): void {
    const { dexEntry } = getStarterData(this.speciesId);
    this.statsContainer //
      .setVisible(true)
      .updateIvs(dexEntry.ivs);
  }

  private updatePassiveDisplay(starterId: StarterSpeciesId, formIndex = 0): void {
    this.pokemonPassiveLabelText.setVisible(false);
    this.pokemonPassiveText.setVisible(false);
    this.pokemonPassiveDisabledIcon.setVisible(false);
    this.pokemonPassiveLockedIcon.setVisible(false);

    const isFreshStartChallenge = globalScene.gameMode.hasChallenge(Challenges.FRESH_START);

    const { starterDataEntry } = getStarterData(starterId);

    const passiveAttr = starterDataEntry.passiveAttr;
    const passiveAbility = allAbilities[speciesDataRegistry.getSpecies(starterId).getPassiveAbility(formIndex)];

    if (!passiveAbility) {
      if (this.activeTooltip === "PASSIVE") {
        globalScene.ui.hideTooltip();
      }
      return;
    }

    const isUnlocked = !!(passiveAttr & Passive.UNLOCKED);
    const isEnabled = !!(passiveAttr & Passive.ENABLED);

    const textStyle = isUnlocked && isEnabled ? TextStyle.SUMMARY_ALT : TextStyle.SUMMARY_GRAY;
    const textAlpha = isUnlocked && isEnabled ? 1 : 0.5;

    this.pokemonPassiveLabelText
      .setVisible(!isFreshStartChallenge)
      .setColor(getTextColor(TextStyle.SUMMARY_ALT))
      .setShadowColor(getTextColor(TextStyle.SUMMARY_ALT, true));
    this.pokemonPassiveText
      .setVisible(!isFreshStartChallenge)
      .setText(passiveAbility.name)
      .setColor(getTextColor(textStyle))
      .setAlpha(textAlpha)
      .setShadowColor(getTextColor(textStyle, true));

    if (this.activeTooltip === "PASSIVE") {
      globalScene.ui.editTooltip(`${passiveAbility.name}`, `${passiveAbility.description}`);
    }

    if (this.pokemonPassiveText.visible) {
      this.pokemonPassiveText.on("pointerover", () => {
        globalScene.ui.showTooltip(`${passiveAbility.name}`, `${passiveAbility.description}`, true);
        this.activeTooltip = "PASSIVE";
      });
      this.pokemonPassiveText.on("pointerout", () => {
        globalScene.ui.hideTooltip();
        this.activeTooltip = undefined;
      });
    }

    const iconPosition = {
      x: this.pokemonPassiveText.x + this.pokemonPassiveText.displayWidth + 1,
      y: this.pokemonPassiveText.y + this.pokemonPassiveText.displayHeight / 2,
    };
    this.pokemonPassiveDisabledIcon
      .setVisible(isUnlocked && !isEnabled && !isFreshStartChallenge)
      .setPosition(iconPosition.x, iconPosition.y);
    this.pokemonPassiveLockedIcon
      .setVisible(!isUnlocked && !isFreshStartChallenge)
      .setPosition(iconPosition.x, iconPosition.y);
  }

  private updateSprite(
    species: PokemonSpecies,
    female: boolean,
    formIndex: number,
    shiny: boolean,
    variant: Variant,
  ): void {
    species.loadAssets(female, formIndex, shiny, variant, true).then(() => {
      this.pokemonSprite
        .play(species.getSpriteKey(female, formIndex, shiny, variant))
        .setPipelineData("shiny", shiny)
        .setPipelineData("variant", variant)
        .setPipelineData("spriteKey", species.getSpriteKey(female, formIndex, shiny, variant))
        .setVisible(!this.statsMode);
    });
  }

  private updateCandyTooltip(): void {
    if (this.activeTooltip !== "CANDY") {
      return;
    }

    if (this.speciesId && this.pokemonCandyContainer.visible) {
      const { currentFriendship, friendshipCap } = getFriendship(this.speciesId);
      globalScene.ui.editTooltip("", `${currentFriendship}/${friendshipCap}`);
    } else {
      globalScene.ui.hideTooltip();
    }
  }

  public updateMoveset(starterMoveset: StarterMoveset, totalMoves: number): void {
    for (let m = 0; m < 4; m++) {
      const move = m < starterMoveset.length ? allMoves[starterMoveset[m]] : null;
      this.pokemonMoveBgs[m].setFrame(PokemonType[move ? move.type : PokemonType.UNKNOWN].toString().toLowerCase());
      this.pokemonMoveLabels[m].setText(move ? move.name : "-");
      this.pokemonMoveContainers[m].setVisible(!!move);
    }

    this.pokemonAdditionalMoveCountLabel.setText(`(+${Math.max(totalMoves - 4, 0)})`).setVisible(totalMoves > 4);
  }

  public updateEggMoves(eggMoves: number): void {
    for (let em = 0; em < 4; em++) {
      const eggMove = allMoves[speciesEggMoves[this.speciesId][em]];
      const eggMoveUnlocked = eggMove && eggMoves & (1 << em);
      this.pokemonEggMoveBgs[em].setFrame(
        PokemonType[eggMove ? eggMove.type : PokemonType.UNKNOWN].toString().toLowerCase(),
      );
      this.pokemonEggMoveLabels[em].setText(eggMove && eggMoveUnlocked ? eggMove.name : "???");
    }

    this.pokemonEggMovesContainer.setVisible(true);
  }

  public hideEggMoves(): void {
    this.pokemonEggMovesContainer.setVisible(false);
  }

  public showIvs(): void {
    this.showStats();
    this.statsMode = true;
    this.pokemonSprite.setVisible(false);
    this.teraIcon.setVisible(false);
  }

  public hideIvs(caught = true): void {
    this.statsMode = false;
    this.statsContainer.setVisible(false);
    this.pokemonSprite.setVisible(caught);
    this.teraIcon.setVisible(this.allowTera);
  }

  /** Truncate the Pokémon name so it won't overlap into the starters. */
  private truncateName(): void {
    const name = this.pokemonNameText.text;
    this.pokemonNameText.setText(truncateString(name, 15));
  }

  public clear(): void {
    globalScene.ui.hideTooltip();
    this.activeTooltip = undefined;
  }
}
