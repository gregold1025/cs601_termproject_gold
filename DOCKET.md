# Term Project Docket

## How this doc works

Four zones:

1. **Scope** — near-term, actionable, dated. What we're actually doing.
2. **Idea Vault** — every novel idea that has surfaced, by domain. Ideas
   are **never deleted** — they move to Scope when chosen, or get a
   status tag. This is the anti-amnesia zone.
3. **Landed** — condensed build log (git history has the detail).
4. **Pending & Open** — concrete to-dos + genuinely unresolved forks.

Vault status tags: `[built]` `[next]` `[parked]` `[open]` `[braked]`
`[rejected·kept]` `[principle/vision]`. "braked" = considered and held
back on purpose; "rejected·kept" = not the route, but a kernel worth
keeping.

---

## Scope — grounded Jun 12

Due **Tuesday**; work continues after. Five pages: Playground, Dance
Lab, Shape Lab, About, Documentation.

### Tuesday cut line (remaining)
- **About page** + **Documentation page** — how the labs work, for the
  grader. The Documentation page is where the recipe (artifact → editor
  → storage → socket) gets *told*, so Dance + Shape read as the same
  machine twice. "Getting the polygon right" for Tuesday = articulating
  why it's a sibling module — a writing task, not a collision-engine task.
- **Style pass** across all views.
- (Reminder: the course's AI-transcript appendix is a *separate* hard
  requirement from the in-app Documentation page.)

### Beyond Tuesday — first build
- **Shape-in-world V1** (see Vault → Collision). Keep the Shape Lab as
  is; add a "spawn" button placing a saved shape at a fixed offset by
  the character; make it a repulsion body. Start with the de-risk spike
  (a tested `repel()` against one hardcoded shape) to prove the *feel*.

---

## Idea Vault

### Command language & operators
- **Dot chain** — `mw.wm` runs moves sequentially on a fixed metronome. `[built]`
- **Double-period timing** — `j..fl` vs `j.fl`: the *cardinality* of the
  delimiter sets the gap between chain steps (more dots = longer pause).
  Elegant terse-grammar move. `[parked]`
- **Repeat** — `R3 move` repeats N times. `[parked]`
- **Speed modifiers** — `slow <move>` etc., higher-order wrappers. `[parked]`
- **Spacebar as argument delimiter** — for higher-order forms (slow, R3). `[parked]`
- **Manual chain advance** — `mw>wm`: `>` means "wait for my input before
  the next step." `[parked]`
- **`>` as namespace switch** — typing `dance>` / `shape>` enters that
  grammar's mode, with a color-coded badge above the command line showing
  the active namespace. NOTE: same `>` glyph as manual-advance — the two
  roles must be disambiguated (see Open Decisions). `[parked]`
- **Fixed operators, free composition** — the alphabet and operators stay
  system-fixed; users compose and name freely. Meta-commands are codified,
  not user-mutable. The dance lab "nailed" this balance. `[principle]`

### Shape grammar & live composition
- **Drum grammar** — t/s/b → nested polygons; macro removed; recursion
  (`F → S`) kept, the type-2 core. `[built — Shape Lab]`
- **Named terminals / vocabulary** — bind a saved shape to a letter
  (V = "spike"); `tVVVb` = a triangle of spikes. The macro done right —
  explicit named reuse at the library layer, not opaque trailing-b. `[parked]`
- **Live `shape>` wizard** — compose in the playground in real time;
  per-letter emergence *is* the reward (the grammar is generative, so
  watching it bloom is the magic). `[next, post-V1]`
- **Shift+R toggle** — enter/exit the live shape mode in the playground. `[parked]`
- **Build-at-cursor** — in-progress shape springs behind a blue-haloed
  cursor; spacebar drops it. The cursor's real job is *placement*. `[parked]`
- **Execute incomplete** — running an unclosed string renders an open path
  ("a line"); it still collides fine under repulsion (edge-proximity). `[decided]`
- **Hot-edge attachment** — choose which edge the next piece joins (blue
  highlight). `[braked — "not as important as it sounded"]`
- **Delimiter meaning in shape mode** — a non-sequencing meaning for the
  connector (how shapes *connect*). Still wanted, unresolved. `[open]`
- **Fractal lab** — a *third* grammar module producing self-similar
  artifacts. The polygon macro is already fractal-ish; UGP decoration is
  geometric/repeating, so it's thematically central. Its own module or a
  deepening of the shape grammar. `[parked]`

### Collision & simulation
- **Repulsion / "everything's a trampoline"** — perimeter-only; contact
  applies a normal-force impulse (reflect velocity across the edge normal,
  with restitution). Dodges penetration resolution, resting contact,
  concave decomposition, AND the open-line case. **Supersedes** the old
  AABB / convex-hull plan. `[next — chosen model]`
- **Static shapes, no gravity** — placed shapes float where put; no
  falling, no shape-shape collision, no resting. `[decided]`
- **Shape-in-world V1** — keep the Shape Lab as is; a button instantiates
  a saved shape at a fixed offset next to the character; it's a repulsion
  body. Isolates the irreducible collision core; not throwaway (the wizard
  later sits on top). `[next — recommended first build]`
- **stepPhysics extension** — the `world` arg gains obstacle edges + a
  repulsion phase; the documented seam (ground clamp generalizes). The
  repulsion math stays pure + TDD'd. `[next]`
- **De-risk spike** — build `repel()` test-first against one hardcoded
  shape; confirm the *feel* (restitution, character radius) before any
  wiring. `[next — do first]`
- **Tunneling** — fast launches can skip thin shapes between frames;
  continuous collision is the real fix; accept/clamp for V1. `[known limit]`

### World-building & object interaction
- **World-object model** — placed instances `{type, position, properties}`;
  a persisted list = a "level"/scene artifact (→ import/export = sharing
  worlds). `[vision]`
- **World-builder view** — zoomed-out, drag-in placement; character
  pickup; the BottomBar becomes an object palette. `[parked]`
- **Live-instance inspector (the "not-a-lab")** — select objects already
  in the scene and give them properties (trampoline = force-on-collision).
  The *other half* of the world-builder: labs forge templates off-stage;
  this edits live instances on-stage. `[parked]`
- **Telekinesis** — force vectors emanating from the character to push/pull
  placed objects; reuses `forceToImpulse` pointed outward at another body.
  Object-selection is the unsolved piece. `[parked]`
- **Goal states → games** — once objects exist, players author goals and
  invent games. "A sandbox earns its keep when games have games." `[vision]`

### World, camera & atmosphere
- **Vertical camera + deadzone** — only real launches move the camera;
  ordinary jumps don't. `[built]`
- **Atmosphere → space gradient** — sky lerps to space-black with altitude;
  each biome's sky preserved at rest. `[built]`
- **Bigger / generative world** — beyond the 3500px width; vertical
  exploration through atmosphere layers; possibly procedural. `[parked]`

### Module system & meta-design
- **Four-slot recipe** — artifact (data) → editor → storage → socket.
  Every module is this shape. `[architecture]`
- **Two sockets** — invocation (fire once, transient) vs simulation
  (persist, interact every frame). `[architecture]`
- **Socket asymmetry** — invocation modules are cheap (the sequencer
  already existed); simulation modules fund shared engine work (collision).
  Not a modularity break — it's shared infra the first simulation module
  pays for, and every later one reuses. `[insight]`
- **Invocation is limited; richness needs simulation** — the only other
  *rich* pure-invocation module is sound/rhythm (the drum language!).
  Expression = invocation; a world = simulation. `[insight]`
- **Sound / rhythm module** — the one other cheap, thematically-core
  invocation module (drum roots). `[parked]`
- **Type-2 vs type-3** — recursion lives in the fixed grammar (type-2);
  naming/reuse lives at the library (type-3). `[principle]`
- **User-defined grammar (new terminals / brackets / a letter = triangle)**
  — powerful but the risky Layer-2 sprawl; library naming gives the same
  win without touching the alphabet. `[braked]`
- **Physics lab** — tune the space (gravity, friction) as a saveable
  "space" artifact; parameterizing the sim is a real physics-intuition
  learning outcome. `[parked]`
- **User-defined-mechanics lab** — a lab for building labs; third horizon. `[parked]`

### Product thesis & pedagogy
- **Vocabulary thesis** — "you can't predict what someone builds once they
  have their own words." The lab is a vocabulary forge, not a sketchpad. `[thesis]`
- **The drum-language story** — regex → "what grammar types exist?" → a
  context-free grammar that builds compound polygons. The academic
  narrative for the Shape Lab; genuinely strong for the grader. `[story]`
- **Earns-its-place, two bars** — academic (the grammar story — met) vs
  experiential (a world consequence — needs the loop closed via collision). `[framing]`
- **The "first composition" question** — what's the first moment a shape
  changes what a move can do? Naming it is the high-leverage creative act,
  and it's Greg's to name. `[open]`
- **Discoverability via emergence** — generative systems need
  discoverability; composition surfaces combinations nobody authored —
  that *is* the discoverability, not a tutorial. `[value]`
- **Platform-Fortnite / Smash** — design bespoke move sets, challenge
  others, see how play styles line up. Not the route — but the kept kernel
  is *encounter* (your bespoke thing meets someone's), not combat. `[rejected·kept]`
- **Not a platformer** — the fear is designer-imposed goals; composition
  is player-authored and genre-neutral, the opposite of that. `[framing]`

---

## Landed (condensed)

- Avatar customize + playground MVP; engine layer; App view-switcher.
- **Dance Lab** (moves) + command surface in the playground: dot chain,
  name-collision validation, "Save as new," CSS perspective on Y-flips,
  Reset-pose, "+ Make new move."
- **Unified physics refactor:** `stepPhysics` (pure + tested);
  `useMovePlayer` dissolved into `useCharacterArticulation` (form) +
  `useMoveSequencer` (conductor); `forceToImpulse` as the one force law;
  the lab uses real physics + snap-home. Review fixes (keyup, force-clear,
  ghost editingId). dance-editor → dance-lab rename; "Transform" purged.
- **Shape Lab** — drum grammar, second module (compose/name/persist; no
  playground wiring yet).
- **Vertical camera + atmosphere→space gradient.**
- ARCHITECTURE.html + ARCHITECTURE.md. **49 tests green.**

---

## Pending work (actionable, not ideas)

- **Pages:** About; Documentation (tell the recipe story for grading).
- **Style pass** across views.
- **Dance lab:** walking pose tweens (physics velocity + limb-swing
  cycle); pose smoothing on interrupted plays (rotation already snaps,
  pose doesn't); back-side SVG art (tails!) for Y-flips.
- **Customize mode** enter/exit transitions (fade/scale, not snap).
- **Biome swap** choreography (~1.5s layered exit/entry).
- **AI-transcript appendix** (course requirement).

### Deferred / nice-to-have
- Double-jump / coyote-time on jump.
- Collisions with biome props (cacti, peaks).
- Drum-language input mapper (UGP integration) as a sibling input.
- Server-backed persistence (swap `useLocalStorage`).
- Library import/export (sharing libraries / worlds).

---

## Open design decisions

- **Arrow keys vs command-only movement** — body input alongside the
  command language, or commands as the sole motion source? Pluggable
  either way; no code pressure to decide.
- **`>` glyph disambiguation** — namespace-switch vs manual chain-advance
  can't both be `>`. Pick distinct markers.
- **Shared command namespace across libraries** — `staircase.climb`? Do
  dot-chains compose across the move and shape libraries?
- **World-object property vocabulary** — solid / bouncy / movable / …
  (the repulsion model makes "bouncy" the default and maybe the only one
  needed for a while).
- **Body vs picture** — mostly resolved → **body**, via repulsion. Confirm.
</content>
