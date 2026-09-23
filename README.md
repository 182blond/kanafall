# Kanafall

**Web:** https://182blond.github.io/kanafall/

A cozy Japanese typing game: protect Nilo, a little forest companion, while learning hiragana, katakana and an introductory path of 20 kanji through 35 words. Spanish interface, illustrated companion, synthesized audio, no accounts or external services.

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
- Choose **Kanji** to enter **Bosque de palabras**, then choose a complete **Significados** session in Spanish or a **Lecturas** session in romaji. Before a new word can fall, a paused discovery card teaches its kanji, hiragana, romaji and Spanish meaning.
- Meaning sessions show the kanji with a small hiragana reading and ask “¿Qué significa esta palabra?”. Reading sessions hide that aid so they do not reveal the answer. Every exercise keeps the same answer language for the whole run. Meaning and reading have independent mastery; accents are optional, common regional synonyms are accepted, and difficult words return more often.
- The first six successful answers show a reading hint. Later, a wrong answer reveals the most dangerous letter's reading and selects the text for an easy retry.
- **Esc** pauses/resumes. Leaving the tab pauses automatically. The five hearts reset each run; progress does not.
- On phones, the arena follows the visible viewport. Opening the virtual keyboard activates a compact play layout that keeps the current word, lives, pause control and answer field visible.
- **Tu progreso** shows all 46 kana plus the 35-word kanji route, unlock levels and individual mastery. Each kanji word includes kana and romaji. Selecting any kanji in a word opens a curated detail with its formation, functional components, historical explanation and a memory aid; for example, `富` shows `宀` (roof/home) + `畐` (full/abundant, historical sound element). **Ajustes** controls synthesized effects, music, reduced motion and speed.
- Save reset has an explicit confirmation. It resets only this game's local key.

## Stack and structure

Nuxt **3**, Vue **3**, strict TypeScript, Tailwind CSS, localStorage. Plain Vue, SVG and CSS are simpler than Phaser for at most three falling targets. A requestAnimationFrame loop moves entities; scoring and target locking happen synchronously, while attacks finish independently.

```text
app.vue                 Navigation and game/progression coordination
components/             Arena, original companion, progress and settings
composables/useGame.ts   Session state, input, spawns and simulation
composables/useProgress.ts  Local persistence boundary
composables/useAudio.ts  Original synthetic sound effects and ambient notes
data/kana.ts             46 hiragana + 46 katakana and 35 words built around 20 kanji
game/rules.ts           Pure matching, XP, difficulty, selection and mastery
game/save.ts            Versioned schema and defensive save parsing
game/events.ts          Development-only event logging; no external analytics
tests/                  Deterministic rule and persistence tests
docs/GAME_DESIGN.md      Balancing decisions and future scope
```

## Progression and saves

An answer earns `10 + min(10, floor(combo / 5))` XP, plus 2 XP for each consecutive success on that same item after the first, capped at an 8 XP item bonus. The item streak is tracked separately for each kanji skill and resets when that item is answered incorrectly. Hiragana, katakana and kanji have separate XP and levels. Each level needs `round(60 × level^1.4)` additional XP; overflow carries forward. A new kana group opens every two levels, with all 46 in that script available at level 19. The seven kanji units open at levels 1, 3, 5, 7, 9, 11 and 13. Misses and wrong submissions update the requested skill. Mastery affects spawn weights, while immediate repetition is excluded.

`kanafall.save.v1` stores a version 3 schema with separate path XP/levels, shared statistics, skill mastery, unlocked IDs and settings. Version 1 and 2 saves migrate automatically: existing kana progress stays intact and kanji begins at level 1. Level/unlocks are reconstructed from XP when loaded. Saves are written after every answer and settings change to localStorage and a second IndexedDB copy; the previous valid local save is also rotated as a recovery snapshot. Startup selects the newest valid copy and restores it automatically. Invalid or newer-version saves are preserved rather than overwritten, and storage failures display a notice. Settings can export a portable JSON backup and import it with an explicit replacement confirmation. Current run position is intentionally not restored. Future cloud persistence can replace `useProgress` without changing the game rules.

## Development controls

Press the backquote key (physical key above Tab on many keyboards) in development to pause and show controls: add XP, gain a level, change speed, spawn a chosen kana, clear enemies and request save reset. Resume with **Continuar**. The panel and logging are guarded by `import.meta.dev`; production excludes their functionality.

## Scope

This is an MVP, designed primarily for desktop/laptop keyboard play. The kanji route is an initial 20-kanji teaching slice rather than a full course. Future work can expand spaced review, audio and sentence context before scaling the content to 100 kanji. No backend, login, multiplayer, commerce, quests or idle mode is implemented.

See `docs/VERIFICATION.md` for actual verification results and environment limitations.
