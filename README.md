# peekpal

A tiny mascot for your website. It follows the cursor, reacts when you poke it, naps when nobody is
around, watches the field you type in, looks away from passwords and celebrates when a form is sent.

One custom element, no dependencies, works in plain HTML, React, Vue, Svelte or anything else.

**[Try it on the demo site →](https://peek-pal.vercel.app/)**

![peekpal on its demo page: Mochi the cat peeking over an install card](https://raw.githubusercontent.com/Rakshithraj14/PeekPal/main/docs/screenshots/hero-light.png)

## Install

No build step:

```html
<script type="module" src="https://unpkg.com/peekpal"></script>

<peek-pal poses="/pals/cat-poses.webp" moods="/pals/cat-moods.webp" label="cat"></peek-pal>
```

With npm:

```sh
npm i peekpal
```

```js
import 'peekpal' // registers <peek-pal>
```

React and Next.js (safe to render on the server):

```jsx
import { PeekPal } from 'peekpal/react'

<PeekPal poses="/pals/cat-poses.webp" moods="/pals/cat-moods.webp" size={140} />
```

A character is two sprite sheets, `poses` and `moods`. Copy the cat's from
[`demo/public/pals`](demo/public/pals) to try it, or [make your own](#make-your-own-character).

## Attributes

| Attribute | Default | What it does |
|---|---|---|
| `poses` | required | URL of the poses sheet (where the head looks) |
| `moods` | required | URL of the moods sheet (expressions) |
| `size` | `140` | Width and height in px |
| `label` | `"mascot"` | Used in the accessible name, "Poke the {label}" |
| `sleep-after` | `15000` | ms without activity before it naps. `0` never naps |
| `watch-fields` | on | Set to `"off"` to stop it looking at focused inputs |
| `celebrate-on-submit` | on | Set to `"off"` to stop it celebrating form submits |

In React the same props are `poses`, `moods`, `size`, `label`, `sleepAfter`, `watchFields={false}` and
`celebrateOnSubmit={false}`.

## Methods and events

```js
const pal = document.querySelector('peek-pal')

pal.react('love')        // show a mood, 600 ms by default: pal.react('celebrate', 1200)
pal.lookAt(x, y)         // look at page coordinates
pal.lookAt(null)         // back to following the cursor

pal.addEventListener('peekpal:poke', (e) => console.log(e.detail.count))
pal.addEventListener('peekpal:sleep', () => {})
pal.addEventListener('peekpal:wake', () => {})
```

Moods: `blink`, `happy`, `love`, `surprised`, `wink`, `shy`, `sleepy`, `dizzy`, `celebrate`.

## What it does on its own

- **Follows the cursor** in 8 directions, and looks straight at you when the cursor is close.
- **Poke it** (click, tap, Enter or Space): it blinks, then turns happy, in love or winks. Poke it 4 times
  quickly and it gets dizzy.
- **Naps** after 15 seconds without activity, and wakes up surprised when you come back.
- **Watches the page:** it looks at the text field you are typing in, turns away from password fields, and
  celebrates when any form on the page is submitted. No wiring needed.
- **Accessible:** it is a real button with a visible focus ring. Touch screens get a still pal that still
  answers taps, and `prefers-reduced-motion` turns off the bounce and the breathing.

## Make your own character

You need 18 frames of the same character: 9 looking directions and 9 moods. Draw them, or generate them
with the [image prompt](docs/image-prompt.md). The [drawing guide](docs/drawing-guide.md) has the rules
that keep the character from jumping between frames.

The fastest way is the [demo site](https://peek-pal.vercel.app/#make): drop the generated image on
the **Add your own** card and download the finished sheets. Or use the Python tools (Pillow only):

```sh
# a generated image: cut it into 18 frames (plain white backgrounds are removed for you)
python tools/slice-sheet.py art/mochi --composite sheet.png

# 18 PNG frames in, two sprite sheets out
python tools/build-sheets.py art/mochi --out public/pals

# optional: a pencil or two-tone print version of the same frames
python tools/stylize.py art/mochi sketch
```

## Development

```sh
npm install
npm run build     # tsc -> dist/
npm test          # node --test (Node 22+)
```

The demo site lives in [`demo/`](demo) (Next.js). [`examples/plain.html`](examples/plain.html) is the
no-build check.

## Credits

Inspired by [page-mascot](https://github.com/nilbuild/page-mascot) by Kamran Ahmed.

## License

[MIT](LICENSE)
