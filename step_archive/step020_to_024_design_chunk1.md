# Step 020~024 통합 - 디자인 참고 사이트 선정 + 데이터 수집 + 패턴 분석 + 충분성 검증

> Awwwards `inspiration/category/data-visualization/` 와 `websites/education/` 은 봇 차단(1.1KB/1.7KB raw)으로
> 실질 컨텐츠 수집 불가. siteinspire도 차단(267B). 대안으로 **distill.pub** (인터랙티브 ML 시각화의 공인 정전)
> 1차 사료 수집 (59,487B). 이 결정은 step020 "Awwwards 사이트 선정" 의도를 살리면서
> 검증 가능한 1차 자료로 우회한 결과.

## 수집된 1차 사료

| ID | 크기 | 비고 |
|:---|---:|:---|
| awwwards-data | 1,151B | 봇 차단 (참고 불가) |
| awwwards-edu | 1,722B | 봇 차단 (참고 불가) |
| siteinspire-edu | 267B | 차단 |
| setosa-explained | 867B | SPA, SSR 본문 없음 |
| **distill-momentum** | **59,487B** | ✓ 본문 수집 — 인터랙티브 교육 시각화 정전 |

## distill.pub momentum 분석에서 추출한 인터랙션 패턴

원본 grep 결과에 등장한 표현:
- "scrub values"
- "drag points to fit data"
- "Step k = 49"
- "Step-size α = 0.02"
- "When an eigenspace has converged to three significant digits, the bar greys out. Drag the observations to change fit."

→ 본 튜토리얼이 차용할 6가지 패턴:

| # | 패턴 | distill.pub 사례 | 본 튜토리얼 적용 |
|:---|:---|:---|:---|
| 1 | **단일 슬라이더 + 즉시 시각 반영** | step-size α | k 슬라이더 (1~6) → 클러스터 점 색 즉시 갱신 |
| 2 | **명확한 iter 카운터** | "Step k = 49" | "반복 #N" + 현재 SSE 같이 표시 |
| 3 | **drag points** | 사용자가 데이터 점 드래그 | 직접 클릭 초기화 모드: 캔버스 클릭으로 centroid 배치 |
| 4 | **수렴 후 시각적 회색화** | "the bar greys out" | 수렴 시 centroid 외곽선을 점선/회색으로 전환 |
| 5 | **수식 본문 옆 작은 위젯** | 본문 인라인 미니 시각화 | 알고리즘 단계 카드마다 작은 미리보기 캔버스 |
| 6 | **하나의 색만 강조** | 검정 텍스트 + 청록 1색 | 60-30-10 원칙: 흑/회/청록 1점 컬러 |

## 디자인 토큰 (CLAUDE.md AI Slop 방지 규칙 적용)

```css
/* 색 (60/30/10) */
--ink: #1A1A1A;        /* 60% 텍스트 */
--paper: #FAFAF7;      /* 30% 배경 */
--accent: #006D77;     /* 10% 강조 (청록) */
--muted: #6B7280;
--line: #E5E5E5;

/* 클러스터 팔레트 (colorblind safe, 최대 6) */
--c1:#1f77b4; --c2:#ff7f0e; --c3:#2ca02c;
--c4:#d62728; --c5:#9467bd; --c6:#8c564b;

/* 간격 (8 그리드) */
--s-1:4px; --s-2:8px; --s-3:16px; --s-4:24px; --s-5:32px;

/* 폰트 (4 사이즈 / 2 weight) */
--f-1:14px; --f-2:16px; --f-3:20px; --f-4:32px;
/* family */
--ui: 'Helvetica Neue', system-ui, sans-serif;
--mono: 'JetBrains Mono', 'Courier New', monospace;

/* radius */
--r-0:0; --r-1:4px; --r-2:8px;
```

## 충분성 체크 (step024)

- [x] k-means 알고리즘 도메인 1차 사료: 4건 (wiki, scikit, naftaliharris, cluster-analysis)
- [x] GitHub 참고 레포: 19+1038 검색 → 1건 raw 다운로드 분석
- [x] 인터랙티브 교육 시각화 패턴: distill.pub 1차 사료 + 6가지 패턴 추출
- [x] 디자인 토큰 결정 완료
- [x] 본 튜토리얼이 차별화할 5가지 GAP (vanilla JS, step-by-step, 직접 클릭 init, SSE 그래프, 한국어, a11y) 명시

## 조사 종료 선언

step025 기획 단계 진입 가능.
