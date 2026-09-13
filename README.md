# Kanafall

**Web:** https://182blond.github.io/kanafall/

A cozy Japanese typing game: protect Nilo, a little forest companion, by reading falling hiragana or katakana and casting spells with their romaji. Spanish interface, illustrated companion, synthesized audio, no accounts or external services.

## Start

Node.js 24.3+ and npm are required. Dependencies are already installed in this checkout.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000 for development. On Windows, double-click `start-game.cmd` to serve the compiled game at **http://127.0.0.1:4173** (keep its window open while playing). It builds first if needed. Use `npm run build` after changing source; `npm run generate` creates a static site.

The delivered running game uses port 4173. Browser saves belong to an exact origin: use the same address, port and browser to retain your progress. Development on port 3000 has a separate save.

## GitHub Pages

Every push to `main` runs the checks, generates the static Nuxt site with the `/kanafall/` base path and publishes it through GitHub Pages. The workflow is in `.github/workflows/deploy-pages.yml`. Enable **Settings → Pages → Source: GitHub Actions** once if GitHub does not select it automatically.

```sh
npm test
npm run typecheck
npm run lint
```

Tests use Node's built-in test runner with TypeScript stripping and no subprocess isolation. This is sufficient for the deterministic game rules and save validation, and keeps the test toolchain small.

## Play

- Choose **Hiragana** or **Katakana**, click **Jugar**, type the Hepburn reading, then press **Enter**. Case and surrounding spaces are ignored.
- The first six successful answers show a reading hint. Later, a wrong answer reveals the most dangerous letter's reading and selects the text for an easy retry.
- **Esc** pauses/resumes. Leaving the tab pauses automatically. The five hearts reset each run; progress does not.
- **Tu progreso** shows all 46 kana, unlock levels and individual mastery. **Ajustes** controls synthesized effects, music, reduced motion and speed.
- Save reset has an explicit confirmation. It resets only this game's local key.

## Stack and structure

Nuxt **3**, Vue **3**, strict TypeScript, Tailwind CSS, localStorage. Plain Vue, SVG and CSS are simpler than Phaser for at most three falling targets. A requestAnimationFrame loop moves entities; scoring and target locking happen synchronously, while attacks finish independently.

```text
app.vue                 Navigation and game/progression coordination
components/             Arena, original companion, progress and settings
composables/useGame.ts   Session state, input, spawns and simulation
composables/useProgress.ts  Local persistence boundary
composables/useAudio.ts  Original synthetic sound effects and ambient notes
data/kana.ts             Canonical 46 hiragana + 46 katakana, readings, groups
game/rules.ts           Pure matching, XP, difficulty, selection and mastery
game/save.ts            Versioned schema and defensive save parsing
game/events.ts          Development-only event logging; no external analytics
tests/                  Deterministic rule and persistence tests
docs/GAME_DESIGN.md      Balancing decisions and future scope
```

## Progression and saves

An answer earns `10 + min(10, floor(combo / 5))` XP. Hiragana and katakana have separate XP, levels and mastery, so a new katakana path starts gently even after advanced hiragana study. Each level needs `round(60 × level^1.4)` additional XP; overflow carries forward. A new kana group opens every two levels, with all 46 in that script available at level 19. Misses and wrong submissions update the lowest relevant kana's mastery. Mastery affects spawn weights, while immediate repetition is excluded.

`kanafall.save.v1` stores a version 2 schema with separate path XP/levels, shared statistics, per-character mastery, unlocked IDs and settings. Existing version 1 hiragana saves migrate automatically; their progress stays in hiragana and katakana begins at level 1. Level/unlocks are reconstructed from XP when loaded. Saves are written after every answer and settings change. Invalid or newer-version saves are preserved rather than overwritten; storage failures display a notice. Current run position is intentionally not restored. Future cloud persistence can replace `useProgress` without changing the game rules.

## Development controls

Press the backquote key (physical key above Tab on many keyboards) in development to pause and show controls: add XP, gain a level, change speed, spawn a chosen kana, clear enemies and request save reset. Resume with **Continuar**. The panel and logging are guarded by `import.meta.dev`; production excludes their functionality.

## Scope

This is an MVP, designed primarily for desktop/laptop keyboard play. Future work: dakuten/handakuten and contracted sounds, then vocabulary or cloud saves if requested. No backend, login, multiplayer, commerce, quests or idle mode is implemented.

See `docs/VERIFICATION.md` for actual verification results and environment limitations.
