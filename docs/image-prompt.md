# Image prompt for a PeekPal character

Optional: hand-drawn frames work just as well. Paste this into an image model as one request.
It produces one sheet with a 3×3 grid of looking directions and a 5×4 grid of 20 expressions.
PeekPal uses all 9 directions and the first 9 expressions. The other 11 are spares.

Then:

```sh
python tools/slice-sheet.py art/my-cat --composite sheet.png
python tools/build-sheets.py art/my-cat --out public/pals
```

The slicer drops the section labels, grid lines and background noise, picks the 18 frames,
re-aligns them on the feet, and scales the expressions to match the directions.

Keep the image under 5 MB, which is also the upload limit on the demo site. If your tool exports
a bigger file, resize it to about 2048 px on the longest side before uploading.

## Prompt

```
Create an original cute chibi cat mascot character specifically designed as an interactive website mascot for a developer/open-source web component called "PeekPal".

The character must be designed as a production-ready 2D sprite animation character.

CHARACTER DESIGN
- Cute chibi cat
- Large expressive head
- Small rounded body
- Short tiny arms and legs
- Small triangular cat ears
- Large highly expressive eyes
- Small cat nose and mouth
- Friendly, playful personality
- Slightly mischievous but wholesome
- Modern Japanese-inspired chibi character design
- Clean professional digital illustration
- Soft rounded shapes
- Consistent dark outline
- Flat colors with subtle cel shading
- Simple enough to remain recognizable at 80–150px on a website
- Original character design, not based on any existing copyrighted character
- No clothing or accessories that make animation difficult
- No text
- No speech bubbles
- No props
- Transparent background

CRITICAL SPRITE CONSISTENCY
The exact same cat must appear in every frame.

Across every frame:
- identical body size
- identical body proportions
- identical body position
- identical feet position
- identical tail position
- identical canvas framing
- identical camera angle
- identical line thickness
- identical color palette
- identical lighting
- approximately 8% transparent padding around the character

Only the head direction, eyes, eyebrows, mouth, ears, and facial expression should change.

The body must NOT move between frames.

The character must never touch or overlap another cell.

SPRITE LAYOUT

Create a large clean sprite reference sheet divided into clearly separated square cells.

Use two separate sections.

==================================================
SHEET 1 — LOOKING DIRECTIONS
==================================================

Create a 3 × 3 grid with exactly these nine poses:

ROW 1:
1. UP-LEFT
   Cat looking toward the upper-left.

2. UP
   Cat looking directly upward.

3. UP-RIGHT
   Cat looking toward the upper-right.

ROW 2:
4. LEFT
   Cat looking directly left.

5. CENTER
   Cat looking straight toward the viewer.

6. RIGHT
   Cat looking directly right.

ROW 3:
7. DOWN-LEFT
   Cat looking toward the lower-left.

8. DOWN
   Cat looking downward.

9. DOWN-RIGHT
   Cat looking toward the lower-right.

The body must remain identical in all nine cells.

The head/eyes should clearly communicate the eight directions.

==================================================
SHEET 2 — INTERACTION EXPRESSIONS
==================================================

Create a 5 × 4 grid containing 20 different expressions.

Each expression should use the same exact body and character design.

1. BLINK
   Eyes completely closed for a cute natural blink.

2. HAPPY
   Big cheerful smile, bright eyes, joyful expression.

3. LOVE
   Heart-shaped eyes, affectionate expression.

4. WINK
   One eye closed, playful smile.

5. SURPRISED
   Wide eyes, raised eyebrows, small open mouth.

6. SHY
   Blushing cheeks, eyes looking slightly away, embarrassed smile.

7. SLEEPY
   Heavy half-closed eyes, sleepy mouth, relaxed ears.

8. DIZZY
   Spiral/swirl eyes, confused expression.

9. CELEBRATE
   Extremely happy expression, sparkling eyes, joyful open-mouth smile.

10. THINKING
    One paw near chin, eyes looking upward, thoughtful expression.

11. CONFUSED
    Uneven eyebrows, tilted head, questioning expression.

12. EXCITED
    Huge sparkling eyes, energetic smile, enthusiastic expression.

13. SAD
    Large watery eyes, small frown, visibly sad but cute.

14. ANGRY
    Small furrowed eyebrows, puffed cheeks, cute angry expression.

15. EMBARRASSED
    Strong blush, nervous smile, eyes looking away.

16. CURIOUS
    Wide attentive eyes, slightly raised ears, interested expression.

17. SCARED
    Wide eyes, tiny trembling mouth, ears slightly lowered.

18. PROUD
    Confident smile, slightly raised chin, satisfied expression.

19. RELIEVED
    Closed relaxed eyes, gentle smile, calm expression.

20. SLEEP-WAKE SURPRISE
    Just awakened, wide eyes, slightly messy sleepy expression, surprised to see the user.

==================================================
IMPORTANT WEBSITE-SPECIFIC EXPRESSIONS
==================================================

The following expressions must be especially clear because they will be triggered by website interactions:

EMAIL / TEXT FIELD:
- curious / attentive
- cat appears interested in what the user is doing

PASSWORD FIELD:
- SHY / LOOKING AWAY
- the cat must clearly avert its eyes
- cute embarrassed expression
- communicate "I won't look at your password"
- do NOT show the password or any text

FORM SUBMISSION:
- surprised → celebrate feeling
- celebration expression must be extremely obvious and joyful

IDLE:
- sleepy
- relaxed and peaceful

WAKE:
- surprised
- then able to return to normal

RAPID CLICKS:
- happy
- wink
- love
- then dizzy

SUCCESS:
- excited / celebrate

ERROR:
- confused / sad

LOADING / WAITING:
- thinking

==================================================
STYLE REQUIREMENTS
==================================================

Make the character feel like a premium modern open-source developer-tool mascot.

Visual qualities:
- adorable but not childish
- expressive but not overly detailed
- clean silhouette
- excellent readability at small sizes
- polished enough for an npm project landing page
- consistent proportions across every frame
- expressive eyes are the main communication mechanism
- subtle ear movement may change with expressions
- no complex backgrounds
- no gradients in the background
- transparent background

SPRITE TECHNICAL REQUIREMENTS
- Every cell must be perfectly square.
- Every character must fit completely inside its cell.
- Leave consistent transparent padding around every character.
- No frame may be cropped.
- No character may cross a cell boundary.
- Align the feet to exactly the same vertical pixel position in every frame.
- Keep the center of the body at exactly the same coordinates in every frame.
- Keep the body silhouette identical across all expressions.
- Only facial/head features and small expressive elements should change.
- The artwork must be suitable for extracting each cell as an individual transparent PNG.
- Output one PNG file no larger than 5 MB, about 2048 px on the longest side at most.
- Fully transparent background, not white and not any other colour.
- Leave clear empty space between every character, and keep them in exactly the order listed.

Do not create a scene.
Do not create multiple different cat characters.
Do not vary the cat's clothing, colors, body shape, size, or proportions.
Do not add text.
Do not add labels inside the artwork.

The final result should look like a professionally designed sprite-sheet character set for a web component that follows the user's cursor, watches form fields, looks away from passwords, sleeps when idle, wakes when the user returns, reacts to clicks, and celebrates successful actions.
```

## If slicing fails

- **"found N characters, expected 29"** means two characters touch or a label is fused to a cell.
  Regenerate, or erase the overlap in any image editor.
- **One frame is noticeably smaller or larger** than the rest: regenerate that cell or resize it by hand.
  The slicer only matches the overall scale between the two grids.
