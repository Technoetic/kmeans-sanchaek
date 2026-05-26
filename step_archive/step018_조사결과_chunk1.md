# Step 018 - API 계약 문서 조사 (chunk 1/1)

## 본 튜토리얼의 외부 의존성 정책

- 백엔드: **없음** (정적 SPA)
- CDN/3rd-party JS: **없음** (Vanilla JS)
- 따라서 "API 계약"은 ① **브라우저 내장 표준 API** ② **본 튜토리얼 내부 모듈 간 함수 계약** 두 가지로 정의된다.

## 1. 브라우저 표준 API (Web Platform — MDN 정전)

| API | 사용 위치 | 본 튜토리얼 계약 |
|:---|:---|:---|
| `HTMLCanvasElement.getContext('2d')` | `src/render.js` | `ctx.fillStyle / fillRect / arc / fill / stroke / fillText` 만 사용. WebGL 미사용 |
| `requestAnimationFrame` | `src/render.js` | 사용 안 함(사용자 클릭 단계 시각화) — 불필요 frame 폭주 방지 |
| `addEventListener('click'/'pointerdown'/'change')` | `src/ui.js` | 직접 클릭 초기화에서 좌표 변환 |
| `localStorage` | 사용 안 함 | 개인정보 0 |
| `Math.random` | `src/kmeans.js` | 시드 가능한 PRNG로 한 번 래핑 (재현성) |

## 2. 본 튜토리얼 내부 함수 계약 (사전 정의)

```js
// kmeans.js — 알고리즘 본체
/**
 * @MX:ANCHOR fan_in≥3 - render.js, ui.js, controller.js에서 호출
 * @MX:REASON 알고리즘 계약을 깨면 시각화·테스트 동시 깨짐
 */
export function assignClusters(points, centroids) { /* returns Int32Array(points.length) — 각 점이 속한 centroid index */ }
export function updateCentroids(points, labels, k) { /* returns Float32Array(k*2) — 새로운 centroid 좌표 평면 */ }
export function computeSSE(points, labels, centroids) { /* returns number — 단조 감소 검증용 */ }
export function initCentroids(points, k, mode) { /* mode: 'random' | 'farthest'  → Float32Array(k*2) */ }
export function isConverged(prev, next, eps = 1e-3) { /* boolean */ }
```

```js
// controller.js — 상태 머신
const State = { IDLE: 'idle', ASSIGNED: 'assigned', UPDATED: 'updated', CONVERGED: 'converged' };
// 전이: IDLE→ASSIGNED (할당 클릭) → UPDATED (평균 갱신 클릭) → ASSIGNED (다음 1회) → ... → CONVERGED (isConverged true)
```

## 3. 데이터 모델

```js
// 점 (개별 데이터)
type Point = { x: number, y: number };

// 상태 스냅샷 (1회 step마다 캡처)
type Snapshot = {
  iter: number,
  centroids: Float32Array, // length = 2*k
  labels: Int32Array,      // length = points.length
  sse: number
};
```

## 4. UI/접근성 계약

- 모든 버튼 `role`/`aria-label` 명시. canvas는 `role="img"` + `aria-describedby` (대체 텍스트 카드)
- 키보드: Tab 순서, Enter/Space로 단계 클릭 가능
- 색상 대비: 클러스터 색상은 colorblind-safe palette 4종 + WCAG AA 대비 확보

## CoVe

- [x] 외부 API 없음을 명확히 함
- [x] 브라우저 표준 API 사용 범위 한정
- [x] 내부 함수 시그니처를 step031+ 구현 단계가 따라야 할 SoT로 박제
