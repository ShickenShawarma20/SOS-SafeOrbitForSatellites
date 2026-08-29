import { Router } from "express";
import { AppError } from "../middleware/error.js";

const router = Router();

let currentOperator = {
  name: "Team SixthSense",
  role: "Mission Controller",
  initials: "TS",
};

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    throw new AppError(400, "INVALID_INPUT", "Username and password are required");
  }
  const token = `so-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  res.json({
    token,
    operator: currentOperator,
  });
});

router.post("/logout", (req, res) => {
  res.json({ success: true });
});

router.get("/me", (req, res) => {
  res.json(currentOperator);
});

export default router;
