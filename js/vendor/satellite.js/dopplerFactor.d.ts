import type { EcfVec3, Kilometer, KilometerPerSecond } from './common-types.js';
/**
 * Negative range rate means the satellite is moving towards the observer and
 * its frequency is shifted higher because 1 minus a negative range rate is
 * positive. If the range rate is positive, the satellite is moving away from
 * the observer and its frequency is shifted lower.
 */
export declare function dopplerFactor(observerCoordsEcf: EcfVec3<Kilometer>, positionEcf: EcfVec3<Kilometer>, velocityEcf: EcfVec3<KilometerPerSecond>): number;
