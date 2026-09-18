import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users, FileText, Cpu, Trash2, Clock, AlertTriangle } from 'lucide-react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const statsRes = await API.get('/admin/stats');
      const usersRes = await API.get('/admin/users');

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
        setActivities(statsRes.data.recentActivities || []);
      }
      if (usersRes.data.success) {
        setUsers(usersRes.data.users || []);
      }
    } catch (err) {
      showToast('Failed to load admin statistics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user and all their prompts?')) return;
    try {
      const res = await API.delete(`/admin/users/${id}`);
      if (res.data.success) {
        setUsers(users.filter((u) => u._id !== id));
        showToast('User removed successfully.', 'info');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user.', 'error');
    }
  };

  if (loading) {
    return <div className="glass-panel p-8 text-center text-slate-400 text-sm">Loading admin dashboard...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-xs text-slate-400">System statistics, platform metrics, and user management</p>
        </div>

        <span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase rounded-lg">
          Admin Access Granted
        </span>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Total Users</span>
            <span className="text-2xl font-extrabold text-slate-100">{stats?.totalUsers || 0}</span>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Total Prompts</span>
            <span className="text-2xl font-extrabold text-slate-100">{stats?.totalPrompts || 0}</span>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">AI Requests</span>
            <span className="text-2xl font-extrabold text-slate-100">{stats?.totalAIRequests || 0}</span>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Avg Quality</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">{stats?.avgPromptScore || 0}/100</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Users & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Management List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Registered Users Management ({users.length})</span>
          </h2>

          <div className="glass-panel overflow-hidden border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-semibold text-slate-200">{u.name}</td>
                    <td className="p-4 text-slate-400 font-mono">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'admin' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-300'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Logs (1 Col) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>Recent Audit Logs</span>
          </h2>

          <div className="glass-panel p-4 space-y-3 max-h-96 overflow-y-auto text-xs">
            {activities.length === 0 ? (
              <p className="text-slate-500">No activity recorded yet.</p>
            ) : (
              activities.map((act, i) => (
                <div key={i} className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                    <span>{act.type}</span>
                    <span>{new Date(act.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-200 font-medium">{act.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
