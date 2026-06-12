# Term Project Docket

Running list of upcoming work. Items are roughly ordered by dependency
and natural buildup; reorder as priorities shift.

## #1 — Finish the architecture doc

The read-through happened (conversationally) and ARCHITECTURE.html (the
visual diagram) exists. Remaining: write ARCHITECTURE.md, the prose
companion, around the frames that emerged: the dependency triangle
(data → engine → components, arrows only point down), the two
enforcement sockets (invocation vs simulation), the two-engines-plus-
conductor model, and draft→commit→enforce.

## Shape Lab — landed (Jun 11)

The second module, built to the four-slot recipe — and the proof the
recipe repeats. Scope deliberately minimal: compose + name + persist,
no playground wiring yet.

- `data/shapes/grammar.ts` (pure, tested): the `Shape` artifact
  `{ id, name, source, colorSeed }`; the three-terminal drum grammar
  parser (`S → t E b`, `E → ε | F E`, `F → s | S`) with **no macro** —
  every `b` is a plain close; recursion (`F → S`) kept, it's the
  type-2 core. `computeRenderPolygons` flattens the AST into
  render-ready polygons (regular/open/nested/partial vertex math +
  outward fold ported fresh from the UGP prototype). `polygonFill`
  deterministically assigns each polygon an adjective palette
  (stroke = dark, fill = light) from a stored per-shape colorSeed.
- `components/shape-lab/`: ShapeLab (draft → commit → enforce, mirrors
  DanceLab), ShapeForm (two fields: grammar string filtered to t/s/b
  with live green/yellow/red parse status + name), ShapeLibrary
  (cards with live thumbnails, edit/delete, "+ Make new shape"),
  ShapeRenderer (pure SVG, auto-fit viewBox, used for preview and
  thumbnails). "Reroll colors" rolls a fresh seed.
- Storage: `ugp.shape-library.v1`. Wiring: third App view + second
  BottomBar card. No playground/command-line integration yet (the
  simulation-socket slot is deliberately unfilled).
- Vertices are never stored — the source string is the single source
  of truth; geometry recomputes at render time.

Next for shapes (deferred by design): instantiation into the playground
(collider = outer silhouette / convex hull per the body-vs-picture
decision), the `shape>` namespace on the command line, name-collision
validation if the library grows into command resolution.

## Unified physics refactor — landed (Jun 11)

The two-gravity ambiguity is gone. One motion model everywhere:

- `stepPhysics` — the physics tick extracted as a PURE function
  (state, intent, dt, world) → state. Tested (stepPhysics.test.ts):
  determinism, grounded-only friction, projectile arcs, optimal launch
  angle (flat skids lose to 45° arcs — a feature, not a bug), clamps,
  isResting. `useCharacterPhysics` is now a thin wrapper; gained
  `resting` and `teleport`.
- `useMovePlayer` DISSOLVED into two honestly-named engines:
  - `useCharacterArticulation` — the form engine. Pure articulator:
    pose + rotation tween over a given duration. No gravity, no
    offset, no queue. Tweens always start from CURRENT values, so
    interruptions interpolate gracefully. Rotation ends snapped via
    `snapRotationForward` — interrupted flips complete forward, never
    unwind.
  - `useMoveSequencer` — the conductor. The only place allowed to know
    both engines. Owns the dot-chain queue and the two clocks: the
    fixed metronome (MOVE_TEMPO / speed per link — deterministic
    chain timing) and the visual clock (a launch's flip rides the
    predicted arc, with a live landing correction that completes the
    flip when the body actually touches down).
- `forceToImpulse` in data/ — THE one place a force vector becomes a
  physics impulse. Lab and playground both launch through it.
- The lab uses the same physics as the playground. Its only special
  rule: snap home when (move done) AND (grounded) AND (settled).
  The dead `currentOffset` arithmetic is gone from both views.
- Review fixes: keyup never suppressed (no more walk-forever);
  drag-to-center clears the force vector again; reset-pose on a
  deleted move no longer strands a ghost editingId.
- Renames: dance-editor/ → dance-lab/, DanceEditorView → DanceLab,
  .dance-editor__ → .dance-lab__, TransformHandles → ForceHandle.
  "Transform" purged from the vocabulary; the artifact is just Move.
- Tests now exist: stepPhysics.test.ts + dance.test.ts (resolvers,
  collision checking, forceToImpulse, snapRotationForward). TDD applied
  surgically to the pure core, per the agreed split.

Parked from this round: spacebar-manual chain advance (a future
operator, e.g. `mw>wm`); deriving rotation per-frame from live vy
instead of predicted airtime (only matters when mid-air collisions
arrive).

## Design vision — north star (Jun 10)

Modules are constraint-bounded mechanics; the point is **compound
interactions across modules** producing problem-solving. Dance lab's
constraint: motion only by a vector's reach, poses cosmetic, mappings
user-owned. Target experiences: spawn squares that stack into a
staircase, climb it with a dance command; a square with bounce
properties as a trampoline compounding with launch impulses.

Key architectural insight: the shapes library (spawn by command) and
the world builder (drag-in placement, zoomed-out view) are **two
surfaces over one world-object model** — placed instances with type,
position, properties. Mirrors the existing artifact/invocation split
(lab edits moves; command input invokes them).

Implied stack, gated by collision:
- `data/world/`: shape type + property definitions (solid, bouncy, …)
- World state: persisted list of placed instances (effectively a
  "level" artifact; makes import/export = sharing worlds)
- AABB collision in `useCharacterPhysics` — character vs static
  rectangles; ground generalizes from y=0 to "top of any box";
  trampoline = restitution surface feeding applyImpulse
- World-builder view: third view in the App switcher; zoom-out is a
  scale transform over the same world; character pickup = drag handle
  writing physics position (gravity resumes on release); BottomBar
  carousel becomes the module/object palette
- Open (Greg's calls): which surface first; property vocabulary;
  spawn commands in the shared namespace (`staircase.climb`?); the
  user-defined-mechanics lab (third horizon — a lab for building labs)

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

## Dance Lab — recently completed

- [x] **Playground integration** — the move library is now live in the
      playground:
  - `useMovePlayer` composed with `useCharacterPhysics`: physics owns
    world position, the player owns pose / rotation; placement is the
    sum.
  - **Force vector = real physics impulse.** `applyImpulse(vx, vy)` on
    `useCharacterPhysics`; impulses are additive and persist — the
    character lands wherever physics says, no return-to-start (the
    lab preview's return-home is preview-only). Friction now applies
    only while grounded, so launches travel as true projectile arcs.
  - Typed command box (`CommandInput`) fixed bottom-center, frosted,
    auto-focus; space/enter executes, Esc blurs. Green/red outline
    flash for valid/invalid.
  - Floating command history (`CommandHistory`) bottom-left, entries
    float upward and fade over 5s, pruned from state on the same clock.
  - `useCommandRunner` owns input/submit/history/flash/focus;
    `resolveCommand` in `dance.ts` is the resolver seam (flat find for
    now; higher-order parsing slots in there).
  - Focus management: movement keys disabled while the input is
    focused or customize mode is open.
- [x] **Force vector → persistent physics impulse** in the playground
      (`applyImpulse`); friction now grounded-only so launches arc.
- [x] **Dot operator** — `mw.wm` + space runs moves sequentially.
      `resolveCommandChain` validates all-or-nothing; `useMovePlayer`
      gained a queue where each link's physics impulse fires at that
      link's start.
- [x] **Name-collision validation** — primary/secondary checked against
      the whole flat command namespace on Save / Update / Save-as-new;
      offending field highlights light red with an inline hint.
- [x] **"Save as new Move"** replaces Cancel-edit; collision validation
      doubles as the rename prompt.
- [x] **CSS perspective (800px)** on both the lab stage and the
      playground character slot — Y-flips now read as real 3D.

## Design decisions pending (raised Jun 10, parked deliberately)

- **Arrow keys vs command-only movement.** Are arrow keys a permanent
  "body" input alongside the command "language," or does the move
  library become the sole source of motion? Both paths stay open —
  the input layer is pluggable by design, and removing arrows later
  is a deletion, not a refactor. No code pressure to decide early.
- **Camera vertical follow.** Same clamp math generalizes to Y (the
  parallax rate works on both axes); needs a deadzone so ordinary
  jumps don't bob the camera, and rising reveals sky above the
  bottom-anchored layers (which is fine — it's just sky color).
  Becomes worth building when big launches go high enough to leave
  the frame.
- **Camera vs world artifacts.** How placed artifacts are introduced
  on screen / interact with the camera. Underspecified — park until
  the second artifact class has a shape.
- **Library import/export.** A library is already one JSON array, so
  export-to-file / import-from-file is architecturally cheap and very
  demoable ("work in the world someone else built"). Deliberately
  deferred — scope guard.

## Second artifact class — next major build

- A second library module (polygon grammar — Greg to restate the
  design). Slots it must fill to plug into the existing architecture:
  artifact type in `data/`, its own editor view + BottomBar card, its
  own storage key, and a decision on command-namespace participation
  (same flat namespace as moves? do dot-chains compose across
  libraries?). This is the proof that the module architecture is
  real: two artifact classes sharing one command surface.

## Dance Lab — still to address

- [x] ~~Reset-pose-to-neutral button~~ — done: "Reset orientation"
      repurposed as context-dependent "Reset pose" (editing → revert to
      the saved move; new → ragdoll back to defaults), plus a dashed
      "+ Make new move" button at the top of the library as the
      always-available escape hatch.
- **Higher-order commands** — `slow`, `R3`, etc. The resolver in
  `dance.ts` is currently a flat `find`; needs a tiny parser layer
  when these arrive. Spacebar will eventually act as an argument
  delimiter for these forms.
- **Walking pose tweens** as the first library-managed move. Pair the
  physics horizontal velocity with a CSS-driven limb-swing cycle.
- **Pose smoothing on interrupted plays** — pose tweens currently
  snap mid-animation when a new play starts (rotation already
  auto-snaps to stable orientations; pose does not).
- **Back-side SVG art** so Y-axis rotations show an actual back side
  (tails!) rather than a mirrored front. Perspective is already in;
  this is now purely an art task plus a front/back Character stack
  with backface-visibility.
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
