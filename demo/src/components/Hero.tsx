'use client'
import { useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowDown, GithubLogo } from '@phosphor-icons/react'
import { PeekPal } from 'peekpal/react'
import { CopyButton } from './CopyButton'
import { GITHUB } from './Nav'
import { useActivePal } from '@/lib/active-pal'

const ease = [0.16, 1, 0.3, 1] as const

export function Hero() {
  const still = useReducedMotion()
  const { pal, style, current } = useActivePal()
  const firstLoad = useRef(true)
  const delay = firstLoad.current ? 0.35 : 0
  firstLoad.current = false
  const rise = (delay: number) =>
    still ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease, delay } }

  return (
    <section id="top" className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-24 lg:pb-28">
      <div>
        <motion.p {...rise(0)} className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium text-muted">
          <span className="size-2 rounded-full bg-ginger" aria-hidden />
          Web component, zero dependencies
        </motion.p>
        <motion.h1 {...rise(0.05)} className="font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl">
          A tiny friend that watches your page.
        </motion.h1>
        <motion.p {...rise(0.12)} className="mt-6 max-w-xl text-lg text-pretty text-muted">
          peekpal follows the cursor, reacts when you poke it, naps when nobody is around and looks away when you type a
          password. One tag, in plain HTML, React, Vue or Svelte.
        </motion.p>
        <motion.div {...rise(0.18)} className="mt-8 flex flex-wrap gap-3">
          <a
            href="#playground"
            className="inline-flex items-center gap-2 rounded-full bg-ginger px-6 py-3 font-medium text-ginger-ink shadow-soft transition-transform hover:-translate-y-0.5"
          >
            Try the playground
            <ArrowDown weight="bold" aria-hidden />
          </a>
          <a href={GITHUB} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-6 py-3 font-medium transition-colors hover:border-ink/30">
            <GithubLogo weight="fill" aria-hidden />
            Star on GitHub
          </a>
        </motion.div>
      </div>

      {/* The cat peeks up from behind the install card. */}
      <div className="relative mx-auto w-full max-w-md pt-[210px] sm:pt-[250px]">
        <div className="absolute inset-x-0 top-0 flex h-[260px] items-end justify-center overflow-hidden sm:h-[300px]">
          <motion.div
            key={`${pal.id}-${style}`}
            initial={still ? false : { y: '80%' }}
            animate={{ y: '2%' }}
            transition={{ duration: 1.1, ease, delay }}
          >
            <PeekPal poses={current.poses} moods={current.moods} size={260} label={pal.id} className="block" />
          </motion.div>
        </div>
        <div className="relative z-10 rounded-[var(--radius-card)] bg-cocoa p-5 dark:ring-1 dark:ring-white/8 text-cocoa-ink shadow-soft sm:p-6">
          <div className="flex items-center justify-between gap-3 rounded-full bg-white/8 py-2 pr-2 pl-5 font-mono text-sm">
            <span>
              <span className="text-ginger select-none">$ </span>npm i peekpal
            </span>
            <CopyButton text="npm i peekpal" className="bg-ginger text-ginger-ink hover:brightness-105" />
          </div>
          <p className="mt-4 px-1 text-sm text-cocoa-ink/70">
            Move your mouse around. Poke {pal.name}. Then leave it alone for 15 seconds.
          </p>
        </div>
      </div>
    </section>
  )
}
