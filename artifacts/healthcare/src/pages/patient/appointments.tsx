import { useAuth } from "@/hooks/use-auth";
import { useGetAppointments, getGetAppointmentsQueryKey, useCancelAppointment } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInHours } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarX2, Clock, CheckCircle, XCircle } from "lucide-react";

export default function PatientAppointments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const patientId = user?.patientId || user?.id || 1;

  const { data, isLoading } = useGetAppointments({ patientId }, {
    query: {
      enabled: !!patientId,
      queryKey: getGetAppointmentsQueryKey({ patientId })
    }
  });

  const cancelApt = useCancelAppointment();

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await cancelApt.mutateAsync({ id });
      toast({ title: "Appointment Cancelled" });
      queryClient.invalidateQueries({ queryKey: getGetAppointmentsQueryKey({ patientId }) });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to cancel", description: e.message });
    }
  };

  if (isLoading) return <div className="p-8"><div className="h-64 rounded-xl bg-white/5 animate-pulse" /></div>;

  const appointments = data?.appointments || [];
  const upcoming = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed');
  const past = appointments.filter(a => a.status === 'completed');
  const cancelled = appointments.filter(a => a.status === 'cancelled' || a.status === 'no-show');

  const renderAptCard = (apt: any, type: 'upcoming' | 'past' | 'cancelled') => {
    const isCancelable = type === 'upcoming' && differenceInHours(parseISO(`${apt.date}T${apt.startTime}`), new Date()) > 24;

    return (
      <div key={apt.id} className="glass-card p-5 mb-4 hover-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center border ${
            type === 'upcoming' ? 'bg-blue-500/20 border-blue-500/30' : 
            type === 'past' ? 'bg-green-500/20 border-green-500/30' : 
            'bg-white/5 border-white/10'
          }`}>
            <span className="text-xs font-medium opacity-80">{format(parseISO(apt.date), 'MMM')}</span>
            <span className="text-xl font-bold">{format(parseISO(apt.date), 'd')}</span>
          </div>
          <div>
            <h4 className="font-semibold text-lg">Dr. {apt.doctorName}</h4>
            <p className="text-sm text-white/60">{apt.doctorSpecialization}</p>
            <div className="flex items-center gap-2 mt-2 text-sm text-white/80">
              <Clock className="w-4 h-4" /> {apt.startTime} - {apt.endTime}
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-white/10 pt-4 md:pt-0 mt-4 md:mt-0 gap-4">
          <div className="flex items-center gap-2">
            {type === 'upcoming' && <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-md border border-blue-500/30">Token: {apt.tokenNumber}</span>}
            {type === 'past' && <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-md border border-green-500/30 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Completed</span>}
            {type === 'cancelled' && <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-md border border-red-500/30 flex items-center gap-1"><XCircle className="w-3 h-3"/> Cancelled</span>}
          </div>
          
          {type === 'upcoming' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleCancel(apt.id)}
              disabled={!isCancelable || cancelApt.isPending}
              className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 bg-transparent"
              title={!isCancelable ? "Cannot cancel within 24 hours of appointment" : ""}
            >
              <CalendarX2 className="w-4 h-4 mr-2" /> Cancel
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
      <h1 className="text-3xl font-bold">My Appointments</h1>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="bg-white/10 p-1 rounded-lg w-full max-w-md mb-6">
          <TabsTrigger value="upcoming" className="flex-1 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">Upcoming</TabsTrigger>
          <TabsTrigger value="past" className="flex-1 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">Past</TabsTrigger>
          <TabsTrigger value="cancelled" className="flex-1 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="page-transition-enter-active mt-0">
          {upcoming.length === 0 ? (
            <div className="glass-card p-12 text-center text-white/50">No upcoming appointments.</div>
          ) : (
            upcoming.map(apt => renderAptCard(apt, 'upcoming'))
          )}
        </TabsContent>

        <TabsContent value="past" className="page-transition-enter-active mt-0">
          {past.length === 0 ? (
            <div className="glass-card p-12 text-center text-white/50">No past appointments.</div>
          ) : (
            past.map(apt => renderAptCard(apt, 'past'))
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="page-transition-enter-active mt-0">
          {cancelled.length === 0 ? (
            <div className="glass-card p-12 text-center text-white/50">No cancelled appointments.</div>
          ) : (
            cancelled.map(apt => renderAptCard(apt, 'cancelled'))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
