import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetLeaveBlocks, getGetLeaveBlocksQueryKey, useCreateLeaveBlock, useDeleteLeaveBlock } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarX2, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Switch as UISwitch } from "@/components/ui/switch";

export default function DoctorLeave() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const doctorId = user?.doctorId || user?.id || 1;

  const { data, isLoading } = useGetLeaveBlocks({ doctorId }, {
    query: {
      enabled: !!doctorId,
      queryKey: getGetLeaveBlocksQueryKey({ doctorId })
    }
  });

  const createLeave = useCreateLeaveBlock();
  const deleteLeave = useDeleteLeaveBlock();

  const [date, setDate] = useState("");
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return toast({ variant: "destructive", title: "Select a date" });
    
    try {
      await createLeave.mutateAsync({
        data: {
          doctorId,
          date,
          isFullDay,
          startTime: isFullDay ? undefined : startTime,
          endTime: isFullDay ? undefined : endTime,
          reason
        }
      });
      toast({ title: "Leave block added" });
      queryClient.invalidateQueries({ queryKey: getGetLeaveBlocksQueryKey({ doctorId }) });
      setDate("");
      setReason("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to add leave", description: err.message });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteLeave.mutateAsync({ id });
      toast({ title: "Leave block removed" });
      queryClient.invalidateQueries({ queryKey: getGetLeaveBlocksQueryKey({ doctorId }) });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to remove", description: err.message });
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-8">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <CalendarX2 className="w-8 h-8 text-orange-400" />
        Manage Leaves
      </h1>

      <div className="glass-card p-6 space-y-6">
        <h2 className="text-xl font-semibold">Mark Unavailable</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Date</Label>
                <Input type="date" required value={date} onChange={e => setDate(e.target.value)} className="glass-input mt-1" />
              </div>
              <div className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-white/5">
                <Label className="cursor-pointer">Full Day Leave</Label>
                <UISwitch checked={isFullDay} onCheckedChange={setIsFullDay} />
              </div>
              
              {!isFullDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input type="time" required={!isFullDay} value={startTime} onChange={e => setStartTime(e.target.value)} className="glass-input mt-1" />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input type="time" required={!isFullDay} value={endTime} onChange={e => setEndTime(e.target.value)} className="glass-input mt-1" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4 flex flex-col">
              <div className="flex-1">
                <Label>Reason (Optional)</Label>
                <textarea 
                  value={reason} 
                  onChange={e => setReason(e.target.value)} 
                  className="w-full glass-input mt-1 min-h-[120px] p-3 text-sm" 
                  placeholder="e.g. Conference, Personal emergency..."
                />
              </div>
              <Button type="submit" className="w-full btn-primary" disabled={createLeave.isPending}>
                Add Leave Block
              </Button>
            </div>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Upcoming Leaves</h2>
        {isLoading ? (
          <div className="h-48 rounded-xl bg-white/5 animate-pulse" />
        ) : data?.leaveBlocks.length === 0 ? (
          <div className="glass-card p-12 text-center text-white/50">No upcoming leaves scheduled.</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {data?.leaveBlocks.map(block => (
              <div key={block.id} className="glass-card p-5 flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-lg text-orange-300">{format(parseISO(block.date), 'MMM do, yyyy')}</h4>
                  <p className="text-white/80 mt-1 font-medium">
                    {block.isFullDay ? 'Full Day' : `${block.startTime} - ${block.endTime}`}
                  </p>
                  {block.reason && <p className="text-sm text-white/50 mt-2">{block.reason}</p>}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDelete(block.id)}
                  disabled={deleteLeave.isPending}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
