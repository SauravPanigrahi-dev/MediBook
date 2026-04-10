import { pgTable, serial, timestamp, integer, text, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";
import { doctorsTable } from "./doctors";
import { appointmentsTable } from "./appointments";

export const reportTypeEnum = pgEnum("report_type", ["Blood Test", "X-Ray", "MRI", "CT Scan", "Ultrasound", "Prescription", "Other"]);

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  doctorId: integer("doctor_id").references(() => doctorsTable.id),
  appointmentId: integer("appointment_id").references(() => appointmentsTable.id),
  filePath: text("file_path"),
  fileType: text("file_type"),
  reportType: reportTypeEnum("report_type").notNull(),
  title: text("title").notNull(),
  notes: text("notes"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({ id: true, uploadedAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
