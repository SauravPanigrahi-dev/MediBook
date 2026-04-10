import { useAuth } from "@/hooks/use-auth";
import { useGetDoctorAnalytics, getGetDoctorAnalyticsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, TrendingUp, Users, CheckCircle } from "lucide-react";

export default function DoctorAnalytics() {
  const { user } = useAuth();
  const doctorId = user?.doctorId || user?.id || 1;
  const [range, setRange] = useState<"week" | "month" | "3months">("week");

  const { data, isLoading } = useGetDoctorAnalytics(doctorId, {
    query: {
      enabled: !!doctorId,
      queryKey: getGetDoctorAnalyticsQueryKey(doctorId)
    }
  });

  if (isLoading) return <div className="p-8"><div className="h-96 rounded-xl bg-white/5 animate-pulse max-w-6xl mx-auto" /></div>;
  if (!data) return null;

  const STATUS_COLORS = {
    completed: '#10b981',
    pending: '#f59e0b',
    cancelled: '#6b7280',
    confirmed: '#3b82f6',
    'no-show': '#ef4444'
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Activity className="w-8 h-8 text-teal-400" />
          Analytics Dashboard
        </h1>
        
        <Select value={range} onValueChange={(v: any) => setRange(v)}>
          <SelectTrigger className="w-[180px] glass-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-card text-white">
            <SelectItem value="week">Past Week</SelectItem>
            <SelectItem value="month">Past Month</SelectItem>
            <SelectItem value="3months">Past 3 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="text-white/60 text-sm mb-1 flex items-center gap-2"><Users className="w-4 h-4"/> Total Appointments</div>
          <div className="text-3xl font-bold text-blue-400">{data.totalAppointments}</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-white/60 text-sm mb-1 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Completion Rate</div>
          <div className="text-3xl font-bold text-green-400">{data.completionRate}%</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-6">Daily Appointments</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyAppointments}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5"/> Wait Time Trend (mins)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.waitTimeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                />
                <Line type="monotone" dataKey="avgWaitMins" stroke="#14a085" strokeWidth={3} dot={{r: 4, fill: '#14a085'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-6">Status Distribution</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{stroke: 'rgba(255,255,255,0.2)'}}
                >
                  {data.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#ffffff'} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
