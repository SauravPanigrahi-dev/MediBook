import { useAuth } from "@/hooks/use-auth";
import { useGetAdminStats, getGetAdminStatsQueryKey, useGetPendingDoctors, getGetPendingDoctorsQueryKey, useApproveDoctor, useRejectDoctor, useGetAdminUsers, getGetAdminUsersQueryKey, useToggleUserActive, useGetEmergencyCases, getGetEmergencyCasesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Users, Stethoscope, Calendar, Activity, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("all");

  const { data: stats, isLoading: statsLoading } = useGetAdminStats({
    query: { queryKey: getGetAdminStatsQueryKey() }
  });

  const { data: pendingDoctors } = useGetPendingDoctors({
    query: { queryKey: getGetPendingDoctorsQueryKey() }
  });

  const { data: adminUsers } = useGetAdminUsers(
    { q: userSearch, role: userRole !== "all" ? userRole : undefined },
    { query: { queryKey: getGetAdminUsersQueryKey({ q: userSearch, role: userRole !== "all" ? userRole : undefined }) } }
  );

  const { data: emergencyCases } = useGetEmergencyCases({
    query: { queryKey: getGetEmergencyCasesQueryKey() }
  });

  const approveDoctor = useApproveDoctor();
  const rejectDoctor = useRejectDoctor();
  const toggleUser = useToggleUserActive();

  const handleApprove = async (id: number) => {
    try {
      await approveDoctor.mutateAsync({ id });
      toast({ title: "Doctor approved successfully" });
      queryClient.invalidateQueries({ queryKey: getGetPendingDoctorsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Action failed", description: e.message });
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectDoctor.mutateAsync({ id, data: { reason: "Declined by admin" } });
      toast({ title: "Doctor application rejected" });
      queryClient.invalidateQueries({ queryKey: getGetPendingDoctorsQueryKey() });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Action failed", description: e.message });
    }
  };

  const handleToggleUser = async (id: number, isActive: boolean) => {
    try {
      await toggleUser.mutateAsync({ id, data: { isActive } });
      toast({ title: `User ${isActive ? 'activated' : 'deactivated'}` });
      queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey({ q: userSearch, role: userRole !== "all" ? userRole : undefined }) });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Action failed", description: e.message });
    }
  };

  if (statsLoading) {
    return <div className="p-8"><div className="h-32 rounded-xl bg-white/5 animate-pulse" /></div>;
  }

  if (!stats) return null;

  const STATUS_COLORS = {
    completed: '#10b981',
    pending: '#f59e0b',
    cancelled: '#6b7280',
    confirmed: '#3b82f6',
    'no-show': '#ef4444'
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold">Admin Overview</h1>
        <p className="text-white/70 mt-1">Platform statistics and operations</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400 shrink-0"><Stethoscope /></div>
          <div>
            <div className="text-white/60 text-sm">Total Doctors</div>
            <div className="text-2xl font-bold">{stats.totalDoctors}</div>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 bg-green-500/20 rounded-lg text-green-400 shrink-0"><Users /></div>
          <div>
            <div className="text-white/60 text-sm">Total Patients</div>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 bg-teal-500/20 rounded-lg text-teal-400 shrink-0"><Calendar /></div>
          <div>
            <div className="text-white/60 text-sm">Today's Appointments</div>
            <div className="text-2xl font-bold">{stats.appointmentsToday}</div>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 bg-orange-500/20 rounded-lg text-orange-400 shrink-0"><Activity /></div>
          <div>
            <div className="text-white/60 text-sm">Pending Approvals</div>
            <div className="text-2xl font-bold text-orange-400">{stats.pendingApprovals}</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Pending Doctors */}
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Pending Doctor Approvals</h2>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 text-sm uppercase tracking-wider">
                    <th className="p-4 font-medium">Doctor Info</th>
                    <th className="p-4 font-medium hidden sm:table-cell">Specialization</th>
                    <th className="p-4 font-medium hidden md:table-cell">License</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {!pendingDoctors || pendingDoctors.doctors.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-white/50">No pending approvals</td>
                    </tr>
                  ) : (
                    pendingDoctors.doctors.map(doc => (
                      <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold">Dr. {doc.name}</div>
                          <div className="text-sm text-white/60">{doc.email}</div>
                        </td>
                        <td className="p-4 hidden sm:table-cell text-white/80">{doc.specialization}</td>
                        <td className="p-4 hidden md:table-cell text-white/80 font-mono text-sm">{doc.licenseNumber}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleReject(doc.id)} className="text-red-400 border-red-500/30 hover:bg-red-500/20 hover:text-red-300">
                              <XCircle className="w-4 h-4 mr-1" /> Reject
                            </Button>
                            <Button size="sm" onClick={() => handleApprove(doc.id)} className="bg-green-600 hover:bg-green-700 text-white border-none">
                              <CheckCircle className="w-4 h-4 mr-1" /> Approve
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Management */}
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">User Management</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input 
                  placeholder="Search users..." 
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="glass-input h-9 w-full sm:w-[200px]"
                />
                <Select value={userRole} onValueChange={setUserRole}>
                  <SelectTrigger className="glass-input h-9 w-[130px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent className="glass-card text-white">
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-0 overflow-x-auto h-[300px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 text-sm uppercase tracking-wider sticky top-0 bg-[#0f4c75]">
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Role</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {!adminUsers || adminUsers.users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-white/50">No users found</td>
                    </tr>
                  ) : (
                    adminUsers.users.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold">{u.name}</div>
                          <div className="text-sm text-white/60">{u.email}</div>
                        </td>
                        <td className="p-4 text-white/80 capitalize">{u.role}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${u.isActive ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleToggleUser(u.id, !u.isActive)}
                            className={u.isActive ? 'text-red-400 border-red-500/30 hover:bg-red-500/20' : 'text-green-400 border-green-500/30 hover:bg-green-500/20'}
                          >
                            {u.isActive ? 'Deactivate' : 'Reactivate'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-card p-6 flex flex-col">
            <h2 className="text-xl font-semibold mb-6">Appointments Status</h2>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.appointmentsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                  >
                    {stats.appointmentsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#ffffff'} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', opacity: 0.8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-white/10 bg-white/5 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-xl font-semibold">Recent Emergencies</h2>
            </div>
            <div className="p-4 space-y-4 max-h-[350px] overflow-y-auto">
              {!emergencyCases || emergencyCases.cases.length === 0 ? (
                <div className="text-center text-white/50 p-4">No recent emergency cases</div>
              ) : (
                emergencyCases.cases.map(ec => (
                  <div key={ec.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        ec.severity === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        ec.severity === 'orange' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {ec.severity}
                      </span>
                      <span className="text-xs text-white/50">{format(parseISO(ec.createdAt), 'MMM d, HH:mm')}</span>
                    </div>
                    <div className="font-semibold text-sm mb-1">{ec.issueType}</div>
                    <div className="text-xs text-white/70 mb-2">{ec.location}</div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">Status: <span className="text-white capitalize">{ec.status}</span></span>
                      {ec.assignedDoctorName && <span className="text-blue-300">Dr. {ec.assignedDoctorName}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
