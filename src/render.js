// @MX:NOTE: Canvas 2D 렌더링 — Voronoi 음영 + 점 + centroid + 이전 centroid 잔상
// @MX:ANCHOR fan_in≥3: main.js, controller wiring, e2e tests
// @MX:REASON naftaliharris SoT: "I've also shaded subregions depending on which centroid they are closest to"

const PALETTE = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];

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

export function drawScene(canvas, state, opts = {}) {
  const ctx = canvas.getContext('2d');
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

  // 1. Voronoi 음영 (격자 기반, 32x24 정도 해상도로 충분 — 빠르고 부드러움)
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

  // 2. 이전 centroid 잔상 (희미)
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
        2 * Math.PI,
      );
      ctx.fill();
    }
    // 잔상 -> 현재 centroid를 잇는 선
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = 1;
    for (let j = 0; j < state.prevCentroids.length >> 1; j++) {
      ctx.beginPath();
      ctx.moveTo(state.prevCentroids[2 * j] * W, state.prevCentroids[2 * j + 1] * H);
      ctx.lineTo(state.centroids[2 * j] * W, state.centroids[2 * j + 1] * H);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // 3. 데이터 점
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

  // 4. 현재 centroid
  if (state.centroids) {
    const k = state.centroids.length >> 1;
    for (let j = 0; j < k; j++) {
      const cx = state.centroids[2 * j] * W;
      const cy = state.centroids[2 * j + 1] * H;
      ctx.fillStyle = PALETTE[j % PALETTE.length];
      ctx.strokeStyle = state.phase === 'converged' ? '#999' : '#1A1A1A';
      ctx.lineWidth = 2;
      if (state.phase === 'converged') ctx.setLineDash([3, 3]);
      else ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      // 중심 점
      ctx.setLineDash([]);
      ctx.fillStyle = '#FAFAF7';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

export function drawSSEChart(canvas, history) {
  const ctx = canvas.getContext('2d');
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
  const max = Math.max(...history.map((h) => h.sse));
  const pad = 8;
  const w = cssW - pad * 2;
  const h = cssH - pad * 2;
  const bw = Math.max(2, w / Math.max(history.length, 8) - 2);

  // 축
  ctx.strokeStyle = '#E5E5E5';
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, pad + h);
  ctx.lineTo(pad + w, pad + h);
  ctx.stroke();

  // 막대
  history.forEach((p, i) => {
    const bh = max > 0 ? (p.sse / max) * h : 0;
    ctx.fillStyle = p.phase === 'assign' ? '#ff7f0e' : p.phase === 'update' ? '#1f77b4' : '#888';
    ctx.fillRect(pad + i * (bw + 2), pad + h - bh, bw, bh);
  });

  // 라벨
  ctx.fillStyle = '#1A1A1A';
  ctx.font = '11px "Helvetica Neue", system-ui, sans-serif';
  ctx.fillText('SSE', pad + 2, pad + 10);
  const last = history[history.length - 1];
  ctx.fillText(last.sse.toFixed(4), pad + w - 50, pad + 10);
}

export { PALETTE };
