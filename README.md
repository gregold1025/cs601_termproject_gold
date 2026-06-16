# UGPlayground

An interactive avatar playground where the user customizes a character and a
world, authors small named artifacts inside dedicated **lab modules**, and
invokes those artifacts back in the world by typing their names into a
command line. Built as the term project for **MET CS 601 — Frontend Web
Application Development** (Boston University Metropolitan College, Summer 1
2026, Christian Hur).

The organizing idea: **everything you author has a name; everything named can
be invoked.**

---

## Table of contents

- [Inception](#inception)
- [Quick start](#quick-start)
- [Tech stack and build configuration](#tech-stack-and-build-configuration)
- [Architecture: the dependency triangle](#architecture-the-dependency-triangle)
- [Core concepts](#core-concepts)
- [The two labs](#the-two-labs)
- [The shape grammar](#the-shape-grammar)
- [Form validation](#form-validation)
- [The engine, and what was deferred](#the-engine-and-what-was-deferred)
- [Asset management and creation](#asset-management-and-creation)
- [Persistence](#persistence)
- [Interface and experience decisions](#interface-and-experience-decisions)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Frontend competencies demonstrated](#frontend-competencies-demonstrated)
- [Roadmap](#roadmap)
- [AI usage](#ai-usage)
- [Further documentation](#further-documentation)

---

## Inception

UGPlayground is an adaptation of work from **Urban Griots Collaborative**, an
educational design practice focused on embodied learning through drum
language — encoding literacy and numeracy learning outcomes into the patterns
of djembe drumming. The premise is that learning lives in the hands and the
body, not in the abstract.

This project takes the core principle of that drum language and re-expresses
it through the affordance available in a front-end context: the keyboard.
Wiring in real drum sensor data was out of scope, so the keyboard becomes the
instrument. The result is an avatar controlled by a command-line interface
whose commands are **defined by the user, not the application**. That single
decision opens up many layers of abstraction; this term's scope settles on
two proof-of-concept labs for command-writing infrastructure.

The philosophy behind the project is written up in full on the
[About page](public/about.html).

---

## Quick start

Requires Node 16+ and npm.

```bash
npm install        # install dependencies
npm start          # dev server at http://localhost:3000
npm test           # run the test suite (watch mode)
npm run build      # production build into ./build
```

The app is a single-page client; there is no backend and no environment
configuration. All state persists to the browser's `localStorage`.

**Grading browser:** developed and verified in **Firefox**, with secondary
checks in Chrome.

---

## Tech stack and build configuration

- **React 19** with function components and hooks throughout.
- **TypeScript** in `strict` mode (Create React App's default `tsconfig`),
  used for discriminated unions, exhaustiveness checking, and a clean
  data/engine/component type boundary.
- **Create React App** (`react-scripts` 5) for zero-config build, dev server,
  and Jest test runner. CRA was chosen deliberately over a hand-rolled
  bundler: the project's interest is in application architecture, not in
  tooling, and CRA removes the build surface from the equation while still
  giving TypeScript, ESLint, code-splitting, and a test harness out of the
  box.
- **No runtime dependencies beyond React.** No state library, no UI kit, no
  CSS framework. Every component, hook, and style is first-party. This keeps
  the dependency graph legible and means the architecture on display is
  entirely the author's.
- ESLint via `react-app` config; production builds treat warnings as errors
  (`CI=true npm run build`), so the shipped build is lint-clean including
  `react-hooks/exhaustive-deps`.

---

## Architecture: the dependency triangle

The source is organized into three layers with a strict, one-directional
dependency rule. This is the central architectural decision of the project.

- **`src/data/`** — pure. Types, parsers, resolvers, constants. No React, no
  time, no DOM, no side effects. This is where a `Move`, a `Shape`, the shape
  grammar parser, and the command resolver live. Pure code is trivially
  testable and is where the test suite concentrates.
- **`src/engine/`** — stateful. React hooks that own state, time, and effects:
  the game loop, the physics and articulation engines, the move sequencer,
  the command input, the `localStorage` mirror. The engine may import from
  `data/` but never from `components/`.
- **`src/components/`** — the view. React components that render and own JSX
  and CSS only. They may import from `engine/` and `data/`. Business logic
  that does not render is pushed down into a hook.

The rule reads as a triangle: **components depend on engine and data; engine
depends on data; data depends on nothing.** A data file that reached for
`window`, or an engine file that imported a component, would be a layering
violation — and the one place that bootstraps `localStorage` defaults
(`engine/seedDefaults.ts`) lives in the engine layer precisely because seeding
is a side effect, not pure data.

The pure-versus-stateful split repeats inside the engine itself: the physics
math is a pure `stepPhysics` function in `engine/stepPhysics.ts`, tested in
isolation, and `useCharacterPhysics` is only the thin React wrapper that
advances it each frame.

The in-app [Documentation page](public/documentation.html) covers the same
ground at three altitudes (User, System, Reference) with screenshots and
diagrams.

---

## Core concepts

### Lab modules

A **lab module** is a workspace where the user authors an artifact — a named
thing they save to a library and invoke from the playground. "Artifact" is the
conceptual umbrella; each lab pins it to a concrete type. The Dance Lab
produces a `Move`; the Shape Lab produces a `Shape`.

Every lab follows the same four-part recipe:

1. an **artifact type** (pure data in `data/`),
2. an **editor view** (a component),
3. a **`localStorage` key** that persists its library,
4. a path that **wires into the playground** through the engines.

Labs edit in a **lossless draft**. When you open a saved artifact to edit it,
you work on a draft copy; the committed version in the library is untouched
until you explicitly save. Saving as new never overwrites the source. This
non-destructive editing is what lets the editors, the library objects, and the
playground all share one set of artifacts without an edit-in-progress ever
corrupting what is already saved.

### The command surface

A typed string in the command bar is parsed by `resolveCommandChain` into an
array of **command tokens**. A `CommandToken` is a discriminated union — it is
either `{ type: "move", move }` or `{ type: "shape", shape }`. Moves and shapes
share one flat command namespace, and cross-library name collisions are
blocked at save time so resolution is always unambiguous at run time.

The **dot operator** is the chaining mechanism: `jump.wave` resolves to two
tokens and plays them in sequence. Resolution is all-or-nothing — if any
segment fails to resolve, the whole input is rejected and the command bar
flashes red.

### The move sequencer and two clocks

`useMoveSequencer` consumes a `CommandToken[]` and dispatches each token to the
right engine — a move fires a physics impulse and cues articulation; a shape
fires a sticker-spawn callback. It is the one place in the system allowed to
know about both engines, so the engines stay ignorant of each other.

There are **two clocks**, deliberately decoupled:

- The **sequence clock** is a fixed metronome. Each move occupies
  `MOVE_TEMPO / speed` seconds before the next link in a chain fires. It is
  constant and deterministic.
- The **visual clock** can stretch. A launched move's flip rides the arc of
  its trajectory; the sequencer predicts the airtime from the impulse and
  hands the articulator that longer window. A live landing-correction watches
  real altitude each frame, so an early landing finishes the flip on contact.

Because the two clocks are separate, the character's pose easing and the
command metronome never have to agree — which is what makes chained moves feel
organic rather than mechanical.

---

## The two labs

### Dance Lab

The Dance Lab authors a `Move`. You **articulate** the character's pose by
dragging its limbs, and you attach a **force vector** to its body. When the
move is invoked in the playground, those two things happen in parallel: the
body is launched by physics, and the pose plays out on its own clock.

The ragdoll is designed so its entire expressive state reduces to roughly
**ten numbers** — two per limb (an end angle and a bend) across four limbs,
plus the two components of the 2D force vector. That compactness is what makes
a move cheap to store, cheap to interpolate, and trivial to serialize into the
library.

The animation is **value-based, not keyframe-based**. There is no timeline of
baked frames; the pose is interpolated toward a target each frame. The payoff
is graceful interruption — a flip cut short or a joint caught mid-swing
resolves smoothly instead of snapping to a frame boundary.

The only collision in the Dance Lab is with the ground.

### Shape Lab

The Shape Lab authors a `Shape`: a name plus a string in a small grammar. The
shape is rendered live as you type, and saved shapes can be placed into the
playground as **stickers** — decorative polygons fixed in world space.

A sticker is a composition, not an inheritance: the `Sticker` type contains a
frozen snapshot of the `Shape` plus its world coordinates, so editing the
underlying shape later never disturbs a sticker already placed (peel-and-stick
semantics).

Because a shape has no animation to play, a shape command token is parsed and
spawned **immediately** — it bypasses the metronome entirely and does not
consume a beat. A chain like `triangle.jump` spawns the triangle at once and
then plays the jump on the clock.

---

## The shape grammar

The Shape Lab grew out of a course lesson on regular expressions, which map to
**type-3 (regular) grammars** in the Chomsky hierarchy. Researching the
hierarchy led to **type-2 (context-free) grammars**, and the realization that
the drum-language idea — a tiny alphabet, composed by rules — could drive a
context-free grammar that generates **nested polygons**.

The grammar has three terminals, mirroring the atomic units of the drum
language:

- one terminal **opens** a polygon,
- one terminal is a **side**,
- one terminal **closes** the polygon.

Open and close behave like brackets; a side is a single atomic unit. From
arbitrary-length strings of these three characters, compound shapes emerge:
`tsssb` is a triangle, `tssssb` is a square, and a nested string like
`ttsssbtsssbtsssbtsssbb` produces a four-pointed star (an outer square whose
sides are each replaced by a nested triangle). The recursion — a feature can
itself be a whole nested polygon — is the type-2 core.

### Deliberate compromises

A more elaborate generative grammar was prototyped and then cut to keep scope
contained. The shipped version makes several simplifying decisions, each a
conscious trade against scope inflation:

- **Side lengths are uniform.** Every side is the same length; the grammar
  does not encode magnitude.
- **Which side a nested polygon attaches to is arbitrary.** The attachment
  point is not expressible in the string — it is effectively undecidable from
  the grammar alone, so the renderer chooses deterministically.
- **Orientation is undecidable** from the string in the same way; nested
  polygons fold outward by a fixed rule rather than an authored angle.
- **The prototype's macro/template-rebinding feature is absent.** Every close
  is a plain close. Naming and reuse live at the library layer, where they are
  legible, rather than inside the string.

These were the right cuts: they keep the grammar small enough to teach and to
parse with a simple stack, while still demonstrating the central idea that a
small set of rules produces an open-ended language.

---

## Form validation

Both lab editors validate input live, treating the field as a controlled
surface that is always in a legal state:

- **Dance Lab — command names.** The primary name is required (you cannot save
  without it). As you type, names are filtered live to strip whitespace and
  periods, because both would break command parsing — whitespace at lookup
  time and periods at chain-split time. On a save attempt, both the primary and
  the optional secondary name are checked against **both** libraries for
  collisions; a colliding field is flagged and clears the moment you edit it.
- **Shape Lab — grammar source.** The source field is filtered live to the
  three legal terminals, so the string in the box is always in-alphabet. The
  parser reports a status of empty, incomplete, invalid, or valid with a
  human-readable message, and a shape can only be saved from a valid parse.
  Shape names are checked for cross-library collisions exactly as moves are.

The shared discipline — *the value in the field is never allowed to be
illegal* — is applied identically in both labs.

---

## The engine, and what was deferred

The motion model is a small game engine: a `useGameLoop` heartbeat ticking at
60Hz, a pure `stepPhysics` integrator for velocity, gravity, and ground/edge
collision, and an articulation engine for pose interpolation and rotation
snapping. Physics is unanimous — the character behaves identically in the
playground and inside the Dance Lab, because both mount the same hook.

This is, frankly, more engine than the project's essence strictly required. It
exists because the avatar's expressiveness depends on it, but its depth is
acknowledged as beyond the minimum.

The architecture was designed with an extensibility model in mind that this
release only partly fills:

- **Two sockets.** An artifact can affect the playground in one of two ways —
  by **invocation** (event-driven: the engine touches it only during a
  dispatched command) or by **simulation** (frame-driven: the engine
  reconciles the character against it every frame). Moves and shape-spawns are
  both invocation-shaped today. The simulation socket is pre-wired but
  unfilled.
- **Collision was deferred.** Stickers are placed but not collidable; there is
  no object-versus-character physics yet. Making stickers collidable — moving
  them from the invocation socket to the simulation socket — is the named next
  step, and the reason the engine carries more structure than the current
  feature set strictly uses.

These deferrals were scope decisions, not oversights; they are documented so
the seams are visible.

---

## Asset management and creation

- **Character art is SVG**, composed from interchangeable parts. A character is
  assembled from a rig of body parts rather than drawn as a single image, which
  is what lets one rendering component serve every animal and every pose. This
  compositional approach is mirrored in the type design (a pose is data; a rig
  is data; the renderer is generic).
- **Diagrams were designed in Figma** and exported as SVG for the
  documentation page, sized to the documentation column. The system diagrams
  (command pipeline, lab anatomy, engines) use a consistent color key —
  components, hooks, and data each have a fixed color.
- **Screenshots and GIFs** of the running app illustrate the user-facing
  documentation, cropped and sized via CSS modifiers rather than re-exported at
  each size.
- Assets are served as static files from `public/`; there is no asset pipeline
  beyond CRA's static handling.

---

## Persistence

All user state lives in `localStorage`, accessed through a single typed
`useLocalStorage` hook that mirrors `useState` and silently degrades to
in-memory state when storage is unavailable.

- **Versioned keys.** Library keys follow the convention
  `ugp.{artifact}-library.v{n}`. The version suffix is bumped on a breaking
  change to an artifact's shape, so stale data from an older shape falls
  through to the default rather than crashing the reader.
- **Seeded defaults.** On a first visit, the move and shape libraries seed with
  a starter set (the `jump` and `wave` moves; triangle, square, and star
  shapes) so the playground is populated out of the gate. Seeding runs before
  any component reads storage. A present-but-empty library is treated as
  intentional, so a user who clears their library stays cleared on reload.

---

## Interface and experience decisions

- **The playground has no site header**, by design. It is meant to be an
  immersive world, not a document; chrome would break the illusion. Navigation
  is instead tucked into a **slide-in hamburger menu** so the links to About
  and Documentation are reachable without occupying the world.
- **Static pages (About, Documentation) do carry a shared header** — the
  UGPlayground wordmark and a consistent nav — because those *are* documents,
  and a stable chrome aids orientation. The header and footer are factored into
  one shared `site-chrome.css`.
- **A welcome banner** greets the user once per page load and then steps out of
  the way, rather than gating entry behind a modal.
- **The sky is a gradient that runs from atmosphere to space**, and the camera
  follows the character with a vertical deadzone and edge-clamped horizontal
  follow, so the world reads as large and continuous rather than a fixed frame.
- Styling uses BEM-style class names and is co-located with components.

---

## Testing

The test suite concentrates on the pure `data/` and `engine/` layers, where
logic is deterministic and worth locking down:

```bash
npm test                 # watch mode
CI=true npm test         # single run, for CI / verification
```

Current coverage: **4 test suites, 55 tests** — the command resolver and
chaining, the dance-move helpers, the shape grammar parser, and the physics
integrator. The pure-function architecture is what makes this coverage cheap to
write and fast to run.

---

## Project structure

```
src/
  data/         pure types, parsers, resolvers, constants
    labs/       per-lab artifact data (dance-moves/, shapes/)
    characters/ rigs, poses, palette
    biomes/     scene data
    command.ts  the cross-lab command surface (CommandToken, resolver)
  engine/       stateful hooks (game loop, physics, articulation,
                sequencer, command input, localStorage, seeding)
  components/   views
    playground/ the world, character, sticker layer, command bar
    labs/       dance-lab/ and shape-lab/ editors (+ shared lab.css)
    customize-avatar/
    HamburgerMenu, LabSelection, Character   (shared chrome)
public/         static assets + standalone HTML pages
                (about.html, documentation.html), images, diagrams
```

A complete file map with per-file responsibilities is in the
[Documentation page](public/documentation.html), section 3.4.

---

## Frontend competencies demonstrated

A self-map of where the project exercises core front-end skills.

| Competency | Where it shows up |
|---|---|
| Semantic HTML | Standalone About and Documentation pages; semantic landmarks, definition lists, figures |
| Responsive CSS | Documentation grid + sidebar, About outcomes grid, mobile breakpoints; no framework |
| Modern JavaScript | Discriminated-union dispatch, pure functional core, immutable update patterns |
| TypeScript | Strict mode, discriminated unions, exhaustiveness checks, three-layer type boundary |
| React component architecture | Composition over inheritance, single-view-at-a-time routing, full unmount on view switch |
| Hooks and state | Custom engine hooks (`useGameLoop`, physics, articulation, sequencer, `useLocalStorage`) |
| Forms and validation | Live-filtered, always-legal lab inputs; required fields; cross-library collision checks |
| Client-side persistence | Versioned `localStorage` keys, typed mirror hook, seeded defaults |
| Testing | 55 tests over the pure data and engine layers |
| Accessibility | Focus-visible outlines, `inert` on the closed menu, `aria-current`, alt text on all figures |
| Build tooling | CRA + TypeScript, lint-clean production build with warnings-as-errors |
| Cross-browser | Verified in Firefox (grading browser) and Chrome |

---

## Roadmap

- **Collidable stickers** — fill the simulation socket so placed shapes
  interact with the character rather than sitting as decoration.
- **Authorable side length and orientation** in the shape grammar, lifting the
  current uniform-side / fixed-fold compromises.
- **More lab modules** — a Drum Lab (rhythm), a Force Lab (world forces), a
  Game Lab (win/loss states and authored rules) are sketched in the About
  page's learning-outcomes section.

---

## AI usage

Per the course AI policy, this section discloses the use of AI on the project.
A full exchange transcript with the relevant sections highlighted accompanies
the submission as a separate appendix.

- **Tool:** Claude Opus 4.8 (1M context), via Claude Code.
- **How it was used:**
  - test-driven development workflow and test design,
  - code review passes (redundancy, comment coherence, layering, engine
    clarity),
  - conceptual system architecture (the data/engine/component boundary, the
    two-socket model),
  - type design (discriminated unions, the artifact/command-token surface),
  - game-loop optimization and wiring suggestions,
  - asset-anatomy conceptualization (the necessary dimensions of the SVG
    canvas, composing a character from interchangeable parts, and how that maps
    back to the type design),
  - scope management — deciding what to defer and what to cut to keep the
    project tractable within the term.
- **Why:** much of the implemented system runs beyond the minimum the
  assignment required (a full game loop, a context-free grammar, a two-clock
  sequencer). AI was used to reason about that additional surface — to keep the
  architecture coherent, the scope honest, and the deferrals deliberate.
- **Not used for:** asset generation. All visual assets are first-party.

---

## Further documentation

- **[About](public/about.html)** — the philosophy and educational premise.
- **[Documentation](public/documentation.html)** — the full manual: User,
  System, and Reference, with screenshots and diagrams.

---

Built by Greg Gold for MET CS 601, Summer 1 2026. &copy; Urban Griots
Collaborative 2026.
