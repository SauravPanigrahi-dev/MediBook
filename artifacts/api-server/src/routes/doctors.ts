import { Router } from "express";
import { db, doctorsTable, usersTable, slotsTable, appointmentsTable, reviewsTable, leaveBlocksTable } from "@workspace/db";
import { eq, and, gte, lte, count, avg, sql, desc, ilike, or } from "drizzle-orm";
import { authenticate, allowRoles } from "../lib/auth-middleware";

const router = Router();

// Parse numeric param helper
const parseId = (raw: string | string[]): number => {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(s, 10);
};

const buildDoctorResponse = async (doctor: typeof doctorsTable.$inferSelect) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, doctor.userId));
  return {
    id: doctor.id,
    userId: doctor.userId,
    name: user?.name ?? "",
    email: user?.email ?? "",
    avatarUrl: user?.avatarUrl ?? null,
    specialization: doctor.specialization,
    qualification: doctor.qualification,
    experienceYears: doctor.experienceYears,
    bio: doctor.bio,
    consultationFee: Number(doctor.consultationFee),
    avgRating: Number(doctor.avgRating),
    totalReviews: doctor.totalReviews,
    licenseNumber: doctor.licenseNumber,
    isApproved: doctor.isApproved,
  };
};

router.get("/doctors", async (req, res): Promise<void> => {
  const { specialization, q } = req.query;

  let query = db.select().from(doctorsTable)
    .innerJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
    .where(eq(doctorsTable.isApproved, true));

  const doctors = await db.select({
    doctor: doctorsTable,
    user: usersTable,
  }).from(doctorsTable)
    .innerJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
    .where(eq(doctorsTable.isApproved, true));

  let filtered = doctors;
  if (specialization && typeof specialization === "string") {
    filtered = filtered.filter(d => d.doctor.specialization.toLowerCase().includes(specialization.toLowerCase()));
  }
  if (q && typeof q === "string") {
    filtered = filtered.filter(d =>
      d.user.name.toLowerCase().includes(q.toLowerCase()) ||
      d.doctor.specialization.toLowerCase().includes(q.toLowerCase())
    );
  }

  res.json({
    doctors: filtered.map(({ doctor, user }) => ({
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
    total: filtered.length,
  });
});

router.get("/doctors/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, id));
  if (!doctor) {
    res.status(404).json({ success: false, message: "Doctor not found" });
    return;
  }
  const data = await buildDoctorResponse(doctor);
  const slots = await db.select().from(slotsTable).where(eq(slotsTable.doctorId, id));
  res.json({ ...data, slots });
});

router.patch("/doctors/:id", authenticate, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const { specialization, qualification, experienceYears, bio, consultationFee, avatarUrl } = req.body;

  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, id));
  if (!doctor) {
    res.status(404).json({ success: false, message: "Doctor not found" });
    return;
  }

  await db.update(doctorsTable).set({
    ...(specialization && { specialization }),
    ...(qualification && { qualification }),
    ...(experienceYears !== undefined && { experienceYears }),
    ...(bio !== undefined && { bio }),
    ...(consultationFee !== undefined && { consultationFee: String(consultationFee) }),
  }).where(eq(doctorsTable.id, id));

  if (avatarUrl) {
    await db.update(usersTable).set({ avatarUrl }).where(eq(usersTable.id, doctor.userId));
  }

  const [updatedDoctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, id));
  const data = await buildDoctorResponse(updatedDoctor);
  res.json(data);
});

router.get("/doctors/:id/dashboard", authenticate, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const today = new Date().toISOString().split("T")[0];

  const todayAppointments = await db.select({
    appt: appointmentsTable,
  }).from(appointmentsTable)
    .where(and(eq(appointmentsTable.doctorId, id), eq(appointmentsTable.date, today)));

  // Stats
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [totalCompletedRes] = await db.select({ count: count() }).from(appointmentsTable)
    .where(and(eq(appointmentsTable.doctorId, id), eq(appointmentsTable.status, "completed")));

  const [ratingRes] = await db.select({ avgRating: avg(reviewsTable.rating) }).from(reviewsTable)
    .where(eq(reviewsTable.doctorId, id));

  // Check upcoming leave
  const upcomingLeave = await db.select().from(leaveBlocksTable)
    .where(and(eq(leaveBlocksTable.doctorId, id), gte(leaveBlocksTable.date, today)));

  const queue = {
    currentToken: todayAppointments.find(a => a.appt.status === "confirmed")?.appt.tokenNumber ?? null,
    nextTokens: todayAppointments
      .filter(a => a.appt.status === "pending")
      .slice(0, 3)
      .map(a => ({
        tokenNumber: a.appt.tokenNumber,
        patientName: "Patient",
        status: a.appt.status,
        estimatedWaitMins: a.appt.estimatedWaitMins,
      })),
    totalRemaining: todayAppointments.filter(a => ["pending", "confirmed"].includes(a.appt.status)).length,
  };

  res.json({
    todayAppointments: todayAppointments.map(a => ({
      ...a.appt,
      paymentAmount: Number(a.appt.paymentAmount),
    })),
    queue,
    stats: {
      patientsToday: todayAppointments.length,
      patientsThisWeek: 0,
      avgRating: Number(ratingRes?.avgRating ?? 0),
      totalCompleted: totalCompletedRes?.count ?? 0,
    },
    upcomingLeave: upcomingLeave[0]?.date ?? null,
  });
});

router.get("/doctors/:id/queue", authenticate, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const today = new Date().toISOString().split("T")[0];

  const todayAppointments = await db.select().from(appointmentsTable)
    .where(and(eq(appointmentsTable.doctorId, id), eq(appointmentsTable.date, today)));

  const inProgress = todayAppointments.find(a => a.status === "confirmed");
  const waiting = todayAppointments.filter(a => a.status === "pending");

  res.json({
    currentToken: inProgress?.tokenNumber ?? null,
    nextTokens: waiting.slice(0, 3).map(a => ({
      tokenNumber: a.tokenNumber,
      patientName: "Patient",
      status: a.status,
      estimatedWaitMins: a.estimatedWaitMins,
    })),
    totalRemaining: waiting.length,
  });
});

router.get("/doctors/:id/analytics", authenticate, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const { range = "week" } = req.query;

  const days = range === "3months" ? 90 : range === "month" ? 30 : 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const appointments = await db.select().from(appointmentsTable)
    .where(and(eq(appointmentsTable.doctorId, id), gte(appointmentsTable.date, startDate.toISOString().split("T")[0])));

  // Build daily counts
  const dailyCounts: Record<string, number> = {};
  appointments.forEach(a => {
    dailyCounts[a.date] = (dailyCounts[a.date] || 0) + 1;
  });

  const statusCounts: Record<string, number> = {};
  appointments.forEach(a => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });

  const completed = appointments.filter(a => a.status === "completed");

  res.json({
    dailyAppointments: Object.entries(dailyCounts).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
    statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
    waitTimeTrend: Object.entries(dailyCounts).map(([date]) => ({ date, avgWaitMins: 15 })),
    totalAppointments: appointments.length,
    completionRate: appointments.length > 0 ? (completed.length / appointments.length) * 100 : 0,
  });
});

export default router;
