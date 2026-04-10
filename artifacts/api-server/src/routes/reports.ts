import { Router } from "express";
import { db, reportsTable, usersTable, doctorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate } from "../lib/auth-middleware";

const router = Router();

const parseId = (raw: string | string[]): number => {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(s, 10);
};

router.get("/reports", authenticate, async (req, res): Promise<void> => {
  const { patientId, doctorId, reportType } = req.query;

  let reports = await db.select().from(reportsTable);

  if (patientId) reports = reports.filter(r => r.patientId === parseInt(String(patientId)));
  if (doctorId) reports = reports.filter(r => r.doctorId === parseInt(String(doctorId)));
  if (reportType) reports = reports.filter(r => r.reportType === reportType);

  const enriched = await Promise.all(reports.map(async r => {
    let doctorName = null;
    if (r.doctorId) {
      const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, r.doctorId));
      if (doctor) {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, doctor.userId));
        doctorName = user?.name ?? null;
      }
    }
    return { ...r, doctorName };
  }));

  res.json({ reports: enriched });
});

router.post("/reports", authenticate, async (req, res): Promise<void> => {
  const { patientId, doctorId, appointmentId, reportType, title, notes } = req.body;

  if (!patientId || !reportType || !title) {
    res.status(400).json({ success: false, message: "Missing required fields" });
    return;
  }

  const [report] = await db.insert(reportsTable).values({
    patientId,
    doctorId: doctorId ?? null,
    appointmentId: appointmentId ?? null,
    reportType,
    title,
    notes: notes ?? null,
  }).returning();

  res.status(201).json({ ...report, doctorName: null });
});

export default router;
