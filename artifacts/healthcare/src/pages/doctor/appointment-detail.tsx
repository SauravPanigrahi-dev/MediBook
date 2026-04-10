import { useParams } from "wouter";
import { useGetAppointment, getGetAppointmentQueryKey, useUpdateAppointment, useCreatePrescription, useCreateReport } from "@workspace/api-client-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { UserCircle, Save, FileText, Pill, Plus, Trash2, CheckCircle, Clock, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function DoctorAppointmentDetail() {
  const { id } = useParams();
  const appointmentId = parseInt(id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: apt, isLoading } = useGetAppointment(appointmentId, {
    query: {
      enabled: !!appointmentId,
      queryKey: getGetAppointmentQueryKey(appointmentId)
    }
  });

  const updateApt = useUpdateAppointment();
  const createPrescription = useCreatePrescription();
  const createReport = useCreateReport();

  // Auto-save notes
  const [notes, setNotes] = useState("");
  const notesRef = useRef("");
  
  useEffect(() => {
    if (apt?.notes && notes === "") {
      setNotes(apt.notes);
      notesRef.current = apt.notes;
    }
  }, [apt]);

  const handleNotesBlur = async () => {
    if (notes !== notesRef.current) {
      try {
        await updateApt.mutateAsync({ id: appointmentId, data: { notes } });
        notesRef.current = notes;
        toast({ title: "Notes saved" });
      } catch (e: any) {
        toast({ variant: "destructive", title: "Failed to save notes" });
      }
    }
  };

  // Prescription form
  const [medicines, setMedicines] = useState([{ name: "", dosage: "", frequency: "", durationDays: 5 }]);
  const [instructions, setInstructions] = useState("");

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: "", dosage: "", frequency: "", durationDays: 5 }]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: string, value: any) => {
    const newMeds = [...medicines];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setMedicines(newMeds);
  };

  const handleIssuePrescription = async () => {
    if (!apt) return;
    try {
      await createPrescription.mutateAsync({
        data: {
          appointmentId: apt.id,
          doctorId: apt.doctorId,
          patientId: apt.patientId,
          medicines: medicines.map(m => ({...m, durationDays: Number(m.durationDays)})),
          instructions,
        }
      });
      toast({ title: "Prescription issued" });
      setMedicines([{ name: "", dosage: "", frequency: "", durationDays: 5 }]);
      setInstructions("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to issue prescription", description: e.message });
    }
  };

  if (isLoading) return <div className="p-8"><div className="h-96 rounded-xl bg-white/5 animate-pulse max-w-5xl mx-auto" /></div>;
  if (!apt) return <div className="p-8 text-center text-white/50">Appointment not found.</div>;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          Consultation
        </h1>
        <div className="px-4 py-2 bg-white/10 rounded-lg text-sm font-medium">
          {format(parseISO(apt.date), 'MMM d, yyyy')} • {apt.startTime}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <UserCircle className="w-8 h-8 text-blue-300" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{apt.patientName}</h2>
                <span className={`text-xs px-2 py-1 rounded-md mt-1 inline-block ${apt.status === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}`}>
                  {apt.status}
                </span>
              </div>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="text-white/50 mb-1">Reason for visit</div>
                <div className="font-medium text-white/90">{apt.reason || 'General Checkup'}</div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex justify-between">
                <span className="text-white/50">Token</span>
                <span className="font-bold text-blue-300">#{apt.tokenNumber}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4"><FileText className="w-4 h-4"/> Consultation Notes</h3>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              className="w-full glass-input min-h-[200px] p-4 text-sm bg-white/5"
              placeholder="Type notes here. Auto-saves when you click outside..."
            />
            <p className="text-xs text-white/40 mt-2 text-right">Saved automatically</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 border-t-2 border-purple-400">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
              <Pill className="w-5 h-5 text-purple-400" />
              Issue Prescription
            </h2>
            
            <div className="space-y-4">
              {medicines.map((med, idx) => (
                <div key={idx} className="flex gap-3 items-start p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                    <div>
                      <Label className="text-xs text-white/50 mb-1">Medicine Name</Label>
                      <Input value={med.name} onChange={e => handleMedicineChange(idx, 'name', e.target.value)} className="glass-input h-9" placeholder="e.g. Amoxicillin" />
                    </div>
                    <div>
                      <Label className="text-xs text-white/50 mb-1">Dosage</Label>
                      <Input value={med.dosage} onChange={e => handleMedicineChange(idx, 'dosage', e.target.value)} className="glass-input h-9" placeholder="e.g. 500mg" />
                    </div>
                    <div>
                      <Label className="text-xs text-white/50 mb-1">Frequency</Label>
                      <Input value={med.frequency} onChange={e => handleMedicineChange(idx, 'frequency', e.target.value)} className="glass-input h-9" placeholder="e.g. 1-0-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-white/50 mb-1">Days</Label>
                      <Input type="number" value={med.durationDays} onChange={e => handleMedicineChange(idx, 'durationDays', e.target.value)} className="glass-input h-9" />
                    </div>
                  </div>
                  {medicines.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveMedicine(idx)} className="mt-6 text-red-400 hover:text-red-300 hover:bg-red-500/20 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button type="button" variant="outline" onClick={handleAddMedicine} className="w-full border-dashed border-white/20 text-white/70 hover:bg-white/5 hover:text-white">
                <Plus className="w-4 h-4 mr-2" /> Add Medicine
              </Button>

              <div className="mt-4">
                <Label className="text-xs text-white/50 mb-1">General Instructions</Label>
                <Input value={instructions} onChange={e => setInstructions(e.target.value)} className="glass-input" placeholder="e.g. Take after meals" />
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleIssuePrescription} disabled={createPrescription.isPending} className="bg-purple-600 hover:bg-purple-700 text-white border-none">
                  {createPrescription.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Prescription
                </Button>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6">
             <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-teal-400" />
              Quick Report Generation
            </h2>
            <div className="text-center p-8 bg-white/5 rounded-xl border border-white/10 border-dashed">
              <p className="text-white/50 text-sm mb-4">You can generate or upload standard reports for this patient.</p>
              <Button variant="secondary" className="btn-secondary">
                <Plus className="w-4 h-4 mr-2" /> Create Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
