# @jmonzone/design

Shared UI components for my apps (fungal-web, pack-opener): `Button`, and the card pack opener.

> **This repo is public.** Only generic UI goes here: no game content, internal URLs, keys or unreleased art.

## Use

```jsonc
// package.json — pin a tag; deploys install exactly this
"@jmonzone/design": "github:jmonzone/design#v0.1.0"
```

```tsx
import "@jmonzone/design/styles.css"; // once, in the app's entry, before the app's own CSS
import { Button } from "@jmonzone/design";

<Button variant="confirm" onClick={save}>Save</Button> // Enter presses it; it shows an ENTER badge
```

`Button` takes every `<button>` prop plus:

| Prop | Values | |
|---|---|---|
| `variant` | `default` `primary` `secondary` `selected` `confirm` `deny` `warning` | |
| `size` | `sm` `lg` | `sm` for `default`, `lg` for the rest, unless set |
| `subdued` | boolean | a quieter look |
| `hotkey` | `{ key, label }` or `null` | the key that presses it, while it has an `onClick` and isn't disabled; Enter for `confirm`, Escape for `deny`, unless set |
| `hotkeyEnabled` | boolean | `false` keeps the badge but stops the key pressing it |
| `hint` | ReactNode | the badge after the label: the hotkey's (none while `subdued`), unless set |

Touch screens never show the badge. Hotkeys go through `KeyHandlerManager`, one stack per key where only the latest binding gets the key, so a modal's Enter beats the screen's under it. An app binds its own keys with `useKeyHandler` (or `KeyHandlerManager.push`) so they share that stack.

An `lg` button is at most 200px wide, the standard width. The rest of layout (`width`, `flex`) is the app's: pass `style` or `className`.

## Pack opener

A three.js trading card pack opening, with a React binding. Each is its own entry, so an app that only uses `Button` never loads three:

```tsx
import { presetStyle, type PackContents } from "@jmonzone/design/pack-opener";
import { PackOpenerView } from "@jmonzone/design/pack-opener/react";
```

An app using it also installs `three` (≥ 0.161). See [src/pack-opener/README.md](src/pack-opener/README.md). Its showcase site is pack-opener ("Sealed").

## Test

```sh
npm test   # the pack opener's tests
```

## Develop against a local checkout

Each app has `npm run dev:design`, which sets `DESIGN_LOCAL=1`. The app then builds `../design/src` instead of the pinned tag, so edits here show up live. The dev server prints a warning while it does. Without the flag, an app always runs the version it pins, the same as its deploy.

## Release

```sh
npm version patch   # or minor
```

That checks it typechecks, passes its tests and builds, then bumps the version, commits, tags `vX.Y.Z` and pushes. Then in each app, bump the dependency to `#vX.Y.Z`, run `npm install`, commit and push.

`dist/` isn't in git. When an app installs this repo from GitHub, npm runs its `prepare` script, which builds it.

## License

MIT, except the Londrina Solid font in `fonts/`, which is under the SIL Open Font License 1.1 (`fonts/OFL.txt`).
