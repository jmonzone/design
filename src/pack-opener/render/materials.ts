import { AdditiveBlending, Color, DoubleSide, ShaderMaterial, Vector2, Vector4, type Texture } from "three";
import { COMMON_GLSL, HOLO_GLSL, PLANE_VERTEX, SURFACE_VERTEX } from "./glsl";

/** A card: its printed face (plus holo foil where the mask allows, a flare as it turns over and a glare that
 * follows the tilt) on the front cap, its back on the back cap, plain edge on the sides. */
export function createCardMaterial(back: Texture, mask: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uSize: { value: new Vector2(1, 1.4) },
      uFace: { value: null as Texture | null },
      uMask: { value: mask },
      uBack: { value: back },
      uRarity: { value: new Color() },
      uEdge: { value: new Color() },
      uFoil: { value: 0 },
      uPattern: { value: 0 },
      uGloss: { value: 0.5 },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uDim: { value: 0 },
      uFlare: { value: 0 },
    },
    vertexShader: SURFACE_VERTEX,
    fragmentShader: /* glsl */ `
uniform sampler2D uFace;
uniform sampler2D uMask;
uniform sampler2D uBack;
uniform vec3 uRarity;
uniform vec3 uEdge;
uniform float uFoil;
uniform float uPattern;
uniform float uGloss;
uniform float uTime;
uniform float uOpacity;
uniform float uDim;
uniform float uFlare;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying float vFace;
${COMMON_GLSL}
${HOLO_GLSL}
void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec2 lean = (V - N * dot(V, N)).xy;
  vec2 backUv = vec2(1.0 - vUv.x, vUv.y);
  vec3 base = texture2D(uFace, vUv).rgb;
  float mask = texture2D(uMask, vUv).r;
  vec3 back = texture2D(uBack, backUv).rgb;
  vec3 color;
  if (vFace > 0.5) {
    vec3 foil = holo(uPattern, vUv, lean, uTime) * mask * uFoil;
    color = base + foil * (1.0 - base * 0.6);
    float sweepAt = (1.0 - uFlare) * 2.6 - 0.3;
    float sweepOffset = vUv.x * 0.7 + vUv.y - sweepAt;
    float sweep = exp(-sweepOffset * sweepOffset * 22.0) * uFlare;
    color += (uRarity * 0.8 + 0.4) * sweep;
    vec2 spot = vUv - 0.5 - lean * 1.6;
    color += exp(-dot(spot, spot) * 4.0) * uGloss * 0.3;
  } else if (vFace < -0.5) {
    color = back;
    color += pow(max(0.0, 0.5 + 0.5 * sin((backUv.x + backUv.y) * 4.0 + lean.x * 7.0)), 8.0) * 0.1;
  } else {
    color = uEdge;
  }
  color *= 1.0 - uDim;
  gl_FragColor = vec4(color, uOpacity);
  #include <colorspace_fragment>
}
`,
    transparent: true,
  });
}

/** The wrapper: its print lit like crumpled foil (iridescent, with sliding highlights), silver inside. The flap's
 * copy also peels: each part of the strip already torn curls up about the tear line. */
export function createPackMaterial(map: Texture | null, flap: boolean): ShaderMaterial {
  return new ShaderMaterial({
    defines: flap ? { FLAP: "" } : {},
    uniforms: {
      uMap: { value: map },
      uPackSize: { value: new Vector2(1, 1) },
      uFoil: { value: 0.6 },
      uShine: { value: 0.6 },
      uCrinkle: { value: 0.4 },
      uOpacity: { value: 1 },
      uTime: { value: 0 },
      uTear: { value: 0 },
      uFromRight: { value: 0 },
      uPeel: { value: 0.7 },
    },
    vertexShader: /* glsl */ `
attribute float aFront;
#ifdef FLAP
attribute float aAlong;
attribute float aTearY;
uniform float uTear;
uniform float uFromRight;
uniform float uPeel;
#endif
uniform vec2 uPackSize;
varying vec2 vUv;
varying vec2 vLocal;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying float vFront;
void main() {
  vec3 p = position;
  vec3 n = normal;
#ifdef FLAP
  float s = uFromRight > 0.5 ? 1.0 - aAlong : aAlong;
  float torn = clamp((uTear - s) * 4.0, 0.0, 1.0);
  float theta = torn * (0.25 + uPeel * 1.1);
  float c = cos(theta);
  float sn = sin(theta);
  float dy = p.y - aTearY;
  float dz = p.z;
  p.y = aTearY + dy * c - dz * sn + torn * 0.02;
  p.z = dy * sn + dz * c;
  n = vec3(n.x, n.y * c - n.z * sn, n.y * sn + n.z * c);
#endif
  vUv = uv;
  vLocal = position.xy / uPackSize;
  vFront = aFront;
  vec4 world = modelMatrix * vec4(p, 1.0);
  vWorldPos = world.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`,
    fragmentShader: /* glsl */ `
uniform sampler2D uMap;
uniform float uFoil;
uniform float uShine;
uniform float uCrinkle;
uniform float uOpacity;
uniform float uTime;
varying vec2 vUv;
varying vec2 vLocal;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying float vFront;
${COMMON_GLSL}
void main() {
  vec3 N = normalize(vWorldNormal);
  if (!gl_FrontFacing) N = -N;
  vec2 q = vLocal * vec2(8.0, 11.0);
  float e = 0.03;
  float n0 = noise2(q);
  vec2 grad = vec2(noise2(q + vec2(e, 0.0)) - n0, noise2(q + vec2(0.0, e)) - n0) / e;
  vec2 q2 = q * 2.7 + 5.0;
  float n1 = noise2(q2);
  vec2 grad2 = vec2(noise2(q2 + vec2(e, 0.0)) - n1, noise2(q2 + vec2(0.0, e)) - n1) / e;
  N = normalize(N + vec3(grad + grad2 * 0.5, 0.0) * uCrinkle * 0.08);

  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 albedo = texture2D(uMap, vUv).rgb;
  if (!gl_FrontFacing) albedo = vec3(0.72, 0.74, 0.78);
  else if (vFront < 0.5) albedo *= 0.55;

  float ndl = max(dot(N, normalize(vec3(-0.35, 0.55, 1.0))), 0.0);
  vec3 R = reflect(-V, N);
  float env = 0.25 + 0.75 * smoothstep(-0.3, 0.8, R.y);
  float bands = pow(max(0.0, 0.5 + 0.5 * sin(R.x * 5.0 + R.y * 3.0 + 1.3)), 5.0);
  float spec = pow(max(dot(R, normalize(vec3(-0.3, 0.6, 1.0))), 0.0), 28.0);
  float facing = max(dot(N, V), 0.0);
  vec3 irid = hsv2rgb(vec3(fract(facing * 1.6 + R.x * 0.5 + uTime * 0.02), 0.45, 1.0));
  vec3 printed = albedo * (0.55 + 0.5 * ndl);
  vec3 metal = albedo * (0.35 + env * 0.9) + irid * 0.25 * bands;
  vec3 color = mix(printed, metal, uFoil * 0.75);
  color += (spec * 0.9 + bands * 0.12) * uShine;
  color += pow(clamp(1.0 - facing, 0.0, 1.0), 3.0) * 0.18 * uShine;
  gl_FragColor = vec4(color, uOpacity);
  #include <colorspace_fragment>
}
`,
    side: DoubleSide,
    transparent: true,
  });
}

function additive(material: ShaderMaterial): ShaderMaterial {
  material.blending = AdditiveBlending;
  material.transparent = true;
  material.depthWrite = false;
  return material;
}

/** Light around a card: a soft halo hugging its rounded outline. */
export function createGlowMaterial(): ShaderMaterial {
  return additive(
    new ShaderMaterial({
      uniforms: {
        uHalf: { value: new Vector2(0.5, 0.7) },
        uRadius: { value: 0.05 },
        uColor: { value: new Color() },
        uIntensity: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: PLANE_VERTEX,
      fragmentShader: /* glsl */ `
uniform vec2 uHalf;
uniform float uRadius;
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;
varying vec2 vPos;
${COMMON_GLSL}
void main() {
  float d = max(sdRoundRect(vPos, uHalf, uRadius), 0.0);
  // Faded to nothing well before the plane's edge (at least 0.6 out from the card all round).
  float g = (exp(-d * 9.0) * 0.8 + exp(-d * 2.6) * 0.45) * (1.0 - smoothstep(0.3, 0.6, d));
  float flicker = 0.9 + 0.1 * sin(uTime * 6.0 + vPos.x * 4.0 + vPos.y * 3.0);
  gl_FragColor = vec4(uColor * g * uIntensity * flicker, 1.0);
  #include <colorspace_fragment>
}
`,
    }),
  );
}

/** Slowly turning shafts of light fanning out behind a card. */
export function createRaysMaterial(): ShaderMaterial {
  return additive(
    new ShaderMaterial({
      uniforms: {
        uColor: { value: new Color() },
        uIntensity: { value: 0 },
        uTime: { value: 0 },
        uReach: { value: 2 },
      },
      vertexShader: PLANE_VERTEX,
      fragmentShader: /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;
uniform float uReach;
varying vec2 vPos;
void main() {
  float r = length(vPos) / uReach;
  float a = atan(vPos.y, vPos.x + 1e-5);
  float rays = pow(abs(sin(a * 6.0 + uTime * 0.5)), 12.0) + 0.7 * pow(abs(sin(a * 9.0 - uTime * 0.35 + 1.0)), 18.0);
  float fall = (1.0 - smoothstep(0.15, 1.0, r)) * smoothstep(0.05, 0.3, r);
  gl_FragColor = vec4(uColor * rays * fall * uIntensity * 0.5, 1.0);
  #include <colorspace_fragment>
}
`,
    }),
  );
}

const STRIP_VERTEX = /* glsl */ `
attribute float aAlong;
attribute float aV;
varying float vAlong;
varying float vV;
void main() {
  vAlong = aAlong;
  vV = aV;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/** Light spilling out of the opening, only where it's torn so far. */
export function createLeakMaterial(): ShaderMaterial {
  return additive(
    new ShaderMaterial({
      uniforms: {
        uTear: { value: 0 },
        uFromRight: { value: 0 },
        uColor: { value: new Color() },
        uIntensity: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: STRIP_VERTEX,
      fragmentShader: /* glsl */ `
uniform float uTear;
uniform float uFromRight;
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;
varying float vAlong;
varying float vV;
void main() {
  float s = uFromRight > 0.5 ? 1.0 - vAlong : vAlong;
  float open = 1.0 - smoothstep(uTear - 0.03, uTear + 0.01, s);
  float fade = (1.0 - clamp(vV, 0.0, 1.0)) * (1.0 - clamp(vV, 0.0, 1.0));
  float shimmer = 0.85 + 0.15 * sin(uTime * 9.0 + vAlong * 40.0);
  gl_FragColor = vec4(uColor * open * fade * uIntensity * shimmer * 1.6, 1.0);
  #include <colorspace_fragment>
}
`,
      side: DoubleSide,
    }),
  );
}

/** The tear-here line: marching dashes along the tear with a glint running across. */
export function createGuideMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color() },
      uIntensity: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: STRIP_VERTEX,
    fragmentShader: /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;
varying float vAlong;
varying float vV;
void main() {
  float dash = step(0.45, fract(vAlong * 30.0 - uTime * 1.2));
  float pulse = 0.55 + 0.45 * sin(uTime * 3.5);
  float glintOffset = (vAlong - fract(uTime * 0.45)) * 7.0;
  float glint = exp(-glintOffset * glintOffset);
  float across = 1.0 - abs(vV * 2.0 - 1.0);
  float alpha = (dash * 0.55 * pulse + glint * 0.9) * across * uIntensity;
  gl_FragColor = vec4(mix(vec3(1.0), uColor, 0.4), alpha);
  #include <colorspace_fragment>
}
`,
    transparent: true,
    depthWrite: false,
  });
}

/** The backdrop, drawn first across the whole canvas: a vertical gradient, a glow behind whatever's on show, a
 * vignette and the reveal flash. */
export function createBackgroundMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTop: { value: new Color() },
      uBottom: { value: new Color() },
      uGlowColor: { value: new Color() },
      uFlashColor: { value: new Color() },
      uGlow: { value: 0 },
      uFlash: { value: 0 },
      uVignette: { value: 0.5 },
      uAspect: { value: 1 },
      uCenter: { value: new Vector2(0.5, 0.5) },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,
    fragmentShader: /* glsl */ `
uniform vec3 uTop;
uniform vec3 uBottom;
uniform vec3 uGlowColor;
uniform vec3 uFlashColor;
uniform float uGlow;
uniform float uFlash;
uniform float uVignette;
uniform float uAspect;
uniform vec2 uCenter;
uniform float uTime;
varying vec2 vUv;
${COMMON_GLSL}
void main() {
  vec3 color = mix(uBottom, uTop, smoothstep(0.0, 1.0, vUv.y));
  vec2 p = (vUv - uCenter) * vec2(uAspect, 1.0);
  float r2 = dot(p, p);
  color += uGlowColor * uGlow * (exp(-r2 * 4.0) * 0.55 + exp(-r2 * 1.2) * 0.15);
  float v = length((vUv - 0.5) * vec2(uAspect, 1.0) * 1.1);
  color *= 1.0 - uVignette * smoothstep(0.35, 1.2, v);
  color += uFlashColor * uFlash * (0.6 + 0.4 * exp(-r2 * 2.0));
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
  gl_FragColor.rgb += (hash21(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;
}
`,
    depthTest: false,
    depthWrite: false,
  });
}

const POINT_FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float soft = 1.0 - smoothstep(0.0, 0.5, d);
  float core = 1.0 - smoothstep(0.0, 0.18, d);
  gl_FragColor = vec4((vColor * soft + vec3(core) * 0.7) * vAlpha, 1.0);
  #include <colorspace_fragment>
}
`;

/** Sparks and bursts: a point each, sized in world units. */
export function createParticlesMaterial(): ShaderMaterial {
  return additive(
    new ShaderMaterial({
      uniforms: { uScale: { value: 500 } },
      vertexShader: /* glsl */ `
attribute vec3 aColor;
attribute float aSize;
attribute float aAlpha;
uniform float uScale;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vColor = aColor;
  vAlpha = aAlpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = max(1.0, aSize * uScale / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`,
      fragmentShader: POINT_FRAGMENT,
    }),
  );
}

/** Dust drifting up through the light, animated entirely on the GPU. Positions are -0.5–0.5, spread by uSpan. */
export function createDustMaterial(): ShaderMaterial {
  return additive(
    new ShaderMaterial({
      uniforms: {
        uScale: { value: 500 },
        uSpan: { value: new Vector4(4, 6, 3, -1) },
        uTime: { value: 0 },
        uAmount: { value: 0.5 },
        uColor: { value: new Color(1, 1, 1) },
      },
      vertexShader: /* glsl */ `
attribute float aSeed;
uniform float uScale;
uniform vec4 uSpan;
uniform float uTime;
uniform float uAmount;
uniform vec3 uColor;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec3 p = position;
  p.y = fract(p.y + 0.5 + uTime * (0.012 + aSeed * 0.02)) - 0.5;
  p.x += sin(uTime * 0.3 + aSeed * 20.0) * 0.02;
  vec3 world = vec3(p.x * uSpan.x, p.y * uSpan.y, uSpan.w + p.z * uSpan.z);
  vec4 mv = modelViewMatrix * vec4(world, 1.0);
  gl_PointSize = max(1.0, (0.012 + aSeed * 0.02) * uScale / -mv.z);
  vColor = uColor;
  vAlpha = uAmount * (0.15 + 0.35 * (0.5 + 0.5 * sin(uTime * (0.8 + aSeed * 2.0) + aSeed * 40.0)));
  gl_Position = projectionMatrix * mv;
}
`,
      fragmentShader: POINT_FRAGMENT,
    }),
  );
}

/** A slab's clear acrylic case: nearly invisible face-on, bright at its edges and along a highlight that slides
 * as it tilts, a little frosted around the card. */
export function createGlassMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uSize: { value: new Vector2(1, 1) },
      uCard: { value: new Vector4(0, 0, 1, 1) },
      uOpacity: { value: 1 },
      uDim: { value: 0 },
    },
    vertexShader: SURFACE_VERTEX,
    fragmentShader: /* glsl */ `
uniform vec4 uCard;
uniform float uOpacity;
uniform float uDim;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying float vFace;
void main() {
  vec3 N = normalize(vWorldNormal);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorldPos);
  float facing = clamp(abs(dot(N, V)), 0.0, 1.0);
  float fresnel = pow(1.0 - facing, 2.5);
  vec2 lean = (V - N * dot(V, N)).xy;
  float streakOffset = vUv.x * 0.8 + vUv.y * 0.6 - 0.75 + lean.x * 2.0 - lean.y * 1.2;
  float streak = exp(-streakOffset * streakOffset * 50.0);
  float side = 1.0 - abs(vFace);
  float inCard = step(uCard.x, vUv.x) * step(vUv.x, uCard.z) * step(uCard.y, vUv.y) * step(vUv.y, uCard.w);
  float alpha = 0.05 + fresnel * 0.45 + streak * 0.28 + side * 0.35 + (1.0 - inCard) * 0.07 * abs(vFace);
  gl_FragColor = vec4(vec3(0.9, 0.94, 1.0) * (1.0 - uDim), clamp(alpha, 0.0, 1.0) * uOpacity);
  #include <colorspace_fragment>
}
`,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
}
