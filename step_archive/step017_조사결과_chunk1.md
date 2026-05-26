# Step 017 GitHub 조사결과 — k-means 인터랙티브 시각화 레포 (chunk 1/1)

수집: 2026-05-20T12:09 KST · GitHub Search API v3 (Bash curl)

## 검색 쿼리

1. `k-means+visualization+interactive+language:JavaScript&sort=stars` → 19 repos
2. `kmeans+clustering+visualization&sort=stars` → 1,038 repos (상위 10만 발췌)

## 주요 참고 후보 (top by stars / 관련도)

| Repo | ⭐ | Lang | 설명 (잘림) |
|:---|---:|:---|:---|
| Ritabrata04/Hybrid-Approach-To-Depression-Detection | 19 | Python | 의료 ML — 본 튜토리얼 범위 밖 |
| NhanPhamThanh-IT/KMeans-Clustering-Customer-Segmentation | 16 | Jupyter | Streamlit 고객 세분화 |
| Priyanshu-Shah/AlgoViz | 8 | JS | poly reg/KNN/DT/SVM/ANN/K-means 통합 visualizer |
| **nl-hugo/d3-kmeans** | 8 | **JS** | **D3.js로 k-means 시각화. 211줄 단일 파일, 가장 본 튜토리얼에 가까운 형태** |
| Viliami/kmeans-cluster | 8 | Python | matplotlib |
| karangale/kmeans_clustering_tutorial | 0 | JS | GitHub Pages 호스팅된 인터랙티브 튜토리얼 (homepage: karangale.github.io/kmeans_clustering_tutorial/) |
| HadisZare12/kmeans-visualization | 0 | - | 별도 분석 가치 낮음 |

## 가장 유사한 사례 1차 분석: nl-hugo/d3-kmeans

- 파일 구성: `index.html` 665B + `kmeans.css` 384B + `kmeans.js` **211 LOC** + media/
- 라이선스: README에서 명시되지 않음 → 본 튜토리얼은 **코드 복사 0%**, 아이디어만 참조.
- 핵심 함수 (raw 다운로드 확인):
  - `getEuclidianDistance(a,b)` — 유클리드 거리
  - `getRandomPoint(type, fill)` — 무작위 점 생성
  - 211줄 안에서 k-means 전체 동작 + D3 SVG 렌더링 완결
- 의존성: D3 v3 (구버전 `d3.scale.category20()`).
- 인터랙션: 자동 반복 시각화 위주. **사용자 step-by-step 제어는 없음** → 본 튜토리얼이 추가할 차별점.

## 본 튜토리얼이 차별화할 요소 (선행작과의 GAP 분석)

| 항목 | nl-hugo/d3-kmeans (2015) | naftaliharris (2014) | 본 튜토리얼 (2026) |
|:---|:---|:---|:---|
| 의존성 | D3 v3 | jQuery + D3 v3 | **0개 (Vanilla JS + Canvas)** |
| 알고리즘 단계 분리 클릭 | ✗ | ✓ | ✓ |
| 초기화 토글 | ✗ | random/farthest | random/farthest + **직접 클릭** |
| Voronoi 음영 | ✗ | ✓ | ✓ |
| SSE 실시간 그래프 | ✗ | ✗ | **✓ (수렴성 증명) — 차별점** |
| 한국어 1차 학습 자료 | ✗ | 영어 | **✓ — 차별점** |
| 모바일 반응형 | ✗ | △ | **✓** |
| 대중 앱 사례 카드 | ✗ | ✗ | **✓ — 차별점** |
| 접근성 (a11y) | △ | △ | **✓ axe 0 위반 목표** |

## CoVe

- [x] GitHub Search API 실제 호출 (19 + 1,038 repos)
- [x] 가장 유사한 1건은 raw 파일까지 받아 검증
- [x] 후속 step에서 grep 가능 형식

## 출처 파일

- step_archive/research-raw-d3-kmeans-js.txt (211 LOC, nl-hugo/d3-kmeans 원본 다운로드)
