export type SyllabaryScript = 'hiragana' | 'katakana'
export type KanaScript = SyllabaryScript | 'kanji'
export type KanjiPractice = 'meaning' | 'reading'

export interface Kana {
  id: string
  character: string
  type: KanaScript
  romaji: readonly string[]
  difficulty: number
  group: number
  reading?: string
  meaning?: string
  meaningAnswers?: readonly string[]
  kanji?: string
  focusKanji?: string
}

export const groupNames = [
  'Vocales', 'Familia K', 'Familia S', 'Familia T', 'Familia N',
  'Familia H', 'Familia M', 'Familia Y', 'Familia R', 'Familia W + N',
] as const

const romajiGroups = [
  'a i u e o', 'ka ki ku ke ko', 'sa shi su se so', 'ta chi tsu te to', 'na ni nu ne no',
  'ha hi fu he ho', 'ma mi mu me mo', 'ya yu yo', 'ra ri ru re ro', 'wa wo n',
] as const

const characters: Record<SyllabaryScript, readonly string[]> = {
  hiragana: [
    'あいうえお', 'かきくけこ', 'さしすせそ', 'たちつてと', 'なにぬねの',
    'はひふへほ', 'まみむめも', 'やゆよ', 'らりるれろ', 'わをん',
  ],
  katakana: [
    'アイウエオ', 'カキクケコ', 'サシスセソ', 'タチツテト', 'ナニヌネノ',
    'ハヒフヘホ', 'マミムメモ', 'ヤユヨ', 'ラリルレロ', 'ワヲン',
  ],
}

function createScript(script: SyllabaryScript): Kana[] {
  return characters[script].flatMap((row, group) =>
    [...row].map((character, index) => {
      const romaji = romajiGroups[group]!.split(' ')[index]!
      return { id: `${script}-${romaji}`, character, type: script, romaji: [romaji], difficulty: group + 1, group }
    }),
  )
}

type WordSeed = readonly [
  kanji: string,
  reading: string,
  romaji: string,
  meaning: string,
  focus: string,
  aliases?: readonly string[],
]
const kanjiUnits: readonly { name: string; glyphs: string; words: readonly WordSeed[] }[] = [
  {
    name: 'Montes y ríos', glyphs: '山川', words: [
      ['山', 'やま', 'yama', 'montaña', '山'],
      ['火山', 'かざん', 'kazan', 'volcán', '山'],
      ['富士山', 'ふじさん', 'fujisan', 'monte Fuji', '山', ['Fuji']],
      ['川', 'かわ', 'kawa', 'río', '川'],
      ['小川', 'おがわ', 'ogawa', 'arroyo', '川'],
    ],
  },
  {
    name: 'Sol y luna', glyphs: '日月', words: [
      ['日', 'ひ', 'hi', 'sol', '日', ['día']],
      ['日本', 'にほん', 'nihon', 'Japón', '日'],
      ['毎日', 'まいにち', 'mainichi', 'todos los días', '日', ['cada día', 'diariamente']],
      ['月', 'つき', 'tsuki', 'luna', '月'],
      ['月曜日', 'げつようび', 'getsuyoubi', 'lunes', '月'],
    ],
  },
  {
    name: 'Fuego y agua', glyphs: '火水', words: [
      ['火', 'ひ', 'hi', 'fuego', '火'],
      ['火曜日', 'かようび', 'kayoubi', 'martes', '火'],
      ['水', 'みず', 'mizu', 'agua', '水'],
      ['水曜日', 'すいようび', 'suiyoubi', 'miércoles', '水'],
      ['水中', 'すいちゅう', 'suichuu', 'bajo el agua', '水', ['submarino']],
    ],
  },
  {
    name: 'Árboles y personas', glyphs: '木人', words: [
      ['木', 'き', 'ki', 'árbol', '木'],
      ['木曜日', 'もくようび', 'mokuyoubi', 'jueves', '木'],
      ['大木', 'たいぼく', 'taiboku', 'árbol grande', '木', ['gran árbol']],
      ['人', 'ひと', 'hito', 'persona', '人'],
      ['日本人', 'にほんじん', 'nihonjin', 'persona japonesa', '人', ['japonés', 'japonesa']],
    ],
  },
  {
    name: 'Grande y pequeño', glyphs: '大小', words: [
      ['大きい', 'おおきい', 'ookii', 'grande', '大'],
      ['大人', 'おとな', 'otona', 'adulto', '大', ['adulta', 'persona adulta']],
      ['大学', 'だいがく', 'daigaku', 'universidad', '大'],
      ['小さい', 'ちいさい', 'chiisai', 'pequeño', '小', ['pequeña', 'chico', 'chica']],
      ['小学校', 'しょうがっこう', 'shougakkou', 'escuela primaria', '小'],
    ],
  },
]

export const hiragana = createScript('hiragana')
export const katakana = createScript('katakana')
export const kanjiWords: Kana[] = kanjiUnits.flatMap((unit, group) =>
  unit.words.map(([kanji, reading, romaji, meaning, focusKanji, aliases], index) => ({
    id: `kanji-${group}-${index}-${romaji}`,
    character: kanji,
    kanji,
    reading,
    meaning,
    meaningAnswers: [meaning, ...(aliases ?? [])],
    focusKanji,
    type: 'kanji' as const,
    romaji: [romaji],
    difficulty: group + 1,
    group,
  })),
)

export const allKana = [...hiragana, ...katakana, ...kanjiWords]
export const kanaFor = (script: KanaScript) =>
  script === 'hiragana' ? hiragana : script === 'katakana' ? katakana : kanjiWords
export const scriptLabel = (script: KanaScript) =>
  script === 'hiragana' ? 'Hiragana' : script === 'katakana' ? 'Katakana' : 'Kanji'
export const scriptJapanese = (script: KanaScript) =>
  script === 'hiragana' ? 'ひらがな' : script === 'katakana' ? 'カタカナ' : '漢字'

export const groupsFor = (script: KanaScript) =>
  script === 'kanji'
    ? kanjiUnits.map((unit) => [unit.name, unit.glyphs, `${unit.words.length} palabras`] as const)
    : groupNames.map((name, index) => [name, characters[script][index]!, romajiGroups[index]!] as const)

export const masteryKeysFor = (item: Kana) =>
  item.type === 'kanji' ? [`${item.id}:meaning`, `${item.id}:reading`] : [item.id]
