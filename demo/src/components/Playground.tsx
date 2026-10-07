'use client'
import { useEffect, useRef, useState } from 'react'
import { Crosshair, CursorClick } from '@phosphor-icons/react'
import { PeekPal } from 'peekpal/react'
import type { Mood, PeekPalElement } from 'peekpal'
import { useActivePal } from '@/lib/active-pal'

const MOODS: Mood[] = ['blink', 'happy', 'love', 'surprised', 'wink', 'shy', 'sleepy', 'dizzy', 'celebrate']
const NAPS = [
  ['3 s', 3000],
  ['15 s', 15000],
  ['Never', 0],
] as const

type LogLine = { id: number; text: string }

export function Playground() {
  const pal = useRef<PeekPalElement>(null)
  const { pal: active, current } = useActivePal()
  const [nap, setNap] = useState<number>(3000)
  const [lastCall, setLastCall] = useState("// poke it, or press a button")
  const [watchingLogo, setWatchingLogo] = useState(false)
  const [log, setLog] = useState<LogLine[]>([])

  useEffect(() => {
    const el = pal.current
    if (!el) return
    let id = 0
    const add = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setLog((l) => [{ id: id++, text: `${e.type}${detail ? ` ${JSON.stringify(detail)}` : ''}` }, ...l].slice(0, 6))
    }
    const types = ['peekpal:poke', 'peekpal:sleep', 'peekpal:wake']
    types.forEach((t) => el.addEventListener(t, add))
    return () => types.forEach((t) => el.removeEventListener(t, add))
  }, [])

  function react(mood: Mood) {
    pal.current?.react(mood, 1200)
    setLastCall(`pal.react('${mood}', 1200)`)
  }

  function toggleLogo() {
    const el = pal.current
    if (!el) return
    if (watchingLogo) {
      el.lookAt(null)
      setLastCall('pal.lookAt(null) // back to the cursor')
    } else {
      const r = document.getElementById('logo')!.getBoundingClientRect()
      const [x, y] = [Math.round(r.left + r.width / 2 + scrollX), Math.round(r.top + r.height / 2 + scrollY)]
      el.lookAt(x, y)
      setLastCall(`pal.lookAt(${x}, ${y}) // the logo`)
    }
    setWatchingLogo(!watchingLogo)
  }

  return (
    <section id="playground" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="max-w-2xl">
        <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Playground</h2>
        <p className="mt-4 text-lg text-muted">
          Every button calls the real API. Set the nap timer to 3 seconds and keep still to watch it doze off.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-line bg-cream/60 px-6 py-10 dark:bg-surface">
          <PeekPal ref={pal} poses={current.poses} moods={current.moods} size={200} label={active.id} sleepAfter={nap} />
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted">
            <CursorClick aria-hidden /> Click it four times, fast.
          </p>
        </div>

        <div className="flex flex-col gap-6 rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-soft">
          <fieldset>
            <legend className="text-sm font-semibold">Moods</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => react(m)}
                  className="rounded-full border border-line bg-bg px-4 py-2 text-sm font-medium transition-colors hover:border-ginger hover:bg-cream"
                >
                  {m}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-6 sm:grid-cols-2">
            <fieldset>
              <legend className="text-sm font-semibold">Nap after</legend>
              <div className="mt-3 inline-flex rounded-full border border-line bg-bg p-1">
                {NAPS.map(([label, ms]) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={nap === ms}
                    onClick={() => {
                      setNap(ms)
                      setLastCall(`<peek-pal sleep-after="${ms}">`)
                    }}
                    className="rounded-full px-4 py-1.5 text-sm font-medium text-muted transition-colors aria-pressed:bg-ink aria-pressed:text-bg"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-semibold">Gaze</legend>
              <button
                type="button"
                aria-pressed={watchingLogo}
                onClick={toggleLogo}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-line bg-bg px-4 py-2 text-sm font-medium transition-colors hover:border-ginger aria-pressed:border-ginger aria-pressed:bg-cream"
              >
                <Crosshair aria-hidden />
                {watchingLogo ? 'Follow the cursor' : 'Stare at the logo'}
              </button>
            </fieldset>
          </div>

          <div className="mt-auto grid gap-3 rounded-[var(--radius-media)] bg-cocoa p-4 font-mono text-[13px] text-cocoa-ink">
            <p className="truncate text-ginger">{lastCall}</p>
            <ul aria-live="polite" aria-label="Events" className="min-h-[7.5rem] space-y-1 text-cocoa-ink/75">
              {log.length === 0 && <li className="text-cocoa-ink/50">events show up here</li>}
              {log.map((l) => (
                <li key={l.id}>{l.text}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
