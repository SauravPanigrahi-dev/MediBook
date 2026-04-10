import { Router } from "express";
import { db, prescriptionsTable, usersTable, doctorsTable, patientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate } from "../lib/auth-middleware";

const router = Router();

router.get("/prescriptions", authenticate, async (req, res): Promise<void> => {
  const { patientId, doctorId } = req.query;

  let prescriptions = await db.select().from(prescriptionsTable);

  if (patientId) prescriptions = prescriptions.filter(p => p.patientId === parseInt(String(patientId)));
  if (doctorId) prescriptions = prescriptions.filter(p => p.doctorId === parseInt(String(doctorId)));

  const enriched = await Promise.all(prescriptions.map(async p => {
    const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, p.doctorId));
    const [doctorUser] = doctor ? await db.select().from(usersTable).where(eq(usersTable.id, doctor.userId)) : [null];
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, p.patientId));
    const [patientUser] = patient ? await db.select().from(usersTable).where(eq(usersTable.id, patient.userId)) : [null];

    return {
      ...p,
      doctorName: doctorUser?.name ?? null,
      patientName: patientUser?.name ?? null,
    };
  }));

  res.json({ prescriptions: enriched });
});

router.post("/prescriptions", authenticate, async (req, res): Promise<void> => {
  const { appointmentId, doctorId, patientId, medicines, instructions, validUntil } = req.body;

  if (!appointmentId || !doctorId || !patientId || !medicines) {
    res.status(400).json({ success: false, message: "Missing required fields" });
    return;
  }

  const [prescription] = await db.insert(prescriptionsTable).values({
    appointmentId,
    doctorId,
    patientId,
    medicines,
    instructions: instructions ?? null,
    validUntil: validUntil ?? null,
  }).returning();

  res.status(201).json({ ...prescription, doctorName: null, patientName: null });
});

export default router;
