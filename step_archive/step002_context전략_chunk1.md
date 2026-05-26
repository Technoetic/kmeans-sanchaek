# Step 002 - Context 최적화 전략 (chunk 1/1)

## 프로젝트 규모

- 분류: **SMALL (<100 files)**
- 실측 소스 파일(.html/.js/.css/.md): 24개 (node_modules·step_archive 제외)
- 루트: `CLAUDE.md` + `node_modules/` + `step_archive/` 이외 거의 비어 있음
- 결론: **새 프로젝트(green-field)** 로 간주. 외부 디자인 시스템·DB 마이그레이션 없음.

## 본 세션 목표 (사용자 명시)

> "k-평균 알고리즘" 인터랙티브 웹 튜토리얼 (초보자 학습용, 대중 앱 사례 참고, 직관적 이해).

step_archive/archived/ 하네스(step001~107)가 이 산출물 빌드를 감싸는 게이트로 작동한다.

## 서브에이전트 전략

| 단계 | 동시 서브에이전트 | 모델 | 비고 |
|:---|:---|:---|:---|
| 도구·환경 검증 (step001~014) | 0 (메인 직접) | haiku | 단순 verify |
| 디자인·도메인 조사 (step015~030) | 3~5 (병렬) | haiku | 조사끼리만 병렬 |
| 구현 (step031~048) | 3~5 (병렬) | haiku | 조사 결과 파일 경로를 프롬프트에 명시 |
| 평가 게이트 (step049/069/104) | 1 | **sonnet** | 객관 판정 우선 |
| 디버깅 (step050/070) | 최대 5 | haiku | c8 커버리지 병렬 분석 |

상한 10개, 90% context에서 메인→서브에이전트 위임.

## 파일 읽기 전략

1. **500줄 이상 파일 전체 읽기 금지**. Grep으로 위치 확인 후 offset/limit로 부분 Read.
2. **같은 파일 재읽기 금지**. 이미 읽은 파일은 메인 메모리/요약만 인용.
3. **node_modules/** 는 Glob/Read 모두 우회. 직접 패키지 동작 검증 필요 시 `npx ...` 명령 실행으로 대체.
4. tool output ≥ 80줄이면 `| head -N` / `| grep` 사전 적용.

## Context 예산

| 영역 | 한도 |
|:---|:---|
| 메인 에이전트 동시 열린 파일 인용 | 10개 이하 |
| 서브에이전트 1회 작업당 인용 파일 | 1~5개 |
| 한 턴 응답 본문 길이 | 80KB 미만 (Stop 훅 자동 재개와 충돌 방지) |
| 한 턴 tool output 누적 | 약 50,000 토큰 미만 |

## 청크 저장 정책 (이후 모든 조사·구현 결과)

- 파일명: `step_archive/stepNNN_<주제>_chunkM.md`
- 한 청크 ≤ 500줄, UTF-8 (BOM 없음), LF 줄바꿈
- 청크는 병합하지 않음 (research-validator 통과 유지)
- `.claude/`에는 어떤 산출물도 저장하지 않음 (전역 보호 규칙)

## 디자인 토큰 상한 (AI Slop 방지 — k-평균 튜토리얼 빌드 시 상속)

```json
{
  "grid": { "spacingUnit": 8, "allowedMultiples": [4, 8, 16, 24, 32] },
  "typography": { "maxFontSizes": 4, "maxFontWeights": 2 },
  "colors": { "maxAccentColors": 1, "ratio": "60-30-10" },
  "radius": { "allowed": [0, 4, 8, 12, 16] }
}
```

- 폰트: UI는 Helvetica Neue / Georgia, 데이터·코드는 JetBrains Mono / Courier New.
- 금지: Inter / Roboto / Arial, 보라색 그라데이션, 무작정 중앙정렬, 큰 radius.
- 터치 타겟 ≥ 44×44pt, 표준 Tailwind 중단점만 사용.

## CoVe 결과

- [x] 핵심 3가지(규모/스택/출력 위치) 조사 완료
- [x] 결과 청크 저장 완료 (이 파일)
- [x] 이후 Step에서 참조 가능한 형식 (표·JSON·체크리스트)
