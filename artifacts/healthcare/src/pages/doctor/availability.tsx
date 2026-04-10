import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetSlots, getGetSlotsQueryKey, useCreateSlot, useUpdateSlot, useDeleteSlot } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Plus, Trash2 } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DoctorAvailability() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const doctorId = user?.doctorId || user?.id || 1;

  const { data, isLoading } = useGetSlots({ doctorId }, {
    query: {
      enabled: !!doctorId,
      queryKey: getGetSlotsQueryKey({ doctorId })
    }
  });

  const createSlot = useCreateSlot();
  const deleteSlot = useDeleteSlot();

  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotDurationMins, setSlotDurationMins] = useState("30");
  const [maxPatients, setMaxPatients] = useState("15");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSlot.mutateAsync({
        data: {
          doctorId,
          dayOfWeek: parseInt(dayOfWeek),
          startTime,
          endTime,
          slotDurationMins: parseInt(slotDurationMins),
          maxPatients: parseInt(maxPatients)
        }
      });
      toast({ title: "Slot added successfully" });
      queryClient.invalidateQueries({ queryKey: getGetSlotsQueryKey({ doctorId }) });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to add slot", description: err.message });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSlot.mutateAsync({ id });
      toast({ title: "Slot deleted" });
      queryClient.invalidateQueries({ queryKey: getGetSlotsQueryKey({ doctorId }) });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to delete", description: err.message });
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <Clock className="w-8 h-8 text-blue-400" />
        Availability & Schedule
      </h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="glass-card p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-6">Add Schedule</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <Label>Day of Week</Label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger className="glass-input mt-1">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent className="glass-card text-white">
                    {DAYS.map((day, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} className="glass-input mt-1" />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} className="glass-input mt-1" />
                </div>
              </div>
              <div>
                <Label>Slot Duration (mins)</Label>
                <Select value={slotDurationMins} onValueChange={setSlotDurationMins}>
                  <SelectTrigger className="glass-input mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card text-white">
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="20">20 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Max Patients</Label>
                <Input type="number" required min="1" value={maxPatients} onChange={e => setMaxPatients(e.target.value)} className="glass-input mt-1" />
              </div>
              <Button type="submit" className="w-full btn-primary mt-2" disabled={createSlot.isPending}>
                <Plus className="w-4 h-4 mr-2" /> Add Schedule
              </Button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold">Current Schedule</h2>
          {isLoading ? (
            <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
          ) : data?.slots.length === 0 ? (
            <div className="glass-card p-12 text-center text-white/50">No schedules configured.</div>
          ) : (
            <div className="space-y-4">
              {DAYS.map((day, dayIdx) => {
                const daySlots = data?.slots.filter(s => s.dayOfWeek === dayIdx) || [];
                if (daySlots.length === 0) return null;
                
                return (
                  <div key={dayIdx} className="glass-card overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/10 bg-white/5 font-semibold text-lg">
                      {day}
                    </div>
                    <div className="p-0">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-white/50 text-xs uppercase tracking-wider">
                            <th className="p-4 font-medium">Time</th>
                            <th className="p-4 font-medium">Duration</th>
                            <th className="p-4 font-medium">Max Patients</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {daySlots.map(slot => (
                            <tr key={slot.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 font-medium">{slot.startTime} - {slot.endTime}</td>
                              <td className="p-4 text-white/80">{slot.slotDurationMins} min</td>
                              <td className="p-4 text-white/80">{slot.maxPatients}</td>
                              <td className="p-4 text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDelete(slot.id)}
                                  disabled={deleteSlot.isPending}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
