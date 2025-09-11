import { globalScene } from "#app/global-scene";
import { allMoves } from "#data/data-lists";
import type { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { EncounterAnim } from "#enums/encounter-anims";
import { AnimBlendType, AnimFocus, AnimFrameTarget, ChargeAnim, CommonAnim } from "#enums/move-anims-common";
import { MoveFlags } from "#enums/move-flags";
import { MoveId } from "#enums/move-id";
import type { Pokemon } from "#field/pokemon";
import { coerceArray, getFrameMs, isNullOrUndefined, type nil } from "#utils/common";
import { getEnumKeys, getEnumValues } from "#utils/enums";
import { toKebabCase } from "#utils/strings";
import Phaser from "phaser";

export class AnimConfig {
  public id: number;
  public graphic: string;
  public frames: AnimFrame[][];
  public frameTimedEvents: Map<number, AnimTimedEvent[]>;
  public position: number;
  public hue: number;

  constructor(source?: any) {
    this.frameTimedEvents = new Map<number, AnimTimedEvent[]>();

    if (source) {
      this.id = source.id;
      this.graphic = source.graphic;
      const frames: any[][] = source.frames;
      frames.map(animFrames => {
        for (let f = 0; f < animFrames.length; f++) {
          animFrames[f] = new ImportedAnimFrame(animFrames[f]);
        }
      });
      this.frames = frames;

      const frameTimedEvents = source.frameTimedEvents;
      for (const fte of Object.keys(frameTimedEvents)) {
        const timedEvents: AnimTimedEvent[] = [];
        for (const te of frameTimedEvents[fte]) {
          let timedEvent: AnimTimedEvent | undefined;
          switch (te.eventType) {
            case "AnimTimedSoundEvent":
              timedEvent = new AnimTimedSoundEvent(te.frameIndex, te.resourceName, te);
              break;
            case "AnimTimedAddBgEvent":
              timedEvent = new AnimTimedAddBgEvent(te.frameIndex, te.resourceName, te);
              break;
            case "AnimTimedUpdateBgEvent":
              timedEvent = new AnimTimedUpdateBgEvent(te.frameIndex, te.resourceName, te);
              break;
          }

          timedEvent && timedEvents.push(timedEvent);
        }
        this.frameTimedEvents.set(Number.parseInt(fte), timedEvents);
      }

      this.position = source.position;
      this.hue = source.hue;
    } else {
      this.frames = [];
    }
  }

  getSoundResourceNames(): string[] {
    const sounds = new Set<string>();

    for (const ftes of this.frameTimedEvents.values()) {
      for (const fte of ftes) {
        if (fte instanceof AnimTimedSoundEvent && fte.resourceName) {
          sounds.add(fte.resourceName);
        }
      }
    }

    return Array.from(sounds.values());
  }

  getBackgroundResourceNames(): string[] {
    const backgrounds = new Set<string>();

    for (const ftes of this.frameTimedEvents.values()) {
      for (const fte of ftes) {
        if (fte instanceof AnimTimedAddBgEvent && fte.resourceName) {
          backgrounds.add(fte.resourceName);
        }
      }
    }

    return Array.from(backgrounds.values());
  }
}

class AnimFrame {
  public x: number;
  public y: number;
  public zoomX: number;
  public zoomY: number;
  public angle: number;
  public mirror: boolean;
  public visible: boolean;
  public blendType: AnimBlendType;
  public target: AnimFrameTarget;
  public graphicFrame: number;
  public opacity: number;
  public color: number[];
  public tone: number[];
  public flash: number[];
  public locked: boolean;
  public priority: number;
  public focus: AnimFocus;

  constructor(
    x: number,
    y: number,
    zoomX: number,
    zoomY: number,
    angle: number,
    mirror: boolean,
    visible: boolean,
    blendType: AnimBlendType,
    pattern: number,
    opacity: number,
    colorR: number,
    colorG: number,
    colorB: number,
    colorA: number,
    toneR: number,
    toneG: number,
    toneB: number,
    toneA: number,
    flashR: number,
    flashG: number,
    flashB: number,
    flashA: number,
    locked: boolean,
    priority: number,
    focus: AnimFocus,
    init?: boolean,
  ) {
    this.x = init ? x : ((x || 0) - 128) * 0.5;
    this.y = init ? y : ((y || 0) - 224) * 0.5;
    if (zoomX) {
      this.zoomX = zoomX;
    } else if (init) {
      this.zoomX = 0;
    }
    if (zoomY) {
      this.zoomY = zoomY;
    } else if (init) {
      this.zoomY = 0;
    }
    if (angle) {
      this.angle = angle;
    } else if (init) {
      this.angle = 0;
    }
    if (mirror) {
      this.mirror = mirror;
    } else if (init) {
      this.mirror = false;
    }
    if (visible) {
      this.visible = visible;
    } else if (init) {
      this.visible = false;
    }
    if (blendType) {
      this.blendType = blendType;
    } else if (init) {
      this.blendType = AnimBlendType.NORMAL;
    }
    if (!init) {
      let target = AnimFrameTarget.GRAPHIC;
      switch (pattern) {
        case -2:
          target = AnimFrameTarget.TARGET;
          break;
        case -1:
          target = AnimFrameTarget.USER;
          break;
      }
      this.target = target;
      this.graphicFrame = pattern >= 0 ? pattern : 0;
    }
    if (opacity) {
      this.opacity = opacity;
    } else if (init) {
      this.opacity = 0;
    }
    if (colorR || colorG || colorB || colorA) {
      this.color = [colorR || 0, colorG || 0, colorB || 0, colorA || 0];
    } else if (init) {
      this.color = [0, 0, 0, 0];
    }
    if (toneR || toneG || toneB || toneA) {
      this.tone = [toneR || 0, toneG || 0, toneB || 0, toneA || 0];
    } else if (init) {
      this.tone = [0, 0, 0, 0];
    }
    if (flashR || flashG || flashB || flashA) {
      this.flash = [flashR || 0, flashG || 0, flashB || 0, flashA || 0];
    } else if (init) {
      this.flash = [0, 0, 0, 0];
    }
    if (locked) {
      this.locked = locked;
    } else if (init) {
      this.locked = false;
    }
    if (priority) {
      this.priority = priority;
    } else if (init) {
      this.priority = 0;
    }
    this.focus = focus || AnimFocus.TARGET;
  }
}

class ImportedAnimFrame extends AnimFrame {
  constructor(source: any) {
    const color: number[] = source.color || [0, 0, 0, 0];
    const tone: number[] = source.tone || [0, 0, 0, 0];
    const flash: number[] = source.flash || [0, 0, 0, 0];
    super(
      source.x,
      source.y,
      source.zoomX,
      source.zoomY,
      source.angle,
      source.mirror,
      source.visible,
      source.blendType,
      source.graphicFrame,
      source.opacity,
      color[0],
      color[1],
      color[2],
      color[3],
      tone[0],
      tone[1],
      tone[2],
      tone[3],
      flash[0],
      flash[1],
      flash[2],
      flash[3],
      source.locked,
      source.priority,
      source.focus,
      true,
    );
    this.target = source.target;
    this.graphicFrame = source.graphicFrame;
  }
}

abstract class AnimTimedEvent {
  public frameIndex: number;
  public resourceName: string;

  constructor(frameIndex: number, resourceName: string) {
    this.frameIndex = frameIndex;
    this.resourceName = resourceName;
  }

  abstract execute(battleAnim: BattleAnim, priority?: number): number;

  abstract getEventType(): string;
}

class AnimTimedSoundEvent extends AnimTimedEvent {
  public volume = 100;
  public pitch = 100;

  constructor(frameIndex: number, resourceName: string, source?: any) {
    super(frameIndex, resourceName);

    if (source) {
      this.volume = source.volume;
      this.pitch = source.pitch;
    }
  }

  execute(battleAnim: BattleAnim): number {
    const soundConfig = { rate: this.pitch * 0.01, volume: this.volume * 0.01 };
    if (this.resourceName) {
      try {
        globalScene.playSound(`battle_anims/${this.resourceName}`, soundConfig);
      } catch (err) {
        console.error(err);
      }
      const sound = globalScene.sound.get(`battle_anims/${this.resourceName}`);
      if (!sound) {
        return 0;
      }
      return Math.ceil((sound.totalDuration * 1000) / 33.33);
    }
    const cry = battleAnim.user!.cry(soundConfig); // TODO: is the bang behind user correct?
    if (!cry) {
      return 0;
    }
    return Math.ceil((cry.totalDuration * 1000) / 33.33);
  }

  getEventType(): string {
    return "AnimTimedSoundEvent";
  }
}

abstract class AnimTimedBgEvent extends AnimTimedEvent {
  public bgX = 0;
  public bgY = 0;
  public opacity = 0;
  /*public colorRed: number = 0;
    public colorGreen: number = 0;
    public colorBlue: number = 0;
    public colorAlpha: number = 0;*/
  public duration = 0;
  /*public flashScope: number = 0;
    public flashRed: number = 0;
    public flashGreen: number = 0;
    public flashBlue: number = 0;
    public flashAlpha: number = 0;
    public flashDuration: number = 0;*/

  constructor(frameIndex: number, resourceName: string, source?: any) {
    super(frameIndex, resourceName);

    if (source) {
      this.bgX = source.bgX;
      this.bgY = source.bgY;
      this.opacity = source.opacity;
      /*this.colorRed = source.colorRed;
            this.colorGreen = source.colorGreen;
            this.colorBlue = source.colorBlue;
            this.colorAlpha = source.colorAlpha;*/
      this.duration = source.duration;
      /*this.flashScope = source.flashScope;
            this.flashRed = source.flashRed;
            this.flashGreen = source.flashGreen;
            this.flashBlue = source.flashBlue;
            this.flashAlpha = source.flashAlpha;
            this.flashDuration = source.flashDuration;*/
    }
  }
}

class AnimTimedUpdateBgEvent extends AnimTimedBgEvent {
  // biome-ignore lint/correctness/noUnusedFunctionParameters: seems intentional
  execute(moveAnim: MoveAnim, priority?: number): number {
    const tweenProps = {};
    if (this.bgX !== undefined) {
      tweenProps["x"] = this.bgX * 0.5 - 320;
    }
    if (this.bgY !== undefined) {
      tweenProps["y"] = this.bgY * 0.5 - 284;
    }
    if (this.opacity !== undefined) {
      tweenProps["alpha"] = (this.opacity || 0) / 255;
    }
    if (Object.keys(tweenProps).length > 0) {
      globalScene.tweens.add({
        targets: moveAnim.bgSprite,
        duration: getFrameMs(this.duration * 3),
        ...tweenProps,
      });
    }
    return this.duration * 2;
  }

  getEventType(): string {
    return "AnimTimedUpdateBgEvent";
  }
}

class AnimTimedAddBgEvent extends AnimTimedBgEvent {
  execute(moveAnim: MoveAnim, priority?: number): number {
    if (moveAnim.bgSprite) {
      moveAnim.bgSprite.destroy();
    }
    moveAnim.bgSprite = this.resourceName
      ? globalScene.add.tileSprite(this.bgX - 320, this.bgY - 284, 896, 576, this.resourceName)
      : globalScene.add.rectangle(this.bgX - 320, this.bgY - 284, 896, 576, 0);
    moveAnim.bgSprite.setOrigin(0, 0);
    moveAnim.bgSprite.setScale(1.25);
    moveAnim.bgSprite.setAlpha(this.opacity / 255);
    globalScene.field.add(moveAnim.bgSprite);
    const fieldPokemon = globalScene.getEnemyPokemon(false) ?? globalScene.getPlayerPokemon(false);
    if (!isNullOrUndefined(priority)) {
      globalScene.field.moveTo(moveAnim.bgSprite as Phaser.GameObjects.GameObject, priority);
    } else if (fieldPokemon?.isOnField()) {
      globalScene.field.moveBelow(moveAnim.bgSprite as Phaser.GameObjects.GameObject, fieldPokemon);
    }

    globalScene.tweens.add({
      targets: moveAnim.bgSprite,
      duration: getFrameMs(this.duration * 3),
    });

    return this.duration * 2;
  }

  getEventType(): string {
    return "AnimTimedAddBgEvent";
  }
}

export const moveAnims = new Map<MoveId, AnimConfig | [AnimConfig, AnimConfig] | null>();
export const chargeAnims = new Map<ChargeAnim, AnimConfig | [AnimConfig, AnimConfig] | null>();
export const commonAnims = new Map<CommonAnim, AnimConfig>();
export const encounterAnims = new Map<EncounterAnim, AnimConfig>();

export async function initCommonAnims(): Promise<void> {
  const commonAnimFetches: Promise<Map<CommonAnim, AnimConfig>>[] = [];
  for (const commonAnimName of getEnumKeys(CommonAnim)) {
    const commonAnimId = CommonAnim[commonAnimName];
    commonAnimFetches.push(
      globalScene
        .cachedFetch(`./battle-anims/common-${toKebabCase(commonAnimName)}.json`)
        .then(response => response.json())
        .then(cas => commonAnims.set(commonAnimId, new AnimConfig(cas))),
    );
  }
  await Promise.allSettled(commonAnimFetches);
}

export function initMoveAnim(move: MoveId): Promise<void> {
  return new Promise(resolve => {
    if (moveAnims.has(move)) {
      if (moveAnims.get(move) !== null) {
        resolve();
      } else {
        const loadedCheckTimer = setInterval(() => {
          if (moveAnims.get(move) !== null) {
            const chargeAnimSource = allMoves[move].isChargingMove()
              ? allMoves[move]
              : (allMoves[move].getAttrs("DelayedAttackAttr")[0] ?? allMoves[move].getAttrs("BeakBlastHeaderAttr")[0]);
            if (chargeAnimSource && chargeAnims.get(chargeAnimSource.chargeAnim) === null) {
              return;
            }
            clearInterval(loadedCheckTimer);
            resolve();
          }
        }, 50);
      }
    } else {
      moveAnims.set(move, null);
      const defaultMoveAnim = allMoves[move].is("AttackMove")
        ? MoveId.TACKLE
        : allMoves[move].is("SelfStatusMove")
          ? MoveId.FOCUS_ENERGY
          : MoveId.TAIL_WHIP;

      const fetchAnimAndResolve = (move: MoveId) => {
        globalScene
          .cachedFetch(`./battle-anims/${toKebabCase(MoveId[move])}.json`)
          .then(response => {
            const contentType = response.headers.get("content-type");
            if (!response.ok || contentType?.indexOf("application/json") === -1) {
              useDefaultAnim(move, defaultMoveAnim);
              logMissingMoveAnim(move, response.status, response.statusText);
              return resolve();
            }
            return response.json();
          })
          .then(ba => {
            if (Array.isArray(ba)) {
              populateMoveAnim(move, ba[0]);
              populateMoveAnim(move, ba[1]);
            } else {
              populateMoveAnim(move, ba);
            }
            const chargeAnimSource = allMoves[move].isChargingMove()
              ? allMoves[move]
              : (allMoves[move].getAttrs("DelayedAttackAttr")[0] ?? allMoves[move].getAttrs("BeakBlastHeaderAttr")[0]);
            if (chargeAnimSource) {
              initMoveChargeAnim(chargeAnimSource.chargeAnim).then(() => resolve());
            } else {
              resolve();
            }
          })
          .catch(error => {
            useDefaultAnim(move, defaultMoveAnim);
            logMissingMoveAnim(move, error);
            return resolve();
          });
      };
      fetchAnimAndResolve(move);
    }
  });
}

/**
 * Populates the default animation for the given move.
 *
 * @param move the move to populate an animation for
 * @param defaultMoveAnim the move to use as the default animation
 */
function useDefaultAnim(move: MoveId, defaultMoveAnim: MoveId) {
  populateMoveAnim(move, moveAnims.get(defaultMoveAnim));
}

/**
 * Helper method for printing a warning to the console when a move animation is missing.
 *
 * @param move the move to populate an animation for
 * @param optionalParams parameters to add to the error logging
 *
 * @remarks use {@linkcode useDefaultAnim} to use a default animation
 */
function logMissingMoveAnim(move: MoveId, ...optionalParams: any[]) {
  const moveName = toKebabCase(MoveId[move]);
  console.warn(`Could not load animation file for move '${moveName}'`, ...optionalParams);
}

/**
 * Fetches animation configs to be used in a Mystery Encounter
 * @param encounterAnim one or more animations to fetch
 */
export async function initEncounterAnims(encounterAnim: EncounterAnim | EncounterAnim[]): Promise<void> {
  const anims = coerceArray(encounterAnim);
  const encounterAnimNames = getEnumKeys(EncounterAnim);
  const encounterAnimFetches: Promise<Map<EncounterAnim, AnimConfig>>[] = [];
  for (const anim of anims) {
    if (encounterAnims.has(anim) && !isNullOrUndefined(encounterAnims.get(anim))) {
      continue;
    }
    encounterAnimFetches.push(
      globalScene
        .cachedFetch(`./battle-anims/encounter-${toKebabCase(encounterAnimNames[anim])}.json`)
        .then(response => response.json())
        .then(cas => encounterAnims.set(anim, new AnimConfig(cas))),
    );
  }
  await Promise.allSettled(encounterAnimFetches);
}

export function initMoveChargeAnim(chargeAnim: ChargeAnim): Promise<void> {
  return new Promise(resolve => {
    if (chargeAnims.has(chargeAnim)) {
      if (chargeAnims.get(chargeAnim) !== null) {
        resolve();
      } else {
        const loadedCheckTimer = setInterval(() => {
          if (chargeAnims.get(chargeAnim) !== null) {
            clearInterval(loadedCheckTimer);
            resolve();
          }
        }, 50);
      }
    } else {
      chargeAnims.set(chargeAnim, null);
      globalScene
        .cachedFetch(`./battle-anims/${toKebabCase(ChargeAnim[chargeAnim])}.json`)
        .then(response => response.json())
        .then(ca => {
          if (Array.isArray(ca)) {
            populateMoveChargeAnim(chargeAnim, ca[0]);
            populateMoveChargeAnim(chargeAnim, ca[1]);
          } else {
            populateMoveChargeAnim(chargeAnim, ca);
          }
          resolve();
        });
    }
  });
}

function populateMoveAnim(move: MoveId, animSource: any): void {
  const moveAnim = new AnimConfig(animSource);
  if (moveAnims.get(move) === null) {
    moveAnims.set(move, moveAnim);
    return;
  }
  moveAnims.set(move, [moveAnims.get(move) as AnimConfig, moveAnim]);
}

function populateMoveChargeAnim(chargeAnim: ChargeAnim, animSource: any) {
  const moveChargeAnim = new AnimConfig(animSource);
  if (chargeAnims.get(chargeAnim) === null) {
    chargeAnims.set(chargeAnim, moveChargeAnim);
    return;
  }
  chargeAnims.set(chargeAnim, [chargeAnims.get(chargeAnim) as AnimConfig, moveChargeAnim]);
}

export function loadCommonAnimAssets(startLoad?: boolean): Promise<void> {
  return new Promise(resolve => {
    loadAnimAssets(Array.from(commonAnims.values()), startLoad).then(() => resolve());
  });
}

/**
 * Loads encounter animation assets to scene
 * MUST be called after {@linkcode initEncounterAnims()} to load all required animations properly
 * @param startLoad
 */
export async function loadEncounterAnimAssets(startLoad?: boolean): Promise<void> {
  await loadAnimAssets(Array.from(encounterAnims.values()), startLoad);
}

export function loadMoveAnimAssets(moveIds: MoveId[], startLoad?: boolean): Promise<void> {
  return new Promise(resolve => {
    const moveAnimations = moveIds.flatMap(m => moveAnims.get(m) as AnimConfig);
    for (const moveId of moveIds) {
      const chargeAnimSource = allMoves[moveId].isChargingMove()
        ? allMoves[moveId]
        : (allMoves[moveId].getAttrs("DelayedAttackAttr")[0] ?? allMoves[moveId].getAttrs("BeakBlastHeaderAttr")[0]);
      if (chargeAnimSource) {
        const moveChargeAnims = chargeAnims.get(chargeAnimSource.chargeAnim);
        moveAnimations.push(moveChargeAnims instanceof AnimConfig ? moveChargeAnims : moveChargeAnims![0]); // TODO: is the bang correct?
        if (Array.isArray(moveChargeAnims)) {
          moveAnimations.push(moveChargeAnims[1]);
        }
      }
    }
    loadAnimAssets(moveAnimations, startLoad).then(() => resolve());
  });
}

function loadAnimAssets(anims: AnimConfig[], startLoad?: boolean): Promise<void> {
  return new Promise(resolve => {
    const backgrounds = new Set<string>();
    const sounds = new Set<string>();
    for (const a of anims) {
      if (a.frames?.length === 0) {
        continue;
      }
      const animSounds = a.getSoundResourceNames();
      for (const ms of animSounds) {
        sounds.add(ms);
      }
      const animBackgrounds = a.getBackgroundResourceNames();
      for (const abg of animBackgrounds) {
        backgrounds.add(abg);
      }
      if (a.graphic) {
        globalScene.loadSpritesheet(a.graphic, "battle_anims", 96);
      }
    }
    for (const bg of backgrounds) {
      globalScene.loadImage(bg, "battle_anims");
    }
    for (const s of sounds) {
      globalScene.loadSe(s, "battle_anims", s);
    }
    if (startLoad) {
      globalScene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
      if (!globalScene.load.isLoading()) {
        globalScene.load.start();
      }
    } else {
      resolve();
    }
  });
}

interface GraphicFrameData {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  angle: number;
}

const userFocusX = 106;
const userFocusY = 148 - 32;
const targetFocusX = 234;
const targetFocusY = 84 - 32;

function transformPoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number,
  px: number,
  py: number,
): [x: number, y: number] {
  const yIntersect = yAxisIntersect(x1, y1, x2, y2, px, py);
  return repositionY(x3, y3, x4, y4, yIntersect[0], yIntersect[1]);
}

function yAxisIntersect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  px: number,
  py: number,
): [x: number, y: number] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const x = dx === 0 ? 0 : (px - x1) / dx;
  const y = dy === 0 ? 0 : (py - y1) / dy;
  return [x, y];
}

function repositionY(x1: number, y1: number, x2: number, y2: number, tx: number, ty: number): [x: number, y: number] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const x = x1 + tx * dx;
  const y = y1 + ty * dy;
  return [x, y];
}

function isReversed(src1: number, src2: number, dst1: number, dst2: number) {
  if (src1 === src2) {
    return false;
  }
  if (src1 < src2) {
    return dst1 > dst2;
  }
  return dst1 < dst2;
}

interface SpriteCache {
  [key: number]: Phaser.GameObjects.Sprite[];
}

export abstract class BattleAnim {
  public user: Pokemon | null;
  public target: Pokemon | null;
  public sprites: Phaser.GameObjects.Sprite[];
  public bgSprite: Phaser.GameObjects.TileSprite | Phaser.GameObjects.Rectangle;
  /**
   * Will attempt to play as much of an animation as possible, even if not all targets are on the field.
   * Will also play the animation, even if the user has selected "Move Animations" OFF in Settings.
   * Exclusively used by MEs atm, for visual animations at the start of an encounter.
   */
  public playRegardlessOfIssues: boolean;

  private srcLine: number[];
  private dstLine: number[];

  constructor(user?: Pokemon, target?: Pokemon, playRegardlessOfIssues = false) {
    this.user = user ?? null;
    this.target = target ?? null;
    this.sprites = [];
    this.playRegardlessOfIssues = playRegardlessOfIssues;
  }

  abstract getAnim(): AnimConfig | null;

  abstract isOppAnim(): boolean;

  protected isHideUser(): boolean {
    return false;
  }

  protected isHideTarget(): boolean {
    return false;
  }

  private getGraphicFrameData(
    frames: AnimFrame[],
    onSubstitute?: boolean,
  ): Map<number, Map<AnimFrameTarget, GraphicFrameData>> {
    const ret: Map<number, Map<AnimFrameTarget, GraphicFrameData>> = new Map([
      [AnimFrameTarget.GRAPHIC, new Map<AnimFrameTarget, GraphicFrameData>()],
      [AnimFrameTarget.USER, new Map<AnimFrameTarget, GraphicFrameData>()],
      [AnimFrameTarget.TARGET, new Map<AnimFrameTarget, GraphicFrameData>()],
    ]);

    const isOppAnim = this.isOppAnim();
    const user = !isOppAnim ? this.user : this.target;
    const target = !isOppAnim ? this.target : this.user;

    const targetSubstitute = onSubstitute && user !== target ? target!.getTag(BattlerTagType.SUBSTITUTE) : null;

    const userInitialX = user!.x; // TODO: is this bang correct?
    const userInitialY = user!.y; // TODO: is this bang correct?
    const userHalfHeight = user!.getSprite().displayHeight! / 2; // TODO: is this bang correct?

    const targetInitialX = targetSubstitute?.sprite?.x ?? target!.x; // TODO: is this bang correct?
    const targetInitialY = targetSubstitute?.sprite?.y ?? target!.y; // TODO: is this bang correct?
    const targetHalfHeight = (targetSubstitute?.sprite ?? target!.getSprite()).displayHeight! / 2; // TODO: is this bang correct?

    let g = 0;
    let u = 0;
    let t = 0;

    for (const frame of frames) {
      let x = frame.x + 106;
      let y = frame.y + 116;
      let scaleX = (frame.zoomX / 100) * (!frame.mirror ? 1 : -1);
      const scaleY = frame.zoomY / 100;
      switch (frame.focus) {
        case AnimFocus.TARGET:
          x += targetInitialX - targetFocusX;
          y += targetInitialY - targetHalfHeight - targetFocusY;
          break;
        case AnimFocus.USER:
          x += userInitialX - userFocusX;
          y += userInitialY - userHalfHeight - userFocusY;
          break;
        case AnimFocus.USER_TARGET:
          {
            const point = transformPoint(
              this.srcLine[0],
              this.srcLine[1],
              this.srcLine[2],
              this.srcLine[3],
              this.dstLine[0],
              this.dstLine[1] - userHalfHeight,
              this.dstLine[2],
              this.dstLine[3] - targetHalfHeight,
              x,
              y,
            );
            x = point[0];
            y = point[1];
            if (
              frame.target === AnimFrameTarget.GRAPHIC
              && isReversed(this.srcLine[0], this.srcLine[2], this.dstLine[0], this.dstLine[2])
            ) {
              scaleX = scaleX * -1;
            }
          }
          break;
      }
      const angle = -frame.angle;
      const key = frame.target === AnimFrameTarget.GRAPHIC ? g++ : frame.target === AnimFrameTarget.USER ? u++ : t++;
      ret.get(frame.target)!.set(key, { x, y, scaleX, scaleY, angle }); // TODO: is the bang correct?
    }

    return ret;
  }

  // biome-ignore lint/complexity/noBannedTypes: callback is used liberally
  play(onSubstitute?: boolean, callback?: Function) {
    const isOppAnim = this.isOppAnim();
    const user = isOppAnim ? this.target! : this.user!;
    const target = isOppAnim ? this.user! : this.target!; // TODO: These bangs are LITERALLY not correct at all

    if (!target?.isOnField() && !this.playRegardlessOfIssues) {
      if (callback) {
        callback();
      }
      return;
    }

    const targetSubstitute = !!onSubstitute && user !== target ? target.getTag(BattlerTagType.SUBSTITUTE) : null;

    const userSprite = user.getSprite();
    const targetSprite = targetSubstitute?.sprite ?? target.getSprite();

    const spriteCache: SpriteCache = {
      [AnimFrameTarget.GRAPHIC]: [],
      [AnimFrameTarget.USER]: [],
      [AnimFrameTarget.TARGET]: [],
    };
    const spritePriorities: number[] = [];

    const cleanUpAndComplete = () => {
      userSprite.setPosition(0, 0);
      userSprite.setScale(1);
      userSprite.setAlpha(1);
      userSprite.pipelineData["tone"] = [0.0, 0.0, 0.0, 0.0];
      userSprite.setAngle(0);
      if (!targetSubstitute) {
        targetSprite.setPosition(0, 0);
        targetSprite.setScale(1);
        targetSprite.setAlpha(1);
      } else {
        targetSprite.setPosition(
          target.x - target.getSubstituteOffset()[0],
          target.y - target.getSubstituteOffset()[1],
        );
        targetSprite.setScale(target.getSpriteScale() * (target.isPlayer() ? 0.5 : 1));
        targetSprite.setAlpha(1);
      }
      targetSprite.pipelineData["tone"] = [0.0, 0.0, 0.0, 0.0];
      targetSprite.setAngle(0);

      // Remove animation event listeners to enable sprites to be freed.
      userSprite.off("animationupdate");
      targetSprite.off("animationupdate");

      /**
       * This and `targetSpriteToShow` are used to restore context lost
       * from the `isOppAnim` swap. Using these references instead of `this.user`
       * and `this.target` prevent the target's Substitute doll from disappearing
       * after being the target of an animation.
       */
      const userSpriteToShow = isOppAnim ? targetSprite : userSprite;
      const targetSpriteToShow = isOppAnim ? userSprite : targetSprite;
      if (!this.isHideUser() && userSpriteToShow) {
        userSpriteToShow.setVisible(true);
      }
      if (!this.isHideTarget() && (targetSpriteToShow !== userSpriteToShow || !this.isHideUser())) {
        targetSpriteToShow.setVisible(true);
      }
      for (const ms of Object.values(spriteCache).flat()) {
        if (ms) {
          ms.destroy();
        }
      }
      if (this.bgSprite) {
        this.bgSprite.destroy();
      }
      if (callback) {
        callback();
      }
    };

    if (!globalScene.moveAnimations && !this.playRegardlessOfIssues) {
      return cleanUpAndComplete();
    }

    const anim = this.getAnim();

    const userInitialX = user.x;
    const userInitialY = user.y;
    const targetInitialX = targetSubstitute?.sprite?.x ?? target.x;
    const targetInitialY = targetSubstitute?.sprite?.y ?? target.y;

    this.srcLine = [userFocusX, userFocusY, targetFocusX, targetFocusY];
    this.dstLine = [userInitialX, userInitialY, targetInitialX, targetInitialY];

    let r = anim?.frames.length ?? 0;
    let f = 0;

    globalScene.tweens.addCounter({
      duration: getFrameMs(3),
      repeat: anim?.frames.length ?? 0,
      onRepeat: () => {
        if (!f) {
          userSprite.setVisible(false);
          targetSprite.setVisible(false);
        }

        const spriteFrames = anim!.frames[f]; // TODO: is the bang correcT?
        const frameData = this.getGraphicFrameData(anim!.frames[f], onSubstitute); // TODO: is the bang correct?
        let u = 0;
        let t = 0;
        let g = 0;
        for (const frame of spriteFrames) {
          if (frame.target !== AnimFrameTarget.GRAPHIC) {
            const isUser = frame.target === AnimFrameTarget.USER;
            if (isUser && target === user) {
              continue;
            }
            if (this.playRegardlessOfIssues && frame.target === AnimFrameTarget.TARGET && !target.isOnField()) {
              continue;
            }
            const sprites = spriteCache[isUser ? AnimFrameTarget.USER : AnimFrameTarget.TARGET];
            const spriteSource = isUser ? userSprite : targetSprite;
            if ((isUser ? u : t) === sprites.length) {
              if (isUser || !targetSubstitute) {
                const sprite = globalScene.addPokemonSprite(
                  isUser ? user! : target,
                  0,
                  0,
                  spriteSource!.texture,
                  spriteSource!.frame.name,
                  true,
                ); // TODO: are those bangs correct?
                ["spriteColors", "fusionSpriteColors"].map(
                  k => (sprite.pipelineData[k] = (isUser ? user! : target).getSprite().pipelineData[k]),
                ); // TODO: are those bangs correct?
                sprite.setPipelineData("spriteKey", (isUser ? user! : target).getBattleSpriteKey());
                sprite.setPipelineData("shiny", (isUser ? user : target).shiny);
                sprite.setPipelineData("variant", (isUser ? user : target).variant);
                sprite.setPipelineData("ignoreFieldPos", true);
                spriteSource.on("animationupdate", (_anim, frame) => sprite.setFrame(frame.textureFrame));
                globalScene.field.add(sprite);
                sprites.push(sprite);
              } else {
                const sprite = globalScene.addFieldSprite(spriteSource.x, spriteSource.y, spriteSource.texture);
                spriteSource.on("animationupdate", (_anim, frame) => sprite.setFrame(frame.textureFrame));
                globalScene.field.add(sprite);
                sprites.push(sprite);
              }
            }

            const spriteIndex = isUser ? u++ : t++;
            const pokemonSprite = sprites[spriteIndex];
            const graphicFrameData = frameData.get(frame.target)!.get(spriteIndex)!; // TODO: are the bangs correct?
            const spriteSourceScale =
              isUser || !targetSubstitute
                ? spriteSource.parentContainer.scale
                : target.getSpriteScale() * (target.isPlayer() ? 0.5 : 1);
            pokemonSprite.setPosition(
              graphicFrameData.x,
              graphicFrameData.y - (spriteSource.height / 2) * (spriteSourceScale - 1),
            );

            pokemonSprite.setAngle(graphicFrameData.angle);
            pokemonSprite.setScale(
              graphicFrameData.scaleX * spriteSourceScale,
              graphicFrameData.scaleY * spriteSourceScale,
            );

            pokemonSprite.setData("locked", frame.locked);

            pokemonSprite.setAlpha(frame.opacity / 255);
            pokemonSprite.pipelineData["tone"] = frame.tone;
            pokemonSprite.setVisible(frame.visible && (isUser ? user.visible : target.visible));
            pokemonSprite.setBlendMode(
              frame.blendType === AnimBlendType.NORMAL
                ? Phaser.BlendModes.NORMAL
                : frame.blendType === AnimBlendType.ADD
                  ? Phaser.BlendModes.ADD
                  : Phaser.BlendModes.DIFFERENCE,
            );
          } else {
            const sprites = spriteCache[AnimFrameTarget.GRAPHIC];
            if (g === sprites.length) {
              const newSprite: Phaser.GameObjects.Sprite = globalScene.addFieldSprite(0, 0, anim!.graphic, 1); // TODO: is the bang correct?
              sprites.push(newSprite);
              globalScene.field.add(newSprite);
              spritePriorities.push(1);
            }

            const graphicIndex = g++;
            const moveSprite = sprites[graphicIndex];
            if (spritePriorities[graphicIndex] !== frame.priority) {
              spritePriorities[graphicIndex] = frame.priority;
              /** Move the position that the moveSprite is rendered in based on the priority.
               * @param priority The priority level to draw the sprite.
               * - 0: Draw the sprite in front of the pokemon on the field.
               * - 1: Draw the sprite in front of the user pokemon.
               * - 2: Draw the sprite in front of its `bgSprite` (if it has one), or its
               * `AnimFocus` (if that is user/target), otherwise behind everything.
               * - 3: Draw the sprite behind its `AnimFocus` (if that is user/target), otherwise in front of everything.
               */
              const setSpritePriority = (priority: number) => {
                /** The sprite we are moving the moveSprite in relation to */
                let targetSprite: Phaser.GameObjects.GameObject | nil;
                /** The method that is being used to move the sprite.*/
                let moveFunc:
                  | ((sprite: Phaser.GameObjects.GameObject, target: Phaser.GameObjects.GameObject) => void)
                  | ((sprite: Phaser.GameObjects.GameObject) => void) = globalScene.field.bringToTop;

                if (priority === 0) {
                  // Place the sprite in front of the pokemon on the field.
                  targetSprite = globalScene.getEnemyField().find(p => p) ?? globalScene.getPlayerField().find(p => p);
                  moveFunc = globalScene.field.moveBelow;
                } else if (priority === 2 && this.bgSprite) {
                  moveFunc = globalScene.field.moveAbove;
                  targetSprite = this.bgSprite;
                } else if (priority === 2 || priority === 3) {
                  moveFunc = priority === 2 ? globalScene.field.moveBelow : globalScene.field.moveAbove;
                  if (frame.focus === AnimFocus.USER) {
                    targetSprite = this.user;
                  } else if (frame.focus === AnimFocus.TARGET) {
                    targetSprite = this.target;
                  }
                }
                // If target sprite is not undefined and exists in the field container, then move the sprite using the moveFunc.
                // Otherwise, default to just bringing it to the top.
                targetSprite && globalScene.field.exists(targetSprite)
                  ? moveFunc.bind(globalScene.field)(moveSprite as Phaser.GameObjects.GameObject, targetSprite)
                  : globalScene.field.bringToTop(moveSprite as Phaser.GameObjects.GameObject);
              };
              setSpritePriority(frame.priority);
            }
            moveSprite.setFrame(frame.graphicFrame);
            //console.log(AnimFocus[frame.focus]);

            const graphicFrameData = frameData.get(frame.target)!.get(graphicIndex)!; // TODO: are those bangs correct?
            moveSprite.setPosition(graphicFrameData.x, graphicFrameData.y);
            moveSprite.setAngle(graphicFrameData.angle);
            moveSprite.setScale(graphicFrameData.scaleX, graphicFrameData.scaleY);

            moveSprite.setAlpha(frame.opacity / 255);
            moveSprite.setVisible(frame.visible);
            moveSprite.setBlendMode(
              frame.blendType === AnimBlendType.NORMAL
                ? Phaser.BlendModes.NORMAL
                : frame.blendType === AnimBlendType.ADD
                  ? Phaser.BlendModes.ADD
                  : Phaser.BlendModes.DIFFERENCE,
            );
          }
        }
        if (anim?.frameTimedEvents.has(f)) {
          const base = anim.frames.length - f;
          // Bang is correct due to `has` check above, which cannot return true for an undefined / null `f`
          for (const event of anim.frameTimedEvents.get(f)!) {
            r = Math.max(base + event.execute(this), r);
          }
        }
        const targets = getEnumValues(AnimFrameTarget);
        for (const i of targets) {
          const count = i === AnimFrameTarget.GRAPHIC ? g : i === AnimFrameTarget.USER ? u : t;
          if (count < spriteCache[i].length) {
            const spritesToRemove = spriteCache[i].slice(count, spriteCache[i].length);
            for (const rs of spritesToRemove) {
              if (!rs.getData("locked") as boolean) {
                const spriteCacheIndex = spriteCache[i].indexOf(rs);
                spriteCache[i].splice(spriteCacheIndex, 1);
                if (i === AnimFrameTarget.GRAPHIC) {
                  spritePriorities.splice(spriteCacheIndex, 1);
                }
                rs.destroy();
              }
            }
          }
        }
        f++;
        r--;
      },
      onComplete: () => {
        for (const ms of Object.values(spriteCache).flat()) {
          if (ms && !ms.getData("locked")) {
            ms.destroy();
          }
        }
        if (r) {
          globalScene.tweens.addCounter({
            duration: getFrameMs(r),
            onComplete: () => cleanUpAndComplete(),
          });
        } else {
          cleanUpAndComplete();
        }
      },
    });
  }

  private getGraphicFrameDataWithoutTarget(
    frames: AnimFrame[],
    targetInitialX: number,
    targetInitialY: number,
  ): Map<number, Map<AnimFrameTarget, GraphicFrameData>> {
    const ret: Map<number, Map<AnimFrameTarget, GraphicFrameData>> = new Map([
      [AnimFrameTarget.GRAPHIC, new Map<AnimFrameTarget, GraphicFrameData>()],
      [AnimFrameTarget.USER, new Map<AnimFrameTarget, GraphicFrameData>()],
      [AnimFrameTarget.TARGET, new Map<AnimFrameTarget, GraphicFrameData>()],
    ]);

    let g = 0;
    let u = 0;
    let t = 0;

    for (const frame of frames) {
      let { x, y } = frame;
      const scaleX = (frame.zoomX / 100) * (frame.mirror ? -1 : 1);
      const scaleY = frame.zoomY / 100;
      x += targetInitialX;
      y += targetInitialY;
      const angle = -frame.angle;
      const key = frame.target === AnimFrameTarget.GRAPHIC ? g++ : frame.target === AnimFrameTarget.USER ? u++ : t++;
      ret.get(frame.target)?.set(key, {
        x,
        y,
        scaleX,
        scaleY,
        angle,
      });
    }

    return ret;
  }

  /**
   * @param targetInitialX
   * @param targetInitialY
   * @param frameTimeMult
   * @param frameTimedEventPriority
   * - 0 is behind all other sprites (except BG)
   * - 1 on top of player field
   * - 3 is on top of both fields
   * - 5 is on top of player sprite
   * @param callback
   */
  playWithoutTargets(
    targetInitialX: number,
    targetInitialY: number,
    frameTimeMult: number,
    frameTimedEventPriority?: 0 | 1 | 3 | 5,
    // biome-ignore lint/complexity/noBannedTypes: callback is used liberally
    callback?: Function,
  ) {
    const spriteCache: SpriteCache = {
      [AnimFrameTarget.GRAPHIC]: [],
      [AnimFrameTarget.USER]: [],
      [AnimFrameTarget.TARGET]: [],
    };

    const cleanUpAndComplete = () => {
      for (const ms of Object.values(spriteCache).flat()) {
        if (ms) {
          ms.destroy();
        }
      }
      if (this.bgSprite) {
        this.bgSprite.destroy();
      }
      if (callback) {
        callback();
      }
    };

    if (!globalScene.moveAnimations && !this.playRegardlessOfIssues) {
      return cleanUpAndComplete();
    }

    const anim = this.getAnim();

    this.srcLine = [userFocusX, userFocusY, targetFocusX, targetFocusY];
    this.dstLine = [150, 75, targetInitialX, targetInitialY];

    let totalFrames = anim!.frames.length;
    let frameCount = 0;

    let existingFieldSprites = globalScene.field.getAll().slice(0);

    globalScene.tweens.addCounter({
      duration: getFrameMs(3) * frameTimeMult,
      repeat: anim!.frames.length,
      onRepeat: () => {
        existingFieldSprites = globalScene.field.getAll().slice(0);
        const spriteFrames = anim!.frames[frameCount];
        const frameData = this.getGraphicFrameDataWithoutTarget(
          anim!.frames[frameCount],
          targetInitialX,
          targetInitialY,
        );
        let graphicFrameCount = 0;
        for (const frame of spriteFrames) {
          if (frame.target !== AnimFrameTarget.GRAPHIC) {
            console.log("Encounter animations do not support targets");
            continue;
          }

          const sprites = spriteCache[AnimFrameTarget.GRAPHIC];
          if (graphicFrameCount === sprites.length) {
            const newSprite: Phaser.GameObjects.Sprite = globalScene.addFieldSprite(0, 0, anim!.graphic, 1);
            sprites.push(newSprite);
            globalScene.field.add(newSprite);
          }

          const graphicIndex = graphicFrameCount++;
          const moveSprite = sprites[graphicIndex];
          if (!isNullOrUndefined(frame.priority)) {
            const setSpritePriority = (priority: number) => {
              if (existingFieldSprites.length > priority) {
                // Move to specified priority index
                const index = globalScene.field.getIndex(existingFieldSprites[priority]);
                globalScene.field.moveTo(moveSprite, index);
              } else {
                // Move to top of scene
                globalScene.field.moveTo(moveSprite, globalScene.field.getAll().length - 1);
              }
            };
            setSpritePriority(frame.priority);
          }
          moveSprite.setFrame(frame.graphicFrame);

          const graphicFrameData = frameData.get(frame.target)?.get(graphicIndex);
          if (graphicFrameData) {
            moveSprite.setPosition(graphicFrameData.x, graphicFrameData.y);
            moveSprite.setAngle(graphicFrameData.angle);
            moveSprite.setScale(graphicFrameData.scaleX, graphicFrameData.scaleY);

            moveSprite.setAlpha(frame.opacity / 255);
            moveSprite.setVisible(frame.visible);
            moveSprite.setBlendMode(
              frame.blendType === AnimBlendType.NORMAL
                ? Phaser.BlendModes.NORMAL
                : frame.blendType === AnimBlendType.ADD
                  ? Phaser.BlendModes.ADD
                  : Phaser.BlendModes.DIFFERENCE,
            );
          }
        }
        if (anim?.frameTimedEvents.get(frameCount)) {
          const base = anim.frames.length - frameCount;
          for (const event of anim.frameTimedEvents.get(frameCount)!) {
            totalFrames = Math.max(base + event.execute(this, frameTimedEventPriority), totalFrames);
          }
        }
        const targets = getEnumValues(AnimFrameTarget);
        for (const i of targets) {
          const count = graphicFrameCount;
          if (count < spriteCache[i].length) {
            const spritesToRemove = spriteCache[i].slice(count, spriteCache[i].length);
            for (const sprite of spritesToRemove) {
              if (!sprite.getData("locked") as boolean) {
                const spriteCacheIndex = spriteCache[i].indexOf(sprite);
                spriteCache[i].splice(spriteCacheIndex, 1);
                sprite.destroy();
              }
            }
          }
        }
        frameCount++;
        totalFrames--;
      },
      onComplete: () => {
        for (const sprite of Object.values(spriteCache).flat()) {
          if (sprite && !sprite.getData("locked")) {
            sprite.destroy();
          }
        }
        if (totalFrames) {
          globalScene.tweens.addCounter({
            duration: getFrameMs(totalFrames),
            onComplete: () => cleanUpAndComplete(),
          });
        } else {
          cleanUpAndComplete();
        }
      },
    });
  }
}

export class CommonBattleAnim extends BattleAnim {
  public commonAnim: CommonAnim | null;

  constructor(commonAnim: CommonAnim | null, user: Pokemon, target?: Pokemon, playOnEmptyField = false) {
    super(user, target || user, playOnEmptyField);

    this.commonAnim = commonAnim;
  }

  getAnim(): AnimConfig | null {
    return this.commonAnim ? (commonAnims.get(this.commonAnim) ?? null) : null;
  }

  isOppAnim(): boolean {
    return false;
  }
}

export class MoveAnim extends BattleAnim {
  public move: MoveId;

  constructor(move: MoveId, user: Pokemon, target: BattlerIndex, playOnEmptyField = false) {
    // Set target to the user pokemon if no target is found to avoid crashes
    super(user, globalScene.getField()[target] ?? user, playOnEmptyField);

    this.move = move;
  }

  getAnim(): AnimConfig {
    return moveAnims.get(this.move) instanceof AnimConfig
      ? (moveAnims.get(this.move) as AnimConfig)
      : (moveAnims.get(this.move)?.[this.user?.isPlayer() ? 0 : 1] as AnimConfig);
  }

  isOppAnim(): boolean {
    return !this.user?.isPlayer() && Array.isArray(moveAnims.get(this.move));
  }

  protected isHideUser(): boolean {
    return allMoves[this.move].hasFlag(MoveFlags.HIDE_USER);
  }

  protected isHideTarget(): boolean {
    return allMoves[this.move].hasFlag(MoveFlags.HIDE_TARGET);
  }
}

export class MoveChargeAnim extends MoveAnim {
  private chargeAnim: ChargeAnim;

  constructor(chargeAnim: ChargeAnim, move: MoveId, user: Pokemon) {
    super(move, user, 0);

    this.chargeAnim = chargeAnim;
  }

  isOppAnim(): boolean {
    return !this.user?.isPlayer() && Array.isArray(chargeAnims.get(this.chargeAnim));
  }

  getAnim(): AnimConfig {
    return chargeAnims.get(this.chargeAnim) instanceof AnimConfig
      ? (chargeAnims.get(this.chargeAnim) as AnimConfig)
      : (chargeAnims.get(this.chargeAnim)?.[this.user?.isPlayer() ? 0 : 1] as AnimConfig);
  }
}

export class EncounterBattleAnim extends BattleAnim {
  public encounterAnim: EncounterAnim;
  public oppAnim: boolean;

  constructor(encounterAnim: EncounterAnim, user: Pokemon, target?: Pokemon, oppAnim?: boolean) {
    super(user, target ?? user, true);

    this.encounterAnim = encounterAnim;
    this.oppAnim = oppAnim ?? false;
  }

  getAnim(): AnimConfig | null {
    return encounterAnims.get(this.encounterAnim) ?? null;
  }

  isOppAnim(): boolean {
    return this.oppAnim;
  }
}
