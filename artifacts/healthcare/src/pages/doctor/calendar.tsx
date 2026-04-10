import { useAuth } from "@/hooks/use-auth";
import { useGetAppointments, getGetAppointmentsQueryKey } from "@workspace/api-client-react";
import { Calendar as CalendarIcon, User as UserIcon } from "lucide-react";
import { format, addDays, startOfWeek, parseISO } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function DoctorCalendar() {
  const { user } = useAuth();
  const doctorId = user?.doctorId || user?.id || 1;
  const [selectedApt, setSelectedApt] = useState<any>(null);

  const { data, isLoading } = useGetAppointments({ doctorId }, {
    query: {
      enabled: !!doctorId,
      queryKey: getGetAppointmentsQueryKey({ doctorId })
    }
  });

  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  if (isLoading) return <div className="p-8"><div className="h-96 rounded-xl bg-white/5 animate-pulse max-w-5xl mx-auto" /></div>;

  const appointments = data?.appointments || [];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-8">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <CalendarIcon className="w-8 h-8 text-blue-400" />
        Calendar View
      </h1>

      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
          {weekDays.map((date, i) => (
            <div key={i} className="p-4 text-center border-r border-white/10 last:border-0">
              <div className="text-xs text-white/50 uppercase font-medium">{format(date, 'EEE')}</div>
              <div className="text-xl font-bold mt-1">{format(date, 'd')}</div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 min-h-[500px]">
          {weekDays.map((date, dayIdx) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayApts = appointments.filter(a => a.date === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime));
            
            return (
              <div key={dayIdx} className="border-r border-white/10 last:border-0 p-2 space-y-2">
                {dayApts.map(apt => {
                  const statusColors = {
                    confirmed: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
                    completed: 'bg-green-500/20 text-green-200 border-green-500/30',
                    cancelled: 'bg-white/10 text-white/50 border-white/20',
                    pending: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30'
                  };
                  const color = statusColors[apt.status as keyof typeof statusColors] || statusColors.confirmed;

                  return (
                    <div 
                      key={apt.id}
                      onClick={() => setSelectedApt(apt)}
                      className={`p-2 rounded-lg border text-xs cursor-pointer hover:opacity-80 transition-opacity ${color}`}
                    >
                      <div className="font-semibold">{apt.startTime}</div>
                      <div className="truncate mt-1">{apt.patientName}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selectedApt} onOpenChange={() => setSelectedApt(null)}>
        <DialogContent className="glass-card border-white/20 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <UserIcon className="w-5 h-5 text-blue-400" />
              Appointment Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedApt && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-xs text-white/50 mb-1">Patient</div>
                  <div className="font-semibold">{selectedApt.patientName}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-xs text-white/50 mb-1">Time</div>
                  <div className="font-semibold">{format(parseISO(selectedApt.date), 'MMM d')} • {selectedApt.startTime}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-xs text-white/50 mb-1">Status</div>
                  <div className="font-semibold capitalize">{selectedApt.status}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-xs text-white/50 mb-1">Token</div>
                  <div className="font-semibold">#{selectedApt.tokenNumber}</div>
                </div>
              </div>
              
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="text-xs text-white/50 mb-1">Reason</div>
                <div className="text-sm">{selectedApt.reason || 'Not specified'}</div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setSelectedApt(null)} className="bg-transparent border-white/20 text-white hover:bg-white/10">Close</Button>
                <Button asChild className="btn-primary">
                  <Link href={`/doctor/appointment/${selectedApt.id}`}>View Full Details</Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
