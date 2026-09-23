# Verification — 2026-09-13

## Katakana expansion

- Added and validated the 46 standard basic katakana with the same strict Hepburn readings as hiragana.
- Added independent XP, levels, unlocks and per-character mastery for both writing systems.
- Verified automatic migration of a version 1 save: previous XP remains in hiragana and katakana begins at level 1.
- Production browser check: selected Katakana, started at level 1 with five vowels, answered `ウ → u`, received score/XP, and confirmed the next target was katakana.
- Progress browser check: the Katakana collection shows 5/46 unlocked at level 1, all ten rows, correct readings, and independent statistics.
- Updated automated result: **16 tests passed**, including katakana dataset parity and v1 migration.

## Kanji learning prototype

- Added 20 introductory kanji through 35 words in seven progressive units, including standalone numbers `一` through `十`.
- Added independent meaning and reading mastery, staged hiragana/furigana removal, accent-insensitive Spanish matching and weak-item weighting.
- Added a third independent XP path and safe migration from both version 1 and version 2 saves.
- Browser check: selected Kanji, started at level 1, received `かざん`, answered `volcán`, gained 110 points and 10 XP, and confirmed the next meaning prompt.
- Progress check: the collection shows every word with its reading, unit unlock levels, kanji focus and separate meaning/reading progress.
- Teaching-flow check: an unseen word opens a paused discovery card before its first exercise; the card exposes kanji, hiragana, romaji and Spanish meaning, then hands focus to an explicitly labeled Spanish-answer field.
- Meaning feedback now states the Spanish relationship, reading feedback states the romaji relationship, and curated regional synonyms are accepted.
- Session-flow check: the Kanji menu offers separate Significados/Español and Lecturas/Romaji runs. In a meaning run, the falling target showed `川` with “¿Qué significa esta palabra?” and the input remained labeled as a Spanish answer.
- Reading-aid check: that meaning target now shows the small hiragana `かわ`; the reading session omits the aid so the requested answer stays hidden.
- Compound check: the collection displays `日本`, `にほん`, `nihon` and `Japón`, then decomposes it into `日` (sol/día) and `本` (origen/libro) with a warning that compound meanings are not always literal sums.
- Kanji-detail check: every Han character currently used has a curated detail. Compound kanji are selectable; `富` identifies `宀` as roof/home and `畐` as the historical sound element associated with fullness, while base pictograms explain why further splitting would be misleading.
- Number-expansion check: the collection now reports 35 total entries and shows `一–五` at level 11 plus `六–十` at level 13. Selecting locked `一` opens its reading, meaning, formation and memory aid without unlocking it early.
- Save-resilience check: progress now writes to primary localStorage, a rotated previous snapshot and IndexedDB. Reload restored the existing level-4 kanji save; Settings displayed the latest save time and exposed download/import controls. Automated recovery selected the newest valid durable copy when the primary JSON was malformed.
- Mobile keyboard check: at 390 × 844 the menu fits without horizontal overflow; with the answer focused and the visible height reduced to 430 px, the compact arena kept `日本`, its meaning prompt, five lives, pause and the full input row visible.
- Short-viewport navigation check: the menu now scrolls inside its arena instead of clipping its lower actions. Persistent, explicitly labeled Progress and Settings controls were visible in the header and both opened their respective screens successfully.
- Familiar-item XP now grows by 2 for each consecutive correct answer to the same item, capped at +8; a wrong answer to that item resets its streak. The target's XP burst and run summary use the same awarded amount as the saved progression.
- Updated automated result: **20 tests passed**, including the 20-kanji/35-word corpus, alternate number readings, redundant-save recovery, lesson-stage transitions and both save migrations.

## Automated checks

- `npm run build`: **passed**, official Nuxt 3 production build (120 client modules).
- `npm run typecheck`: **passed**, strict Nuxt/Vue TypeScript checking.
- `npm run lint`: **passed**, no lint errors or warnings.
- `npm test`: **20 passed**, zero failures. Covers canonical kana, the 35-word kanji corpus, lesson-stage transitions, normalization, targeting, XP and level boundaries, mastery, unlocks, weighted selection, redundant-save recovery, save round-trip, malformed data and version 1/2 migrations.

## Browser checks

The core slice was exercised first using the same Vue components in a temporary local preview. The final application was then tested on its **official Nuxt production server**, at `http://127.0.0.1:4173`.

Verified on the component preview:

- Start, autofocus, correct answers, immediate input clearing, new targets and accumulating XP.
- Seven-answer streak and level-up; incorrect feedback resets combo without removing lives or losing input focus.
- Esc/button pause; enemy positions stay identical while paused and while visiting settings.
- Saved XP, statistics and mastery survive a page reload.
- Progress collection lists all 46 kana, reveals individual statistics and locks by level.
- Development controls add levels, adjust speed and make advanced difficulty/game-over practical to exercise.
- Five misses reach game over, show a run summary, and a new run restores five lives.
- Sound/music/reduced-motion/speed settings persist across reloads.

Verified again on the final production build:

- Start, type a visible kana reading, submit: 110 points and 10 XP, no input block.
- Pause, return to menu and restart.
- Backquote does not reveal any development panel.
- No browser error/warning logs in the checked production session.
- Visual inspection at default desktop size and 960 × 768: character, HUD and input remain readable and reachable.

Audio synthesis paths ran without browser errors, but subjective sound quality was not independently listened to. The destructive reset confirmation was inspected in source and its save defaults tested; no pre-existing user save was deleted during browser testing. The delivered browser starts at level 1 with one test answer (10 XP).

## Environment note

The restricted Windows execution environment initially blocked subprocess pipes (`spawn EPERM`) used by Nuxt. Once permitted execution was available, the official build and typecheck completed. No fallback build system or runtime workaround is included in the shipped application; the temporary component-preview helper remains outside the project, in the task's work folder.

One upstream Node deprecation notice from a Vue package export map appears during the successful build. It does not prevent building or running the game.
