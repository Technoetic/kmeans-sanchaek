# Step 016 조사결과 — k-평균 알고리즘 도메인 (chunk 1/2)

수집: 2026-05-20T12:06 KST · Playwright 1.60.0 chromium · 4 URL 병렬

## 출처 (스크린샷 + 원본 txt 동봉)

| ID | URL | TITLE | raw size |
|:---|:---|:---|---:|
| wiki-kmeans | https://en.wikipedia.org/wiki/K-means_clustering | k-means clustering - Wikipedia | 63,800B |
| scikit-kmeans | https://scikit-learn.org/stable/modules/clustering.html#k-means | 2.3. Clustering — scikit-learn 1.8.0 | 61,365B |
| naftaliharris | https://www.naftaliharris.com/blog/visualizing-k-means-clustering/ | Visualizing K-Means Clustering | 9,280B |
| distill-pca-vs-kmeans | https://en.wikipedia.org/wiki/Cluster_analysis | Cluster analysis - Wikipedia | 71,289B |

스크린샷: `step_archive/screenshots/research-<id>.png`
원본: `step_archive/research-raw-<id>.txt`

## 핵심 정의 (Wikipedia 직인용)

> "k-means clustering is a method of vector quantization, originally from signal processing, that aims to partition n observations into k clusters in which each observation belongs to the cluster with the **nearest mean** (cluster centers or cluster centroid). This results in a partitioning of the data space into **Voronoi cells**. k-means clustering **minimizes within-cluster variances (squared Euclidean distances)**."

→ 튜토리얼 본문 1단계 "무엇을 푸는 알고리즘인가" 카드의 정의문으로 그대로 사용.

## 표준 알고리즘 (Lloyd, naftaliharris 인용)

> "The algorithm then proceeds in two alternating parts:
> - **Reassign Points step**: assign every point to the cluster whose centroid is nearest to it.
> - **Update Centroids step**: recalculate each centroid's location as the **mean of all the points assigned to its cluster**.
> We then iterate these steps **until the centroids stop moving**, or equivalently until the points stop switching clusters."

수렴성 증명 개요(같은 출처):
> "The sum of squared distances between each point and its centroid strictly decreases in both the Reassign Points and Update Centroids steps, and there are only finitely many cluster configurations."

→ 튜토리얼 시각화 단계 카드 4종(① k 정하기 / ② 초기 centroid / ③ 할당 / ④ 평균 갱신) 그대로 매핑.

## 초기화 전략 (naftaliharris)

| 방법 | 동작 | 약점 |
|:---|:---|:---|
| Random pick | 데이터 점에서 k개 무작위 선택 | k!/k^k ≈ e^-k·√(2πk) — k가 클수록 같은 진짜 클러스터에 모일 확률↑ |
| Farthest Point | 첫 centroid 무작위, 이후 j-th는 직전 centroid들과 최소거리가 최대인 점 | 종종 클러스터 가장자리에 위치 |
| **k-means++** | 거리² 비례 확률로 다음 centroid 선택 | 기대 SSE가 최적의 O(log k) 이내 (Arthur–Vassilvitskii 2007) |

→ 튜토리얼 인터랙션: 초기화 토글(Random / Farthest)을 사용자에게 제공.

## 한계 및 주의 (Wikipedia + naftaliharris)

- 로컬 최저점에 빠질 수 있음 → 같은 데이터/같은 k라도 init에 따라 결과 변동.
- 등크기·구형 클러스터 가정 → "Smiley"·"Pimpled Smiley" 같은 비선형 모양에서 실패.
- 빈 클러스터: 어떤 centroid에 한 점도 할당되지 않을 수 있음 → 구현체별로 (유지 / 삭제 / 재배치) 처리.
- k를 사전에 알아야 함 → 실무에서는 elbow method 또는 silhouette 분석으로 추정 ("elbow의 정의가 모호해 비신뢰적" — Wikipedia).

→ 튜토리얼 "주의" 콜아웃 카드 3개에 그대로 반영.

## scikit-learn KMeans 표준 API (원본 txt 인용)

- 클래스 위치: `sklearn.cluster.KMeans`
- fit 후 학습 결과: `labels_` 속성
- 입력 행렬: `(n_samples, n_features)` 표준 데이터 매트릭스
- 적합 상황: "General-purpose, **even cluster size, flat geometry, not too many clusters**, inductive"
- 부적합 상황: "non-flat geometry, uneven cluster sizes, variable cluster density"
- 대용량용 변종: `MiniBatchKMeans` ("Very large n_samples, medium n_clusters")

→ 튜토리얼 마지막 카드 "실무에서 어떻게 쓰는가" 섹션에 인용 처리 (출처 footnote 포함).

## 응용 도메인 (Wikipedia 직인용)

> "It has been successfully used in **market segmentation, computer vision, and astronomy** among many other domains."

> "Clustering is widely used in **biological data analysis** to identify patterns in high-dimensional datasets such as gene expression profiles and genomic interaction matrices."

> "K-means has also been combined with **dimensionality reduction techniques** to classify large numbers of **unlabeled survey objects by separating stars, galaxies, and quasars** based on their observed light properties."

→ 튜토리얼 "대중 앱 사례" 섹션의 시드. 다음 청크에서 일반인 친숙 사례로 재가공.
