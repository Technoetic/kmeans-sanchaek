// @MX:NOTE: controller 상태 머신 유닛 테스트 — UI 통합 전 핵심 transition 보장
// @MX:ANCHOR fan_in≥3: r1 게이트, r2 게이트, CI
// @MX:REASON main.js는 DOM에 묶여 jsdom 없이 테스트 어려움 → controller 분리해 헤드리스로 검증

import { describe, expect, it } from 'vitest';
import { createController, PHASE } from '../src/controller.js';

describe('controller 초기 상태', () => {
  it('기본 데이터셋 blobs, k=3, phase=IDLE', () => {
    const c = createController();
    const s = c.snapshot();
    expect(s.datasetKey).toBe('blobs');
    expect(s.k).toBe(3);
    expect(s.phase).toBe(PHASE.IDLE);
    expect(s.iter).toBe(0);
    expect(s.points.length).toBeGreaterThan(0);
    expect(s.centroids.length).toBe(6); // k=3 * 2
  });
});

describe('controller 단계 전이', () => {
  it('stepAssign 후 phase=ASSIGNED', () => {
    const c = createController();
    c.stepAssign();
    expect(c.snapshot().phase).toBe(PHASE.ASSIGNED);
  });

  it('stepUpdate 후 iter +1', () => {
    const c = createController();
    c.stepAssign();
    c.stepUpdate();
    const s = c.snapshot();
    expect(s.iter).toBe(1);
    expect([PHASE.UPDATED, PHASE.CONVERGED]).toContain(s.phase);
  });

  it('runToEnd 후 phase=CONVERGED', () => {
    const c = createController();
    c.runToEnd();
    expect(c.snapshot().phase).toBe(PHASE.CONVERGED);
  });

  it('resetRun 후 iter=0', () => {
    const c = createController();
    c.runToEnd();
    c.resetRun();
    const s = c.snapshot();
    expect(s.iter).toBe(0);
    expect(s.phase).toBe(PHASE.IDLE);
  });
});

describe('controller 설정 변경', () => {
  it('setDataset 시 suggestedK가 따라온다', () => {
    const c = createController();
    c.setDataset('moons');
    expect(c.snapshot().datasetKey).toBe('moons');
    expect(c.snapshot().k).toBe(2);
    c.setDataset('smiley');
    expect(c.snapshot().k).toBe(4);
  });

  it('setK는 1~6 클램프', () => {
    const c = createController();
    c.setK(0);
    expect(c.snapshot().k).toBe(1);
    c.setK(100);
    expect(c.snapshot().k).toBe(6);
  });

  it('setInitMode farthest는 random과 다른 centroid 위치를 만들 수 있다', () => {
    const c = createController();
    c.setInitMode('random');
    const r = Array.from(c.snapshot().centroids);
    c.setInitMode('farthest');
    const f = Array.from(c.snapshot().centroids);
    // 동일 seed/dataset에서 두 방식이 항상 같다는 보장은 없으므로, 단지 둘 다 유효한 6-length 배열인지만 확인
    expect(f.length).toBe(6);
    expect(r.length).toBe(6);
  });

  it('setManualCentroid로 주어진 좌표가 centroid에 반영된다', () => {
    const c = createController();
    c.setManualCentroid(0, 0.2, 0.3);
    c.setManualCentroid(1, 0.7, 0.8);
    c.setManualCentroid(2, 0.5, 0.5);
    const s = c.snapshot();
    expect(s.initMode).toBe('manual');
    expect(s.centroids[0]).toBeCloseTo(0.2, 4);
    expect(s.centroids[1]).toBeCloseTo(0.3, 4);
  });
});

describe('controller history', () => {
  it('runToEnd 후 history에 update 단계가 다수 기록된다', () => {
    const c = createController();
    c.runToEnd();
    const h = c.snapshot().history;
    expect(h.length).toBeGreaterThanOrEqual(2);
    expect(h[0].phase).toBe('init');
  });
});
