import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pickDirection, cellPosition, POSES, MOODS } from '../src/core.ts'

const at = (deg: number, r = 200): [number, number] => [
  r * Math.cos((deg * Math.PI) / 180),
  r * Math.sin((deg * Math.PI) / 180),
]

test('sectors map to the 8 directions (y grows downward)', () => {
  const cases: [number, string][] = [
    [0, 'right'], [45, 'down-right'], [90, 'down'], [135, 'down-left'],
    [180, 'left'], [-135, 'up-left'], [-90, 'up'], [-45, 'up-right'],
  ]
  for (const [deg, pose] of cases) assert.equal(pickDirection(...at(deg)), pose, `${deg}°`)
})

test('dead zone returns center', () => {
  assert.equal(pickDirection(...at(30, 69)), 'center')
  assert.equal(pickDirection(...at(30, 69), 'right'), 'center')
  assert.equal(pickDirection(...at(0, 71)), 'right')
})

test('hysteresis holds the current direction just past the edge', () => {
  // 'right' spans -22.5..22.5; 25° would be down-right from scratch
  assert.equal(pickDirection(...at(25)), 'down-right')
  assert.equal(pickDirection(...at(25), 'right'), 'right')
  assert.equal(pickDirection(...at(29), 'right'), 'right')
  assert.equal(pickDirection(...at(31), 'right'), 'down-right')
})

test('wraps around ±180°', () => {
  assert.equal(pickDirection(...at(179)), 'left')
  assert.equal(pickDirection(...at(-179)), 'left')
  assert.equal(pickDirection(...at(-155), 'left'), 'left') // 25° past 180, inside hysteresis
  assert.equal(pickDirection(...at(155), 'left'), 'left')
  assert.equal(pickDirection(...at(-150), 'left'), 'up-left')
})

test('cell positions walk the 3×3 grid row by row', () => {
  assert.equal(POSES.length, 9)
  assert.equal(MOODS.length, 9)
  assert.equal(cellPosition(0), '0% 0%')
  assert.equal(cellPosition(4), '50% 50%')
  assert.equal(cellPosition(5), '100% 50%')
  assert.equal(cellPosition(8), '100% 100%')
  assert.equal(POSES[4], 'center')
})
