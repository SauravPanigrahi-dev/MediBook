import { useAuth } from "@/hooks/use-auth";
import { useGetDoctor, getGetDoctorQueryKey, useUpdateDoctor } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, Save, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function DoctorProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const doctorId = user?.doctorId || user?.id || 1;

  const { data, isLoading } = useGetDoctor(doctorId, {
    query: {
      enabled: !!doctorId,
      queryKey: getGetDoctorQueryKey(doctorId)
    }
  });

  const updateDoctor = useUpdateDoctor();

  const [formData, setFormData] = useState({
    specialization: "",
    qualification: "",
    experienceYears: "",
    bio: "",
    consultationFee: ""
  });

  useEffect(() => {
    if (data) {
      setFormData({
        specialization: data.specialization || "",
        qualification: data.qualification || "",
        experienceYears: data.experienceYears?.toString() || "",
        bio: data.bio || "",
        consultationFee: data.consultationFee?.toString() || ""
      });
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoctor.mutateAsync({ 
        id: doctorId, 
        data: {
          specialization: formData.specialization,
          qualification: formData.qualification,
          experienceYears: parseInt(formData.experienceYears) || 0,
          bio: formData.bio,
          consultationFee: parseInt(formData.consultationFee) || 0
        } 
      });
      toast({ title: "Profile updated successfully" });
      queryClient.invalidateQueries({ queryKey: getGetDoctorQueryKey(doctorId) });
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
          <h1 className="text-3xl font-bold">Dr. {data?.name}</h1>
          <p className="text-white/60">{data?.email} • License: {data?.licenseNumber}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card p-6 space-y-6">
          <h2 className="text-xl font-semibold mb-4">Professional Details</h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Specialization</Label>
              <Input value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} className="glass-input" />
            </div>
            <div className="space-y-2">
              <Label>Qualification</Label>
              <Input value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} className="glass-input" />
            </div>
            <div className="space-y-2">
              <Label>Experience (Years)</Label>
              <Input type="number" value={formData.experienceYears} onChange={e => setFormData({...formData, experienceYears: e.target.value})} className="glass-input" />
            </div>
            <div className="space-y-2">
              <Label>Consultation Fee ($)</Label>
              <Input type="number" value={formData.consultationFee} onChange={e => setFormData({...formData, consultationFee: e.target.value})} className="glass-input" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Professional Bio</Label>
              <textarea 
                value={formData.bio} 
                onChange={e => setFormData({...formData, bio: e.target.value})} 
                className="w-full glass-input min-h-[120px] p-3 text-sm" 
                placeholder="Describe your expertise and practice..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="btn-primary min-w-[150px]" disabled={updateDoctor.isPending}>
            {updateDoctor.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
