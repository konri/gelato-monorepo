/**
 * Code 128, code set B (ISO/IEC 15417), hand-written (BRANDS_SPEC §5.4).
 *
 * The loyalty code alphabet (`GL-` / `PR-` + A–Z, 2–9) is entirely in set B,
 * so a single-set encoder is enough. Verified against jsbarcode (a dev-only
 * oracle) by `scripts/verify-code128.js`.
 *
 * No runtime imports: the verify script loads this file in plain Node.
 */

/**
 * Bar/space widths (in modules) of every symbol value 0..106, starting with a
 * bar. 103/104/105 are START A/B/C, 106 is STOP (7 elements, 13 modules).
 */
const PATTERNS: readonly string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];

export const START_B = 104;
export const STOP = 106;
/** Minimum quiet zone on each side, in modules (spec: 10). */
export const QUIET_ZONE_MODULES = 10;

/** True when every character can be encoded in code set B (ASCII 32..126). */
export const isCode128BEncodable = (text: string): boolean =>
  text.length > 0 && /^[\x20-\x7E]+$/.test(text);

/** Symbol values: START B, data, checksum, STOP. */
export function code128BValues(text: string): number[] {
  if (!isCode128BEncodable(text)) throw new RangeError('CODE128B_CHAR');
  const values = [START_B];
  for (let i = 0; i < text.length; i += 1) values.push(text.charCodeAt(i) - 32);
  let sum = START_B;
  for (let i = 1; i < values.length; i += 1) sum += values[i] * i;
  values.push(sum % 103, STOP);
  return values;
}

/** The checksum symbol value (for tests: `GL-ABCD2345` → 29). */
export const code128BChecksum = (text: string): number => {
  const values = code128BValues(text);
  return values[values.length - 2];
};

/**
 * Encodes `text` as a module string: '1' = bar, '0' = space, one character per
 * module, WITHOUT quiet zones. 11 characters give 156 modules.
 */
export function encodeCode128B(text: string): string {
  let bits = '';
  for (const value of code128BValues(text)) {
    let bar = true;
    for (const width of PATTERNS[value]) {
      bits += (bar ? '1' : '0').repeat(Number(width));
      bar = !bar;
    }
  }
  return bits;
}

/** Bars as [startModule, widthModules] runs (no quiet zone offset). */
export function barRuns(bits: string): [number, number][] {
  const runs: [number, number][] = [];
  let i = 0;
  while (i < bits.length) {
    if (bits[i] === '1') {
      const start = i;
      while (i < bits.length && bits[i] === '1') i += 1;
      runs.push([start, i - start]);
    } else {
      i += 1;
    }
  }
  return runs;
}

export type BarcodeLayout = {
  /** Width of one module in device pixels (whole number). */
  modulePx: number;
  /** Width of one module in layout points (modulePx / pixelRatio). */
  modulePt: number;
  /** Modules including both quiet zones. */
  totalModules: number;
  /** Total symbol width in points (a whole number of device pixels). */
  widthPt: number;
};

/**
 * Pixel-snapped layout: every module is a whole number of device pixels, so
 * bars never blur. Returns null when a module would be under `minModulePx`
 * (the caller falls back to the QR code).
 */
export function layoutCode128(
  moduleCount: number,
  maxWidthPt: number,
  pixelRatio: number,
  minModulePx = 2,
): BarcodeLayout | null {
  const totalModules = moduleCount + 2 * QUIET_ZONE_MODULES;
  if (!(maxWidthPt > 0) || !(pixelRatio > 0) || totalModules <= 0) return null;
  const modulePx = Math.floor((maxWidthPt * pixelRatio) / totalModules);
  if (modulePx < minModulePx) return null;
  const modulePt = modulePx / pixelRatio;
  return { modulePx, modulePt, totalModules, widthPt: (totalModules * modulePx) / pixelRatio };
}
