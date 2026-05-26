// @MX:NOTE: 알고리즘 상태 머신 + 스냅샷 — UI/렌더 분리, 테스트 가능
// @MX:ANCHOR fan_in≥3: main.js, ui.js, tests
// @MX:REASON 상태가 한 곳에 모여야 "되돌리기"/SSE 그래프/수렴 표시가 일관됨

import { DATASETS } from './datasets.js';
import {
  assignClusters,
  computeSSE,
  initCentroids,
  isConverged,
  updateCentroids,
} from './kmeans.js';

export const PHASE = {
  IDLE: 'idle',
  ASSIGNED: 'assigned',
  UPDATED: 'updated',
  CONVERGED: 'converged',
};

export function createController() {
  const state = {
    datasetKey: 'blobs',
    points: null,
    k: 3,
    initMode: 'random',
    manualCentroids: null, // for 'manual' mode
    centroids: null,
    prevCentroids: null,
    labels: null,
    iter: 0,
    sse: Number.POSITIVE_INFINITY,
    phase: PHASE.IDLE,
    history: [], // { iter, sse, phase }
    seed: 42,
  };

  function regenerateData() {
    const def = DATASETS[state.datasetKey];
    state.points = def.make(undefined, state.seed);
    state.manualCentroids = null;
    resetRun();
  }

  function resetRun() {
    if (state.initMode === 'manual' && state.manualCentroids) {
      state.centroids = initCentroids(
        state.points,
        state.k,
        'manual',
        state.seed,
        state.manualCentroids,
      );
    } else {
      state.centroids = initCentroids(state.points, state.k, state.initMode, state.seed);
    }
    state.prevCentroids = null;
    state.labels = assignClusters(state.points, state.centroids);
    state.sse = computeSSE(state.points, state.labels, state.centroids);
    state.iter = 0;
    state.phase = PHASE.IDLE;
    state.history = [{ iter: 0, sse: state.sse, phase: 'init' }];
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
    if (mode !== 'manual') state.manualCentroids = null;
    resetRun();
  }

  function setManualCentroid(idx, x, y) {
    // idx: 0..k-1; x,y in [0,1]
    if (!state.manualCentroids) state.manualCentroids = new Array(state.k * 2).fill(0.5);
    state.manualCentroids[2 * idx] = x;
    state.manualCentroids[2 * idx + 1] = y;
    state.initMode = 'manual';
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
    state.history.push({ iter: state.iter, sse: state.sse, phase: 'assign' });
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
    state.history.push({ iter: state.iter, sse: state.sse, phase: 'update' });
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
    runToEnd,
  };
}
