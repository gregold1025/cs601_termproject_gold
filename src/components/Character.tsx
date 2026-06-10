// Character renderer.
// Composes: outer SVG → limbs (behind body) → body SVG → mouth (on top).
// CSS variables for the adjective palette are set on a wrapping div so
// the inlined SVG fills resolve correctly per the chosen adjective.

import React from "react";
import { Animal } from "../data/avatar";
import {
  CharacterPose,
  CharacterRig,
  limbPath,
  mouthPath,
} from "../data/characters/types";
import { Palette, SVG_SHADE_VAR } from "../data/characters/palette";

import { ReactComponent as BearSvg } from "../assets/animals/BEAR.svg";
import { ReactComponent as PigSvg } from "../assets/animals/PIG.svg";
import { ReactComponent as LionSvg } from "../assets/animals/LION.svg";
import { ReactComponent as MonkeySvg } from "../assets/animals/MONKEY.svg";

type SvgFC = React.FC<React.SVGProps<SVGSVGElement>>;

const ANIMAL_SVGS: Record<Animal, SvgFC> = {
  bear: BearSvg,
  pig: PigSvg,
  lion: LionSvg,
  monkey: MonkeySvg,
};

// Natural viewBox dimensions of each animal's body SVG.
const ANIMAL_DIMENSIONS: Record<Animal, { width: number; height: number }> = {
  bear: { width: 231, height: 381 },
  pig: { width: 348, height: 318 },
  lion: { width: 316, height: 410 },
  monkey: { width: 231, height: 375 },
};

// Default rendered display width per animal — tune individually to taste.
// Override per render via the `width` prop on <Character>.
const ANIMAL_DISPLAY_WIDTHS: Record<Animal, number> = {
  bear: 200,
  pig: 230,
  lion: 250,
  monkey: 170,
};

// Outer SVG padding so limbs extending past the body's viewBox still render.
const PADDING = { top: 40, right: 140, bottom: 220, left: 140 };

// Stroke widths.
const LIMB_THICKNESS = 19;
const MOUTH_THICKNESS = 4;

export type CharacterProps = {
  animal: Animal;
  rig: CharacterRig;
  pose: CharacterPose;
  palette: Palette;
  width?: number; // rendered display width in CSS pixels
};

// Helper for overlays (e.g. pose handles) that need to match Character's
// viewBox and display dimensions exactly. Same math as the body of the
// component below — pulled out so callers can render in the same space.
export function characterDisplayBox(animal: Animal, width?: number) {
  const dims = ANIMAL_DIMENSIONS[animal];
  const displayWidth = width ?? ANIMAL_DISPLAY_WIDTHS[animal];
  const viewWidth = dims.width + PADDING.left + PADDING.right;
  const viewHeight = dims.height + PADDING.top + PADDING.bottom;
  const displayHeight = displayWidth * (viewHeight / viewWidth);
  return {
    viewBox: {
      minX: -PADDING.left,
      minY: -PADDING.top,
      width: viewWidth,
      height: viewHeight,
    },
    display: {
      width: displayWidth,
      height: displayHeight,
    },
  };
}

export function Character({
  animal,
  rig,
  pose,
  palette,
  width,
}: CharacterProps) {
  const BodySvg = ANIMAL_SVGS[animal];
  const { width: bodyWidth, height: bodyHeight } = ANIMAL_DIMENSIONS[animal];
  const displayWidth = width ?? ANIMAL_DISPLAY_WIDTHS[animal];

  const viewMinX = -PADDING.left;
  const viewMinY = -PADDING.top;
  const viewWidth = bodyWidth + PADDING.left + PADDING.right;
  const viewHeight = bodyHeight + PADDING.top + PADDING.bottom;

  // CSS variables set on the wrapping div cascade into the inlined SVG.
  const cssVars = {
    [SVG_SHADE_VAR.light]: palette.light,
    [SVG_SHADE_VAR.dark]: palette.dark,
  } as React.CSSProperties;

  const displayHeight = displayWidth * (viewHeight / viewWidth);

  return (
    <div
      style={{
        ...cssVars,
        display: "inline-block",
        width: displayWidth,
        height: displayHeight,
      }}
    >
      <svg
        viewBox={`${viewMinX} ${viewMinY} ${viewWidth} ${viewHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        {/* Limbs — drawn behind the body silhouette. */}
        <g
          stroke="var(--shade-dark)"
          strokeWidth={LIMB_THICKNESS}
          fill="none"
          strokeLinecap="round"
        >
          <path
            d={limbPath(
              rig.anchors.leftShoulder,
              pose.leftArm,
              rig.limbs.leftArm.length,
            )}
          />
          <path
            d={limbPath(
              rig.anchors.rightShoulder,
              pose.rightArm,
              rig.limbs.rightArm.length,
            )}
          />
          <path
            d={limbPath(
              rig.anchors.leftHip,
              pose.leftLeg,
              rig.limbs.leftLeg.length,
            )}
          />
          <path
            d={limbPath(
              rig.anchors.rightHip,
              pose.rightLeg,
              rig.limbs.rightLeg.length,
            )}
          />
        </g>

        {/* Body SVG — nested at (0, 0) in the outer coordinate space. */}
        <BodySvg x={0} y={0} width={bodyWidth} height={bodyHeight} />

        {/* Mouth — drawn on top of the head. */}
        <path
          d={mouthPath(rig.anchors.mouth, pose.mouth)}
          stroke="black"
          strokeWidth={MOUTH_THICKNESS}
          fill="black"
          // strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
