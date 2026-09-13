/* SOS — SafeOrbitForSattelites · Assets route
 *
 * Serves team image URLs from the Supabase Storage "assets" bucket.
 *
 * GET /api/v1/assets/team
 *   Returns a JSON array of { name, url } objects for every file found under
 *   the "team/" folder in the "assets" bucket.  The name is the filename
 *   without extension (e.g. "vinayak-pawar") so the frontend can match them
 *   to <img> elements.
 */

import { Router } from "express";
import { supabase } from "../services/supabase.js";

const router = Router();

router.get("/team", async (_req, res) => {
  try {
    const { data: files, error } = await supabase.storage
      .from("assets")
      .list("team", { limit: 100 });

    if (error) {
      console.error("Supabase Storage list error:", error.message);
      return res.json({ images: [] });
    }

    const images = (files ?? [])
      .filter((f) => /\.(jpe?g|png|gif|webp|avif)$/i.test(f.name))
      .map((f) => {
        const name = f.name.replace(/\.[^.]+$/, "");
        const { data } = supabase.storage
          .from("assets")
          .getPublicUrl(`team/${f.name}`);
        return { name, url: data.publicUrl };
      });

    res.json({ images });
  } catch (err) {
    console.error("Assets route error:", err);
    res.json({ images: [] });
  }
});

export default router;
