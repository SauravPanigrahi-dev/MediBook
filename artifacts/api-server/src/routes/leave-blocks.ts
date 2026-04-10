import { Router } from "express";
import { db, leaveBlocksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate } from "../lib/auth-middleware";

const router = Router();

const parseId = (raw: string | string[]): number => {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(s, 10);
};

router.get("/leave-blocks", authenticate, async (req, res): Promise<void> => {
  const { doctorId } = req.query;

  if (!doctorId) {
    res.status(400).json({ success: false, message: "doctorId required" });
    return;
  }

  const blocks = await db.select().from(leaveBlocksTable)
    .where(eq(leaveBlocksTable.doctorId, parseInt(String(doctorId))));

  res.json({ leaveBlocks: blocks });
});

router.post("/leave-blocks", authenticate, async (req, res): Promise<void> => {
  const { doctorId, date, isFullDay, startTime, endTime, reason } = req.body;

  if (!doctorId || !date) {
    res.status(400).json({ success: false, message: "Missing required fields" });
    return;
  }

  const [block] = await db.insert(leaveBlocksTable).values({
    doctorId,
    date,
    isFullDay: isFullDay ?? true,
    startTime: startTime ?? null,
    endTime: endTime ?? null,
    reason: reason ?? null,
  }).returning();

  res.status(201).json(block);
});

router.delete("/leave-blocks/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  await db.delete(leaveBlocksTable).where(eq(leaveBlocksTable.id, id));
  res.json({ success: true, message: "Leave block deleted" });
});

export default router;
