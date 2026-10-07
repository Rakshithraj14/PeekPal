import {
  POSES, MOODS, POKE_MOODS, cellPosition, pickDirection,
  BLINK_MS, POKE_MS, DIZZY_POKES, DIZZY_WINDOW_MS, DIZZY_MS, BOUNCE_MS,
  WAKE_MS, SHY_MS, CELEBRATE_MS, SLEEP_AFTER_MS,
  type Pose, type Mood,
} from './core.js'

// Lets the module load during server rendering, where HTMLElement does not exist.
const Base = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement

const FIELD = 'input:not([type=checkbox],[type=radio],[type=button],[type=submit],[type=reset],[type=range],[type=color],[type=file],[type=image],[type=hidden]),textarea,[contenteditable]:not([contenteditable=false])'

const STYLE = `
:host { display: inline-block; width: 140px; height: 140px; vertical-align: bottom }
button {
  all: unset; display: block; position: relative; width: 100%; height: 100%;
  cursor: pointer; border-radius: 16px; transform-origin: 50% 92%;
  -webkit-tap-highlight-color: transparent;
}
button:focus-visible { outline: 2px solid currentColor; outline-offset: 4px }
.layer {
  position: absolute; inset: 0; transform-origin: 50% 92%;
  background-size: 300% 300%; background-repeat: no-repeat;
}
.moods { visibility: hidden }
.mood .moods { visibility: visible }
.mood .poses { visibility: hidden }
.asleep .moods { animation: breathe 3s ease-in-out infinite }
@keyframes breathe { 50% { transform: scale(1.02) } }
@media (prefers-reduced-motion: reduce) { .asleep .moods { animation: none } }
`

type Step = [Mood, number]

export class PeekPalElement extends Base {
  static observedAttributes = ['poses', 'moods', 'size', 'label', 'sleep-after']

  #button!: HTMLButtonElement
  #posesLayer!: HTMLElement
  #moodsLayer!: HTMLElement
  #ac?: AbortController

  #pose: Pose = 'center'
  #mood: Mood | null = null // a timed reaction, shown over everything
  #asleep = false
  #pointer: [number, number] | null = null
  #target: [number, number] | null = null // lookAt(), page coordinates
  #field: Element | null = null
  #password = false
  #pokes: number[] = []
  #pokeTurn = 0

  #moodTimer = 0
  #idleTimer = 0
  #frame = 0

  constructor() {
    super()
    const root = this.attachShadow({ mode: 'open' })
    root.innerHTML = `<style>${STYLE}</style><button type="button" part="button"><span class="layer poses"></span><span class="layer moods"></span></button>`
    this.#button = root.querySelector('button')!
    this.#posesLayer = root.querySelector('.poses')!
    this.#moodsLayer = root.querySelector('.moods')!
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    if (name === 'poses' || name === 'moods') {
      const layer = name === 'poses' ? this.#posesLayer : this.#moodsLayer
      layer.style.backgroundImage = value ? `url("${value.replace(/"/g, '%22')}")` : ''
    } else if (name === 'size') {
      const px = `${Number(value) || 140}px`
      this.style.width = this.style.height = px
    } else if (name === 'sleep-after') {
      if (this.isConnected) this.#resetIdle()
    } else if (name === 'label') {
      this.#button.setAttribute('aria-label', `Poke the ${value || 'mascot'}`)
    }
  }

  connectedCallback() {
    if (!this.#button.hasAttribute('aria-label')) this.#button.setAttribute('aria-label', 'Poke the mascot')
    this.#ac = new AbortController()
    const opts = { passive: true, signal: this.#ac.signal }
    const tracks = matchMedia('(hover: hover) and (pointer: fine)').matches

    this.#button.addEventListener('click', () => this.#poke(), { signal: this.#ac.signal })
    addEventListener('pointermove', (e) => {
      if (tracks) this.#pointer = [e.clientX, e.clientY]
      this.#schedule()
    }, opts)
    addEventListener('scroll', () => this.#schedule(), opts)
    addEventListener('resize', () => this.#schedule(), opts)
    addEventListener('keydown', () => this.#activity(), opts)
    addEventListener('pointerdown', () => this.#activity(), opts)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearTimeout(this.#idleTimer)
      else this.#activity()
    }, opts)
    document.addEventListener('focusin', (e) => this.#focusIn(e.target as Element), opts)
    document.addEventListener('focusout', () => {
      if (!this.#field && !this.#password) return
      this.#field = null
      this.#password = false
      this.#schedule()
    }, opts)
    document.addEventListener('submit', () => {
      this.#activity()
      if (this.getAttribute('celebrate-on-submit') !== 'off') this.#play([['celebrate', CELEBRATE_MS]])
    }, opts)

    this.#render()
    this.#resetIdle()
  }

  disconnectedCallback() {
    this.#ac?.abort()
    clearTimeout(this.#moodTimer)
    clearTimeout(this.#idleTimer)
    cancelAnimationFrame(this.#frame)
    this.#frame = 0
  }

  /** Show any mood for `ms`, e.g. el.react('love') after a purchase. */
  react(mood: Mood, ms = POKE_MS) {
    if (!MOODS.includes(mood)) throw new Error(`peekpal: unknown mood "${mood}"`)
    this.#play([[mood, ms]])
  }

  /** Point the head at page coordinates, or pass null to follow the pointer again. */
  lookAt(x: number | null, y?: number) {
    this.#target = x == null || y == null ? null : [x, y]
    this.#update()
  }

  #focusIn(el: Element | null) {
    if (!el || this.getAttribute('watch-fields') === 'off' || !el.matches?.(FIELD)) return
    this.#activity()
    this.#password = el instanceof HTMLInputElement && el.type === 'password'
    this.#field = this.#password ? null : el
    if (this.#password) this.#play([['shy', SHY_MS]])
    this.#update()
  }

  #poke() {
    const now = performance.now()
    this.#pokes = this.#pokes.filter((t) => now - t < DIZZY_WINDOW_MS)
    this.#pokes.push(now)
    const count = this.#pokes.length
    this.dispatchEvent(new CustomEvent('peekpal:poke', { detail: { count }, bubbles: true, composed: true }))
    if (this.#activity()) return // a poke that wakes it just wakes it

    if (count >= DIZZY_POKES) {
      this.#pokes = []
      this.#play([['dizzy', DIZZY_MS]])
    } else {
      const mood = POKE_MOODS[this.#pokeTurn++ % POKE_MOODS.length]
      this.#play([['blink', BLINK_MS], [mood, POKE_MS - BLINK_MS]])
    }
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.#button.animate([
        { transform: 'scale(1, 1)', easing: 'ease-out' },
        { transform: 'scale(1.08, 0.9)', easing: 'ease-in-out' },
        { transform: 'scale(0.96, 1.05)', easing: 'ease-out' },
        { transform: 'scale(1, 1)' },
      ], { duration: BOUNCE_MS, easing: 'linear' })
    }
  }

  #play(steps: Step[]) {
    clearTimeout(this.#moodTimer)
    const [step, ...rest] = steps
    if (!step) {
      this.#mood = null
      this.#render()
      return
    }
    this.#mood = step[0]
    this.#render()
    this.#moodTimer = window.setTimeout(() => this.#play(rest), step[1])
  }

  /** Counts as user activity. Returns true if this woke the pal up. */
  #activity(): boolean {
    this.#resetIdle()
    if (!this.#asleep) return false
    this.#asleep = false
    this.dispatchEvent(new CustomEvent('peekpal:wake', { bubbles: true, composed: true }))
    this.#play([['surprised', WAKE_MS]])
    return true
  }

  #resetIdle() {
    clearTimeout(this.#idleTimer)
    const raw = this.getAttribute('sleep-after')
    const ms = raw == null ? SLEEP_AFTER_MS : Number(raw)
    if (!ms || document.hidden || !this.isConnected) return
    this.#idleTimer = window.setTimeout(() => {
      this.#asleep = true
      this.#render()
      this.dispatchEvent(new CustomEvent('peekpal:sleep', { bubbles: true, composed: true }))
    }, ms)
  }

  #schedule() {
    if (this.#frame) return
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0
      this.#activity()
      this.#update()
    })
  }

  #update() {
    let pose: Pose = 'center'
    if (this.#password) pose = 'up'
    else {
      let tx: number, ty: number
      if (this.#target) [tx, ty] = [this.#target[0] - scrollX, this.#target[1] - scrollY]
      else if (this.#field) {
        const r = this.#field.getBoundingClientRect()
        ;[tx, ty] = [r.left + r.width / 2, r.top + r.height / 2]
      } else if (this.#pointer) [tx, ty] = this.#pointer
      else [tx, ty] = [NaN, NaN]
      if (!Number.isNaN(tx)) {
        const r = this.getBoundingClientRect()
        pose = pickDirection(tx - (r.left + r.width / 2), ty - (r.top + r.height / 2), this.#pose)
      }
    }
    if (pose === this.#pose) return
    this.#pose = pose
    this.#render()
  }

  #render() {
    const mood = this.#mood ?? (this.#asleep ? 'sleepy' : null)
    this.#button.classList.toggle('mood', mood != null)
    this.#button.classList.toggle('asleep', this.#asleep && this.#mood == null)
    this.#posesLayer.style.backgroundPosition = cellPosition(POSES.indexOf(this.#pose))
    if (mood) this.#moodsLayer.style.backgroundPosition = cellPosition(MOODS.indexOf(mood))
  }
}
