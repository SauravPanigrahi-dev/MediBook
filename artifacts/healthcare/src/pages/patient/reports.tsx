import { useAuth } from "@/hooks/use-auth";
import { useGetReports, getGetReportsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { FileText, Download, Filter, FileSearch } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PatientReports() {
  const { user } = useAuth();
  const patientId = user?.patientId || user?.id || 1;
  
  const [filterType, setFilterType] = useState<string>("all");

  const { data, isLoading } = useGetReports(
    { patientId, reportType: filterType !== "all" ? filterType : undefined }, 
    { query: { enabled: !!patientId, queryKey: getGetReportsQueryKey({ patientId, reportType: filterType !== "all" ? filterType : undefined }) } }
  );

  if (isLoading) return <div className="p-8"><div className="h-64 rounded-xl bg-white/5 animate-pulse" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="w-8 h-8 text-teal-400" />
          Medical Reports
        </h1>
        
        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/10">
          <Filter className="w-4 h-4 text-white/50 ml-2" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px] bg-transparent border-none text-white focus:ring-0 shadow-none">
              <SelectValue placeholder="All Report Types" />
            </SelectTrigger>
            <SelectContent className="glass-card">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Blood Test">Blood Test</SelectItem>
              <SelectItem value="X-Ray">X-Ray</SelectItem>
              <SelectItem value="MRI">MRI</SelectItem>
              <SelectItem value="Prescription">Prescription</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.reports.length === 0 ? (
          <div className="col-span-full glass-card p-12 flex flex-col items-center justify-center text-white/50">
            <FileSearch className="w-12 h-12 mb-4 opacity-50" />
            <p>No reports found matching your criteria.</p>
          </div>
        ) : (
          data?.reports.map(report => (
            <div key={report.id} className="glass-card p-5 flex flex-col h-full hover-card">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 rounded bg-teal-500/20 text-teal-300 text-xs font-medium border border-teal-500/30">
                  {report.reportType}
                </span>
                <span className="text-xs text-white/50">{format(parseISO(report.uploadedAt), 'MMM d, yyyy')}</span>
              </div>
              
              <h3 className="text-lg font-semibold mb-2 line-clamp-2">{report.title}</h3>
              <p className="text-sm text-white/60 mb-4 flex-1">By Dr. {report.doctorName}</p>
              
              {report.notes && (
                <p className="text-sm text-white/80 bg-white/5 p-3 rounded-lg border border-white/5 mb-4 line-clamp-3">
                  {report.notes}
                </p>
              )}
              
              <Button variant="outline" className="w-full mt-auto bg-white/5 text-white hover:bg-white/10 border-white/20">
                <Download className="w-4 h-4 mr-2" /> Download PDF
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
