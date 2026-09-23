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

export interface KanjiPart {
  character: string
  meaning: string
}

export interface KanjiComponent {
  character: string
  meaning: string
  role: string
}

export interface KanjiBreakdown {
  character: string
  meaning: string
  formation: string
  components: readonly KanjiComponent[]
  explanation: string
  mnemonic: string
}

const kanjiMeanings: Record<string, string> = {
  山: 'montaña',
  川: 'río',
  日: 'sol · día',
  月: 'luna · mes',
  火: 'fuego',
  水: 'agua',
  木: 'árbol · madera',
  人: 'persona',
  大: 'grande',
  小: 'pequeño',
  富: 'riqueza · abundancia',
  士: 'persona instruida · guerrero',
  本: 'origen · libro',
  毎: 'cada',
  曜: 'día de la semana',
  中: 'centro · dentro',
  学: 'estudio · aprender',
  校: 'escuela',
  一: 'uno',
  二: 'dos',
  三: 'tres',
  四: 'cuatro',
  五: 'cinco',
  六: 'seis',
  七: 'siete',
  八: 'ocho',
  九: 'nueve',
  十: 'diez',
}

// Curated teaching notes. Components describe historical function when it is useful;
// simplified forms are explicitly identified so visual mnemonics are not presented as etymology.
const kanjiBreakdowns: Record<string, KanjiBreakdown> = {
  山: {
    character: '山', meaning: 'montaña', formation: 'Pictograma', components: [],
    explanation: 'Representa una cadena de montañas con un pico central más alto.',
    mnemonic: 'Mirá sus tres puntas como tres picos en el horizonte.',
  },
  川: {
    character: '川', meaning: 'río', formation: 'Pictograma', components: [],
    explanation: 'Sus tres líneas representan el agua que corre entre dos orillas.',
    mnemonic: 'Las líneas bajan juntas como corrientes de un río.',
  },
  日: {
    character: '日', meaning: 'sol · día', formation: 'Pictograma', components: [],
    explanation: 'Nació como el dibujo redondeado del sol con una marca en el centro.',
    mnemonic: 'Pensalo como el sol enmarcado: de él nace cada día.',
  },
  月: {
    character: '月', meaning: 'luna · mes', formation: 'Pictograma', components: [],
    explanation: 'Representa la forma de una luna creciente.',
    mnemonic: 'La curva exterior parece una luna fina en el cielo.',
  },
  火: {
    character: '火', meaning: 'fuego', formation: 'Pictograma', components: [],
    explanation: 'Dibuja una llama central con chispas que salen hacia ambos lados.',
    mnemonic: 'La llama se abre y lanza dos chispas.',
  },
  水: {
    character: '水', meaning: 'agua', formation: 'Pictograma', components: [],
    explanation: 'Dibuja una corriente central con gotas o remolinos a los lados.',
    mnemonic: 'Seguí el cauce central y las gotas que se separan.',
  },
  木: {
    character: '木', meaning: 'árbol · madera', formation: 'Pictograma', components: [],
    explanation: 'Muestra el tronco, las ramas abiertas y las raíces de un árbol.',
    mnemonic: 'La línea vertical es el tronco; arriba hay ramas y abajo raíces.',
  },
  人: {
    character: '人', meaning: 'persona', formation: 'Pictograma', components: [],
    explanation: 'Representa de perfil a una persona caminando sobre dos piernas.',
    mnemonic: 'Dos piernas sostienen a una persona en movimiento.',
  },
  大: {
    character: '大', meaning: 'grande', formation: 'Pictograma', components: [],
    explanation: 'Representa a una persona de pie con brazos y piernas bien abiertos.',
    mnemonic: 'Una persona ocupa mucho espacio para mostrar algo grande.',
  },
  小: {
    character: '小', meaning: 'pequeño', formation: 'Indicativo', components: [],
    explanation: 'Tres marcas pequeñas representan gotas, chispas u objetos diminutos.',
    mnemonic: 'Tres puntitos separados son cosas pequeñas.',
  },
  富: {
    character: '富', meaning: 'riqueza · abundancia', formation: 'Semántico-fonético',
    components: [
      { character: '宀', meaning: 'techo · casa', role: 'idea de lugar' },
      { character: '畐', meaning: 'lleno · abundante', role: 'sonido histórico' },
    ],
    explanation: '宀 aporta la imagen de una casa y 畐 funciona como unidad fonética. Aunque 畐 se parece a 一 + 口 + 田, conviene aprenderlo como una sola pieza.',
    mnemonic: 'Una casa llena representa riqueza y abundancia.',
  },
  士: {
    character: '士', meaning: 'persona instruida · guerrero', formation: 'Forma base', components: [],
    explanation: 'Sus tres trazos forman una unidad; dividirlos no aporta una explicación útil para aprenderlo.',
    mnemonic: 'La línea superior amplia recuerda la presencia firme de una persona respetada.',
  },
  本: {
    character: '本', meaning: 'origen · libro', formation: 'Indicativo',
    components: [
      { character: '木', meaning: 'árbol', role: 'base gráfica' },
      { character: '一', meaning: 'marca', role: 'señala la raíz' },
    ],
    explanation: 'Es 木, árbol, con una línea que marca su raíz. De “raíz” pasó a expresar origen o base; más tarde también libro.',
    mnemonic: 'Marcá la raíz del árbol: ahí está su origen.',
  },
  毎: {
    character: '毎', meaning: 'cada', formation: 'Pictograma antiguo simplificado',
    components: [
      { character: '母', meaning: 'madre', role: 'forma histórica' },
      { character: '𠂉', meaning: 'adorno superior', role: 'marca visual' },
    ],
    explanation: 'La forma antigua representaba a una madre con un adorno en el cabello. El sentido “cada” proviene de un uso posterior, no de sumar literalmente estas partes.',
    mnemonic: 'Usá la semejanza con 母 para reconocerlo, pero recordá que 毎 significa “cada”.',
  },
  曜: {
    character: '曜', meaning: 'día de la semana · brillo', formation: 'Semántico-fonético',
    components: [
      { character: '日', meaning: 'sol · día', role: 'aporta sentido' },
      { character: '羽', meaning: 'plumas · alas', role: 'parte de 翟' },
      { character: '隹', meaning: 'ave pequeña', role: 'parte de 翟' },
    ],
    explanation: '日 aporta la idea de luz o día. 羽 + 隹 forman 翟, que aporta el sonido histórico del carácter.',
    mnemonic: 'El sol ilumina las plumas de un ave: es el brillo que marca el día.',
  },
  中: {
    character: '中', meaning: 'centro · dentro', formation: 'Indicativo',
    components: [
      { character: '口', meaning: 'recinto', role: 'espacio' },
      { character: '丨', meaning: 'línea vertical', role: 'marca el centro' },
    ],
    explanation: 'Una línea atraviesa el centro de un recinto para señalar “en medio” o “dentro”.',
    mnemonic: 'La línea pasa justo por el centro de la caja.',
  },
  学: {
    character: '学', meaning: 'estudio · aprender', formation: 'Forma simplificada de 學',
    components: [
      { character: '子', meaning: 'niño', role: 'parte visible' },
      { character: '冖', meaning: 'cubierta', role: 'forma simplificada' },
      { character: '⺍', meaning: 'trazos superiores', role: 'resto gráfico' },
    ],
    explanation: 'La forma antigua 學 representaba aprender imitando una enseñanza con las manos. La parte superior moderna está simplificada; 子, niño, sigue visible abajo.',
    mnemonic: 'Un niño bajo una cubierta recibe conocimiento desde arriba.',
  },
  校: {
    character: '校', meaning: 'escuela', formation: 'Semántico-fonético',
    components: [
      { character: '木', meaning: 'árbol · madera', role: 'aporta sentido original' },
      { character: '交', meaning: 'cruzar · mezclar', role: 'aporta sonido' },
    ],
    explanation: '木 aporta la idea original vinculada con madera y 交 aporta el sonido histórico. “Escuela” es un significado desarrollado después.',
    mnemonic: 'En la escuela, muchas personas se cruzan y aprenden juntas.',
  },
  一: {
    character: '一', meaning: 'uno', formation: 'Indicativo', components: [],
    explanation: 'Una sola línea horizontal representa una unidad y el comienzo de la serie numérica.',
    mnemonic: 'Una línea, una cosa: uno.',
  },
  二: {
    character: '二', meaning: 'dos', formation: 'Indicativo', components: [],
    explanation: 'Dos líneas horizontales representan directamente dos unidades.',
    mnemonic: 'Contá sus dos líneas: dos.',
  },
  三: {
    character: '三', meaning: 'tres', formation: 'Indicativo', components: [],
    explanation: 'Tres líneas horizontales representan directamente tres unidades.',
    mnemonic: 'Contá sus tres líneas: tres.',
  },
  四: {
    character: '四', meaning: 'cuatro', formation: 'Préstamo antiguo', components: [],
    explanation: 'La forma tuvo originalmente otro sentido y fue adoptada para escribir el número cuatro. No conviene dividirla como una suma de componentes.',
    mnemonic: 'El marco tiene cuatro lados: usalo como pista visual para “cuatro”.',
  },
  五: {
    character: '五', meaning: 'cinco', formation: 'Forma numérica tradicional', components: [],
    explanation: 'Es una forma numérica antigua transformada con el tiempo; sus trazos actuales funcionan como una unidad.',
    mnemonic: 'Las líneas se cruzan en el centro del cinco.',
  },
  六: {
    character: '六', meaning: 'seis', formation: 'Forma numérica tradicional', components: [],
    explanation: 'Sus trazos forman el número seis como una unidad y no aportan significados independientes útiles.',
    mnemonic: 'Un techo con dos patas: imaginá seis pasos para llegar debajo.',
  },
  七: {
    character: '七', meaning: 'siete', formation: 'Indicativo reutilizado', components: [],
    explanation: 'La forma mostraba originalmente una línea que corta otra y después se adoptó para representar el número siete.',
    mnemonic: 'El trazo doblado distingue al siete de 十.',
  },
  八: {
    character: '八', meaning: 'ocho', formation: 'Indicativo', components: [],
    explanation: 'Dos trazos que se separan expresaban la idea de dividir; la forma se usa para el número ocho.',
    mnemonic: 'Los dos trazos del ocho se abren hacia afuera.',
  },
  九: {
    character: '九', meaning: 'nueve', formation: 'Forma numérica tradicional', components: [],
    explanation: 'Es una forma numérica antigua que se aprende como una sola unidad, sin componentes semánticos separados.',
    mnemonic: 'El gancho final del nueve lo hace fácil de reconocer.',
  },
  十: {
    character: '十', meaning: 'diez', formation: 'Indicativo', components: [],
    explanation: 'Una línea vertical cruzada por otra representa una decena completa.',
    mnemonic: 'La cruz marca diez: una serie completa.',
  },
}

export const kanjiPartsFor = (item: Kana): KanjiPart[] =>
  [...(item.kanji ?? '')]
    .filter((character) => /\p{Script=Han}/u.test(character))
    .map((character) => ({ character, meaning: kanjiMeanings[character] ?? 'significado por aprender' }))

export const kanjiBreakdownFor = (character: string) => kanjiBreakdowns[character]

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
  romaji: string | readonly string[],
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
  {
    name: 'Números del 1 al 5', glyphs: '一二三四五', words: [
      ['一', 'いち', 'ichi', 'uno', '一', ['un', 'una']],
      ['二', 'に', 'ni', 'dos', '二'],
      ['三', 'さん', 'san', 'tres', '三'],
      ['四', 'よん', ['yon', 'shi'], 'cuatro', '四'],
      ['五', 'ご', 'go', 'cinco', '五'],
    ],
  },
  {
    name: 'Números del 6 al 10', glyphs: '六七八九十', words: [
      ['六', 'ろく', 'roku', 'seis', '六'],
      ['七', 'なな', ['nana', 'shichi'], 'siete', '七'],
      ['八', 'はち', 'hachi', 'ocho', '八'],
      ['九', 'きゅう', ['kyuu', 'ku'], 'nueve', '九'],
      ['十', 'じゅう', 'juu', 'diez', '十'],
    ],
  },
]

export const hiragana = createScript('hiragana')
export const katakana = createScript('katakana')
export const kanjiWords: Kana[] = kanjiUnits.flatMap((unit, group) =>
  unit.words.map(([kanji, reading, romaji, meaning, focusKanji, aliases], index) => {
    const romajiAnswers = typeof romaji === 'string' ? [romaji] : romaji
    return {
      id: `kanji-${group}-${index}-${romajiAnswers[0]}`,
      character: kanji,
      kanji,
      reading,
      meaning,
      meaningAnswers: [meaning, ...(aliases ?? [])],
      focusKanji,
      type: 'kanji' as const,
      romaji: romajiAnswers,
      difficulty: group + 1,
      group,
    }
  }),
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
