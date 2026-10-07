// Browser port of tools/slice-sheet.py + build-sheets.py: generated image(s) in, two 3×3 sheets out.
// detect() finds every drawn character and guesses which is which; build() renders the sheets
// from an assignment, so the frame picker can fix a wrong guess.
import { MOODS, POSES } from 'peekpal'

export const FRAMES = [...POSES, ...MOODS]
export type Frame = (typeof FRAMES)[number]

const ALPHA_MIN = 24 // below this is background noise
const WHITE = 225 // a pixel with every channel at or above this counts as white background
const BODY = 0.35 // bottom fraction of a character used as its body anchor
const PAD = 0.08
const CELL = 256
const MAX_MB = 5
// Order of the expressions in docs/image-prompt.md; its first 9 cover our moods.
const PROMPT_MOODS = ['blink', 'happy', 'love', 'wink', 'surprised', 'shy', 'sleepy', 'dizzy', 'celebrate']

type Box = { x0: number; y0: number; x1: number; y1: number }
export type Candidate = { id: number; src: HTMLCanvasElement; box: Box; thumb: string }
export type Detected = { candidates: Candidate[]; guess: Record<Frame, number>; note?: string }

const height = (b: Box) => b.y1 - b.y0
const cy = (b: Box) => (b.y0 + b.y1) / 2

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d', { willReadFrequently: true })!] as const
}

/** Flood-label `mask` (1 = in) and call `each` with the pixel indices of every 4-connected region. */
function regions(mask: Uint8Array, w: number, each: (pixels: Int32Array, count: number) => void) {
  const seen = new Uint8Array(mask.length)
  const stack = new Int32Array(mask.length)
  const pixels = new Int32Array(mask.length)
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue
    let top = 0
    let count = 0
    stack[top++] = start
    seen[start] = 1
    while (top) {
      const i = stack[--top]
      pixels[count++] = i
      const x = i % w
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w])
        if (j >= 0 && j < mask.length && mask[j] && !seen[j]) {
          seen[j] = 1
          stack[top++] = j
        }
    }
    each(pixels, count)
  }
}

/**
 * For generators that ignore "transparent background": every large white region becomes transparent,
 * wherever it is (also inside grid boxes). Small white areas, like eye highlights, stay.
 */
function removeWhiteBackground(img: ImageData) {
  const { width: w, data: d } = img
  const n = d.length / 4
  const white = new Uint8Array(n)
  for (let i = 0; i < n; i++) white[i] = Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) >= WHITE ? 1 : 0
  const bg = new Uint8Array(n)
  regions(white, w, (px, count) => {
    if (count > n * 0.002) for (let k = 0; k < count; k++) bg[px[k]] = 1
  })
  for (let i = 0; i < n; i++) {
    if (bg[i]) {
      d[i * 4 + 3] = 0
      continue
    }
    // Soften the light anti-aliased edge left behind, so no white halo shows on dark pages.
    const x = i % w
    if ((x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) || bg[i - w] || bg[i + w]) {
      const m = Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2])
      if (m >= 170) d[i * 4 + 3] = Math.round((255 * (255 - m)) / (255 - 170))
    }
  }
}

/** Min (erode) or max (dilate) filter with radius r, done as two 1-D passes. */
function morph(m: Uint8Array, w: number, h: number, r: number, max: boolean) {
  const pass = (src: Uint8Array, horiz: boolean) => {
    const out = new Uint8Array(src.length)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let v = max ? 0 : 1
        for (let k = -r; k <= r; k++) {
          const xx = horiz ? x + k : x
          const yy = horiz ? y : y + k
          const s = xx < 0 || yy < 0 || xx >= w || yy >= h ? 0 : src[yy * w + xx]
          v = max ? v | s : v & s
        }
        out[y * w + x] = v
      }
    return out
  }
  return pass(pass(m, true), false)
}

function readingOrder<T extends { box: Box }>(items: T[]) {
  if (!items.length) return items
  const sorted = [...items].sort((a, b) => cy(a.box) - cy(b.box))
  const rowGap = items.map((c) => height(c.box)).sort((a, b) => a - b)[items.length >> 1] * 0.5
  const rows: T[][] = [[sorted[0]]]
  for (const c of sorted.slice(1)) {
    const row = rows[rows.length - 1]
    if (cy(c.box) - cy(row[row.length - 1].box) > rowGap) rows.push([c])
    else row.push(c)
  }
  return rows.flatMap((r) => r.sort((a, b) => a.box.x0 - b.box.x0))
}

/** Load one image and return the characters drawn in it, in reading order. */
async function findCharacters(file: File, firstId: number): Promise<Candidate[]> {
  if (!['image/png', 'image/webp'].includes(file.type)) throw new Error('Use a PNG or WebP image.')
  if (file.size > MAX_MB * 1024 * 1024)
    throw new Error(`That file is over ${MAX_MB} MB. Resize it to about 2048 px on the longest side and try again.`)
  const bmp = await createImageBitmap(file).catch(() => {
    throw new Error("That image couldn't be read.")
  })
  const W = bmp.width
  const H = bmp.height
  const [src, ctx] = canvas(W, H)
  ctx.drawImage(bmp, 0, 0)
  bmp.close()
  const img = ctx.getImageData(0, 0, W, H)
  const d = img.data
  const clear = () => {
    let n = 0
    for (let i = 3; i < d.length; i += 4) if (d[i] < ALPHA_MIN) (d[i] = 0), n++
    return n
  }
  if (clear() < (W * H) / 10) {
    removeWhiteBackground(img)
    if (clear() < (W * H) / 10) throw new Error('Couldn’t find the background. Use a transparent or plain white background.')
  }
  ctx.putImageData(img, 0, 0)

  // Find characters on a half-size mask; the opening removes thin grid lines and label strokes.
  const w = W >> 1
  const h = H >> 1
  let m = new Uint8Array(w * h)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (2 * y * W + 2 * x) * 4 + 3
      m[y * w + x] = d[i] + d[i + 4] + d[i + W * 4] + d[i + W * 4 + 4] >= 512 ? 1 : 0
    }
  m = morph(morph(m, w, h, 2, false), w, h, 2, true)
  const found: Box[] = []
  regions(m, w, (px, count) => {
    const b = { x0: w, y0: h, x1: 0, y1: 0 }
    for (let k = 0; k < count; k++) {
      const x = px[k] % w
      const y = (px[k] / w) | 0
      if (x < b.x0) b.x0 = x
      if (x >= b.x1) b.x1 = x + 1
      if (y < b.y0) b.y0 = y
      if (y >= b.y1) b.y1 = y + 1
    }
    found.push(b)
  })
  if (!found.length) throw new Error('No characters found in that image.')

  // Size reference: the median of the character-sized blobs, so one merged blob can't hide the rest.
  const tall = Math.max(...found.map(height))
  const sizes = found.map(height).filter((v) => v >= tall * 0.3).sort((a, b) => a - b)
  const ref = sizes[sizes.length >> 1]
  const big = found.filter((b) => height(b) >= ref * 0.5)
  for (const s of found) {
    if (big.includes(s)) continue
    // Glue hearts and sparkles floating next to a character onto it.
    const near = big.find((b) => Math.max(b.x0 - s.x1, s.x0 - b.x1, b.y0 - s.y1, s.y0 - b.y1, 0) <= ref * 0.1)
    if (near) Object.assign(near, { x0: Math.min(near.x0, s.x0), y0: Math.min(near.y0, s.y0), x1: Math.max(near.x1, s.x1), y1: Math.max(near.y1, s.y1) })
  }

  const T = 72
  return readingOrder(
    big.map((b, k) => {
      const box = { x0: b.x0 * 2, y0: b.y0 * 2, x1: Math.min(W, b.x1 * 2), y1: Math.min(H, b.y1 * 2) }
      const [t, tctx] = canvas(T, T)
      const s = T / Math.max(box.x1 - box.x0, box.y1 - box.y0)
      const tw = (box.x1 - box.x0) * s
      const th = (box.y1 - box.y0) * s
      tctx.drawImage(src, box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0, (T - tw) / 2, T - th, tw, th)
      return { id: firstId + k, src, box, thumb: t.toDataURL() }
    }),
  ).map((c, k) => ({ ...c, id: firstId + k }))
}

function assign(poses: Candidate[], moods: Candidate[], moodOrder: string[]) {
  const guess = {} as Record<Frame, number>
  POSES.forEach((f, i) => (guess[f] = poses[Math.min(i, poses.length - 1)].id))
  MOODS.forEach((f) => {
    const k = moodOrder.indexOf(f)
    guess[f] = (moods[k] ?? moods[moods.length - 1] ?? poses[4]).id
  })
  return guess
}

/** Find the characters in one generated image (directions + expressions) or two (directions, expressions). */
/** A drawing much taller than the rest is usually several characters touching. */
function touching(cands: Candidate[]) {
  const hs = cands.map((c) => height(c.box)).sort((a, b) => a - b)
  return cands.some((c) => height(c.box) > hs[hs.length >> 1] * 1.6)
}

/**
 * The 9 directions in a one-image layout: the leftmost 9 when every other drawing sits to their right
 * (sections side by side), or the topmost 9 when every other drawing sits below them (stacked).
 * Both lists stay in reading order.
 */
function splitSections(all: Candidate[]): [Candidate[], Candidate[]] | null {
  const cx = (b: Box) => (b.x0 + b.x1) / 2
  for (const [key, end, centre] of [
    ['x0', 'x1', cx],
    ['y0', 'y1', cy],
  ] as const) {
    const nine = new Set([...all].sort((a, b) => a.box[key] - b.box[key]).slice(0, 9))
    const edge = Math.max(...[...nine].map((c) => c.box[end]))
    const rest = all.filter((c) => !nine.has(c))
    if (isGrid3([...nine]) && rest.every((c) => centre(c.box) > edge)) return [all.filter((c) => nine.has(c)), rest]
  }
  return null
}

/** True when 9 drawings sit in 3 rows of 3. */
function isGrid3(nine: Candidate[]) {
  const sorted = [...nine].sort((a, b) => cy(a.box) - cy(b.box))
  const gap = nine.map((c) => height(c.box)).sort((a, b) => a - b)[4] * 0.5
  const rows = [1]
  for (let i = 1; i < sorted.length; i++)
    if (cy(sorted[i].box) - cy(sorted[i - 1].box) > gap) rows.push(1)
    else rows[rows.length - 1]++
  return rows.length === 3 && rows.every((n) => n === 3)
}

export async function detect(files: File[]): Promise<Detected> {
  if (files.length === 2) {
    const poses = await findCharacters(files[0], 0)
    const moods = await findCharacters(files[1], poses.length)
    const notes = []
    if (poses.length !== 9) notes.push(`found ${poses.length} drawings in the directions image, expected 9`)
    if (moods.length < 9) notes.push(`found ${moods.length} drawings in the expressions image, expected at least 9`)
    if (touching([...poses, ...moods])) notes.push('some characters seem to touch each other')
    return {
      candidates: [...poses, ...moods],
      guess: assign(poses, moods, moods.length === 9 ? [...MOODS] : PROMPT_MOODS),
      note: notes.length ? `We ${notes.join(' and ')}, so check the frames below.` : undefined,
    }
  }

  const all = await findCharacters(files[0], 0)
  if (all.length < 9) throw new Error(`Found only ${all.length} drawings. Characters may be touching; regenerate with more space between them.`)
  const merged = touching(all)
  const sections = splitSections(all)
  if (!merged && sections && (all.length === 29 || all.length === 18)) {
    const [poses, moods] = sections
    return { candidates: all, guess: assign(poses, moods, all.length === 29 ? PROMPT_MOODS : [...MOODS]) }
  }
  const [poses, moods] = sections ?? [all.slice(0, 9), all.slice(9)]
  return {
    candidates: all,
    guess: assign(poses, moods, PROMPT_MOODS),
    note: merged
      ? 'Some characters seem to touch each other, so we guessed which is which. Check the frames below, or regenerate with more space between them.'
      : `Found ${all.length} drawings instead of 29, so we guessed which is which. Check the frames below.`,
  }
}

/** Render the two sheets <peek-pal> reads, as data URLs, from a frame → candidate assignment. */
export function build(det: Detected, chosen: Record<Frame, number>): { poses: string; moods: string } {
  const byId = new Map(det.candidates.map((c) => [c.id, c]))
  type Piece = { c: Candidate; w: number; h: number; ax: number; ay: number; scale: number }
  const measure = (c: Candidate): Piece => {
    const { box, src } = c
    const pw = box.x1 - box.x0
    const ph = box.y1 - box.y0
    const a = src.getContext('2d', { willReadFrequently: true })!.getImageData(box.x0, box.y0, pw, ph).data
    let top = ph
    let bottom = 0
    for (let y = 0; y < ph; y++)
      for (let x = 0; x < pw; x++)
        if (a[(y * pw + x) * 4 + 3] > ALPHA_MIN) {
          if (y < top) top = y
          bottom = y + 1
        }
    let sum = 0
    let n = 0
    for (let y = Math.floor(bottom - (bottom - top) * BODY); y < bottom; y++)
      for (let x = 0; x < pw; x++)
        if (a[(y * pw + x) * 4 + 3] > ALPHA_MIN) (sum += x), n++
    return { c, w: pw, h: ph, ax: n ? sum / n : pw / 2, ay: bottom, scale: 1 }
  }
  const pieces = Object.fromEntries(FRAMES.map((f) => [f, measure(byId.get(chosen[f])!)])) as Record<Frame, Piece>

  // Generators often draw the two grids at different sizes; match the moods to the poses.
  const median = (fs: readonly Frame[]) => fs.map((f) => pieces[f].h).sort((a, b) => a - b)[fs.length >> 1]
  const k = median(POSES) / median(MOODS)
  // Copies, since one drawing may fill both a pose and a mood slot.
  MOODS.forEach((f) => (pieces[f] = { ...pieces[f], scale: k }))

  const list = Object.values(pieces)
  const left = Math.max(...list.map((p) => p.ax * p.scale))
  const right = Math.max(...list.map((p) => (p.w - p.ax) * p.scale))
  const up = Math.max(...list.map((p) => p.ay * p.scale))
  const side = Math.max(left + right, up) / (1 - 2 * PAD)
  const fx = (side - (left + right)) / 2 + left // where every frame's feet land
  const fy = (side - up) / 2 + up
  const s = CELL / side

  const sheet = (names: readonly Frame[]) => {
    const [out, ctx] = canvas(CELL * 3, CELL * 3)
    names.forEach((name, i) => {
      const { c, w, h, ax, ay, scale } = pieces[name]
      const x = (i % 3) * CELL
      const y = Math.floor(i / 3) * CELL
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, CELL, CELL)
      ctx.clip()
      ctx.drawImage(c.src, c.box.x0, c.box.y0, w, h, x + (fx - ax * scale) * s, y + (fy - ay * scale) * s, w * scale * s, h * scale * s)
      ctx.restore()
    })
    return out.toDataURL('image/webp', 0.9)
  }
  return { poses: sheet(POSES), moods: sheet(MOODS) }
}
