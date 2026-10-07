export type Character = {
  id: string
  name: string
  blurb: string
  poses: string
  moods: string
  /** Strip of the 18 frames, for the built-in pals only. */
  frames?: string
  /** Uploaded by the visitor and kept in their browser. */
  custom?: boolean
  /** Has no sketch/riso sheets, e.g. a pal merged from a gallery submission. */
  colourOnly?: boolean
}

export const characters: Character[] = [
  {
    id: 'cat',
    name: 'Mochi the cat',
    blurb: 'The face of peekpal. Curious, a little nosy, terrible at keeping secrets.',
    poses: '/pals/cat-poses.webp',
    moods: '/pals/cat-moods.webp',
    frames: '/make/cat-frames.webp',
  },
  {
    id: 'lloyd',
    name: 'Lloyd',
    blurb: 'Messy hair, sharp eyes, a coat he never takes off. Flusters easily.',
    poses: '/pals/lloyd-poses.webp',
    moods: '/pals/lloyd-moods.webp',
    frames: '/make/lloyd-frames.webp',
  },
]

/** Made with tools/stylize.py from each character's frames. */
export const styles = [
  { id: 'colour', note: 'the default' },
  { id: 'sketch', note: 'pencil' },
  { id: 'riso', note: 'two-tone print' },
] as const

export type Style = (typeof styles)[number]['id']

export function sheets(c: Character, style: Style) {
  // Uploads have no styled sheets; styles come from tools/stylize.py.
  if (style === 'colour' || c.custom || c.colourOnly) return { poses: c.poses, moods: c.moods }
  return { poses: `/pals/${c.id}-${style}-poses.webp`, moods: `/pals/${c.id}-${style}-moods.webp` }
}

export const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-pal'

export const snippet = (c: Character, style: Style = 'colour') => {
  // Uploads live in the browser as data URLs; point the snippet at files they would host.
  const ext = (u: string) => (u.startsWith('data:image/png') ? 'png' : 'webp') // Safari encodes PNG
  const s = c.custom
    ? { poses: `/pals/${slug(c.name)}-poses.${ext(c.poses)}`, moods: `/pals/${slug(c.name)}-moods.${ext(c.moods)}` }
    : sheets(c, style)
  return `<script type="module" src="https://unpkg.com/peekpal"></script>

<peek-pal
  poses="${s.poses}"
  moods="${s.moods}"
  label="${c.custom ? slug(c.name) : c.id}"
></peek-pal>`
}
