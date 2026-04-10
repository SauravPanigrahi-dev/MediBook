import { Router } from "express";
import { db, slotsTable, appointmentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate } from "../lib/auth-middleware";

const router = Router();

const parseId = (raw: string | string[]): number => {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(s, 10);
};

const formatMins = (mins: number): string => {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

// Expand a slot window into individual timed positions
const expandSlot = (slot: typeof slotsTable.$inferSelect, bookedTokens: Set<number>) => {
  const positions: Array<{
    id: string;
    slotId: number;
    startTime: string;
    endTime: string;
    positionNumber: number;
    maxPatients: number;
    bookedCount: number;
    isBooked: boolean;
  }> = [];

  const totalPositions = Math.floor((slot.endTime - slot.startTime) / slot.slotDurationMins);
  const count = Math.min(totalPositions, slot.maxPatients);

  for (let i = 0; i < count; i++) {
    const posStart = slot.startTime + i * slot.slotDurationMins;
    const posEnd = posStart + slot.slotDurationMins;
    const positionNumber = i + 1;
    const isBooked = bookedTokens.has(positionNumber);
    positions.push({
      id: `${slot.id}-${positionNumber}`,
      slotId: slot.id,
      startTime: formatMins(posStart),
      endTime: formatMins(posEnd),
      positionNumber,
      maxPatients: 1,
      bookedCount: isBooked ? 1 : 0,
      isBooked,
    });
  }

  return positions;
};

router.get("/slots", async (req, res): Promise<void> => {
  const { doctorId, date } = req.query;

  if (!doctorId) {
    res.status(400).json({ success: false, message: "doctorId required" });
    return;
  }

  const docId = parseInt(String(doctorId));
  let query = db.select().from(slotsTable).where(and(eq(slotsTable.doctorId, docId), eq(slotsTable.isActive, true)));

  // Filter by day of week when date is provided
  const dateStr = date ? String(date) : null;
  let dayOfWeek: number | null = null;
  if (dateStr) {
    // Parse date as local date to avoid timezone offset issues
    const [year, month, day] = dateStr.split("-").map(Number);
    dayOfWeek = new Date(year, month - 1, day).getDay(); // 0=Sunday
  }

  const allSlots = await query;
  const filteredSlots = dayOfWeek !== null
    ? allSlots.filter(s => s.dayOfWeek === dayOfWeek)
    : allSlots;

  if (!dateStr) {
    // No date — return raw slot windows (for doctor management views)
    const formatted = filteredSlots.map(slot => ({
      ...slot,
      startTime: formatMins(slot.startTime),
      endTime: formatMins(slot.endTime),
      bookedCount: null,
      availableCount: null,
    }));
    res.json({ slots: formatted });
    return;
  }

  // With date — expand each window into individual timed positions
  const expandedSlots: ReturnType<typeof expandSlot>[number][] = [];

  for (const slot of filteredSlots) {
    const existing = await db.select().from(appointmentsTable)
      .where(and(eq(appointmentsTable.slotId, slot.id), eq(appointmentsTable.date, dateStr)));

    const activeAppointments = existing.filter(a => !["cancelled", "no-show"].includes(a.status));
    const bookedTokens = new Set(activeAppointments.map(a => a.tokenNumber));

    const positions = expandSlot(slot, bookedTokens);
    expandedSlots.push(...positions);
  }

  // Sort by start time
  expandedSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

  res.json({ slots: expandedSlots });
});

router.post("/slots", authenticate, async (req, res): Promise<void> => {
  const { doctorId, dayOfWeek, startTime, endTime, slotDurationMins, maxPatients } = req.body;

  // Convert HH:MM strings to minutes
  const toMins = (t: string): number => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const [slot] = await db.insert(slotsTable).values({
    doctorId,
    dayOfWeek,
    startTime: typeof startTime === "string" ? toMins(startTime) : startTime,
    endTime: typeof endTime === "string" ? toMins(endTime) : endTime,
    slotDurationMins,
    maxPatients,
  }).returning();

  res.status(201).json(slot);
});

router.patch("/slots/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const { isActive, maxPatients, slotDurationMins } = req.body;

  const [updated] = await db.update(slotsTable).set({
    ...(isActive !== undefined && { isActive }),
    ...(maxPatients !== undefined && { maxPatients }),
    ...(slotDurationMins !== undefined && { slotDurationMins }),
  }).where(eq(slotsTable.id, id)).returning();

  if (!updated) {
    res.status(404).json({ success: false, message: "Slot not found" });
    return;
  }
  res.json(updated);
});

router.delete("/slots/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  await db.delete(slotsTable).where(eq(slotsTable.id, id));
  res.json({ success: true, message: "Slot deleted" });
});

export default router;
