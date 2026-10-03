// Builds the floating control panel from a parameter spec list. Pure DOM, no
// framework. The engine owns state; this module only renders widgets and
// reports user intent through callbacks.

import type { ParamSpec, ParamValue, ParamValues } from './types';
import { PALETTE_NAMES, getPalette, makeGradientCss } from './palettes';
import { ICON_RANDOM, ICON_SHARE, ICON_PNG, ICON_REC } from './pixel';

export interface PanelHandlers {
  onChange: (key: string, value: ParamValue) => void;
  onRandom: () => void;
  onExportPng: () => void;
  onToggleRecord: () => void;
  onShare: () => void;
}

export interface ControlPanel {
  element: HTMLElement;
  sync: (values: ParamValues) => void;
  setRecording: (on: boolean) => void;
  toast: (msg: string) => void;
}

export function createControlPanel(
  specs: ParamSpec[],
  handlers: PanelHandlers,
  opts: { canRecord: boolean },
): ControlPanel {
  const syncers: Array<(v: ParamValues) => void> = [];

  const panel = el('aside', 'panel');

  // --- header / collapse ---
  const header = el('div', 'panel-head');
  const title = el('span', 'panel-title');
  title.textContent = 'Parameters';
  const collapse = button('panel-collapse', '⟨');
  collapse.title = 'Hide controls (H)';
  header.append(title, collapse);
  panel.append(header);

  const body = el('div', 'panel-body');
  panel.append(body);

  collapse.addEventListener('click', () => {
    panel.classList.toggle('collapsed');
    collapse.textContent = panel.classList.contains('collapsed') ? '⟩' : '⟨';
  });

  // --- parameter widgets ---
  for (const spec of specs) {
    const { row, sync } = makeWidget(spec, handlers.onChange);
    body.append(row);
    syncers.push(sync);
  }

  // --- action buttons ---
  const actions = el('div', 'panel-actions');
  const randomBtn = iconButton('btn btn-accent', ICON_RANDOM, 'Random');
  randomBtn.addEventListener('click', handlers.onRandom);
  const shareBtn = iconButton('btn', ICON_SHARE, 'Share');
  shareBtn.addEventListener('click', handlers.onShare);
  const pngBtn = iconButton('btn', ICON_PNG, 'PNG');
  pngBtn.addEventListener('click', handlers.onExportPng);
  actions.append(randomBtn, shareBtn, pngBtn);

  let recBtn: HTMLButtonElement | null = null;
  let recLabel: HTMLSpanElement | null = null;
  if (opts.canRecord) {
    recBtn = iconButton('btn', ICON_REC, 'Record');
    recLabel = recBtn.querySelector('span');
    recBtn.addEventListener('click', handlers.onToggleRecord);
    actions.append(recBtn);
  }
  panel.append(actions);

  // --- toast ---
  const toastEl = el('div', 'panel-toast');
  panel.append(toastEl);
  let toastTimer = 0;

  return {
    element: panel,
    sync(values) {
      for (const s of syncers) s(values);
    },
    setRecording(on) {
      if (!recBtn) return;
      if (recLabel) recLabel.textContent = on ? 'Stop' : 'Record';
      recBtn.classList.toggle('recording', on);
    },
    toast(msg) {
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toastEl.classList.remove('show'), 1800);
    },
  };
}

function makeWidget(
  spec: ParamSpec,
  onChange: (key: string, value: ParamValue) => void,
): { row: HTMLElement; sync: (v: ParamValues) => void } {
  const row = el('div', 'control');
  const label = el('label', 'control-label');
  label.textContent = spec.label;

  switch (spec.type) {
    case 'range': {
      const valEl = el('span', 'control-value');
      const fmt = spec.format ?? ((v: number) => trim(v));
      const input = document.createElement('input');
      input.type = 'range';
      input.min = String(spec.min);
      input.max = String(spec.max);
      input.step = String(spec.step);
      input.value = String(spec.default);
      valEl.textContent = fmt(spec.default);
      input.addEventListener('input', () => {
        const v = parseFloat(input.value);
        valEl.textContent = fmt(v);
        onChange(spec.key, v);
      });
      const head = el('div', 'control-head');
      head.append(label, valEl);
      row.append(head, input);
      return {
        row,
        sync: (v) => {
          if (typeof v[spec.key] === 'number') {
            input.value = String(v[spec.key]);
            valEl.textContent = fmt(v[spec.key] as number);
          }
        },
      };
    }

    case 'select': {
      const sel = document.createElement('select');
      for (const o of spec.options) {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.label;
        sel.append(opt);
      }
      sel.value = spec.default;
      sel.addEventListener('change', () => onChange(spec.key, sel.value));
      row.append(label, sel);
      return {
        row,
        sync: (v) => {
          if (v[spec.key] !== undefined) sel.value = String(v[spec.key]);
        },
      };
    }

    case 'toggle': {
      const wrap = el('label', 'control-toggle');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = spec.default;
      const slider = el('span', 'toggle-track');
      input.addEventListener('change', () => onChange(spec.key, input.checked));
      const txt = el('span', 'control-label');
      txt.textContent = spec.label;
      wrap.append(input, slider, txt);
      row.classList.add('control-inline');
      row.append(wrap);
      return {
        row,
        sync: (v) => {
          if (typeof v[spec.key] === 'boolean') input.checked = v[spec.key] as boolean;
        },
      };
    }

    case 'palette': {
      const swatches = el('div', 'palette-grid');
      const buttons: Record<string, HTMLButtonElement> = {};
      for (const name of PALETTE_NAMES) {
        const sw = button('swatch', '');
        sw.style.background = makeGradientCss(name);
        sw.title = getPalette(name).label;
        sw.addEventListener('click', () => {
          onChange(spec.key, name);
          select(name);
        });
        buttons[name] = sw;
        swatches.append(sw);
      }
      const select = (name: string) => {
        for (const [n, b] of Object.entries(buttons)) b.classList.toggle('active', n === name);
      };
      select(spec.default);
      row.append(label, swatches);
      return {
        row,
        sync: (v) => {
          if (v[spec.key] !== undefined) select(String(v[spec.key]));
        },
      };
    }

    case 'text': {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'control-text';
      input.value = spec.default;
      if (spec.placeholder) input.placeholder = spec.placeholder;
      const commit = () => onChange(spec.key, input.value);
      input.addEventListener('change', commit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') commit();
      });
      row.append(label, input);
      return {
        row,
        sync: (v) => {
          if (v[spec.key] !== undefined && document.activeElement !== input) input.value = String(v[spec.key]);
        },
      };
    }
  }
}

function trim(v: number): string {
  return String(Math.round(v * 1000) / 1000);
}

function el(tag: string, cls: string): HTMLElement {
  const e = document.createElement(tag);
  e.className = cls;
  return e;
}

function button(cls: string, text: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = cls;
  b.type = 'button';
  b.textContent = text;
  return b;
}

function iconButton(cls: string, iconSvg: string, label: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = cls;
  b.type = 'button';
  b.innerHTML = `${iconSvg}<span>${label}</span>`;
  return b;
}
