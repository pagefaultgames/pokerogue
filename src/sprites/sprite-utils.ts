import { expSpriteKeys } from "#sprites/sprite-keys";

const expKeyRegex = /^pkmn__?(back__)?(shiny__)?(female__)?(\d+)(-.*?)?(?:_[1-3])?$/;

export function hasExpSprite(key: string): boolean {
  const keyMatch = expKeyRegex.exec(key);
  if (!keyMatch) {
    return false;
  }

  let k = keyMatch[4]!;
  if (keyMatch[2]) {
    k += "s";
  }
  if (keyMatch[1]) {
    k += "b";
  }
  if (keyMatch[3]) {
    k += "f";
  }
  if (keyMatch[5]) {
    k += keyMatch[5];
  }
  return expSpriteKeys.has(k);
}
