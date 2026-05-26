// @MX:NOTE: k-means 코어 유닛 테스트 — 1차 사료 인용 가능한 동작만 검증
// @MX:ANCHOR fan_in≥3 — r1 게이트, r2 게이트, CI 게이트
// @MX:REASON Wikipedia SoT: "SSE strictly decreases" 단조감소 검증이 본 알고리즘의 핵심 불변량

import { describe, expect, it } from 'vitest';
import { blobs, moons, smiley } from '../src/datasets.js';
import {
  assignClusters,
  computeSSE,
  initCentroids,
  isConverged,
  updateCentroids,
} from '../src/kmeans.js';

describe('assignClusters', () => {
  it('각 점을 가장 가까운 centroid에 할당한다', () => {
    // 동거리 점은 평가 순서상 인덱스가 작은 centroid를 우선한다 (안정적인 tie-breaking)
    const pts = Float32Array.from([0.05, 0.05, 0.1, 0.9, 0.95, 0.1, 0.9, 0.95]);
    const c = Float32Array.from([0.0, 0.0, 1.0, 1.0]);
    const labels = assignClusters(pts, c);
    expect(Array.from(labels)).toEqual([0, 0, 1, 1]);
  });
});

describe('updateCentroids', () => {
  it('각 라벨에 속한 점의 평균을 새 centroid로 만든다', () => {
    const pts = Float32Array.from([0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]);
    const labels = Int32Array.from([0, 0, 1, 1]);
    const c = updateCentroids(pts, labels, 2, Float32Array.from([0.0, 0.0, 1.0, 1.0]));
    expect(c[0]).toBeCloseTo(0.0, 5);
    expect(c[1]).toBeCloseTo(0.5, 5);
    expect(c[2]).toBeCloseTo(1.0, 5);
    expect(c[3]).toBeCloseTo(0.5, 5);
  });

  it('빈 클러스터는 SSE 기여가 가장 큰 점으로 재배치한다', () => {
    const pts = Float32Array.from([0.0, 0.0, 0.1, 0.0, 0.9, 0.9]);
    const labels = Int32Array.from([0, 0, 0]); // 두 번째 centroid에 0개
    const prev = Float32Array.from([0.0, 0.0, 0.5, 0.5]);
    const c = updateCentroids(pts, labels, 2, prev);
    expect(c[2]).toBeCloseTo(0.9, 5);
    expect(c[3]).toBeCloseTo(0.9, 5);
  });
});

describe('SSE 단조 감소 (Wikipedia 핵심 정리)', () => {
  it('Blobs에서 반복마다 SSE가 줄어들거나 같다', () => {
    const pts = blobs(150, 7);
    let c = initCentroids(pts, 3, 'farthest', 7);
    let labels = assignClusters(pts, c);
    let prevSse = computeSSE(pts, labels, c);
    for (let iter = 0; iter < 30; iter++) {
      labels = assignClusters(pts, c);
      const sseA = computeSSE(pts, labels, c);
      expect(sseA).toBeLessThanOrEqual(prevSse + 1e-9);
      const cNext = updateCentroids(pts, labels, 3, c);
      const sseU = computeSSE(pts, labels, cNext);
      expect(sseU).toBeLessThanOrEqual(sseA + 1e-9);
      prevSse = sseU;
      if (isConverged(c, cNext)) break;
      c = cNext;
    }
  });
});

describe('수렴성', () => {
  it('Blobs는 30회 이내에 수렴한다', () => {
    const pts = blobs(180, 11);
    let c = initCentroids(pts, 3, 'farthest', 11);
    let converged = false;
    for (let i = 0; i < 30; i++) {
      const labels = assignClusters(pts, c);
      const cNext = updateCentroids(pts, labels, 3, c);
      if (isConverged(c, cNext)) {
        converged = true;
        break;
      }
      c = cNext;
    }
    expect(converged).toBe(true);
  });
});

describe('initCentroids', () => {
  it('random 모드는 점 좌표 중에서 고른다', () => {
    const pts = blobs(100, 5);
    const c = initCentroids(pts, 4, 'random', 5);
    expect(c.length).toBe(8);
    for (let j = 0; j < 4; j++) {
      let found = false;
      for (let i = 0; i < 100; i++) {
        if (
          Math.abs(pts[2 * i] - c[2 * j]) < 1e-6 &&
          Math.abs(pts[2 * i + 1] - c[2 * j + 1]) < 1e-6
        ) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    }
  });

  it('farthest 모드는 random보다 centroid 간 최소거리가 작지 않다', () => {
    const pts = blobs(180, 13);
    const cr = initCentroids(pts, 3, 'random', 13);
    const cf = initCentroids(pts, 3, 'farthest', 13);
    function minPairDist(c) {
      const k = c.length >> 1;
      let m = Number.POSITIVE_INFINITY;
      for (let i = 0; i < k; i++) {
        for (let j = i + 1; j < k; j++) {
          const dx = c[2 * i] - c[2 * j];
          const dy = c[2 * i + 1] - c[2 * j + 1];
          m = Math.min(m, dx * dx + dy * dy);
        }
      }
      return m;
    }
    expect(minPairDist(cf)).toBeGreaterThanOrEqual(minPairDist(cr) - 1e-9);
  });

  it('manual 모드는 호출자가 준 좌표를 그대로 쓴다', () => {
    const pts = blobs(50, 1);
    const c = initCentroids(pts, 2, 'manual', 1, [0.1, 0.2, 0.8, 0.9]);
    expect(Array.from(c)).toEqual([
      Math.fround(0.1),
      Math.fround(0.2),
      Math.fround(0.8),
      Math.fround(0.9),
    ]);
  });
});

describe('datasets 재현성', () => {
  it('같은 시드로 호출하면 같은 결과', () => {
    const a = blobs(80, 42);
    const b = blobs(80, 42);
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it('moons 점 개수가 정확하다', () => {
    expect(moons(120, 2).length).toBe(240);
  });

  it('smiley 점은 [0,1] 범위에 있다', () => {
    const s = smiley(200, 3);
    for (let i = 0; i < s.length; i++) {
      expect(s[i]).toBeGreaterThanOrEqual(0);
      expect(s[i]).toBeLessThanOrEqual(1);
    }
  });
});

describe('isConverged', () => {
  it('이동량이 eps 미만이면 true', () => {
    const a = Float32Array.from([0.5, 0.5, 0.1, 0.9]);
    const b = Float32Array.from([0.500001, 0.500001, 0.1, 0.9]);
    expect(isConverged(a, b, 1e-3)).toBe(true);
  });

  it('eps 이상이면 false', () => {
    const a = Float32Array.from([0.5, 0.5]);
    const b = Float32Array.from([0.6, 0.5]);
    expect(isConverged(a, b, 1e-3)).toBe(false);
  });
});
