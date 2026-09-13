/* SOS — SafeOrbitForSattelites · Assets route
 *
 * Serves team image URLs from the Supabase Storage "assets" bucket.
 *
 * GET /api/v1/assets/team
 *   Returns a JSON array of { name, url } objects for every team member,
 *   using public URLs from the "assets" bucket.
 */

import { Router } from "express";
import { supabase } from "../services/supabase.js";

const router = Router();

const TEAM_IMAGES = [
  "vinayak-pawar.jpg",
  "srajan-dwivedi.jpeg",
  "priyanshi-bhardwaj.jpeg",
  "shubhi-chandel.jpeg",
  "deekshant-tehanguriya.jpeg",
  "sayansh-kulshreshtha.jpeg",
];

router.get("/team", (_req, res) => {
  const images = TEAM_IMAGES.map((file) => {
    const name = file.replace(/\.[^.]+$/, "");
    const { data } = supabase.storage
      .from("assets")
      .getPublicUrl(`team/${file}`);
    return { name, url: data.publicUrl };
  });

  res.json({ images });
});

export default router;
