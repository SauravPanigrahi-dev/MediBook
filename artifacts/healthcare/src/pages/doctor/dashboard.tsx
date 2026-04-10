import { useAuth } from "@/hooks/use-auth";
import { useGetDoctorDashboard, getGetDoctorDashboardQueryKey, useCompleteAppointment } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Users, Star, CheckCircle, Activity, Clock, CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const doctorId = user?.doctorId || user?.id || 1;
  
  const { data, isLoading } = useGetDoctorDashboard(doctorId, {
    query: {
      enabled: !!doctorId,
      queryKey: getGetDoctorDashboardQueryKey(doctorId),
      refetchInterval: 30000 // Poll every 30s
    }
  });

  const completeMutation = useCompleteAppointment();

  const handleComplete = async (aptId: number) => {
    try {
      await completeMutation.mutateAsync({ id: aptId, data: {} });
      toast({ title: "Appointment marked as completed" });
      queryClient.invalidateQueries({ queryKey: getGetDoctorDashboardQueryKey(doctorId) });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to update", description: e.message });
    }
  };

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
          <h1 className="text-3xl font-bold">Welcome, Dr. {user?.name}</h1>
          <p className="text-white/70 mt-1">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
        </div>
      </div>

      {data.upcomingLeave && (
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 flex items-start gap-4 text-blue-100">
          <CalendarDays className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-300">Upcoming Leave Reminder</h4>
            <p className="text-sm opacity-90 mt-1">You have approved leave scheduled starting {format(parseISO(data.upcomingLeave), 'MMM do')}.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="text-white/60 text-sm mb-1">Patients Today</div>
          <div className="text-3xl font-bold text-blue-400">{data.stats.patientsToday}</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-white/60 text-sm mb-1">This Week</div>
          <div className="text-3xl font-bold">{data.stats.patientsThisWeek}</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-white/60 text-sm mb-1">Total Completed</div>
          <div className="text-3xl font-bold text-green-400">{data.stats.totalCompleted}</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-white/60 text-sm mb-1">Avg Rating</div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-yellow-400">{data.stats.avgRating.toFixed(1)}</span>
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-400"/> Today's Schedule
          </h2>
          
          <div className="space-y-4">
            {data.todayAppointments.length === 0 ? (
              <div className="glass-card p-8 text-center text-white/50">
                No appointments scheduled for today.
              </div>
            ) : (
              data.todayAppointments.map(apt => (
                <div key={apt.id} className="glass-card p-5 flex items-center justify-between hover-card">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-white/10 flex flex-col items-center justify-center border border-white/20">
                      <span className="text-sm font-medium text-white/80">{apt.startTime}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{apt.patientName}</h4>
                      <p className="text-sm text-white/60">Token: {apt.tokenNumber} • Reason: {apt.reason || 'General'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button asChild variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white">
                      <Link href={`/doctor/appointment/${apt.id}`}>View Details</Link>
                    </Button>
                    {apt.status === 'confirmed' && (
                      <Button 
                        onClick={() => handleComplete(apt.id)} 
                        disabled={completeMutation.isPending}
                        className="bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Mark Complete
                      </Button>
                    )}
                    {apt.status === 'completed' && (
                      <span className="text-green-400 flex items-center text-sm font-medium">
                        <CheckCircle className="w-4 h-4 mr-1" /> Completed
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 bg-gradient-to-b from-white/10 to-transparent border-t-2 border-t-blue-400">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-blue-400"/> Live Queue</h3>
              <div className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </div>
            </div>
            
            <div className="mb-8 text-center">
              <div className="text-white/60 text-sm mb-2">Current Token</div>
              <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-300 to-teal-300">
                {data.queue.currentToken ? `#${data.queue.currentToken}` : '--'}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">Up Next</div>
              {data.queue.nextTokens.length === 0 ? (
                <div className="text-center text-white/40 text-sm py-4">Queue is empty</div>
              ) : (
                data.queue.nextTokens.map((token, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-blue-300">#{token.tokenNumber}</span>
                      <span className="font-medium text-white/90">{token.patientName}</span>
                    </div>
                    <span className="text-xs text-white/50">~{token.estimatedWaitMins}m</span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-sm">
              <span className="text-white/60">Total Remaining</span>
              <span className="font-bold text-lg">{data.queue.totalRemaining}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
