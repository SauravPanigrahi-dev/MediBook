import { pgTable, serial, timestamp, integer, text, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { doctorsTable } from "./doctors";

export const leaveBlocksTable = pgTable("leave_blocks", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctorsTable.id),
  date: text("date").notNull(), // YYYY-MM-DD
  isFullDay: boolean("is_full_day").notNull().default(true),
  startTime: text("start_time"),
  endTime: text("end_time"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLeaveBlockSchema = createInsertSchema(leaveBlocksTable).omit({ id: true, createdAt: true });
export type InsertLeaveBlock = z.infer<typeof insertLeaveBlockSchema>;
export type LeaveBlock = typeof leaveBlocksTable.$inferSelect;
