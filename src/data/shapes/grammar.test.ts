// Tests for the drum polygon grammar's pure layer: input filtering,
// the stack parser (no macro — every b is a plain close), the geometry
// flattening, and the deterministic per-polygon color pick.

import {
  filterSource,
  parseGrammar,
  computeRenderPolygons,
  polygonFill,
  PolygonNode,
} from "./grammar";
import { ADJECTIVE_PALETTES } from "../characters/palette";

const parse = (s: string) => parseGrammar(s);
const render = (s: string) => computeRenderPolygons(parse(s).root);

describe("filterSource", () => {
  test("keeps only t/s/b, lowercased", () => {
    expect(filterSource("T-s!Bxq")).toBe("tsb");
    expect(filterSource("tsssb")).toBe("tsssb");
    expect(filterSource("hello")).toBe("");
  });
});

describe("parseGrammar", () => {
  test("empty input", () => {
    expect(parse("").status).toBe("empty");
  });

  test("an open polygon is incomplete", () => {
    expect(parse("t").status).toBe("incomplete");
    expect(parse("tsss").status).toBe("incomplete");
  });

  test("a closed polygon is valid", () => {
    const r = parse("tsssb");
    expect(r.status).toBe("valid");
    expect(r.root?.features).toHaveLength(3);
    expect(r.root?.open).toBe(false);
  });

  test("bare s and bare b are invalid", () => {
    expect(parse("s").status).toBe("invalid");
    expect(parse("b").status).toBe("invalid");
  });

  test("a second top-level polygon is invalid", () => {
    expect(parse("tsssbtsssb").status).toBe("invalid");
  });

  test("extra b after the root closes is invalid (no macro)", () => {
    // With the macro this used to rebind the template; without it,
    // the extra b has nothing to close.
    expect(parse("tsssbb").status).toBe("invalid");
  });

  test("nesting: a feature can be a whole sub-shape", () => {
    const r = parse("tsstsssbsb");
    expect(r.status).toBe("valid");
    const root = r.root as PolygonNode;
    // side, side, nested polygon, side = 4 features
    expect(root.features).toHaveLength(4);
    const nested = root.features[2] as PolygonNode;
    expect(nested.type).toBe("polygon");
    expect(nested.features).toHaveLength(3);
    expect(nested.open).toBe(false);
  });
});

describe("computeRenderPolygons", () => {
  test("a triangle renders as one filled 3-vertex polygon", () => {
    const { polygons, bbox } = render("tsssb");
    expect(polygons).toHaveLength(1);
    expect(polygons[0].vertices).toHaveLength(3);
    expect(polygons[0].filled).toBe(true);
    expect(bbox).not.toBeNull();
  });

  test("a square has 4 vertices", () => {
    const { polygons } = render("tssssb");
    expect(polygons[0].vertices).toHaveLength(4);
  });

  test("an unclosed polygon is not filled", () => {
    const { polygons } = render("tsss");
    expect(polygons[0].filled).toBe(false);
  });

  test("nesting yields parent then child, with pre-order indices", () => {
    const { polygons } = render("tsstsssbsb");
    expect(polygons).toHaveLength(2);
    expect(polygons[0].vertices).toHaveLength(4); // outer: 4 features
    expect(polygons[1].vertices).toHaveLength(3); // nested triangle
    expect(polygons[0].index).toBe(0);
    expect(polygons[1].index).toBe(1);
  });

  test("the bbox bounds every vertex", () => {
    const { polygons, bbox } = render("tsstsssbsb");
    expect(bbox).not.toBeNull();
    for (const p of polygons) {
      for (const v of p.vertices) {
        expect(v.x).toBeGreaterThanOrEqual(bbox!.minX);
        expect(v.x).toBeLessThanOrEqual(bbox!.maxX);
        expect(v.y).toBeGreaterThanOrEqual(bbox!.minY);
        expect(v.y).toBeLessThanOrEqual(bbox!.maxY);
      }
    }
  });

  test("empty root renders nothing", () => {
    const { polygons, bbox } = computeRenderPolygons(null);
    expect(polygons).toHaveLength(0);
    expect(bbox).toBeNull();
  });
});

describe("polygonFill", () => {
  test("is deterministic for the same seed and index", () => {
    expect(polygonFill(42, 3)).toEqual(polygonFill(42, 3));
  });

  test("returns colors that belong to the adjective palettes", () => {
    const allDarks = Object.values(ADJECTIVE_PALETTES).map((p) => p.dark);
    const allLights = Object.values(ADJECTIVE_PALETTES).map((p) => p.light);
    for (let i = 0; i < 10; i++) {
      const { stroke, fill } = polygonFill(7, i);
      expect(allDarks).toContain(stroke);
      expect(allLights).toContain(fill);
    }
  });
});
