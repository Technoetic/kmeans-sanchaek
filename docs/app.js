// src/prng.js
function createRng(seed = 2654435769) {
  let s = seed | 0;
  if (s === 0) s = 2654435769;
  return function next() {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}
function rngRange(rng, lo, hi) {
  return lo + rng() * (hi - lo);
}
function rngInt(rng, n) {
  return Math.floor(rng() * n);
}

// src/datasets.js
function gauss(rng, mx, my, sx, sy) {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
  return [mx + sx * z0, my + sy * z1];
}
function clip01(v) {
  return v < 0.02 ? 0.02 : v > 0.98 ? 0.98 : v;
}
function blobs(n = 180, seed = 1) {
  const rng = createRng(seed);
  const centers = [
    [0.25, 0.3],
    [0.7, 0.25],
    [0.5, 0.75]
  ];
  const sigma = 0.06;
  const pts = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const c = centers[i % centers.length];
    const [x, y] = gauss(rng, c[0], c[1], sigma, sigma);
    pts[2 * i] = clip01(x);
    pts[2 * i + 1] = clip01(y);
  }
  return pts;
}
function moons(n = 200, seed = 2) {
  const rng = createRng(seed);
  const pts = new Float32Array(n * 2);
  const noise = 0.025;
  const half = n >> 1;
  for (let i = 0; i < n; i++) {
    const upper = i < half;
    const t = rng() * Math.PI;
    const cx = upper ? 0.4 : 0.6;
    const cy = upper ? 0.45 : 0.55;
    const r = 0.22;
    let x = cx + Math.cos(t) * r * (upper ? -1 : 1);
    let y = cy + Math.sin(t) * r * (upper ? -1 : 1);
    x += rngRange(rng, -noise, noise);
    y += rngRange(rng, -noise, noise);
    pts[2 * i] = clip01(x);
    pts[2 * i + 1] = clip01(y);
  }
  return pts;
}
function smiley(n = 240, seed = 3) {
  const rng = createRng(seed);
  const pts = [];
  const face = Math.floor(n * 0.55);
  const eyes = Math.floor(n * 0.2);
  const mouth = n - face - eyes;
  for (let i = 0; i < face; i++) {
    const t = rng() * 2 * Math.PI;
    const r = 0.34 + (rng() - 0.5) * 0.03;
    pts.push(clip01(0.5 + Math.cos(t) * r));
    pts.push(clip01(0.5 + Math.sin(t) * r));
  }
  const eyeCenters = [
    [0.38, 0.62],
    [0.62, 0.62]
  ];
  for (let i = 0; i < eyes; i++) {
    const c = eyeCenters[i % 2];
    const [x, y] = gauss(rng, c[0], c[1], 0.025, 0.025);
    pts.push(clip01(x));
    pts.push(clip01(y));
  }
  for (let i = 0; i < mouth; i++) {
    const t = Math.PI + rng() * Math.PI;
    const r = 0.18 + (rng() - 0.5) * 0.015;
    pts.push(clip01(0.5 + Math.cos(t) * r));
    pts.push(clip01(0.5 + Math.sin(t) * r * 0.6));
  }
  return Float32Array.from(pts);
}
var DATASETS = {
  blobs: { label: "\uAC00\uC6B0\uC2DC\uC548 \uAD70\uC9D1 (\uC798 \uB418\uB294 \uACBD\uC6B0)", make: blobs, suggestedK: 3 },
  moons: { label: "\uB450 \uCD08\uC2B9\uB2EC (\uAE4C\uB2E4\uB85C\uC6B4 \uACBD\uC6B0)", make: moons, suggestedK: 2 },
  smiley: { label: "\uC2A4\uB9C8\uC77C (k-\uD3C9\uADE0\uC774 \uC2E4\uD328\uD558\uB294 \uACBD\uC6B0)", make: smiley, suggestedK: 4 }
};

// src/kmeans.js
function assignClusters(points, centroids) {
  const n = points.length >> 1;
  const k = centroids.length >> 1;
  const labels = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    const px = points[2 * i];
    const py = points[2 * i + 1];
    let bestJ = 0;
    let bestD = Number.POSITIVE_INFINITY;
    for (let j = 0; j < k; j++) {
      const dx = px - centroids[2 * j];
      const dy = py - centroids[2 * j + 1];
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        bestJ = j;
      }
    }
    labels[i] = bestJ;
  }
  return labels;
}
function updateCentroids(points, labels, k, prevCentroids) {
  const n = points.length >> 1;
  const sums = new Float64Array(k * 2);
  const counts = new Int32Array(k);
  for (let i = 0; i < n; i++) {
    const j = labels[i];
    sums[2 * j] += points[2 * i];
    sums[2 * j + 1] += points[2 * i + 1];
    counts[j]++;
  }
  const next = new Float32Array(k * 2);
  for (let j = 0; j < k; j++) {
    if (counts[j] > 0) {
      next[2 * j] = sums[2 * j] / counts[j];
      next[2 * j + 1] = sums[2 * j + 1] / counts[j];
    } else if (prevCentroids) {
      let worstI = 0;
      let worstD = -1;
      for (let i = 0; i < n; i++) {
        const lj = labels[i];
        const dx = points[2 * i] - prevCentroids[2 * lj];
        const dy = points[2 * i + 1] - prevCentroids[2 * lj + 1];
        const d = dx * dx + dy * dy;
        if (d > worstD) {
          worstD = d;
          worstI = i;
        }
      }
      next[2 * j] = points[2 * worstI];
      next[2 * j + 1] = points[2 * worstI + 1];
    }
  }
  return next;
}
function computeSSE(points, labels, centroids) {
  const n = points.length >> 1;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const j = labels[i];
    const dx = points[2 * i] - centroids[2 * j];
    const dy = points[2 * i + 1] - centroids[2 * j + 1];
    s += dx * dx + dy * dy;
  }
  return s;
}
function initCentroids(points, k, mode = "random", seed = 42, manual = null) {
  if (mode === "manual" && manual) {
    return Float32Array.from(manual);
  }
  const rng = createRng(seed);
  const n = points.length >> 1;
  if (n === 0 || k <= 0) return new Float32Array(0);
  const out = new Float32Array(k * 2);
  const usedIdx = /* @__PURE__ */ new Set();
  const firstIdx = rngInt(rng, n);
  usedIdx.add(firstIdx);
  out[0] = points[2 * firstIdx];
  out[1] = points[2 * firstIdx + 1];
  for (let j = 1; j < k; j++) {
    if (mode === "random") {
      let idx;
      let tries = 0;
      do {
        idx = rngInt(rng, n);
        tries++;
      } while (usedIdx.has(idx) && tries < 50);
      usedIdx.add(idx);
      out[2 * j] = points[2 * idx];
      out[2 * j + 1] = points[2 * idx + 1];
    } else {
      let bestIdx = 0;
      let bestD = -1;
      for (let i = 0; i < n; i++) {
        let nearest = Number.POSITIVE_INFINITY;
        for (let q = 0; q < j; q++) {
          const dx = points[2 * i] - out[2 * q];
          const dy = points[2 * i + 1] - out[2 * q + 1];
          const d = dx * dx + dy * dy;
          if (d < nearest) nearest = d;
        }
        if (nearest > bestD) {
          bestD = nearest;
          bestIdx = i;
        }
      }
      out[2 * j] = points[2 * bestIdx];
      out[2 * j + 1] = points[2 * bestIdx + 1];
    }
  }
  return out;
}
function isConverged(prev, next, eps = 1e-4) {
  if (!prev || prev.length !== next.length) return false;
  let m = 0;
  for (let i = 0; i < prev.length; i++) {
    const d = Math.abs(prev[i] - next[i]);
    if (d > m) m = d;
  }
  return m < eps;
}

// src/controller.js
var PHASE = {
  IDLE: "idle",
  ASSIGNED: "assigned",
  UPDATED: "updated",
  CONVERGED: "converged"
};
function createController() {
  const state = {
    datasetKey: "blobs",
    points: null,
    k: 3,
    initMode: "random",
    manualCentroids: null,
    // for 'manual' mode
    centroids: null,
    prevCentroids: null,
    labels: null,
    iter: 0,
    sse: Number.POSITIVE_INFINITY,
    phase: PHASE.IDLE,
    history: [],
    // { iter, sse, phase }
    seed: 42
  };
  function regenerateData() {
    const def = DATASETS[state.datasetKey];
    state.points = def.make(void 0, state.seed);
    state.manualCentroids = null;
    resetRun();
  }
  function resetRun() {
    if (state.initMode === "manual" && state.manualCentroids) {
      state.centroids = initCentroids(
        state.points,
        state.k,
        "manual",
        state.seed,
        state.manualCentroids
      );
    } else {
      state.centroids = initCentroids(state.points, state.k, state.initMode, state.seed);
    }
    state.prevCentroids = null;
    state.labels = assignClusters(state.points, state.centroids);
    state.sse = computeSSE(state.points, state.labels, state.centroids);
    state.iter = 0;
    state.phase = PHASE.IDLE;
    state.history = [{ iter: 0, sse: state.sse, phase: "init" }];
  }
  function setDataset(key) {
    if (!(key in DATASETS)) return;
    state.datasetKey = key;
    state.k = DATASETS[key].suggestedK;
    regenerateData();
  }
  function setK(k) {
    state.k = Math.max(1, Math.min(6, k | 0));
    resetRun();
  }
  function setInitMode(mode) {
    state.initMode = mode;
    if (mode !== "manual") state.manualCentroids = null;
    resetRun();
  }
  function setManualCentroid(idx, x, y) {
    if (!state.manualCentroids) state.manualCentroids = new Array(state.k * 2).fill(0.5);
    state.manualCentroids[2 * idx] = x;
    state.manualCentroids[2 * idx + 1] = y;
    state.initMode = "manual";
    resetRun();
  }
  function setSeed(seed) {
    state.seed = seed | 0;
    regenerateData();
  }
  function stepAssign() {
    if (state.phase === PHASE.CONVERGED) return;
    state.labels = assignClusters(state.points, state.centroids);
    state.sse = computeSSE(state.points, state.labels, state.centroids);
    state.phase = PHASE.ASSIGNED;
    state.history.push({ iter: state.iter, sse: state.sse, phase: "assign" });
  }
  function stepUpdate() {
    if (state.phase === PHASE.CONVERGED) return;
    state.prevCentroids = state.centroids;
    state.centroids = updateCentroids(state.points, state.labels, state.k, state.prevCentroids);
    state.sse = computeSSE(state.points, state.labels, state.centroids);
    state.iter += 1;
    if (isConverged(state.prevCentroids, state.centroids)) {
      state.phase = PHASE.CONVERGED;
    } else {
      state.phase = PHASE.UPDATED;
    }
    state.history.push({ iter: state.iter, sse: state.sse, phase: "update" });
  }
  function stepOnce() {
    stepAssign();
    stepUpdate();
  }
  function runToEnd(maxIter = 50) {
    for (let i = 0; i < maxIter; i++) {
      stepOnce();
      if (state.phase === PHASE.CONVERGED) break;
    }
    if (state.phase !== PHASE.CONVERGED) state.phase = PHASE.CONVERGED;
  }
  function snapshot() {
    return state;
  }
  regenerateData();
  return {
    snapshot,
    setDataset,
    setK,
    setInitMode,
    setSeed,
    setManualCentroid,
    resetRun,
    stepAssign,
    stepUpdate,
    stepOnce,
    runToEnd
  };
}

// src/render.js
var PALETTE = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b"];
function nearestCentroid(x, y, centroids) {
  const k = centroids.length >> 1;
  let bj = 0;
  let bd = Number.POSITIVE_INFINITY;
  for (let j = 0; j < k; j++) {
    const dx = x - centroids[2 * j];
    const dy = y - centroids[2 * j + 1];
    const d = dx * dx + dy * dy;
    if (d < bd) {
      bd = d;
      bj = j;
    }
  }
  return bj;
}
function drawScene(canvas, state, opts = {}) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
    canvas.width = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  const W = cssW;
  const H = cssH;
  if (opts.showVoronoi !== false && state.centroids) {
    const GX = 56;
    const GY = 40;
    const cellW = W / GX;
    const cellH = H / GY;
    ctx.globalAlpha = 0.1;
    for (let gy = 0; gy < GY; gy++) {
      for (let gx = 0; gx < GX; gx++) {
        const nx = (gx + 0.5) / GX;
        const ny = (gy + 0.5) / GY;
        const j = nearestCentroid(nx, ny, state.centroids);
        ctx.fillStyle = PALETTE[j % PALETTE.length];
        ctx.fillRect(gx * cellW, gy * cellH, cellW + 0.5, cellH + 0.5);
      }
    }
    ctx.globalAlpha = 1;
  }
  if (state.prevCentroids) {
    ctx.globalAlpha = 0.35;
    for (let j = 0; j < state.prevCentroids.length >> 1; j++) {
      ctx.fillStyle = PALETTE[j % PALETTE.length];
      ctx.beginPath();
      ctx.arc(
        state.prevCentroids[2 * j] * W,
        state.prevCentroids[2 * j + 1] * H,
        5,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
    ctx.strokeStyle = "#1A1A1A";
    ctx.lineWidth = 1;
    for (let j = 0; j < state.prevCentroids.length >> 1; j++) {
      ctx.beginPath();
      ctx.moveTo(state.prevCentroids[2 * j] * W, state.prevCentroids[2 * j + 1] * H);
      ctx.lineTo(state.centroids[2 * j] * W, state.centroids[2 * j + 1] * H);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  if (state.points && state.labels) {
    const n = state.points.length >> 1;
    for (let i = 0; i < n; i++) {
      const j = state.labels[i];
      ctx.fillStyle = PALETTE[j % PALETTE.length];
      ctx.beginPath();
      ctx.arc(state.points[2 * i] * W, state.points[2 * i + 1] * H, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  if (state.centroids) {
    const k = state.centroids.length >> 1;
    for (let j = 0; j < k; j++) {
      const cx = state.centroids[2 * j] * W;
      const cy = state.centroids[2 * j + 1] * H;
      ctx.fillStyle = PALETTE[j % PALETTE.length];
      ctx.strokeStyle = state.phase === "converged" ? "#999" : "#1A1A1A";
      ctx.lineWidth = 2;
      if (state.phase === "converged") ctx.setLineDash([3, 3]);
      else ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#FAFAF7";
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}
function drawSSEChart(canvas, history) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
    canvas.width = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  if (!history || history.length === 0) return;
  const max = Math.max(...history.map((h2) => h2.sse));
  const pad = 8;
  const w = cssW - pad * 2;
  const h = cssH - pad * 2;
  const bw = Math.max(2, w / Math.max(history.length, 8) - 2);
  ctx.strokeStyle = "#E5E5E5";
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, pad + h);
  ctx.lineTo(pad + w, pad + h);
  ctx.stroke();
  history.forEach((p, i) => {
    const bh = max > 0 ? p.sse / max * h : 0;
    ctx.fillStyle = p.phase === "assign" ? "#ff7f0e" : p.phase === "update" ? "#1f77b4" : "#888";
    ctx.fillRect(pad + i * (bw + 2), pad + h - bh, bw, bh);
  });
  ctx.fillStyle = "#1A1A1A";
  ctx.font = '11px "Helvetica Neue", system-ui, sans-serif';
  ctx.fillText("SSE", pad + 2, pad + 10);
  const last = history[history.length - 1];
  ctx.fillText(last.sse.toFixed(4), pad + w - 50, pad + 10);
}

// src/main.js
function $(sel) {
  return document.querySelector(sel);
}
var ctrl = createController();
var els = {
  canvas: $("#stage"),
  sse: $("#sse-chart"),
  preview: $("#preview-canvas"),
  failPreview: $("#fail-preview"),
  datasetBtns: document.querySelectorAll("[data-dataset]"),
  initBtns: document.querySelectorAll("[data-init]"),
  kRange: $("#k-range"),
  kReadout: $("#k-readout"),
  btnAssign: $("#btn-assign"),
  btnUpdate: $("#btn-update"),
  btnOnce: $("#btn-once"),
  btnEnd: $("#btn-end"),
  btnReset: $("#btn-reset"),
  iterReadout: $("#iter-readout"),
  sseReadout: $("#sse-readout"),
  phaseReadout: $("#phase-readout"),
  hint: $("#step-hint"),
  legend: $("#cluster-legend")
};
var STATE_HINTS = {
  [PHASE.IDLE]: '\uC67C\uCABD \uCE94\uBC84\uC2A4 \uC704\uC758 \uD070 \uC6D0\uC774 centroid(\uC911\uC2EC\uC810)\uC785\uB2C8\uB2E4. "\uD560\uB2F9" \uBC84\uD2BC\uC744 \uB20C\uB7EC \uC2DC\uC791\uD558\uC138\uC694.',
  [PHASE.ASSIGNED]: '\uC810\uC774 \uAC00\uC7A5 \uAC00\uAE4C\uC6B4 centroid \uC0C9\uC73C\uB85C \uCE60\uD574\uC84C\uC2B5\uB2C8\uB2E4. \uC774\uC81C "\uD3C9\uADE0 \uAC31\uC2E0"\uC73C\uB85C centroid\uB97C \uC62E\uACA8\uBD05\uC2DC\uB2E4.',
  [PHASE.UPDATED]: 'centroid\uAC00 \uAC01 \uBB34\uB9AC\uC758 \uD3C9\uADE0 \uC704\uCE58\uB85C \uC774\uB3D9\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC "\uD560\uB2F9"\uD558\uBA74 \uC0C9\uC774 \uB610 \uBC14\uB014 \uC218 \uC788\uC5B4\uC694.',
  [PHASE.CONVERGED]: "\uC218\uB834 \uC644\uB8CC! centroid\uAC00 \uB354\uB294 \uC6C0\uC9C1\uC774\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC678\uACFD\uC120\uC774 \uC810\uC120\uC73C\uB85C \uBC14\uB00C\uC5C8\uC5B4\uC694."
};
function refresh() {
  const s = ctrl.snapshot();
  drawScene(els.canvas, s, { showVoronoi: true });
  drawSSEChart(els.sse, s.history);
  drawScene(els.preview, s, { showVoronoi: false });
  els.kRange.value = String(s.k);
  els.kReadout.textContent = String(s.k);
  els.iterReadout.textContent = String(s.iter);
  els.sseReadout.textContent = s.sse.toFixed(4);
  els.phaseReadout.textContent = phaseLabel(s.phase);
  els.hint.textContent = STATE_HINTS[s.phase] || "";
  for (const b of els.datasetBtns)
    b.setAttribute("aria-pressed", String(b.dataset.dataset === s.datasetKey));
  for (const b of els.initBtns)
    b.setAttribute("aria-pressed", String(b.dataset.init === s.initMode));
  els.btnAssign.disabled = s.phase === PHASE.CONVERGED;
  els.btnUpdate.disabled = s.phase === PHASE.CONVERGED || s.phase === PHASE.UPDATED || s.phase === PHASE.IDLE;
  els.btnOnce.disabled = s.phase === PHASE.CONVERGED;
  els.btnEnd.disabled = s.phase === PHASE.CONVERGED;
  renderLegend(s.k);
}
function phaseLabel(p) {
  switch (p) {
    case PHASE.IDLE:
      return "\uB300\uAE30";
    case PHASE.ASSIGNED:
      return "\uD560\uB2F9 \uC9C1\uD6C4";
    case PHASE.UPDATED:
      return "\uD3C9\uADE0 \uAC31\uC2E0 \uC9C1\uD6C4";
    case PHASE.CONVERGED:
      return "\uC218\uB834 \uC644\uB8CC";
    default:
      return p;
  }
}
function renderLegend(k) {
  const colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b"];
  els.legend.innerHTML = "";
  for (let i = 0; i < k; i++) {
    const s = document.createElement("span");
    s.className = "legend-chip";
    s.style.setProperty("--chip", colors[i]);
    s.textContent = `\uD074\uB7EC\uC2A4\uD130 ${i + 1}`;
    els.legend.appendChild(s);
  }
}
for (const b of els.datasetBtns) {
  b.addEventListener("click", () => {
    ctrl.setDataset(b.dataset.dataset);
    refresh();
  });
}
for (const b of els.initBtns) {
  b.addEventListener("click", () => {
    ctrl.setInitMode(b.dataset.init);
    refresh();
  });
}
els.kRange.addEventListener("input", () => {
  ctrl.setK(Number(els.kRange.value));
  refresh();
});
els.btnAssign.addEventListener("click", () => {
  ctrl.stepAssign();
  refresh();
});
els.btnUpdate.addEventListener("click", () => {
  ctrl.stepUpdate();
  refresh();
});
els.btnOnce.addEventListener("click", () => {
  ctrl.stepOnce();
  refresh();
});
els.btnEnd.addEventListener("click", () => {
  ctrl.runToEnd();
  refresh();
});
els.btnReset.addEventListener("click", () => {
  ctrl.resetRun();
  refresh();
});
var manualIdx = 0;
els.canvas.addEventListener("click", (ev) => {
  const s = ctrl.snapshot();
  if (s.initMode !== "manual") return;
  const rect = els.canvas.getBoundingClientRect();
  const x = (ev.clientX - rect.left) / rect.width;
  const y = (ev.clientY - rect.top) / rect.height;
  ctrl.setManualCentroid(manualIdx, x, y);
  manualIdx = (manualIdx + 1) % ctrl.snapshot().k;
  refresh();
});
function drawFailPreview() {
  const tmpCtrl = createController();
  tmpCtrl.setDataset("smiley");
  tmpCtrl.runToEnd();
  drawScene(els.failPreview, tmpCtrl.snapshot(), { showVoronoi: true });
}
window.addEventListener("resize", () => {
  refresh();
  drawFailPreview();
});
for (const b of els.datasetBtns) {
  const def = DATASETS[b.dataset.dataset];
  if (def) b.title = def.label;
}
refresh();
drawFailPreview();
