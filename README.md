# k-평균 산책 — 5분이면 손에 잡히는 k-means 인터랙티브 튜토리얼

k-평균(k-means) 클러스터링 알고리즘을 **직접 클릭하며** 5분 만에 익히는 한국어 인터랙티브 웹 튜토리얼.
Vanilla JavaScript + Canvas 2D · 의존성 0 · 번들 41.8 KB.

## 라이브 데모

배포 후: `https://<owner>.github.io/<repo>/`

## 학습 목표

1. k-means가 무엇을 푸는 알고리즘인지 한 줄로 말한다
2. "할당 → 평균 갱신" 두 단계를 직접 시연하고 수렴 의미를 설명한다
3. 초기화 방법(random / farthest / 직접 클릭)에 따른 결과 차이를 본다
4. k-means가 못 푸는 데이터 모양(스마일)을 예로 든다
5. 일상 앱에서 k-means가 등장하는 사례 2가지 이상을 안다

## 기술 스택

- Vanilla ES Modules + Canvas 2D
- 시드 PRNG (xorshift32) 으로 재현 가능한 데이터셋
- Float32Array struct-of-arrays
- 보로노이 음영은 56×40 격자 nearest-centroid

## 로컬 실행

```bash
node scripts/dev-server.cjs
# http://localhost:5173/
```

## 빌드 (GitHub Pages)

```bash
node scripts/build-pages.cjs
# dist/index.html + dist/src/* + dist/.nojekyll
```

## 검증

```bash
npm test                          # Vitest 23 PASS
node scripts/playwright-verify.cjs   # E2E 3 viewports
node scripts/playwright-a11y.cjs     # axe 0 violations
```

## 출처

- Wikipedia, "k-means clustering" / "Cluster analysis"
- Naftali Harris, "Visualizing K-Means Clustering" (2014)
- scikit-learn 1.8 §2.3 Clustering
- distill.pub (인터랙션 UX 패턴)
