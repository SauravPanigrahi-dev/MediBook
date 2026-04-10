import { pgTable, serial, timestamp, integer, text, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { doctorsTable } from "./doctors";

export const severityEnum = pgEnum("severity", ["red", "orange", "green"]);
export const consciousEnum = pgEnum("conscious", ["yes", "no"]);
export const emergencyStatusEnum = pgEnum("emergency_status", ["open", "assigned", "resolved"]);

export const emergencyCasesTable = pgTable("emergency_cases", {
  id: serial("id").primaryKey(),
  caseId: text("case_id").notNull().unique(),
  patientName: text("patient_name").notNull(),
  age: integer("age").notNull(),
  issueType: text("issue_type").notNull(),
  severity: severityEnum("severity").notNull(),
  conscious: consciousEnum("conscious").notNull(),
  location: text("location").notNull(),
  status: emergencyStatusEnum("status").notNull().default("open"),
  assignedDoctorId: integer("assigned_doctor_id").references(() => doctorsTable.id),
  autoBookedAppointmentId: integer("auto_booked_appointment_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEmergencyCaseSchema = createInsertSchema(emergencyCasesTable).omit({ id: true, createdAt: true });
export type InsertEmergencyCase = z.infer<typeof insertEmergencyCaseSchema>;
export type EmergencyCase = typeof emergencyCasesTable.$inferSelect;
