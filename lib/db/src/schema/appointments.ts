import { pgTable, serial, timestamp, integer, text, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";
import { doctorsTable } from "./doctors";
import { slotsTable } from "./slots";

export const appointmentStatusEnum = pgEnum("appointment_status", ["pending", "confirmed", "completed", "cancelled", "no-show"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "refunded"]);

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => patientsTable.id),
  doctorId: integer("doctor_id").notNull().references(() => doctorsTable.id),
  slotId: integer("slot_id").notNull().references(() => slotsTable.id),
  date: text("date").notNull(), // YYYY-MM-DD
  startTime: text("start_time").notNull(), // HH:MM
  endTime: text("end_time").notNull(), // HH:MM
  tokenNumber: integer("token_number").notNull(),
  queuePosition: integer("queue_position").notNull(),
  estimatedWaitMins: integer("estimated_wait_mins").notNull().default(0),
  status: appointmentStatusEnum("status").notNull().default("pending"),
  reason: text("reason"),
  notes: text("notes"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  paymentAmount: numeric("payment_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({ id: true, createdAt: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
