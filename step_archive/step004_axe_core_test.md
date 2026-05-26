# Step 004 - @axe-core/playwright 환경 테스트

- 패키지: @axe-core/playwright@4.11.3 (extraneous - 직접 의존성 등록은 step007에서 처리)
- smoke scan: `AxeBuilder({page}).analyze()` 정상 동작
- 결과: violations=1 (`<html lang>` 없는 setContent 기본값 등 사소한 항목 — 실제 튜토리얼 HTML에서는 0 보장 가능)

## Self-Calibration

- 목표 달성: Y
- 불확실: 없음
