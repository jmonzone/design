import { BufferAttribute, BufferGeometry, Mesh, PlaneGeometry, Points, type ShaderMaterial } from "three";
import { seededRandom } from "../math/random";
import { mixHex } from "../math/color";
import type { Layout } from "../pose/layout";
import type { RipStyle } from "../style/types";
import { createBackgroundMaterial, createDustMaterial } from "./materials";

/** The full-canvas backdrop, drawn before everything else. */
export class BackgroundView {
  readonly mesh: Mesh<PlaneGeometry, ShaderMaterial>;

  constructor() {
    this.mesh = new Mesh(new PlaneGeometry(2, 2), createBackgroundMaterial());
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1000;
  }

  apply(
    style: RipStyle,
    glow: number,
    glowColor: string,
    flash: number,
    flashColor: string,
    aspect: number,
    center: { x: number; y: number },
    time: number,
  ): void {
    const u = this.mesh.material.uniforms;
    u.uTop!.value.set(style.scene.bgTop);
    u.uBottom!.value.set(style.scene.bgBottom);
    u.uVignette!.value = style.scene.vignette;
    u.uGlow!.value = glow;
    u.uGlowColor!.value.set(glowColor);
    u.uFlash!.value = Math.min(1, flash);
    u.uFlashColor!.value.set(flashColor);
    u.uAspect!.value = aspect;
    u.uCenter!.value.set(center.x, center.y);
    u.uTime!.value = time;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

const DUST_COUNT = 260;

/** Specks drifting up through the space behind the cards. */
export class DustView {
  readonly points: Points<BufferGeometry, ShaderMaterial>;

  constructor() {
    const random = seededRandom(7);
    const positions = new Float32Array(DUST_COUNT * 3);
    const seeds = new Float32Array(DUST_COUNT);
    for (let i = 0; i < DUST_COUNT; i++) {
      positions[i * 3] = random() - 0.5;
      positions[i * 3 + 1] = random() - 0.5;
      positions[i * 3 + 2] = random() - 0.5;
      seeds[i] = random();
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    this.points = new Points(geometry, createDustMaterial());
    this.points.frustumCulled = false;
  }

  apply(style: RipStyle, layout: Layout, pointScale: number, time: number): void {
    const u = this.points.material.uniforms;
    this.points.visible = style.scene.dust > 0;
    this.points.geometry.setDrawRange(0, Math.round(DUST_COUNT * Math.min(1, style.scene.dust * 1.5)));
    u.uSpan!.value.set(layout.viewW * 1.8, layout.viewH * 1.5, 3, -1.4);
    u.uAmount!.value = style.scene.dust;
    u.uScale!.value = pointScale;
    u.uTime!.value = time;
    u.uColor!.value.set(mixHex(style.scene.bgTop, "#ffffff", 0.75));
  }

  dispose(): void {
    this.points.geometry.dispose();
    this.points.material.dispose();
  }
}
