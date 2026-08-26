/* SOS backend prototype — static seed data (contracts per docs/BACKEND_REQUIREMENTS.md) */
"use strict";

const EPOCH = "2026-08-20T00:00:00Z";

const tle = (norad, l1, l2) => ({ line1: l1, line2: l2, epoch: EPOCH });

const satellites = [
  {
    id: "SAT-57754", noradId: 57754, name: "Aditya-L1", type: "Solar Observation / Space Science Observatory",
    operator: "ISRO", launchDate: "2023-09-02T06:20:00Z", massKg: 1480,
    status: "operational", orbitClass: "Halo Orbit · Sun-Earth L1",
    elements: {
      altitudeKm: 1500000, inclinationDeg: 0.0, raanDeg: 0.0, eccentricity: 0.000001,
      periodMin: 256320, argPerigeeDeg: 0.0,
      tle: tle(57754,
        "1 57754U 23098A   26232.00000000  .00000000  00000-0  00000-0 0  9990",
        "2 57754   0.0000   0.0000 0000010   0.0000   0.0000  0.00561798 99990"),
      eciPosition: [1500000, 45000, 30000], eciVelocity: [-0.064, 0.026, 0.012],
    },
    fuel: { pctRemaining: 58, totalKg: 700, usableKg: 380, reservedKg: 26, estEndOfLife: "2032 Q2", ispSec: 310, dryMassKg: 780 },
    subsystems: [
      { name: "VELC · Visible Emission Line Coronagraph", status: "nominal" },
      { name: "SUIT · Solar Ultraviolet Imaging Telescope", status: "nominal" },
      { name: "ASPEX · Aditya Solar Wind Particle Experiment", status: "nominal" },
      { name: "PAPA · Plasma Analyser Package for Aditya", status: "nominal" },
      { name: "SoLEXS · Solar Low Energy X-ray Spectrometer", status: "nominal" },
      { name: "HEL1OS · High Energy L1 Orbiting X-ray Spectrometer", status: "nominal" },
      { name: "Magnetometer · Interplanetary Magnetic Field Sensor", status: "nominal" },
      { name: "Propulsion · LAM + Monopropellant RCS", status: "nominal" },
    ],
    filesCount: 23,
  },
  {
    id: "SAT-58694", noradId: 58694, name: "XPoSat", type: "Astronomy / Space Science Observatory",
    operator: "ISRO", launchDate: "2024-01-01T00:00:00Z", massKg: 470,
    status: "operational", orbitClass: "LEO · Circular",
    elements: {
      altitudeKm: 350, inclinationDeg: 6.0, raanDeg: 210.4, eccentricity: 0.000182,
      periodMin: 91.5, argPerigeeDeg: 91.2,
      tle: tle(58694,
        "1 58694U 24001A   26232.00000000  .00000187  00000-0  91234-4 0  9991",
        "2 58694   6.0000 210.4000 0001820  91.2000 268.9000 15.73770492 12341"),
      eciPosition: [6680.0, 500.0, 400.0], eciVelocity: [-0.08, -0.55, 7.67],
    },
    fuel: { pctRemaining: 82, totalKg: 70, usableKg: 56, reservedKg: 1.4, estEndOfLife: "2029 Q1", ispSec: 220, dryMassKg: 400 },
    subsystems: [
      { name: "POLIX · Polarimeter Instrument in X-rays (8–30 keV)", status: "nominal" },
      { name: "XSPECT · X-ray Spectroscopy and Timing (0.8–15 keV)", status: "nominal" },
      { name: "Propulsion · RCS Thrusters (IMS-2 Bus)", status: "nominal" },
    ],
    filesCount: 19,
  },
  {
    id: "SAT-58990", noradId: 58990, name: "INSAT-3DS", type: "Meteorology & Disaster Warning",
    operator: "ISRO / IMD", launchDate: "2024-02-17T00:00:00Z", massKg: 2274,
    status: "operational", orbitClass: "GEO · Geostationary",
    elements: {
      altitudeKm: 35786, inclinationDeg: 0.05, raanDeg: 78.2, eccentricity: 0.000214,
      periodMin: 1436, argPerigeeDeg: 30.0,
      tle: tle(58990,
        "1 58990U 24024A   26232.00000000  .00000061  00000-0  10000-3 0  9992",
        "2 58990   0.0500  78.2000 0002140  30.0000 330.1000  1.00272000 12342"),
      eciPosition: [42160, 30, 40], eciVelocity: [-0.002, 3.074, 0.001],
    },
    fuel: { pctRemaining: 74, totalKg: 1294, usableKg: 890, reservedKg: 68, estEndOfLife: "2038 Q1", ispSec: 310, dryMassKg: 980 },
    subsystems: [
      { name: "6-Channel Imager · Multi-spectral Earth Imaging", status: "nominal" },
      { name: "19-Channel Sounder · Atmospheric Profiles", status: "nominal" },
      { name: "DRT · Data Relay Transponder", status: "nominal" },
      { name: "SAS&R · Satellite-Aided Search and Rescue", status: "nominal" },
      { name: "Propulsion · LAM + Chemical Thrusters", status: "nominal" },
    ],
    filesCount: 27,
  },
  {
    id: "SAT-57770", noradId: 57770, name: "Chandrayaan-3 Propulsion Module", type: "Lunar Relay / Technology Demonstrator",
    operator: "ISRO", launchDate: "2023-07-14T00:00:00Z", massKg: 2145,
    status: "operational", orbitClass: "HEO · Highly Elliptical",
    elements: {
      altitudeKm: 108600, inclinationDeg: 24.0, raanDeg: 145.0, eccentricity: 0.5354,
      periodMin: 17280, argPerigeeDeg: 280.0,
      tle: tle(57770,
        "1 57770U 23096A   26232.00000000  .00000012  00000-0  00000-0 0  9993",
        "2 57770  24.0000 145.0000 5354000 280.0000  80.1000  0.08333333 12343"),
      eciPosition: [379000, 12000, 8000], eciVelocity: [0.05, 0.18, 0.09],
    },
    fuel: { pctRemaining: 18, totalKg: 1697, usableKg: 260, reservedKg: 45, estEndOfLife: "2027 Q3", ispSec: 315, dryMassKg: 448 },
    subsystems: [
      { name: "SHAPE · Spectro-polarimetry of Habitable Planet Earth", status: "nominal" },
      { name: "Propulsion · 440 N Liquid Apogee Engine + Bi-propellant RCS", status: "nominal" },
    ],
    filesCount: 15,
  },
  {
    id: "SAT-56759", noradId: 56759, name: "NVS-01 (NavIC 2nd Gen)", type: "Navigation",
    operator: "ISRO", launchDate: "2023-05-29T00:00:00Z", massKg: 2232,
    status: "operational", orbitClass: "GSO · Inclined Geosynchronous",
    elements: {
      altitudeKm: 36000, inclinationDeg: 29.5, raanDeg: 12.7, eccentricity: 0.00098,
      periodMin: 1436, argPerigeeDeg: 15.0,
      tle: tle(56759,
        "1 56759U 23064A   26232.00000000  .00000044  00000-0  10000-3 0  9994",
        "2 56759  29.5000  12.7000 0009800  15.0000 345.1000  1.00272000 12344"),
      eciPosition: [19630, 33369, 16684], eciVelocity: [-2.1, 0.9, -2.2],
    },
    fuel: { pctRemaining: 76, totalKg: 1282, usableKg: 900, reservedKg: 75, estEndOfLife: "2035 Q2", ispSec: 300, dryMassKg: 950 },
    subsystems: [
      { name: "Indigenous Rubidium Atomic Clock · Frequency Reference", status: "nominal" },
      { name: "Navigation Payload · L1 / L5 / S-band Transmitters", status: "nominal" },
      { name: "Propulsion · Liquid Unified Apogee Motor (LAM)", status: "nominal" },
    ],
    filesCount: 11,
  },
  {
    id: "SAT-54361", noradId: 54361, name: "EOS-06 (Oceansat-3)", type: "Oceanography / Earth Observation",
    operator: "ISRO", launchDate: "2022-11-26T00:00:00Z", massKg: 1117,
    status: "operational", orbitClass: "SSO · Sun-synchronous",
    elements: {
      altitudeKm: 743, inclinationDeg: 98.4, raanDeg: 245.8, eccentricity: 0.000198,
      periodMin: 99.3, argPerigeeDeg: 112.5,
      tle: tle(54361,
        "1 54361U 22156A   26232.00000000  .00000093  00000-0  71234-4 0  9995",
        "2 54361  98.4000 245.8000 0001980 112.5000 247.7000 14.50151234 12345"),
      eciPosition: [7118, 60, 420], eciVelocity: [-0.06, 7.32, -1.31],
    },
    fuel: { pctRemaining: 71, totalKg: 197, usableKg: 128, reservedKg: 12, estEndOfLife: "2027 Q4", ispSec: 225, dryMassKg: 920 },
    subsystems: [
      { name: "OCM-3 · Ocean Colour Monitor", status: "nominal" },
      { name: "SSTM · Sea Surface Temperature Monitor", status: "nominal" },
      { name: "Ku-Band Scatterometer · Wind Vector Tracking", status: "nominal" },
      { name: "ARGOS-4 · CNES Data Collection Payload", status: "nominal" },
      { name: "Propulsion · Monopropellant Hydrazine Thrusters", status: "nominal" },
    ],
    filesCount: 21,
  },
  {
    id: "SAT-44804", noradId: 44804, name: "Cartosat-3", type: "High-Resolution Optical Earth Observation",
    operator: "ISRO", launchDate: "2019-11-27T00:00:00Z", massKg: 1625,
    status: "operational", orbitClass: "SSO · Sun-synchronous",
    elements: {
      altitudeKm: 508, inclinationDeg: 97.4, raanDeg: 132.4, eccentricity: 0.000126,
      periodMin: 94.8, argPerigeeDeg: 45.3,
      tle: tle(44804,
        "1 44804U 19081A   26232.00000000  .00000123  00000-0  83421-4 0  9996",
        "2 44804  97.4000 132.4000 0001260  45.3000 314.9000 15.18987342 12346"),
      eciPosition: [-5290, 4370, 810], eciVelocity: [-4.85, -5.42, -2.05],
    },
    fuel: { pctRemaining: 63, totalKg: 425, usableKg: 240, reservedKg: 28, estEndOfLife: "2027 Q2", ispSec: 230, dryMassKg: 1200 },
    subsystems: [
      { name: "Panchromatic Camera · up to 0.25 m Ground Resolution", status: "nominal" },
      { name: "Multispectral Camera · 4-band, 1 m Resolution", status: "nominal" },
      { name: "Hyperspectral Imager · Land Surface Characterization", status: "nominal" },
      { name: "Propulsion · Mono-propellant Reaction Control Thrusters", status: "nominal" },
    ],
    filesCount: 24,
  },
  {
    id: "SAT-52898", noradId: 52898, name: "GSAT-24", type: "Direct-To-Home (DTH) Telecommunications",
    operator: "NSIL / Tata Play", launchDate: "2022-06-22T00:00:00Z", massKg: 4181,
    status: "operational", orbitClass: "GEO · Geostationary (83° E)",
    elements: {
      altitudeKm: 35786, inclinationDeg: 0.03, raanDeg: 83.0, eccentricity: 0.000187,
      periodMin: 1436, argPerigeeDeg: 20.0,
      tle: tle(52898,
        "1 52898U 22073A   26232.00000000  .00000052  00000-0  10000-3 0  9997",
        "2 52898   0.0300  83.0000 0001870  20.0000 340.1000  1.00272000 12347"),
      eciPosition: [-42160, 25, 20], eciVelocity: [0.001, -3.074, 0.001],
    },
    fuel: { pctRemaining: 88, totalKg: 2331, usableKg: 1950, reservedKg: 102, estEndOfLife: "2037 Q2", ispSec: 320, dryMassKg: 1850 },
    subsystems: [
      { name: "Ku-band Transponders · 24 High-power DTH Channels", status: "nominal" },
      { name: "Propulsion · Bi-propellant Apogee Motor + Electric Propulsion", status: "nominal" },
    ],
    filesCount: 17,
  },
  {
    id: "SAT-51656", noradId: 51656, name: "EOS-04 (RISAT-1A)", type: "Synthetic Aperture Radar (SAR) Earth Observation",
    operator: "ISRO", launchDate: "2022-02-14T00:00:00Z", massKg: 1710,
    status: "operational", orbitClass: "SSO · Sun-synchronous",
    elements: {
      altitudeKm: 529, inclinationDeg: 97.5, raanDeg: 305.2, eccentricity: 0.00019,
      periodMin: 95.2, argPerigeeDeg: 178.4,
      tle: tle(51656,
        "1 51656U 22011A   26232.00000000  .00000110  00000-0  78123-4 0  9998",
        "2 51656  97.5000 305.2000 0001900 178.4000 181.7000 15.12605042 12348"),
      eciPosition: [-3240, -6010, 850], eciVelocity: [6.65, -3.66, 1.09],
    },
    fuel: { pctRemaining: 79, totalKg: 310, usableKg: 220, reservedKg: 25, estEndOfLife: "2029 Q1", ispSec: 228, dryMassKg: 1400 },
    subsystems: [
      { name: "C-band SAR · All-weather Day/Night Imaging Radar", status: "nominal" },
      { name: "Propulsion · Liquid Monopropellant RCS", status: "nominal" },
    ],
    filesCount: 20,
  },
  {
    id: "SAT-45026", noradId: 45026, name: "GSAT-30", type: "Telecommunication / Television Broadcast",
    operator: "ISRO", launchDate: "2020-01-16T00:00:00Z", massKg: 3357,
    status: "operational", orbitClass: "GEO · Geostationary (83° E)",
    elements: {
      altitudeKm: 35786, inclinationDeg: 0.04, raanDeg: 83.0, eccentricity: 0.000165,
      periodMin: 1436, argPerigeeDeg: 25.0,
      tle: tle(45026,
        "1 45026U 20002A   26232.00000000  .00000048  00000-0  10000-3 0  9999",
        "2 45026   0.0400  83.0000 0001650  25.0000 335.1000  1.00272000 12349"),
      eciPosition: [-29800, 29800, 25], eciVelocity: [-2.173, -2.173, 0.002],
    },
    fuel: { pctRemaining: 80, totalKg: 1897, usableKg: 1380, reservedKg: 137, estEndOfLife: "2035 Q1", ispSec: 310, dryMassKg: 1460 },
    subsystems: [
      { name: "C-band Transponders · Asia & Middle East Coverage", status: "nominal" },
      { name: "Ku-band Transponders · Indian Mainland Coverage", status: "nominal" },
      { name: "Propulsion · Chemical Bi-propellant LAM", status: "nominal" },
    ],
    filesCount: 13,
  },
  {
    id: "SAT-40930", noradId: 40930, name: "AstroSat", type: "Multi-wavelength Space Observatory",
    operator: "ISRO", launchDate: "2015-09-28T00:00:00Z", massKg: 1513,
    status: "operational", orbitClass: "LEO · Equatorial",
    elements: {
      altitudeKm: 650, inclinationDeg: 6.0, raanDeg: 88.9, eccentricity: 0.000242,
      periodMin: 97.3, argPerigeeDeg: 240.1,
      tle: tle(40930,
        "1 40930U 15052A   26232.00000000  .00000076  00000-0  65432-4 0  9994",
        "2 40930   6.0000  88.9000 0002420 240.1000 119.9000 14.79958890 12350"),
      eciPosition: [4466, 3282, 4326], eciVelocity: [-5.03, 4.62, 2.99],
    },
    fuel: { pctRemaining: 34, totalKg: 283, usableKg: 82, reservedKg: 14, estEndOfLife: "2027 Q1", ispSec: 220, dryMassKg: 1230 },
    subsystems: [
      { name: "UVIT · Ultraviolet Imaging Telescope (FUV/NUV)", status: "nominal" },
      { name: "LAXPC · Large Area X-ray Proportional Counter", status: "nominal" },
      { name: "SXT · Soft X-ray Telescope", status: "nominal" },
      { name: "CZTI · Cadmium Zinc Telluride Imager", status: "nominal" },
      { name: "SSM · Scanning Sky Monitor", status: "nominal" },
      { name: "Propulsion · Hydrazine RCS Thrusters", status: "nominal" },
    ],
    filesCount: 29,
  },
];

const debris = [
  {
    id: "OBJ-8821", noradId: 55112, type: "fragmentation", regime: "LEO",
    elements: {
      altitudeKm: 448, inclinationDeg: 97.4, raanDeg: 131.9, eccentricity: 0.00214,
      periodMin: 92.58, argPerigeeDeg: 105.6, tle: null,
      eciPosition: [6891.8, 15.1, 1178.9], eciVelocity: [-1.70, 7.60, 0.02],
    },
  },
  {
    id: "OBJ-3421", noradId: 43211, type: "rocket_body", regime: "LEO",
    elements: {
      altitudeKm: 515, inclinationDeg: 97.5, raanDeg: 208.7, eccentricity: 0.00312,
      periodMin: 94.69, argPerigeeDeg: 61.3, tle: null,
      eciPosition: [-5118.9, 4024.0, 658.1], eciVelocity: [-5.90, -5.01, 1.23],
    },
  },
  {
    id: "OBJ-1123", noradId: 44120, type: "fragmentation", regime: "LEO",
    elements: {
      altitudeKm: 618, inclinationDeg: 86.2, raanDeg: 90.2, eccentricity: 0.00188,
      periodMin: 96.95, argPerigeeDeg: 14.9, tle: null,
      eciPosition: [1243.0, -6610.2, 978.8], eciVelocity: [7.41, 1.52, -0.88],
    },
  },
  {
    id: "OBJ-7781", noradId: 50233, type: "unknown", regime: "LEO",
    elements: {
      altitudeKm: 498, inclinationDeg: 51.6, raanDeg: 245.8, eccentricity: 0.00421,
      periodMin: 94.32, argPerigeeDeg: 200.4, tle: null,
      eciPosition: [-3206.0, -5808.1, 722.4], eciVelocity: [6.84, -3.93, 1.05],
    },
  },
  {
    id: "OBJ-9912", noradId: 51877, type: "rocket_body", regime: "GEO",
    elements: {
      altitudeKm: 552, inclinationDeg: 52.9, raanDeg: 14.1, eccentricity: 0.00296,
      periodMin: 95.63, argPerigeeDeg: 238.8, tle: null,
      eciPosition: [4178.9, 3017.0, 3978.6], eciVelocity: [-5.23, 4.82, 3.13],
    },
  },
];

module.exports = { satellites, debris, TLE: satellites[0].elements.tle };
