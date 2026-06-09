# Term Project Docket

Running list of upcoming work. Items are roughly ordered by dependency
and natural buildup; reorder as priorities shift.

## In progress / just landed

- [x] Camera follow with edge clamping (Playground reads characterX/Y;
      camera follows world X, clamped at world bounds; character slides
      off-center when camera is clamped)
- [x] World horizontal bounds in `useCharacterPhysics` (character can't
      walk past the world edges)

## Next up

### Command input + history

- **Command input box** — front-and-center, always selected, echoes
  characters as the user types. Spacebar = compile.
  - Green outline = valid input (recognized command/sequence)
  - Red outline = invalid input
  - On compile, input clears and spawns a new entry in the history panel
  - Hidden during customize mode (keyboard input maps differently there)
- **Command history panel** — upper-left of the playground.
  - Stack of accepted inputs in a column, newest at the bottom
  - Each entry animates upward and fades via opacity over time
  - Behaves like a disappearing console log
  - Hidden during customize mode
- Both panels are fixed to the playground viewport (don't move with the
  camera or the character).

### Command library — first entries

- **Walking commands** — first commands in the library.
  - Pair `useCharacterPhysics` movement (horizontal velocity) with CSS
    rig animations on limb angles to produce a believable walk cycle.
  - Likely pattern: a step keyframe that swings opposing arms/legs while
    the physics layer translates the character horizontally.

### Customize transitions

- Smooth visual transitions on entry / exit of customize mode (controls
  fade/scale in and out, not just snap-render).

### Biome swap animation

- On biome change, choreograph the exit and entry of the three SVG layers
  over about 1.5 seconds total:
  - **Exit (current biome)**:
    1. Background back exits to the right
    2. Background front exits to the left
    3. Ground translates downward off-screen
  - **Entry (next biome)**: exact reverse — ground rises first, background
    front enters from the left, background back enters from the right.

## Deferred / nice-to-have

- Walking pose tween system (pose blending between idle and walking)
- Double-jump or coyote-time on jump (if game feel demands it)
- Collisions with biome props (cacti, mountain peaks, etc.) once the
  character is doing more than walking
- Drum-language input mapper (UGP integration) as a sibling to the
  keyboard mapper
