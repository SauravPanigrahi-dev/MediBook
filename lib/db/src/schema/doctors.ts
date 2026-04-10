import { pgTable, text, serial, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const doctorsTable = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  specialization: text("specialization").notNull(),
  qualification: text("qualification").notNull(),
  experienceYears: integer("experience_years").notNull().default(0),
  bio: text("bio"),
  consultationFee: numeric("consultation_fee", { precision: 10, scale: 2 }).notNull().default("500"),
  avgRating: numeric("avg_rating", { precision: 3, scale: 2 }).notNull().default("0"),
  totalReviews: integer("total_reviews").notNull().default(0),
  licenseNumber: text("license_number").notNull(),
  isApproved: boolean("is_approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDoctorSchema = createInsertSchema(doctorsTable).omit({ id: true, createdAt: true });
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctorsTable.$inferSelect;
