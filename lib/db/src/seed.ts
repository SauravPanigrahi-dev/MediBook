/**
 * Seed script for Doctor-Schedule-Refine
 *
 * Place this file at: lib/db/src/seed.ts
 *
 * Run with:
 *   DATABASE_URL=your_url pnpm --filter @workspace/db tsx src/seed.ts
 *
 * Or add to lib/db/package.json scripts:
 *   "seed": "tsx src/seed.ts"
 * Then run:
 *   DATABASE_URL=your_url pnpm --filter @workspace/db seed
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { createHash } from "crypto";
import * as schema from "./schema/index.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set before running seed.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// Simple password hasher (replace with bcrypt in production)
function hashPassword(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

async function main() {
  console.log("🌱 Starting seed...");

  // ─── 1. Users ──────────────────────────────────────────────────────────────
  console.log("  → Inserting users...");

  const [adminUser] = await db
    .insert(schema.usersTable)
    .values({
      name: "Admin User",
      email: "admin@hospital.com",
      passwordHash: hashPassword("admin123"),
      role: "admin",
      isActive: true,
    })
    .returning();

  const doctorUserRows = await db
    .insert(schema.usersTable)
    .values([
      {
        name: "Dr. Arjun Mehta",
        email: "arjun.mehta@hospital.com",
        passwordHash: hashPassword("doctor123"),
        role: "doctor",
        isActive: true,
      },
      {
        name: "Dr. Priya Sharma",
        email: "priya.sharma@hospital.com",
        passwordHash: hashPassword("doctor123"),
        role: "doctor",
        isActive: true,
      },
      {
        name: "Dr. Suresh Rao",
        email: "suresh.rao@hospital.com",
        passwordHash: hashPassword("doctor123"),
        role: "doctor",
        isActive: true,
      },
    ])
    .returning();

  const patientUserRows = await db
    .insert(schema.usersTable)
    .values([
      {
        name: "Ramesh Kumar",
        email: "ramesh.kumar@email.com",
        passwordHash: hashPassword("patient123"),
        role: "patient",
        isActive: true,
      },
      {
        name: "Sunita Patel",
        email: "sunita.patel@email.com",
        passwordHash: hashPassword("patient123"),
        role: "patient",
        isActive: true,
      },
      {
        name: "Vikram Singh",
        email: "vikram.singh@email.com",
        passwordHash: hashPassword("patient123"),
        role: "patient",
        isActive: true,
      },
    ])
    .returning();

  // ─── 2. Doctor profiles ────────────────────────────────────────────────────
  console.log("  → Inserting doctor profiles...");

  const doctorRows = await db
    .insert(schema.doctorsTable)
    .values([
      {
        userId: doctorUserRows[0].id,
        specialization: "Cardiology",
        qualification: "MBBS, MD (Cardiology)",
        experienceYears: 12,
        bio: "Specialist in interventional cardiology and heart failure management.",
        consultationFee: "800",
        licenseNumber: "MCI-12345",
        isApproved: true,
        avgRating: "4.80",
        totalReviews: 2,
      },
      {
        userId: doctorUserRows[1].id,
        specialization: "Pediatrics",
        qualification: "MBBS, MD (Pediatrics)",
        experienceYears: 8,
        bio: "Dedicated to child health, vaccinations, and developmental care.",
        consultationFee: "600",
        licenseNumber: "MCI-67890",
        isApproved: true,
        avgRating: "4.50",
        totalReviews: 2,
      },
      {
        userId: doctorUserRows[2].id,
        specialization: "Orthopedics",
        qualification: "MBBS, MS (Orthopedics)",
        experienceYears: 15,
        bio: "Expert in joint replacement, sports injuries, and spine care.",
        consultationFee: "900",
        licenseNumber: "MCI-11223",
        isApproved: true,
        avgRating: "4.30",
        totalReviews: 1,
      },
    ])
    .returning();

  // ─── 3. Patient profiles ───────────────────────────────────────────────────
  console.log("  → Inserting patient profiles...");

  const patientRows = await db
    .insert(schema.patientsTable)
    .values([
      {
        userId: patientUserRows[0].id,
        dob: "1985-06-15",
        gender: "male",
        bloodGroup: "B+",
        phone: "9876543210",
        address: "12 MG Road, Bhubaneswar, Odisha",
        emergencyContact: "9876543211",
        allergies: "Penicillin",
        chronicConditions: "Hypertension",
      },
      {
        userId: patientUserRows[1].id,
        dob: "1992-03-22",
        gender: "female",
        bloodGroup: "O+",
        phone: "9123456780",
        address: "45 Park Street, Cuttack, Odisha",
        emergencyContact: "9123456781",
        allergies: null,
        chronicConditions: "Diabetes Type 2",
      },
      {
        userId: patientUserRows[2].id,
        dob: "1978-11-08",
        gender: "male",
        bloodGroup: "A+",
        phone: "9988776655",
        address: "7 Hill View, Puri, Odisha",
        emergencyContact: "9988776656",
        allergies: "Sulfa drugs",
        chronicConditions: null,
      },
    ])
    .returning();

  // ─── 4. Slots (weekly schedule) ────────────────────────────────────────────
  console.log("  → Inserting slots...");

  // Helper: convert "HH:MM" to minutes from midnight
  const toMins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const slotRows = await db
    .insert(schema.slotsTable)
    .values([
      // Dr. Arjun – Mon & Wed morning
      {
        doctorId: doctorRows[0].id,
        dayOfWeek: 1, // Monday
        startTime: toMins("09:00"),
        endTime: toMins("13:00"),
        slotDurationMins: 30,
        maxPatients: 8,
        isActive: true,
      },
      {
        doctorId: doctorRows[0].id,
        dayOfWeek: 3, // Wednesday
        startTime: toMins("09:00"),
        endTime: toMins("12:00"),
        slotDurationMins: 30,
        maxPatients: 6,
        isActive: true,
      },
      // Dr. Priya – Tue & Thu afternoon
      {
        doctorId: doctorRows[1].id,
        dayOfWeek: 2, // Tuesday
        startTime: toMins("14:00"),
        endTime: toMins("18:00"),
        slotDurationMins: 20,
        maxPatients: 12,
        isActive: true,
      },
      {
        doctorId: doctorRows[1].id,
        dayOfWeek: 4, // Thursday
        startTime: toMins("14:00"),
        endTime: toMins("17:00"),
        slotDurationMins: 20,
        maxPatients: 9,
        isActive: true,
      },
      // Dr. Suresh – Fri morning
      {
        doctorId: doctorRows[2].id,
        dayOfWeek: 5, // Friday
        startTime: toMins("10:00"),
        endTime: toMins("14:00"),
        slotDurationMins: 30,
        maxPatients: 8,
        isActive: true,
      },
    ])
    .returning();

  // ─── 5. Appointments ───────────────────────────────────────────────────────
  console.log("  → Inserting appointments...");

  const appointmentRows = await db
    .insert(schema.appointmentsTable)
    .values([
      {
        patientId: patientRows[0].id,
        doctorId: doctorRows[0].id,
        slotId: slotRows[0].id,
        date: "2025-01-13",
        startTime: "09:00",
        endTime: "09:30",
        tokenNumber: 1,
        queuePosition: 1,
        estimatedWaitMins: 0,
        status: "completed",
        reason: "Chest pain and shortness of breath",
        notes: "Patient stabilised. Follow-up in 2 weeks.",
        paymentStatus: "paid",
        paymentAmount: "800",
      },
      {
        patientId: patientRows[1].id,
        doctorId: doctorRows[1].id,
        slotId: slotRows[2].id,
        date: "2025-01-14",
        startTime: "14:00",
        endTime: "14:20",
        tokenNumber: 1,
        queuePosition: 1,
        estimatedWaitMins: 0,
        status: "completed",
        reason: "Child vaccination – 6-month schedule",
        notes: "DTP, Hib, IPV administered. No adverse reaction.",
        paymentStatus: "paid",
        paymentAmount: "600",
      },
      {
        patientId: patientRows[2].id,
        doctorId: doctorRows[2].id,
        slotId: slotRows[4].id,
        date: "2025-01-17",
        startTime: "10:00",
        endTime: "10:30",
        tokenNumber: 1,
        queuePosition: 1,
        estimatedWaitMins: 0,
        status: "completed",
        reason: "Left knee pain post running injury",
        notes: "Partial ACL tear confirmed. Physiotherapy recommended.",
        paymentStatus: "paid",
        paymentAmount: "900",
      },
      // Upcoming appointments
      {
        patientId: patientRows[0].id,
        doctorId: doctorRows[0].id,
        slotId: slotRows[1].id,
        date: "2025-02-05",
        startTime: "09:00",
        endTime: "09:30",
        tokenNumber: 1,
        queuePosition: 1,
        estimatedWaitMins: 0,
        status: "confirmed",
        reason: "Follow-up after cardiac evaluation",
        paymentStatus: "pending",
        paymentAmount: "800",
      },
      {
        patientId: patientRows[1].id,
        doctorId: doctorRows[0].id,
        slotId: slotRows[0].id,
        date: "2025-02-10",
        startTime: "09:30",
        endTime: "10:00",
        tokenNumber: 2,
        queuePosition: 2,
        estimatedWaitMins: 30,
        status: "pending",
        reason: "Routine cardiac checkup for diabetes patient",
        paymentStatus: "pending",
        paymentAmount: "800",
      },
    ])
    .returning();

  // ─── 6. Prescriptions ──────────────────────────────────────────────────────
  console.log("  → Inserting prescriptions...");

  await db.insert(schema.prescriptionsTable).values([
    {
      appointmentId: appointmentRows[0].id,
      doctorId: doctorRows[0].id,
      patientId: patientRows[0].id,
      medicines: [
        {
          name: "Amlodipine",
          dosage: "5mg",
          frequency: "Once daily",
          durationDays: 30,
        },
        {
          name: "Aspirin",
          dosage: "75mg",
          frequency: "Once daily after food",
          durationDays: 30,
        },
      ],
      instructions:
        "Avoid salty foods. Monitor BP daily. Return immediately if chest pain recurs.",
      validUntil: "2025-02-13",
    },
    {
      appointmentId: appointmentRows[1].id,
      doctorId: doctorRows[1].id,
      patientId: patientRows[1].id,
      medicines: [
        {
          name: "Paracetamol syrup",
          dosage: "5ml",
          frequency: "Thrice daily if fever",
          durationDays: 3,
        },
      ],
      instructions:
        "Keep vaccination card updated. Schedule next visit in 6 months.",
      validUntil: "2025-01-17",
    },
    {
      appointmentId: appointmentRows[2].id,
      doctorId: doctorRows[2].id,
      patientId: patientRows[2].id,
      medicines: [
        {
          name: "Ibuprofen",
          dosage: "400mg",
          frequency: "Twice daily after food",
          durationDays: 7,
        },
        {
          name: "Diclofenac gel",
          dosage: "Apply thin layer",
          frequency: "Twice daily on knee",
          durationDays: 14,
        },
      ],
      instructions:
        "Rest the knee. Use ice pack 3x daily. Start physiotherapy within 1 week.",
      validUntil: "2025-01-31",
    },
  ]);

  // ─── 7. Reviews ────────────────────────────────────────────────────────────
  console.log("  → Inserting reviews...");

  await db.insert(schema.reviewsTable).values([
    {
      patientId: patientRows[0].id,
      doctorId: doctorRows[0].id,
      appointmentId: appointmentRows[0].id,
      rating: 5,
      comment:
        "Dr. Mehta explained everything clearly and was very patient. Excellent care.",
    },
    {
      patientId: patientRows[1].id,
      doctorId: doctorRows[1].id,
      appointmentId: appointmentRows[1].id,
      rating: 4,
      comment: "Very gentle with the child. Highly recommended for pediatrics.",
    },
    {
      patientId: patientRows[2].id,
      doctorId: doctorRows[2].id,
      appointmentId: appointmentRows[2].id,
      rating: 4,
      comment: "Good diagnosis. Wish there was more time to discuss options.",
    },
  ]);

  // ─── 8. Reports ────────────────────────────────────────────────────────────
  console.log("  → Inserting reports...");

  await db.insert(schema.reportsTable).values([
    {
      patientId: patientRows[0].id,
      doctorId: doctorRows[0].id,
      appointmentId: appointmentRows[0].id,
      reportType: "Blood Test",
      title: "Complete Blood Count – Jan 2025",
      notes: "HbA1c: 6.1. Cholesterol elevated at 210 mg/dL. Follow up needed.",
      filePath: null,
      fileType: null,
    },
    {
      patientId: patientRows[2].id,
      doctorId: doctorRows[2].id,
      appointmentId: appointmentRows[2].id,
      reportType: "MRI",
      title: "Left Knee MRI – Jan 2025",
      notes: "Partial ACL tear. No bone fracture detected.",
      filePath: null,
      fileType: null,
    },
  ]);

  // ─── 9. Leave blocks ───────────────────────────────────────────────────────
  console.log("  → Inserting leave blocks...");

  await db.insert(schema.leaveBlocksTable).values([
    {
      doctorId: doctorRows[0].id,
      date: "2025-01-26", // Republic Day
      isFullDay: true,
      reason: "National holiday",
    },
    {
      doctorId: doctorRows[1].id,
      date: "2025-02-03",
      isFullDay: false,
      startTime: "14:00",
      endTime: "16:00",
      reason: "Medical conference",
    },
  ]);

  // ─── 10. Emergency cases ───────────────────────────────────────────────────
  console.log("  → Inserting emergency cases...");

  await db.insert(schema.emergencyCasesTable).values([
    {
      caseId: "EM-2025-001",
      patientName: "Unknown Male",
      age: 45,
      issueType: "Chest pain",
      severity: "red",
      conscious: "yes",
      location: "Main entrance",
      status: "assigned",
      assignedDoctorId: doctorRows[0].id,
      autoBookedAppointmentId: null,
    },
    {
      caseId: "EM-2025-002",
      patientName: "Geeta Mishra",
      age: 32,
      issueType: "Allergic reaction",
      severity: "orange",
      conscious: "yes",
      location: "OPD Block A",
      status: "resolved",
      assignedDoctorId: doctorRows[1].id,
      autoBookedAppointmentId: null,
    },
    {
      caseId: "EM-2025-003",
      patientName: "Unknown Child",
      age: 7,
      issueType: "High fever with seizure",
      severity: "red",
      conscious: "no",
      location: "Parking lot",
      status: "open",
      assignedDoctorId: null,
      autoBookedAppointmentId: null,
    },
  ]);

  console.log("✅ Seed complete!");
  console.log("\nTest credentials:");
  console.log("  Admin  → admin@hospital.com        / admin123");
  console.log("  Doctor → arjun.mehta@hospital.com  / doctor123");
  console.log("  Doctor → priya.sharma@hospital.com / doctor123");
  console.log("  Doctor → suresh.rao@hospital.com   / doctor123");
  console.log("  Patient→ ramesh.kumar@email.com    / patient123");
  console.log("  Patient→ sunita.patel@email.com    / patient123");
  console.log("  Patient→ vikram.singh@email.com    / patient123");

  await pool.end();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  pool.end();
  process.exit(1);
});
