# AGENTS.md — 3D Function Visualizer

A small browser-based 3D function visualizer: plots `z = f(x, y)` as a colored
surface using Three.js. Built with Vite + TypeScript (no backend).

## Commands

| Task | Command |
| --- | --- |
| Dev server (port 3000) | `npm run dev` |
| Production build (`dist/`) | `npm run build` |
| Typecheck only | `npm run typecheck` |

After any change to `src/`, run `npm run typecheck` before considering it done.
A full `npm run build` is expected for larger changes.

## Project structure

```
function-visualizer/
├── index.html              # Entry page: canvas container + UI panel markup (no inline JS/CSS)
├── vite.config.js          # Vite config (port 3000, "@" -> /src alias)
├── tsconfig.json           # Strict TS config; typecheck-only (Vite handles transpilation)
├── package.json
│
└── src/
    ├── main.ts             # Entry point: wires everything together, animation loop, teardown
    ├── state.ts            # AppState interface + defaultState (single source of user settings)
    ├── evaluator.ts        # Compiles the f(x,y) expression once per edit; NaN on error
    ├── scene.ts            # Scene/camera/renderer setup, lights, grid/axes, resetView()
    ├── surface.ts          # Builds the surface mesh + wireframe overlay from state; disposal
    ├── camera-controls.ts  # Orbit camera: drag rotate, wheel/+/- zoom, R reset,
                            # auto-rotate; exposes update()/reset() for the frame loop
    ├── ui.ts               # UI panel bindings: DOM inputs -> state -> onApply callback
    ├── style.css           # All styles (imported by main.ts)
    └── vite-env.d.ts       # Vite client type references (CSS imports etc.)
```

### Data flow

```
DOM inputs → ui.ts (syncs into AppState) → main.ts applyState()
          → surface.ts buildSurface(state)  → scene.add(group)
scene/camera/renderer (scene.ts) ← camera-controls.ts (orbit: drag/wheel/auto-rotate)
evaluator.ts: expression string → cached fn(x, y), NaN on invalid values
```

## Conventions

- **TypeScript strict mode is on.** No `any`, no unchecked casts unless a type
  genuinely can't be expressed; prefer narrowing or the `$()` helper pattern.
- **One module per concern** (see structure above). Keep files focused; if a file
  grows past ~200 lines, consider splitting it. Don't re-create one giant
  `main.ts`.
- **State lives in `AppState`** (`state.ts`). UI code mutates state and triggers
  re-application via callbacks — never let the surface builder read the DOM
  directly.
- **Three.js comes from npm** (`import * as THREE from 'three'`), never from a CDN.
- **Dispose GPU resources**: any module that creates geometry/materials must
  expose disposal (see `disposeSurface`) and `main.ts` must call it on teardown.
- **Expressions are user input.** Keep evaluation isolated in `evaluator.ts`.
  Math functions (`sin`, `sqrt`, …) and constants (`PI`) resolve bare — there is
  no global `Math.sin`-style fallback; return NaN for bad values instead of
  throwing, and never log per-sample errors.
- **Naming**: camelCase functions/variables, PascalCase types/interfaces,
  kebab-case file names.
- **UI ids** (`function-input`, `domain-x-min`, …) are a contract between
  `index.html` and `ui.ts` — update both together when renaming.
- **CSS lives in `src/style.css`**, imported from `main.ts`. No inline styles or
  `<style>` blocks in `index.html`.
- `.idea/` and `*.iml` are IDE metadata, not project code — leave them alone.


## Other

- When adding a feature or new file, do note it down in AGENTS.md.
- Try to keep code edits small - the edit tool is atomic, so in the case of a huge edit failing, you have to re-do the whole edit.
