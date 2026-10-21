# Pack opener (`@jmonzone/design/pack-opener`)

A mobile-first trading card pack opening for the web, rendered with three.js. You swipe the top off a foil pack.
Light leaks out in the color of the best card inside. Cards rise out, then turn over one by one, each with its
rarity's build-up, flip, burst, glow and haptic. Swipe them away, then inspect the whole pull.

Every part of the look and feel is a lever on one plain-data `RipStyle`. A panel can tune it, a preset can set it,
and a share link can carry it.

## Install

```jsonc
// package.json
"@jmonzone/design": "github:jmonzone/design#v0.2.0",
"three": "~0.161.0"
```

It's its own entry of `@jmonzone/design`, so only an app that imports it needs `three` (≥ 0.161), an optional peer dependency.

## Quick start

```tsx
import { useState } from "react";
import { hapticOf, presetStyle, type PackContents, type PackOpener, type RipEvent } from "@jmonzone/design/pack-opener";
import { PackOpenerView, useRipSnapshot } from "@jmonzone/design/pack-opener/react";

const playSounds = (event: RipEvent) => {
  /* play a sound per event.type; hapticOf(event) gives its vibration */
};

const pack: PackContents = {
  id: "pack-1",
  name: "Fungal Folk",
  cards: [
    { id: "a", name: "Bog Hopper", rarityId: "common", imageUrl: "/cards/frog.png", value: 0.25 },
    { id: "b", name: "Bloomlight", rarityId: "legendary", imageUrl: "/cards/jellyfish.png", value: 185 },
  ],
};

export function Rip() {
  const [opener, setOpener] = useState<PackOpener | null>(null);
  const snapshot = useRipSnapshot(opener); // phase, current card, summary complete...
  return <PackOpenerView pack={pack} ripStyle={presetStyle("holo-chase")} onOpener={setOpener} onEvent={playSounds} />;
}
```

Without React, use the engine directly:

```ts
const opener = new PackOpener({ container: element, pack, ripStyle, onEvent });
opener.subscribe(() => render(opener.getSnapshot()));
```

## How it fits together

| Layer | What it is |
| --- | --- |
| `content/` | `PackCard`, `PackContents` and `drawPack` (weighted slots, seedable). Plain data from the host. |
| `style/` | `RipStyle`, its defaults, the lever schema (`leverGroupsOf`), presets, `sanitizeStyle`, and `encodeStyle`/`decodeStyle` for share links. |
| `defs/` | The variants choices pick from (easings, holo patterns, prints, layouts, holders, haptics), one registry each. |
| `timeline/` | The rip as a **record** of timestamps, plus pure functions from (record, time) to phase, events and snapshot. |
| `pose/` | Pure functions from (record, time) to where the pack, every card and every particle is. |
| `render/` | The three.js side: shaders, geometry, canvas-drawn textures and the views that apply a pose. |
| `engine/` | `PackOpener`: the clock, gestures and render loop, and the public API. |
| `react/` | `PackOpenerView` and `useRipSnapshot`. |

Each frame is a pure function of the record and the clock. Input only appends timestamps to the record. That's what
lets one opener:

- play live (`mode: "interactive"`),
- play itself for previews (`"autoplay"`, deterministic and scrubbable with `seek(t)`),
- replay the last live rip exactly (`replay()`),
- run in slow motion for tuning (`timeScale`).

## Following a rip

- **Events** (`onEvent`): `tear-progress`, `open`, `card-anticipate`, `card-reveal` (with the card and its rarity),
  `summary`, and more. Use them for sound, and for haptics via `hapticOf(event)`. It returns vibration blocks that
  [bzzz](https://www.npmjs.com/package/bzzz) plays as they are.
- **Snapshot** (`subscribe`/`getSnapshot`, or `useRipSnapshot`): `phase`, `cardIndex`, `cardRevealed` and
  `complete`, for your own DOM prompts and buttons. It changes between beats, never every frame.
- **Frames** (`onFrame`): the clock every frame, for a scrub bar.

## Steering it

`tear()`, `advance(direction?)`, `skip()`, `focus(i)`/`unfocus()`, `restart()`, `replay()`, `seek(t)`,
`setStyle`, `setPack`, `setMode`, `setPaused`, `setTimeScale`, `setInsets` (frames the rip in the space your UI
leaves), `setBackdropOnly` (hides the pack and cards, leaving the backdrop behind a menu), `enableDeviceTilt()` (call it
from a tap; iOS asks permission).

## Building a tuning panel

`leverGroupsOf(style)` lists every lever with its path, label, kind (number, color, toggle, choice, text), range
and hint. Draw a control per lever, read with `getAtPath(style, lever.path)` and write with
`setAtPath(style, lever.path, value)`. Any panel built this way, a polished one for customers or a dev tool built
from a game's own form fields, gets new levers for free.

## Your own card faces

Pass `renderFace(ctx, { card, rarity, style, width, height, image })` to draw faces in your own design onto the
card's canvas. `drawDefaultCardFace` is the built-in one, so you can wrap it.
