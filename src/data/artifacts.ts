// Artifact base interface. Highly extensible —
// concrete artifact types share only id, name, and the discriminator kind.

export type ArtifactKind = "shape" | "drawing" | "tool" | "movement";

export interface ArtifactBase {
  id: string;
  name: string;
  kind: ArtifactKind;
}

// Concrete extensions live in their own files once their shape is decided.
// e.g. interface ShapeArtifact extends ArtifactBase { kind: "shape"; ... }
