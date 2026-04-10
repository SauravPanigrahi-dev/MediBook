import { Router } from "express";
import { db, doctorsTable, usersTable, reportsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/search", async (req, res): Promise<void> => {
  const { q, type = "all" } = req.query;

  if (!q || String(q).length < 2) {
    res.json({ doctors: [], reports: [] });
    return;
  }

  const query = String(q).toLowerCase();

  let doctors: any[] = [];
  let reports: any[] = [];

  if (type === "all" || type === "doctors") {
    const allDoctors = await db.select({
      doctor: doctorsTable,
      user: usersTable,
    }).from(doctorsTable)
      .innerJoin(usersTable, eq(doctorsTable.userId, usersTable.id))
      .where(eq(doctorsTable.isApproved, true));

    doctors = allDoctors
      .filter(({ user, doctor }) =>
        user.name.toLowerCase().includes(query) ||
        doctor.specialization.toLowerCase().includes(query)
      )
      .slice(0, 5)
      .map(({ doctor, user }) => ({
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
      }));
  }

  if (type === "all" || type === "reports") {
    const allReports = await db.select().from(reportsTable);
    reports = allReports
      .filter(r => r.title.toLowerCase().includes(query))
      .slice(0, 5);
  }

  res.json({ doctors, reports });
});

export default router;
