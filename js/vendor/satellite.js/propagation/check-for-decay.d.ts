import type { SatRec } from './SatRec.js';
/**
 * In some cases, usually for objects decayed long time ago,
 * SGP4 would return garbage position and speed data instead of indicating that
 * the satellite has actually decayed. This check indicates if it's one of those cases.
 *
 * Note: this community check DOES NOT EXIST in the original SGP4 algorithm, so your results
 * MAY DIFFER from the results of official SGP4 propagation when using this check.
 *
 * @returns `true` if the satellite is authoritatively decayed as a result of latest propagation call.
 * If the latest propagation call gave a non-null result, that result should be discarded.
 *
 * @example
 * ```ts
 *   const result = sgp4(satrec, 0);
 *   if (result && checkForDecay(satrec)) {
 *     // here SGP4 model reported successful propagation,
 *     //but the check caught that the satellite has decayed.
 *   }
 * ```
 *
 * @example
 * ```ts
 *   const result = propagate(satrec, new Date(), { communityDecayCheckEnabled: true })
 *   // result is non-null only if `checkForDecay` too indicates that the satellite HAS NOT decayed.
 * ```
 */
export declare const checkForDecay: (satrec: SatRec) => boolean;
