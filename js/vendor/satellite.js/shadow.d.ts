import type { AU, EciVec3, Kilometer } from './common-types.js';
/**
 * Calculate the fraction of the Sun's disc obscured by the Earth as seen from a satellite.
 *
 * @param sunEciAU - Sun position in AU, as returned by `sunPos().rsun`
 * @param satelliteEciKm - Satellite position in the ECI frame (km)
 * @returns Shadow fraction: 0 = fully lit, 1 = umbra,
 *          values between 0 and 1 indicate the fraction of the Sun covered by Earth.
 */
export declare function shadowFraction(sunEciAU: EciVec3<AU>, satelliteEciKm: EciVec3<Kilometer>): number;
