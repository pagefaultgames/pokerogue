//import { battleAnimRawData } from "./battle-anim-raw-data";
import BattleScene from "../battle-scene";
import { AttackMove, ChargeAttr, DelayedAttackAttr, MoveFlags, SelfStatusMove, allMoves } from "./move";
import Pokemon from "../field/pokemon";
import * as Utils from "../utils";
import { BattlerIndex } from "../battle";
import { Element } from "json-stable-stringify";
import { Moves } from "./enums/moves";
//import fs from 'vite-plugin-fs/browser';

export enum AnimFrameTarget {
    USER,
    TARGET,
    GRAPHIC
}

enum AnimFocus {
    TARGET = 1,
    USER,
    USER_TARGET,
    SCREEN
}

enum AnimBlendType {
    NORMAL,
    ADD,
    SUBTRACT
}

export enum ChargeAnim {
    FLY_CHARGING = 1000,
    BOUNCE_CHARGING,
    DIG_CHARGING,
    FUTURE_SIGHT_CHARGING,
    DIVE_CHARGING,
    SOLAR_BEAM_CHARGING,
    SHADOW_FORCE_CHARGING,
    SKULL_BASH_CHARGING,
    FREEZE_SHOCK_CHARGING,
    SKY_DROP_CHARGING,
    SKY_ATTACK_CHARGING,
    ICE_BURN_CHARGING,
    DOOM_DESIRE_CHARGING,
    RAZOR_WIND_CHARGING,
    PHANTOM_FORCE_CHARGING,
    GEOMANCY_CHARGING,
    SHADOW_BLADE_CHARGING,
    SOLAR_BLADE_CHARGING,
    BEAK_BLAST_CHARGING,
    METEOR_BEAM_CHARGING,
    ELECTRO_SHOT_CHARGING
}

export enum CommonAnim {
    USE_ITEM = 2000,
    HEALTH_UP,
    POISON = 2010,
    TOXIC,
    PARALYSIS,
    SLEEP,
    FROZEN,
    BURN,
    CONFUSION,
    ATTRACT,
    BIND,
    WRAP,
    CURSE_NO_GHOST,
    LEECH_SEED,
    FIRE_SPIN,
    PROTECT,
    COVET,
    WHIRLPOOL,
    BIDE,
    SAND_TOMB,
    QUICK_GUARD,
    WIDE_GUARD,
    CURSE,
    MAGMA_STORM,
    CLAMP,
    SNAP_TRAP,
    THUNDER_CAGE,
    INFESTATION,
    ORDER_UP_CURLY,
    ORDER_UP_DROOPY,
    ORDER_UP_STRETCHY,
    RAGING_BULL_FIRE,
    RAGING_BULL_WATER,
    SALT_CURE,
    SUNNY = 2100,
    RAIN,
    SANDSTORM,
    HAIL,
    SNOW,
    WIND,
    HEAVY_RAIN,
    HARSH_SUN,
    STRONG_WINDS,
    MISTY_TERRAIN = 2110,
    ELECTRIC_TERRAIN,
    GRASSY_TERRAIN,
    PSYCHIC_TERRAIN,
    LOCK_ON = 2120
}

export class AnimConfig {
  public id: integer;
  public graphic: string;
  public frames: AnimFrame[][];
  public frameTimedEvents: Map<integer, AnimTimedEvent[]>;
  public position: integer;
  public hue: integer;

  constructor(source?: any) {
    this.frameTimedEvents = new Map<integer, AnimTimedEvent[]>;

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
          let timedEvent: AnimTimedEvent;
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
          timedEvents.push(timedEvent);
        }
        this.frameTimedEvents.set(parseInt(fte), timedEvents);
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
  public graphicFrame: integer;
  public opacity: integer;
  public color: integer[];
  public tone: integer[];
  public flash: integer[];
  public locked: boolean;
  public priority: integer;
  public focus: AnimFocus;

  constructor(x: number, y: number, zoomX: number, zoomY: number, angle: number, mirror: boolean, visible: boolean, blendType: AnimBlendType, pattern: integer,
    opacity: integer, colorR: integer, colorG: integer, colorB: integer, colorA: integer, toneR: integer, toneG: integer, toneB: integer, toneA: integer,
    flashR: integer, flashG: integer, flashB: integer, flashA: integer, locked: boolean, priority: integer, focus: AnimFocus, init?: boolean) {
    this.x = !init ? ((x || 0) - 128) * 0.5 : x;
    this.y = !init ? ((y || 0) - 224) * 0.5 : y;
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
      this.color = [ colorR || 0, colorG || 0, colorB || 0, colorA || 0 ];
    } else if (init) {
      this.color = [ 0, 0, 0, 0 ];
    }
    if (toneR || toneG || toneB || toneA) {
      this.tone = [ toneR || 0, toneG || 0, toneB || 0, toneA || 0 ];
    } else if (init) {
      this.tone = [ 0, 0, 0, 0 ];
    }
    if (flashR || flashG || flashB || flashA) {
      this.flash = [ flashR || 0, flashG || 0, flashB || 0, flashA || 0 ];
    } else if (init) {
      this.flash = [ 0, 0, 0, 0 ];
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
    const color: integer[] = source.color || [ 0, 0, 0, 0 ];
    const tone: integer[] = source.tone || [ 0, 0, 0, 0 ];
    const flash: integer[] = source.flash || [ 0, 0, 0, 0 ];
    super(source.x, source.y, source.zoomX, source.zoomY, source.angle, source.mirror, source.visible, source.blendType, source.graphicFrame, source.opacity, color[0], color[1], color[2], color[3], tone[0], tone[1], tone[2], tone[3], flash[0], flash[1], flash[2], flash[3], source.locked, source.priority, source.focus, true);
    this.target = source.target;
    this.graphicFrame = source.graphicFrame;
  }
}

abstract class AnimTimedEvent {
  public frameIndex: integer;
  public resourceName: string;

  constructor(frameIndex: integer, resourceName: string) {
    this.frameIndex = frameIndex;
    this.resourceName = resourceName;
  }

    abstract execute(scene: BattleScene, battleAnim: BattleAnim): integer;

    abstract getEventType(): string;
}

class AnimTimedSoundEvent extends AnimTimedEvent {
  public volume: number = 100;
  public pitch: number = 100;

  constructor(frameIndex: integer, resourceName: string, source?: any) {
    super(frameIndex, resourceName);

    if (source) {
      this.volume = source.volume;
      this.pitch = source.pitch;
    }
  }

  execute(scene: BattleScene, battleAnim: BattleAnim): integer {
    const soundConfig = { rate: (this.pitch * 0.01), volume: (this.volume * 0.01) };
    if (this.resourceName) {
      try {
        scene.playSound(this.resourceName, soundConfig);
      } catch (err) {
        console.error(err);
      }
      return Math.ceil((scene.sound.get(this.resourceName).totalDuration * 1000) / 33.33);
    } else {
      return Math.ceil((battleAnim.user.cry(soundConfig).totalDuration * 1000) / 33.33);
    }
  }

  getEventType(): string {
    return "AnimTimedSoundEvent";
  }
}

abstract class AnimTimedBgEvent extends AnimTimedEvent {
  public bgX: number = 0;
  public bgY: number = 0;
  public opacity: integer = 0;
  /*public colorRed: integer = 0;
    public colorGreen: integer = 0;
    public colorBlue: integer = 0;
    public colorAlpha: integer = 0;*/
  public duration: integer = 0;
  /*public flashScope: integer = 0;
    public flashRed: integer = 0;
    public flashGreen: integer = 0;
    public flashBlue: integer = 0;
    public flashAlpha: integer = 0;
    public flashDuration: integer = 0;*/

  constructor(frameIndex: integer, resourceName: string, source: any) {
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
  constructor(frameIndex: integer, resourceName: string, source?: any) {
    super(frameIndex, resourceName, source);
  }

  execute(scene: BattleScene, moveAnim: MoveAnim): integer {
    const tweenProps = {};
    if (this.bgX !== undefined) {
      tweenProps["x"] = (this.bgX * 0.5) - 320;
    }
    if (this.bgY !== undefined) {
      tweenProps["y"] = (this.bgY * 0.5) - 284;
    }
    if (this.opacity !== undefined) {
      tweenProps["alpha"] = (this.opacity || 0) / 255;
    }
    if (Object.keys(tweenProps).length) {
      scene.tweens.add(Object.assign({
        targets: moveAnim.bgSprite,
        duration: Utils.getFrameMs(this.duration * 3)
      }, tweenProps));
    }
    return this.duration * 2;
  }

  getEventType(): string {
    return "AnimTimedUpdateBgEvent";
  }
}

class AnimTimedAddBgEvent extends AnimTimedBgEvent {
  constructor(frameIndex: integer, resourceName: string, source?: any) {
    super(frameIndex, resourceName, source);
  }

  execute(scene: BattleScene, moveAnim: MoveAnim): integer {
    if (moveAnim.bgSprite) {
      moveAnim.bgSprite.destroy();
    }
    moveAnim.bgSprite = this.resourceName
      ? scene.add.tileSprite(this.bgX - 320, this.bgY - 284, 896, 576, this.resourceName)
      : scene.add.rectangle(this.bgX - 320, this.bgY - 284, 896, 576, 0);
    moveAnim.bgSprite.setOrigin(0, 0);
    moveAnim.bgSprite.setScale(1.25);
    moveAnim.bgSprite.setAlpha(this.opacity / 255);
    scene.field.add(moveAnim.bgSprite);
    const fieldPokemon = scene.getEnemyPokemon() || scene.getPlayerPokemon();
    if (fieldPokemon?.isOnField()) {
      scene.field.moveBelow(moveAnim.bgSprite as Phaser.GameObjects.GameObject, fieldPokemon);
    }

    scene.tweens.add({
      targets: moveAnim.bgSprite,
      duration: Utils.getFrameMs(this.duration * 3)
    });

    return this.duration * 2;
  }

  getEventType(): string {
    return "AnimTimedAddBgEvent";
  }
}

export const moveAnims = new Map<Moves, AnimConfig | [AnimConfig, AnimConfig]>();
export const chargeAnims = new Map<ChargeAnim, AnimConfig | [AnimConfig, AnimConfig]>();
export const commonAnims = new Map<CommonAnim, AnimConfig>();

export function initCommonAnims(scene: BattleScene): Promise<void> {
  return new Promise(resolve => {
    const commonAnimNames = Utils.getEnumKeys(CommonAnim);
    const commonAnimIds = Utils.getEnumValues(CommonAnim);
    const commonAnimFetches = [];
    for (let ca = 0; ca < commonAnimIds.length; ca++) {
      const commonAnimId = commonAnimIds[ca];
      commonAnimFetches.push(scene.cachedFetch(`./battle-anims/common-${commonAnimNames[ca].toLowerCase().replace(/\_/g, "-")}.json`)
        .then(response => response.json())
        .then(cas => commonAnims.set(commonAnimId, new AnimConfig(cas))));
    }
    Promise.allSettled(commonAnimFetches).then(() => resolve());
  });
}

export function initMoveAnim(scene: BattleScene, move: Moves): Promise<void> {
  return new Promise(resolve => {
    if (moveAnims.has(move)) {
      if (moveAnims.get(move) !== null) {
        resolve();
      } else {
        const loadedCheckTimer = setInterval(() => {
          if (moveAnims.get(move) !== null) {
            const chargeAttr = allMoves[move].getAttrs(ChargeAttr)[0] || allMoves[move].getAttrs(DelayedAttackAttr)[0];
            if (chargeAttr && chargeAnims.get(chargeAttr.chargeAnim) === null) {
              return;
            }
            clearInterval(loadedCheckTimer);
            resolve();
          }
        }, 50);
      }
    } else {
      moveAnims.set(move, null);
      const defaultMoveAnim = allMoves[move] instanceof AttackMove ? Moves.TACKLE : allMoves[move] instanceof SelfStatusMove ? Moves.FOCUS_ENERGY : Moves.TAIL_WHIP;
      const moveName = Moves[move].toLowerCase().replace(/\_/g, "-");
      const fetchAnimAndResolve = (move: Moves) => {
        scene.cachedFetch(`./battle-anims/${moveName}.json`)
          .then(response => {
            if (!response.ok) {
              console.error(`Could not load animation file for move '${moveName}'`, response.status, response.statusText);
              populateMoveAnim(move, moveAnims.get(defaultMoveAnim));
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
            const chargeAttr = allMoves[move].getAttrs(ChargeAttr)[0] || allMoves[move].getAttrs(DelayedAttackAttr)[0];
            if (chargeAttr) {
              initMoveChargeAnim(scene, chargeAttr.chargeAnim).then(() => resolve());
            } else {
              resolve();
            }
          });
      };
      fetchAnimAndResolve(move);
    }
  });
}

export function initMoveChargeAnim(scene: BattleScene, chargeAnim: ChargeAnim): Promise<void> {
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
      scene.cachedFetch(`./battle-anims/${ChargeAnim[chargeAnim].toLowerCase().replace(/\_/g, "-")}.json`)
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

function populateMoveAnim(move: Moves, animSource: any): void {
  const moveAnim = new AnimConfig(animSource);
  if (moveAnims.get(move) === null) {
    moveAnims.set(move, moveAnim);
    return;
  }
  moveAnims.set(move, [ moveAnims.get(move) as AnimConfig, moveAnim ]);
}

function populateMoveChargeAnim(chargeAnim: ChargeAnim, animSource: any) {
  const moveChargeAnim = new AnimConfig(animSource);
  if (chargeAnims.get(chargeAnim) === null) {
    chargeAnims.set(chargeAnim, moveChargeAnim);
    return;
  }
  chargeAnims.set(chargeAnim, [ chargeAnims.get(chargeAnim) as AnimConfig, moveChargeAnim ]);
}

export function loadCommonAnimAssets(scene: BattleScene, startLoad?: boolean): Promise<void> {
  return new Promise(resolve => {
    loadAnimAssets(scene, Array.from(commonAnims.values()), startLoad).then(() => resolve());
  });
}

export function loadMoveAnimAssets(scene: BattleScene, moveIds: Moves[], startLoad?: boolean): Promise<void> {
  return new Promise(resolve => {
    const moveAnimations = moveIds.map(m => moveAnims.get(m) as AnimConfig).flat();
    for (const moveId of moveIds) {
      const chargeAttr = allMoves[moveId].getAttrs(ChargeAttr)[0] || allMoves[moveId].getAttrs(DelayedAttackAttr)[0];
      if (chargeAttr) {
        const moveChargeAnims = chargeAnims.get(chargeAttr.chargeAnim);
        moveAnimations.push(moveChargeAnims instanceof AnimConfig ? moveChargeAnims : moveChargeAnims[0]);
        if (Array.isArray(moveChargeAnims)) {
          moveAnimations.push(moveChargeAnims[1]);
        }
      }
    }
    loadAnimAssets(scene, moveAnimations, startLoad).then(() => resolve());
  });
}

function loadAnimAssets(scene: BattleScene, anims: AnimConfig[], startLoad?: boolean): Promise<void> {
  return new Promise(resolve => {
    const backgrounds = new Set<string>();
    const sounds = new Set<string>();
    for (const a of anims) {
      if (!a.frames?.length) {
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
        scene.loadSpritesheet(a.graphic, "battle_anims", 96);
      }
    }
    for (const bg of backgrounds) {
      scene.loadImage(bg, "battle_anims");
    }
    for (const s of sounds) {
      scene.loadSe(s, "battle_anims", s);
    }
    if (startLoad) {
      scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
      if (!scene.load.isLoading()) {
        scene.load.start();
      }
    } else {
      resolve();
    }
  });
}

interface GraphicFrameData {
    x: number,
    y: number,
    scaleX: number,
    scaleY: number,
    angle: number
}

const userFocusX = 106;
const userFocusY = 148 - 32;
const targetFocusX = 234;
const targetFocusY = 84 - 32;

function transformPoint(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, px: number, py: number): [ x: number, y: number ] {
  const yIntersect = yAxisIntersect(x1, y1, x2, y2, px, py);
  return repositionY(x3, y3, x4, y4, yIntersect[0], yIntersect[1]);
}

function yAxisIntersect(x1: number, y1: number, x2: number, y2: number, px: number, py: number): [ x: number, y: number ] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const x = dx === 0 ? 0 : (px - x1) / dx;
  const y = dy === 0 ? 0 : (py - y1) / dy;
  return [ x, y ];
}

function repositionY(x1: number, y1: number, x2: number, y2: number, tx: number, ty: number): [ x: number, y: number ]  {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const x = x1 + (tx * dx);
  const y = y1 + (ty * dy);
  return [ x, y ];
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
    [key: integer]: Phaser.GameObjects.Sprite[]
}

export abstract class BattleAnim {
  public user: Pokemon;
  public target: Pokemon;
  public sprites: Phaser.GameObjects.Sprite[];
  public bgSprite: Phaser.GameObjects.TileSprite | Phaser.GameObjects.Rectangle;

  private srcLine: number[];
  private dstLine: number[];

  constructor(user: Pokemon, target: Pokemon) {
    this.user = user;
    this.target = target;
    this.sprites = [];
  }

    abstract getAnim(): AnimConfig;

    abstract isOppAnim(): boolean;

    protected isHideUser(): boolean {
      return false;
    }

    protected isHideTarget(): boolean {
      return false;
    }

    private getGraphicFrameData(scene: BattleScene, frames: AnimFrame[]): Map<integer, Map<AnimFrameTarget, GraphicFrameData>> {
      const ret: Map<integer, Map<AnimFrameTarget, GraphicFrameData>> = new Map([
        [AnimFrameTarget.GRAPHIC, new Map<AnimFrameTarget, GraphicFrameData>() ],
        [AnimFrameTarget.USER, new Map<AnimFrameTarget, GraphicFrameData>() ],
        [AnimFrameTarget.TARGET, new Map<AnimFrameTarget, GraphicFrameData>() ]
      ]);

      const isOppAnim = this.isOppAnim();
      const user = !isOppAnim ? this.user : this.target;
      const target = !isOppAnim ? this.target : this.user;

      const userInitialX = user.x;
      const userInitialY = user.y;
      const userHalfHeight = user.getSprite().displayHeight / 2;
      const targetInitialX = target.x;
      const targetInitialY = target.y;
      const targetHalfHeight = target.getSprite().displayHeight / 2;

      let g = 0;
      let u = 0;
      let t = 0;

      for (const frame of frames) {
        let x = frame.x + 106;
        let y = frame.y + 116;
        let scaleX = (frame.zoomX / 100) * (!frame.mirror ? 1 : -1);
        const scaleY = (frame.zoomY / 100);
        switch (frame.focus) {
        case AnimFocus.TARGET:
          x += targetInitialX - targetFocusX;
          y += (targetInitialY - targetHalfHeight) - targetFocusY;
          break;
        case AnimFocus.USER:
          x += userInitialX - userFocusX;
          y += (userInitialY - userHalfHeight) - userFocusY;
          break;
        case AnimFocus.USER_TARGET:
          const point = transformPoint(this.srcLine[0], this.srcLine[1], this.srcLine[2], this.srcLine[3],
            this.dstLine[0], this.dstLine[1] - userHalfHeight, this.dstLine[2], this.dstLine[3] - targetHalfHeight, x, y);
          x = point[0];
          y = point[1];
          if (frame.target === AnimFrameTarget.GRAPHIC && isReversed(this.srcLine[0], this.srcLine[2], this.dstLine[0], this.dstLine[2])) {
            scaleX = scaleX * -1;
          }
          break;
        }
        const angle = -frame.angle;
        const key = frame.target === AnimFrameTarget.GRAPHIC ? g++ : frame.target === AnimFrameTarget.USER ? u++ : t++;
        ret.get(frame.target).set(key, { x: x, y: y, scaleX: scaleX, scaleY: scaleY, angle: angle });
      }

      return ret;
    }

    play(scene: BattleScene, callback?: Function) {
      const isOppAnim = this.isOppAnim();
      const user = !isOppAnim ? this.user : this.target;
      const target = !isOppAnim ? this.target : this.user;

      if (!target.isOnField()) {
        if (callback) {
          callback();
        }
        return;
      }

      const userSprite = user.getSprite();
      const targetSprite = target.getSprite();

      const spriteCache: SpriteCache = {
        [AnimFrameTarget.GRAPHIC]: [],
        [AnimFrameTarget.USER]: [],
        [AnimFrameTarget.TARGET]: []
      };
      const spritePriorities: integer[] = [];

      const cleanUpAndComplete = () => {
        userSprite.setPosition(0, 0);
        userSprite.setScale(1);
        userSprite.setAlpha(1);
        userSprite.pipelineData["tone"] = [ 0.0, 0.0, 0.0, 0.0 ];
        userSprite.setAngle(0);
        targetSprite.setPosition(0, 0);
        targetSprite.setScale(1);
        targetSprite.setAlpha(1);
        targetSprite.pipelineData["tone"] = [ 0.0, 0.0, 0.0, 0.0 ];
        targetSprite.setAngle(0);
        if (!this.isHideUser()) {
          userSprite.setVisible(true);
        }
        if (!this.isHideTarget() && (targetSprite !== userSprite || !this.isHideUser())) {
          targetSprite.setVisible(true);
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

      if (!scene.moveAnimations) {
        return cleanUpAndComplete();
      }

      const anim = this.getAnim();

      const userInitialX = user.x;
      const userInitialY = user.y;
      const targetInitialX = target.x;
      const targetInitialY = target.y;

      this.srcLine = [ userFocusX, userFocusY, targetFocusX, targetFocusY ];
      this.dstLine = [ userInitialX, userInitialY, targetInitialX, targetInitialY ];

      let r = anim.frames.length;
      let f = 0;

      scene.tweens.addCounter({
        duration: Utils.getFrameMs(3),
        repeat: anim.frames.length,
        onRepeat: () => {
          if (!f) {
            userSprite.setVisible(false);
            targetSprite.setVisible(false);
          }

          const spriteFrames = anim.frames[f];
          const frameData = this.getGraphicFrameData(scene, anim.frames[f]);
          let u = 0;
          let t = 0;
          let g = 0;
          for (const frame of spriteFrames) {
            if (frame.target !== AnimFrameTarget.GRAPHIC) {
              const isUser = frame.target === AnimFrameTarget.USER;
              if (isUser && target === user) {
                continue;
              }
              const sprites = spriteCache[isUser ? AnimFrameTarget.USER : AnimFrameTarget.TARGET];
              const spriteSource = isUser ? userSprite : targetSprite;
              if ((isUser ? u : t) === sprites.length) {
                const sprite = scene.addPokemonSprite(isUser ? user : target, 0, 0, spriteSource.texture, spriteSource.frame.name, true);
                [ "spriteColors", "fusionSpriteColors" ].map(k => sprite.pipelineData[k] = (isUser ? user : target).getSprite().pipelineData[k]);
                sprite.setPipelineData("spriteKey", (isUser ? user : target).getBattleSpriteKey());
                sprite.setPipelineData("shiny", (isUser ? user : target).shiny);
                sprite.setPipelineData("variant", (isUser ? user : target).variant);
                sprite.setPipelineData("ignoreFieldPos", true);
                spriteSource.on("animationupdate", (_anim, frame) => sprite.setFrame(frame.textureFrame));
                scene.field.add(sprite);
                sprites.push(sprite);
              }

              const spriteIndex = isUser ? u++ : t++;
              const pokemonSprite = sprites[spriteIndex];
              const graphicFrameData = frameData.get(frame.target).get(spriteIndex);
              pokemonSprite.setPosition(graphicFrameData.x, graphicFrameData.y - ((spriteSource.height / 2) * (spriteSource.parentContainer.scale - 1)));

              pokemonSprite.setAngle(graphicFrameData.angle);
              pokemonSprite.setScale(graphicFrameData.scaleX * spriteSource.parentContainer.scale,  graphicFrameData.scaleY * spriteSource.parentContainer.scale);

              pokemonSprite.setData("locked", frame.locked);

              pokemonSprite.setAlpha(frame.opacity / 255);
              pokemonSprite.pipelineData["tone"] = frame.tone;
              pokemonSprite.setVisible(frame.visible && (isUser ? user.visible : target.visible));
              pokemonSprite.setBlendMode(frame.blendType === AnimBlendType.NORMAL ? Phaser.BlendModes.NORMAL : frame.blendType === AnimBlendType.ADD ? Phaser.BlendModes.ADD : Phaser.BlendModes.DIFFERENCE);
            } else {
              const sprites = spriteCache[AnimFrameTarget.GRAPHIC];
              if (g === sprites.length) {
                const newSprite: Phaser.GameObjects.Sprite = scene.addFieldSprite(0, 0, anim.graphic, 1);
                sprites.push(newSprite);
                scene.field.add(newSprite);
                spritePriorities.push(1);
              }

              const graphicIndex = g++;
              const moveSprite = sprites[graphicIndex];
              if (spritePriorities[graphicIndex] !== frame.priority) {
                spritePriorities[graphicIndex] = frame.priority;
                const setSpritePriority = (priority: integer) => {
                  switch (priority) {
                  case 0:
                    scene.field.moveBelow(moveSprite as Phaser.GameObjects.GameObject, scene.getEnemyPokemon() || scene.getPlayerPokemon());
                    break;
                  case 1:
                    scene.field.moveTo(moveSprite, scene.field.getAll().length - 1);
                    break;
                  case 2:
                    switch (frame.focus) {
                    case AnimFocus.USER:
                      if (this.bgSprite) {
                        scene.field.moveAbove(moveSprite as Phaser.GameObjects.GameObject, this.bgSprite);
                      } else {
                        scene.field.moveBelow(moveSprite as Phaser.GameObjects.GameObject, this.user);
                      }
                      break;
                    case AnimFocus.TARGET:
                      scene.field.moveBelow(moveSprite as Phaser.GameObjects.GameObject, this.target);
                      break;
                    default:
                      setSpritePriority(1);
                      break;
                    }
                    break;
                  case 3:
                    switch (frame.focus) {
                    case AnimFocus.USER:
                      scene.field.moveAbove(moveSprite as Phaser.GameObjects.GameObject, this.user);
                      break;
                    case AnimFocus.TARGET:
                      scene.field.moveAbove(moveSprite as Phaser.GameObjects.GameObject, this.target);
                      break;
                    default:
                      setSpritePriority(1);
                      break;
                    }
                    break;
                  default:
                    setSpritePriority(1);
                  }
                };
                setSpritePriority(frame.priority);
              }
              moveSprite.setFrame(frame.graphicFrame);
              //console.log(AnimFocus[frame.focus]);

              const graphicFrameData = frameData.get(frame.target).get(graphicIndex);
              moveSprite.setPosition(graphicFrameData.x, graphicFrameData.y);
              moveSprite.setAngle(graphicFrameData.angle);
              moveSprite.setScale(graphicFrameData.scaleX,  graphicFrameData.scaleY);

              moveSprite.setAlpha(frame.opacity / 255);
              moveSprite.setVisible(frame.visible);
              moveSprite.setBlendMode(frame.blendType === AnimBlendType.NORMAL ? Phaser.BlendModes.NORMAL : frame.blendType === AnimBlendType.ADD ? Phaser.BlendModes.ADD : Phaser.BlendModes.DIFFERENCE);
            }
          }
          if (anim.frameTimedEvents.has(f)) {
            for (const event of anim.frameTimedEvents.get(f)) {
              r = Math.max((anim.frames.length - f) + event.execute(scene, this), r);
            }
          }
          const targets = Utils.getEnumValues(AnimFrameTarget);
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
            scene.tweens.addCounter({
              duration: Utils.getFrameMs(r),
              onComplete: () => cleanUpAndComplete()
            });
          } else {
            cleanUpAndComplete();
          }
        }
      });
    }
}

export class CommonBattleAnim extends BattleAnim {
  public commonAnim: CommonAnim;

  constructor(commonAnim: CommonAnim, user: Pokemon, target?: Pokemon) {
    super(user, target || user);

    this.commonAnim = commonAnim;
  }

  getAnim(): AnimConfig {
    return commonAnims.get(this.commonAnim);
  }

  isOppAnim(): boolean {
    return false;
  }
}

export class MoveAnim extends BattleAnim {
  public move: Moves;

  constructor(move: Moves, user: Pokemon, target: BattlerIndex) {
    super(user, user.scene.getField()[target]);

    this.move = move;
  }

  getAnim(): AnimConfig {
    return moveAnims.get(this.move) instanceof AnimConfig
      ? moveAnims.get(this.move) as AnimConfig
      : moveAnims.get(this.move)[this.user.isPlayer() ? 0 : 1] as AnimConfig;
  }

  isOppAnim(): boolean {
    return !this.user.isPlayer() && Array.isArray(moveAnims.get(this.move));
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

  constructor(chargeAnim: ChargeAnim, move: Moves, user: Pokemon) {
    super(move, user, 0);

    this.chargeAnim = chargeAnim;
  }

  isOppAnim(): boolean {
    return !this.user.isPlayer() && Array.isArray(chargeAnims.get(this.chargeAnim));
  }

  getAnim(): AnimConfig {
    return chargeAnims.get(this.chargeAnim) instanceof AnimConfig
      ? chargeAnims.get(this.chargeAnim) as AnimConfig
      : chargeAnims.get(this.chargeAnim)[this.user.isPlayer() ? 0 : 1] as AnimConfig;
  }
}

export async function populateAnims() {
  const commonAnimNames = Utils.getEnumKeys(CommonAnim).map(k => k.toLowerCase());
  const commonAnimMatchNames = commonAnimNames.map(k => k.replace(/\_/g, ""));
  const commonAnimIds = Utils.getEnumValues(CommonAnim) as CommonAnim[];
  const chargeAnimNames = Utils.getEnumKeys(ChargeAnim).map(k => k.toLowerCase());
  const chargeAnimMatchNames = chargeAnimNames.map(k => k.replace(/\_/g, " "));
  const chargeAnimIds = Utils.getEnumValues(ChargeAnim) as ChargeAnim[];
  const commonNamePattern = /name: (?:Common:)?(Opp )?(.*)/;
  const moveNameToId = {};
  for (const move of Utils.getEnumValues(Moves).slice(1)) {
    const moveName = Moves[move].toUpperCase().replace(/\_/g, "");
    moveNameToId[moveName] = move;
  }

  const seNames = [];//(await fs.readdir('./public/audio/se/battle_anims/')).map(se => se.toString());

  const animsData = [];//battleAnimRawData.split('!ruby/array:PBAnimation').slice(1);
  for (let a = 0; a < animsData.length; a++) {
    const fields = animsData[a].split("@").slice(1);

    const nameField = fields.find(f => f.startsWith("name: "));

    let isOppMove: boolean;
    let commonAnimId: CommonAnim;
    let chargeAnimId: ChargeAnim;
    if (!nameField.startsWith("name: Move:") && !(isOppMove = nameField.startsWith("name: OppMove:"))) {
      const nameMatch = commonNamePattern.exec(nameField);
      const name = nameMatch[2].toLowerCase();
      if (commonAnimMatchNames.indexOf(name) > -1) {
        commonAnimId = commonAnimIds[commonAnimMatchNames.indexOf(name)];
      } else if (chargeAnimMatchNames.indexOf(name) > -1) {
        isOppMove = nameField.startsWith("name: Opp ");
        chargeAnimId = chargeAnimIds[chargeAnimMatchNames.indexOf(name)];
      }
    }
    const nameIndex = nameField.indexOf(":", 5) + 1;
    const animName = nameField.slice(nameIndex, nameField.indexOf("\n", nameIndex));
    if (!moveNameToId.hasOwnProperty(animName) && !commonAnimId && !chargeAnimId) {
      continue;
    }
    const anim = commonAnimId || chargeAnimId ? new AnimConfig() : new AnimConfig();
    if (anim instanceof AnimConfig) {
      (anim as AnimConfig).id = moveNameToId[animName];
    }
    if (commonAnimId) {
      commonAnims.set(commonAnimId, anim);
    } else if (chargeAnimId) {
      chargeAnims.set(chargeAnimId, !isOppMove ? anim : [ chargeAnims.get(chargeAnimId) as AnimConfig, anim ]);
    } else {
      moveAnims.set(moveNameToId[animName], !isOppMove ? anim as AnimConfig : [ moveAnims.get(moveNameToId[animName]) as AnimConfig, anim as AnimConfig ]);
    }
    for (let f = 0; f < fields.length; f++) {
      const field = fields[f];
      const fieldName = field.slice(0, field.indexOf(":"));
      const fieldData = field.slice(fieldName.length + 1, field.lastIndexOf("\n")).trim();
      switch (fieldName) {
      case "array":
        const framesData = fieldData.split("  - - - ").slice(1);
        for (let fd = 0; fd < framesData.length; fd++) {
          anim.frames.push([]);
          const frameData = framesData[fd];
          const focusFramesData = frameData.split("    - - ");
          for (let tf = 0; tf < focusFramesData.length; tf++) {
            const values = focusFramesData[tf].replace(/      \- /g, "").split("\n");
            const targetFrame = new AnimFrame(parseFloat(values[0]), parseFloat(values[1]), parseFloat(values[2]), parseFloat(values[11]), parseFloat(values[3]),
              parseInt(values[4]) === 1, parseInt(values[6]) === 1, parseInt(values[5]), parseInt(values[7]), parseInt(values[8]), parseInt(values[12]), parseInt(values[13]),
              parseInt(values[14]), parseInt(values[15]), parseInt(values[16]), parseInt(values[17]), parseInt(values[18]), parseInt(values[19]),
              parseInt(values[21]), parseInt(values[22]), parseInt(values[23]), parseInt(values[24]), parseInt(values[20]) === 1, parseInt(values[25]), parseInt(values[26]) as AnimFocus);
            anim.frames[fd].push(targetFrame);
          }
        }
        break;
      case "graphic":
        const graphic = fieldData !== "''" ? fieldData : "";
        anim.graphic = graphic.indexOf(".") > -1
          ? graphic.slice(0, fieldData.indexOf("."))
          : graphic;
        break;
      case "timing":
        const timingEntries = fieldData.split("- !ruby/object:PBAnimTiming ").slice(1);
        for (let t = 0; t < timingEntries.length; t++) {
          const timingData = timingEntries[t].replace(/\n/g, " ").replace(/[ ]{2,}/g, " ").replace(/[a-z]+: ! '', /ig, "").replace(/name: (.*?),/, "name: \"$1\",")
            .replace(/flashColor: !ruby\/object:Color { alpha: ([\d\.]+), blue: ([\d\.]+), green: ([\d\.]+), red: ([\d\.]+)}/, "flashRed: $4, flashGreen: $3, flashBlue: $2, flashAlpha: $1");
          const frameIndex = parseInt(/frame: (\d+)/.exec(timingData)[1]);
          let resourceName = /name: "(.*?)"/.exec(timingData)[1].replace("''", "");
          const timingType = parseInt(/timingType: (\d)/.exec(timingData)[1]);
          let timedEvent: AnimTimedEvent;
          switch (timingType) {
          case 0:
            if (resourceName && resourceName.indexOf(".") === -1) {
              let ext: string;
              [ "wav", "mp3", "m4a" ].every(e => {
                if (seNames.indexOf(`${resourceName}.${e}`) > -1) {
                  ext = e;
                  return false;
                }
                return true;
              });
              if (!ext) {
                ext = ".wav";
              }
              resourceName += `.${ext}`;
            }
            timedEvent = new AnimTimedSoundEvent(frameIndex, resourceName);
            break;
          case 1:
            timedEvent = new AnimTimedAddBgEvent(frameIndex, resourceName.slice(0, resourceName.indexOf(".")));
            break;
          case 2:
            timedEvent = new AnimTimedUpdateBgEvent(frameIndex, resourceName.slice(0, resourceName.indexOf(".")));
            break;
          }
          if (!timedEvent) {
            continue;
          }
          const propPattern = /([a-z]+): (.*?)(?:,|\})/ig;
          let propMatch: RegExpExecArray;
          while ((propMatch = propPattern.exec(timingData))) {
            const prop = propMatch[1];
            let value: any = propMatch[2];
            switch (prop) {
            case "bgX":
            case "bgY":
              value = parseFloat(value);
              break;
            case "volume":
            case "pitch":
            case "opacity":
            case "colorRed":
            case "colorGreen":
            case "colorBlue":
            case "colorAlpha":
            case "duration":
            case "flashScope":
            case "flashRed":
            case "flashGreen":
            case "flashBlue":
            case "flashAlpha":
            case "flashDuration":
              value = parseInt(value);
              break;
            }
            if (timedEvent.hasOwnProperty(prop)) {
              timedEvent[prop] = value;
            }
          }
          if (!anim.frameTimedEvents.has(frameIndex)) {
            anim.frameTimedEvents.set(frameIndex, []);
          }
          anim.frameTimedEvents.get(frameIndex).push(timedEvent);
        }
        break;
      case "position":
        anim.position = parseInt(fieldData);
        break;
      case "hue":
        anim.hue = parseInt(fieldData);
        break;
      }
    }
  }

  // used in commented code
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const animReplacer = (k, v) => {
    if (k === "id" && !v) {
      return undefined;
    }
    if (v instanceof Map) {
      return Object.fromEntries(v);
    }
    if (v instanceof AnimTimedEvent) {
      v["eventType"] = v.getEventType();
    }
    return v;
  };

  const animConfigProps = [ "id", "graphic", "frames", "frameTimedEvents", "position", "hue" ];
  const animFrameProps = [ "x", "y", "zoomX", "zoomY", "angle", "mirror", "visible", "blendType", "target", "graphicFrame", "opacity", "color", "tone", "flash", "locked", "priority", "focus" ];
  const propSets = [ animConfigProps, animFrameProps ];

  // used in commented code
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const animComparator = (a: Element, b: Element) => {
    let props: string[];
    for (let p = 0; p < propSets.length; p++) {
      props = propSets[p];
      const ai = props.indexOf(a.key);
      if (ai === -1) {
        continue;
      }
      const bi = props.indexOf(b.key);

      return ai < bi ? -1 : ai > bi ? 1 : 0;
    }

    return 0;
  };

  /*for (let ma of moveAnims.keys()) {
        const data = moveAnims.get(ma);
        (async () => {
            await fs.writeFile(`../public/battle-anims/${Moves[ma].toLowerCase().replace(/\_/g, '-')}.json`, stringify(data, { replacer: animReplacer, cmp: animComparator, space: '  ' }));
        })();
    }

    for (let ca of chargeAnims.keys()) {
        const data = chargeAnims.get(ca);
        (async () => {
            await fs.writeFile(`../public/battle-anims/${chargeAnimNames[chargeAnimIds.indexOf(ca)].replace(/\_/g, '-')}.json`, stringify(data, { replacer: animReplacer, cmp: animComparator, space: '  ' }));
        })();
    }

    for (let cma of commonAnims.keys()) {
        const data = commonAnims.get(cma);
        (async () => {
            await fs.writeFile(`../public/battle-anims/common-${commonAnimNames[commonAnimIds.indexOf(cma)].replace(/\_/g, '-')}.json`, stringify(data, { replacer: animReplacer, cmp: animComparator, space: '  ' }));
        })();
    }*/
}
