# Step 107 - 최종 보고

## 산출물

**"k-평균 산책" — k-평균 클러스터링 알고리즘 한국어 인터랙티브 웹 튜토리얼**

- 위치: `public/index.html` + `src/*` + `tests/*` + `scripts/*`
- 의존성: 0 (Vanilla JS + Canvas 2D + Node http 내장 dev 서버)
- 번들: 41.8 KB (HTML+CSS+JS, 비압축)
- LOC: 1,639 (HTML 234 / CSS 382 / JS 1,023)
- 검증: Vitest 23 PASS · E2E 3 뷰포트 PASS · axe 0 · semgrep 0 · jscpd 1.29%

## 학습 목표 달성

| # | 학습 목표 (step025 정의) | 달성 근거 |
|:---|:---|:---|
| 1 | k-means가 무엇을 푸는 알고리즘인지 한 줄로 설명할 수 있다 | 1번 카드(Wikipedia 정의 직인용) |
| 2 | "할당→평균 갱신" 두 단계를 직접 시연하고 수렴 의미를 설명할 수 있다 | 2번 인터랙티브(버튼 5종 + iter/SSE/phase 상태) |
| 3 | 초기화 방법에 따라 결과가 달라지는 것을 본다 | 초기화 토글 3종(random/farthest/직접 클릭) |
| 4 | k-means가 못 푸는 모양 1가지 이상을 예로 들 수 있다 | 4번 카드 + 스마일 자동 시연 미리보기 |
| 5 | 일상 앱에서 k-means가 등장하는 사례 2가지 이상을 안다 | 5번 6-카드 그리드 (사진 색감 · 고객 세분화 · 카메라 보케 · 천문 · 유전자 · 의미 군집) |

## 게이트 통과 이력

| Round | EVAL | TRUST | 게이트 |
|:---|:---|:---|:---|
| r1 (step049) | 38/40 | 46/50 | PASS |
| r2 (step069 직후) | 39/40 | 47/50 | PASS |
| **r3 (step107, 최종)** | **39/40** | **49/50** | **PASS** |

## 서브에이전트 사용 내역

본 세션에서는 **서브에이전트를 명시적으로 dispatch하지 않고 메인 에이전트가 직접 모든 작업을 수행했다.**

근거:
1. **프로젝트 규모 SMALL (<100 files)** — step002 context 전략에서 "도구·환경 검증 단계는 메인이 직접" 결정.
2. **한 턴 효율 우선 (CLAUDE.md "한 턴 안에서 가능한 한 많은 Step 연속 실행")** — 서브에이전트 round-trip 비용이 직접 실행보다 큼.
3. **조사 단계는 서브에이전트 대신 Playwright 백그라운드 작업으로 병렬화** — 4개 URL을 동시에 Bash run_in_background로 수집(step016), 이후 추가 3개(step019/020)도 동일 패턴. 결과적으로 서브에이전트 4~7개를 부른 것과 동등한 병렬도.
4. **구현 단계는 직접 작성이 더 정확** — 토큰 룰셋·@MX 태그·1차 사료 인용 일관성을 메인 메모리에서 유지하는 편이 서브에이전트 위임보다 슬립 없이 한 번에 통과.

## Playwright 백그라운드 작업 (사실상의 병렬 조사 에이전트)

| 작업 | URL | 결과 |
|:---|:---|:---|
| wiki-kmeans | en.wikipedia.org/wiki/K-means_clustering | 63.8 KB |
| scikit-kmeans | scikit-learn.org/stable/modules/clustering.html | 61.4 KB |
| naftaliharris | naftaliharris.com/blog/visualizing-k-means-clustering | 9.3 KB |
| distill-pca-vs-kmeans | en.wikipedia.org/wiki/Cluster_analysis | 71.3 KB |
| distill-momentum | distill.pub/2017/momentum | 59.5 KB |
| awwwards-data / awwwards-edu | awwwards.com | 봇 차단(우회 결정) |
| setosa / siteinspire | setosa.io / siteinspire.com | SPA/차단 |
| mdn-canvas | developer.mozilla.org | 3.1 KB |

총 8개 URL 수집, 6개에서 1차 사료 확보. distill.pub 인터랙션 패턴이 본 튜토리얼 UX의 직접 출처.

## 실패·우회 패턴 (다음 프로젝트 참고)

1. **Awwwards 봇 차단** → siteinspire도 차단. 대안으로 **distill.pub** 사용 (인터랙티브 ML 시각화의 공인 정전). 결정 근거: step020 "Awwwards 사이트 선정" 의도는 "인터랙티브 시각화 디자인 패턴 추출" 이므로, 자료 출처를 distill.pub로 우회해도 본질 충족.
2. **stylelint-config-standard 39→40** — stylelint 17 peer 충돌. 40으로 올려 해결.
3. **assignClusters 첫 테스트** — 동거리 점 tie-breaking 미고려한 예상치 → 좌표를 명확히 분리한 입력으로 교정.
4. **a11y 3건** — color-contrast / landmark-complementary / role-img-alt. 토큰 콘트라스트 강화 + aside→div + canvas aria-label 보강으로 즉시 해결.
5. **Windows bash background server** — `&` 후 서브쉘 종료로 같이 죽음 → `(nohup ... &)` 격리로 해결.

## 파일 트리 (최종)

```
.
├── CLAUDE.md
├── package.json
├── biome.json
├── .stylelintrc.json
├── vitest.config.js
├── .gitignore
├── public/
│   └── index.html
├── src/
│   ├── prng.js
│   ├── datasets.js
│   ├── kmeans.js
│   ├── controller.js
│   ├── render.js
│   ├── main.js
│   └── styles.css
├── tests/
│   ├── kmeans.test.js
│   └── controller.test.js
├── scripts/
│   ├── dev-server.cjs
│   ├── playwright-verify.cjs
│   └── playwright-a11y.cjs
└── step_archive/
    ├── (조사·기획·구현 청크 18개)
    ├── outputs/eval_r{1,2,3}.md
    ├── screenshots/verify-*.png (9)
    └── research-raw-*.txt (8)
```

## 사용 안내 (한 줄)

```bash
node scripts/dev-server.cjs
# 브라우저로 http://localhost:5173/ 접속 — 5분이면 끝.
```
