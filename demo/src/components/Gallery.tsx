'use client'
import { PeekPal } from 'peekpal/react'
import { ArrowSquareOut, CheckCircle, DownloadSimple, Trash } from '@phosphor-icons/react'
import { sheets, slug, snippet, styles, type Character } from '@/lib/pals'
import { dataUrlBytes, zip } from '@/lib/zip'
import { useActivePal } from '@/lib/active-pal'
import { CopyButton } from './CopyButton'
import { UploadCard } from './UploadCard'
import { GITHUB } from './Nav'

const ext = (url: string) => (url.startsWith('data:image/png') ? 'png' : 'webp')

/** Zip an uploaded pal's two sheets and its snippet, ready to drop into a site or attach to an issue. */
function download(c: Character) {
  const name = slug(c.name)
  const blob = zip([
    { name: `${name}/${name}-poses.${ext(c.poses)}`, data: dataUrlBytes(c.poses) },
    { name: `${name}/${name}-moods.${ext(c.moods)}`, data: dataUrlBytes(c.moods) },
    { name: `${name}/snippet.html`, data: new TextEncoder().encode(`${snippet(c)}
`) },
  ])
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${name}.zip`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

const submitUrl = (c: Character) =>
  `${GITHUB}/issues/new?template=submit-a-pal.yml&title=${encodeURIComponent(`Pal: ${c.name}`)}`

export function Gallery() {
  const { characters, pal, setPal, style, setStyle, removeCustom } = useActivePal()

  return (
    <section id="gallery" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="max-w-2xl">
        <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Gallery</h2>
        <p className="mt-4 text-lg text-muted">
          Tap a pal to bring it to the whole page, then try it in another style. Copy the snippet when you find the one.
        </p>
      </div>

      <ul className="mt-10 grid items-start gap-6 md:grid-cols-2">
        {characters.map((c) => {
          const on = c.id === pal.id
          const s = sheets(c, style)
          return (
            <li
              key={c.id}
              className={`relative flex min-w-0 items-center gap-5 rounded-[var(--radius-card)] border bg-surface p-5 shadow-soft transition-colors sm:gap-6 sm:p-6 ${
                on ? 'border-ginger ring-2 ring-ginger/40' : 'border-line'
              }`}
            >
              {/* The pal is its own button; a click pokes it and picks it. */}
              <div onClick={() => setPal(c)} className="grid size-36 shrink-0 place-items-center rounded-[var(--radius-media)] bg-cream/70 sm:size-40 dark:bg-bg">
                <PeekPal poses={s.poses} moods={s.moods} size={140} label={c.id} sleepAfter={0} />
              </div>
              <div className="min-w-0 pr-10">
                <h3 className="flex flex-wrap items-center gap-2 font-display text-2xl font-bold tracking-tight">
                  <span className="break-words">{c.name}</span>
                  {c.custom && <span className="rounded-full bg-cream px-2 py-0.5 font-sans text-xs font-medium text-ink">Yours</span>}
                </h3>
                <p className="mt-1 text-muted">{c.blurb}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setPal(c)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3 py-1.5 text-sm font-medium transition-colors hover:border-ginger aria-pressed:border-ginger aria-pressed:bg-ginger aria-pressed:text-ginger-ink"
                  >
                    {on && <CheckCircle weight="fill" aria-hidden />}
                    {on ? 'On the page' : 'Use this pal'}
                  </button>
                  {c.custom && (
                    <>
                      <button
                        type="button"
                        onClick={() => download(c)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3 py-1.5 text-sm font-medium transition-colors hover:border-ginger"
                      >
                        <DownloadSimple aria-hidden />
                        Download
                      </button>
                      <a
                        href={submitUrl(c)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-muted underline decoration-ginger underline-offset-4 hover:text-ink"
                      >
                        Submit to gallery
                        <ArrowSquareOut aria-hidden />
                        <span className="sr-only">(opens GitHub in a new tab)</span>
                      </a>
                    </>
                  )}
                </div>
                {c.custom && <p className="mt-2 text-xs text-muted">To submit: download the zip, then attach it to the GitHub form.</p>}
              </div>
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <CopyButton
                  text={snippet(c, style)}
                  label={`Copy the ${c.name} snippet`}
                  iconOnly
                  className="size-10 border border-line bg-bg text-lg text-muted hover:border-ginger hover:bg-ginger hover:text-ginger-ink"
                />
                {c.custom && (
                  <button
                    type="button"
                    onClick={() => removeCustom(c.id)}
                    aria-label={`Remove ${c.name}`}
                    title="Remove"
                    className="grid size-10 place-items-center rounded-full border border-line bg-bg text-lg text-muted transition-colors hover:border-red-500 hover:text-red-600"
                  >
                    <Trash aria-hidden />
                  </button>
                )}
              </div>
            </li>
          )
        })}
        <UploadCard />
      </ul>

      <div className="mt-14">
        <h3 className="font-display text-2xl font-bold tracking-tight">Styles</h3>
        <p className="mt-1 text-muted">
          The same 18 frames through one filter each, with <code className="font-mono text-[0.9em] text-ink">tools/stylize.py</code>. No new drawing.
        </p>
        {pal.custom || pal.colourOnly ? (
          <p className="mt-6 max-w-2xl rounded-[var(--radius-media)] border border-line bg-surface px-4 py-3 text-sm text-muted">
            {pal.name} shows in colour. Run <code className="font-mono text-ink">tools/stylize.py</code> on its 18 frames to make sketch and riso sheets.
          </p>
        ) : (
        <ul className="mt-8 grid max-w-2xl grid-cols-3 gap-x-4 gap-y-10">
          {styles.map((st) => {
            const on = st.id === style
            const s = sheets(pal, st.id)
            return (
              <li key={st.id} className="group">
                <div onClick={() => setStyle(st.id)} className="relative flex justify-center">
                  <PeekPal poses={s.poses} moods={s.moods} size={110} label={`${pal.id}, ${st.id}`} sleepAfter={0} />
                  {!on && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute bottom-1 rounded-full bg-ink px-3 py-1 text-xs font-medium text-bg opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                    >
                      Use {st.id}
                    </span>
                  )}
                </div>
                <button type="button" aria-pressed={on} onClick={() => setStyle(st.id)} className="mt-3 block rounded-md text-left">
                  <span className={`flex items-center gap-1.5 font-mono text-sm ${on ? 'text-ink' : 'text-ink/80'}`}>
                    {st.id}
                    {on && <span className="size-1.5 rounded-full bg-ginger" aria-hidden />}
                  </span>
                  <span className="block text-sm text-muted">{st.note}</span>
                  <span className="sr-only">{on ? ', in use' : `, use the ${st.id} style`}</span>
                </button>
              </li>
            )
          })}
        </ul>
        )}
      </div>
    </section>
  )
}
