import { colorLever, numberLever, type LeverGroupDef } from "./types";

export const SCENE_LEVERS: LeverGroupDef = {
  id: "scene",
  label: "Scene",
  description: "The backdrop and the camera.",
  levers: [
    colorLever("scene.bgTop", "Backdrop top"),
    colorLever("scene.bgBottom", "Backdrop bottom"),
    numberLever("scene.vignette", "Vignette", 0, 1, 0.01),
    numberLever("scene.ambientGlow", "Backdrop glow", 0, 1, 0.01, {
      hint: "The backdrop lights up in the color of the card on show.",
    }),
    numberLever("scene.dust", "Dust", 0, 1, 0.01),
    numberLever("scene.fov", "Perspective", 15, 75, 1, { unit: "°", hint: "The camera's field of view." }),
  ],
};
