'use client'
import { useId, useState, type FormEvent } from 'react'
import { ImageSquare, Plus, Warning } from '@phosphor-icons/react'
import { PeekPal } from 'peekpal/react'
import { useActivePal } from '@/lib/active-pal'
import { build, detect, type Detected, type Frame } from '@/lib/slice'
import { FramePicker } from './FramePicker'
import { GITHUB } from './Nav'

type Mode = 'one' | 'pair'
type Errors = Partial<Record<'generated' | 'name', string>>

function DropZone(props: { label: string; hint: string; preview?: string; busy: boolean; tall?: boolean; onFile: (f?: File) => void }) {
  const { label, hint, preview, busy, tall, onFile } = props
  return (
    <label
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        onFile(e.dataTransfer.files[0])
      }}
      className={`flex min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius-media)] border border-line bg-surface p-2 text-center transition-colors hover:border-ginger has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ginger ${
        tall ? 'h-36' : 'h-28'
      }`}
    >
      {preview && !busy ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="h-full w-auto max-w-full object-contain" />
      ) : (
        <>
          <ImageSquare size={22} className="text-muted" aria-hidden />
          <span className="text-sm font-medium">{busy ? 'Reading…' : label}</span>
          <span className="text-xs text-muted">{hint}</span>
        </>
      )}
      <input type="file" accept="image/png,image/webp" className="sr-only" aria-label={`${label}, PNG or WebP`} onChange={(e) => onFile(e.target.files?.[0])} />
    </label>
  )
}

export function UploadCard() {
  const { addCustom } = useActivePal()
  const id = useId()
  const [mode, setMode] = useState<Mode>('one')
  const [name, setName] = useState('')
  const [files, setFiles] = useState<{ poses?: string; moods?: string }>({})
  const [sources, setSources] = useState<(File | undefined)[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [det, setDet] = useState<Detected | null>(null)
  const [chosen, setChosen] = useState<Record<Frame, number> | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ text: string; warn: boolean } | null>(null)

  function reset() {
    previews.forEach((u) => u && URL.revokeObjectURL(u))
    setPreviews([])
    setSources([])
    setDet(null)
    setChosen(null)
    setFiles({})
    setErrors({})
  }

  /** Generated image(s): find the drawings, guess the 18 frames, build the sheets. */
  async function pick(index: number, file?: File) {
    if (!file) return
    setDone(null)
    const next = [...sources]
    next[index] = file
    setSources(next)
    setPreviews((p) => {
      const copy = [...p]
      if (copy[index]) URL.revokeObjectURL(copy[index])
      copy[index] = URL.createObjectURL(file)
      return copy
    })
    const need = mode === 'one' ? 1 : 2
    if (next.slice(0, need).filter(Boolean).length < need) return
    setBusy(true)
    setErrors((e) => ({ ...e, generated: undefined }))
    try {
      const found = await detect(next.slice(0, need) as File[])
      setDet(found)
      setChosen(found.guess)
      setFiles(build(found, found.guess))
    } catch (err) {
      setDet(null)
      setChosen(null)
      setFiles({})
      setErrors((e) => ({ ...e, generated: (err as Error).message }))
    } finally {
      setBusy(false)
    }
  }

  function repick(next: Record<Frame, number>) {
    setChosen(next)
    setFiles(build(det!, next))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const clean = name.trim()
    const next: Errors = {}
    if (!clean) next.name = 'Give your pal a name.'
    if (!files.poses) next.generated ??= mode === 'one' ? 'Add the generated image.' : 'Add both images.'
    if (Object.keys(next).length) return setErrors({ ...errors, ...next })

    const { saved } = addCustom({
      id: `custom-${Date.now()}`,
      name: clean,
      blurb: 'Uploaded by you. Lives in this browser only.',
      poses: files.poses!,
      moods: files.moods!,
      custom: true,
    })
    setDone({
      text: saved ? `${clean} is on the page now.` : `${clean} is on the page, but this browser is out of storage, so it will be gone after a reload.`,
      warn: !saved,
    })
    setName('')
    reset()
  }

  return (
    <li className="flex min-w-0 flex-col rounded-[var(--radius-card)] border-2 border-dashed border-line bg-bg/60 p-5 sm:p-6">
      <form onSubmit={submit} noValidate className="flex h-full flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="grid size-20 shrink-0 place-items-center rounded-[var(--radius-media)] bg-cream/70 dark:bg-surface">
            {files.poses ? (
              <PeekPal poses={files.poses} moods={files.moods ?? files.poses} size={76} label="preview" sleepAfter={0} />
            ) : (
              <Plus size={28} className="text-muted" aria-hidden />
            )}
          </div>
          <div>
            <h3 className="font-display text-2xl font-bold tracking-tight">Add your own</h3>
            <p className="mt-1 text-sm text-muted">
              Drop the image from the{' '}
              <a className="text-ink underline decoration-ginger underline-offset-2" href={`${GITHUB}/blob/main/docs/image-prompt.md`}>
                image prompt
              </a>
              . It is cut up right here and stays in this browser.
            </p>
          </div>
        </div>

        <div className="inline-flex self-start rounded-full border border-line bg-surface p-1" role="group" aria-label="Upload type">
          {(
            [
              ['one', 'One image'],
              ['pair', 'Two images'],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m)
                reset()
              }}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted transition-colors aria-pressed:bg-ink aria-pressed:text-bg"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {mode === 'one' ? (
            <DropZone label="Generated image" hint="directions + expressions, PNG under 5 MB" preview={previews[0]} busy={busy} tall onFile={(f) => pick(0, f)} />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <DropZone label="Directions image" hint="the 9 looking directions" preview={previews[0]} busy={false} onFile={(f) => pick(0, f)} />
              <DropZone label="Expressions image" hint="9 to 25 expressions" preview={previews[1]} busy={busy} onFile={(f) => pick(1, f)} />
            </div>
          )}
          {errors.generated && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {errors.generated}
            </p>
          )}
          {det && chosen && !busy && (
            <>
              <p className={`text-sm ${det.note ? 'font-medium text-ink' : 'text-muted'}`}>
                {det.note ?? 'Cut into 18 frames and lined up on the feet. Poke the preview to check.'}
              </p>
              <details open={!!det.note}>
                <summary className="cursor-pointer text-sm font-medium text-ink underline decoration-ginger underline-offset-4">
                  Check the 18 frames
                </summary>
                <div className="mt-3">
                  <FramePicker det={det} chosen={chosen} onChange={repick} />
                </div>
              </details>
            </>
          )}
        </div>

        <div>
          <label htmlFor={`${id}-name`} className="text-sm font-semibold">
            Name
          </label>
          <input
            id={`${id}-name`}
            value={name}
            maxLength={30}
            onChange={(e) => {
              setName(e.target.value)
              setErrors((x) => ({ ...x, name: undefined }))
            }}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `${id}-name-err` : undefined}
            placeholder="Biscuit the otter"
            className="mt-1.5 w-full rounded-full border border-line bg-surface px-4 py-2.5 text-sm outline-none focus-visible:border-ginger aria-invalid:border-red-500"
          />
          {errors.name && (
            <p id={`${id}-name-err`} className="mt-1.5 text-sm text-red-700 dark:text-red-400">
              {errors.name}
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-ginger px-5 py-2.5 text-sm font-medium text-ginger-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            <Plus weight="bold" aria-hidden />
            Add to gallery
          </button>
          <p aria-live="polite" className={`flex items-center gap-1.5 text-sm ${done?.warn ? 'text-red-700 dark:text-red-400' : 'text-muted'}`}>
            {done?.warn && <Warning aria-hidden />}
            {done?.text}
          </p>
        </div>
      </form>
    </li>
  )
}
