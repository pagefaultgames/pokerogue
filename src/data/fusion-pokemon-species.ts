import { globalScene } from "#app/global-scene";
import { GrowthRate } from "#data/exp";
import { deriveFusionSpecies, type FusionDerived } from "#data/fusion-derivation";
import { PokemonSpecies } from "#data/pokemon-species";
import { DexAttr } from "#enums/dex-attr";
import type { SpeciesId } from "#enums/species-id";
import { bakePaletteSwappedTexture, computeFusionPaletteMapping } from "#sprites/fusion-palette";
import { bakeShinyFusionTexture } from "#sprites/fusion-shiny-bake";
import {
  ensureBackSpriteFromFrontMirror,
  ensureFusionSpriteLoaded,
  hasLoadedFusionSprite,
  loadedFusionSpriteKey,
} from "#sprites/fusion-sprite-loader";
import { fusionSpriteAtlasPath } from "#sprites/fusion-sprite-paths";
import { ensureVariantDataLoaded } from "#sprites/fusion-variant-data";
import type { Variant } from "#sprites/variant";
import { RibbonData } from "#system/ribbons/ribbon-data";
import { FusionSettingKeys, onFusionSettingChange } from "#system/settings/fusion-settings";
import {
  getFusionStarterAbilityAttr,
  getFusionStarterClassicWinCount,
  getFusionStarterEggMoves,
  getFusionStarterGenders,
  getFusionStarterIvs,
  getFusionStarterNatureAttr,
  getFusionStarterPassiveAttr,
  getFusionStarterRibbonsHex,
  getFusionStarterShinyVariants,
  getFusionStarterValueReduction,
  getPreferredFusionVariant,
  isFusionStarterUnlocked,
} from "#system/unlocked-fusion-starters";
import type { DexEntry } from "#types/dex-data";
import type { StarterDataEntry } from "#types/save-data";
import { getFusedSpeciesName, getPokemonSpecies, setFusionRegistryLookup } from "#utils/pokemon-utils";
import i18next from "i18next";

// Stat-formula changes flip the MAXIMUM +1 cost penalty and re-derive stats;
// refresh cached fusion entries so new values surface without a reload.
onFusionSettingChange(key => {
  if (key !== FusionSettingKeys.Stat_Formula) {
    return;
  }
  // globalScene may be undefined during early module init.
  globalScene?.gameData?.installFusionStarterMaps?.();
});

const FUSION_ID_BASE = 100_000;
const HEAD_STRIDE = 10_000;

export function fusionSyntheticSpeciesId(headId: SpeciesId, bodyId: SpeciesId): number {
  return FUSION_ID_BASE + headId * HEAD_STRIDE + bodyId;
}

export function decodeFusionSpeciesId(id: number): { headId: SpeciesId; bodyId: SpeciesId } | null {
  if (id < FUSION_ID_BASE) {
    return null;
  }
  const rest = id - FUSION_ID_BASE;
  const headId = Math.floor(rest / HEAD_STRIDE) as SpeciesId;
  const bodyId = (rest % HEAD_STRIDE) as SpeciesId;
  return { headId, bodyId };
}

export function isFusionSyntheticSpeciesId(id: number): boolean {
  return id >= FUSION_ID_BASE;
}

export class FusionPokemonSpecies extends PokemonSpecies {
  public readonly headSpecies: PokemonSpecies;
  public readonly bodySpecies: PokemonSpecies;
  public readonly derived: FusionDerived;

  constructor(head: PokemonSpecies, body: PokemonSpecies) {
    const derived = deriveFusionSpecies(head, body);
    super(
      fusionSyntheticSpeciesId(head.speciesId, body.speciesId) as SpeciesId,
      head.generation,
      false, // subLegendary — fusions inherit no legendary tier
      false, // legendary
      false, // mythical
      head.category,
      derived.type1,
      derived.type2,
      head.height,
      head.weight,
      derived.ability1,
      derived.ability2,
      derived.abilityHidden,
      derived.baseTotal,
      derived.baseStats[0],
      derived.baseStats[1],
      derived.baseStats[2],
      derived.baseStats[3],
      derived.baseStats[4],
      derived.baseStats[5],
      head.catchRate,
      head.baseFriendship,
      head.baseExp,
      head.growthRate ?? GrowthRate.MEDIUM_FAST,
      head.malePercent,
      false, // genderDiffs
      false, // canChangeForm
    );
    this.headSpecies = head;
    this.bodySpecies = body;
    this.derived = derived;
    this.name = getFusedSpeciesName(head.name, body.name);
  }

  isFusion(): this is FusionPokemonSpecies {
    return true;
  }

  // Bypass i18next lookup; synthetic id has no `pokemon:` key.
  override localize(): void {
    if (this.headSpecies && this.bodySpecies) {
      this.name = getFusedSpeciesName(this.headSpecies.name, this.bodySpecies.name);
      this.category = i18next.t("pokemonCategory:fusionCategory", {
        defaultValue: this.headSpecies.category,
      });
    }
  }

  // Shiny/variant are ignored on purpose: vanilla mini sprites don't reliably
  // recolor on shiny toggle (`checkIconId` silently falls back to non-shiny
  // when a species lacks the `Ns` frame), so fusion icons stay non-shiny too.
  // Falls back to the body's atlas while the bake isn't ready; the starter
  // grid re-evaluates next frame.
  override getIconAtlasKey(formIndex?: number, _shiny?: boolean, _variant?: number): string {
    const baked = this.tryBakeFusionIcon(formIndex ?? 0);
    return baked ?? this.bodySpecies.getIconAtlasKey(formIndex, false, 0);
  }

  override getIconId(female: boolean, formIndex?: number, _shiny?: boolean, _variant?: number): string {
    if (this.tryBakeFusionIcon(formIndex ?? 0)) {
      // Phaser canvas textures expose their default frame as "__BASE".
      return "__BASE";
    }
    return this.bodySpecies.getIconId(female, formIndex, false, 0);
  }

  // Idempotent; returns null while either parent's icon atlas is loading.
  // Composition mirrors BattleScene.addPokemonIcon's stacked split.
  private tryBakeFusionIcon(formIndex: number): string | null {
    const headAtlas = this.headSpecies.getIconAtlasKey(formIndex, false, 0);
    const bodyAtlas = this.bodySpecies.getIconAtlasKey(formIndex, false, 0);
    const headFrameId = this.headSpecies.getIconId(false, formIndex, false, 0);
    const bodyFrameId = this.bodySpecies.getIconId(false, formIndex, false, 0);
    const outKey = `fusion_icon__${this.headSpecies.speciesId}__${this.bodySpecies.speciesId}__f${formIndex}`;
    if (globalScene.textures.exists(outKey)) {
      return outKey;
    }
    if (!globalScene.textures.exists(headAtlas) || !globalScene.textures.exists(bodyAtlas)) {
      return null;
    }
    const headTex = globalScene.textures.get(headAtlas);
    const bodyTex = globalScene.textures.get(bodyAtlas);
    const headFrame = headTex.frames[headFrameId];
    const bodyFrame = bodyTex.frames[bodyFrameId];
    if (!headFrame || !bodyFrame) {
      return null;
    }
    const splitRow = (headFrame.cutHeight <= bodyFrame.cutHeight ? Math.ceil : Math.floor)(
      (headFrame.cutHeight + bodyFrame.cutHeight) / 4,
    );
    if (splitRow <= 0 || splitRow >= bodyFrame.cutHeight) {
      return null;
    }
    // Icon atlases are trim-packed: each frame's pixels are tight-cropped and
    // the nominal box is the full un-trimmed sourceSize. The composite must be
    // sized as the source box and each half drawn at its own trim offset,
    // otherwise halves slide off-center against the grid slot.
    const dimsOf = (frame: Phaser.Textures.Frame) => {
      const sourceSize = (frame as unknown as { data?: { sourceSize?: { w: number; h: number } } }).data?.sourceSize;
      return {
        fullW: sourceSize?.w ?? frame.cutWidth,
        fullH: sourceSize?.h ?? frame.cutHeight,
        offsetX: frame.x ?? 0,
        offsetY: frame.y ?? 0,
      };
    };
    const hd = dimsOf(headFrame);
    const bd = dimsOf(bodyFrame);
    // Both halves render at the averaged trim Y so the seam aligns the same
    // way addPokemonIcon's stacked sprite does.
    const avgOffsetY = Math.floor((hd.offsetY + bd.offsetY) / 2);
    const fullW = Math.max(hd.fullW, bd.fullW);
    const fullH = Math.max(hd.fullH, bd.fullH);
    const canvas = document.createElement("canvas");
    canvas.width = fullW;
    canvas.height = fullH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    const headImg = headTex.getSourceImage() as HTMLImageElement;
    const bodyImg = bodyTex.getSourceImage() as HTMLImageElement;
    ctx.drawImage(
      headImg,
      headFrame.cutX,
      headFrame.cutY,
      headFrame.cutWidth,
      splitRow,
      hd.offsetX,
      avgOffsetY,
      headFrame.cutWidth,
      splitRow,
    );
    ctx.drawImage(
      bodyImg,
      bodyFrame.cutX,
      bodyFrame.cutY + splitRow,
      bodyFrame.cutWidth,
      bodyFrame.cutHeight - splitRow,
      bd.offsetX,
      avgOffsetY + splitRow,
      bodyFrame.cutWidth,
      bodyFrame.cutHeight - splitRow,
    );
    globalScene.textures.addCanvas(outKey, canvas);
    return outKey;
  }

  override getPassiveAbility(): number {
    return this.derived.passive;
  }

  override getLevelMoves(): typeof this.derived.levelMoves {
    return this.derived.levelMoves.slice() as typeof this.derived.levelMoves;
  }

  // Fusions don't pre-evolve; they are the starter form.
  override getRootSpeciesId(_forStarter = false): SpeciesId {
    return this.speciesId as SpeciesId;
  }

  // Vanilla reads species.forms via getPokemonSpecies, which doesn't resolve
  // synthetic ids. Fusions have no forms; return the speciesId as the key.
  override getVariantDataIndex(_formIndex?: number): string | number {
    return this.speciesId;
  }

  // Vanilla indexes SpeciesId[speciesId] which is undefined for synthetic ids.
  override getFormNameToDisplay(_formIndex = 0, _append = false): string {
    return "";
  }

  // Vanilla indexes SpeciesId[speciesId] for a regional prefix and crashes on
  // synthetic ids. Fusions already carry a `<head>/<body>` display name.
  override getExpandedSpeciesName(): string {
    return this.name;
  }

  // Sprite resolution: try the custom IF-style fusion sprite first; on 404
  // fall back to the body's sprite (matches the icon, keeps visual identity
  // coherent when no custom art exists).

  private fusionPairForSprite(): { headId: SpeciesId; bodyId: SpeciesId } {
    return { headId: this.headSpecies.speciesId, bodyId: this.bodySpecies.speciesId };
  }

  override getSpriteId(female: boolean, formIndex?: number, shiny?: boolean, variant?: number, back?: boolean): string {
    const pair = this.fusionPairForSprite();
    const preferredVariant = getPreferredFusionVariant(pair);
    if (hasLoadedFusionSprite(pair, !!back, preferredVariant)) {
      const loaded = loadedFusionSpriteKey(pair, !!back, preferredVariant);
      if (loaded) {
        return loaded.replace(/^pkmn__/, "");
      }
    }
    const baked = this.tryBakeFusionBigSprite(female, formIndex ?? 0, shiny ?? false, variant ?? 0, !!back);
    if (baked) {
      return baked.replace(/^pkmn__/, "");
    }
    return this.bodySpecies.getSpriteId(female, formIndex, shiny, variant, back);
  }

  override getSpriteKey(
    female: boolean,
    formIndex?: number,
    shiny?: boolean,
    variant?: number,
    back?: boolean,
  ): string {
    const pair = this.fusionPairForSprite();
    const preferredVariant = getPreferredFusionVariant(pair);
    if (hasLoadedFusionSprite(pair, !!back, preferredVariant)) {
      const loaded = loadedFusionSpriteKey(pair, !!back, preferredVariant);
      if (loaded) {
        // IF doesn't ship shiny pair sprites; bake a partial recolor by
        // applying the head's variant palette mapping.
        if (shiny) {
          const shinyKey = this.tryBakeShinyIfSprite(loaded, variant ?? 0, !!back);
          if (shinyKey) {
            return shinyKey;
          }
        }
        return loaded;
      }
    }
    const baked = this.tryBakeFusionBigSprite(female, formIndex ?? 0, shiny ?? false, variant ?? 0, !!back);
    if (baked) {
      return baked;
    }
    return this.bodySpecies.getSpriteKey(female, formIndex, shiny, variant, back);
  }

  // Returns null when neither parent has variant data loaded yet; caller
  // falls back to the non-shiny IF sprite.
  private tryBakeShinyIfSprite(loadedKey: string, variantIndex: number, _back: boolean): string | null {
    const outKey = `${loadedKey}__shiny${variantIndex}`;
    return bakeShinyFusionTexture(
      loadedKey,
      this.headSpecies.speciesId,
      this.bodySpecies.speciesId,
      variantIndex,
      outKey,
    );
  }

  override getSpriteAtlasPath(
    female: boolean,
    formIndex?: number,
    shiny?: boolean,
    variant?: number,
    back?: boolean,
  ): string {
    const pair = this.fusionPairForSprite();
    const preferredVariant = getPreferredFusionVariant(pair);
    if (hasLoadedFusionSprite(pair, !!back, preferredVariant)) {
      const ifPath = fusionSpriteAtlasPath(pair, !!back, preferredVariant);
      if (ifPath !== null) {
        return ifPath;
      }
    }
    // Baked sprites live in Phaser's texture cache only; the on-disk path
    // is just the body's.
    return this.bodySpecies.getSpriteAtlasPath(female, formIndex, shiny, variant, back);
  }

  // Body's full sprite with head's palette swapped in. Used when no IF sprite
  // exists for this pair (e.g. mid-run evolution). Idempotent.
  private tryBakeFusionBigSprite(
    female: boolean,
    formIndex: number,
    shiny: boolean,
    variant: number,
    back: boolean,
  ): string | null {
    const bodyKey = this.bodySpecies.getSpriteKey(female, formIndex, shiny, variant, back);
    const headKey = this.headSpecies.getSpriteKey(female, formIndex, shiny, variant, back);
    const outKey = `pkmn__fusion_baked__${this.headSpecies.speciesId}__${this.bodySpecies.speciesId}__f${formIndex}_s${shiny ? 1 : 0}_v${variant}_${back ? "b" : "f"}`;
    if (globalScene.textures.exists(outKey)) {
      return outKey;
    }
    if (!globalScene.textures.exists(bodyKey) || !globalScene.textures.exists(headKey)) {
      return null;
    }
    const mapping = computeFusionPaletteMapping(bodyKey, headKey);
    if (!mapping) {
      return null;
    }
    return bakePaletteSwappedTexture(bodyKey, mapping, outKey);
  }

  override getCryKey(formIndex?: number): string {
    return this.headSpecies.getCryKey(formIndex);
  }

  override async loadAssets(
    female: boolean,
    formIndex?: number,
    shiny = false,
    variant?: Variant,
    startLoad = false,
    back = false,
  ): Promise<void> {
    const pair = this.fusionPairForSprite();
    const preferredVariant = getPreferredFusionVariant(pair);
    // Need both parents' atlases cached before the palette bake can run, or
    // the body's raw un-recolored sprite leaks through. Variant JSONs are
    // also pre-loaded — vanilla only fetches them on a shiny Pokemon's
    // loadAssets, but starter-select previews have no Pokemon instance.
    const tasks: Promise<unknown>[] = [
      ensureFusionSpriteLoaded(pair, back, preferredVariant),
      this.bodySpecies.loadAssets(female, formIndex, shiny, variant, startLoad, back),
      this.headSpecies.loadAssets(female, formIndex, shiny, variant, startLoad, back),
      ensureVariantDataLoaded(this.headSpecies.speciesId as number),
      ensureVariantDataLoaded(this.bodySpecies.speciesId as number),
    ];
    if (back) {
      // Mirror needs the front texture in cache to flip; ensure it's loaded
      // even when the first preview is back-on.
      tasks.push(ensureFusionSpriteLoaded(pair, false, preferredVariant));
    }
    await Promise.allSettled(tasks);
    if (back) {
      // Registers a back texture by horizontally flipping the front, matching
      // what Infinite Fusion does when no hand-drawn back exists.
      ensureBackSpriteFromFrontMirror(pair, preferredVariant);
    }
  }
}

// Parallel registry of runtime-built FusionPokemonSpecies instances. Vanilla's
// getPokemonSpecies searches `allSpecies` and returns undefined for synthetic
// ids; the patched lookup consults this map.
const fusionRegistry = new Map<number, FusionPokemonSpecies>();

export function getFusionSpeciesFromRegistry(id: number): FusionPokemonSpecies | undefined {
  return fusionRegistry.get(id);
}

export function registerFusionSpecies(species: FusionPokemonSpecies): void {
  fusionRegistry.set(species.speciesId as number, species);
}

setFusionRegistryLookup(getFusionSpeciesFromRegistry);

export function isFusionSpecies(s: PokemonSpecies): s is FusionPokemonSpecies {
  return (s as { isFusion?: () => boolean }).isFusion?.() === true;
}

/** Returns null when either parent isn't in the vanilla species registry. */
export function buildFusionSpecies(headId: SpeciesId, bodyId: SpeciesId): FusionPokemonSpecies | null {
  const head = getPokemonSpecies(headId);
  const body = getPokemonSpecies(bodyId);
  if (!head || !body) {
    return null;
  }
  return new FusionPokemonSpecies(head, body);
}

// Synthetic fusion ids (>= 100_000) intentionally don't live in dexData /
// starterData (orthogonality invariant), but vanilla paths read those maps
// directly by id. These helpers produce neutral defaults so consumers work
// without each having to know about fusions.

// IVs come from the per-pair record (set by the splicer to per-stat max of
// head & body), defaulting to zeros for pairs seeded pre-IV-capture wiring.
export function getSyntheticFusionDexEntry(speciesId?: number): DexEntry {
  let ivs: number[] = [0, 0, 0, 0, 0, 0];
  // Falls back to both genders when no mask is set (entries that pre-date
  // the gender mechanic).
  let genderBits = 0n;
  let shinyBits = 0n;
  // Default to HARDY (bit 1) so consolidateDexData's un-guarded fallback
  // path doesn't crash on synthetic ids.
  let natureAttr = 1 << 1;
  let ribbons = new RibbonData(0n);
  // Preview-only post-evolution fusions installed by the pokedex page must
  // NOT report as caught, otherwise the evolutions panel renders every
  // post-evo in full colour regardless of actual unlock state.
  let isUnlocked = false;
  if (speciesId !== undefined) {
    const decoded = decodeFusionSpeciesId(speciesId);
    if (decoded) {
      isUnlocked = isFusionStarterUnlocked(decoded);
      const stored = getFusionStarterIvs(decoded);
      if (stored) {
        ivs = stored;
      }
      const mask = getFusionStarterGenders(decoded);
      if (mask & 0b01) {
        genderBits |= DexAttr.MALE;
      }
      if (mask & 0b10) {
        genderBits |= DexAttr.FEMALE;
      }
      const shinyMask = getFusionStarterShinyVariants(decoded);
      if (shinyMask & 0b001) {
        shinyBits |= DexAttr.DEFAULT_VARIANT;
      }
      if (shinyMask & 0b010) {
        shinyBits |= DexAttr.VARIANT_2;
      }
      if (shinyMask & 0b100) {
        shinyBits |= DexAttr.VARIANT_3;
      }
      const storedNature = getFusionStarterNatureAttr(decoded);
      if (storedNature !== 0) {
        natureAttr |= storedNature;
      }
      const storedRibbons = getFusionStarterRibbonsHex(decoded);
      if (storedRibbons) {
        ribbons = RibbonData.fromJSON(storedRibbons);
      }
    }
  }
  if (genderBits === 0n) {
    genderBits = DexAttr.MALE | DexAttr.FEMALE;
  }
  // Add SHINY when any shiny variant is unlocked so the toggle and icon
  // column light up.
  let caughtAttr: bigint = isUnlocked ? DexAttr.NON_SHINY | DexAttr.DEFAULT_VARIANT | genderBits : 0n;
  if (isUnlocked && shinyBits !== 0n) {
    caughtAttr |= DexAttr.SHINY | shinyBits;
  }
  return {
    seenAttr: caughtAttr,
    caughtAttr,
    natureAttr,
    seenCount: isUnlocked ? 1 : 0,
    caughtCount: isUnlocked ? 1 : 0,
    hatchedCount: 0,
    ivs,
    ribbons,
  };
}

// Pulls per-pair stored attrs from the unlocked-fusion-starters cache; candy,
// friendship and passive remain on the synthetic id via vanilla's existing
// passiveAttr flow.
export function getSyntheticFusionStarterDataEntry(speciesId?: number): StarterDataEntry {
  let abilityAttr = 1; // slot 0 unlocked — matches vanilla starter default
  let eggMoves = 0;
  let valueReduction = 0;
  let classicWinCount = 0;
  let passiveAttr = 0;
  if (speciesId !== undefined) {
    const decoded = decodeFusionSpeciesId(speciesId);
    if (decoded) {
      const stored = getFusionStarterAbilityAttr(decoded);
      if (stored !== 0) {
        abilityAttr = stored;
      }
      // Union stored bits with the current parents' bits mapped through the
      // 2+2 layout (fusion bits 0-1 from head, 2-3 from body). Lets later
      // parent unlocks surface on the fusion without a re-splice while
      // preserving historical splices.
      const storedEgg = getFusionStarterEggMoves(decoded);
      const headStarter = globalScene?.gameData?.starterData?.[decoded.headId];
      const bodyStarter = globalScene?.gameData?.starterData?.[decoded.bodyId];
      const headEggBits = (headStarter?.eggMoves ?? 0) & 0b0011;
      const bodyEggBits = (bodyStarter?.eggMoves ?? 0) & 0b0011;
      eggMoves = storedEgg | headEggBits | (bodyEggBits << 2);
      valueReduction = getFusionStarterValueReduction(decoded);
      classicWinCount = getFusionStarterClassicWinCount(decoded);
      passiveAttr = getFusionStarterPassiveAttr(decoded);
    }
  }
  return {
    moveset: null,
    eggMoves,
    candyCount: 0,
    friendship: 0,
    abilityAttr,
    passiveAttr,
    valueReduction,
    classicWinCount,
  };
}
