import {
  BufferGeometry,
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  NoColorSpace,
  SRGBColorSpace,
  type Raycaster,
  type ShaderMaterial,
} from "three";
import { HOLDERS } from "../defs/holders";
import { holoPatternIndexOf } from "../defs/holoPatterns";
import { shadeHex } from "../math/color";
import type { Layout } from "../pose/layout";
import type { Pose } from "../pose/types";
import type { ResolvedRip } from "../timeline/resolve";
import { planeGeometry, roundedBoxGeometry } from "./geometry";
import { createCardMaterial, createGlassMaterial, createGlowMaterial, createRaysMaterial } from "./materials";
import { drawCardBack } from "./textures/cardBack";
import { drawDefaultCardFace, drawDefaultFoilMask, type CardFaceRenderer } from "./textures/cardFace";
import { context2d, createCanvas } from "./textures/canvas";
import { loadedImage, loadImage } from "./textures/images";
import { drawSlabLabel } from "./textures/slabLabel";

const FACE_WIDTH = 512;
const MASK_WIDTH = 128;
const LABEL_WIDTH = 512;

/** Geometry every card shares, rebuilt when the card's shape or holder changes. */
interface CardShapes {
  readonly card: BufferGeometry;
  readonly glow: BufferGeometry;
  readonly rays: BufferGeometry;
  readonly slabCase: BufferGeometry;
  readonly label: BufferGeometry;
  readonly pick: BufferGeometry;
}

class CardView {
  /** The card (in its holder), placed by its pose. */
  readonly root = new Group();
  /** Its glow and rays: placed with it but never turned over with it. */
  readonly fx = new Group();
  readonly material: ShaderMaterial;
  readonly glowMaterial = createGlowMaterial();
  readonly raysMaterial = createRaysMaterial();
  readonly glassMaterial = createGlassMaterial();
  readonly labelMaterial = new MeshBasicMaterial({ transparent: true, toneMapped: false });
  readonly card: Mesh;
  readonly glow: Mesh;
  readonly rays: Mesh;
  readonly slabCase: Mesh;
  readonly label: Mesh;
  readonly pick: Mesh;
  readonly faceCanvas = createCanvas(FACE_WIDTH, FACE_WIDTH * 1.4);
  readonly faceTexture = new CanvasTexture(this.faceCanvas);
  readonly labelCanvas = createCanvas(LABEL_WIDTH, 128);
  readonly labelTexture = new CanvasTexture(this.labelCanvas);
  faceKey = "";
  labelKey = "";

  constructor(shapes: CardShapes, back: CanvasTexture, mask: CanvasTexture) {
    this.faceTexture.colorSpace = SRGBColorSpace;
    this.faceTexture.anisotropy = 8;
    this.labelTexture.colorSpace = SRGBColorSpace;
    this.material = createCardMaterial(back, mask);
    this.material.uniforms.uFace!.value = this.faceTexture;
    this.labelMaterial.map = this.labelTexture;
    this.card = new Mesh(shapes.card, this.material);
    this.glow = new Mesh(shapes.glow, this.glowMaterial);
    this.rays = new Mesh(shapes.rays, this.raysMaterial);
    this.slabCase = new Mesh(shapes.slabCase, this.glassMaterial);
    this.label = new Mesh(shapes.label, this.labelMaterial);
    this.pick = new Mesh(shapes.pick, new MeshBasicMaterial({ visible: false }));
    this.slabCase.renderOrder = 5;
    this.label.renderOrder = 4;
    this.root.add(this.card, this.slabCase, this.label, this.pick);
    this.fx.add(this.rays, this.glow);
    this.rays.position.z = -0.03;
  }

  setShapes(shapes: CardShapes, layout: Layout, slab: boolean, caseDepth: number): void {
    this.card.geometry = shapes.card;
    this.glow.geometry = shapes.glow;
    this.rays.geometry = shapes.rays;
    this.slabCase.geometry = shapes.slabCase;
    this.label.geometry = shapes.label;
    this.pick.geometry = shapes.pick;
    this.card.position.y = layout.cardY;
    this.label.position.set(0, layout.labelY, caseDepth / 2 - 0.004);
    this.slabCase.visible = slab;
    this.label.visible = slab;
  }

  dispose(): void {
    for (const material of [this.material, this.glowMaterial, this.raysMaterial, this.glassMaterial, this.labelMaterial]) {
      material.dispose();
    }
    (this.pick.material as MeshBasicMaterial).dispose();
    this.faceTexture.dispose();
    this.labelTexture.dispose();
  }
}

/** Every card in the pack: shared shapes and back print, and each card's own face, label and effects. */
export class CardsView {
  readonly group = new Group();
  private views: CardView[] = [];
  private shapes?: CardShapes;
  private shapesKey = "";
  private readonly backCanvas = createCanvas(FACE_WIDTH, FACE_WIDTH * 1.4);
  private readonly backTexture = new CanvasTexture(this.backCanvas);
  private backKey = "";
  private readonly maskCanvas = createCanvas(MASK_WIDTH, MASK_WIDTH * 1.4);
  private readonly maskTexture = new CanvasTexture(this.maskCanvas);
  private maskKey = "";
  private renderFace?: CardFaceRenderer;

  constructor(private readonly onAssetLoaded: () => void) {
    this.backTexture.colorSpace = SRGBColorSpace;
    this.backTexture.anisotropy = 8;
    this.maskTexture.colorSpace = NoColorSpace;
  }

  /** Rebuilds whatever changed: the number of cards, their shapes, the back print, each face and label. */
  sync(rip: ResolvedRip, layout: Layout, renderFace: CardFaceRenderer | undefined): void {
    const { style } = rip;
    const cs = style.card;
    const holder = HOLDERS.of(cs.holder);
    const slab = holder.caseDepth > 0;
    const faceHeight = Math.round(FACE_WIDTH * layout.cardH);

    const shapesKey = JSON.stringify([layout.cardH, layout.unitW, layout.unitH, layout.cardY, layout.labelY, cs.cornerRadius, cs.thickness, holder.id]);
    if (shapesKey !== this.shapesKey || !this.shapes) {
      this.shapesKey = shapesKey;
      const old = this.shapes;
      const reach = layout.unitH * 2.2;
      this.shapes = {
        card: roundedBoxGeometry(layout.cardW, layout.cardH, cs.cornerRadius * layout.cardW, cs.thickness),
        glow: planeGeometry(layout.unitW * 2.4, layout.unitH * 1.9),
        rays: planeGeometry(reach * 2, reach * 2),
        slabCase: roundedBoxGeometry(layout.unitW, layout.unitH, cs.cornerRadius + holder.pad, Math.max(0.001, holder.caseDepth)),
        label: planeGeometry(layout.unitW - holder.pad * 2, Math.max(0.001, holder.labelHeight)),
        pick: planeGeometry(layout.unitW, layout.unitH),
      };
      for (const view of this.views) view.setShapes(this.shapes, layout, slab, holder.caseDepth);
      if (old) for (const geometry of Object.values(old)) geometry.dispose();
    }

    const backKey = JSON.stringify([cs.backColorA, cs.backColorB, cs.backPattern, cs.backEmblem, cs.cornerRadius, cs.font, faceHeight]);
    if (backKey !== this.backKey) {
      this.backKey = backKey;
      this.resize(this.backCanvas, this.backTexture, faceHeight);
      drawCardBack(context2d(this.backCanvas), FACE_WIDTH, faceHeight, cs);
      this.backTexture.needsUpdate = true;
    }

    const maskHeight = Math.round(MASK_WIDTH * layout.cardH);
    const maskKey = JSON.stringify([cs.border, cs.cornerRadius, cs.foilArea, maskHeight]);
    if (maskKey !== this.maskKey) {
      this.maskKey = maskKey;
      this.resize(this.maskCanvas, this.maskTexture, maskHeight);
      drawDefaultFoilMask(context2d(this.maskCanvas), MASK_WIDTH, maskHeight, cs);
      this.maskTexture.needsUpdate = true;
    }

    while (this.views.length < rip.cards.length) {
      const view = new CardView(this.shapes, this.backTexture, this.maskTexture);
      view.setShapes(this.shapes, layout, slab, holder.caseDepth);
      this.views.push(view);
      this.group.add(view.fx, view.root);
    }
    while (this.views.length > rip.cards.length) {
      const view = this.views.pop()!;
      this.group.remove(view.fx, view.root);
      view.dispose();
    }

    const rendererChanged = renderFace !== this.renderFace;
    this.renderFace = renderFace;
    const labelHeight = Math.round((LABEL_WIDTH * holder.labelHeight) / Math.max(0.01, layout.unitW - holder.pad * 2));
    rip.cards.forEach((card, i) => {
      const view = this.views[i]!;
      const rarity = rip.rarities[i]!;
      const image = loadedImage(card.imageUrl);
      if (card.imageUrl && !image) void loadImage(card.imageUrl).then((loaded) => loaded && this.onAssetLoaded());

      const faceKey = JSON.stringify([card, rarity, cs, !!image, faceHeight]);
      if (faceKey !== view.faceKey || rendererChanged) {
        view.faceKey = faceKey;
        this.resize(view.faceCanvas, view.faceTexture, faceHeight);
        const ctx = context2d(view.faceCanvas);
        ctx.clearRect(0, 0, FACE_WIDTH, faceHeight);
        try {
          (renderFace ?? drawDefaultCardFace)(ctx, { card, rarity, style, width: FACE_WIDTH, height: faceHeight, image });
        } catch (error) {
          console.error("pack-opener: renderFace failed, using the default face", error);
          drawDefaultCardFace(ctx, { card, rarity, style, width: FACE_WIDTH, height: faceHeight, image });
        }
        view.faceTexture.needsUpdate = true;
      }

      if (slab) {
        const labelKey = JSON.stringify([card, rarity.color, rarity.label, cs.font, cs.showValue, cs.currency, labelHeight]);
        if (labelKey !== view.labelKey) {
          view.labelKey = labelKey;
          this.resize(view.labelCanvas, view.labelTexture, labelHeight);
          const ctx = context2d(view.labelCanvas);
          ctx.clearRect(0, 0, LABEL_WIDTH, labelHeight);
          drawSlabLabel(ctx, LABEL_WIDTH, labelHeight, card, rarity, style);
          view.labelTexture.needsUpdate = true;
        }
      }

      const u = view.material.uniforms;
      u.uSize!.value.set(layout.cardW, layout.cardH);
      u.uRarity!.value.set(rarity.color);
      u.uEdge!.value.set(shadeHex(cs.frameColor, -0.3));
      u.uPattern!.value = holoPatternIndexOf(cs.holoPattern);
      u.uGloss!.value = cs.gloss;
      const glow = view.glowMaterial.uniforms;
      glow.uHalf!.value.set(layout.unitW / 2, layout.unitH / 2);
      glow.uRadius!.value = (cs.cornerRadius + holder.pad) * layout.cardW;
      glow.uColor!.value.set(rarity.color);
      view.raysMaterial.uniforms.uColor!.value.set(rarity.color);
      view.raysMaterial.uniforms.uReach!.value = layout.unitH * 2.2;
      const glass = view.glassMaterial.uniforms;
      glass.uSize!.value.set(layout.unitW, layout.unitH);
      const cardBottom = (layout.cardY - layout.cardH / 2) / layout.unitH + 0.5;
      const cardTop = (layout.cardY + layout.cardH / 2) / layout.unitH + 0.5;
      const sideIn = holder.pad / layout.unitW;
      glass.uCard!.value.set(sideIn, cardBottom, 1 - sideIn, cardTop);
    });
  }

  apply(pose: Pose, rip: ResolvedRip, tilt: { x: number; y: number }, time: number): void {
    const { style } = rip;
    this.views.forEach((view, i) => {
      const p = pose.cards[i];
      const rarity = rip.rarities[i];
      if (!p || !rarity || !p.visible) {
        view.root.visible = false;
        view.fx.visible = false;
        return;
      }
      view.root.visible = true;
      view.fx.visible = true;
      const lean = style.card.tilt * 0.5 * p.tiltWeight;
      view.root.position.set(p.x, p.y, p.z);
      view.root.rotation.set(p.rotX + tilt.y * lean, p.rotY + tilt.x * lean, p.rotZ);
      view.root.scale.setScalar(p.scale);
      view.fx.position.set(p.x, p.y, p.z - 0.06);
      view.fx.rotation.set(0, 0, p.rotZ);
      view.fx.scale.setScalar(p.scale);
      const order = p.front ? 10 : 0;
      view.card.renderOrder = order;
      view.label.renderOrder = order + 4;
      view.slabCase.renderOrder = order + 5;

      const u = view.material.uniforms;
      u.uOpacity!.value = p.opacity;
      u.uDim!.value = p.dim;
      u.uFlare!.value = p.flare;
      u.uFoil!.value = style.card.foil * rarity.foil * (1 + p.flare * 0.8);
      u.uTime!.value = time;

      const glow = p.glow * p.opacity * (1 - p.dim);
      view.glow.visible = glow > 0.003;
      view.glowMaterial.uniforms.uIntensity!.value = glow;
      view.glowMaterial.uniforms.uTime!.value = time;
      const rays = p.rays * p.opacity * (1 - p.dim);
      view.rays.visible = rays > 0.003;
      view.raysMaterial.uniforms.uIntensity!.value = rays;
      view.raysMaterial.uniforms.uTime!.value = time;

      view.glassMaterial.uniforms.uOpacity!.value = p.opacity;
      view.glassMaterial.uniforms.uDim!.value = p.dim;
      view.labelMaterial.opacity = p.opacity;
      view.labelMaterial.color.setScalar(1 - p.dim);
    });
  }

  /** The card under the ray (the nearest one showing), or -1. */
  pick(raycaster: Raycaster): number {
    let best = -1;
    let bestDistance = Infinity;
    this.views.forEach((view, i) => {
      if (!view.root.visible) return;
      view.root.updateMatrixWorld();
      const hit = raycaster.intersectObject(view.pick, false)[0];
      if (hit && hit.distance < bestDistance) {
        best = i;
        bestDistance = hit.distance;
      }
    });
    return best;
  }

  private resize(canvas: HTMLCanvasElement, texture: CanvasTexture, height: number): void {
    if (canvas.height === height) return;
    canvas.height = height;
    texture.dispose();
  }

  dispose(): void {
    for (const view of this.views) view.dispose();
    this.views = [];
    if (this.shapes) for (const geometry of Object.values(this.shapes)) geometry.dispose();
    this.backTexture.dispose();
    this.maskTexture.dispose();
  }
}
