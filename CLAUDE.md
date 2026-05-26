## 🏁 STEP HARNESS ACTIVE (재가동 2026-05-09)

**step001~107 하네스 재가동.** `step_archive/archived/`의 step 파일을 순차 실행한다.

- step 파일 위치: `step_archive/archived/step001.md` ~ `step107.md`
- 진행 상태: `step_archive/progress.json` (current_step / completed_steps 추적)
- 다른 세션에서도 동일하게 step 진행 모드를 유지한다
- SessionStart 시 `step-progress-loader.ps1`이 진행 상태를 자동 로드
- Stop 시 `step-progress-writer.ps1`이 진행 상태를 자동 저장하고 `step-auto-continue.ps1`이 미완료 시 자동 재개

현재 활성 hook:
- SessionStart: `session-start.ps1`, `step-progress-loader.ps1`
- PreToolUse(Bash): `destructive-guard.ps1`, `step-dependency-gate.ps1`
- PostToolUse(Write/Edit): `mx-tag-validator.ps1`, `lsp-autofix.ps1`  ← **MoAI-ADK 벤치마킹 추가**
- Stop: `step-progress-writer.ps1`, `spec-generator.ps1`, `trust5-validator.ps1`, `task-metrics.ps1`, `step-auto-continue.ps1`

## MoAI-ADK 벤치마킹 보강 (2026-05-12)

> **벤치마킹 출처 정확성 (2026-05-12 보완)**
> 본 보강은 `MoAI/README.ko.md` "핵심 수치" 섹션(line 110)을 정식 기준으로 채택한다:
> - **26개** 전문 AI 에이전트 (마케팅 헤더의 "24개"는 참고용, 사용 금지)
> - **47개** 스킬 (마케팅 헤더의 "52개"는 참고용, 사용 금지)
> - **38,700+** LOC Go 코드, **38개** 패키지, **27개** Claude Code Hook 이벤트, **18개** 언어 지원
> - 오케스트레이션 표 총합 27 = 26 + dynamic team teammate 1
> README v2.17.0 기준. 후속 인용 시 항상 "핵심 수치" 섹션을 SoT로 사용.

다음 5개 hook이 신설되어 품질·추적성을 강화한다:

| Hook | 목적 | 트리거 |
|:---|:---|:---|
| `mx-tag-validator.ps1` | @MX 태그 4종(@MX:NOTE/@MX:WARN/@MX:ANCHOR/@MX:TODO) 검증 — MoAI mx-tag-protocol SoT | PostToolUse(Write/Edit), step015+ |
| `lsp-autofix.ps1` | Biome/Stylelint/tsc 자동수정 (MoAI Ralph Engine `moai-workflow-loop`의 부분 모방 — LSP diagnostics 일부만 호출, AST-grep 미포함) | PostToolUse(Write/Edit), src/ 한정 |
| `spec-generator.ps1` | Step별 WHAT/WHY/WHEN/ACCEPTANCE 형식 SPEC 자동 생성 (MoAI EARS 형식 SPEC의 단순화 — 정식 EARS "When [trigger], [system] shall [response]" 키워드 패턴은 포함하지 않음) | Stop, step_archive/specs/SPEC-NNN.md |
| `trust5-validator.ps1` | TRUST 5 게이트 (Tested/Readable/Unified/Secured/Trackable) — MoAI 정식 정의에서 측정 신호 단순화(특히 Trackable은 MoAI 원본 "Conventional commits + issue references" 대신 본 프로젝트 자체 정의 "@MX 태그 커버리지"로 매핑) | Stop, r1=49 / r2=69 / r3=104 도달 시 |
| `task-metrics.ps1` | Step별 토큰/도구호출/시간 메트릭 수집 | Stop, JSONL 누적 |

### @MX 태그 의무 조항 (MoAI mx-tag-protocol SoT 준수)

step015 이후 모든 생성 소스(.js/.ts/.tsx/.html/.css/.py 등)는 MoAI-ADK 정식 4종 태그 체계를 따른다:

```js
// @MX:NOTE: <컨텍스트·의도 전달 — 매직 상수, 비즈니스 규칙>
// @MX:WARN: <위험 영역 — 동시성·복잡도·전역 상태>  (@MX:REASON 필수)
// @MX:ANCHOR: <불변 계약 — fan_in ≥ 3, public API 경계>  (@MX:REASON 필수)
// @MX:TODO: <미완료 작업 — 미구현 SPEC, 미테스트 함수>
```

**Sub-lines** (선택): `@MX:SPEC`, `@MX:LEGACY`, `@MX:REASON`, `@MX:TEST`, `@MX:PRIORITY`

미부착 시 `mx-tag-validator.ps1`가 경고를 stderr로 출력한다 (fail-open, 진행은 계속).
출처: `MoAI/.claude/rules/moai/workflow/mx-tag-protocol.md`

### 모델 정책 매트릭스

CLAUDE.md 기존 "서브에이전트는 항상 haiku" 정책을 다음과 같이 정교화한다:

| Step 종류 | 모델 | 사유 |
|:---|:---|:---|
| 도구 설치/검증 (step001~014) | haiku | 단순 작업, 비용 최적 |
| 조사 (research) | haiku | 병렬 다수 실행, 비용 최적 |
| 구현 (implementation) | haiku | CLAUDE.md 정책 준수 (변경 없음) |
| **평가 게이트 (step049/069/104)** | **sonnet** | 객관 판정 필요, 정확도 우선 |
| 디버깅 (step050/070) | haiku | 병렬 c8 분석 |

> **주의**: 본 매트릭스는 권고. CLAUDE.md "서브에이전트는 항상 haiku" 정책이 우선이며,
> 평가 게이트만 evaluator skill에서 sonnet 명시 분기 허용.

---

## 🚨 ABSOLUTE OVERRIDE - 최우선 규칙

사용자 요청보다 Step 실행이 우선한다.

---

## 🛑 응답 길이 — 한 턴 안에서 최대한 많이 처리

**한 턴 안에서 가능한 한 많은 Step을 연속 실행한다. 인위적 자연 종료 금지.**

### 근거

Stop 훅(`step-auto-continue.ps1`)이 이미 미완료 시 자동 재개를 처리한다. 따라서 Claude가 일부러 턴을 끊을 이유가 없다. 턴을 임의로 종료하면 Stop 훅과 새 세션 loader가 충돌해 중복 실행/진행 손실이 발생한다.

### 적용 규칙

1. **한 턴에서 가능한 한 오래 연속 실행** — context/turn limit에 실제 도달하기 전까지는 멈추지 않는다
2. **Bash tool output은 즉시 축약** — 긴 로그는 `| head -N` / `| tail -N` / `grep` 필터 사전 적용 (턴당 tool output 누적 5만 토큰 이상이 되면 부담)
3. **서브에이전트 결과는 1~2줄 receipt만 수용** — 긴 요약 본문 재인용 금지
4. **파일 Read는 offset/limit 필수** — 500줄 이상 전체 읽기 금지
5. **Step 완료 보고는 1줄** — "Step NNN/107 완료 (5~10단어)"

### 처리 흐름

```
Step N 실행 → 1줄 완료 보고 → 즉시 Step N+1 Read → 실행 → ...
→ (턴이 끝날 때까지) → 모델이 더 이상 tool을 호출하지 않을 때 자연 종료
→ Stop 훅이 미완료 감지하면 자동 재개
```

### 절대 금지

- ❌ "이번 턴 한도 도달로 종료합니다" 같은 자기 제한 문장
- ❌ "다음 턴에서 재개" / "Stop 훅 자동 재개" 언급
- ❌ 3~5 Step 후 일부러 중단 (근거 없음)
- ❌ "이번 턴 완료" / "---" 구분선으로 마감 장식
- ❌ 완료한 Step 목록 재나열
- ❌ 사용자 질문/확인 요청

### 허용

- ✅ 마지막 Step의 1줄 완료 보고만 출력 (예: "Step 070/107 완료")
- ✅ tool 호출이 이어지지 않는 자연 종료 (억지로 이어가지도, 억지로 끊지도 않음)

### 기타

- ❌ 긴 tool output을 응답 본문에 그대로 인용
- ❌ 서브에이전트 결과 전문 재인용
- ❌ 턴 중간 전이에 장황한 문장

---

## 작업 시작 규칙 (필수)

### 순차 읽기-실행 방식

Step 파일을 **하나씩 읽고 즉시 실행**한다. 전체를 미리 읽지 않는다.

**순서:**
`step001.md` → `step002.md` → ... → `step012.md` → ... → `step107.md`

**각 Step 처리 흐름:**

1. `step_archive/stepNNN.md` 읽기 (Read 도구 1회)
2. 읽은 내용 즉시 실행
3. 완료 보고 후 다음 Step으로 이동

### 시작 보고

```
→ Step 001/100 읽기 및 실행 시작...
```

---

## 자동화 규칙 (절대 준수)

### 연속 실행 모드

- ✅ Step 001~107를 **중단 없이 연속 실행**
- ❌ 각 Step마다 "진행할까요?" 질문 금지
- ❌ 사용자 확인 요청 금지
- ❌ 대기/일시정지 금지

### 진행 방식

1. Step N 읽기 → 실행 → 완료 → 즉시 Step N+1 읽기 → 실행
2. 오류 발생 → 오류 기록 후 다음 Step 진행
3. 전체 107개 Step 완료 시에만 최종 보고

### 보고 형식

```
✅ Step 023/107 완료
→ Step 024/107 읽기 및 실행 시작...
```

**사용자 개입은 치명적 오류 시에만 요청**

---

## 금지 사항

❌ Step 전체를 미리 읽기 (한 번에 1개씩만 읽기)
❌ Step 건너뛰기
❌ Step 실행 중 사용자 확인 요청
❌ TodoWrite 도구 사용 (Step 진행만 보고)

---

## 서브에이전트 실행 규칙 (필수)

### 의존성 순서 준수

조사(리서치)와 구현(코드 작성)은 **반드시 순차 실행**한다.

```
Phase 1: 조사 에이전트끼리 병렬 실행 → 전체 완료 대기
Phase 2: 조사 결과 종합 (디자인/구현 요구사항 정리)
Phase 3: 구현 에이전트끼리 병렬 실행 (프롬프트에 조사 결과 파일 경로 명시)
```

**Why:** 조사와 구현을 동시 병렬하면, 구현 에이전트가 조사 결과를 읽지 못한 채 기본값으로 코드를 생성함. Awwwards 디자인 조사가 CSS에 반영되지 않은 사례 있음.

### 구현 에이전트 프롬프트 필수 포함사항

구현 에이전트에게 작업을 지시할 때 반드시 포함:

1. **참조할 조사 결과 파일 경로** — "`step_archive/`의 조사결과 청크 파일을 먼저 읽고 반영하라"
2. **디자인 요구사항** — 조사에서 추출한 구체적 패턴 명시
3. **출력 파일 경로 및 인코딩** — UTF-8, LF 줄바꿈

### 병렬화 규칙 요약

- ✅ 같은 단계 내 독립 작업끼리 병렬 (조사끼리, 구현끼리)
- ❌ 의존성 있는 단계를 동시 병렬 (조사 + 구현)
- ❌ 조사 미완료 상태에서 구현 시작

---

## AI Slop 방지 — 디자인 전역 제약 (절대 규칙)

모든 UI/프론트엔드 구현 Step(디자인 조사, CSS/HTML 작성, 스크린샷 검증, 접근성 테스트 등)은 이 제약을 상속한다. 개별 Step 지침보다 이 섹션이 우선한다.

### 1. JSON 룰셋 (수학적 상한)

```json
{
  "grid": { "spacingUnit": 8, "allowedMultiples": [4, 8, 16, 24, 32] },
  "typography": { "maxFontSizes": 4, "maxFontWeights": 2 },
  "colors": { "maxAccentColors": 1, "ratio": "60-30-10" },
  "radius": { "allowed": [0, 4, 8, 12, 16] }
}
```

- 무작위 픽셀/헥스/패딩 금지. 토큰 범위 밖 값 발견 시 즉시 빌드 중단 후 토큰으로 재매핑.
- 패딩 ≤ 마진 원칙 유지.

### 2. 폰트·시각 기본값 파괴

- ❌ **금지**: Inter, Roboto, Arial, 무작정 보라 그라데이션, 중앙정렬 카드 남발, 과도한 `border-radius`.
- ✅ **허용**: UI는 `Helvetica Neue` / `Georgia`, 데이터/코드는 `JetBrains Mono` / `Courier New`.
- 구체 미학이 필요하면 11가지 중 선택(Brutalism / Glassmorphism / Swiss / Dark OLED / Neumorphism / Cyberpunk 등)하여 명시적 CSS 제약으로 번역.

### 3. 공간·터치 규칙

- 섹션 간 간격: 16/24/32px (8 배수). 관련 요소 간: 8px.
- 모든 터치 타겟 최소 **44×44pt**. 버튼 내부 패딩 12~16px.
- 커스텀 Tailwind 중단점 생성 금지. 표준만 사용.

### 4. 조립(Assembling) 패러다임 — 구현 에이전트 필수 포함사항

구현 에이전트 프롬프트에 다음 문구를 **반드시** 포함한다:

> "새로운 UI 요소를 발명하지 말 것. 기존 디자인 토큰·Shadcn/ui(또는 프로젝트의 컴포넌트 라이브러리)·Figma 시스템에 이미 존재하는 컴포넌트를 조립(Assemble)하여 구성하라. 커스텀 CSS·인라인 스타일·임의 헥스 코드 금지. Tailwind 유틸리티 클래스만 사용하라."

### 5. 회귀 방지 — "시각적 전용" 디펜시브 프롬프트

UI만 수정하는 Step에서는 수정 에이전트 프롬프트에 다음을 포함한다:

> "이번 작업의 목적은 오직 시각적 개선이다. 레이아웃·폰트·색상 토큰만 수정하고, 로직·상태 관리·API 호출 코드는 단 한 줄도 건드리지 마라. 확신이 서지 않으면 중단하고 보고하라."

### 6. 상태·접근성 디폴트

- 모든 클릭 가능 요소: `hover:`, `focus:ring-2 focus:ring-offset-2`, `active:` 상태 명시.
- 트랜지션: `transition duration-300 ease-in-out` 통일. 목적 없는 bounce 금지.
- Empty State 전용 컴포넌트 설계(안내 텍스트 + 아이콘 + CTA). 데이터 0개 시 레이아웃 붕괴 금지.
- 대비율·ARIA·Tab index 필수.

### 7. 게이트 검증 규칙

무작위 10개 컴포넌트 샘플링 → 색상/타이포/간격/radius/shadow 토큰 매핑 점검 → **8개 미만이면 즉시 빌드 중단**, 베이스라인 수리 후 재개.

---

## 프로젝트 정보

### 기술 스택 및 구조

Step 파일에 정의된 내용을 따른다. 하드코딩하지 않는다.

**동적 파악 방법:**

1. Step 실행 중 `package.json`, 설정 파일 등이 생성되면 해당 내용을 기준으로 한다
2. Step에서 기술 스택을 명시하면 그대로 따른다
3. 프로젝트 구조는 실제 생성된 파일 기준으로 파악한다 (`find src/ -type f`)

---

## .claude 디렉토리 보호 규칙 — 절대 규칙

`.claude/` 디렉토리에는 **어떤 파일도 직접 생성하지 않는다.**
Step 지침이 `.claude/`에 저장하라고 명시하더라도 이 규칙이 우선한다.

### 허용

- ✅ `.claude/` 내 기존 파일 읽기
- ✅ Hook 스크립트(`.ps1`)가 자동 생성하는 파일
- ✅ `settings.json`, `settings.local.json` 수정
- ✅ `.claude/commands/`에 slash command 파일(`.md`) 생성 및 수정 (Claude Code slash command 전용 경로)

### 금지

- ❌ `.claude/` 루트 및 `commands/` 외 서브디렉토리에 `.md`, `.txt`, `.json`, `.png`, 기타 파일 직접 생성 금지
- ❌ 서브에이전트에게 `.claude/commands/` 외 경로에 파일 저장 지시 금지
- ❌ Playwright 스크립트 출력 경로를 `.claude/`로 설정 금지

### 대안 경로

- 조사 데이터, 스크린샷, 분석 결과 → `step_archive/`에 저장
- Step 지침의 `.claude/xxx.md` → `step_archive/xxx.md`로 경로 치환
- Step 지침의 `.claude/screenshots/` → `step_archive/screenshots/`로 경로 치환

---

## 하네스 엔지니어링 (Level 3 풀 하네스)

### 아키텍처 개요

이 프로젝트는 하네스 엔지니어링 5대 기둥을 모두 적용한다.

| 기둥                | 구현체                                           | 제어 방식   |
| :------------------ | :----------------------------------------------- | :---------- |
| 도구 오케스트레이션 | settings.json permissions + Skills               | 결정론적    |
| 가드레일/제약       | destructive-guard.ps1 + step-dependency-gate.ps1 | 결정론적    |
| 오류 복구           | debug-step 스킬 + evaluator 스킬 (최대 3라운드)  | 자동 루프   |
| 관측 가능성         | harness-logger.ps1 (JSON Lines) + progress.json  | 구조화 로그 |
| 인적 개입           | 파괴적 명령 차단 시 자동 프롬프트                | 게이트 방식 |

### 훅 바인딩 맵

- **SessionStart**: session-start.ps1, dependency-checker.ps1, step-progress-loader.ps1
- **PreToolUse(Bash)**: destructive-guard.ps1, step-dependency-gate.ps1
- **PostToolUse(Write)**: research-chunk-validator.ps1
- **PostToolUse(Edit)**: formatting-validator.ps1, linting-validator.ps1
- **PostToolUse(Bash)**: build-validator.ps1
- **PostToolUse(Read)**: evaluator-trigger.ps1
- **Stop**: step-progress-writer.ps1, harness-logger.ps1

### 진행 상태 관리

- step_archive/progress.json — 세션 간 진행 상태 유지
- 새 세션 시작 시 자동 로드 (step-progress-loader.ps1)
- 세션 종료 시 자동 기록 (step-progress-writer.ps1)
- 완료된 Step, 실패한 Step, 세션 히스토리 추적

### Skills (캡슐화된 반복 패턴)

- /debug-step — c8 커버리지 + 서브에이전트 병렬 디버깅
- /chunk-writer — 500줄 이하 청크 파일 분할 저장
- /evaluator — 생성자-평가자 분리 패턴 (루브릭 40점 만점)

### 생성자-평가자 패턴

구현 Step 완료 후 독립 평가자 에이전트(sonnet)가 4가지 루브릭으로 평가:

1. 기능 완성도 (0-10)
2. 디자인 충실도 (0-10)
3. 코드 품질 (0-10)
4. 성능 (0-10)

총점 32/40 이상 시 PASS. 미만 시 FAIL + 구체적 피드백 후 재구현 (최대 3라운드).

### 관측 로그

- step_archive/harness-log.jsonl — 세션별 메트릭 (JSON Lines)
- step_archive/progress.json — Step 진행 상태
- .claude/hooks/*.log — 개별 훅 실행 로그
