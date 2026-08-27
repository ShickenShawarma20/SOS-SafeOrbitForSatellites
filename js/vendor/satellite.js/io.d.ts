import type { OMMJsonObject } from './common-types.js';
import type { SatRec } from './propagation/SatRec.js';
/**
 * Return a Satellite imported from two lines of TLE data.
 *
 * Provide the two TLE lines as strings `tleLine1` and `tleLine2`,
 * and select which standard set of gravitational constants you want
 * by providing `gravity_constants`:
 *
 * `sgp4.propagation.wgs72` - Standard WGS 72 model
 * `sgp4.propagation.wgs84` - More recent WGS 84 model
 * `sgp4.propagation.wgs72old` - Legacy support for old SGP4 behavior
 *
 * Normally, computations are made using various recent improvements
 * to the algorithm.  If you want to turn some of these off and go
 * back into "afspc" mode, then set `afspc_mode` to `True`.
 */
export declare function twoline2satrec(longstr1: string, longstr2: string): SatRec;
export declare function json2satrec(jsonobj: OMMJsonObject, opsmode?: 'a' | 'i'): SatRec;
