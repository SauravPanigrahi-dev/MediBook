import { useAuth } from "@/hooks/use-auth";
import { useGetPatient, getGetPatientQueryKey, useUpdatePatient } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, Save, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function PatientProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const patientId = user?.patientId || user?.id || 1;

  const { data, isLoading } = useGetPatient(patientId, {
    query: {
      enabled: !!patientId,
      queryKey: getGetPatientQueryKey(patientId)
    }
  });

  const updatePatient = useUpdatePatient();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    bloodGroup: "",
    address: "",
    emergencyContact: "",
    allergies: "",
    chronicConditions: ""
  });

  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name || "",
        phone: data.phone || "",
        bloodGroup: data.bloodGroup || "",
        address: data.address || "",
        emergencyContact: data.emergencyContact || "",
        allergies: data.allergies || "",
        chronicConditions: data.chronicConditions || ""
      });
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePatient.mutateAsync({ id: patientId, data: formData });
      toast({ title: "Profile updated successfully" });
      queryClient.invalidateQueries({ queryKey: getGetPatientQueryKey(patientId) });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update failed", description: e.message });
    }
  };

  if (isLoading) return <div className="p-8"><div className="h-96 rounded-xl bg-white/5 animate-pulse max-w-3xl mx-auto" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full space-y-8">
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center border-4 border-white/10 shadow-xl">
          <UserCircle className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{data?.name}</h1>
          <p className="text-white/60">{data?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card p-6 space-y-6">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="glass-input" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="glass-input" />
            </div>
            <div className="space-y-2">
              <Label>Blood Group</Label>
              <Input value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} className="glass-input" placeholder="e.g. O+" />
            </div>
            <div className="space-y-2">
              <Label>Emergency Contact</Label>
              <Input value={formData.emergencyContact} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} className="glass-input" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="glass-input" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 space-y-6">
          <h2 className="text-xl font-semibold mb-4">Medical History</h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Allergies</Label>
              <textarea 
                value={formData.allergies} 
                onChange={e => setFormData({...formData, allergies: e.target.value})} 
                className="w-full glass-input min-h-[100px] p-3 text-sm" 
                placeholder="List any known allergies..."
              />
            </div>
            <div className="space-y-2">
              <Label>Chronic Conditions</Label>
              <textarea 
                value={formData.chronicConditions} 
                onChange={e => setFormData({...formData, chronicConditions: e.target.value})} 
                className="w-full glass-input min-h-[100px] p-3 text-sm" 
                placeholder="List any chronic conditions..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="btn-primary min-w-[150px]" disabled={updatePatient.isPending}>
            {updatePatient.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
