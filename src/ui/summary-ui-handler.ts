import BattleScene, { Button } from "../battle-scene";
import { Mode } from "./ui";
import UiHandler from "./uiHandler";
import * as Utils from "../utils";
import { PlayerPokemon } from "../pokemon";
import { Type } from "../data/type";
import { TextStyle, addTextObject, getTextColor } from "./text";
import Move, { MoveCategory } from "../data/move";
import { getPokeballAtlasKey } from "../data/pokeball";
import { getGenderColor, getGenderSymbol } from "../data/gender";
import { getLevelTotalExp } from "../data/exp";
import { Stat, getStatName } from "../data/pokemon-stat";
import { abilities } from "../data/ability";
import { PokemonHeldItemModifier } from "../modifier/modifier";
import { StatusEffect } from "../data/status-effect";

enum Page {
  PROFILE,
  STATS,
  MOVES
}

export enum SummaryUiMode {
  DEFAULT,
  LEARN_MOVE
}

export default class SummaryUiHandler extends UiHandler {
  private summaryUiMode: SummaryUiMode;

  private summaryContainer: Phaser.GameObjects.Container;
  private tabSprite: Phaser.GameObjects.Sprite;
  private shinyOverlay: Phaser.GameObjects.Image;
  private numberText: Phaser.GameObjects.Text;
  private pokemonSprite: Phaser.GameObjects.Sprite;
  private nameText: Phaser.GameObjects.Text;
  private pokeball: Phaser.GameObjects.Sprite;
  private levelText: Phaser.GameObjects.Text;
  private genderText: Phaser.GameObjects.Text;
  private statusContainer: Phaser.GameObjects.Container;
  private status: Phaser.GameObjects.Image;
  private summaryPageContainer: Phaser.GameObjects.Container;
  private movesContainer: Phaser.GameObjects.Container;
  private moveDescriptionText: Phaser.GameObjects.Text;
  private moveCursorObj: Phaser.GameObjects.Sprite;
  private selectedMoveCursorObj: Phaser.GameObjects.Sprite;
  private moveRowsContainer: Phaser.GameObjects.Container;
  private extraMoveRowContainer: Phaser.GameObjects.Container;
  private moveEffectContainer: Phaser.GameObjects.Container;
  private movePowerText: Phaser.GameObjects.Text;
  private moveAccuracyText: Phaser.GameObjects.Text;
  private moveCategoryIcon: Phaser.GameObjects.Sprite;
  private summaryPageTransitionContainer: Phaser.GameObjects.Container;

  private moveDescriptionScrollTween: Phaser.Tweens.Tween;
  private moveCursorBlinkTimer: Phaser.Time.TimerEvent;

  private pokemon: PlayerPokemon;
  private newMove: Move;
  private moveSelectFunction: Function;
  private transitioning: boolean;
  private statusVisible: boolean;
  private moveEffectsVisible: boolean;

  private moveSelect: boolean;
  private moveCursor: integer;
  private selectedMoveIndex: integer;

  constructor(scene: BattleScene) {
    super(scene, Mode.SUMMARY);
  }

  setup() {
    const ui = this.getUi();

    this.summaryContainer = this.scene.add.container(0, 0);
    this.summaryContainer.setVisible(false);
    ui.add(this.summaryContainer);

    const summaryBg = this.scene.add.image(0, 0, 'summary_bg');
    summaryBg.setOrigin(0, 1);
    this.summaryContainer.add(summaryBg);

    this.tabSprite = this.scene.add.sprite(134, (-summaryBg.displayHeight) + 16, 'summary_tabs_1');
    this.tabSprite.setOrigin(1, 1);
    this.summaryContainer.add(this.tabSprite);

    const summaryLabel = addTextObject(this.scene, 4, -165, 'Pokémon Info', TextStyle.SUMMARY);
    summaryLabel.setOrigin(0, 1);
    this.summaryContainer.add(summaryLabel);

    this.shinyOverlay = this.scene.add.image(6, -54, 'summary_overlay_shiny');
    this.shinyOverlay.setOrigin(0, 1);
    this.summaryContainer.add(this.shinyOverlay);

    this.numberText = addTextObject(this.scene, 17, -149, '000', TextStyle.SUMMARY);
    this.numberText.setOrigin(0, 1);
    this.summaryContainer.add(this.numberText);

    this.pokemonSprite = this.scene.add.sprite(56, -106, `pkmn__sub`);
    this.summaryContainer.add(this.pokemonSprite);

    this.nameText = addTextObject(this.scene, 6, -39, '', TextStyle.SUMMARY);
    this.nameText.setOrigin(0, 1);
    this.summaryContainer.add(this.nameText);

    this.pokeball = this.scene.add.sprite(6, -23, 'pb');
    this.pokeball.setOrigin(0, 1);
    this.summaryContainer.add(this.pokeball);

    this.levelText = addTextObject(this.scene, 36, -22, '', TextStyle.SUMMARY);
    this.levelText.setOrigin(0, 1);
    this.summaryContainer.add(this.levelText);

    this.genderText = addTextObject(this.scene, 96, -22, '', TextStyle.SUMMARY);
    this.genderText.setOrigin(0, 1);
    this.summaryContainer.add(this.genderText);

    this.statusContainer = this.scene.add.container(-106, -16);

    const statusBg = this.scene.add.image(0, 0, 'summary_status');
    statusBg.setOrigin(0, 0);

    this.statusContainer.add(statusBg);
    
    const statusLabel = addTextObject(this.scene, 3, 0, 'Status', TextStyle.SUMMARY);
    statusLabel.setOrigin(0, 0);

    this.statusContainer.add(statusLabel);

    this.status = this.scene.add.sprite(91, 4, 'statuses');
    this.status.setOrigin(0.5, 0);

    this.statusContainer.add(this.status);

    this.summaryContainer.add(this.statusContainer);

    this.moveEffectContainer = this.scene.add.container(106, -62);

    this.summaryContainer.add(this.moveEffectContainer);

    const moveEffectBg = this.scene.add.image(0, 0, 'summary_moves_effect');
    moveEffectBg.setOrigin(0, 0);
    this.moveEffectContainer.add(moveEffectBg);

    const moveEffectLabels = addTextObject(this.scene, 8, 12, 'Power\nAccuracy\nCategory', TextStyle.SUMMARY);
    moveEffectLabels.setLineSpacing(9);
    moveEffectLabels.setOrigin(0, 0);

    this.moveEffectContainer.add(moveEffectLabels);

    this.movePowerText = addTextObject(this.scene, 99, 27, '0', TextStyle.WINDOW);
    this.movePowerText.setOrigin(1, 1);
    this.moveEffectContainer.add(this.movePowerText);

    this.moveAccuracyText = addTextObject(this.scene, 99, 43, '0', TextStyle.WINDOW);
    this.moveAccuracyText.setOrigin(1, 1);
    this.moveEffectContainer.add(this.moveAccuracyText);

    this.moveCategoryIcon = this.scene.add.sprite(99, 57, 'categories');
    this.moveCategoryIcon.setOrigin(1, 1);
    this.moveEffectContainer.add(this.moveCategoryIcon);

    const getSummaryPageBg = () => {
      const ret = this.scene.add.sprite(0, 0, this.getPageKey(0));
      ret.setOrigin(0, 1);
      return ret;
    };

    this.summaryContainer.add((this.summaryPageContainer = this.scene.add.container(106, 0)));
    this.summaryPageContainer.add(getSummaryPageBg());
    this.summaryPageContainer.setVisible(false);
    this.summaryContainer.add((this.summaryPageTransitionContainer = this.scene.add.container(106, 0)));
    this.summaryPageTransitionContainer.add(getSummaryPageBg());
    this.summaryPageTransitionContainer.setVisible(false);
  }

  getPageKey(page?: integer) {
    if (page === undefined)
      page = this.cursor;
    return `summary_${Page[page].toLowerCase()}`;
  }

  show(args: any[]) {
    super.show(args);

    this.pokemon = args[0] as PlayerPokemon;
    this.summaryUiMode = args.length > 1 ? args[1] as SummaryUiMode : SummaryUiMode.DEFAULT;

    this.summaryContainer.setVisible(true);
    this.cursor = -1;

    this.shinyOverlay.setVisible(this.pokemon.shiny);

    this.numberText.setText(Utils.padInt(this.pokemon.species.speciesId, 3));
    this.numberText.setColor(getTextColor(!this.pokemon.shiny ? TextStyle.SUMMARY : TextStyle.SUMMARY_GOLD));
    this.numberText.setShadowColor(getTextColor(!this.pokemon.shiny ? TextStyle.SUMMARY : TextStyle.SUMMARY_GOLD, true));

    this.pokemonSprite.play(this.pokemon.getSpriteKey());
    this.pokemon.cry();

    this.nameText.setText(this.pokemon.name);
    this.pokeball.setFrame(getPokeballAtlasKey(this.pokemon.pokeball));
    this.levelText.setText(this.pokemon.level.toString());
    this.genderText.setText(getGenderSymbol(this.pokemon.gender));
    this.genderText.setColor(getGenderColor(this.pokemon.gender));
    this.genderText.setShadowColor(getGenderColor(this.pokemon.gender, true));

    switch (this.summaryUiMode) {
      case SummaryUiMode.DEFAULT:
        const page = args.length < 2 ? Page.PROFILE : args[2] as Page;
        this.hideMoveEffect(true);
        this.setCursor(page);
        break;
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
      this.status.setFrame(this.pokemon.status ? StatusEffect[this.pokemon.status.effect].toLowerCase() : 'pokerus');
    } else
      this.hideStatus(!fromSummary);
  }

  processInput(button: Button) {
    if (this.transitioning)
      return;

    const ui = this.getUi();

    let success = false;

    if (this.moveSelect) {
      if (button === Button.ACTION) {
        if (this.moveCursor < this.pokemon.moveset.length) {
          if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE)
            this.moveSelectFunction(this.moveCursor);
          else {
            if (this.selectedMoveIndex === -1) {
              this.selectedMoveIndex = this.moveCursor;
              this.setCursor(this.moveCursor);
            } else {
              if (this.selectedMoveIndex !== this.moveCursor) {
                const tempMove = this.pokemon.moveset[this.selectedMoveIndex];
                this.pokemon.moveset[this.selectedMoveIndex] = this.pokemon.moveset[this.moveCursor];
                this.pokemon.moveset[this.moveCursor] = tempMove;
                
                const selectedMoveRow = this.moveRowsContainer.getAt(this.selectedMoveIndex) as Phaser.GameObjects.Container;
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
          }
          success = true;
        } else if (this.moveCursor === 4)
          this.processInput(Button.CANCEL);
        else
          ui.playError();
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
        }
      }
    } else {
      if (button === Button.ACTION) {
        if (this.cursor === Page.MOVES) {
          this.showMoveSelect();
          success = true;
        }
      } else if (button === Button.CANCEL) {
        ui.setMode(Mode.PARTY);
        success = true;
      } else {
        const pages = Utils.getEnumValues(Page);
        switch (button) {
          case Button.UP:
          case Button.DOWN:
            const isDown = button === Button.DOWN;
            const party = this.scene.getParty();
            const partyMemberIndex = party.indexOf(this.pokemon);
            if ((isDown && partyMemberIndex < party.length - 1) || (!isDown && partyMemberIndex)) {
              const page = this.cursor;
              this.clear();
              this.show([ party[partyMemberIndex + (isDown ? 1 : -1)], this.summaryUiMode, page ]);
            }
            break;
          case Button.LEFT:
            if (this.cursor)
              success = this.setCursor(this.cursor - 1);
            break;
          case Button.RIGHT:
            if (this.cursor < pages.length - 1)
              success = this.setCursor(this.cursor + 1);
            break;
        }
      }
    }

    if (success)
      ui.playSelect();
  }

  setCursor(cursor: integer): boolean {
    let changed: boolean;
    
    if (this.moveSelect) {
      changed = this.moveCursor !== cursor;
      if (changed) {
        this.moveCursor = cursor;

        const selectedMove = this.getSelectedMove();

        if (selectedMove) {
          this.movePowerText.setText(selectedMove.power >= 0 ? selectedMove.power.toString() : '---');
          this.moveAccuracyText.setText(selectedMove.accuracy >= 0 ? selectedMove.accuracy.toString() : '---');
          this.moveCategoryIcon.setFrame(MoveCategory[selectedMove.category].toLowerCase());
          this.showMoveEffect();
        } else
          this.hideMoveEffect();

        this.moveDescriptionText.setText(selectedMove?.effect || '');
        const moveDescriptionLineCount = Math.floor(this.moveDescriptionText.displayHeight / 14.83);

        if (this.moveDescriptionScrollTween) {
          this.moveDescriptionScrollTween.remove();
          this.moveDescriptionScrollTween = null;
        }

        if (moveDescriptionLineCount > 3) {
          this.moveDescriptionText.setY(84);
          this.moveDescriptionScrollTween = this.scene.tweens.add({
            targets: this.moveDescriptionText,
            delay: 2000,
            loop: -1,
            loopDelay: 2000,
            duration: (moveDescriptionLineCount - 3) * 2000,
            y: `-=${14.83 * (moveDescriptionLineCount - 3)}`,
            onLoop: () => {
              this.moveDescriptionText.setY(84);
            }
          });
        }
      }

      if (!this.moveCursorObj) {
        this.moveCursorObj = this.scene.add.sprite(-2, 0, 'summary_moves_cursor', 'highlight');
        this.moveCursorObj.setOrigin(0, 1);
        this.movesContainer.add(this.moveCursorObj);
      }

      this.moveCursorObj.setY(16 * this.moveCursor + 1);

      if (this.moveCursorBlinkTimer)
        this.moveCursorBlinkTimer.destroy();
      this.moveCursorObj.setVisible(true);
      this.moveCursorBlinkTimer = this.scene.time.addEvent({
        loop: true,
        delay: Utils.fixedInt(600),
        callback: () => {
          this.moveCursorObj.setVisible(false);
          this.scene.time.delayedCall(Utils.fixedInt(100), () => {
            if (!this.moveCursorObj)
              return;
            this.moveCursorObj.setVisible(true);
          });
        }
      });

      if (this.selectedMoveIndex > -1) {
        if (!this.selectedMoveCursorObj) {
          this.selectedMoveCursorObj = this.scene.add.sprite(-2, 0, 'summary_moves_cursor', 'select');
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

        this.tabSprite.setTexture(`summary_tabs_${this.cursor + 1}`);

        if (this.summaryPageContainer.visible) {
          this.transitioning = true;
          this.populatePageContainer(this.summaryPageTransitionContainer, forward ? cursor : cursor + 1);
          if (forward)
            this.summaryPageTransitionContainer.x += 214;
          else
            this.populatePageContainer(this.summaryPageContainer);
          this.scene.tweens.add({
            targets: this.summaryPageTransitionContainer,
            x: forward ? '-=214' : '+=214',
            duration: 250,
            onComplete: () => {
              if (forward)
                this.populatePageContainer(this.summaryPageContainer);
              else
                this.summaryPageTransitionContainer.x -= 214;
              this.summaryPageTransitionContainer.setVisible(false);
              this.transitioning = false;
            }
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
    if (page === undefined)
      page = this.cursor;

    if (pageContainer.getAll().length > 1) {
      pageContainer.each((o: Phaser.GameObjects.GameObject) => {
        if (o instanceof Phaser.GameObjects.Container)
          o.removeAll(true);
      });
      pageContainer.removeBetween(1, undefined, true);
    }
    const pageBg =  (pageContainer.getAt(0) as Phaser.GameObjects.Sprite);
    pageBg.setTexture(this.getPageKey(page));
    
    switch (page) {
      case Page.PROFILE:
        const profileContainer = this.scene.add.container(0, -pageBg.height);
        pageContainer.add(profileContainer);

        const typeLabel = addTextObject(this.scene, 7, 28, 'Type/', TextStyle.WINDOW);
        typeLabel.setOrigin(0, 0);
        profileContainer.add(typeLabel);

        const getTypeIcon = (index: integer, type: Type) => {
          const typeIcon = this.scene.add.sprite(39 + 34 * index, 42, 'types', Type[type].toLowerCase());
          typeIcon.setOrigin(0, 1);
          return typeIcon;
        };

        profileContainer.add(getTypeIcon(0, this.pokemon.species.type1));
        if (this.pokemon.species.type2)
          profileContainer.add(getTypeIcon(1, this.pokemon.species.type2));

        const ability = abilities[this.pokemon.species.getAbility(this.pokemon.abilityIndex)];

        const abilityNameText = addTextObject(this.scene, 7, 66, ability.name, TextStyle.SUMMARY);
        abilityNameText.setOrigin(0, 1);
        profileContainer.add(abilityNameText);

        const abilityDescriptionText = addTextObject(this.scene, 7, 69, ability.description, TextStyle.WINDOW, { maxLines: 2, wordWrap: { width: 1212 } });
        abilityDescriptionText.setOrigin(0, 0);
        profileContainer.add(abilityDescriptionText);
        break;
      case Page.STATS:
        const statsContainer = this.scene.add.container(0, -pageBg.height);
        pageContainer.add(statsContainer);

        const stats = Utils.getEnumValues(Stat) as Stat[];

        stats.forEach((stat, s) => {
          const statName = stat !== Stat.HP
            ? getStatName(stat)
            : 'HP';
          const rowIndex = s % 3;
          const colIndex = Math.floor(s / 3);

          const statLabel = addTextObject(this.scene, 27 + 115 * colIndex, 56 + 16 * rowIndex, statName, TextStyle.SUMMARY);
          statLabel.setOrigin(0.5, 0);
          statsContainer.add(statLabel);

          const statValueText = stat !== Stat.HP
            ? this.pokemon.stats[s].toString()
            : `${this.pokemon.hp}/${this.pokemon.getMaxHp()}`;

          const statValue = addTextObject(this.scene, 120 + 88 * colIndex, 56 + 16 * rowIndex, statValueText, TextStyle.WINDOW);
          statValue.setOrigin(1, 0);
          statsContainer.add(statValue);
        });

        const itemModifiers = this.scene.findModifiers(m => m instanceof PokemonHeldItemModifier
          && (m as PokemonHeldItemModifier).pokemonId === this.pokemon.id, true) as PokemonHeldItemModifier[];
        
        itemModifiers.forEach((item, i) => {
          const icon = item.getIcon(this.scene, true);

          icon.setPosition((i % 17) * 12 + 3, 14 * Math.floor(i / 17) + 15);
          statsContainer.add(icon);
        });

        const totalLvExp = getLevelTotalExp(this.pokemon.level, this.pokemon.species.growthRate);
        const expRatio = this.pokemon.level < this.scene.getMaxExpLevel() ? this.pokemon.levelExp / totalLvExp : 0;

        const expLabel = addTextObject(this.scene, 6, 112, 'EXP. Points', TextStyle.SUMMARY);
        expLabel.setOrigin(0, 0);
        statsContainer.add(expLabel);

        const nextLvExpLabel = addTextObject(this.scene, 6, 128, 'Next Lv.', TextStyle.SUMMARY);
        nextLvExpLabel.setOrigin(0, 0);
        statsContainer.add(nextLvExpLabel);

        const expText = addTextObject(this.scene, 208, 112, this.pokemon.exp.toString(), TextStyle.WINDOW);
        expText.setOrigin(1, 0);
        statsContainer.add(expText);

        const nextLvExp = this.pokemon.level < this.scene.getMaxExpLevel()
          ? getLevelTotalExp(this.pokemon.level + 1, this.pokemon.species.growthRate) - this.pokemon.levelExp
          : 0;
        const nextLvExpText = addTextObject(this.scene, 208, 128, nextLvExp.toString(), TextStyle.WINDOW);
        nextLvExpText.setOrigin(1, 0);
        statsContainer.add(nextLvExpText);

        const expOverlay = this.scene.add.image(140, 145, 'summary_stats_overlay_exp');
        expOverlay.setOrigin(0, 0);
        statsContainer.add(expOverlay);

        const expMaskRect = this.scene.make.graphics({});
        expMaskRect.setScale(6);
        expMaskRect.fillStyle(0xFFFFFF);
        expMaskRect.beginPath();
        expMaskRect.fillRect(140 + pageContainer.x, 145 + pageContainer.y + 21, Math.floor(expRatio * 64), 3);

        const expMask = expMaskRect.createGeometryMask();

        expOverlay.setMask(expMask);
        break;
      case Page.MOVES:
        this.movesContainer = this.scene.add.container(5, -pageBg.height + 26);
        pageContainer.add(this.movesContainer);

        this.extraMoveRowContainer = this.scene.add.container(0, 64);
        this.extraMoveRowContainer.setVisible(false);
        this.movesContainer.add(this.extraMoveRowContainer);

        const extraRowOverlay = this.scene.add.image(-2, 1, 'summary_moves_overlay_row');
        extraRowOverlay.setOrigin(0, 1);
        this.extraMoveRowContainer.add(extraRowOverlay);

        const extraRowText = addTextObject(this.scene, 35, 0, this.summaryUiMode === SummaryUiMode.LEARN_MOVE ? this.newMove.name : 'Cancel',
          this.summaryUiMode === SummaryUiMode.LEARN_MOVE ? TextStyle.SUMMARY_RED : TextStyle.SUMMARY);
        extraRowText.setOrigin(0, 1);
        this.extraMoveRowContainer.add(extraRowText);

        if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE) {
          const newMoveTypeIcon = this.scene.add.sprite(0, 0, 'types', Type[this.newMove.type].toLowerCase());
          newMoveTypeIcon.setOrigin(0, 1);
          this.extraMoveRowContainer.add(newMoveTypeIcon);

          const ppOverlay = this.scene.add.image(163, -1, 'summary_moves_overlay_pp');
          ppOverlay.setOrigin(0, 1);
          this.extraMoveRowContainer.add(ppOverlay);

          const pp = Utils.padInt(this.newMove.pp, 2, '  ');
          const ppText = addTextObject(this.scene, 173, 1, `${pp}/${pp}`, TextStyle.WINDOW);
          ppText.setOrigin(0, 1);
          this.extraMoveRowContainer.add(ppText);
        }

        this.moveRowsContainer = this.scene.add.container(0, 0);
        this.movesContainer.add(this.moveRowsContainer);

        for (let m = 0; m < 4; m++) {
          const move = m < this.pokemon.moveset.length ? this.pokemon.moveset[m] : null;
          const moveRowContainer = this.scene.add.container(0, 16 * m);
          this.moveRowsContainer.add(moveRowContainer);

          if (move) {
            const typeIcon = this.scene.add.sprite(0, 0, 'types', Type[move.getMove().type].toLowerCase());
            typeIcon.setOrigin(0, 1);
            moveRowContainer.add(typeIcon);
          }

          const moveText = addTextObject(this.scene, 35, 0, move ? move.getName() : '-', TextStyle.SUMMARY);
          moveText.setOrigin(0, 1);
          moveRowContainer.add(moveText);

          const ppOverlay = this.scene.add.image(163, -1, 'summary_moves_overlay_pp');
          ppOverlay.setOrigin(0, 1);
          moveRowContainer.add(ppOverlay);

          const ppText = addTextObject(this.scene, 173, 1, '--/--', TextStyle.WINDOW);
          ppText.setOrigin(0, 1);

          if (move) {
            const maxPP = move.getMove().pp + move.ppUp;
            const pp = maxPP - move.ppUsed;
            ppText.setText(`${Utils.padInt(pp, 2, '  ')}/${Utils.padInt(maxPP, 2, '  ')}`);
          }

          moveRowContainer.add(ppText);
        }

        this.moveDescriptionText = addTextObject(this.scene, 2, 84, '', TextStyle.WINDOW, { wordWrap: { width: 1212 } });
        this.movesContainer.add(this.moveDescriptionText);

        const moveDescriptionTextMaskRect = this.scene.make.graphics({});
        moveDescriptionTextMaskRect.setScale(6);
        moveDescriptionTextMaskRect.fillStyle(0xFFFFFF);
        moveDescriptionTextMaskRect.beginPath();
        moveDescriptionTextMaskRect.fillRect(112, 130, 202, 46);

        const moveDescriptionTextMask = moveDescriptionTextMaskRect.createGeometryMask();

        this.moveDescriptionText.setMask(moveDescriptionTextMask);
        break;
    }
  }

  showStatus(instant?: boolean) {
    if (this.statusVisible)
      return;
    this.statusVisible = true;
    this.scene.tweens.add({
      targets: this.statusContainer,
      x: 0,
      duration: instant ? 0 : 250,
      ease: 'Sine.easeOut'
    });
  }

  hideStatus(instant?: boolean) {
    if (!this.statusVisible)
      return;
    this.statusVisible = false;
    this.scene.tweens.add({
      targets: this.statusContainer,
      x: -106,
      duration: instant ? 0 : 250,
      ease: 'Sine.easeIn'
    });
  }

  getSelectedMove(): Move {
    if (this.cursor !== Page.MOVES)
      return null;

    if (this.moveCursor < 4 && this.moveCursor < this.pokemon.moveset.length)
      return this.pokemon.moveset[this.moveCursor].getMove();
    else if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE && this.moveCursor === 4)
      return this.newMove;
    return null;
  }

  showMoveSelect() {
    this.moveSelect = true;
    this.extraMoveRowContainer.setVisible(true);
    this.selectedMoveIndex = -1;
    this.setCursor(0);
    this.showMoveEffect();
  }

  hideMoveSelect() {
    if (this.summaryUiMode === SummaryUiMode.LEARN_MOVE) {
      this.moveSelectFunction(4);
      return;
    }

    this.moveSelect = false;
    this.extraMoveRowContainer.setVisible(false);
    this.moveDescriptionText.setText('');
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

    this.hideMoveEffect();
  }

  showMoveEffect(instant?: boolean) {
    if (this.moveEffectsVisible)
      return;
    this.moveEffectsVisible = true;
    this.scene.tweens.add({
      targets: this.moveEffectContainer,
      x: 6,
      duration: instant ? 0 : 250,
      ease: 'Sine.easeOut'
    });
  }

  hideMoveEffect(instant?: boolean) {
    if (!this.moveEffectsVisible)
      return;
    this.moveEffectsVisible = false;
    this.scene.tweens.add({
      targets: this.moveEffectContainer,
      x: 106,
      duration: instant ? 0 : 250,
      ease: 'Sine.easeIn'
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
