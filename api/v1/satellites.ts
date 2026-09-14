/* SOS — Vercel serverless function: /api/v1/satellites
 * Self-contained satellite registry endpoint for Vercel compatibility.
 * Handles: /satellites, /satellites/:id, /:id/conjunctions, /:id/tle,
 *          /:id/subsystems, /:id/events, /:id/passes, /:id/files
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const EPOCH = "2026-08-20T00:00:00Z";

interface OrbitalElements {
  altitudeKm: number; inclinationDeg: number; raanDeg: number;
  eccentricity: number; periodMin: number; argPerigeeDeg: number;
  tle: { line1: string; line2: string; epoch: string };
  eciPosition?: [number, number, number]; eciVelocity?: [number, number, number];
}
interface Fuel {
  pctRemaining: number; totalKg: number; usableKg: number;
  reservedKg: number; estEndOfLife: string; ispSec: number; dryMassKg: number;
}
interface Subsystem { name: string; status: string; }
interface Satellite {
  id: string; noradId: number; name: string; type: string; operator: string;
  launchDate: string; massKg: number; status: string; orbitClass: string;
  elements: OrbitalElements; fuel: Fuel; subsystems: Subsystem[];
}
interface Conjunction {
  id: string; satelliteId: string; objectId: string; severity: string;
  tca: string; probabilityOfCollision: number; missDistanceMeters: number;
  relativeVelocityKms: number; relativeSpeedKmh: number;
  combinedUncertaintyKm: number; screeningVolumeKm: number[];
  hardBodyRadiusM: number; assessment: string;
  acknowledged: boolean; watchlisted: boolean;
}
interface FeedEvent {
  id: string; type: string; message: string; severity: string;
  timestamp: string; satelliteId?: string; objectId?: string;
  text?: string; description?: string;
}

const SATELLITES: Satellite[] = [
  { id: "SAT-57754", noradId: 57754, name: "Aditya-L1", type: "Solar Observation / Space Science Observatory", operator: "ISRO", launchDate: "2023-09-02", massKg: 1480, status: "operational", orbitClass: "Halo Orbit · Sun-Earth L1", elements: { altitudeKm: 1500000, inclinationDeg: 0.0, raanDeg: 0.0, eccentricity: 0.000001, periodMin: 256320, argPerigeeDeg: 0.0, tle: { line1: "1 57754U 23098A   26232.00000000  .00000000  00000-0  00000-0 0  9990", line2: "2 57754   0.0000   0.0000 0000010   0.0000   0.0000  0.00561798 99990", epoch: EPOCH }, eciPosition: [1500000, 45000, 30000], eciVelocity: [-0.064, 0.026, 0.012] }, fuel: { pctRemaining: 58, totalKg: 700, usableKg: 380, reservedKg: 26, estEndOfLife: "2032 Q2", ispSec: 310, dryMassKg: 780 }, subsystems: [ { name: "VELC · Visible Emission Line Coronagraph", status: "nominal" }, { name: "SUIT · Solar Ultraviolet Imaging Telescope", status: "nominal" }, { name: "ASPEX · Aditya Solar Wind Particle Experiment", status: "nominal" }, { name: "PAPA · Plasma Analyser Package for Aditya", status: "nominal" }, { name: "SoLEXS · Solar Low Energy X-ray Spectrometer", status: "nominal" }, { name: "HEL1OS · High Energy L1 Orbiting X-ray Spectrometer", status: "nominal" }, { name: "Magnetometer · Interplanetary Magnetic Field Sensor", status: "nominal" }, { name: "Propulsion · LAM + Monopropellant RCS", status: "nominal" } ] },
  { id: "SAT-58694", noradId: 58694, name: "XPoSat", type: "Astronomy / Space Science Observatory", operator: "ISRO", launchDate: "2024-01-01", massKg: 470, status: "operational", orbitClass: "LEO · Circular", elements: { altitudeKm: 350, inclinationDeg: 6.0, raanDeg: 210.4, eccentricity: 0.000182, periodMin: 91.5, argPerigeeDeg: 91.2, tle: { line1: "1 58694U 24001A   26232.00000000  .00000187  00000-0  91234-4 0  9991", line2: "2 58694   6.0000 210.4000 0001820  91.2000 268.9000 15.73770492 12341", epoch: EPOCH }, eciPosition: [6680.0, 500.0, 400.0], eciVelocity: [-0.08, -0.55, 7.67] }, fuel: { pctRemaining: 82, totalKg: 70, usableKg: 56, reservedKg: 1.4, estEndOfLife: "2029 Q1", ispSec: 220, dryMassKg: 400 }, subsystems: [ { name: "POLIX · Polarimeter Instrument in X-rays (8–30 keV)", status: "nominal" }, { name: "XSPECT · X-ray Spectroscopy and Timing (0.8–15 keV)", status: "nominal" }, { name: "Propulsion · RCS Thrusters (IMS-2 Bus)", status: "nominal" } ] },
  { id: "SAT-58990", noradId: 58990, name: "INSAT-3DS", type: "Meteorology & Disaster Warning", operator: "ISRO / IMD", launchDate: "2024-02-17", massKg: 2274, status: "operational", orbitClass: "GEO · Geostationary", elements: { altitudeKm: 35786, inclinationDeg: 0.05, raanDeg: 78.2, eccentricity: 0.000214, periodMin: 1436, argPerigeeDeg: 30.0, tle: { line1: "1 58990U 24024A   26232.00000000  .00000061  00000-0  10000-3 0  9992", line2: "2 58990   0.0500  78.2000 0002140  30.0000 330.1000  1.00272000 12342", epoch: EPOCH }, eciPosition: [42160, 30, 40], eciVelocity: [-0.002, 3.074, 0.001] }, fuel: { pctRemaining: 74, totalKg: 1294, usableKg: 890, reservedKg: 68, estEndOfLife: "2038 Q1", ispSec: 310, dryMassKg: 980 }, subsystems: [ { name: "6-Channel Imager · Multi-spectral Earth Imaging", status: "nominal" }, { name: "19-Channel Sounder · Atmospheric Profiles", status: "nominal" }, { name: "DRT · Data Relay Transponder", status: "nominal" }, { name: "SAS&R · Satellite-Aided Search and Rescue", status: "nominal" }, { name: "Propulsion · LAM + Chemical Thrusters", status: "nominal" } ] },
  { id: "SAT-57770", noradId: 57770, name: "Chandrayaan-3 Propulsion Module", type: "Lunar Relay / Technology Demonstrator", operator: "ISRO", launchDate: "2023-07-14", massKg: 2145, status: "operational", orbitClass: "HEO · Highly Elliptical", elements: { altitudeKm: 108600, inclinationDeg: 24.0, raanDeg: 145.0, eccentricity: 0.5354, periodMin: 17280, argPerigeeDeg: 280.0, tle: { line1: "1 57770U 23096A   26232.00000000  .00000012  00000-0  00000-0 0  9993", line2: "2 57770  24.0000 145.0000 5354000 280.0000  80.1000  0.08333333 12343", epoch: EPOCH }, eciPosition: [379000, 12000, 8000], eciVelocity: [0.05, 0.18, 0.09] }, fuel: { pctRemaining: 18, totalKg: 1697, usableKg: 260, reservedKg: 45, estEndOfLife: "2027 Q3", ispSec: 315, dryMassKg: 448 }, subsystems: [ { name: "SHAPE · Spectro-polarimetry of Habitable Planet Earth", status: "nominal" }, { name: "Propulsion · 440 N Liquid Apogee Engine + Bi-propellant RCS", status: "nominal" } ] },
  { id: "SAT-56759", noradId: 56759, name: "NVS-01", type: "Navigation", operator: "ISRO", launchDate: "2023-05-29", massKg: 2232, status: "operational", orbitClass: "GSO · Inclined Geosynchronous", elements: { altitudeKm: 36000, inclinationDeg: 29.5, raanDeg: 12.7, eccentricity: 0.00098, periodMin: 1436, argPerigeeDeg: 15.0, tle: { line1: "1 56759U 23064A   26232.00000000  .00000044  00000-0  10000-3 0  9994", line2: "2 56759  29.5000  12.7000 0009800  15.0000 345.1000  1.00272000 12344", epoch: EPOCH }, eciPosition: [19630, 33369, 16684], eciVelocity: [-2.1, 0.9, -2.2] }, fuel: { pctRemaining: 76, totalKg: 1282, usableKg: 900, reservedKg: 75, estEndOfLife: "2035 Q2", ispSec: 300, dryMassKg: 950 }, subsystems: [ { name: "Indigenous Rubidium Atomic Clock · Frequency Reference", status: "nominal" }, { name: "Navigation Payload · L1 / L5 / S-band Transmitters", status: "nominal" }, { name: "Propulsion · Liquid Unified Apogee Motor (LAM)", status: "nominal" } ] },
  { id: "SAT-54361", noradId: 54361, name: "EOS-06", type: "Oceanography / Earth Observation", operator: "ISRO", launchDate: "2022-11-26", massKg: 1117, status: "operational", orbitClass: "SSO · Sun-synchronous", elements: { altitudeKm: 743, inclinationDeg: 98.4, raanDeg: 245.8, eccentricity: 0.000198, periodMin: 99.3, argPerigeeDeg: 112.5, tle: { line1: "1 54361U 22156A   26232.00000000  .00000093  00000-0  71234-4 0  9995", line2: "2 54361  98.4000 245.8000 0001980 112.5000 247.7000 14.50151234 12345", epoch: EPOCH }, eciPosition: [7118, 60, 420], eciVelocity: [-0.06, 7.32, -1.31] }, fuel: { pctRemaining: 71, totalKg: 197, usableKg: 128, reservedKg: 12, estEndOfLife: "2027 Q4", ispSec: 225, dryMassKg: 920 }, subsystems: [ { name: "OCM-3 · Ocean Colour Monitor", status: "nominal" }, { name: "SSTM · Sea Surface Temperature Monitor", status: "nominal" }, { name: "Ku-Band Scatterometer · Wind Vector Tracking", status: "nominal" }, { name: "ARGOS-4 · CNES Data Collection Payload", status: "nominal" }, { name: "Propulsion · Monopropellant Hydrazine Thrusters", status: "nominal" } ] },
  { id: "SAT-44804", noradId: 44804, name: "Cartosat-3", type: "High-Resolution Optical Earth Observation", operator: "ISRO", launchDate: "2019-11-27", massKg: 1625, status: "operational", orbitClass: "SSO · Sun-synchronous", elements: { altitudeKm: 508, inclinationDeg: 97.4, raanDeg: 132.4, eccentricity: 0.000126, periodMin: 94.8, argPerigeeDeg: 45.3, tle: { line1: "1 44804U 19081A   26232.00000000  .00000123  00000-0  83421-4 0  9996", line2: "2 44804  97.4000 132.4000 0001260  45.3000 314.9000 15.18987342 12346", epoch: EPOCH }, eciPosition: [-5290, 4370, 810], eciVelocity: [-4.85, -5.42, -2.05] }, fuel: { pctRemaining: 63, totalKg: 425, usableKg: 240, reservedKg: 28, estEndOfLife: "2027 Q2", ispSec: 230, dryMassKg: 1200 }, subsystems: [ { name: "Panchromatic Camera · up to 0.25 m Ground Resolution", status: "nominal" }, { name: "Multispectral Camera · 4-band, 1 m Resolution", status: "nominal" }, { name: "Hyperspectral Imager · Land Surface Characterization", status: "nominal" }, { name: "Propulsion · Mono-propellant Reaction Control Thrusters", status: "nominal" } ] },
  { id: "SAT-52898", noradId: 52898, name: "GSAT-24", type: "Direct-To-Home (DTH) Telecommunications", operator: "NSIL / Tata Play", launchDate: "2022-06-22", massKg: 4181, status: "operational", orbitClass: "GEO · Geostationary (83° E)", elements: { altitudeKm: 35786, inclinationDeg: 0.03, raanDeg: 83.0, eccentricity: 0.000187, periodMin: 1436, argPerigeeDeg: 20.0, tle: { line1: "1 52898U 22073A   26232.00000000  .00000052  00000-0  10000-3 0  9997", line2: "2 52898   0.0300  83.0000 0001870  20.0000 340.1000  1.00272000 12347", epoch: EPOCH }, eciPosition: [-42160, 25, 20], eciVelocity: [0.001, -3.074, 0.001] }, fuel: { pctRemaining: 88, totalKg: 2331, usableKg: 1950, reservedKg: 102, estEndOfLife: "2037 Q2", ispSec: 320, dryMassKg: 1850 }, subsystems: [ { name: "Ku-band Transponders · 24 High-power DTH Channels", status: "nominal" }, { name: "Propulsion · Bi-propellant Apogee Motor + Electric Propulsion", status: "nominal" } ] },
  { id: "SAT-51656", noradId: 51656, name: "EOS-04 (RISAT-1A)", type: "Synthetic Aperture Radar (SAR) Earth Observation", operator: "ISRO", launchDate: "2022-02-14", massKg: 1710, status: "operational", orbitClass: "SSO · Sun-synchronous", elements: { altitudeKm: 529, inclinationDeg: 97.5, raanDeg: 305.2, eccentricity: 0.00019, periodMin: 95.2, argPerigeeDeg: 178.4, tle: { line1: "1 51656U 22011A   26232.00000000  .00000110  00000-0  78123-4 0  9998", line2: "2 51656  97.5000 305.2000 0001900 178.4000 181.7000 15.12605042 12348", epoch: EPOCH }, eciPosition: [-3240, -6010, 850], eciVelocity: [6.65, -3.66, 1.09] }, fuel: { pctRemaining: 79, totalKg: 310, usableKg: 220, reservedKg: 25, estEndOfLife: "2029 Q1", ispSec: 228, dryMassKg: 1400 }, subsystems: [ { name: "C-band SAR · All-weather Day/Night Imaging Radar", status: "nominal" }, { name: "Propulsion · Liquid Monopropellant RCS", status: "nominal" } ] },
  { id: "SAT-45026", noradId: 45026, name: "GSAT-30", type: "Telecommunication / Television Broadcast", operator: "ISRO", launchDate: "2020-01-16", massKg: 3357, status: "operational", orbitClass: "GEO · Geostationary (83° E)", elements: { altitudeKm: 35786, inclinationDeg: 0.04, raanDeg: 83.0, eccentricity: 0.000165, periodMin: 1436, argPerigeeDeg: 25.0, tle: { line1: "1 45026U 20002A   26232.00000000  .00000048  00000-0  10000-3 0  9999", line2: "2 45026   0.0400  83.0000 0001650  25.0000 335.1000  1.00272000 12349", epoch: EPOCH }, eciPosition: [-29800, 29800, 25], eciVelocity: [-2.173, -2.173, 0.002] }, fuel: { pctRemaining: 80, totalKg: 1897, usableKg: 1380, reservedKg: 137, estEndOfLife: "2035 Q1", ispSec: 310, dryMassKg: 1460 }, subsystems: [ { name: "C-band Transponders · Asia & Middle East Coverage", status: "nominal" }, { name: "Ku-band Transponders · Indian Mainland Coverage", status: "nominal" }, { name: "Propulsion · Chemical Bi-propellant LAM", status: "nominal" } ] },
  { id: "SAT-40930", noradId: 40930, name: "AstroSat", type: "Multi-wavelength Space Observatory", operator: "ISRO", launchDate: "2015-09-28", massKg: 1513, status: "operational", orbitClass: "LEO · Equatorial", elements: { altitudeKm: 650, inclinationDeg: 6.0, raanDeg: 88.9, eccentricity: 0.000242, periodMin: 97.3, argPerigeeDeg: 240.1, tle: { line1: "1 40930U 15052A   26232.00000000  .00000076  00000-0  65432-4 0  9994", line2: "2 40930   6.0000  88.9000 0002420 240.1000 119.9000 14.79958890 12350", epoch: EPOCH }, eciPosition: [4466, 3282, 4326], eciVelocity: [-5.03, 4.62, 2.99] }, fuel: { pctRemaining: 34, totalKg: 283, usableKg: 82, reservedKg: 14, estEndOfLife: "2027 Q1", ispSec: 220, dryMassKg: 1230 }, subsystems: [ { name: "UVIT · Ultraviolet Imaging Telescope (FUV/NUV)", status: "nominal" }, { name: "LAXPC · Large Area X-ray Proportional Counter", status: "nominal" }, { name: "SXT · Soft X-ray Telescope", status: "nominal" }, { name: "CZTI · Cadmium Zinc Telluride Imager", status: "nominal" }, { name: "SSM · Scanning Sky Monitor", status: "nominal" }, { name: "Propulsion · Hydrazine RCS Thrusters", status: "nominal" } ] },
  { id: "SAT-42767", noradId: 42767, name: "CARTOSAT-2E", type: "High-Resolution Radar Imaging", operator: "ISRO", launchDate: "2017-06-23", massKg: 710, status: "operational", orbitClass: "SSO · Sun-synchronous", elements: { altitudeKm: 504, inclinationDeg: 97.5, raanDeg: 240.0, eccentricity: 0.001, periodMin: 94.7, argPerigeeDeg: 110.0, tle: { line1: "1 42767U 17036C   26232.00000000  .00000120  00000-0  65000-4 0  9991", line2: "2 42767  97.5000 240.0000 0010000 110.0000 250.0000 15.00000000 12340", epoch: EPOCH }, eciPosition: [-5200, 4400, 780], eciVelocity: [-4.80, -5.38, -2.02] }, fuel: { pctRemaining: 55, totalKg: 120, usableKg: 72, reservedKg: 8, estEndOfLife: "2026 Q4", ispSec: 225, dryMassKg: 590 }, subsystems: [ { name: "PAN Camera · 0.65 m Resolution", status: "nominal" }, { name: "Propulsion · Monopropellant Thrusters", status: "nominal" } ] },
  { id: "SAT-39086", noradId: 39086, name: "SARAL", type: "Altimetry / Ocean Topography", operator: "ISRO / CNES", launchDate: "2013-02-25", massKg: 407, status: "operational", orbitClass: "SSO · Sun-synchronous", elements: { altitudeKm: 790, inclinationDeg: 98.5, raanDeg: 245.0, eccentricity: 0.001, periodMin: 100.4, argPerigeeDeg: 115.0, tle: { line1: "1 39086U 13009A   26232.00000000  .00000080  00000-0  50000-4 0  9991", line2: "2 39086  98.5000 245.0000 0010000 115.0000 245.0000 14.50000000 12340", epoch: EPOCH }, eciPosition: [1200, 6800, 800], eciVelocity: [-0.5, 7.2, -1.5] }, fuel: { pctRemaining: 42, totalKg: 80, usableKg: 35, reservedKg: 5, estEndOfLife: "2026 Q2", ispSec: 220, dryMassKg: 327 }, subsystems: [ { name: "Ka-band Altimeter · Ocean Surface Topography", status: "nominal" }, { name: "DORIS · Precise Orbit Determination", status: "nominal" }, { name: "LRA · Laser Retroreflector Array", status: "nominal" } ] },
  { id: "SAT-44233", noradId: 44233, name: "RISAT-2B", type: "Radar Imaging Earth Observation", operator: "ISRO", launchDate: "2019-05-22", massKg: 615, status: "operational", orbitClass: "SSO · Sun-synchronous", elements: { altitudeKm: 550, inclinationDeg: 48.0, raanDeg: 220.0, eccentricity: 0.001, periodMin: 95.5, argPerigeeDeg: 270.0, tle: { line1: "1 44233U 19028A   26232.00000000  .00000123  00000-0  70000-4 0  9991", line2: "2 44233  48.0000 220.0000 0010000 270.0000  90.0000 15.20000000 12340", epoch: EPOCH }, eciPosition: [-3500, 4200, 2100], eciVelocity: [-5.1, -3.8, -2.5] }, fuel: { pctRemaining: 61, totalKg: 110, usableKg: 68, reservedKg: 7, estEndOfLife: "2027 Q3", ispSec: 225, dryMassKg: 505 }, subsystems: [ { name: "X-band SAR · 1 m Resolution", status: "nominal" }, { name: "Propulsion · Reaction Control Thrusters", status: "nominal" } ] },
  { id: "SAT-44857", noradId: 44857, name: "RISAT-2BR1", type: "Radar Imaging Earth Observation", operator: "ISRO", launchDate: "2019-12-11", massKg: 615, status: "operational", orbitClass: "SSO · Sun-synchronous", elements: { altitudeKm: 550, inclinationDeg: 48.0, raanDeg: 215.0, eccentricity: 0.001, periodMin: 95.5, argPerigeeDeg: 275.0, tle: { line1: "1 44857U 19089F   26232.00000000  .00000123  00000-0  70000-4 0  9991", line2: "2 44857  48.0000 215.0000 0010000 275.0000  85.0000 15.20000000 12340", epoch: EPOCH }, eciPosition: [-3400, 4300, 2000], eciVelocity: [-5.0, -3.9, -2.6] }, fuel: { pctRemaining: 59, totalKg: 110, usableKg: 65, reservedKg: 7, estEndOfLife: "2027 Q2", ispSec: 225, dryMassKg: 505 }, subsystems: [ { name: "X-band SAR · 1 m Resolution", status: "nominal" }, { name: "Propulsion · Reaction Control Thrusters", status: "nominal" } ] },
  { id: "SAT-37387", noradId: 37387, name: "RESOURCESAT-2", type: "Multi-spectral Remote Sensing", operator: "ISRO", launchDate: "2011-04-20", massKg: 1206, status: "operational", orbitClass: "SSO · Sun-synchronous", elements: { altitudeKm: 817, inclinationDeg: 98.5, raanDeg: 230.0, eccentricity: 0.001, periodMin: 101.0, argPerigeeDeg: 100.0, tle: { line1: "1 37387U 11015A   26232.00000000  .00000100  00000-0  60000-4 0  9991", line2: "2 37387  98.5000 230.0000 0010000 100.0000 260.0000 14.60000000 12340", epoch: EPOCH }, eciPosition: [1500, 6700, 900], eciVelocity: [-0.6, 7.1, -1.6] }, fuel: { pctRemaining: 38, totalKg: 150, usableKg: 48, reservedKg: 10, estEndOfLife: "2026 Q1", ispSec: 220, dryMassKg: 1056 }, subsystems: [ { name: "LISS-4 · Linear Imaging Self-Scanning Sensor (5.8 m)", status: "nominal" }, { name: "AWiFS · Advanced Wide Field Sensor (56 m)", status: "nominal" }, { name: "Propulsion · Hydrazine Thrusters", status: "nominal" } ] },
  { id: "SAT-41877", noradId: 41877, name: "RESOURCESAT-2A", type: "Multi-spectral Remote Sensing", operator: "ISRO", launchDate: "2016-12-07", massKg: 1235, status: "operational", orbitClass: "SSO · Sun-synchronous", elements: { altitudeKm: 817, inclinationDeg: 98.5, raanDeg: 235.0, eccentricity: 0.001, periodMin: 101.0, argPerigeeDeg: 105.0, tle: { line1: "1 41877U 16074A   26232.00000000  .00000100  00000-0  60000-4 0  9991", line2: "2 41877  98.5000 235.0000 0010000 105.0000 255.0000 14.60000000 12340", epoch: EPOCH }, eciPosition: [1400, 6750, 850], eciVelocity: [-0.55, 7.15, -1.55] }, fuel: { pctRemaining: 45, totalKg: 150, usableKg: 55, reservedKg: 10, estEndOfLife: "2028 Q2", ispSec: 220, dryMassKg: 1056 }, subsystems: [ { name: "LISS-4 · High Resolution Camera (5.8 m)", status: "nominal" }, { name: "AWiFS · Wide Field Sensor (56 m)", status: "nominal" }, { name: "Propulsion · Hydrazine Thrusters", status: "nominal" } ] },
];

const CONJUNCTIONS: Conjunction[] = [
  { id: "CD-2024-0526-0417", satelliteId: "SAT-51656", objectId: "OBJ-8821", severity: "critical", tca: "2024-05-26T04:32:18Z", probabilityOfCollision: 0.00032, missDistanceMeters: 742, relativeVelocityKms: 15.29, relativeSpeedKmh: 55041, combinedUncertaintyKm: 1.29, screeningVolumeKm: [10, 10, 10], hardBodyRadiusM: 60, assessment: "Pc exceeds 10^-4 maneuver threshold.", acknowledged: false, watchlisted: true },
  { id: "CD-2024-0526-0912", satelliteId: "SAT-44804", objectId: "OBJ-3421", severity: "high", tca: "2024-05-26T11:15:42Z", probabilityOfCollision: 0.0000076, missDistanceMeters: 1180, relativeVelocityKms: 11.2, relativeSpeedKmh: 40320, combinedUncertaintyKm: 0.95, screeningVolumeKm: [8, 8, 8], hardBodyRadiusM: 50, assessment: "Elevated risk. Monitor closely.", acknowledged: false, watchlisted: true },
  { id: "CD-2024-0526-1542", satelliteId: "SAT-54361", objectId: "OBJ-1123", severity: "medium", tca: "2024-05-26T15:42:09Z", probabilityOfCollision: 0.0000012, missDistanceMeters: 3820, relativeVelocityKms: 9.4, relativeSpeedKmh: 33840, combinedUncertaintyKm: 0.72, screeningVolumeKm: [6, 6, 6], hardBodyRadiusM: 45, assessment: "Low-moderate risk. No maneuver required.", acknowledged: true, watchlisted: false },
  { id: "CD-2024-0525-2108", satelliteId: "SAT-58694", objectId: "OBJ-7781", severity: "high", tca: "2024-05-25T21:08:33Z", probabilityOfCollision: 0.0000023, missDistanceMeters: 5600, relativeVelocityKms: 12.8, relativeSpeedKmh: 46080, combinedUncertaintyKm: 1.1, screeningVolumeKm: [10, 10, 10], hardBodyRadiusM: 55, assessment: "Historical conjunction. Data retained for analysis.", acknowledged: true, watchlisted: false },
  { id: "CD-2024-0524-1430", satelliteId: "SAT-58990", objectId: "OBJ-9912", severity: "low", tca: "2024-05-24T14:30:55Z", probabilityOfCollision: 0.00000031, missDistanceMeters: 8100, relativeVelocityKms: 7.6, relativeSpeedKmh: 27360, combinedUncertaintyKm: 0.5, screeningVolumeKm: [5, 5, 5], hardBodyRadiusM: 40, assessment: "Negligible risk. No action required.", acknowledged: true, watchlisted: false },
];

const FEED_EVENTS: FeedEvent[] = [
  { id: "EVT-001", type: "alert", message: "Conjunction Alert: SAT-51656 ↔ OBJ-8821", severity: "critical", timestamp: "2024-05-26T04:30:00Z", satelliteId: "SAT-51656", objectId: "OBJ-8821" },
  { id: "EVT-002", type: "tracking", message: "Tracking Update: OBJ-3421", severity: "medium", timestamp: "2024-05-26T04:25:00Z", objectId: "OBJ-3421" },
  { id: "EVT-003", type: "maneuver", message: "Maneuver Completed: SAT-40930", severity: "low", timestamp: "2024-05-26T04:14:00Z", satelliteId: "SAT-40930" },
  { id: "EVT-004", type: "tle", message: "New TLE Data Received", severity: "info", timestamp: "2024-05-26T04:11:00Z" },
  { id: "EVT-005", type: "weather", message: "Weather Update: KSAT Ground Station", severity: "low", timestamp: "2024-05-26T04:00:00Z" },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=300");

  const urlPath = (req.url || "").split("?")[0].replace(/^\/api\/v1\/satellites/, "") || "/";

  if (urlPath === "/" || urlPath === "") {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;
    const q = (req.query.q as string || "").toLowerCase();

    let filtered = [...SATELLITES];
    if (status) filtered = filtered.filter(s => s.status === status);
    if (type) filtered = filtered.filter(s => s.type.toLowerCase().includes(type.toLowerCase()));
    if (q) filtered = filtered.filter(s =>
      s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.noradId.toString().includes(q)
    );

    const total = filtered.length;
    const items = filtered.slice((page - 1) * limit, page * limit);
    res.status(200).json({ items, total, page, limit });
    return;
  }

  const parts = urlPath.replace(/^\//, "").split("/");
  const id = decodeURIComponent(parts[0]);
  const subRoute = parts[1] || "";

  const sat = SATELLITES.find(s => s.id === id);
  if (!sat) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: `Satellite ${id} not found` } });
    return;
  }

  if (subRoute === "conjunctions") {
    let items = CONJUNCTIONS.filter(c => c.satelliteId === id);
    const severity = req.query.severity as string | undefined;
    const active = req.query.active === "true";
    if (severity) items = items.filter(c => c.severity === severity);
    if (active) items = items.filter(c => {
      const tca = new Date(c.tca);
      return tca > new Date() || c.acknowledged === false;
    });
    res.status(200).json(items);
    return;
  }

  if (subRoute === "tle") {
    res.status(200).json({ line1: sat.elements.tle.line1, line2: sat.elements.tle.line2, epoch: sat.elements.tle.epoch });
    return;
  }

  if (subRoute === "subsystems") {
    res.status(200).json(sat.subsystems);
    return;
  }

  if (subRoute === "events") {
    const items = FEED_EVENTS.filter(e => e.satelliteId === id);
    res.status(200).json(items);
    return;
  }

  if (subRoute === "passes") {
    const hours = parseInt(req.query.hours as string) || 24;
    const stationNames = ["Svalbard", "Fairbanks", "Wallops", "Santiago", "Pine Gap", "Kwajalein", "Misawa"];
    const now = new Date();
    const passes = Array.from({ length: Math.min(hours, 12) }, (_, i) => {
      const aosOffset = (i + 1) * (hours / Math.min(hours, 12)) * 3600 * 1000;
      const aos = new Date(now.getTime() + aosOffset);
      const durationSec = 300 + Math.floor(Math.random() * 600);
      const los = new Date(aos.getTime() + durationSec * 1000);
      return { id: `PASS-${id}-${i}`, satelliteId: id, stationName: stationNames[i % stationNames.length], aos: aos.toISOString(), los: los.toISOString(), durationSec, maxElevationDeg: Math.round(20 + Math.random() * 70) };
    });
    res.status(200).json(passes);
    return;
  }

  if (subRoute === "files") {
    const fileTypes = ["ICD", "Manual", "SOP", "Calibration", "Spec Sheet", "Test Report", "Requirement", "Design Doc", "Interface Control", "Procedure"];
    const files = Array.from({ length: 23 }, (_, i) => ({
      id: `FILE-${String(i + 1).padStart(3, "0")}`,
      name: `${id}_${fileTypes[i % fileTypes.length].replace(/\s+/g, "_")}_v${Math.floor(i / 5) + 1}.${i % 3 === 0 ? "pdf" : i % 3 === 1 ? "docx" : "xlsx"}`,
      type: i % 3 === 0 ? "pdf" : i % 3 === 1 ? "docx" : "xlsx",
      size: Math.round(50000 + Math.random() * 500000),
      uploadedAt: new Date(Date.now() - i * 86400000 * (1 + Math.random() * 30)).toISOString(),
    }));
    res.status(200).json(files);
    return;
  }

  if (subRoute === "telemetry" && parts[2] === "latest") {
    res.status(200).json({
      satelliteId: id, timestamp: new Date().toISOString(),
      position: sat.elements.eciPosition, velocity: sat.elements.eciVelocity,
      temperatures: { battery: 22.5, solar_panel: 45.2, avionics: 18.7, propulsion: 15.3 },
      power: { solarGenerationW: 420, batteryChargeW: 380, loadW: 310, batteryPct: sat.fuel.pctRemaining },
    });
    return;
  }

  if (subRoute === "track") {
    const pos = sat.elements.eciPosition || [0, 0, 0];
    const vel = sat.elements.eciVelocity || [0, 0, 0];
    const stepSec = parseInt((req.query.step as string) || "60") || 60;
    const totalPoints = Math.floor(24 * 3600 / stepSec);
    const points = Array.from({ length: Math.min(totalPoints, 1440) }, (_, i) => {
      const t = i * stepSec;
      const angle = (t / sat.elements.periodMin / 60) * 2 * Math.PI;
      return {
        time: new Date(Date.now() + t * 1000).toISOString(),
        position: [pos[0] * Math.cos(angle) - pos[1] * Math.sin(angle), pos[0] * Math.sin(angle) + pos[1] * Math.cos(angle), pos[2] * Math.cos(angle * 0.1)] as [number, number, number],
        velocity: [vel[0] * Math.cos(angle) - vel[1] * Math.sin(angle), vel[0] * Math.sin(angle) + vel[1] * Math.cos(angle), vel[2] * Math.cos(angle * 0.1)] as [number, number, number],
      };
    });
    res.status(200).json({ satelliteId: id, points });
    return;
  }

  res.status(200).json(sat);
}
