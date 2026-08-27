/** biome-ignore-all lint/style/noNonNullAssertion: due to the fact that
 * many variables are first assigned within loops and if statements,
 * Typescript marks many of them as "used before assigned". To keep the algorithm
 * as is, non null assertion is used there.
 */
import type { PositionAndVelocity } from '../common-types.js';
import { type SatRec } from './SatRec.js';
export declare function sgp4(satrec: SatRec, tsince: number): PositionAndVelocity | null;
