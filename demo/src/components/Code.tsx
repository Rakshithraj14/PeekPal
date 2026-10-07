import { CopyButton } from './CopyButton'

/** A dark code block with a copy button. */
export function Code({ code, label, className = '' }: { code: string; label?: string; className?: string }) {
  return (
    <div className={`relative min-w-0 overflow-hidden rounded-[var(--radius-media)] bg-cocoa text-cocoa-ink ${className}`}>
      <div className="flex items-center justify-between border-b border-white/10 py-2 pr-2 pl-4">
        <span className="text-xs font-medium tracking-wide text-cocoa-ink/60 uppercase">{label ?? 'html'}</span>
        <CopyButton text={code} className="text-cocoa-ink/80 hover:bg-white/10 hover:text-cocoa-ink" />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}
