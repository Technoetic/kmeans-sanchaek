// @MX:NOTE: k-평균 알고리즘 코어 — Lloyd 표준 구현 (assign / update / SSE / converge)
// @MX:ANCHOR fan_in≥3: controller.js, main.js, tests/kmeans.test.js
// @MX:REASON wiki k-means SoT — "minimizes within-cluster variances; sum of squared distances strictly decreases"
// @MX:WARN 빈 클러스터 발생 시 가장 먼 점으로 재배치 (Wikipedia: "implementation dependent")
// @MX:REASON 미처리 시 0/0 division → 시각화 깨짐

import { createRng, rngInt } from './prng.js';

/**
 * 점이 가장 가까운 centroid에 할당된다.
 * @param {Float32Array} points  length=2N — [x0,y0, x1,y1, ...]
 * @param {Float32Array} centroids length=2k
 * @returns {Int32Array} labels length=N
 */
export function assignClusters(points, centroids) {
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

/**
 * 각 클러스터에 속한 점들의 평균(centroid)을 다시 계산한다.
 * 빈 클러스터는 SSE에 가장 크게 기여하는 점으로 재배치한다 (Wikipedia 처리법 중 하나).
 */
export function updateCentroids(points, labels, k, prevCentroids) {
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
      // 빈 클러스터 → SSE 기여가 가장 큰 점으로 재배치
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

/**
 * Within-Cluster Sum of Squared Errors. assign/update 양쪽에서 단조 감소.
 */
export function computeSSE(points, labels, centroids) {
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

/**
 * 초기 centroid 위치. 3가지 모드.
 * mode='random'   — 점 중 무작위 k개 (Forgy 변형)
 * mode='farthest' — 첫 centroid 무작위, 이후 최소거리가 최대인 점 (Maximin 휴리스틱)
 * mode='manual'   — 호출자가 미리 좌표를 넘김
 */
export function initCentroids(points, k, mode = 'random', seed = 42, manual = null) {
  if (mode === 'manual' && manual) {
    return Float32Array.from(manual);
  }
  const rng = createRng(seed);
  const n = points.length >> 1;
  if (n === 0 || k <= 0) return new Float32Array(0);
  const out = new Float32Array(k * 2);
  const usedIdx = new Set();

  // 첫 centroid 무작위
  const firstIdx = rngInt(rng, n);
  usedIdx.add(firstIdx);
  out[0] = points[2 * firstIdx];
  out[1] = points[2 * firstIdx + 1];

  for (let j = 1; j < k; j++) {
    if (mode === 'random') {
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
      // farthest: 직전 centroid들과 최소거리가 가장 큰 점
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

/**
 * centroid 이동량 ‖prev - next‖_∞ < eps 면 수렴 간주.
 */
export function isConverged(prev, next, eps = 1e-4) {
  if (!prev || prev.length !== next.length) return false;
  let m = 0;
  for (let i = 0; i < prev.length; i++) {
    const d = Math.abs(prev[i] - next[i]);
    if (d > m) m = d;
  }
  return m < eps;
}
