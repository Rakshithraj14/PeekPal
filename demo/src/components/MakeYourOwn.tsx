'use client'
import Image from 'next/image'
import { Code } from './Code'
import { GITHUB } from './Nav'
import { useActivePal } from '@/lib/active-pal'
import { characters, slug } from '@/lib/pals'

const steps = [
  {
    title: 'Draw 18 frames',
    body: 'Nine directions and nine moods, same canvas, same body, transparent background. Only the head and face change. Hand-drawn or generated, both work.',
  },
  {
    title: 'Build the sheets',
    body: 'One Python script with Pillow. It checks every frame, crops them all to one shared box so nothing jumps, and tells you if the feet drift.',
  },
  {
    title: 'Point the tag at them',
    body: 'Two webp files, one tag. No canvas, no WebGL, no API key.',
  },
]

const build = `# a generated sheet? slice it into frames first
python tools/slice-sheet.py art/mochi --composite sheet.png

# 18 PNGs in, two sprite sheets out
python tools/build-sheets.py art/mochi --out public/pals`

export function MakeYourOwn() {
  const { pal } = useActivePal()
  const frames = pal.frames ? pal : characters[0] // uploads have sheets, not a frames strip
  const file = pal.custom ? slug(pal.name) : pal.id
  return (
    <section id="make" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="max-w-2xl">
        <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Make your own</h2>
        <p className="mt-4 text-lg text-muted">
          Any character works, from your own drawings. Read the{' '}
          <a className="font-medium text-ink underline decoration-ginger decoration-2 underline-offset-4" href={`${GITHUB}/blob/main/docs/drawing-guide.md`}>
            drawing guide
          </a>{' '}
          or start from the{' '}
          <a className="font-medium text-ink underline decoration-ginger decoration-2 underline-offset-4" href={`${GITHUB}/blob/main/docs/image-prompt.md`}>
            image prompt
          </a>
          .
        </p>
      </div>

      <ol className="mt-10 grid gap-6 lg:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-[var(--radius-card)] border border-line bg-surface p-6">
            <span className="grid size-9 place-items-center rounded-full bg-ginger font-display font-bold text-ginger-ink">{i + 1}</span>
            <h3 className="mt-4 font-display text-xl font-bold tracking-tight">{s.title}</h3>
            <p className="mt-2 text-muted">{s.body}</p>
          </li>
        ))}
      </ol>

      <figure className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-6">
        <div className="overflow-x-auto">
          <Image
            src={frames.frames!}
            alt={`The 18 frames of ${frames.name}: nine looking directions on top, nine moods below`}
            width={1440}
            height={320}
            className="h-auto min-w-[720px] w-full"
          />
        </div>
        <figcaption className="mt-3 text-sm text-muted">
          Top row: up-left to down-right. Bottom row: blink, happy, love, surprised, wink, shy, sleepy, dizzy, celebrate.
        </figcaption>
      </figure>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Code code={build} label="terminal" />
        <div className="grid grid-cols-2 gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
          {(['poses', 'moods'] as const).map((s) => (
            <figure key={s}>
              <Image src={pal[s]} alt={`${file}-${s}.webp sprite sheet`} width={768} height={768} className="h-auto w-full rounded-[var(--radius-media)] bg-cream/60 dark:bg-bg" />
              <figcaption className="mt-2 text-center font-mono text-xs text-muted">{file}-{s}.webp</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
