import { useState, useEffect } from "react";
import { AlertCircle, Phone, X, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreateEmergencyCase, useRequestAmbulance } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const issueTypes = [
  "Chest Pain", "Breathing", "Trauma", "Stroke", "Seizure", "Other"
];

export function EmergencyButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  // Form State
  const [issueType, setIssueType] = useState("");
  const [severity, setSeverity] = useState<"red" | "orange" | "green" | "">("");
  const [age, setAge] = useState("");
  const [conscious, setConscious] = useState<"yes" | "no">("yes");
  const [location, setLocation] = useState("");
  
  // Result State
  const [caseId, setCaseId] = useState("");
  const [ambulanceRequested, setAmbulanceRequested] = useState(false);
  const [eta, setEta] = useState(0);

  const createEmergency = useCreateEmergencyCase();
  const requestAmbulance = useRequestAmbulance();

  const handleNext = () => {
    if (step === 1 && !issueType) return toast({ variant: "destructive", title: "Select an issue type" });
    if (step === 2 && !severity) return toast({ variant: "destructive", title: "Select severity" });
    if (step === 3) {
      if (!age || !location) return toast({ variant: "destructive", title: "Fill all details" });
      submitCase();
      return;
    }
    setStep(s => s + 1);
  };

  const submitCase = async () => {
    try {
      const res = await createEmergency.mutateAsync({
        data: {
          patientName: "Emergency Patient", // Could take from auth if logged in
          age: parseInt(age),
          issueType,
          severity: severity as any,
          conscious: conscious,
          location
        }
      });
      setCaseId(res.caseId);
      setStep(4);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error submitting case", description: e.message });
    }
  };

  const handleAmbulance = async () => {
    try {
      const res = await requestAmbulance.mutateAsync({
        data: { location, caseId }
      });
      setAmbulanceRequested(true);
      setEta(res.etaMinutes);
      
      // Fake countdown
      const interval = setInterval(() => {
        setEta(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 60000);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to request ambulance", description: e.message });
    }
  };

  const reset = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStep(1);
      setIssueType("");
      setSeverity("");
      setAge("");
      setConscious("yes");
      setLocation("");
      setCaseId("");
      setAmbulanceRequested(false);
      setEta(0);
    }, 300);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.6)] hover:scale-110 transition-transform"
      >
        <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-75" />
        <AlertCircle className="w-8 h-8" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6 relative animate-in zoom-in-95 duration-200">
            <button onClick={reset} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <X className="w-6 h-6" />
            </button>

            <div className="mb-6 flex items-center gap-3 text-red-400">
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold text-white">Emergency Triage</h2>
            </div>

            <div className="flex gap-2 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-2 flex-1 rounded-full ${step >= i ? 'bg-red-500' : 'bg-white/10'}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">What is the primary issue?</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {issueTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setIssueType(type)}
                      className={`p-4 rounded-xl border ${issueType === type ? 'bg-red-500/20 border-red-500' : 'bg-white/5 border-white/10 hover:bg-white/10'} transition-all`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">How severe is it?</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setSeverity("red")}
                    className={`w-full p-4 rounded-xl border text-left flex gap-4 ${severity === 'red' ? 'bg-red-500/20 border-red-500' : 'bg-white/5 border-white/10'}`}
                  >
                    <div className="w-4 h-4 rounded-full bg-red-500 mt-1 shrink-0" />
                    <div>
                      <div className="font-bold text-red-400">Red (Life-threatening)</div>
                      <div className="text-sm text-white/70">Unconscious, not breathing, severe bleeding, suspected stroke</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setSeverity("orange")}
                    className={`w-full p-4 rounded-xl border text-left flex gap-4 ${severity === 'orange' ? 'bg-orange-500/20 border-orange-500' : 'bg-white/5 border-white/10'}`}
                  >
                    <div className="w-4 h-4 rounded-full bg-orange-500 mt-1 shrink-0" />
                    <div>
                      <div className="font-bold text-orange-400">Orange (Urgent)</div>
                      <div className="text-sm text-white/70">Severe pain, possible fracture, breathing difficulty</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setSeverity("green")}
                    className={`w-full p-4 rounded-xl border text-left flex gap-4 ${severity === 'green' ? 'bg-green-500/20 border-green-500' : 'bg-white/5 border-white/10'}`}
                  >
                    <div className="w-4 h-4 rounded-full bg-green-500 mt-1 shrink-0" />
                    <div>
                      <div className="font-bold text-green-400">Green (Non-urgent)</div>
                      <div className="text-sm text-white/70">Minor injuries, mild pain, stable condition</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold mb-4">Patient Details</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Estimated Age</Label>
                    <Input type="number" value={age} onChange={e => setAge(e.target.value)} className="glass-input mt-1" />
                  </div>
                  <div>
                    <Label className="mb-2 block">Is the patient conscious?</Label>
                    <RadioGroup value={conscious} onValueChange={(v: "yes"|"no") => setConscious(v)} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="c-yes" className="border-white/50 text-white" />
                        <Label htmlFor="c-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="c-no" className="border-white/50 text-white" />
                        <Label htmlFor="c-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    <Label>Current Location / Address</Label>
                    <Input value={location} onChange={e => setLocation(e.target.value)} className="glass-input mt-1" placeholder="e.g. 123 Main St" />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                  {severity === "red" && (
                    <div className="space-y-6">
                      <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                      <div>
                        <h3 className="text-2xl font-bold text-red-400">LIFE THREATENING</h3>
                        <p className="text-white/80 mt-2">Please call emergency services immediately.</p>
                      </div>
                      
                      <div className="grid gap-3">
                        <Button className="w-full h-14 text-lg bg-red-600 hover:bg-red-700 text-white border-none" onClick={() => window.open('tel:112')}>
                          <Phone className="mr-2" /> Call 112
                        </Button>
                        
                        {!ambulanceRequested ? (
                          <Button className="w-full h-14 text-lg btn-secondary" onClick={handleAmbulance} disabled={requestAmbulance.isPending}>
                            Request Ambulance
                          </Button>
                        ) : (
                          <div className="p-4 bg-orange-500/20 border border-orange-500/50 rounded-xl text-orange-200">
                            <Clock className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                            <div className="font-bold text-xl">ETA: {eta} mins</div>
                            <div className="text-sm opacity-80">Ambulance dispatched</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {severity === "orange" && (
                    <div className="space-y-6">
                      <Clock className="w-16 h-16 text-orange-500 mx-auto" />
                      <div>
                        <h3 className="text-2xl font-bold text-orange-400">URGENT CARE</h3>
                        <p className="text-white/80 mt-2">We've auto-booked the first available slot.</p>
                      </div>
                      <div className="p-4 bg-white/10 rounded-lg text-left">
                        <div className="text-sm text-white/50">Case ID</div>
                        <div className="font-mono">{caseId}</div>
                      </div>
                      <Button className="w-full h-12 btn-primary" onClick={reset}>Close</Button>
                    </div>
                  )}

                  {severity === "green" && (
                    <div className="space-y-6">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                      <div>
                        <h3 className="text-2xl font-bold text-green-400">NON-URGENT</h3>
                        <p className="text-white/80 mt-2">Condition seems stable. Please book a normal appointment.</p>
                      </div>
                      <Button className="w-full h-12 btn-primary" onClick={() => { reset(); window.location.href = "/patient/book"; }}>
                        Book Normal Appointment
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step < 4 && (
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => step > 1 ? setStep(s => s - 1) : reset()} className="text-white/70 hover:text-white hover:bg-white/10">
                  {step === 1 ? 'Cancel' : 'Back'}
                </Button>
                <Button onClick={handleNext} className="btn-primary min-w-[100px]" disabled={createEmergency.isPending}>
                  {step === 3 ? 'Submit' : 'Next'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
