import { Router } from "express";
import { db, emergencyCasesTable, doctorsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

router.get("/emergency", async (req, res): Promise<void> => {
  const cases = await db.select().from(emergencyCasesTable);

  const enriched = await Promise.all(cases.map(async c => {
    let assignedDoctorName = null;
    if (c.assignedDoctorId) {
      const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, c.assignedDoctorId));
      if (doctor) {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, doctor.userId));
        assignedDoctorName = user?.name ?? null;
      }
    }
    return { ...c, assignedDoctorName };
  }));

  res.json({ cases: enriched });
});

router.post("/emergency", async (req, res): Promise<void> => {
  const { patientName, age, issueType, severity, conscious, location } = req.body;

  if (!patientName || !age || !issueType || !severity || !conscious || !location) {
    res.status(400).json({ success: false, message: "Missing required fields" });
    return;
  }

  // For orange severity: auto-assign first available doctor
  let assignedDoctorId = null;
  let autoBookedAppointmentId = null;

  if (severity === "orange") {
    const [availableDoctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.isApproved, true));
    if (availableDoctor) {
      assignedDoctorId = availableDoctor.id;
    }
  }

  const [emergencyCase] = await db.insert(emergencyCasesTable).values({
    caseId: randomUUID(),
    patientName,
    age,
    issueType,
    severity,
    conscious,
    location,
    status: assignedDoctorId ? "assigned" : "open",
    assignedDoctorId,
    autoBookedAppointmentId,
  }).returning();

  let assignedDoctorName = null;
  if (assignedDoctorId) {
    const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, assignedDoctorId));
    if (doctor) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, doctor.userId));
      assignedDoctorName = user?.name ?? null;
    }
  }

  res.status(201).json({ ...emergencyCase, assignedDoctorName });
});

router.get("/emergency/er-status", async (req, res): Promise<void> => {
  res.json({
    hospitals: [
      { name: "City General Hospital", distance: "1.2 km", waitTime: "12 min", availableBeds: 8, status: "Available" },
      { name: "Metro Medical Center", distance: "2.8 km", waitTime: "25 min", availableBeds: 3, status: "Busy" },
      { name: "Apollo Emergency Care", distance: "3.5 km", waitTime: "8 min", availableBeds: 15, status: "Available" },
    ],
  });
});

router.post("/emergency/ambulance", async (req, res): Promise<void> => {
  const { location, caseId } = req.body;

  res.json({
    driverName: "Rajesh Kumar",
    vehicleNumber: "MH-01-AB-1234",
    etaMinutes: Math.floor(Math.random() * 8) + 5,
    phone: "+91 98765 43210",
  });
});

export default router;
