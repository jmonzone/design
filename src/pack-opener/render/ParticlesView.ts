import { BufferAttribute, BufferGeometry, DynamicDrawUsage, Points, type ShaderMaterial } from "three";
import type { Layout } from "../pose/layout";
import { createParticleBuffers, writeParticles, type ParticleBuffers } from "../pose/particles";
import type { RipRecord } from "../timeline/record";
import type { ResolvedRip } from "../timeline/resolve";
import { createParticlesMaterial } from "./materials";

const CAPACITY = 2400;

/** Every spark and burst, rewritten from the record each frame. */
export class ParticlesView {
  readonly points: Points<BufferGeometry, ShaderMaterial>;
  private readonly buffers: ParticleBuffers = createParticleBuffers(CAPACITY);
  private readonly attributes: BufferAttribute[];

  constructor() {
    const geometry = new BufferGeometry();
    const { positions, colors, sizes, alphas } = this.buffers;
    this.attributes = [
      new BufferAttribute(positions, 3),
      new BufferAttribute(colors, 3),
      new BufferAttribute(sizes, 1),
      new BufferAttribute(alphas, 1),
    ];
    for (const attribute of this.attributes) attribute.setUsage(DynamicDrawUsage);
    geometry.setAttribute("position", this.attributes[0]!);
    geometry.setAttribute("aColor", this.attributes[1]!);
    geometry.setAttribute("aSize", this.attributes[2]!);
    geometry.setAttribute("aAlpha", this.attributes[3]!);
    this.points = new Points(geometry, createParticlesMaterial());
    this.points.frustumCulled = false;
    this.points.renderOrder = 20;
  }

  apply(rip: ResolvedRip, record: RipRecord, layout: Layout, t: number, teaseColor: string, pointScale: number): void {
    const count = writeParticles(rip, record, layout, t, teaseColor, this.buffers);
    this.points.geometry.setDrawRange(0, count);
    this.points.visible = count > 0;
    for (const attribute of this.attributes) attribute.needsUpdate = true;
    this.points.material.uniforms.uScale!.value = pointScale;
  }

  dispose(): void {
    this.points.geometry.dispose();
    this.points.material.dispose();
  }
}
