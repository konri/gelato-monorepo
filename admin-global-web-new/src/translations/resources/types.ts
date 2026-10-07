import type en from './en';

/** Same shape as `en`, with string values (so a translation can differ). */
type Widen<T> = { readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

/**
 * The console's translation shape. pl.ts and ua.ts are declared with it, so
 * `tsc` fails when a key is missing in or extra to a language (key drift).
 */
export type Translations = Widen<typeof en>;
