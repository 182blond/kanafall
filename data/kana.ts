export type KanaScript = 'hiragana' | 'katakana'

export interface Kana {
  id: string
  character: string
  type: KanaScript
  romaji: readonly string[]
  difficulty: number
  group: number
}

export const groupNames = [
  'Vocales',
  'Familia K',
  'Familia S',
  'Familia T',
  'Familia N',
  'Familia H',
  'Familia M',
  'Familia Y',
  'Familia R',
  'Familia W + N',
] as const

const romajiGroups = [
  'a i u e o',
  'ka ki ku ke ko',
  'sa shi su se so',
  'ta chi tsu te to',
  'na ni nu ne no',
  'ha hi fu he ho',
  'ma mi mu me mo',
  'ya yu yo',
  'ra ri ru re ro',
  'wa wo n',
] as const

const characters: Record<KanaScript, readonly string[]> = {
  hiragana: [
    'あいうえお',
    'かきくけこ',
    'さしすせそ',
    'たちつてと',
    'なにぬねの',
    'はひふへほ',
    'まみむめも',
    'やゆよ',
    'らりるれろ',
    'わをん',
  ],
  katakana: [
    'アイウエオ',
    'カキクケコ',
    'サシスセソ',
    'タチツテト',
    'ナニヌネノ',
    'ハヒフヘホ',
    'マミムメモ',
    'ヤユヨ',
    'ラリルレロ',
    'ワヲン',
  ],
}

function createScript(script: KanaScript): Kana[] {
  return characters[script].flatMap((row, group) =>
    [...row].map((character, index) => {
      const romaji = romajiGroups[group]!.split(' ')[index]!
      return {
        id: `${script}-${romaji}`,
        character,
        type: script,
        romaji: [romaji],
        difficulty: group + 1,
        group,
      }
    }),
  )
}

export const hiragana = createScript('hiragana')
export const katakana = createScript('katakana')
export const allKana = [...hiragana, ...katakana]
export const kanaFor = (script: KanaScript) => (script === 'hiragana' ? hiragana : katakana)
export const scriptLabel = (script: KanaScript) => (script === 'hiragana' ? 'Hiragana' : 'Katakana')
export const scriptJapanese = (script: KanaScript) => (script === 'hiragana' ? 'ひらがな' : 'カタカナ')

export const groupsFor = (script: KanaScript) =>
  groupNames.map((name, index) => [name, characters[script][index]!, romajiGroups[index]!] as const)
