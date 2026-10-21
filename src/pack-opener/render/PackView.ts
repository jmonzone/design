import { BufferGeometry, CanvasTexture, Group, Mesh, SRGBColorSpace, type ShaderMaterial } from "three";
import { tearLineY, type Layout } from "../pose/layout";
import type { PackPose } from "../pose/types";
import type { ResolvedRip } from "../timeline/resolve";
import { buildPackGeometry, type PackGeometries } from "./geometry";
import { createGuideMaterial, createLeakMaterial, createPackMaterial } from "./materials";
import { context2d, createCanvas } from "./textures/canvas";
import { loadedImage, loadImage } from "./textures/images";
import { drawPackWrapper } from "./textures/packWrapper";

const TEXTURE_WIDTH = 512;

/** The pack: wrapper body, the strip that tears off, the light in the opening and the tear-here line. */
export class PackView {
  readonly root = new Group();
  private readonly bodyMaterial: ShaderMaterial;
  private readonly flapMaterial: ShaderMaterial;
  private readonly leakMaterial = createLeakMaterial();
  private readonly guideMaterial = createGuideMaterial();
  private readonly body: Mesh;
  private readonly flap: Mesh;
  private readonly flapPivot = new Group();
  private readonly leak: Mesh;
  private readonly guide: Mesh;
  private readonly canvas = createCanvas(TEXTURE_WIDTH, TEXTURE_WIDTH * 1.5);
  private readonly texture = new CanvasTexture(this.canvas);
  private geometries?: PackGeometries;
  private geometryKey = "";
  private textureKey = "";

  constructor(private readonly onAssetLoaded: () => void) {
    this.texture.colorSpace = SRGBColorSpace;
    this.texture.anisotropy = 4;
    this.bodyMaterial = createPackMaterial(this.texture, false);
    this.flapMaterial = createPackMaterial(this.texture, true);
    this.body = new Mesh(new BufferGeometry(), this.bodyMaterial);
    this.flap = new Mesh(new BufferGeometry(), this.flapMaterial);
    this.leak = new Mesh(new BufferGeometry(), this.leakMaterial);
    this.guide = new Mesh(new BufferGeometry(), this.guideMaterial);
    this.leak.renderOrder = 1;
    this.guide.renderOrder = 2;
    this.flapPivot.add(this.flap);
    this.root.add(this.body, this.flapPivot, this.leak, this.guide);
  }

  /** Rebuilds whatever the style or pack changed: geometry, print. */
  sync(rip: ResolvedRip, layout: Layout): void {
    const { style } = rip;
    const tearY = tearLineY(style, layout);
    const geometryKey = JSON.stringify([layout.packW, layout.packH, tearY, style.tear.teeth, style.tear.jaggedness, style.pack.bulge, rip.seed]);
    if (geometryKey !== this.geometryKey) {
      this.geometryKey = geometryKey;
      this.disposeGeometries();
      const g = buildPackGeometry({
        width: layout.packW,
        height: layout.packH,
        tearY,
        teeth: style.tear.teeth,
        jaggedness: style.tear.jaggedness,
        bulge: style.pack.bulge,
        seed: rip.seed,
      });
      this.geometries = g;
      this.body.geometry = g.body;
      this.flap.geometry = g.flap;
      this.leak.geometry = g.leak;
      this.guide.geometry = g.guide;
      this.flap.position.y = -g.pivotY;
      for (const material of [this.bodyMaterial, this.flapMaterial]) {
        material.uniforms.uPackSize!.value.set(layout.packW, layout.packH);
      }
    }

    const artUrl = rip.pack.artUrl;
    const art = loadedImage(artUrl);
    if (artUrl && !art) void loadImage(artUrl).then((image) => image && this.onAssetLoaded());
    const height = Math.round((TEXTURE_WIDTH * layout.packH) / layout.packW);
    const textureKey = JSON.stringify([style.pack, style.tear.lineY, style.card.font, rip.pack.name, rip.pack.subtitle, artUrl, !!art, height]);
    if (textureKey !== this.textureKey) {
      this.textureKey = textureKey;
      if (this.canvas.height !== height) {
        this.canvas.height = height;
        this.texture.dispose();
      }
      drawPackWrapper(context2d(this.canvas), TEXTURE_WIDTH, height, style, rip.pack, art);
      this.texture.needsUpdate = true;
    }
  }

  apply(pose: PackPose, rip: ResolvedRip, tilt: { x: number; y: number }, teaseColor: string, time: number): void {
    const { style } = rip;
    this.root.visible = pose.visible && pose.opacity > 0.002;
    if (!this.root.visible) return;
    const lean = pose.tiltWeight;
    this.root.position.set(pose.x, pose.y, pose.z);
    this.root.rotation.set(pose.rotX + tilt.y * 0.22 * lean, pose.rotY + tilt.x * 0.3 * lean, pose.rotZ);
    this.root.scale.setScalar(pose.scale);

    for (const material of [this.bodyMaterial, this.flapMaterial]) {
      const u = material.uniforms;
      u.uFoil!.value = style.pack.foil;
      u.uShine!.value = style.pack.shine;
      u.uCrinkle!.value = style.pack.crinkle;
      u.uOpacity!.value = pose.opacity;
      u.uTime!.value = time;
    }
    const flap = this.flapMaterial.uniforms;
    flap.uTear!.value = pose.tear;
    flap.uFromRight!.value = pose.fromRight ? 1 : 0;
    flap.uPeel!.value = style.tear.peel;
    flap.uOpacity!.value = pose.opacity * pose.flap.opacity;
    this.flap.visible = pose.flap.opacity > 0.002;
    this.flapPivot.position.set(pose.flap.x, (this.geometries?.pivotY ?? 0) + pose.flap.y, pose.flap.z);
    this.flapPivot.rotation.set(pose.flap.rotX, pose.flap.rotY, pose.flap.rotZ);

    const leak = this.leakMaterial.uniforms;
    leak.uTear!.value = pose.tear;
    leak.uFromRight!.value = pose.fromRight ? 1 : 0;
    leak.uColor!.value.set(teaseColor);
    leak.uIntensity!.value = pose.leak * pose.opacity;
    leak.uTime!.value = time;
    this.leak.visible = pose.leak > 0.001;

    const guide = this.guideMaterial.uniforms;
    guide.uColor!.value.set(style.pack.accent);
    guide.uIntensity!.value = pose.guide;
    guide.uTime!.value = time;
    this.guide.visible = pose.guide > 0.001;
  }

  private disposeGeometries(): void {
    if (!this.geometries) return;
    for (const geometry of [this.geometries.body, this.geometries.flap, this.geometries.leak, this.geometries.guide]) {
      geometry.dispose();
    }
  }

  dispose(): void {
    this.disposeGeometries();
    for (const material of [this.bodyMaterial, this.flapMaterial, this.leakMaterial, this.guideMaterial]) material.dispose();
    this.texture.dispose();
  }
}
