import MockContainer from "#app/test/essentials/mocksContainer/mockContainer";


export default class MockImage extends MockContainer {
  private texture;

  constructor(textureManager, x, y, texture) {
    super(textureManager, x, y);
    this.texture = texture;
    const blacklist = ["bg", "pb", "items", "_a", "_b", "_c", "_d", "cursor", "prompt", "types", "categories",
      "tabs", "pkmn_", "icon", "candy", "status", "categories", "summary", "profile", "gacha", "shiny", "egg", "logo", "champion_", "ability_",
      "overlay_", "numbers"
    ];
    const whitelist = ["exeggcute"];
    let found = false;
    this.texture = {
      key: texture || "",
    };
    for (const elm of blacklist) {
      if (texture.includes(elm) && !whitelist.includes(texture)) {
        found = true;
        break;
      }
    }
    if (!found && texture) {
      textureManager.containers.push(this);
    }
  }
}
