# Step 016 조사결과 — 대중 앱 사례 + 인터랙션 UX (chunk 2/2)

## 1. 대중 앱·일상 사례 (Wikipedia 1차 사료 + 일반인 번역)

각 항목은 위 wiki/scikit 원본 텍스트에 직접 등장한 응용을 초보자가 친숙한 앱·서비스로 1단계 번역한 것이다. 사례는 "실제 그 앱이 k-means만을 쓴다"는 주장이 아니라, **k-means가 정확히 어떤 종류의 결정을 도와주는지** 를 보여주는 도메인 매칭이다.

| 영역 (출처 인용) | 일반인 친숙 사례 | 한 줄 설명 |
|:---|:---|:---|
| Image color quantization — "reducing the color palette of an image to a fixed number of colors" (Wikipedia) | **Instagram/카메라 앱의 자동 색감/필터 추출**, **PNG/GIF 최적화 도구** | 사진에 등장한 수백만 색을 k=16~32개 대표색으로 압축 |
| Market segmentation — "segment its customer base into distinct groups based on factors such as purchasing behavior, demographics, and geographic location" (Wikipedia) | **쿠팡/배민의 고객 군집화**, **이메일 마케팅 세분화** | 비슷한 구매 패턴 사용자끼리 묶어 같은 쿠폰 발송 |
| Computer vision / image segmentation (Wikipedia) | **휴대폰 카메라의 인물 분리(보케)**, **포토샵 매직 완드** | 같은 색·질감 픽셀끼리 묶어 영역 자동 추출 |
| Astronomy — "automatically identify distinct stellar populations" (APOGEE, Gaia) | **천문 데이터 셋 분류** | 별의 광도·온도·색·화학 조성으로 별 종류 분류 |
| Biological gene expression clustering (Wikipedia) | **유전자 발현 히트맵** | 발현 패턴이 비슷한 유전자끼리 묶어 동시-조절 그룹 발견 |
| NLP feature learning — "named-entity recognition" (Wikipedia) | 검색엔진의 의미 군집 | 단어 임베딩을 묶어 의미 카테고리 추출 |

→ 튜토리얼 마지막 카드 "5. 어디에 쓰이나" 6개 카드에 그대로 매핑.

## 2. 인터랙티브 시각화 UX 패턴 (naftaliharris 2014 블로그 분석)

naftaliharris의 페이지(원본 9,280B)는 **k-means 인터랙티브 시각화의 사실상 정전(canon)** 이다. 본 튜토리얼이 차용할 핵심 UX 요소:

1. **데이터셋 토글** — Gaussian Mixture / Packed Circles / Smiley / Pimpled Smiley 등을 사용자가 선택. 본 튜토리얼은 초보자 대상이므로 **3종**으로 축약: "잘 되는 경우(가우시안 혼합) / 까다로운 경우(꼬리 긴 분포) / 실패하는 경우(스마일 모양)".
2. **초기화 전략 토글** — "I'll Choose / Randomly / Farthest Point". 본 튜토리얼은 "랜덤 / 멀리멀리(farthest) / 직접 클릭" 3종.
3. **두 단계 분리 버튼** — 한 번에 다 돌리지 않고 사용자가 ① Reassign Points ② Update Centroids 를 **각각 클릭**해서 알고리즘이 어떻게 진행하는지 직접 손에 잡히게 한다.
4. **Voronoi 다이어그램 음영** — "I've also shaded subregions depending on which centroid they are closest to. This is called a Voronoi diagram." → 평면을 centroid별 영역으로 색칠.
5. **자동 수렴 검출** — "the centroids stop moving" 이 되면 "수렴 완료" 콜아웃 표시.
6. **불변량 표시** — SSE(Sum of Squared Errors)가 매 단계 단조 감소함을 막대그래프 / 숫자 카운터로 함께 보여 "왜 수렴하는가"를 실시간 증명.

## 3. 본 튜토리얼 UX 적용 결정 (다음 step 기획 단계로 위임)

| UX 요소 | 본 튜토리얼 적용안 | 근거 |
|:---|:---|:---|
| 캔버스 | 2D `<canvas>` 600×400 + 우측 컨트롤 패널 | naftaliharris와 동일한 정전 패턴 |
| 데이터셋 | 3종 (Blobs / Moons / Smiley) | 초보자 학습용으로 가짓수 축약 |
| k 슬라이더 | 1~6 | naftaliharris의 무제한 k는 초보 혼란 |
| 초기화 토글 | random / farthest / 직접 클릭 | 사용자 능동 학습 |
| Step 버튼 | "할당 ▸ 평균 갱신 ▸ 한꺼번에 1회 ▸ 끝까지" | 한 번에 다 돌리지 않고 분리 |
| 시각화 | 점 + centroid + Voronoi 음영 + 이전 centroid 잔상 | 알고리즘 동작 이해 |
| 텍스트 | 단계별 카드 5장 (정의 / 알고리즘 / 초기화 / 한계 / 어디에 쓰이나) | step023 디자인 분석에서 확정 |

## 4. 데이터 사실성 게이트

- 이 청크에 등장한 모든 인용은 위 4개 raw txt 파일에서 직접 grep 가능 (사전지식 0%).
- 응용 사례 → 일반인 사례 번역은 **"k-means가 풀 수 있는 문제 종류"** 매칭이지, 특정 회사가 k-means만 쓴다는 주장이 아님. 튜토리얼 본문에서도 이 톤을 유지.

## CoVe

- [x] 핵심 3가지(k-means 정의/단계, 대중 앱 사례, 시각화 UX 패턴) 모두 청크에 기록
- [x] 각 청크 ≤ 500줄
- [x] 후속 step에서 grep으로 즉시 참조 가능
