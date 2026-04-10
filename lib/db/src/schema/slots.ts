import { pgTable, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { doctorsTable } from "./doctors";

export const slotsTable = pgTable("slots", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctorsTable.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday...6=Saturday
  startTime: integer("start_time").notNull(), // minutes from midnight
  endTime: integer("end_time").notNull(), // minutes from midnight
  slotDurationMins: integer("slot_duration_mins").notNull().default(30),
  maxPatients: integer("max_patients").notNull().default(6),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSlotSchema = createInsertSchema(slotsTable).omit({ id: true, createdAt: true });
export type InsertSlot = z.infer<typeof insertSlotSchema>;
export type Slot = typeof slotsTable.$inferSelect;
