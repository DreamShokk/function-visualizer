// UI panel bindings: reads DOM inputs into state, updates the readout spans,
// and fires onApply whenever any control changes.

import type { AppState, ColorMode } from './state';

export interface UIBindings {
  dispose(): void;
}

interface UIOptions {
  /** Called after every successful state update (e.g. to rebuild the surface). */
  onApply: () => void;
  /** Called when Auto Rotate is toggled. */
  onAutoRotateToggle: (enabled: boolean) => void;
  /** Called when Reset View is clicked. */
  onResetView: () => void;
}

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing UI element: #${id}`);
  return el;
}

export function bindUI(state: AppState, options: UIOptions): UIBindings {
  const listeners: Array<[EventTarget, string, EventListener]> = [];

  const syncFromInputs = (): void => {
    state.functionExpr = ($('function-input') as HTMLInputElement).value;
    state.xMin = parseFloat(($('domain-x-min') as HTMLInputElement).value);
    state.xMax = parseFloat(($('domain-x-max') as HTMLInputElement).value);
    state.yMin = parseFloat(($('domain-y-min') as HTMLInputElement).value);
    state.yMax = parseFloat(($('domain-y-max') as HTMLInputElement).value);
    state.resolution = parseInt(($('resolution') as HTMLInputElement).value, 10);
    state.colorMode = ($('color-mode') as HTMLSelectElement).value as ColorMode;
    state.opacity = parseFloat(($('opacity') as HTMLInputElement).value);

    $('x-min-val').textContent = String(state.xMin);
    $('x-max-val').textContent = String(state.xMax);
    $('y-min-val').textContent = String(state.yMin);
    $('y-max-val').textContent = String(state.yMax);
    $('res-val').textContent = String(state.resolution);
    $('op-val').textContent = state.opacity.toFixed(2);

    const infoPanel = $('info-panel');
    infoPanel.textContent = `Function: ${state.functionExpr}`;

    options.onApply();
  };

  // Slider / text controls re-apply on every keystroke.
  for (const id of [
    'function-input',
    'domain-x-min',
    'domain-x-max',
    'domain-y-min',
    'domain-y-max',
    'resolution',
    'opacity',
  ]) {
    listeners.push([$(id), 'input', syncFromInputs]);
  }
  // The color-mode select only reacts to a committed change.
  listeners.push([$('color-mode'), 'change', syncFromInputs]);

  const autoRotateBtn = $('auto-rotate');
  const onAutoRotateClick = (e: Event) => {
    state.autoRotate = !state.autoRotate;
    (e.currentTarget as HTMLButtonElement).textContent = state.autoRotate
      ? '⏸ Auto Rotate'
      : '▶ Auto Rotate';
    options.onAutoRotateToggle(state.autoRotate);
  };
  listeners.push([autoRotateBtn, 'click', onAutoRotateClick]);

  listeners.push([$('reset-view'), 'click', options.onResetView as EventListener]);

  for (const [target, type, listener] of listeners) {
    target.addEventListener(type, listener);
  }

  return {
    dispose() {
      for (const [target, type, listener] of listeners) {
        target.removeEventListener(type, listener);
      }
    },
  };
}
