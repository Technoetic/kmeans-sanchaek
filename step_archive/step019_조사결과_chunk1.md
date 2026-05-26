# Step 019 - 참고 레포 클론·코드 분석 (chunk 1/1)

## 참고 레포 (실제 다운로드한 파일 기준)

| 파일 | LOC | 출처 | 분석 결과 |
|:---|---:|:---|:---|
| step_archive/research-raw-d3-kmeans-js.txt | 211 | nl-hugo/d3-kmeans/kmeans.js | D3 v3 SVG, 211줄 단일파일 |

## 코드 패턴 (참고만, 복사 0%)

- 거리 함수: `Math.sqrt(dx²+dy²)` — 단순. 본 튜토리얼은 sqrt 생략한 squared distance 사용해 비용 절감 (비교 결과 동일).
- 점 생성: `{x:rand*w, y:rand*h, type, fill}` — 본 튜토리얼은 좌표(x,y)만 저장, 색상은 별도 팔레트 lookup으로 분리.
- 반복 종료: `iter < maxIter` — 본 튜토리얼은 추가로 `isConverged(prev,next,eps=1e-3)` 도입해 조기 종료.

## 본 튜토리얼이 도입할 보강 패턴

1. **Float32Array** 좌표 평면(Struct of Arrays) — JS object 배열보다 캐시 친화·GC 부담↓
2. **시드 PRNG (xorshift)** — 같은 시드로 동일 결과 재현 가능 (튜토리얼 디버깅·테스트에 필수)
3. **불변 스냅샷 저장** — 매 단계마다 `{iter, centroids, labels, sse}` 캡처 → "되돌리기" 버튼 구현 기반

## CoVe

- [x] 실제 참고 코드 다운로드 + 분석
- [x] 본 튜토리얼이 차용/거부할 패턴 명시
