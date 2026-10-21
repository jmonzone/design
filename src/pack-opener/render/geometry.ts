import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, PlaneGeometry, Shape } from "three";
import { hash01 } from "../math/random";
import { lerp, smoothstep } from "../math/scalar";

export function roundedRectShape(width: number, height: number, radius: number): Shape {
  const r = Math.max(0.0001, Math.min(radius, width / 2, height / 2));
  const x = -width / 2;
  const y = -height / 2;
  const shape = new Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.absarc(x + width - r, y + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(x + width, y + height - r);
  shape.absarc(x + width - r, y + height - r, r, 0, Math.PI / 2, false);
  shape.lineTo(x + r, y + height);
  shape.absarc(x + r, y + height - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, y + r);
  shape.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return shape;
}

/** A rounded slab `depth` thick, centered on z = 0: front cap facing +z, back cap -z, sides between. */
export function roundedBoxGeometry(width: number, height: number, radius: number, depth: number): BufferGeometry {
  const geometry = new ExtrudeGeometry(roundedRectShape(width, height, radius), {
    depth: Math.max(0.001, depth),
    bevelEnabled: false,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -Math.max(0.001, depth) / 2);
  return geometry;
}

export function planeGeometry(width: number, height: number): BufferGeometry {
  return new PlaneGeometry(width, height);
}

export interface PackGeometryParams {
  readonly width: number;
  readonly height: number;
  /** The tear line's height (y up from the pack's center), before its teeth. */
  readonly tearY: number;
  readonly teeth: number;
  readonly jaggedness: number;
  readonly bulge: number;
  readonly seed: number;
}

export interface PackGeometries {
  /** Below the tear: stays with the pack. */
  readonly body: BufferGeometry;
  /** Above it: peels and flies off. Carries aAlong (0–1 across) and aTearY (its column's tear height). */
  readonly flap: BufferGeometry;
  /** A ribbon standing in the opening, for the light leaking out. */
  readonly leak: BufferGeometry;
  /** A ribbon on the front along the tear, for the tear-here line. */
  readonly guide: BufferGeometry;
  /** The tear line's mean height: where the flap pivots. */
  readonly pivotY: number;
}

/** The share of the wrapper's height crimped flat at each end (its print draws the crimps over the same band). */
export const PACK_CRIMP_SHARE = 0.06;

/** The jagged tear's offset from the straight line at `along` (0–1 across): one zigzag tooth per 1/teeth, each
 * its own height. */
function toothOffset(along: number, params: PackGeometryParams): number {
  const phase = along * params.teeth;
  const tooth = Math.floor(phase);
  const zig = Math.abs(phase - tooth - 0.5) * 2 - 0.5;
  const amplitude = params.jaggedness * 0.05 * (0.55 + 0.9 * hash01(params.seed, tooth));
  const wobble = (hash01(params.seed + 7, tooth) - 0.5) * params.jaggedness * 0.02;
  return zig * amplitude + wobble;
}

/** How far the wrapper puffs out at (x, y): flat at the side seams and the crimped ends, full in the middle. */
function puff(x: number, y: number, params: PackGeometryParams): number {
  const xn = Math.abs((2 * x) / params.width);
  const yn = Math.abs((2 * y) / params.height);
  const crimpEdge = 1 - PACK_CRIMP_SHARE * 2;
  const fx = 1 - Math.pow(Math.min(1, xn), 6);
  const fy = 1 - smoothstep(crimpEdge - 0.22, crimpEdge, yn);
  return params.bulge * 0.075 * params.width * fx * fy;
}

/**
 * The wrapper as two puffed layers (front and back) split along the jagged tear into body and flap. Columns land
 * on every tooth's tip and notch, so the torn edges of body and flap match exactly.
 */
export function buildPackGeometry(params: PackGeometryParams): PackGeometries {
  const { width, height } = params;
  const columns = Math.max(16, Math.round(params.teeth) * 4);
  const tearAt = (c: number) => params.tearY + toothOffset(c / columns, params);
  const xAt = (c: number) => -width / 2 + (c / columns) * width;

  const grid = (rows: number, yAt: (c: number, r: number) => number, withTear: boolean) => {
    const positions: number[] = [];
    const uvs: number[] = [];
    const fronts: number[] = [];
    const alongs: number[] = [];
    const tears: number[] = [];
    const indices: number[] = [];
    const perLayer = (columns + 1) * (rows + 1);
    for (const front of [1, 0]) {
      for (let c = 0; c <= columns; c++) {
        for (let r = 0; r <= rows; r++) {
          const x = xAt(c);
          const y = yAt(c, r);
          const z = puff(x, y, params) * (front ? 1 : -1);
          positions.push(x, y, z);
          uvs.push(x / width + 0.5, y / height + 0.5);
          fronts.push(front);
          if (withTear) {
            alongs.push(c / columns);
            tears.push(tearAt(c));
          }
        }
      }
    }
    const at = (layer: number, c: number, r: number) => layer * perLayer + c * (rows + 1) + r;
    for (let c = 0; c < columns; c++) {
      for (let r = 0; r < rows; r++) {
        const [a, b, cc, d] = [at(0, c, r), at(0, c + 1, r), at(0, c + 1, r + 1), at(0, c, r + 1)];
        indices.push(a, b, cc, a, cc, d);
        const [a2, b2, c2, d2] = [at(1, c, r), at(1, c + 1, r), at(1, c + 1, r + 1), at(1, c, r + 1)];
        indices.push(a2, c2, b2, a2, d2, c2);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
    geometry.setAttribute("aFront", new Float32BufferAttribute(fronts, 1));
    if (withTear) {
      geometry.setAttribute("aAlong", new Float32BufferAttribute(alongs, 1));
      geometry.setAttribute("aTearY", new Float32BufferAttribute(tears, 1));
    }
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  };

  const bodyRows = 36;
  const flapRows = 10;
  const body = grid(bodyRows, (c, r) => lerp(-height / 2, tearAt(c), r / bodyRows), false);
  const flap = grid(flapRows, (c, r) => lerp(tearAt(c), height / 2, r / flapRows), true);

  const ribbon = (bottom: (c: number) => number, top: (c: number) => number, z: (c: number, y: number) => number) => {
    const positions: number[] = [];
    const alongs: number[] = [];
    const vs: number[] = [];
    const indices: number[] = [];
    for (let c = 0; c <= columns; c++) {
      const x = xAt(c);
      for (const [v, y] of [
        [0, bottom(c)],
        [1, top(c)],
      ] as const) {
        positions.push(x, y, z(c, y));
        alongs.push(c / columns);
        vs.push(v);
      }
      if (c < columns) {
        const i = c * 2;
        indices.push(i, i + 2, i + 3, i, i + 3, i + 1);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("aAlong", new Float32BufferAttribute(alongs, 1));
    geometry.setAttribute("aV", new Float32BufferAttribute(vs, 1));
    geometry.setIndex(indices);
    return geometry;
  };

  const leak = ribbon(
    (c) => tearAt(c) - 0.01,
    (c) => tearAt(c) + height * 0.07,
    () => 0,
  );
  const guideHalf = height * 0.007;
  const guide = ribbon(
    (c) => tearAt(c) - guideHalf,
    (c) => tearAt(c) + guideHalf,
    (c, y) => puff(xAt(c), y, params) + 0.004,
  );

  return { body, flap, leak, guide, pivotY: params.tearY };
}
