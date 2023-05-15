//import { battleAnimRawData } from "./battle-anim-raw-data";
import BattleScene from "../battle-scene";
import { ChargeAttr, Moves, allMoves } from "./move";
import Pokemon from "../pokemon";
import * as Utils from "../utils";
import { BattleTarget } from "../battle";
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
    GEOMANCY_CHARGING
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
    SUNNY = 2100,
    RAIN,
    SANDSTORM,
    HAIL,
    WIND,
    HEAVY_RAIN,
    HARSH_SUN,
    STRONG_WINDS,
    MISTY_TERRAIN = 2110,
    ELECTRIC_TERRAIN,
    GRASSY_TERRAIN,
    PSYCHIC_TERRAIN
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
            this.frames = source.frames;

            const frameTimedEvents = source.frameTimedEvents;
            for (let fte of Object.keys(frameTimedEvents)) {
                const timedEvents: AnimTimedEvent[] = [];
                for (let te of frameTimedEvents[fte]) {
                    let timedEvent: AnimTimedEvent;
                    switch (te.eventType) {
                        case 'AnimTimedSoundEvent':
                            timedEvent = new AnimTimedSoundEvent(te.frameIndex, te.resourceName, te);
                            break;
                        case 'AnimTimedAddBgEvent':
                            timedEvent = new AnimTimedAddBgEvent(te.frameIndex, te.resourceName, te);
                            break;
                        case 'AnimTimedUpdateBgEvent':
                            timedEvent = new AnimTimedUpdateBgEvent(te.frameIndex, te.resourceName, te);
                            break;
                    }
                    timedEvents.push(timedEvent);
                }
                this.frameTimedEvents.set(parseInt(fte), timedEvents);
            }

            this.position = source.position;
            this.hue = source.hue;
        } else
            this.frames = [];
    }

    getSoundResourceNames(): string[] {
        const sounds = new Set<string>();

        for (let ftes of this.frameTimedEvents.values()) {
            for (let fte of ftes) {
                if (fte instanceof AnimTimedSoundEvent && fte.resourceName)
                    sounds.add(fte.resourceName);
            }
        }

        return Array.from(sounds.values());
    }

    getBackgroundResourceNames(): string[] {
        const backgrounds = new Set<string>();

        for (let ftes of this.frameTimedEvents.values()) {
            for (let fte of ftes) {
                if (fte instanceof AnimTimedAddBgEvent && fte.resourceName)
                    backgrounds.add(fte.resourceName);
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
        flashR: integer, flashG: integer, flashB: integer, flashA: integer, locked: boolean, priority: integer, focus: AnimFocus) {
        this.x = (x - 128) * 0.5;
        this.y = (y - 224) * 0.5;
        this.zoomX = zoomX;
        this.zoomY = zoomY;
        this.angle = angle;
        this.mirror = mirror;
        this.visible = visible;
        this.blendType = blendType;
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
        this.opacity = opacity;
        this.color = [ colorR, colorG, colorB, colorA ];
        this.tone = [ toneR, toneG, toneB, toneA ];
        this.flash = [ flashR, flashG, flashB, flashA ];
        this.locked = locked;
        this.priority = priority;
        this.focus = focus;
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
    public volume: number;
    public pitch: number;
    
    constructor(frameIndex: integer, resourceName: string, source?: any) {
        super(frameIndex, resourceName + (resourceName && resourceName.indexOf('.') === -1 ? resourceName.startsWith('PRSFX-') ? '.wav' : '.ogg' : ''));

        if (source) {
            this.volume = source.volume;
            this.pitch = source.pitch;
        } else
            this.pitch = 100;
    }

    execute(scene: BattleScene, battleAnim: BattleAnim): integer {
        const soundConfig = { rate: (this.pitch * 0.01), volume: (this.volume * 0.01) };
        if (this.resourceName) {
            try {
                scene.sound.play(this.resourceName, soundConfig);
            } catch (err) {
                console.error(err);
            }
            return Math.ceil((scene.sound.get(this.resourceName).totalDuration * 1000) / 33.33);
        } else
            return Math.ceil(battleAnim.user.cry(soundConfig) / 33.33);
    }

    getEventType(): string {
        return 'AnimTimedSoundEvent';
    }
}

abstract class AnimTimedBgEvent extends AnimTimedEvent {
    public bgX: number;
    public bgY: number;
    public opacity: integer;
    public colorRed: integer;
    public colorGreen: integer;
    public colorBlue: integer;
    public colorAlpha: integer;
    public duration: integer;
    public flashScope: integer;
    public flashRed: integer;
    public flashGreen: integer;
    public flashBlue: integer;
    public flashAlpha: integer;
    public flashDuration: integer;

    constructor(frameIndex: integer, resourceName: string, source: any) {
        super(frameIndex, resourceName);

        if (source) {
            this.bgX = source.bgX;
            this.bgY = source.bgY;
            this.opacity = source.opacity;
            this.colorRed = source.colorRed;
            this.colorGreen = source.colorGreen;
            this.colorBlue = source.colorBlue;
            this.colorAlpha = source.colorAlpha;
            this.duration = source.duration;
            this.flashScope = source.flashScope;
            this.flashRed = source.flashRed;
            this.flashGreen = source.flashGreen;
            this.flashBlue = source.flashBlue;
            this.flashAlpha = source.flashAlpha;
            this.flashDuration = source.flashDuration;
        }
    }
}

class AnimTimedUpdateBgEvent extends AnimTimedBgEvent {
    constructor(frameIndex: integer, resourceName: string, source?: any) {
        super(frameIndex, resourceName, source);
    }

    execute(scene: BattleScene, moveAnim: MoveAnim): integer {
        const tweenProps = {};
        if (this.bgX !== undefined)
            tweenProps['x'] = (this.bgX * 0.5) - 320;
        if (this.bgY !== undefined)
            tweenProps['y'] = (this.bgY * 0.5) - 284;
        if (this.opacity !== undefined)
            tweenProps['alpha'] = (this.opacity || 0) / 255;
        if (Object.keys(tweenProps).length) {
            scene.tweens.add(Object.assign({
                targets: moveAnim.bgSprite,
                duration: this.duration * 3,
                useFrames: true
            }, tweenProps))
        }
        return this.duration * 2;
    }

    getEventType(): string {
        return 'AnimTimedUpdateBgEvent';
    }
}

class AnimTimedAddBgEvent extends AnimTimedBgEvent {
    constructor(frameIndex: integer, resourceName: string, source?: any) {
        super(frameIndex, resourceName, source);
    }

    execute(scene: BattleScene, moveAnim: MoveAnim): integer {
        if (moveAnim.bgSprite)
            moveAnim.bgSprite.destroy();
        moveAnim.bgSprite = this.resourceName
            ? scene.add.tileSprite(this.bgX - 320, this.bgY - 284, 896, 576, this.resourceName)
            : scene.add.rectangle(this.bgX - 320, this.bgY - 284, 896, 576, 0);
        moveAnim.bgSprite.setOrigin(0, 0);
        moveAnim.bgSprite.setScale(1.25);
        moveAnim.bgSprite.setAlpha(this.opacity / 255);
        scene.field.add(moveAnim.bgSprite);
        scene.field.moveBelow(moveAnim.bgSprite, scene.getEnemyPokemon() || scene.getPlayerPokemon());

        scene.tweens.add({
            targets: moveAnim.bgSprite,
            duration: this.duration * 3,
            useFrames: true
        });

        return this.duration * 2;
    }

    getEventType(): string {
        return 'AnimTimedAddBgEvent';
    }
}

export const moveAnims = new Map<Moves, AnimConfig | [AnimConfig, AnimConfig]>();
export const chargeAnims = new Map<ChargeAnim, AnimConfig | [AnimConfig, AnimConfig]>();
export const commonAnims = new Map<CommonAnim, AnimConfig>();

export function initCommonAnims(): Promise<void> {
    return new Promise(resolve => {
        const commonAnimNames = Utils.getEnumKeys(CommonAnim);
        const commonAnimIds = Utils.getEnumValues(CommonAnim);
        const commonAnimFetches = [];
        for (let ca = 0; ca < commonAnimIds.length; ca++) {
            const commonAnimId = commonAnimIds[ca];
            commonAnimFetches.push(fetch(`./battle-anims/common-${commonAnimNames[ca].toLowerCase().replace(/\_/g, '-')}.json`)
                .then(response => response.json())
                .then(cas => commonAnims.set(commonAnimId, new AnimConfig(cas))));
        }
        Promise.allSettled(commonAnimFetches).then(() => resolve());
    });
}

export function initMoveAnim(move: Moves): Promise<void> {
    return new Promise(resolve => {
        if (moveAnims.has(move)) {
            if (moveAnims.get(move) !== null)
                resolve();
            else {
                let loadedCheckTimer = setInterval(() => {
                    if (moveAnims.get(move) !== null) {
                        clearInterval(loadedCheckTimer);
                        resolve();
                    }
                }, 50);
            }
        } else {
            moveAnims.set(move, null);
            fetch(`./battle-anims/${Moves[move].toLowerCase().replace(/\_/g, '-')}.json`)
                .then(response => response.json())
                .then(ba => {
                    if (Array.isArray(ba)) {
                        populateMoveAnim(move, ba[0]);
                        populateMoveAnim(move, ba[1]);
                    } else
                        populateMoveAnim(move, ba);
                    const chargeAttr = allMoves[move].getAttrs(ChargeAttr) as ChargeAttr[];
                    if (chargeAttr.length)
                        initMoveChargeAnim(chargeAttr[0].chargeAnim).then(() => resolve());
                    else
                        resolve();
                });
        }
    });
}

export function initMoveChargeAnim(chargeAnim: ChargeAnim): Promise<void> {
    return new Promise(resolve => {
        if (chargeAnims.has(chargeAnim)) {
            if (chargeAnims.get(chargeAnim) !== null)
                resolve();
            else {
                let loadedCheckTimer = setInterval(() => {
                    if (chargeAnims.get(chargeAnim) !== null) {
                        clearInterval(loadedCheckTimer);
                        resolve();
                    }
                }, 50);
            }
        } else {
            chargeAnims.set(chargeAnim, null);
            fetch(`./battle-anims/${ChargeAnim[chargeAnim].toLowerCase().replace(/\_/g, '-')}.json`)
                .then(response => response.json())
                .then(ca => {
                    if (Array.isArray(ca)) {
                        populateMoveChargeAnim(chargeAnim, ca[0]);
                        populateMoveChargeAnim(chargeAnim, ca[1]);
                    } else
                        populateMoveChargeAnim(chargeAnim, ca);
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
        for (let moveId of moveIds) {
            const chargeAttr = allMoves[moveId].getAttrs(ChargeAttr) as ChargeAttr[];
            if (chargeAttr.length) {
                const moveChargeAnims = chargeAnims.get(chargeAttr[0].chargeAnim);
                moveAnimations.push(moveChargeAnims instanceof AnimConfig ? moveChargeAnims : moveChargeAnims[0]);
                if (Array.isArray(moveChargeAnims))
                    moveAnimations.push(moveChargeAnims[1]);
            }
        }
        loadAnimAssets(scene, moveAnimations, startLoad).then(() => resolve());
    });
}

function loadAnimAssets(scene: BattleScene, anims: AnimConfig[], startLoad?: boolean): Promise<void> {
    return new Promise(resolve => {
        const backgrounds = new Set<string>();
        const sounds = new Set<string>();
        for (let a of anims) {
            const animSounds = a.getSoundResourceNames();
            for (let ms of animSounds)
                sounds.add(ms);
            const animBackgrounds = a.getBackgroundResourceNames();
            for (let abg of animBackgrounds)
                backgrounds.add(abg);
            if (a.graphic)
                scene.loadSpritesheet(a.graphic, 'battle_anims', 96);
        }
        for (let bg of backgrounds)
            scene.loadImage(bg, 'battle_anims');
        for (let s of sounds)
            scene.loadSe(s, 'battle_anims', s);
        if (startLoad) {
            scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
            if (!scene.load.isLoading()) 
                scene.load.start();
        } else
            resolve();
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
    if (src1 === src2)
        return false;
    if (src1 < src2)
        return dst1 > dst2;
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

        for (let frame of frames) {
            let x = frame.x + 106;
            let y = frame.y + 116;
            let scaleX = (frame.zoomX / 100) * (!frame.mirror ? 1 : -1);
            let scaleY = (frame.zoomY / 100);
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
                    if (frame.target === AnimFrameTarget.GRAPHIC && isReversed(this.srcLine[0], this.srcLine[2], this.dstLine[0], this.dstLine[2]))
                        scaleX = scaleX * -1;
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

        const userSprite = user.getSprite();
        const targetSprite = target.getSprite();

        const anim = this.getAnim();

        const userInitialX = user.x;
        const userInitialY = user.y;
        const targetInitialX = target.x;
        const targetInitialY = target.y;

        this.srcLine = [ userFocusX, userFocusY, targetFocusX, targetFocusY ];
        this.dstLine = [ userInitialX, userInitialY, targetInitialX, targetInitialY ];
        
        let r = anim.frames.length;
        let f = 0;

        const spriteCache: SpriteCache = {
            [AnimFrameTarget.GRAPHIC]: [],
            [AnimFrameTarget.USER]: [],
            [AnimFrameTarget.TARGET]: []
        };
        const spritePriorities: integer[] = [];

        scene.tweens.addCounter({
            useFrames: true,
            duration: 3,
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
                for (let frame of spriteFrames) {
                    if (frame.target !== AnimFrameTarget.GRAPHIC) {
                        const isUser = frame.target === AnimFrameTarget.USER;
                        if (isUser && target === user)
                            continue;
                        const sprites = spriteCache[isUser ? AnimFrameTarget.USER : AnimFrameTarget.TARGET];
                        if ((isUser ? u : t) === sprites.length) {
                            const spriteSource = isUser ? userSprite : targetSprite;
                            let sprite: Phaser.GameObjects.Sprite;
                            sprite = scene.add.sprite(0, 0, spriteSource.texture, spriteSource.frame.name);
                            spriteSource.on('animationupdate', (_anim, frame) => sprite.setFrame(frame.textureFrame));
                            scene.field.add(sprite);
                            sprites.push(sprite);
                        }

                        const spriteIndex = isUser ? u++ : t++;
                        const pokemonSprite =  sprites[spriteIndex];
                        const graphicFrameData = frameData.get(frame.target).get(spriteIndex);
                        pokemonSprite.setPosition(graphicFrameData.x, graphicFrameData.y);
                        
                        pokemonSprite.setAngle(graphicFrameData.angle);
                        pokemonSprite.setScale(graphicFrameData.scaleX,  graphicFrameData.scaleY);

                        pokemonSprite.setData('locked', frame.locked);

                        pokemonSprite.setAlpha(frame.opacity / 255);
                        pokemonSprite.setVisible(frame.visible && (isUser ? user.visible : target.visible));
                        pokemonSprite.setBlendMode(frame.blendType === AnimBlendType.NORMAL ? Phaser.BlendModes.NORMAL : frame.blendType === AnimBlendType.ADD ? Phaser.BlendModes.ADD : Phaser.BlendModes.DIFFERENCE);
                    } else {
                        const sprites = spriteCache[AnimFrameTarget.GRAPHIC];
                        if (g === sprites.length) {
                            let newSprite: Phaser.GameObjects.Sprite = scene.add.sprite(0, 0, anim.graphic, 1);
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
                                        scene.field.moveBelow(moveSprite, scene.getEnemyPokemon() || scene.getPlayerPokemon());
                                        break;
                                    case 1:
                                        scene.field.moveTo(moveSprite, scene.field.getAll().length - 1);
                                        break;
                                    case 2:
                                        switch (frame.focus) {
                                            case AnimFocus.USER:
                                                if (this.bgSprite)
                                                    scene.field.moveAbove(moveSprite, this.bgSprite);
                                                else
                                                    scene.field.moveBelow(moveSprite, this.user);
                                                break;
                                            case AnimFocus.TARGET:
                                                scene.field.moveBelow(moveSprite, this.target);
                                                break;
                                            default:
                                                setSpritePriority(1);
                                                break;
                                        }
                                        break;
                                    case 3:
                                        switch (frame.focus) {
                                            case AnimFocus.USER:
                                                scene.field.moveAbove(moveSprite, this.user);
                                                break;
                                            case AnimFocus.TARGET:
                                                scene.field.moveAbove(moveSprite, this.target);
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
                    for (let event of anim.frameTimedEvents.get(f))
                        r = Math.max((anim.frames.length - f) + event.execute(scene, this), r);
                }
                const targets = Utils.getEnumValues(AnimFrameTarget);
                for (let i of targets) {
                    const count = i === AnimFrameTarget.GRAPHIC ? g : i === AnimFrameTarget.USER ? u : t;
                    if (count < spriteCache[i].length) {
                        const removedSprites = spriteCache[i].splice(count, spriteCache[i].length - count);
                        if (i === AnimFrameTarget.GRAPHIC)
                            spritePriorities.splice(count, spriteCache[i].length - count);
                        for (let rs of removedSprites) {
                            if (!rs.getData('locked') as boolean)
                                rs.destroy();
                        }
                    }
                }
                f++;
                r--;
            },
            onComplete: () => {
                const cleanUpAndComplete = () => {
                    userSprite.setPosition(0, 0);
                    userSprite.setScale(1);
                    userSprite.setAlpha(1);
                    userSprite.setAngle(0);
                    targetSprite.setPosition(0, 0);
                    targetSprite.setScale(1);
                    targetSprite.setAlpha(1);
                    targetSprite.setAngle(0);
                    userSprite.setVisible(true);
                    targetSprite.setVisible(true);
                    for (let ms of Object.values(spriteCache).flat()) {
                        if (ms)
                            ms.destroy();
                    }
                    if (this.bgSprite)
                        this.bgSprite.destroy();
                    if (callback)
                        callback();
                };
                for (let ms of Object.values(spriteCache).flat()) {
                    if (ms && !ms.getData('locked'))
                        ms.destroy();
                }
                if (r) {
                    scene.tweens.addCounter({
                        duration: r,
                        useFrames: true,
                        onComplete: () => cleanUpAndComplete()
                    });
                } else
                    cleanUpAndComplete();
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
    
    constructor(move: Moves, user: Pokemon, target: BattleTarget) {
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

export function populateAnims() {
    return;
    const commonAnimNames = Utils.getEnumKeys(CommonAnim).map(k => k.toLowerCase());
    const commonAnimMatchNames = commonAnimNames.map(k => k.replace(/\_/g, ''));
    const commonAnimIds = Utils.getEnumValues(CommonAnim) as CommonAnim[];
    const chargeAnimNames = Utils.getEnumKeys(ChargeAnim).map(k => k.toLowerCase());
    const chargeAnimMatchNames = chargeAnimNames.map(k => k.replace(/\_/g, ' '));
    const chargeAnimIds = Utils.getEnumValues(ChargeAnim) as ChargeAnim[];
    const commonNamePattern = /name: (?:Common:)?(Opp )?(.*)/;
    const moveNameToId = {};
    for (let move of Utils.getEnumValues(Moves).slice(1)) {
        const moveName = Moves[move].toUpperCase().replace(/\_/g, '');
        moveNameToId[moveName] = move;
    }
    const animsData = [];//battleAnimRawData.split('!ruby/array:PBAnimation').slice(1);
    for (let a = 0; a < animsData.length; a++) {
        const fields = animsData[a].split('@').slice(1);
        
        let isOppMove: boolean;
        let commonAnimId: CommonAnim;
        let chargeAnimId: ChargeAnim;
        if (!fields[1].startsWith('name: Move:') && !(isOppMove = fields[1].startsWith('name: OppMove:'))) {
            const nameMatch = commonNamePattern.exec(fields[1]);
            const name = nameMatch[2].toLowerCase();
            if (commonAnimMatchNames.indexOf(name) > -1)
                commonAnimId = commonAnimIds[commonAnimMatchNames.indexOf(name)];
            else if (chargeAnimMatchNames.indexOf(name) > -1) {
                isOppMove = fields[1].startsWith('name: Opp ');
                chargeAnimId = chargeAnimIds[chargeAnimMatchNames.indexOf(name)];
            }
        }
        const nameIndex = fields[1].indexOf(':', 5) + 1;
        const animName = fields[1].slice(nameIndex, fields[1].indexOf('\n', nameIndex));
        if (!moveNameToId.hasOwnProperty(animName) && !commonAnimId && !chargeAnimId)
            continue;
        let anim = commonAnimId || chargeAnimId ? new AnimConfig() : new AnimConfig();
        if (anim instanceof AnimConfig)
            (anim as AnimConfig).id = moveNameToId[animName];
        if (commonAnimId)
            commonAnims.set(commonAnimId, anim);
        else if (chargeAnimId)
            chargeAnims.set(chargeAnimId, !isOppMove ? anim : [ chargeAnims.get(chargeAnimId) as AnimConfig, anim ]);
        else
            moveAnims.set(moveNameToId[animName], !isOppMove ? anim as AnimConfig : [ moveAnims.get(moveNameToId[animName]) as AnimConfig, anim as AnimConfig ]);
        for (let f = 0; f < fields.length; f++) {
            const field = fields[f];
            const fieldName = field.slice(0, field.indexOf(':'));
            const fieldData = field.slice(fieldName.length + 1, field.lastIndexOf('\n')).trim();
            switch (fieldName) {
                case 'array':
                    const framesData = fieldData.split('  - - - ').slice(1);
                    for (let fd = 0; fd < framesData.length; fd++) {
                        anim.frames.push([]);
                        const frameData = framesData[fd];
                        const focusFramesData = frameData.split('    - - ');
                        for (let tf = 0; tf < focusFramesData.length; tf++) {
                            const values = focusFramesData[tf].replace(/      \- /g, '').split('\n');
                            const targetFrame = new AnimFrame(parseFloat(values[0]), parseFloat(values[1]), parseFloat(values[2]), parseFloat(values[11]), parseFloat(values[3]),
                                parseInt(values[4]) === 1, parseInt(values[6]) === 1, parseInt(values[5]), parseInt(values[7]), parseInt(values[8]), parseInt(values[12]), parseInt(values[13]),
                                parseInt(values[14]), parseInt(values[15]), parseInt(values[16]), parseInt(values[17]), parseInt(values[18]), parseInt(values[19]),
                                parseInt(values[21]), parseInt(values[22]), parseInt(values[23]), parseInt(values[24]), parseInt(values[20]) === 1, parseInt(values[25]), parseInt(values[26]) as AnimFocus);
                            anim.frames[fd].push(targetFrame);
                        }
                    }
                    break;
                case 'graphic':
                    anim.graphic = fieldData !== "''" ? fieldData.slice(0, fieldData.indexOf('.')) : '';
                    break;
                case 'timing':
                    const timingEntries = fieldData.split('- !ruby/object:PBAnimTiming ').slice(1);
                    for (let t = 0; t < timingEntries.length; t++) {
                        const timingData = timingEntries[t].replace(/\n/g, ' ').replace(/[ ]{2,}/g, ' ').replace(/[a-z]+: ! '', /ig, '').replace(/name: (.*?),/, 'name: "$1",')
                            .replace(/flashColor: !ruby\/object:Color { alpha: ([\d\.]+), blue: ([\d\.]+), green: ([\d\.]+), red: ([\d\.]+)}/, 'flashRed: $4, flashGreen: $3, flashBlue: $2, flashAlpha: $1');
                        const frameIndex = parseInt(/frame: (\d+)/.exec(timingData)[1]);
                        const resourceName = /name: "(.*?)"/.exec(timingData)[1].replace("''", '');
                        const timingType = parseInt(/timingType: (\d)/.exec(timingData)[1]);
                        let timedEvent: AnimTimedEvent;
                        switch (timingType) {
                            case 0:
                                timedEvent = new AnimTimedSoundEvent(frameIndex, resourceName);
                                break;
                            case 1:
                                timedEvent = new AnimTimedAddBgEvent(frameIndex, resourceName.slice(0, resourceName.indexOf('.')));
                                break;
                            case 2:
                                timedEvent = new AnimTimedUpdateBgEvent(frameIndex, resourceName.slice(0, resourceName.indexOf('.')));
                                break;
                        }
                        if (!timedEvent)
                            continue;
                        const propPattern = /([a-z]+): (.*?)(?:,|\})/ig;
                        let propMatch: RegExpExecArray;
                        while ((propMatch = propPattern.exec(timingData))) {
                            const prop = propMatch[1];
                            let value: any = propMatch[2];
                            switch (prop) {
                                case 'bgX':
                                case 'bgY':
                                    value = parseFloat(value);
                                    break;
                                case 'volume':
                                case 'pitch':
                                case 'opacity':
                                case 'colorRed':
                                case 'colorGreen':
                                case 'colorBlue':
                                case 'colorAlpha':
                                case 'duration':
                                case 'flashScope':
                                case 'flashRed':
                                case 'flashGreen':
                                case 'flashBlue':
                                case 'flashAlpha':
                                case 'flashDuration':
                                    value = parseInt(value);
                                    break;
                            }
                            if (timedEvent.hasOwnProperty(prop))
                                timedEvent[prop] = value;
                        }
                        if (!anim.frameTimedEvents.has(frameIndex))
                            anim.frameTimedEvents.set(frameIndex, []);
                        anim.frameTimedEvents.get(frameIndex).push(timedEvent);
                    }
                    break;
                case 'position':
                    anim.position = parseInt(fieldData);
                    break;
                case 'hue':
                    anim.hue = parseInt(fieldData);
                    break;
            }
        }
    }

    const animReplacer = (k, v) => {
        if (k === 'id' && !v)
            return undefined;
        if (v instanceof Map)
            return Object.fromEntries(v);
        if (v instanceof AnimTimedEvent)
            v['eventType'] = v.getEventType();
        return v;
    }

    /*for (let ma of moveAnims.keys()) {
        const data = moveAnims.get(ma);
        (async () => {
            await fs.writeFile(`../public/battle-anims/${Moves[ma].toLowerCase().replace(/\_/g, '-')}.json`, JSON.stringify(data, animReplacer, '  '));
        })();
    }

    for (let ca of chargeAnims.keys()) {
        const data = chargeAnims.get(ca);
        (async () => {
            await fs.writeFile(`../public/battle-anims/${chargeAnimNames[chargeAnimIds.indexOf(ca)].replace(/\_/g, '-')}.json`, JSON.stringify(data, animReplacer, '  '));
        })();
    }

    for (let cma of commonAnims.keys()) {
        const data = commonAnims.get(cma);
        (async () => {
            await fs.writeFile(`../public/battle-anims/common-${commonAnimNames[commonAnimIds.indexOf(cma)].replace(/\_/g, '-')}.json`, JSON.stringify(data, animReplacer, '  '));
        })();
    }*/
}