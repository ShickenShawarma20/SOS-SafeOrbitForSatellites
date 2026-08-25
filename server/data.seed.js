/* SOS backend prototype — static seed data (contracts per docs/BACKEND_REQUIREMENTS.md) */
"use strict";

const TLE = {
  line1: "1 48621U 21047A   24146.51388889  .00000126  00000-0  6.81000e-4 0  9993",
  line2: "2 48621  97.6000 132.4000 0001260  91.2000 268.8000 15.50234567 12345",
};

const satellites = [
  {
    id: "SAT-042", noradId: 48621, name: "SafeOrbit EO-4", type: "Earth Observation",
    operator: "SafeOrbit Systems", launchDate: "2021-05-12T00:00:00Z", massKg: 1200,
    status: "operational", orbitClass: "SSO · Sun-synchronous",
    elements: {
      altitudeKm: 450, inclinationDeg: 97.6, raanDeg: 132.4, eccentricity: 0.000126,
      periodMin: 92.67, argPerigeeDeg: 91.2, tle: TLE,
      eciPosition: [6893.2, 12.4, 1180.7], eciVelocity: [-1.72, 7.59, 0.01],
    },
    fuel: { pctRemaining: 78, totalKg: 154.8, usableKg: 121.0, reservedKg: 33.8, estEndOfLife: "2029 Q3", ispSec: 220, dryMassKg: 1045.2 },
    subsystems: [
      { name: "Power System", status: "nominal" },
      { name: "Propulsion", status: "nominal" },
      { name: "Attitude Control", status: "nominal" },
      { name: "Communications", status: "nominal" },
      { name: "Payload", status: "nominal" },
    ],
    filesCount: 23,
  },
  {
    id: "SAT-078", noradId: 49107, name: "SafeOrbit EO-7", type: "Earth Observation",
    operator: "SafeOrbit Systems", launchDate: "2021-11-03T00:00:00Z", massKg: 1150,
    status: "operational", orbitClass: "SSO · Sun-synchronous",
    elements: {
      altitudeKm: 512, inclinationDeg: 97.4, raanDeg: 210.1, eccentricity: 0.00031,
      periodMin: 94.62, argPerigeeDeg: 44.8, tle: TLE,
      eciPosition: [-5120.3, 4021.9, 660.2], eciVelocity: [-5.91, -5.02, 1.22],
    },
    fuel: { pctRemaining: 64, totalKg: 148.0, usableKg: 112.5, reservedKg: 35.5, estEndOfLife: "2028 Q4", ispSec: 220, dryMassKg: 998.0 },
    subsystems: [
      { name: "Power System", status: "nominal" },
      { name: "Propulsion", status: "nominal" },
      { name: "Attitude Control", status: "degraded" },
      { name: "Communications", status: "nominal" },
      { name: "Payload", status: "nominal" },
    ],
    filesCount: 19,
  },
  {
    id: "SAT-021", noradId: 47890, name: "SafeOrbit COM-2", type: "Communications",
    operator: "SafeOrbit Systems", launchDate: "2020-08-19T00:00:00Z", massKg: 1380,
    status: "operational", orbitClass: "LEO · Polar",
    elements: {
      altitudeKm: 620, inclinationDeg: 86.4, raanDeg: 88.9, eccentricity: 0.00084,
      periodMin: 96.98, argPerigeeDeg: 12.6, tle: TLE,
      eciPosition: [1240.8, -6612.5, 980.3], eciVelocity: [7.42, 1.51, -0.87],
    },
    fuel: { pctRemaining: 52, totalKg: 160.0, usableKg: 122.0, reservedKg: 38.0, estEndOfLife: "2027 Q2", ispSec: 215, dryMassKg: 1102.0 },
    subsystems: [
      { name: "Power System", status: "nominal" },
      { name: "Propulsion", status: "nominal" },
      { name: "Attitude Control", status: "nominal" },
      { name: "Communications", status: "degraded" },
      { name: "Payload", status: "nominal" },
    ],
    filesCount: 27,
  },
  {
    id: "SAT-109", noradId: 52341, name: "SafeOrbit SAR-1", type: "SAR Imaging",
    operator: "SafeOrbit Systems", launchDate: "2022-09-28T00:00:00Z", massKg: 1420,
    status: "operational", orbitClass: "SSO · Sun-synchronous",
    elements: {
      altitudeKm: 505, inclinationDeg: 97.8, raanDeg: 305.2, eccentricity: 0.00019,
      periodMin: 94.51, argPerigeeDeg: 178.4, tle: TLE,
      eciPosition: [-3204.1, -5810.6, 720.9], eciVelocity: [6.85, -3.92, 1.04],
    },
    fuel: { pctRemaining: 88, totalKg: 165.0, usableKg: 130.0, reservedKg: 35.0, estEndOfLife: "2030 Q1", ispSec: 222, dryMassKg: 1155.0 },
    subsystems: [
      { name: "Power System", status: "nominal" },
      { name: "Propulsion", status: "nominal" },
      { name: "Attitude Control", status: "nominal" },
      { name: "Communications", status: "nominal" },
      { name: "Payload", status: "nominal" },
    ],
    filesCount: 15,
  },
  {
    id: "SAT-033", noradId: 48012, name: "SafeOrbit SCI-3", type: "Science",
    operator: "SafeOrbit Systems", launchDate: "2021-02-07T00:00:00Z", massKg: 980,
    status: "standby", orbitClass: "LEO · Mid-inclination",
    elements: {
      altitudeKm: 550, inclinationDeg: 53.0, raanDeg: 12.7, eccentricity: 0.00042,
      periodMin: 95.61, argPerigeeDeg: 240.1, tle: TLE,
      eciPosition: [4180.2, 3015.4, 3980.1], eciVelocity: [-5.24, 4.81, 3.12],
    },
    fuel: { pctRemaining: 71, totalKg: 140.0, usableKg: 108.0, reservedKg: 32.0, estEndOfLife: "2029 Q1", ispSec: 218, dryMassKg: 900.0 },
    subsystems: [
      { name: "Power System", status: "nominal" },
      { name: "Propulsion", status: "nominal" },
      { name: "Attitude Control", status: "nominal" },
      { name: "Communications", status: "nominal" },
      { name: "Payload", status: "standby" },
    ],
    filesCount: 11,
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
    id: "OBJ-1123", noradId: 44120, type: "fragmentation", regime: "MEO",
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

module.exports = { satellites, debris, TLE };
