//import { battleAnimRawData } from "./battle-anim-raw-data";
import BattleScene from "./battle-scene";
import { ChargeAttr, Moves, allMoves } from "./move";
import Pokemon, { EnemyPokemon, PlayerPokemon } from "./pokemon";
import * as Utils from "./utils";
//import fs from 'vite-plugin-fs/browser';

export enum AnimFrameTarget {
    USER,
    TARGET,
    GRAPHIC
}

enum AnimFocus {
    USER = 1,
    TARGET,
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
    RAZOR_WIND_CHARGING
}

export enum CommonAnim {
    HEALTH_UP = 2000,
    POISON,
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

export class Anim {
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
        this.x = x;
        this.y = y;
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
                this.x -= 384;
                this.y -= 96;
                break;
            case -1:
                target = AnimFrameTarget.USER;
                this.x -= 128;
                this.y -= 224;
                break;
            default:
                this.x = (this.x - 128) * 0.5;
                this.y = (this.y - 224) * 0.5;
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
        super(frameIndex, resourceName + (resourceName && resourceName.indexOf('.') === -1 ? '.ogg' : ''));

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
            tweenProps['x'] = (this.bgX * 0.5);
        if (this.bgY !== undefined)
            tweenProps['y'] = (this.bgY * 0.5) - 284;
        if (this.opacity !== undefined)
            tweenProps['alpha'] = this.opacity / 255;
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
        moveAnim.bgSprite = scene.add.tileSprite(this.bgX, this.bgY - 284, 768, 576, this.resourceName);
        moveAnim.bgSprite.setOrigin(0, 0);
        moveAnim.bgSprite.setScale(1.25);
        moveAnim.bgSprite.setAlpha(0);
        scene.field.add(moveAnim.bgSprite);
        scene.field.moveBelow(moveAnim.bgSprite, scene.getEnemyPokemon());

        scene.tweens.add({
            targets: moveAnim.bgSprite,
            alpha: 1,
            duration: this.duration * 3,
            useFrames: true
        });

        return this.duration * 2;
    }

    getEventType(): string {
        return 'AnimTimedAddBgEvent';
    }
}

export const moveAnims = new Map<Moves, Anim | [Anim, Anim]>();
export const chargeAnims = new Map<ChargeAnim, Anim | [Anim, Anim]>();
export const commonAnims = new Map<CommonAnim, Anim>();

export function initCommonAnims(): Promise<void> {
    return new Promise(resolve => {
        const commonAnimNames = Utils.getEnumKeys(CommonAnim);
        const commonAnimIds = Utils.getEnumValues(CommonAnim);
        const commonAnimFetches = [];
        for (let ca = 0; ca < commonAnimIds.length; ca++) {
            const commonAnimId = commonAnimIds[ca];
            commonAnimFetches.push(fetch(`./battle-anims/common-${commonAnimNames[ca].toLowerCase().replace(/\_/g, '-')}.json`)
                .then(response => response.json())
                .then(cas => commonAnims.set(commonAnimId, new Anim(cas))));
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
                    const chargeAttr = allMoves[move - 1].getAttrs(ChargeAttr) as ChargeAttr[];
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

function populateMoveAnim(move: Moves, animSource: any) {
    const moveAnim = new Anim(animSource);
    if (moveAnims.get(move) === null) {
        moveAnims.set(move, moveAnim);
        return;
    }
    moveAnims.set(move, [ moveAnims.get(move) as Anim, moveAnim ]);
}

function populateMoveChargeAnim(chargeAnim: ChargeAnim, animSource: any) {
    const moveChargeAnim = new Anim(animSource);
    if (chargeAnims.get(chargeAnim) === null) {
        chargeAnims.set(chargeAnim, moveChargeAnim);
        return;
    }
    chargeAnims.set(chargeAnim, [ chargeAnims.get(chargeAnim) as Anim, moveChargeAnim ]);
}

export function loadCommonAnimAssets(scene: BattleScene, startLoad?: boolean): Promise<void> {
    return new Promise(resolve => {
        loadAnimAssets(scene, Array.from(commonAnims.values()), startLoad).then(() => resolve());
    });
}

export function loadMoveAnimAssets(scene: BattleScene, moveIds: Moves[], startLoad?: boolean): Promise<void> {
    return new Promise(resolve => {
        const moveAnimations = moveIds.map(m => moveAnims.get(m)).flat();
        for (let moveId of moveIds) {
            const chargeAttr = allMoves[moveId - 1].getAttrs(ChargeAttr) as ChargeAttr[];
            if (chargeAttr.length) {
                const moveChargeAnims = chargeAnims.get(chargeAttr[0].chargeAnim);
                moveAnimations.push(moveChargeAnims instanceof Anim ? moveChargeAnims : moveChargeAnims[0]);
                if (Array.isArray(moveChargeAnims))
                    moveAnimations.push(moveChargeAnims[1]);
            }
        }
        loadAnimAssets(scene, moveAnimations, startLoad).then(() => resolve());
    });
}

function loadAnimAssets(scene: BattleScene, anims: Anim[], startLoad?: boolean): Promise<void> {
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
    angle: number
}

export abstract class BattleAnim {
    public user: Pokemon;
    public target: Pokemon;
    public sprites: Phaser.GameObjects.Sprite[];
    public bgSprite: Phaser.GameObjects.TileSprite;

    constructor(user: Pokemon, target: Pokemon) {
        this.user = user;
        this.target = target;
        this.sprites = [];
    }

    abstract getAnim(): Anim;

    abstract isOppAnim(): boolean;

    abstract isReverseCoords(): boolean;

    getGraphicScale(): number {
        return 1;
    }

    private getGraphicFrameData(scene: BattleScene, frames: AnimFrame[]): Map<integer, GraphicFrameData> {
        const ret = new Map<integer, GraphicFrameData>();

        const isOppAnim = this.isOppAnim();
        const user = !isOppAnim ? this.user : this.target;
        const target = !isOppAnim ? this.target : this.user;
        const isReverseCoords = this.isReverseCoords();
        const graphicScale = this.getGraphicScale();

        const userInitialX = user.x;
        const userInitialY = user.y;
        const userHalfHeight = user.getSprite().displayHeight / 2;
        const targetInitialX = target.x;
        const targetInitialY = target.y;
        const targetHalfHeight = target.getSprite().displayHeight / 2;

        let g = 0;

        for (let frame of frames) {
            if (frame.target !== AnimFrameTarget.GRAPHIC)
                continue;

            const xProgress = frame.focus !== AnimFocus.SCREEN ? Math.min(Math.max(frame.x, 0) / 128, 1) : 0;
            const initialX = targetInitialX;
            const initialY = targetInitialY;
            let xOffset = (!isReverseCoords ? (userInitialX - targetInitialX) : (targetInitialX - userInitialX));
            let yOffset = (!isReverseCoords ? (userInitialY - targetInitialY) : (targetInitialY - userInitialY));
            const ySpriteOffset = ((userHalfHeight * (1 - xProgress)) + (targetHalfHeight * xProgress)) * -1;
            if (graphicScale > 1) {
                xOffset -= ((scene.game.canvas.width / 6) * (graphicScale - 1)) / 2;
                yOffset -= ((scene.game.canvas.height / 6) * (graphicScale - 1)) / 2;
            }
            const x = initialX + xOffset * (!isReverseCoords ? 1 : -1) + (frame.x * graphicScale) * (!isReverseCoords ? 1 : -1);
            const y = ((initialY + yOffset * (!isReverseCoords || frame.focus === AnimFocus.USER || frame.focus === AnimFocus.SCREEN ? 1 : -1)
                + (frame.y * graphicScale) * (!isReverseCoords || (frame.focus !== AnimFocus.USER_TARGET) ? 1 : -1) + ySpriteOffset));
            const angle = -frame.angle * (!isReverseCoords ? 1 : -1);
            ret.set(g++, { x: x, y: y, angle: angle });
        }

        return ret;
    }

    play(scene: BattleScene, callback?: Function) {
        const isOppAnim = this.isOppAnim();
        const user = !isOppAnim ? this.user : this.target;
        const target = !isOppAnim ? this.target : this.user;

        const anim = this.getAnim();

        const userInitialX = user.x;
        const userInitialY = user.y;
        const targetInitialX = target.x;
        const targetInitialY = target.y;

        const isReverseCoords = this.isReverseCoords();
        
        let r = anim.frames.length;
        let f = 0;

        const sprites: Phaser.GameObjects.Sprite[] = [];
        const spritePriorities: integer[] = [];

        scene.tweens.addCounter({
            useFrames: true,
            duration: 3,
            repeat: anim.frames.length,
            onRepeat: () => {
                const spriteFrames = anim.frames[f];
                const frameData = this.getGraphicFrameData(scene, anim.frames[f]);
                let g = 0;
                for (let frame of spriteFrames) {
                    switch (frame.target) {
                        case AnimFrameTarget.USER:
                            user.setPosition(userInitialX + frame.x / (!isReverseCoords ? 2 : -2), userInitialY + frame.y / (!isOppAnim ? 2 : -2));
                            break;
                        case AnimFrameTarget.TARGET:
                            target.setPosition(targetInitialX + frame.x / (!isReverseCoords ? 2 : -2), targetInitialY + frame.y / (!isOppAnim ? 2 : -2));
                            break;
                        case AnimFrameTarget.GRAPHIC:
                            let isNewSprite = false;

                            if (g === sprites.length) {
                                const newSprite = scene.add.sprite(0, 0, anim.graphic, 1);
                                sprites.push(newSprite);
                                scene.field.add(newSprite);
                                spritePriorities.push(1);
                                isNewSprite = true;
                            }
                            
                            const graphicIndex = g++;
                            const moveSprite = sprites[graphicIndex];
                            if (spritePriorities[graphicIndex] !== frame.priority) {
                                spritePriorities[graphicIndex] = frame.priority;
                                const setSpritePriority = (priority: integer) => {
                                    switch (priority) {
                                        case 0:
                                            scene.field.moveBelow(moveSprite, scene.getEnemyPokemon());
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
                            const graphicScale = this.getGraphicScale();
                            
                            moveSprite.setPosition(frameData.get(graphicIndex).x, frameData.get(graphicIndex).y);
                            moveSprite.setAngle(frameData.get(graphicIndex).angle);
                            const scaleX = graphicScale * (isReverseCoords === frame.mirror ? 1 : -1);
                            const scaleY = graphicScale;
                            moveSprite.setScale(scaleX, scaleY);

                            moveSprite.setAlpha(frame.opacity / 255);
                            moveSprite.setBlendMode(frame.blendType === AnimBlendType.NORMAL ? Phaser.BlendModes.NORMAL : frame.blendType === AnimBlendType.ADD ? Phaser.BlendModes.ADD : Phaser.BlendModes.DIFFERENCE);
                            break;
                    }
                    if (frame.target !== AnimFrameTarget.GRAPHIC) {
                        const pokemon = frame.target === AnimFrameTarget.USER ? user : target;
                        pokemon.setScale(!frame.mirror ? 1 : -1)
                        pokemon.setAlpha(frame.opacity / 255);
                        pokemon.setAngle(-frame.angle * (!isReverseCoords ? 1 : -1));
                        const zoomScaleX = frame.zoomX / 100;
                        const zoomScaleY = frame.zoomY / 100;
                        const zoomSprite = pokemon.getZoomSprite();
                        zoomSprite.setY(zoomSprite.displayHeight * (zoomScaleY - 1) * 0.5);
                        zoomSprite.setScale(zoomScaleX, zoomScaleY);
                    }
                }
                if (anim.frameTimedEvents.has(f)) {
                    for (let event of anim.frameTimedEvents.get(f))
                        r = Math.max((anim.frames.length - f) + event.execute(scene, this), r);
                }
                if (g < sprites.length) {
                    const removedSprites = sprites.splice(g, sprites.length - g);
                    spritePriorities.splice(g, sprites.length - g);
                    for (let rs of removedSprites)
                        rs.destroy();
                }
                f++;
                r--;
            },
            onComplete: () => {
                const cleanUpAndComplete = () => {
                    user.setPosition(userInitialX, userInitialY);
                    user.setScale(1);
                    user.setAlpha(1);
                    user.setAngle(0);
                    target.setPosition(targetInitialX, targetInitialY);
                    target.setScale(1);
                    target.setAlpha(1);
                    target.setAngle(0);
                    if (this.bgSprite)
                        this.bgSprite.destroy();
                    if (callback)
                        callback();
                };
                for (let ms of sprites) {
                    if (ms)
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

    getAnim(): Anim {
        return commonAnims.get(this.commonAnim);
    }

    isOppAnim(): boolean {
        return false;
    }

    isReverseCoords(): boolean {
        return false;
    }
}

export class MoveAnim extends BattleAnim {
    public move: Moves;
    
    constructor(move: Moves, user: Pokemon, target: Pokemon) {
        super(user, target);

        this.move = move;
    }

    getAnim(): Anim {
        return moveAnims.get(this.move) instanceof Anim
            ? moveAnims.get(this.move) as Anim
            : moveAnims.get(this.move)[this.user.isPlayer() ? 0 : 1] as Anim;
    }

    isOppAnim(): boolean {
        return !this.user.isPlayer() && Array.isArray(moveAnims.get(this.move));
    }

    isReverseCoords(): boolean {
        return !this.user.isPlayer() && !this.isOppAnim();
    }

    getGraphicScale(): number {
        switch (this.move) {
            case Moves.FISSURE:
                return 1.25;
        }
        
        return 1;
    }
}

export class MoveChargeAnim extends MoveAnim {
    private chargeAnim: ChargeAnim;
    
    constructor(chargeAnim: ChargeAnim, move: Moves, user: Pokemon, target: Pokemon) {
        super(move, user, target);

        this.chargeAnim = chargeAnim;
    }

    getAnim(): Anim {
        return chargeAnims.get(this.chargeAnim) instanceof Anim
            ? chargeAnims.get(this.chargeAnim) as Anim
            : chargeAnims.get(this.chargeAnim)[this.user.isPlayer() ? 0 : 1] as Anim;
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
    for (let move of Utils.getEnumValues(Moves)) {
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
            else if (chargeAnimMatchNames.indexOf(name) > -1)
                chargeAnimId = chargeAnimIds[chargeAnimMatchNames.indexOf(name)];
        }
        const nameIndex = fields[1].indexOf(':', 5) + 1;
        const animName = fields[1].slice(nameIndex, fields[1].indexOf('\n', nameIndex));
        if (!moveNameToId.hasOwnProperty(animName) && !commonAnimId && !chargeAnimId)
            continue;
        let anim = new Anim();
        anim.id = commonAnimId || chargeAnimId || moveNameToId[animName];
        if (commonAnimId)
            commonAnims.set(commonAnimId, anim);
        else if (chargeAnimId)
            chargeAnims.set(chargeAnimId, !isOppMove ? anim : [ chargeAnims.get(chargeAnimId) as Anim, anim ]);
        else
            moveAnims.set(moveNameToId[animName], !isOppMove ? anim : [ moveAnims.get(moveNameToId[animName]) as Anim, anim ]);
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
                                values[4] === '1', values[6] === '1', parseInt(values[5]), parseInt(values[7]), parseInt(values[8]), parseInt(values[12]), parseInt(values[13]),
                                parseInt(values[14]), parseInt(values[15]), parseInt(values[16]), parseInt(values[17]), parseInt(values[18]), parseInt(values[19]),
                                parseInt(values[21]), parseInt(values[22]), parseInt(values[23]), parseInt(values[24]), values[20] === '1', parseInt(values[25]), parseInt(values[26]) as AnimFocus);
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
        if (v instanceof Map)
            return Object.fromEntries(v);
        if (v instanceof AnimTimedEvent)
            v['eventType'] = v.getEventType();
        return v;
    }

    /*for (let ma of moveAnims.keys()) {
        const data = moveAnims.get(ma);
        (async () => {
            await fs.writeFile(`./public/battle-anims/${Moves[ma].toLowerCase().replace(/\_/g, '-')}.json`, JSON.stringify(data, animReplacer, '  '));
        })();
    }

    for (let ca of chargeAnims.keys()) {
        const data = chargeAnims.get(ca);
        (async () => {
            await fs.writeFile(`./public/battle-anims/${chargeAnimNames[chargeAnimIds.indexOf(ca)].replace(/\_/g, '-')}.json`, JSON.stringify(data, animReplacer, '  '));
        })();
    }

    for (let cma of commonAnims.keys()) {
        const data = commonAnims.get(cma);
        (async () => {
            await fs.writeFile(`./public/battle-anims/common-${commonAnimNames[commonAnimIds.indexOf(cma)].replace(/\_/g, '-')}.json`, JSON.stringify(data, animReplacer, '  '));
        })();
    }*/
}