import { useAuth } from "@/hooks/use-auth";
import { useGetPrescriptions, getGetPrescriptionsQueryKey } from "@workspace/api-client-react";
import { Pill, Printer, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const patientId = user?.patientId || user?.id || 1;

  const { data, isLoading } = useGetPrescriptions({ patientId }, {
    query: {
      enabled: !!patientId,
      queryKey: getGetPrescriptionsQueryKey({ patientId })
    }
  });

  if (isLoading) return <div className="p-8"><div className="h-64 rounded-xl bg-white/5 animate-pulse" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <Pill className="w-8 h-8 text-purple-400" />
        Prescriptions
      </h1>

      <div className="space-y-6">
        {data?.prescriptions.length === 0 ? (
          <div className="glass-card p-12 text-center text-white/50">No prescriptions found.</div>
        ) : (
          data?.prescriptions.map(rx => (
            <div key={rx.id} className="glass-card overflow-hidden">
              <div className="p-5 border-b border-white/10 bg-white/5 flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Prescription from Dr. {rx.doctorName}</h3>
                  <div className="flex items-center gap-2 text-sm text-white/60 mt-1">
                    <Calendar className="w-4 h-4" /> Issued: {format(parseISO(rx.createdAt), 'MMM d, yyyy')}
                    {rx.validUntil && <span>• Valid until: {format(parseISO(rx.validUntil), 'MMM d, yyyy')}</span>}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="bg-white/5 text-white hover:bg-white/10 border-white/20" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
              </div>
              
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-white/50 text-sm bg-white/5">
                      <th className="p-4 font-medium">Medicine</th>
                      <th className="p-4 font-medium">Dosage</th>
                      <th className="p-4 font-medium">Frequency</th>
                      <th className="p-4 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rx.medicines.map((med, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="p-4 font-medium text-purple-100">{med.name}</td>
                        <td className="p-4 text-white/80">{med.dosage}</td>
                        <td className="p-4 text-white/80">{med.frequency}</td>
                        <td className="p-4 text-white/80">{med.durationDays} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {rx.instructions && (
                <div className="p-5 border-t border-white/10 bg-white/5">
                  <h4 className="text-sm font-semibold text-white/70 mb-2 uppercase tracking-wider">Doctor's Instructions</h4>
                  <p className="text-white/90">{rx.instructions}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
