import { Router } from "express";
import { db, patientsTable, usersTable, appointmentsTable, reportsTable, doctorsTable } from "@workspace/db";
import { eq, and, lte } from "drizzle-orm";
import { authenticate } from "../lib/auth-middleware";

const router = Router();

const parseId = (raw: string | string[]): number => {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(s, 10);
};

router.get("/patients/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!patient) {
    res.status(404).json({ success: false, message: "Patient not found" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, patient.userId));

  res.json({
    id: patient.id,
    userId: patient.userId,
    name: user?.name ?? "",
    email: user?.email ?? "",
    avatarUrl: user?.avatarUrl ?? null,
    dob: patient.dob,
    gender: patient.gender,
    bloodGroup: patient.bloodGroup,
    phone: patient.phone,
    address: patient.address,
    emergencyContact: patient.emergencyContact,
    allergies: patient.allergies,
    chronicConditions: patient.chronicConditions,
  });
});

router.patch("/patients/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const { name, phone, dob, gender, bloodGroup, address, emergencyContact, allergies, chronicConditions, avatarUrl } = req.body;

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!patient) {
    res.status(404).json({ success: false, message: "Patient not found" });
    return;
  }

  await db.update(patientsTable).set({
    ...(phone !== undefined && { phone }),
    ...(dob !== undefined && { dob }),
    ...(gender !== undefined && { gender }),
    ...(bloodGroup !== undefined && { bloodGroup }),
    ...(address !== undefined && { address }),
    ...(emergencyContact !== undefined && { emergencyContact }),
    ...(allergies !== undefined && { allergies }),
    ...(chronicConditions !== undefined && { chronicConditions }),
  }).where(eq(patientsTable.id, id));

  if (name || avatarUrl) {
    await db.update(usersTable).set({
      ...(name && { name }),
      ...(avatarUrl && { avatarUrl }),
    }).where(eq(usersTable.id, patient.userId));
  }

  const [updatedPatient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updatedPatient.userId));

  res.json({
    id: updatedPatient.id,
    userId: updatedPatient.userId,
    name: user?.name ?? "",
    email: user?.email ?? "",
    avatarUrl: user?.avatarUrl ?? null,
    dob: updatedPatient.dob,
    gender: updatedPatient.gender,
    bloodGroup: updatedPatient.bloodGroup,
    phone: updatedPatient.phone,
    address: updatedPatient.address,
    emergencyContact: updatedPatient.emergencyContact,
    allergies: updatedPatient.allergies,
    chronicConditions: updatedPatient.chronicConditions,
  });
});

router.get("/patients/:id/dashboard", authenticate, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const today = new Date().toISOString().split("T")[0];

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!patient) {
    res.status(404).json({ success: false, message: "Patient not found" });
    return;
  }

  const allAppointments = await db.select().from(appointmentsTable).where(eq(appointmentsTable.patientId, id));

  const upcomingAppointments = allAppointments
    .filter(a => a.date >= today && ["pending", "confirmed"].includes(a.status))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const recentReports = await db.select().from(reportsTable)
    .where(eq(reportsTable.patientId, id));

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const has24HourAlert = upcomingAppointments.some(a => {
    const apptDate = new Date(a.date + "T" + a.startTime);
    return apptDate.getTime() - Date.now() < 24 * 60 * 60 * 1000;
  });

  const enrichedAppointments = await Promise.all(
    upcomingAppointments.map(async (a) => {
      const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, a.doctorId));
      const [doctorUser] = doctor ? await db.select().from(usersTable).where(eq(usersTable.id, doctor.userId)) : [null];
      return {
        ...a,
        paymentAmount: Number(a.paymentAmount),
        doctorName: doctorUser?.name ?? null,
        doctorSpecialization: doctor?.specialization ?? null,
      };
    })
  );

  const enrichedReports = await Promise.all(
    recentReports.slice(-3).map(async (r) => {
      const [doctor] = r.doctorId ? await db.select().from(doctorsTable).where(eq(doctorsTable.id, r.doctorId)) : [null];
      const [doctorUser] = doctor ? await db.select().from(usersTable).where(eq(usersTable.id, doctor.userId)) : [null];
      return {
        ...r,
        doctorName: doctorUser?.name ?? null,
      };
    })
  );

  res.json({
    upcomingAppointments: enrichedAppointments,
    recentReports: enrichedReports,
    stats: {
      total: allAppointments.length,
      completed: allAppointments.filter(a => a.status === "completed").length,
      cancelled: allAppointments.filter(a => a.status === "cancelled").length,
      upcoming: upcomingAppointments.length,
    },
    healthSummary: {
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      chronicConditions: patient.chronicConditions,
    },
    has24HourAlert,
  });
});

export default router;
