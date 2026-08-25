import { Router } from "express";
import { auditLog } from "../data/audit.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(auditLog);
});

export default router;
