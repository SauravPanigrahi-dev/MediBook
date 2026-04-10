import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetDoctors, getGetDoctorsQueryKey, useGetSlots, getGetSlotsQueryKey, useCreateAppointment } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Search, Star, Loader2, CreditCard, FileText } from "lucide-react";
import { format, addDays, parseISO } from "date-fns";

export default function BookAppointment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  
  // Step 1: Doctor
  const [searchDoc, setSearchDoc] = useState("");
  const [specFilter, setSpecFilter] = useState<string>("all");
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  
  // Step 1: stored doctor name
  const [selectedDoctorName, setSelectedDoctorName] = useState<string>("");

  // Step 2 & 3: Date & Time
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedVirtualSlotId, setSelectedVirtualSlotId] = useState<string>("");
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>("");
  const [selectedPositionNumber, setSelectedPositionNumber] = useState<number | null>(null);
  
  // Step 5: Details
  const [reason, setReason] = useState("");
  
  // Step 6: Payment
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Result
  const [appointmentId, setAppointmentId] = useState<number | null>(null);
  const [tokenNumber, setTokenNumber] = useState<number | null>(null);

  const { data: doctorsData, isLoading: docsLoading } = useGetDoctors({
    q: searchDoc.length > 2 ? searchDoc : undefined,
    specialization: specFilter !== "all" ? specFilter : undefined
  });

  const { data: slotsData, isLoading: slotsLoading } = useGetSlots(
    { doctorId: selectedDoctorId!, date: selectedDate },
    { query: { enabled: !!selectedDoctorId && !!selectedDate } }
  );

  const createApt = useCreateAppointment();

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Fake processing
    setTimeout(async () => {
      try {
        const res = await createApt.mutateAsync({
          data: {
            patientId: user!.patientId || user!.id,
            doctorId: selectedDoctorId!,
            slotId: selectedSlotId!,
            date: selectedDate,
            reason,
            paymentMethod: "card",
            preferredTokenNumber: selectedPositionNumber ?? undefined
          }
        });
        setAppointmentId(res.id);
        setTokenNumber(res.tokenNumber);
        setIsProcessing(false);
        setStep(7);
        toast({ title: "Appointment Confirmed" });
      } catch (err: any) {
        setIsProcessing(false);
        toast({ variant: "destructive", title: "Booking failed", description: err.message });
      }
    }, 1500);
  };

  const formatCardNumber = (val: string) => {
    const v = val.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return val;
    }
  };

  const dates = Array.from({ length: 7 }).map((_, i) => format(addDays(new Date(), i), 'yyyy-MM-dd'));

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
      <h1 className="text-3xl font-bold">Book Appointment</h1>

      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="flex flex-col items-center min-w-[60px]">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-colors ${step === i ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : step > i ? 'bg-green-500 text-white' : 'bg-white/10 text-white/50'}`}>
              {step > i ? '✓' : i}
            </div>
            <div className="text-xs text-white/60 whitespace-nowrap text-center">
              {['Doctor', 'Date', 'Time', 'Queue', 'Details', 'Payment', 'Done'][i - 1]}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-6 min-h-[400px]">
        {step === 1 && (
          <div className="space-y-6 page-transition-enter-active">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-white/50" />
                <Input 
                  className="glass-input pl-9 h-10" 
                  placeholder="Search doctor name..." 
                  value={searchDoc}
                  onChange={e => setSearchDoc(e.target.value)}
                />
              </div>
              <Select value={specFilter} onValueChange={setSpecFilter}>
                <SelectTrigger className="glass-input w-full sm:w-[200px]">
                  <SelectValue placeholder="Specialization" />
                </SelectTrigger>
                <SelectContent className="glass-card text-white">
                  <SelectItem value="all">All Specialties</SelectItem>
                  <SelectItem value="Cardiology">Cardiology</SelectItem>
                  <SelectItem value="Neurology">Neurology</SelectItem>
                  <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                  <SelectItem value="General">General Practice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {docsLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {doctorsData?.doctors.map(doc => (
                  <div 
                    key={doc.id} 
                    onClick={() => { setSelectedDoctorId(doc.id); setSelectedDoctorName(doc.name); handleNext(); }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover-card ${selectedDoctorId === doc.id ? 'bg-blue-500/20 border-blue-400' : 'bg-white/5 border-white/10'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">Dr. {doc.name}</h3>
                        <p className="text-white/70 text-sm">{doc.specialization}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-blue-300 font-semibold">${doc.consultationFee}</div>
                        <div className="flex items-center gap-1 text-sm text-yellow-400 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400" /> {doc.avgRating}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 page-transition-enter-active">
            <h3 className="text-xl font-semibold">Select Date</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {dates.map(date => (
                <button
                  key={date}
                  onClick={() => { setSelectedDate(date); handleNext(); }}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${selectedDate === date ? 'bg-blue-500/20 border-blue-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <span className="text-xs text-white/60 mb-1">{format(parseISO(date), 'EEE')}</span>
                  <span className="text-xl font-bold">{format(parseISO(date), 'd')}</span>
                  <span className="text-xs text-white/60 mt-1">{format(parseISO(date), 'MMM')}</span>
                </button>
              ))}
            </div>
            <div className="mt-8">
              <Button onClick={handleBack} variant="ghost" className="text-white/70">Back</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 page-transition-enter-active">
            <h3 className="text-xl font-semibold">Select Time Slot</h3>
            {slotsLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
            ) : slotsData?.slots.length === 0 ? (
              <div className="p-8 text-center text-white/50">No slots available for this date.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {slotsData?.slots.map(slot => {
                  const fillRatio = (slot.bookedCount || 0) / slot.maxPatients;
                  const statusColor = fillRatio >= 1 ? 'bg-red-500/20 text-red-300 border-red-500/30' : fillRatio > 0.7 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 'bg-green-500/20 text-green-300 border-green-500/30';
                  
                  return (
                    <button
                      key={slot.id}
                      disabled={fillRatio >= 1}
                      onClick={() => {
                        const s = slot as any;
                        setSelectedSlotId(s.slotId ?? slot.id);
                        setSelectedSlotTime(slot.startTime as string);
                        setSelectedPositionNumber(s.positionNumber ?? null);
                        handleNext();
                      }}
                      className={`p-3 rounded-lg border flex flex-col items-center transition-all ${selectedSlotId === slot.id ? 'ring-2 ring-blue-400' : ''} ${statusColor} ${fillRatio >= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1'}`}
                    >
                      <span className="font-semibold">{slot.startTime}</span>
                      <span className="text-xs mt-1 opacity-80">{slot.maxPatients - (slot.bookedCount || 0)} left</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="mt-8 flex justify-between">
              <Button onClick={handleBack} variant="ghost" className="text-white/70">Back</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 page-transition-enter-active text-center py-8">
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
              <FileText className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-blue-100">Queue Position Reserved</h3>
            <p className="text-white/70 max-w-md mx-auto">Your estimated position is #4 with a wait time of ~45 mins. Please confirm your details to secure this token.</p>
            <div className="mt-8 flex justify-center gap-4">
              <Button onClick={handleBack} variant="ghost" className="text-white/70">Back</Button>
              <Button onClick={handleNext} className="btn-primary">Continue</Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 page-transition-enter-active max-w-md mx-auto">
            <h3 className="text-xl font-semibold">Patient Details</h3>
            <div className="space-y-4">
              <div>
                <Label>Patient Name</Label>
                <Input value={user?.name || ""} disabled className="glass-input mt-1 bg-white/5 text-white/70" />
              </div>
              <div>
                <Label>Reason for visit</Label>
                <textarea 
                  value={reason} 
                  onChange={e => setReason(e.target.value)} 
                  className="w-full glass-input mt-1 min-h-[100px] p-3 text-sm" 
                  placeholder="Briefly describe your symptoms..."
                />
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <Button onClick={handleBack} variant="ghost" className="text-white/70">Back</Button>
              <Button onClick={handleNext} className="btn-primary">Proceed to Payment</Button>
            </div>
          </div>
        )}

        {step === 6 && (
          <form onSubmit={handlePayment} className="space-y-6 page-transition-enter-active max-w-md mx-auto">
            <h3 className="text-xl font-semibold flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-400" /> Payment</h3>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
              <div className="flex justify-between text-sm mb-1"><span className="text-white/70">Consultation Fee</span><span>$150.00</span></div>
              <div className="flex justify-between text-sm mb-1"><span className="text-white/70">Taxes</span><span>$0.00</span></div>
              <div className="border-t border-white/10 my-2 pt-2 flex justify-between font-bold"><span>Total</span><span className="text-blue-300">$150.00</span></div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Card Number</Label>
                <Input 
                  required 
                  value={cardNumber} 
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))} 
                  maxLength={19} 
                  placeholder="0000 0000 0000 0000" 
                  className="glass-input mt-1 font-mono tracking-widest" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Expiry (MM/YY)</Label>
                  <Input required value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="12/25" maxLength={5} className="glass-input mt-1" />
                </div>
                <div>
                  <Label>CVV</Label>
                  <Input required type="password" value={cvv} onChange={e => setCvv(e.target.value)} placeholder="•••" maxLength={4} className="glass-input mt-1 tracking-widest" />
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <Button type="button" onClick={handleBack} variant="ghost" className="text-white/70" disabled={isProcessing}>Back</Button>
              <Button type="submit" className="btn-primary min-w-[120px]" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Pay $150.00"}
              </Button>
            </div>
          </form>
        )}

        {step === 7 && (
          <div className="space-y-6 page-transition-enter-active text-center py-8">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
              <div className="w-12 h-12 rounded-full bg-green-400 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-green-300">Booking Confirmed!</h3>
            <p className="text-white/70 mt-2">Your appointment has been successfully scheduled.</p>
            
            <div className="max-w-sm mx-auto mt-8 bg-white/5 border border-white/10 rounded-xl p-6 text-left space-y-4">
              <div className="flex justify-between">
                <span className="text-white/50">Token Number</span>
                <span className="font-bold text-xl text-blue-400">#{tokenNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Doctor</span>
                <span className="font-semibold">Dr. {selectedDoctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Date</span>
                <span>{format(parseISO(selectedDate), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Time</span>
                <span>{selectedSlotTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Appointment ID</span>
                <span className="font-mono text-sm">#{appointmentId}</span>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <Button onClick={() => window.print()} variant="outline" className="bg-white/5 text-white hover:bg-white/10">Print Details</Button>
              <Button onClick={() => window.location.href = "/patient/dashboard"} className="btn-primary">Go to Dashboard</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
