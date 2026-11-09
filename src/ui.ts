// UI panel bindings: reads DOM inputs into state, updates the readout spans,
// and fires onApply whenever any control changes.

import { MATH_MEMBERS } from './evaluator';
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
  // Label update lives in main.ts (setAutoRotate) so manual-drag stops stay in sync.
  const onAutoRotateClick = (): void => {
    state.autoRotate = !state.autoRotate;
    options.onAutoRotateToggle(state.autoRotate);
  };
  listeners.push([autoRotateBtn, 'click', onAutoRotateClick]);

  // Math reference popup: a floating panel anchored to the right of the function
  // input. Its items insert a template at the caret; "__" marks argument slots,
  // which are stripped and the caret is dropped into the last one so the user can
  // type the argument in place.
  const helpToggle = $('math-help-toggle');
  const helpPopup = $('math-help-popup');
  const fnInput = $('function-input') as HTMLInputElement;

  const TWO_ARG_FNS = new Set(['max', 'min', 'pow']);
  const fnGrid = $('math-help-fns');
  for (const name of MATH_MEMBERS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'help-item';
    btn.dataset.insert = `${name}(${TWO_ARG_FNS.has(name) ? '__ , __' : '__'})`;
    btn.textContent = name;
    fnGrid.appendChild(btn);
  }

  const insertTemplate = (template: string): void => {
    const parts = template.split('__');
    const text = parts.join('');
    // Caret lands where the last "__" slot was.
    const caretOffset = text.length - parts[parts.length - 1].length;
    const start = fnInput.selectionStart ?? fnInput.value.length;
    const end = fnInput.selectionEnd ?? fnInput.value.length;
    fnInput.value = `${fnInput.value.slice(0, start)}${text}${fnInput.value.slice(end)}`;
    const pos = start + caretOffset;
    fnInput.setSelectionRange(pos, pos);
    fnInput.focus();
    syncFromInputs();
  };

  const onHelpItemClick = (e: Event): void => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.help-item');
    if (!btn?.dataset.insert) return;
    insertTemplate(btn.dataset.insert);
  };
  listeners.push([helpPopup, 'click', onHelpItemClick]);

  const positionPopup = (): void => {
    const anchor = fnInput.getBoundingClientRect();
    const popup = helpPopup.getBoundingClientRect(); // forces layout now that it's visible
    let left = anchor.right + 12;
    if (left + popup.width > window.innerWidth - 8) {
      left = Math.max(8, anchor.left - popup.width - 12); // no room on the right: flip left
    }
    const top = Math.min(anchor.top, window.innerHeight - popup.height - 8);
    helpPopup.style.left = `${left}px`;
    helpPopup.style.top = `${top}px`;
  };

  const setHelpVisible = (visible: boolean): void => {
    helpPopup.hidden = !visible;
    if (visible) positionPopup();
  };

  const onHelpToggleClick = (): void => {
    setHelpVisible(Boolean(helpPopup.hidden)); // toggle
  };
  listeners.push([helpToggle, 'click', onHelpToggleClick]);

  const onDocMouseDown = (e: Event): void => {
    const target = (e as MouseEvent).target as HTMLElement;
    if (!target.closest('#math-help-popup') && !target.closest('#math-help-toggle')) {
      setHelpVisible(false);
    }
  };
  listeners.push([document, 'mousedown', onDocMouseDown]);

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
