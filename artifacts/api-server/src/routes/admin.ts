import { Router } from "express";
import { db, usersTable, doctorsTable, patientsTable, appointmentsTable, emergencyCasesTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { authenticate, allowRoles } from "../lib/auth-middleware";

const router = Router();

const parseId = (raw: string | string[]): number => {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(s, 10);
};

router.get("/admin/stats", authenticate, allowRoles("admin"), async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  const [totalDoctorsRes] = await db.select({ count: count() }).from(doctorsTable);
  const [totalPatientsRes] = await db.select({ count: count() }).from(patientsTable);
  const [pendingRes] = await db.select({ count: count() }).from(doctorsTable).where(eq(doctorsTable.isApproved, false));

  const allAppointments = await db.select().from(appointmentsTable);
  const todayAppointments = allAppointments.filter(a => a.date === today);

  const statusCounts = ["pending", "confirmed", "completed", "cancelled", "no-show"].map(status => ({
    status,
    count: allAppointments.filter(a => a.status === status).length,
  }));

  res.json({
    totalDoctors: totalDoctorsRes?.count ?? 0,
    totalPatients: totalPatientsRes?.count ?? 0,
    appointmentsToday: todayAppointments.length,
    pendingApprovals: pendingRes?.count ?? 0,
    appointmentsByStatus: statusCounts,
  });
});

router.get("/admin/pending-doctors", authenticate, allowRoles("admin"), async (req, res): Promise<void> => {
  const pending = await db.select({
    doctor: doctorsTable,
    user: usersTable,
  }).from(doctorsTable)
    .innerJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
    .where(eq(doctorsTable.isApproved, false));

  res.json({
    doctors: pending.map(({ doctor, user }) => ({
      id: doctor.id,
      userId: doctor.userId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experienceYears: doctor.experienceYears,
      bio: doctor.bio,
      consultationFee: Number(doctor.consultationFee),
      avgRating: Number(doctor.avgRating),
      totalReviews: doctor.totalReviews,
      licenseNumber: doctor.licenseNumber,
      isApproved: doctor.isApproved,
    })),
    total: pending.length,
  });
});

router.post("/admin/doctors/:id/approve", authenticate, allowRoles("admin"), async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  await db.update(doctorsTable).set({ isApproved: true }).where(eq(doctorsTable.id, id));
  res.json({ success: true, message: "Doctor approved" });
});

router.post("/admin/doctors/:id/reject", authenticate, allowRoles("admin"), async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  // Mark as not approved and deactivate the user
  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, id));
  if (doctor) {
    await db.update(usersTable).set({ isActive: false }).where(eq(usersTable.id, doctor.userId));
  }
  res.json({ success: true, message: "Doctor rejected" });
});

router.get("/admin/users", authenticate, allowRoles("admin"), async (req, res): Promise<void> => {
  const { role, q } = req.query;

  let allUsers = await db.select({
    user: usersTable,
    patient: patientsTable,
    doctor: doctorsTable,
  }).from(usersTable)
    .leftJoin(patientsTable, eq(patientsTable.userId, usersTable.id))
    .leftJoin(doctorsTable, eq(doctorsTable.userId, usersTable.id));

  if (role) allUsers = allUsers.filter(u => u.user.role === role);
  if (q) {
    const query = String(q).toLowerCase();
    allUsers = allUsers.filter(u =>
      u.user.name.toLowerCase().includes(query) ||
      u.user.email.toLowerCase().includes(query)
    );
  }

  res.json({
    users: allUsers.map(({ user, patient, doctor }) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      createdAt: user.createdAt,
      patientId: patient?.id ?? null,
      doctorId: doctor?.id ?? null,
    })),
  });
});

router.post("/admin/users/:id/toggle-active", authenticate, allowRoles("admin"), async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
  await db.update(usersTable).set({ isActive: !user.isActive }).where(eq(usersTable.id, id));
  res.json({ success: true, message: `User ${!user.isActive ? "activated" : "deactivated"}` });
});

export default router;
