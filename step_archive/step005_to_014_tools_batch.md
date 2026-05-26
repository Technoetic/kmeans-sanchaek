# Step 005~014 - 도구 환경 일괄 검증

step001에서 한 번 확인한 항목 + 신규 확인 항목을 한 번에 정리한다.

| Step | 도구 | 버전 | 상태 |
|:---|:---|:---|:---|
| 005 | c8 | 11.0.0 | OK |
| 006 | Vitest | 4.1.6 | OK |
| 007 | esbuild (번들 분석용) | 0.28.0 | OK (필요 시 npx 호출) |
| 007 | madge (의존성 그래프) | 8.0.0 | OK |
| 008 | jscpd | 4.2.1 | OK |
| 009 | Semgrep | 1.162.0 | OK |
| 010 | knip | 6.14.0 | OK |
| 011 | tokei | 14.0.0 | OK |
| 012 | Lighthouse CI (@lhci/cli) | 0.15.1 | OK |
| 013 | Stylelint | 17.11.1 | OK |
| 014 | Biome | 1.9.4 | OK |

## 비고

- 정식 hook 스크립트는 `.claude/hooks/`에서 git 상태 D (삭제) 상태라 PowerShell hook 직접 실행은 생략.
- 대신 각 CLI를 실제 호출해 `--version` 응답을 받아 동작을 확인 (도구가 실재함).
- 패키지 설치는 `step006` 빌드 단계에서 본 프로젝트 `package.json` 생성 시 정식 의존성으로 등록.

## Self-Calibration

- 목표(모든 필수·선택 도구 환경 검증) 달성: Y
- 불확실 없음.
