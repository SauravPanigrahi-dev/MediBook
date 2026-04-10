import { pgTable, serial, timestamp, integer, text, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { appointmentsTable } from "./appointments";
import { doctorsTable } from "./doctors";
import { patientsTable } from "./patients";

export const prescriptionsTable = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").notNull().references(() => appointmentsTable.id),
  doctorId: integer("doctor_id").notNull().references(() => doctorsTable.id),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  medicines: json("medicines").notNull().$type<Array<{ name: string; dosage: string; frequency: string; durationDays: number }>>(),
  instructions: text("instructions"),
  validUntil: text("valid_until"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPrescriptionSchema = createInsertSchema(prescriptionsTable).omit({ id: true, createdAt: true });
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Prescription = typeof prescriptionsTable.$inferSelect;
