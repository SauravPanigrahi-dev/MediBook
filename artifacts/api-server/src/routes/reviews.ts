import { Router } from "express";
import { db, reviewsTable, usersTable, doctorsTable, patientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate } from "../lib/auth-middleware";

const router = Router();

router.get("/reviews", async (req, res): Promise<void> => {
  const { patientId, doctorId } = req.query;

  let reviews = await db.select().from(reviewsTable);

  if (patientId) reviews = reviews.filter(r => r.patientId === parseInt(String(patientId)));
  if (doctorId) reviews = reviews.filter(r => r.doctorId === parseInt(String(doctorId)));

  const enriched = await Promise.all(reviews.map(async r => {
    const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, r.doctorId));
    const [doctorUser] = doctor ? await db.select().from(usersTable).where(eq(usersTable.id, doctor.userId)) : [null];
    const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, r.patientId));
    const [patientUser] = patient ? await db.select().from(usersTable).where(eq(usersTable.id, patient.userId)) : [null];

    return {
      ...r,
      doctorName: doctorUser?.name ?? null,
      patientName: patientUser?.name ?? null,
    };
  }));

  res.json({ reviews: enriched });
});

router.post("/reviews", authenticate, async (req, res): Promise<void> => {
  const { patientId, doctorId, appointmentId, rating, comment } = req.body;

  if (!patientId || !doctorId || !appointmentId || !rating) {
    res.status(400).json({ success: false, message: "Missing required fields" });
    return;
  }

  const [review] = await db.insert(reviewsTable).values({
    patientId,
    doctorId,
    appointmentId,
    rating,
    comment: comment ?? null,
  }).returning();

  // Update doctor's avg rating
  const allReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.doctorId, doctorId));
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  await db.update(doctorsTable).set({
    avgRating: String(avgRating.toFixed(2)),
    totalReviews: allReviews.length,
  }).where(eq(doctorsTable.id, doctorId));

  res.status(201).json({ ...review, doctorName: null, patientName: null });
});

export default router;
