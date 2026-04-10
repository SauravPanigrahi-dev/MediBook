import { Router } from "express";
import { db, appointmentsTable, slotsTable, doctorsTable, patientsTable, usersTable } from "@workspace/db";
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

const enrichAppointment = async (appt: typeof appointmentsTable.$inferSelect) => {
  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, appt.patientId));
  const [patientUser] = patient ? await db.select().from(usersTable).where(eq(usersTable.id, patient.userId)) : [null];
  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, appt.doctorId));
  const [doctorUser] = doctor ? await db.select().from(usersTable).where(eq(usersTable.id, doctor.userId)) : [null];

  return {
    ...appt,
    paymentAmount: Number(appt.paymentAmount),
    patientName: patientUser?.name ?? null,
    doctorName: doctorUser?.name ?? null,
    doctorSpecialization: doctor?.specialization ?? null,
  };
};

router.get("/appointments", authenticate, async (req, res): Promise<void> => {
  const { patientId, doctorId, status, date } = req.query;

  let appointments = await db.select().from(appointmentsTable);

  if (patientId) appointments = appointments.filter(a => a.patientId === parseInt(String(patientId)));
  if (doctorId) appointments = appointments.filter(a => a.doctorId === parseInt(String(doctorId)));
  if (status) appointments = appointments.filter(a => a.status === status);
  if (date) appointments = appointments.filter(a => a.date === date);

  const enriched = await Promise.all(appointments.map(enrichAppointment));
  res.json({ appointments: enriched });
});

router.post("/appointments", authenticate, async (req, res): Promise<void> => {
  const { patientId, doctorId, slotId, date, reason, paymentMethod, preferredTokenNumber } = req.body;

  if (!patientId || !doctorId || !slotId || !date) {
    res.status(400).json({ success: false, message: "Missing required fields" });
    return;
  }

  const [slot] = await db.select().from(slotsTable).where(eq(slotsTable.id, slotId));
  if (!slot) {
    res.status(400).json({ success: false, message: "Slot not found" });
    return;
  }

  // Count existing appointments for this slot+date
  const existing = await db.select().from(appointmentsTable)
    .where(and(
      eq(appointmentsTable.slotId, slotId),
      eq(appointmentsTable.date, date),
    ));

  const active = existing.filter(a => !["cancelled", "no-show"].includes(a.status));
  const activeCount = active.length;

  // If a specific position was requested, validate it is free
  let tokenNumber: number;
  if (preferredTokenNumber != null) {
    const taken = active.some(a => a.tokenNumber === preferredTokenNumber);
    if (taken) {
      res.status(400).json({ success: false, message: "This time slot is already booked. Please select another." });
      return;
    }
    tokenNumber = preferredTokenNumber;
  } else {
    if (activeCount >= slot.maxPatients) {
      res.status(400).json({ success: false, message: "Slot is fully booked" });
      return;
    }
    tokenNumber = activeCount + 1;
  }

  const queuePosition = activeCount + 1;
  const estimatedWaitMins = queuePosition * slot.slotDurationMins;
  const startTimeMins = slot.startTime + (tokenNumber - 1) * slot.slotDurationMins;
  const endTimeMins = startTimeMins + slot.slotDurationMins;

  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, doctorId));

  const [appointment] = await db.insert(appointmentsTable).values({
    patientId,
    doctorId,
    slotId,
    date,
    startTime: formatMins(startTimeMins),
    endTime: formatMins(endTimeMins),
    tokenNumber,
    queuePosition,
    estimatedWaitMins,
    status: "confirmed",
    reason: reason ?? null,
    paymentStatus: "paid",
    paymentAmount: String(doctor?.consultationFee ?? 500),
  }).returning();

  const enriched = await enrichAppointment(appointment);
  res.status(201).json(enriched);
});

router.get("/appointments/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
  if (!appt) {
    res.status(404).json({ success: false, message: "Appointment not found" });
    return;
  }
  const enriched = await enrichAppointment(appt);
  res.json(enriched);
});

router.patch("/appointments/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const { notes, status } = req.body;

  const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
  if (!appt) {
    res.status(404).json({ success: false, message: "Appointment not found" });
    return;
  }

  await db.update(appointmentsTable).set({
    ...(notes !== undefined && { notes }),
    ...(status !== undefined && { status }),
  }).where(eq(appointmentsTable.id, id));

  const [updated] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
  const enriched = await enrichAppointment(updated);
  res.json(enriched);
});

router.post("/appointments/:id/cancel", authenticate, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
  if (!appt) {
    res.status(404).json({ success: false, message: "Appointment not found" });
    return;
  }

  // Can cancel if >24h away and still pending/confirmed
  const apptDate = new Date(appt.date + "T" + appt.startTime);
  const hoursUntil = (apptDate.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntil < 24) {
    res.status(400).json({ success: false, message: "Cannot cancel appointment within 24 hours" });
    return;
  }

  const [updated] = await db.update(appointmentsTable)
    .set({ status: "cancelled", paymentStatus: "refunded" })
    .where(eq(appointmentsTable.id, id))
    .returning();

  const enriched = await enrichAppointment(updated);
  res.json(enriched);
});

router.post("/appointments/:id/complete", authenticate, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const { notes } = req.body ?? {};

  const [updated] = await db.update(appointmentsTable)
    .set({ status: "completed", ...(notes !== undefined && { notes }) })
    .where(eq(appointmentsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ success: false, message: "Appointment not found" });
    return;
  }

  const enriched = await enrichAppointment(updated);
  res.json(enriched);
});

export default router;
