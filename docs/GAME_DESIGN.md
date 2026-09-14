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

`XP(answer) = 10 + min(10, floor(combo / 5))`.

`XP required(level) = round(60 × level^1.4)`; this is per-level XP, with surplus carried over. Level 2 takes six accurate early answers. XP is credited and saved immediately, even if the session ends before the visual impact.

Nilo starts as a young forest companion. Level 5 adds a green aura; level 10 enriches the leaf glow; level 20 adds a violet radiance. Level-up notices never disable input.

## Educational sequence

Hiragana, katakana and kanji are selectable paths. They share the companion while keeping XP and levels separate. Old saves retain all kana progress and begin kanji at level 1.

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

The initial route contains 25 words organized around `山 川 日 月 火 水 木 人 大 小`. Five-word units open at levels 1, 3, 5, 7 and 9: mountains/rivers, sun/moon, fire/water, trees/people, and big/small.

Each word has two independent mastery records and the learner chooses one skill for the entire run: **Significados** in Spanish or **Lecturas** in romaji. Before its first exercise in that skill, an unseen word opens a discovery card with kanji, hiragana, romaji and Spanish meaning; the simulation pauses until the learner chooses to practice. Meaning exercises show the kanji with the question “¿Qué significa esta palabra?” and never place its pronunciation beneath the target. Reading exercises show hiragana for the first two attempts and then remove it.

The menu, start button and input dock name the selected skill and answer language: Spanish for meaning, Latin letters/romaji for reading. Neutral examples demonstrate the format without revealing the active answer. Correct and corrective feedback repeat the relationship explicitly. Spanish matching ignores capitalization, surrounding spaces and accents, and accepts curated regional synonyms. Kanji mode uses vocabulary readings instead of asking learners to memorize isolated on/kun reading lists.

## Mastery and spawning

Track attempts, correct, incorrect, current streak and confidence separately per kana. Kanji words track meaning and reading independently. Correct: +0.12 confidence; wrong/missed: −0.08, clamped to [0,1]. Confidence describes practice progress, not an estimate of linguistic proficiency. Display accuracy separately.

- Below 25%: New
- 25–59%: Learning
- 60–84%: Familiar
- 85% and up: Mastered

Each unlocked letter has weight `1 + 2 × (1 − mastery)`. The weakest letters are three times as likely as fully mastered letters. Exclude the immediately previous kana if another exists. Distribute spawns among three lanes, avoiding an occupied lane near the top. Later content families can extend `Kana` without moving matching into the UI.

## Difficulty

Coordinates use percentages of the responsive field. The initial speed is 3.8 percentage points/second (roughly 20 seconds before a miss). Each level adds 0.48. Time within a run adds up to 3 more points of pressure across 7.5 minutes. Speed caps at 17.

Spawn interval starts near 3.5 seconds and decreases with level/time to a minimum of 1.4 seconds. Correct answers pull the next spawn closer. Maximum answerable enemies: one at levels 1–5, two at 6–10, three from 11. The player's speed setting scales motion and spawn timing together (0.65×, 1× or 1.5×). Restart resets run pressure, not lifetime learning level.

## Future scope

Possible later additions: voiced kana and contracted sounds, sentence context, scheduled review dates, richer companion evolution, daily challenges and cloud saves. Keep new content deterministic and keep persistence behind the existing boundary.
