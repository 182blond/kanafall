# Kanafall — MVP design

## Core loop

Read a falling learning item → type the requested meaning or Hepburn reading → press Enter → Nilo casts a spell → gain XP and build a streak. The selected enemy is locked, input cleared and rewards credited in the same event handler. Its spell flies for 180 ms, then the hit disperses within 800 ms. Input never waits for this animation. Next spawn can begin after 450 ms; kanji mode always keeps one answerable word on screen so meaning and reading prompts cannot conflict.

Every entity has an ID, kana content, normalized position, fall speed, simulation spawn time, state and effect age. States: falling → targeted → hit → destroyed, or falling → missed → destroyed. When readings match several letters, the lowest wins; ties use spawn time then ID. A targeted enemy cannot be scored twice or cost a life. Animation timing freezes with gameplay on pause.

## Lives, score and feedback

- Five lives per run. A letter reaching 83% of the field removes one life, breaks the streak, reveals its reading and counts as an incorrect attempt. Zero lives ends the run immediately.
- A wrong non-empty submission breaks the streak and selects the input for replacement. It costs no life. An empty submission or a submission between available enemies is ignored.
- With no matching reading, the lowest falling letter receives the incorrect mastery attempt. This is a deliberate, deterministic attribution rule, not a guess about intent.
- Each correct answer scores `100 + 10 × min(combo, 30)` points. Run score resets on restart; lifetime XP, best streak and best score persist.
- Correct, attack, impact, wrong, level and game-over sounds are synthesized through Web Audio; music is an original quiet eight-note pattern. Sound is optional and music defaults off.
- Reduced motion removes idle/cast/shake/particle animations and flying spell visuals; falling letters continue because their movement is the game mechanic. Impact state and XP feedback remain.

## XP and evolution

`XP(answer) = 10 + min(10, floor(combo / 5)) + min(8, 2 × (item streak − 1))`.

The item streak counts consecutive correct answers for that exact kana or kanji skill, including across runs, and resets on an incorrect answer to that item. The capped bonus lets familiar repeated material move the learner through the route faster without making one item an unlimited XP source.

`XP required(level) = round(60 × level^1.4)`; this is per-level XP, with surplus carried over. Level 2 takes six accurate early answers. XP is credited and saved immediately, even if the session ends before the visual impact.

Nilo starts as a young forest companion. Level 5 adds a green aura; level 10 enriches the leaf glow; level 20 adds a violet radiance. Level-up notices never disable input.

## Educational sequence

Hiragana, katakana and kanji are selectable paths. They share the companion while keeping XP and levels separate. Each section has a Random practice mode that samples its full collection without unlock or mastery weighting; it does not create a fourth XP path. Old saves retain all kana progress and begin kanji at level 1.

The pool expands on levels 1, 3, 5, …, 19:

1. あいうえお
2. かきくけこ
3. さしすせそ
4. たちつてと
5. なにぬねの
6. はひふへほ
7. まみむめも
8. やゆよ
9. らりるれろ
10. わをん

Readings are deterministic, standard Hepburn: shi, chi, tsu, fu. The character を is tested as `wo`; contextual particle pronunciations (`o`, `wa`, `e`) are not alternate answers in this isolated-character mode. No runtime language-model calls.

### Kanji teaching slice

The initial route contains 35 words organized around `山 川 日 月 火 水 木 人 大 小 一 二 三 四 五 六 七 八 九 十`. Five-word units open at levels 1, 3, 5, 7, 9, 11 and 13: mountains/rivers, sun/moon, fire/water, trees/people, big/small, numbers 1–5 and numbers 6–10. The number units teach the common standalone readings first; `四`, `七` and `九` also accept their standard alternate readings.

Each word has two independent mastery records and the learner chooses one skill for the entire run: **Significados** in Spanish or **Lecturas** in romaji. Before its first exercise in that skill, an unseen word opens a discovery card with kanji, hiragana, romaji and Spanish meaning; the simulation pauses until the learner chooses to practice. Meaning exercises show the word's small hiragana reading beneath the kanji, following the normal furigana convention, and ask “¿Qué significa esta palabra?”. Reading exercises hide that aid because the reading is the requested answer; they show hiragana only during the first two guided attempts and then remove it.

The collection repeats kana and romaji beside every word. Its detail view makes each kanji in a word selectable, then presents a curated formation type, functional components, historical explanation and memory aid. It explicitly labels semantic, phonetic and merely visual roles so a mnemonic is not confused with etymology. A separate note explains that a compound's final meaning is not always the literal sum of its kanji.

The menu, start button and input dock name the selected skill and answer language: Spanish for meaning, Latin letters/romaji for reading. Neutral examples demonstrate the format without revealing the active answer. Correct and corrective feedback repeat the relationship explicitly. Spanish matching ignores capitalization, surrounding spaces and accents, and accepts curated regional synonyms. Kanji mode uses vocabulary readings instead of asking learners to memorize isolated on/kun reading lists.

## Mastery and spawning

Track attempts, correct, incorrect, current streak and confidence separately per kana. Kanji words track meaning and reading independently. Correct: +0.12 confidence; wrong/missed: −0.08, clamped to [0,1]. Confidence describes practice progress, not an estimate of linguistic proficiency. Display accuracy separately.

- Below 25%: New
- 25–59%: Learning
- 60–84%: Familiar
- 85% and up: Mastered

Each unlocked letter has weight `1 + 2 × (1 − mastery)`. The weakest letters are three times as likely as fully mastered letters. Exclude the immediately previous kana if another exists. Distribute spawns among three lanes, avoiding an occupied lane near the top. Later content families can extend `Kana` without moving matching into the UI.

Random mode uses equal weights across the selected section, including locked and fully mastered items. It is an open practice mode and does not create a fourth XP path.

When every item currently unlocked in a learning section reaches full mastery, the path advances through completed levels automatically until it reaches the next group with something new to learn. This prevents a mastered starter set from becoming an endless loop.

## Difficulty

Coordinates use percentages of the responsive field. The initial speed is 3.8 percentage points/second (roughly 20 seconds before a miss). Each level adds 0.48. Time within a run adds up to 3 more points of pressure across 7.5 minutes. Speed caps at 17.

Spawn interval starts near 3.5 seconds and decreases with level/time to a minimum of 1.4 seconds. Correct answers pull the next spawn closer. Maximum answerable enemies: one at levels 1–5, two at 6–10, three from 11. The player's speed setting scales motion and spawn timing together (0.65×, 1× or 1.5×). Restart resets run pressure, not lifetime learning level.

## Future scope

Possible later additions: voiced kana and contracted sounds, sentence context, scheduled review dates, richer companion evolution, daily challenges and cloud saves. Keep new content deterministic and keep persistence behind the existing boundary.
