import Image from 'next/image'
import { GithubLogo } from '@phosphor-icons/react/dist/ssr'

export const GITHUB = 'https://github.com/Rakshithraj14/PeekPal'

const links = [
  ['Playground', '#playground'],
  ['Gallery', '#gallery'],
  ['Make your own', '#make'],
  ['API', '#api'],
]

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
          <Image id="logo" src="/logo.png" alt="" width={32} height={32} priority />
          peekpal
        </a>
        <div className="flex items-center gap-1">
          <ul className="hidden items-center gap-1 md:flex">
            {links.map(([label, href]) => (
              <li key={href}>
                <a href={href} className="rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-cream hover:text-ink">
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={GITHUB}
            className="ml-2 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-ink/30"
          >
            <GithubLogo size={18} weight="fill" aria-hidden />
            <span className="hidden sm:inline">GitHub</span>
            <span className="sr-only sm:hidden">GitHub</span>
          </a>
        </div>
      </nav>
    </header>
  )
}
