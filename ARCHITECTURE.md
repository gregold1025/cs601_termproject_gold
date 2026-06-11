# Avatar World — Architecture

Prose companion to `ARCHITECTURE.html` (the visual diagram). This is the
map of how the system is wired and *why* it's wired that way — written so
that any single file can be opened and understood from the frame it sits
in.

The whole system reduces to a few ideas:

- **One dependency triangle.** Three layers; arrows only point down.
- **Two enforcement sockets.** Everything the user authors reaches the
  screen through one of two paths: it is *invoked*, or it is *simulated*.
- **Two engines and a conductor.** Motion and form are separate engines,
  each ignorant of the other; a conductor coordinates them.
- **Draft → commit → enforce.** Editors produce artifacts; the playground
  consumes them. Storage is the contract between the two.

Every file in `src/` sorts into one of three jobs: it *defines* an
artifact, *edits* one, or *enforces* one.

---

## 1. The dependency triangle

Three layers, and one rule that keeps them honest: **imports only point
down.** Components depend on engine depend on data. Nothing reaches back
up. (A code review of the whole tree confirmed no upward imports exist.)

### `data/` — pure shapes and pure functions

Types, registries, and stateless helpers. Imports nothing from `engine`
or `components`; it type-checks entirely on its own. It is the vocabulary
the rest of the app speaks.

- `avatar.ts` — `Animal`, `Adjective`, `Biome`, `Avatar`, and the
  `welcomeText` / `bannerText` formatters.
- `characters/types.ts` — pose types (`CharacterPose`, `LimbState`,
  `MouthState`, `CharacterRig`) and the geometry that turns a pose into
  SVG paths (`limbPath`, `mouthPath`).
- `characters/dance.ts` — the `Move` artifact, command resolution
  (`resolveCommand`, `resolveCommandChain`), uniqueness checking
  (`isCommandTaken`), the force law (`forceToImpulse`), the sequencing
  constant (`MOVE_TEMPO`), and the rotation snap (`snapRotationForward`).
- `characters/palette.ts` — `ADJECTIVE_PALETTES` and the CSS-variable
  plumbing that recolors the grayscale animal SVGs.
- `characters/index.ts` — the `CHARACTER_RIGS` registry (animal → rig).
- `biomes/index.ts` — the `BIOME_SCENES` registry (biome → scene).

The two registries are the mechanism of "scale by data, not by systems":
adding an animal is a new rig file plus one registry line, no engine or
component change.

### `engine/` — stateful hooks

Hooks that hold live state and run logic over time. Import *from* `data/`,
never *from* `components/`. The verbs layer — motion, time, input,
persistence — knowing about artifacts but nothing about how anything
looks.

- `useGameLoop` — a `requestAnimationFrame` ticker that calls
  `onTick(dt)` each frame.
- `stepPhysics` (pure, in `stepPhysics.ts`) + `useCharacterPhysics` —
  the motion engine.
- `useCharacterArticulation` — the form engine.
- `useMoveSequencer` — the conductor.
- `useCommandRunner` — the typed-command input stream.
- `useKeyboardInput` — keyboard → movement/jump callbacks.
- `useLocalStorage` — typed persistence.

### `components/` — views

Import from both lower layers and assemble them into pixels. `App.tsx`
routes between top-level views.

- `App` — the router (`committedAvatar`, `currentView`).
- `PlaygroundView` — composes the engines + the command surface +
  customize.
- `Playground` — the camera; projects world coordinates to screen.
- `Biome` — sky + three parallax SVG layers.
- `Character` — the pure renderer (body SVG + limb/mouth paths).
- `dance-lab/` — the move editor (`DanceLab`, `MoveForm`, `MoveLibrary`,
  `PoseHandles`, `ForceHandle`).
- `customize-avatar/` — the avatar pickers.
- `CommandInput` / `CommandHistory` — the command surface.

The reason the rule matters: when you open a `data/` file you never have
to ask "which view is this for," because the answer is structurally
"none — views come find it." That property is what makes the codebase
readable.

---

## 2. The two enforcement sockets

Everything a user authors is an **artifact** — a `Move` today, a placed
world object tomorrow. An artifact reaches the screen through exactly one
of two paths, and which one tells you where in the engine it plugs in.

### Invocation

The artifact sits idle until something *fires* it. Transient, one-shot.
This is how the dance lab's moves work: a typed command resolves to a
`Move`, the move plays, it's over. The invocation path runs through
`useCommandRunner` → `useMoveSequencer`.

### Simulation

The artifact is always *present*, and the physics loop reconciles the
character against it every frame. This is how the future world objects
will work: a staircase doesn't "fire" — it exists, and sixty times a
second the physics asks "is the character standing on it?" The simulation
path runs through `useCharacterPhysics` (specifically the pure
`stepPhysics`).

When you add a module, the first question is just: *invoked or always-on?*
That answer routes it to one of two existing sockets — you don't build a
new engine.

---

## 3. Two engines and a conductor

The character is driven by two independent engines, coordinated by a
third hook that is allowed to know both.

### `useCharacterPhysics` — the motion engine

Owns **where the body is**: position and velocity, integrated from
gravity, movement intent, and impulses. Its output is an x/y in world
pixels. All the math lives in the pure `stepPhysics`; the hook is a thin
wrapper that runs it each frame and publishes a snapshot. It exposes
`setMovingLeft/Right`, `jump`, `applyImpulse`, `teleport`, and `resting`.

### `useCharacterArticulation` — the form engine

Owns **how the body looks**: limb/mouth pose and whole-body rotation,
tweened over a duration it is handed. It knows nothing about gravity,
velocity, forces, or sequencing — a pure articulator: "tween this pose
and this rotation over this many seconds." Two properties matter:

- **Interruption is graceful.** Every tween starts from the *current*
  value (value-based, not path-based), so a new move mid-flip
  interpolates from wherever the body is. There is no fixed A→B path to
  snap back to.
- **Flips always complete.** Rotation end values are snapped with
  `snapRotationForward`, which rounds to the nearest stable turn but
  never *backward* — an interrupted flip finishes forward instead of
  unwinding.

### `useMoveSequencer` — the conductor

Plays no instrument. It reads the score (a `Move[]` from
`resolveCommandChain`) and cues the two engines. It is the **one place
allowed to know both engines** — and that is the deciding principle of
the whole design:

> Coordination knowledge lives in the coordinator, precisely so the
> coordinated parts can stay ignorant of each other.

The articulation engine never learns about gravity; physics never learns
about poses; the instant either knew the other, they'd be recoupled and
you'd lose the ability to reason about each alone. So everything that
*spans* both — firing a force as an impulse, deriving a flip's visual
length from a launch's airtime, deciding when the next chain link starts —
is exiled to the sequencer.

The sequencer runs **two clocks**:

- The **sequence clock** is a fixed metronome: each link occupies
  `MOVE_TEMPO / speed` seconds, then the next fires. Deterministic,
  independent of force. Chain faster than you fall and launches stack —
  a rule, not an accident.
- The **visual clock** can stretch: the sequencer predicts a launch's
  airtime from its impulse and hands the articulator that longer window,
  so a big flip spreads luxuriously over its arc. A live-altitude check
  completes the flip the moment the body actually lands, so the flip
  finishes on touchdown even if the prediction was off.

---

## 4. Composition — two loops, summed in one place

Physics and articulation each run their own `useGameLoop` tick and each
own different values. They meet in exactly one spot: `PlaygroundView`.

- The character's world position is `physics.position` alone. (Articulation
  contributes no position — forces are real impulses through physics, so
  the character lands where physics says and stays there.)
- The character's rotation is a CSS transform built from
  `articulation.currentRotation`, wrapped around `Character`.
- The character's pose is `articulation.currentPose ?? NEUTRAL_POSE`.

That single composition point is the entire integration surface between
the two engines. It's why the force-as-impulse change was clean: routing
force into `physics.applyImpulse` instead of an articulation offset
touched one call site, because the loops were already independent.

`Playground` then takes the world position and does the camera math —
following the character's world X, clamped to world edges, projecting
both the biome layers (via parallax rate) and the character to screen.
The camera lives in `Playground`, not `PlaygroundView`.

---

## 5. Draft → commit → enforce

The contract between an editor and the playground. It already appears
three times (avatar customize, the move library, and — soon — the world).

1. **Draft.** An editor view loads the committed artifact, holds a
   *working copy* in component state, and mutates the copy as the user
   works (live preview). The copy is the uncommitted-changes buffer:
   it makes editing tentative and keeps the playground unaffected
   mid-edit.
2. **Commit.** On save, the draft is written to the source of truth via
   `useLocalStorage` (the move library lives under `ugp.move-library.v1`).
3. **Enforce.** The playground reads the committed artifacts and feeds
   them to the right socket — moves into the invocation path, world
   objects (eventually) into the simulation path.

`useLocalStorage` is the bus between editor and playground. It's a thin
hook today; when per-user persistence arrives it gets swapped for a
backend-aware version and no call site changes.

---

## 6. The pure core, and why it's tested

`stepPhysics(state, intent, dt, world) → state` is the physics tick as a
pure function: same inputs always produce the same output, no React, no
refs, no side effects. This buys three things:

- **Testability.** `stepPhysics.test.ts` asserts the behaviors the rest
  of the system leans on — determinism, grounded-only friction, the
  launch-arc-and-land cycle, bounds clamping, and the optimal-launch-angle
  property (a 45° arc outranges a flat skid of equal magnitude, because
  friction eats the skid while the arc flies free — correct projectile
  physics, asserted as a feature).
- **Determinism.** Feed the same inputs, get the same motion every time —
  what makes the timing reliable.
- **An extension seam.** The ground is one hardcoded plane at y=0 today.
  World collision generalizes the clamp at the bottom of `stepPhysics`
  into a loop over collidable rectangles — a *data* change to a pure
  function, not a rewrite of a tangled callback.

The same logic applies to `data/characters/dance.ts`: the resolvers, the
uniqueness check, the force law, and the rotation snap are pure and
covered by `dance.test.ts`. The rule we settled on: **test the pure
core, not the visual/interaction layer.** Testability and good
architecture turned out to be the same move.

---

## 7. One flow, end to end — a typed command

1. A keystroke lands in `CommandInput` (a controlled input whose value
   lives in `useCommandRunner`). Space calls `submit`.
2. `submit` hands the string to `resolveCommandChain` (pure, in `data/`),
   which splits on dots and resolves each segment to a `Move`. Null →
   flash red, drop a strikethrough history entry, nothing else. Valid →
   call up to `PlaygroundView.playMoves`.
3. `playMoves` calls `sequencer.runChain(moves)`.
4. The sequencer begins the first link: it fires the force through
   `forceToImpulse` → `physics.applyImpulse`, and cues
   `articulation.startMove` with the pose, rotation, and a visual
   duration (stretched to the predicted airtime). Then it starts the
   metronome.
5. The two engine loops run independently; `PlaygroundView` sums their
   outputs each render; `Character` paints.
6. At `MOVE_TEMPO / speed`, the metronome fires the next link's impulse;
   the live-altitude check completes each flip on landing.

A single keystroke threads all three layers and both engines, and every
arrow points the way the dependency rule requires.

---

## 8. Documented seams

Honest notes on where the structure bends — kept visible rather than
hidden, because knowing where the bends are is what makes the system
safe to extend.

- **Ground is a single hardcoded plane** (`y = 0`) inside `stepPhysics`.
  This is deliberate and marked: it is the exact seam the world-collision
  system generalizes. See §9.
- **Library freshness is a lifecycle invariant.** `useLocalStorage` reads
  once on mount, so the playground sees the lab's saves only because the
  router fully unmounts one view before mounting the other. A future
  tabbed or modal layout that keeps both alive would need a subscription
  or reload-on-enter.
- **The sequencer's airtime prediction is an approximation** corrected by
  the live-altitude check. If a future mid-air collision changes the arc,
  the live check still completes the flip on the real landing; the
  prediction only sets the *initial* visual window.

---

## 9. Extension points — where new modules plug in

The architecture is built to grow by adding a **data shape** and a
**view**, then wiring the artifact into one of the two sockets. Nothing
in the engine layer needs a rewrite; it grows by data.

A new module fills four slots:

1. **An artifact type** in `data/` (like `Move`), with its pure helpers
   tested.
2. **An editor view** that produces and commits drafts (the draft →
   commit → enforce loop), plus a `BottomBar` card.
3. **A storage key** for its library/state.
4. **A socket choice** — does the playground *invoke* it (through the
   sequencer/resolver) or *simulate* it (through `stepPhysics`)?

The **Build Lab** (world builder) is the first module to feed the
**simulation socket**. Its core is a generalization of `stepPhysics`'s
ground clamp into a loop over collidable rectangles — a pure-function
extension, test-driven before any UI exists. The ground becomes a
degenerate box; a staircase is finite boxes; a trampoline is a box whose
collision response calls `applyImpulse` instead of zeroing velocity. The
engine never gets smarter; the data gets richer.

This is the precedent the recent refactor was for: the hardest part of
the next module is a pure, testable extension of a function that already
exists.
