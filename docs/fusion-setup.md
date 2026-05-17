<!--
SPDX-FileCopyrightText: 2024-2026 Pagefault Games

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Setting Up Infinite Fusion Sprites

This mod renders fused starters using artwork from the Pokémon Infinite Fusion community. Sprites and the community-authored pokedex flavor text are read at runtime from a local folder you grant the page access to — nothing is bundled with the game.

This document walks through the one-time setup. After it's done, every fused starter you splice will render with the proper IF sprite, and its pokedex page will show the community-authored description for the pair.

# Prerequisites

- A browser that supports the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) (Chrome, Edge, Opera, or another Chromium-based browser). Firefox and Safari do not yet implement this API; the picker will report `Picker unsupported in this browser`.
- ~2 GB of free disk space for the IF install + sprite pack.

# 1. Download Infinite Fusion

Grab the latest release from the [Kuray Infinite Fusion repository](https://github.com/kurayamiblackheart/kurayshinyrevamp).

> [!NOTE]
> You don't need to run Infinite Fusion itself — we only need its folder structure on disk. The repo ships sprites, the dex data file, and the directory layout the mod expects.

Extract the download to a stable location, e.g. `~/Downloads/IF/` or `C:\Games\InfiniteFusion\`. You'll point the game at this folder in step 3.

# 2. Add the artist sprite pack

The IF repo ships with auto-generated fusion sprites. To get the higher-quality, hand-drawn artist sprites, download the **KIF February 2025 Spritepack (96x96)**:

- [MediaFire link](https://www.mediafire.com/file/57g7sidwgsxxpy5/KIF_February_2025_Spritepack_96x96.rar/file)

> [!TIP]
> The MediaFire link is the version we tested against. The pack is updated periodically; check the [Kuray Discord](https://discord.gg/) (linked from the GitHub repo) for the latest drop. Newer packs are backwards-compatible with the file layout we read.

Extract the archive and merge its `Graphics/CustomBattlers/` folder into the IF install from step 1 — i.e. you should end up with both:

- `<IF folder>/Graphics/Battlers/` (auto-generated, shipped with the repo)
- `<IF folder>/Graphics/CustomBattlers/` (artist-drawn, from the spritepack)

If both folders contain a sprite for the same pair, the mod prefers the artist version by default (configurable in step 4).

# 3. Point the game at the folder

Launch the game, open **Settings → Fusions** (the rightmost tab), and select **Choose folder…**. Pick the IF folder from step 1.

> [!IMPORTANT]
> Your browser will ask for read access to the folder. Grant it. The page never modifies anything inside the folder — it only reads sprite files and the dex data on demand.

The Folder row should now display the directory name instead of `Not set`. You only need to do this once per browser; the permission is remembered across sessions.

# 4. (Optional) Tune the rendering settings

Same Fusions tab — three additional knobs:

- **Stat formula** — how a fusion's base stats are derived from its parents.
  - **Infinite Fusion** (default): the canonical 2:1 head/body weighting from the IF game.
  - **PokéRogue**: arithmetic mean of head and body stats.
  - **Maximum (+1 cost)**: takes the larger of head/body per stat. Strictly stronger than either parent alone, so each fusion's starter cost is bumped by 1.
- **Shiny recolor** — intensity of the partial-shiny effect applied to IF sprites (which ship only in non-shiny form). Subtle / Moderate / Strong.
- **Sprite source** — which directory the resolver tries first.
  - **Artist first** (default): prefers `CustomBattlers/`, falls back to autogen.
  - **Autogen first**: opposite priority.
  - **Artist only**: skip autogen entirely; pairs without an artist sprite render via the palette-swap fallback.

All settings persist locally and apply on the next sprite load.

# Troubleshooting

**The folder picker doesn't appear.** Your browser doesn't implement the File System Access API. Use a Chromium-based browser.

**Fusions render with palette-swapped placeholder sprites, not the IF art.** Either the folder is misconfigured or the pair has no artist/autogen sprite shipped. Open the browser devtools console — sprite-load 404s are logged. Confirm `<IF folder>/Graphics/Battlers/<head>/<head>.<body>.png` exists for the pair you're testing.

**A specific pair's sprite looks wrong (different Pokémon).** PokéRogue's NatDex numbering doesn't match IF's pack ordering. The mod ships a translation table; if a pair is mismatched, the table needs an entry. Open an issue with the species pair and the actual vs. expected sprite.

**The browser asks for folder permission every time the game loads.** Some browser privacy modes (incognito, "always clear on exit", restrictive cookie policies) prevent the permission from being remembered. Adjust the site permissions for the page or use a regular browser window.

# What gets read from the folder

For reference, the mod reads only these paths under your IF folder:

- `Graphics/CustomBattlers/indexed/<head>/<head>.<body>[<variant>].png` — artist fusion sprites (variant suffix is optional, e.g. `1.4a.png`).
- `Graphics/Battlers/<head>/<head>.<body>.png` — auto-generated fusion sprites.
- `Data/dex.json` — community-authored fusion pokedex entries, shown on the pokedex page for matching pairs.

Nothing else is touched. The mod never writes to the folder.
