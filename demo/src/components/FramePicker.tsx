'use client'
import { useState } from 'react'
import { FRAMES, type Detected, type Frame } from '@/lib/slice'

/** Shows the 18 slots and every detected drawing; pick a slot, then the drawing that belongs in it. */
export function FramePicker({
  det,
  chosen,
  onChange,
}: {
  det: Detected
  chosen: Record<Frame, number>
  onChange: (next: Record<Frame, number>) => void
}) {
  const [slot, setSlot] = useState<Frame>('up-left')
  const thumb = new Map(det.candidates.map((c) => [c.id, c.thumb]))

  function pick(id: number) {
    onChange({ ...chosen, [slot]: id })
    const i = FRAMES.indexOf(slot)
    if (i < FRAMES.length - 1) setSlot(FRAMES[i + 1])
  }

  const group = (title: string, frames: readonly Frame[]) => (
    <fieldset>
      <legend className="text-xs font-semibold tracking-wide text-muted uppercase">{title}</legend>
      <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-9">
        {frames.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={slot === f}
            aria-label={`${f}, drawing ${chosen[f] + 1}. Select to change.`}
            onClick={() => setSlot(f)}
            className="flex flex-col items-center rounded-xl border border-line bg-surface p-1 transition-colors hover:border-ginger aria-pressed:border-ginger aria-pressed:ring-2 aria-pressed:ring-ginger/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb.get(chosen[f])} alt="" className="size-12" />
            <span className="w-full truncate text-center font-mono text-[10px] text-muted">{f}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-media)] border border-line bg-surface/60 p-3">
      {group('Directions', FRAMES.slice(0, 9))}
      {group('Moods', FRAMES.slice(9))}
      <div>
        <p className="text-sm">
          Pick the drawing for <span className="font-mono font-medium text-ginger">{slot}</span>
        </p>
        <div className="mt-2 flex max-h-56 flex-wrap gap-1.5 overflow-y-auto" role="group" aria-label={`Drawings to use as ${slot}`}>
          {det.candidates.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={chosen[slot] === c.id}
              aria-label={`Drawing ${c.id + 1}`}
              onClick={() => pick(c.id)}
              className="rounded-lg border border-line bg-bg p-0.5 transition-colors hover:border-ginger aria-pressed:border-ginger aria-pressed:bg-cream"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.thumb} alt="" className="size-12" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
