/* SOS — Vercel serverless catch-all: /api/v1/[...path]
 * Proxies all other /api/v1/* requests to the Express server running locally
 * (dev) or returns a lightweight JSON response (Vercel static deploy without
 * a running backend).  This prevents the frontend from getting HTML 404 pages
 * when it expects JSON.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = (req.query.path as string[] | undefined)?.join("/") || "";
  res.setHeader("Content-Type", "application/json");
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `API endpoint /api/v1/${path} is not available in this deployment. The tracking API (/api/v1/tracking/*) is available.`,
    },
  });
}
