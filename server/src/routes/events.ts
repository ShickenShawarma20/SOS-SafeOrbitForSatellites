import { Router } from "express";
import { feedEvents } from "../data/events.js";

const router = Router();

router.get("/feed", (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  res.json(feedEvents.slice(0, limit));
});

export default router;
