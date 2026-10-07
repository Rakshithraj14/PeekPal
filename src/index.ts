import { PeekPalElement } from './element.js'

export { PeekPalElement }
export { POSES, MOODS, pickDirection, cellPosition, type Pose, type Mood } from './core.js'

/** Registers <peek-pal>. Safe to call more than once, and a no-op on the server. */
export function define(tag = 'peek-pal') {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) customElements.define(tag, PeekPalElement)
}

define()

declare global {
  interface HTMLElementTagNameMap {
    'peek-pal': PeekPalElement
  }
}
