// Pure logic: no DOM. Shared by the element and the tests.

export const POSES = [
  'up-left', 'up', 'up-right',
  'left', 'center', 'right',
  'down-left', 'down', 'down-right',
] as const

export const MOODS = [
  'blink', 'happy', 'love',
  'surprised', 'wink', 'shy',
  'sleepy', 'dizzy', 'celebrate',
] as const

export type Pose = (typeof POSES)[number]
export type Mood = (typeof MOODS)[number]

export const DEAD_ZONE = 70 // px from centre that counts as "looking at you"
export const HYSTERESIS = 7 // degrees past a slice edge before switching

export const BLINK_MS = 120
export const POKE_MS = 600
export const POKE_MOODS: Mood[] = ['happy', 'love', 'wink']
export const DIZZY_POKES = 4
export const DIZZY_WINDOW_MS = 1600
export const DIZZY_MS = 1100
export const BOUNCE_MS = 400
export const WAKE_MS = 250
export const SHY_MS = 600
export const CELEBRATE_MS = 900
export const SLEEP_AFTER_MS = 15000

// Slice k is centred on k * 45° (screen coords, y down, 0° = right).
const SLICES: Pose[] = ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right']

/** Map a vector from the pal's centre to the target onto one of the 9 poses. */
export function pickDirection(dx: number, dy: number, prev: Pose = 'center', deadZone = DEAD_ZONE): Pose {
  if (Math.hypot(dx, dy) < deadZone) return 'center'
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI
  const k = SLICES.indexOf(prev)
  if (k >= 0) {
    const off = Math.abs(((angle - k * 45 + 540) % 360) - 180)
    if (off <= 22.5 + HYSTERESIS) return prev
  }
  return SLICES[(Math.round(angle / 45) + 8) % 8]
}

/** CSS background-position for cell i of a 3×3 sheet drawn at 300% 300%. */
export function cellPosition(i: number): string {
  return `${(i % 3) * 50}% ${Math.floor(i / 3) * 50}%`
}
