'use client'
import { useState } from 'react'
import { Check, Copy } from '@phosphor-icons/react'

type Props = { text: string; label?: string; iconOnly?: boolean; className?: string }

export function CopyButton({ text, label = 'Copy', iconOnly = false, className = '' }: Props) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setFailed(true)
      setTimeout(() => setFailed(false), 2400)
    }
  }

  const status = copied ? 'Copied' : failed ? "Couldn't copy" : label
  const icon = copied ? <Check weight="bold" aria-hidden /> : <Copy aria-hidden />

  if (iconOnly) {
    return (
      <button type="button" onClick={copy} aria-label={label} title={status} className={`grid place-items-center rounded-full transition-colors ${className}`}>
        {icon}
        <span aria-live="polite" className="sr-only">
          {copied ? 'Copied' : failed ? "Couldn't copy" : ''}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${className}`}
    >
      {icon}
      <span aria-live="polite">{failed ? 'Select and copy' : status}</span>
    </button>
  )
}
