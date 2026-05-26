// @MX:NOTE: 3종 학습용 데이터셋 생성기 (Blobs/Moons/Smiley) — 시드 PRNG 기반 재현성
// @MX:ANCHOR fan_in≥3: controller, main, tests
// @MX:REASON naftaliharris 시각화 분석 결과 "잘 되는/까다로운/실패하는" 3종 케이스 노출이 학습 효과 핵심

import { createRng, rngRange } from './prng.js';

// 모든 데이터셋은 정규화 좌표 [0,1] x [0,1] 공간에서 생성된다.

function gauss(rng, mx, my, sx, sy) {
  // Box-Muller 변환
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
  return [mx + sx * z0, my + sy * z1];
}

function clip01(v) {
  return v < 0.02 ? 0.02 : v > 0.98 ? 0.98 : v;
}

export function blobs(n = 180, seed = 1) {
  const rng = createRng(seed);
  const centers = [
    [0.25, 0.3],
    [0.7, 0.25],
    [0.5, 0.75],
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

export function moons(n = 200, seed = 2) {
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

export function smiley(n = 240, seed = 3) {
  // 얼굴 외곽(arc) + 두 눈(blob) + 입(curve) — k-means가 의도대로 못 묶는 케이스
  const rng = createRng(seed);
  const pts = [];
  const face = Math.floor(n * 0.55);
  const eyes = Math.floor(n * 0.2);
  const mouth = n - face - eyes;

  // 얼굴: 중심 (0.5, 0.5), 반지름 0.35, 살짝 두꺼운 링
  for (let i = 0; i < face; i++) {
    const t = rng() * 2 * Math.PI;
    const r = 0.34 + (rng() - 0.5) * 0.03;
    pts.push(clip01(0.5 + Math.cos(t) * r));
    pts.push(clip01(0.5 + Math.sin(t) * r));
  }
  // 두 눈
  const eyeCenters = [
    [0.38, 0.62],
    [0.62, 0.62],
  ];
  for (let i = 0; i < eyes; i++) {
    const c = eyeCenters[i % 2];
    const [x, y] = gauss(rng, c[0], c[1], 0.025, 0.025);
    pts.push(clip01(x));
    pts.push(clip01(y));
  }
  // 입: 아래쪽 호
  for (let i = 0; i < mouth; i++) {
    const t = Math.PI + rng() * Math.PI;
    const r = 0.18 + (rng() - 0.5) * 0.015;
    pts.push(clip01(0.5 + Math.cos(t) * r));
    pts.push(clip01(0.5 + Math.sin(t) * r * 0.6));
  }
  return Float32Array.from(pts);
}

export const DATASETS = {
  blobs: { label: '가우시안 군집 (잘 되는 경우)', make: blobs, suggestedK: 3 },
  moons: { label: '두 초승달 (까다로운 경우)', make: moons, suggestedK: 2 },
  smiley: { label: '스마일 (k-평균이 실패하는 경우)', make: smiley, suggestedK: 4 },
};
