import { Router } from "express";
import { spaceWeather } from "../data/weather.js";

const router = Router();

router.get("/current", (req, res) => {
  res.json(spaceWeather);
});

export default router;
