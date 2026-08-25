import { Router } from "express";
import { notifications } from "../data/notifications.js";
import { AppError } from "../middleware/error.js";

const router = Router();

router.get("/", (req, res) => {
  const unread = req.query.unread;
  let items = [...notifications];
  if (unread === "true") items = items.filter(n => !n.read);
  res.json(items);
});

router.post("/:id/read", (req, res) => {
  const n = notifications.find(n => n.id === req.params.id);
  if (!n) throw new AppError(404, "NOT_FOUND", `Notification ${req.params.id} not found`);
  n.read = true;
  res.json(n);
});

router.post("/read-all", (req, res) => {
  notifications.forEach(n => { n.read = true; });
  res.json({ success: true });
});

export default router;
