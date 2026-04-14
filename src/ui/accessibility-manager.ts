/**
 * AccessibilityManager - Provides screen reader support for the canvas-based game.
 *
 * Creates a hidden DOM layer with ARIA live regions that mirrors game state,
 * allowing NVDA and other screen readers to announce battle text, menu options,
 * and cursor changes.
 */
export class AccessibilityManager {
  private static instance: AccessibilityManager;

  private rootEl: HTMLElement | null = null;
  private messageEl: HTMLElement | null = null;
  private contextEl: HTMLElement | null = null;
  private menuEl: HTMLElement | null = null;

  private announceCounter = 0;
  private enabled = true;

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  /**
   * Initialize the accessibility DOM layer inside #app.
   * Call once after the Phaser game is created.
   */
  init(): void {
    const app = document.getElementById("app");
    if (!app || this.rootEl) {
      return;
    }

    this.rootEl = document.createElement("div");
    this.rootEl.id = "a11y-root";
    this.rootEl.className = "sr-only";
    this.rootEl.setAttribute("aria-relevant", "additions text");

    // Message region: battle messages, dialogue (assertive = interrupts current speech)
    this.messageEl = document.createElement("div");
    this.messageEl.id = "a11y-message";
    this.messageEl.setAttribute("role", "log");
    this.messageEl.setAttribute("aria-live", "assertive");
    this.messageEl.setAttribute("aria-atomic", "true");

    // Context region: mode transitions, status info (polite = waits for current speech)
    this.contextEl = document.createElement("div");
    this.contextEl.id = "a11y-context";
    this.contextEl.setAttribute("role", "status");
    this.contextEl.setAttribute("aria-live", "polite");
    this.contextEl.setAttribute("aria-atomic", "true");

    // Menu region: current menu options
    this.menuEl = document.createElement("div");
    this.menuEl.id = "a11y-menu";
    this.menuEl.setAttribute("role", "menu");
    this.menuEl.setAttribute("aria-label", "Menu");

    this.rootEl.appendChild(this.messageEl);
    this.rootEl.appendChild(this.contextEl);
    this.rootEl.appendChild(this.menuEl);
    app.appendChild(this.rootEl);

    // Ensure the game canvas is focusable for screen readers
    const canvas = app.querySelector("canvas");
    if (canvas) {
      canvas.setAttribute("tabindex", "0");
      canvas.setAttribute("aria-label", "PokéRogue game window");
    }

    // Also make #app focusable and auto-focus it so screen readers pick up the live regions
    app.setAttribute("tabindex", "-1");
    app.focus();
  }

  /**
   * Announce a message to screen readers immediately (assertive).
   * Used for battle messages, dialogue, cursor changes.
   */
  announceMessage(text: string): void {
    if (!this.enabled || !this.messageEl || !text) {
      return;
    }

    const cleanText = this.stripFormatting(text);
    if (!cleanText) {
      return;
    }

    // Toggle zero-width space to force NVDA to re-read identical consecutive messages
    this.announceCounter++;
    this.messageEl.textContent = cleanText + "\u200B".repeat(this.announceCounter % 2);
  }

  /**
   * Announce context/status information (polite - waits for current speech).
   * Used for mode transitions.
   */
  announceContext(text: string): void {
    if (!this.enabled || !this.contextEl || !text) {
      return;
    }
    this.contextEl.textContent = text;
  }

  /**
   * Build an accessible menu from a list of item labels.
   */
  setMenu(items: string[], cursorIndex: number, label?: string): void {
    if (!this.enabled || !this.menuEl) {
      return;
    }

    if (label) {
      this.menuEl.setAttribute("aria-label", label);
    }

    this.menuEl.innerHTML = "";
    items.forEach((item, i) => {
      const el = document.createElement("div");
      el.setAttribute("role", "menuitem");
      el.textContent = this.stripFormatting(item);
      if (i === cursorIndex) {
        el.setAttribute("aria-current", "true");
      }
      this.menuEl!.appendChild(el);
    });
  }

  /**
   * Update cursor position in the accessible menu and announce the selected item.
   */
  updateMenuCursor(index: number): void {
    if (!this.enabled || !this.menuEl) {
      return;
    }

    const items = this.menuEl.querySelectorAll('[role="menuitem"]');
    items.forEach((el, i) => {
      if (i === index) {
        el.setAttribute("aria-current", "true");
      } else {
        el.removeAttribute("aria-current");
      }
    });

    if (items[index]) {
      this.announceMessage(items[index].textContent ?? "");
    }
  }

  /**
   * Clear the menu region.
   */
  clearMenu(): void {
    if (this.menuEl) {
      this.menuEl.innerHTML = "";
    }
  }

  /**
   * Clear all accessibility regions.
   */
  clearAll(): void {
    if (this.messageEl) {
      this.messageEl.textContent = "";
    }
    if (this.contextEl) {
      this.contextEl.textContent = "";
    }
    this.clearMenu();
  }

  /**
   * Enable or disable screen reader announcements.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.rootEl) {
      this.rootEl.setAttribute("aria-hidden", (!enabled).toString());
    }
  }

  /**
   * Fetch a Pokemon's Pokedex flavor text from PokeAPI and announce it.
   * Results are cached so each species is only fetched once.
   */
  private flavorTextCache: Map<number, string> = new Map();

  async announcePokedexDescription(speciesId: number, speciesName: string): Promise<void> {
    if (!this.enabled) {
      return;
    }

    // Check cache first
    if (this.flavorTextCache.has(speciesId)) {
      const cached = this.flavorTextCache.get(speciesId)!;
      if (cached) {
        this.announceMessage(`${speciesName}: ${cached}`);
      }
      return;
    }

    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${speciesId}`);
      if (!response.ok) {
        this.flavorTextCache.set(speciesId, "");
        return;
      }
      const data = await response.json();
      const entries = data.flavor_text_entries ?? [];
      const englishEntry = entries.find((e: { language: { name: string } }) => e.language.name === "en");
      const flavorText = englishEntry ? englishEntry.flavor_text.replace(/[\n\f\r]/g, " ") : "";
      this.flavorTextCache.set(speciesId, flavorText);
      if (flavorText) {
        this.announceMessage(`${speciesName}: ${flavorText}`);
      }
    } catch {
      this.flavorTextCache.set(speciesId, "");
    }
  }

  /**
   * Strip BBCode formatting tags and action patterns from text.
   * Removes [color=...], [shadow=...], [/color], [/shadow] and @c{}, @d{}, @s{}, @f{} patterns.
   */
  private stripFormatting(text: string): string {
    return text
      .replace(/\[\/?\w+(?:=[^\]]+)?\]/g, "") // BBCode tags
      .replace(/@[cdsf]\{.*?\}/g, "") // Action patterns
      .trim();
  }
}
