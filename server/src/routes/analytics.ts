import { Router } from "express";

const router = Router();

router.get("/summary", (req, res) => {
  res.json({
    totalConjunctions: 156,
    avgPc: 4.2e-5,
    maneuversExecuted: 7,
    riskReductionPct: 94.6,
    trends: {
      conjunctions: { current: 156, previous: 142, changePct: 9.9 },
      avgPc: { current: 4.2e-5, previous: 5.1e-5, changePct: -17.6 },
      maneuvers: { current: 7, previous: 5, changePct: 40 },
      riskReduction: { current: 94.6, previous: 91.2, changePct: 3.7 },
    },
  });
});

router.get("/conjunctions-over-time", (req, res) => {
  res.json({
    series: [
      { label: "Apr", value: 14 },
      { label: "May", value: 11 },
      { label: "Jun", value: 17 },
      { label: "Jul", value: 13 },
      { label: "Aug", value: 19 },
      { label: "Sep", value: 15 },
      { label: "Oct", value: 22 },
      { label: "Nov", value: 18 },
      { label: "Dec", value: 24 },
      { label: "Jan", value: 20 },
      { label: "Feb", value: 26 },
      { label: "Mar", value: 23 },
    ],
  });
});

router.get("/by-severity", (req, res) => {
  res.json({
    LEO: { critical: 3, high: 9, medium: 21 },
    MEO: { critical: 1, high: 4, medium: 7 },
    GEO: { critical: 2, high: 5, medium: 9 },
    HEO: { critical: 0, high: 2, medium: 4 },
  });
});

router.get("/top-objects", (req, res) => {
  res.json([
    { id: "OBJ-8821", count: 14 },
    { id: "OBJ-3421", count: 11 },
    { id: "CZ-6 DEB", count: 9 },
    { id: "SL-16 R/B", count: 7 },
    { id: "OBJ-1123", count: 5 },
  ]);
});

router.get("/by-altitude-band", (req, res) => {
  res.json([
    { band: "<400", count: 18 },
    { band: "400-550", count: 34 },
    { band: "550-700", count: 27 },
    { band: "700-1000", count: 19 },
    { band: ">1000", count: 11 },
  ]);
});

router.get("/report/export", (req, res) => {
  const format = (req.query.format as string) || "pdf";
  res.json({
    format,
    generatedAt: new Date().toISOString(),
    summary: {
      totalConjunctions: 156,
      avgPc: 4.2e-5,
      maneuversExecuted: 7,
      riskReductionPct: 94.6,
    },
  });
});

export default router;
