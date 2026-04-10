import { useAuth } from "@/hooks/use-auth";
import {
  useGetPatientDashboard,
  getGetPatientDashboardQueryKey,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  FileText,
  Plus,
  AlertTriangle,
  Activity,
  Pill,
  Droplet,
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function PatientDashboard() {
  const { user } = useAuth();

  // Use string "1" for the mock id since we're generating static endpoints mostly,
  // but let's use the user.patientId if it exists, or fallback to user.id
  const patientId = user?.patientId || user?.id || 1;

  const { data, isLoading } = useGetPatientDashboard(patientId, {
    query: {
      enabled: !!patientId,
      queryKey: getGetPatientDashboardQueryKey(patientId),
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-32 rounded-xl bg-white/5 animate-pulse" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="h-64 rounded-xl bg-white/5 animate-pulse md:col-span-2" />
          <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Good morning, {user?.name}</h1>
          <p className="text-white/70 mt-1">
            Here is your health overview for today.
          </p>
        </div>
        <Button asChild className="btn-primary">
          <Link href="/patient/book">
            <Plus className="w-4 h-4 mr-2" /> Book Appointment
          </Link>
        </Button>
      </div>

      {data.has24HourAlert && (
        <div className="bg-orange-500/20 border border-orange-500/50 rounded-xl p-4 flex items-start gap-4 text-orange-100">
          <AlertTriangle className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-orange-300">
              Upcoming Appointment Reminder
            </h4>
            <p className="text-sm opacity-90 mt-1">
              You have an appointment scheduled within the next 24 hours. Please
              arrive 10 minutes early.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="text-white/60 text-sm mb-1">Total Visits</div>
          <div className="text-3xl font-bold">{data.stats.total}</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-white/60 text-sm mb-1">Completed</div>
          <div className="text-3xl font-bold text-green-400">
            {data.stats.completed}
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="text-white/60 text-sm mb-1">Upcoming</div>
          <div className="text-3xl font-bold text-blue-400">
            {data.stats.upcoming}
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="text-white/60 text-sm mb-1">Cancelled</div>
          <div className="text-3xl font-bold text-white/50">
            {data.stats.cancelled}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" /> Upcoming
              Appointments
            </h2>
            <Link
              href="/patient/appointments"
              className="text-sm text-blue-300 hover:text-blue-200"
            >
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {data.upcomingAppointments.length === 0 ? (
              <div className="glass-card p-8 text-center text-white/50">
                No upcoming appointments.
              </div>
            ) : (
              data.upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="glass-card p-5 flex items-center justify-between hover-card"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-500/20 border border-blue-500/30 flex flex-col items-center justify-center">
                      <span className="text-xs font-medium text-blue-200">
                        {format(parseISO(apt.date), "MMM")}
                      </span>
                      <span className="text-xl font-bold text-blue-100">
                        {format(parseISO(apt.date), "d")}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">
                        Dr. {apt.doctorName}
                      </h4>
                      <p className="text-sm text-white/60">
                        {apt.doctorSpecialization} • {apt.startTime}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30 mb-2">
                      Token: {apt.tokenNumber}
                    </div>
                    <div className="text-sm text-white/60">
                      Wait: ~{apt.estimatedWaitMins}m
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400" /> Recent Reports
            </h2>
            <Link
              href="/patient/reports"
              className="text-sm text-teal-300 hover:text-teal-200"
            >
              View all
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {data.recentReports.length === 0 ? (
              <div className="col-span-2 glass-card p-8 text-center text-white/50">
                No recent reports available.
              </div>
            ) : (
              data.recentReports.map((report) => (
                <div key={report.id} className="glass-card p-4 hover-card">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-medium px-2 py-1 bg-white/10 rounded text-white/80">
                      {report.reportType}
                    </span>
                    <span className="text-xs text-white/50">
                      {format(parseISO(report.uploadedAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  <h4 className="font-medium line-clamp-1">{report.title}</h4>
                  <p className="text-sm text-white/60 mt-1 line-clamp-1">
                    By Dr. {report.doctorName}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-400" /> Health Summary
            </h3>

            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <Droplet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-white/60">Blood Group</div>
                  <div className="font-medium">
                    {data.healthSummary.bloodGroup || "Not specified"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-white/60">Allergies</div>
                  <div className="font-medium">
                    {data.healthSummary.allergies || "None known"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-white/60">
                    Chronic Conditions
                  </div>
                  <div className="font-medium">
                    {data.healthSummary.chronicConditions || "None reported"}
                  </div>
                </div>
              </div>
            </div>

            <Button
              asChild
              variant="ghost"
              className="w-full mt-6 bg-white/5 hover:bg-white/10 text-white border border-white/10"
            >
              <Link href="/patient/profile">Update Profile</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
