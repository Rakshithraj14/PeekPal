'use client'
import { createElement, type HTMLAttributes, type ReactElement, type Ref } from 'react'
import './index.js' 
import type { PeekPalElement } from './index.js'

export interface PeekPalProps extends HTMLAttributes<HTMLElement> {
  poses: string
  moods: string
  size?: number
  label?: string
  sleepAfter?: number
  watchFields?: boolean
  celebrateOnSubmit?: boolean
  ref?: Ref<PeekPalElement>
}

export function PeekPal({ sleepAfter, watchFields, celebrateOnSubmit, ...rest }: PeekPalProps): ReactElement {
  return createElement('peek-pal', {
    ...rest,
    'sleep-after': sleepAfter,
    'watch-fields': watchFields === false ? 'off' : undefined,
    'celebrate-on-submit': celebrateOnSubmit === false ? 'off' : undefined,
  })
}
