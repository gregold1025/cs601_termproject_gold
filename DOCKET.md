# Term Project Docket

Running list of upcoming work. Items are roughly ordered by dependency
and natural buildup; reorder as priorities shift.

## Recently landed

- [x] Camera follow with edge clamping; world horizontal bounds in
      `useCharacterPhysics`.
- [x] View-switching architecture (App is a thin router between
      `PlaygroundView` and `DanceEditorView`).
- [x] `BottomBar` with a card that opens the dance lab.
- [x] Dance Lab (formerly "dance editor") — full artifact editor:
      - One `Move` per saved command (`{ targetPose?, forceVector?,
        rotationY?, rotationZ?, speed }`).
      - On-character pose handles (limb endpoints + bend points) and a
        force vector handle clamped to the inscribed circle of the
        character viewBox.
      - Speed slider and rotation Y / Z form fields with step
        increments matching stable orientations.
      - `useMovePlayer` engine hook for preview playback (projectile-
        style force vector + gravity, pose tween, rotation lerp).
      - Auto-snap on play start so spammed plays always land upright;
        manual "Reset orientation" button as a failsafe.
      - "Cancel edit" button to escape an in-progress edit without
        committing.
      - localStorage persistence (`ugp.move-library.v1`).
- [x] Golden pedestal under the preview character in the lab.

## Dance Lab — still to address

- **Playground integration** — the saved library currently has no
  consumer outside the lab. The playground character needs:
  - A `useMovePlayer` instance whose outputs are composed with
    `useCharacterPhysics` for position and applied to the Character's
    pose / rotation.
  - A typed command box fixed to the bottom of the playground (frosted
    background, auto-focus, spacebar = execute) that resolves typed
    commands against the move library.
  - A floating command history (bottom-left, fades upward) for valid
    and invalid command feedback.
  - Focus management so arrow keys still drive physics movement when
    the command input is not focused.
  - See plan: `PlaygroundView` integration phases A–F written up in
    the project notes.
- **Higher-order commands** — `slow`, `R3`, etc. The resolver in
  `dance.ts` is currently a flat `find`; needs a tiny parser layer
  when these arrive. Spacebar will eventually act as an argument
  delimiter for these forms.
- **Walking pose tweens** as the first library-managed move. Pair the
  physics horizontal velocity with a CSS-driven limb-swing cycle.
- **Pose smoothing on interrupted plays** — pose tweens currently
  snap mid-animation when a new play starts (rotation already
  auto-snaps to stable orientations; pose does not).
- **Back-side SVG art + CSS perspective** so Y-axis rotations show an
  actual back side rather than a mirrored front. Deferred until
  back-side art exists.
- **Folder rename** — `src/components/dance-editor/` is the legacy
  name. Lab is the operating name now; either rename the folder to
  `dance-lab/` in a follow-up or leave as-is with a note.

## Other pending

### Customize transitions

- Smooth visual transitions on entry / exit of customize mode
  (controls fade/scale in and out, not just snap-render).

### Biome swap animation

- On biome change, choreograph the exit and entry of the three SVG
  layers over about 1.5 seconds total:
  - **Exit (current biome)**:
    1. Background back exits to the right
    2. Background front exits to the left
    3. Ground translates downward off-screen
  - **Entry (next biome)**: exact reverse — ground rises first,
    background front enters from the left, background back enters
    from the right.

## Deferred / nice-to-have

- Double-jump or coyote-time on jump (if game feel demands it).
- Collisions with biome props (cacti, mountain peaks) once the
  character is doing more than walking.
- Drum-language input mapper (UGP integration) as a sibling to the
  keyboard / typed-command mappers.
- Server-backed persistence — swap `useLocalStorage` for a
  user-aware storage hook when the User shape lands.
</content>
