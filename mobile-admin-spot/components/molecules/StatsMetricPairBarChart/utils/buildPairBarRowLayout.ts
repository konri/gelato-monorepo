const INACTIVE_BAR_COLOR = "#E5E7EB";
const SCALE_EPS = 1e-9;
const ZERO_STUB_FRACTION = 0.1;

type BuildPairBarRowLayoutInput = {
  current: number;
  previous: number;
  scaleMax: number;
  barAColor: string;
  barBColor: string;
};

type PairBarRowLayout = {
  a: number;
  b: number;
  va: number;
  vb: number;
  colorA: string;
  colorB: string;
};

export const buildPairBarRowLayout = ({
  current,
  previous,
  scaleMax,
  barAColor,
  barBColor,
}: BuildPairBarRowLayoutInput): PairBarRowLayout => {
  const a = Number.isFinite(current) ? current : 0;
  const b = Number.isFinite(previous) ? previous : 0;
  const maxAbs = Math.max(Math.abs(a), Math.abs(b), SCALE_EPS);
  let va = (Math.abs(a) / maxAbs) * scaleMax;
  let vb = (Math.abs(b) / maxAbs) * scaleMax;
  const zeroStub = scaleMax * ZERO_STUB_FRACTION;
  if (a > 0 && b === 0) {
    vb = Math.max(vb, zeroStub);
  }
  if (b > 0 && a === 0) {
    va = Math.max(va, zeroStub);
  }
  return {
    a,
    b,
    va,
    vb,
    colorA: a === 0 && b > 0 ? INACTIVE_BAR_COLOR : barAColor,
    colorB: b === 0 && a > 0 ? INACTIVE_BAR_COLOR : barBColor,
  };
};
