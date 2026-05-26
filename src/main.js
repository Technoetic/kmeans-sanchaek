// @MX:NOTE: 부트스트랩 — controller ↔ DOM 이벤트 ↔ render 와이어링
// @MX:ANCHOR fan_in≥3: index.html, e2e tests, a11y tests
// @MX:REASON 단일 진입점 유지가 vanilla 정적 SPA에서 모듈 그래프를 잡는 가장 단순한 길

import { PHASE, createController } from './controller.js';
import { DATASETS } from './datasets.js';
import { drawSSEChart, drawScene } from './render.js';

function $(sel) {
  return document.querySelector(sel);
}

const ctrl = createController();

const els = {
  canvas: $('#stage'),
  sse: $('#sse-chart'),
  preview: $('#preview-canvas'),
  failPreview: $('#fail-preview'),
  datasetBtns: document.querySelectorAll('[data-dataset]'),
  initBtns: document.querySelectorAll('[data-init]'),
  kRange: $('#k-range'),
  kReadout: $('#k-readout'),
  btnAssign: $('#btn-assign'),
  btnUpdate: $('#btn-update'),
  btnOnce: $('#btn-once'),
  btnEnd: $('#btn-end'),
  btnReset: $('#btn-reset'),
  iterReadout: $('#iter-readout'),
  sseReadout: $('#sse-readout'),
  phaseReadout: $('#phase-readout'),
  hint: $('#step-hint'),
  legend: $('#cluster-legend'),
};

const STATE_HINTS = {
  [PHASE.IDLE]: '왼쪽 캔버스 위의 큰 원이 centroid(중심점)입니다. "할당" 버튼을 눌러 시작하세요.',
  [PHASE.ASSIGNED]:
    '점이 가장 가까운 centroid 색으로 칠해졌습니다. 이제 "평균 갱신"으로 centroid를 옮겨봅시다.',
  [PHASE.UPDATED]:
    'centroid가 각 무리의 평균 위치로 이동했습니다. 다시 "할당"하면 색이 또 바뀔 수 있어요.',
  [PHASE.CONVERGED]: '수렴 완료! centroid가 더는 움직이지 않습니다. 외곽선이 점선으로 바뀌었어요.',
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
  els.hint.textContent = STATE_HINTS[s.phase] || '';
  for (const b of els.datasetBtns)
    b.setAttribute('aria-pressed', String(b.dataset.dataset === s.datasetKey));
  for (const b of els.initBtns)
    b.setAttribute('aria-pressed', String(b.dataset.init === s.initMode));
  els.btnAssign.disabled = s.phase === PHASE.CONVERGED;
  els.btnUpdate.disabled =
    s.phase === PHASE.CONVERGED || s.phase === PHASE.UPDATED || s.phase === PHASE.IDLE;
  els.btnOnce.disabled = s.phase === PHASE.CONVERGED;
  els.btnEnd.disabled = s.phase === PHASE.CONVERGED;
  renderLegend(s.k);
}

function phaseLabel(p) {
  switch (p) {
    case PHASE.IDLE:
      return '대기';
    case PHASE.ASSIGNED:
      return '할당 직후';
    case PHASE.UPDATED:
      return '평균 갱신 직후';
    case PHASE.CONVERGED:
      return '수렴 완료';
    default:
      return p;
  }
}

function renderLegend(k) {
  const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];
  els.legend.innerHTML = '';
  for (let i = 0; i < k; i++) {
    const s = document.createElement('span');
    s.className = 'legend-chip';
    s.style.setProperty('--chip', colors[i]);
    s.textContent = `클러스터 ${i + 1}`;
    els.legend.appendChild(s);
  }
}

// 이벤트 와이어링
for (const b of els.datasetBtns) {
  b.addEventListener('click', () => {
    ctrl.setDataset(b.dataset.dataset);
    refresh();
  });
}
for (const b of els.initBtns) {
  b.addEventListener('click', () => {
    ctrl.setInitMode(b.dataset.init);
    refresh();
  });
}
els.kRange.addEventListener('input', () => {
  ctrl.setK(Number(els.kRange.value));
  refresh();
});
els.btnAssign.addEventListener('click', () => {
  ctrl.stepAssign();
  refresh();
});
els.btnUpdate.addEventListener('click', () => {
  ctrl.stepUpdate();
  refresh();
});
els.btnOnce.addEventListener('click', () => {
  ctrl.stepOnce();
  refresh();
});
els.btnEnd.addEventListener('click', () => {
  ctrl.runToEnd();
  refresh();
});
els.btnReset.addEventListener('click', () => {
  ctrl.resetRun();
  refresh();
});

// 캔버스 클릭 → 직접 클릭 초기화 모드 (manual)
let manualIdx = 0;
els.canvas.addEventListener('click', (ev) => {
  const s = ctrl.snapshot();
  if (s.initMode !== 'manual') return;
  const rect = els.canvas.getBoundingClientRect();
  const x = (ev.clientX - rect.left) / rect.width;
  const y = (ev.clientY - rect.top) / rect.height;
  ctrl.setManualCentroid(manualIdx, x, y);
  manualIdx = (manualIdx + 1) % ctrl.snapshot().k;
  refresh();
});

// 실패 케이스 미리보기 (Smiley)
function drawFailPreview() {
  const tmpCtrl = createController();
  tmpCtrl.setDataset('smiley');
  tmpCtrl.runToEnd();
  drawScene(els.failPreview, tmpCtrl.snapshot(), { showVoronoi: true });
}

// 윈도우 리사이즈에 캔버스 재그림
window.addEventListener('resize', () => {
  refresh();
  drawFailPreview();
});

// 데이터셋 라벨 초기화
for (const b of els.datasetBtns) {
  const def = DATASETS[b.dataset.dataset];
  if (def) b.title = def.label;
}

refresh();
drawFailPreview();
