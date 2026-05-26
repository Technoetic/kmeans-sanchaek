// @MX:NOTE: xorshift32 시드 PRNG — 같은 시드 → 같은 데이터 → 학습자 재현성 보장
// @MX:ANCHOR fan_in≥3: datasets.js, kmeans.js(initCentroids:random), tests
// @MX:REASON 표준 Math.random은 시드 불가 → 튜토리얼/테스트가 매번 달라져 학습 방해

export function createRng(seed = 0x9e3779b9) {
  let s = seed | 0;
  if (s === 0) s = 0x9e3779b9;
  return function next() {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    // [0,1)
    return (s >>> 0) / 0x100000000;
  };
}

export function rngRange(rng, lo, hi) {
  return lo + rng() * (hi - lo);
}

export function rngInt(rng, n) {
  return Math.floor(rng() * n);
}
