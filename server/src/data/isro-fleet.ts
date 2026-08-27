/* SOS — SafeOrbitForSattelites · ISRO satellite fleet configuration
 *
 * Curated list of ISRO-associated satellites tracked via CelesTrak GP API.
 * NORAD IDs and names below are verified against CelesTrak's public catalog
 * (https://celestrak.org/NORAD/elements/gp.php?CATNR=<id>&FORMAT=tle).
 *
 * Satellites without standard Earth-orbiting TLEs (e.g. Aditya-L1 at Sun-Earth
 * L1, Chandrayaan-3 PM in cislunar space) are intentionally EXCLUDED because
 * SGP4 propagation does not apply to them.
 *
 * Only satellites for which reliable current public orbital data can be
 * obtained from CelesTrak are included here.
 */

export interface FleetMember {
  noradId: number;
  name: string;        // canonical name returned by CelesTrak / common name
  alias?: string;       // alternate/common name shown in the UI
  operator: string;
  category: string;     // orbit regime / mission class for grouping
  source: string;       // data source
}

export const ISRO_FLEET: FleetMember[] = [
  { noradId: 51656, name: "EOS-4",             alias: "RISAT-1A",   operator: "ISRO", category: "LEO · SSO",  source: "CelesTrak" },
  { noradId: 44804, name: "CARTOSAT-3",        alias: "Cartosat-3", operator: "ISRO", category: "LEO · SSO",  source: "CelesTrak" },
  { noradId: 54361, name: "EOS-6",             alias: "Oceansat-3", operator: "ISRO", category: "LEO · SSO",  source: "CelesTrak" },
  { noradId: 40930, name: "ASTROSAT",          alias: "AstroSat",  operator: "ISRO", category: "LEO · Equatorial", source: "CelesTrak" },
  { noradId: 44233, name: "RISAT-2B",          operator: "ISRO", category: "LEO", source: "CelesTrak" },
  { noradId: 44857, name: "RISAT-2BR1",        operator: "ISRO", category: "LEO", source: "CelesTrak" },
  { noradId: 37387, name: "RESOURCESAT-2",     alias: "Resourcesat-2", operator: "ISRO", category: "LEO", source: "CelesTrak" },
  { noradId: 41877, name: "RESOURCESAT-2A",    alias: "Resourcesat-2A", operator: "ISRO", category: "LEO", source: "CelesTrak" },
  { noradId: 42767, name: "CARTOSAT-2E",       alias: "Cartosat-2E", operator: "ISRO", category: "LEO", source: "CelesTrak" },
  { noradId: 39086, name: "SARAL",             operator: "ISRO/CNES", category: "LEO · SSO", source: "CelesTrak" },
  { noradId: 58990, name: "INSAT-3DS",         operator: "ISRO", category: "GEO", source: "CelesTrak" },
  { noradId: 45026, name: "GSAT-30",           operator: "ISRO", category: "GEO", source: "CelesTrak" },
  { noradId: 52898, name: "GSAT-24",           alias: "RANDEV", operator: "ISRO", category: "GEO", source: "CelesTrak" },
  { noradId: 44035, name: "GSAT-31",           operator: "ISRO", category: "GEO", source: "CelesTrak" },
  { noradId: 43864, name: "GSAT-7A",           operator: "ISRO", category: "GEO", source: "CelesTrak" },
  { noradId: 41752, name: "INSAT-3DR",         operator: "ISRO", category: "GEO", source: "CelesTrak" },
  { noradId: 56759, name: "NVS-01",            alias: "IRNSS-1J", operator: "ISRO", category: "GSO · Inclined", source: "CelesTrak" },
  { noradId: 39635, name: "IRNSS-1B",          operator: "ISRO", category: "GSO · Inclined", source: "CelesTrak" },
  { noradId: 40269, name: "IRNSS-1C",          operator: "ISRO", category: "GSO · Inclined", source: "CelesTrak" },
];
