// Project a world-space coordinate into screen-space pixels using the
// camera state. The character, stickers, and any future world-anchored
// element all project through this function so a change to the camera
// model (zoom, parallax-anchored items, perspective tilt) is one edit.
//
// World convention: characterX is relative to world center (positive =
// right); characterY is negative-for-up. Screen output:
//   - `left` is CSS-pixel offset from the playground's left edge,
//   - `bottom` is CSS-pixel offset from the playground's bottom edge,
// matching the position: absolute; left + bottom pattern.

export type Camera = {
  cameraX: number;
  cameraY: number;
  windowWidth: number;
  worldCenter: number;
  groundOffset: number;
};

export type WorldPoint = {
  worldX: number; // relative to world center
  worldY: number; // negative-for-up
};

export type ScreenPoint = {
  left: number;
  bottom: number;
};

export function projectWorldToScreen(
  point: WorldPoint,
  camera: Camera,
): ScreenPoint {
  const absoluteWorldX = camera.worldCenter + point.worldX;
  const left = absoluteWorldX - camera.cameraX + camera.windowWidth / 2;
  const bottom = camera.groundOffset - point.worldY - camera.cameraY;
  return { left, bottom };
}
