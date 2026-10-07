'use client'
import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import { characters as builtIn, sheets, type Character, type Style } from './pals'

type Active = {
  /** Built-in pals followed by the visitor's uploads. */
  characters: Character[]
  pal: Character
  setPal: (c: Character) => void
  style: Style
  setStyle: (s: Style) => void
  /** Sheets for the active character in the active style. */
  current: { poses: string; moods: string }
  addCustom: (c: Character) => { saved: boolean }
  removeCustom: (id: string) => void
}

const KEY = 'peekpal:custom'

/** The character and style picked in the gallery; every pal on the page shows them. */
const ActivePal = createContext<Active | null>(null)

function save(list: Character[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
    return true
  } catch {
    return false // storage full or blocked: keep it for this visit only
  }
}

export function ActivePalProvider({ children }: { children: ReactNode }) {
  const [pal, setPal] = useState(builtIn[0])
  const [style, setStyle] = useState<Style>('colour')
  const [custom, setCustom] = useState<Character[]>([])

  // Read after mount so server and client render the same first frame.
  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem(KEY) ?? '[]')
      if (Array.isArray(list)) setCustom(list.filter((c) => c?.custom && typeof c.poses === 'string' && c.poses.startsWith('data:image/')))
    } catch {}
  }, [])

  function addCustom(c: Character) {
    const next = [...custom, c]
    setCustom(next)
    setPal(c)
    return { saved: save(next) }
  }

  function removeCustom(id: string) {
    const next = custom.filter((c) => c.id !== id)
    setCustom(next)
    save(next)
    if (pal.id === id) setPal(builtIn[0])
  }

  return (
    <ActivePal
      value={{ characters: [...builtIn, ...custom], pal, setPal, style, setStyle, current: sheets(pal, style), addCustom, removeCustom }}
    >
      {children}
    </ActivePal>
  )
}

export function useActivePal() {
  const ctx = use(ActivePal)
  if (!ctx) throw new Error('useActivePal needs <ActivePalProvider>')
  return ctx
}
