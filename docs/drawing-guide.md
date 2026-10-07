# Drawing guide

A peekpal character is 18 frames of the same drawing. Only the head and face change between them,
so the character seems to look around and react without the rest of it moving.

## The 18 frames

Name each file after its frame and put them all in one folder:

```
my-otter/
  up-left.png  up.png  up-right.png
  left.png     center.png  right.png
  down-left.png  down.png  down-right.png

  blink.png  happy.png  love.png
  surprised.png  wink.png  shy.png
  sleepy.png  dizzy.png  celebrate.png
```

**Directions** (the first nine) are where the character is looking. `center` looks straight at the
viewer. Let the eyes do most of the work; a small head turn helps.

**Moods** (the last nine) are reactions:

| Frame | When it shows | What it should look like |
|---|---|---|
| `blink` | Start of every poke | Eyes fully closed |
| `happy`, `love`, `wink` | Pokes, in turn | Big smile; heart eyes; one eye closed |
| `surprised` | Waking up | Wide eyes, small open mouth |
| `shy` | A password field gets focus | Eyes clearly looking away, blushing |
| `sleepy` | After a while with no activity | Half-closed eyes, relaxed |
| `dizzy` | Four quick pokes | Spiral eyes |
| `celebrate` | A form is submitted | The happiest face it has |

## Rules

1. **Same canvas size for every frame.** Every PNG has the same width and height.
2. **The body never moves.** Same position, same size, same feet, same tail in all 18 frames. If the body
   shifts between frames, the character visibly jumps when it changes expression.
3. **Transparent background**, with about 8% empty space around the character.
4. **Same style everywhere:** line weight, colours and lighting match across frames.
5. **Readable small.** It is usually shown at 80 to 150 px, so keep shapes simple and eyes big.
6. **Small extras stay close.** Hearts, sparkles or a sweat drop should touch or sit right next to the head.

## Build the sheets

```sh
python tools/build-sheets.py my-otter --out public/pals
```

This checks every frame, crops all 18 to one shared box, and writes `my-otter-poses.webp` and
`my-otter-moods.webp`. At the end it prints how far each frame's feet sit from the `center` frame and
warns about any that drift, which means the body moved in that drawing.

Then:

```html
<peek-pal poses="/pals/my-otter-poses.webp" moods="/pals/my-otter-moods.webp" label="otter"></peek-pal>
```

## Generated art

Image models rarely follow every rule. [tools/slice-sheet.py](../tools/slice-sheet.py) and the
**Add your own** card on the demo site cut a generated sheet into the 18 frames, remove a plain white
background, line every frame up on its feet, and match the size of the two grids. See
[image-prompt.md](image-prompt.md) for the prompt.

No art yet? `python tools/make-placeholder.py` draws 18 simple frames to test with.
