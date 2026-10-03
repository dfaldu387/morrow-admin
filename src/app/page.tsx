'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout, { useAuthReady } from '@/components/AdminLayout';
import { IconUsers, IconTarget, IconCheckCircle, IconZap, IconBarChart } from '@/components/Icons';
import { api } from '@/lib/api';

const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false });

interface DashboardData {
  totalUsers: number;
  totalHabits: number;
  totalCompletions: number;
  activeUsersToday: number;
  recentUsers: Array<{ id: string; name: string; email: string; created_at: string; habit_count: number }>;
  completionsByDay: Array<{ day: string; count: number }>;
  habitsByCategory: Array<{ category: string; count: number }>;
}

const COLORS = ['#FE8DA1', '#FFED00', '#36A2EB', '#2ed573', '#ffa502', '#a29bfe', '#fd79a8', '#00cec9'];

function DashboardContent() {
  const authReady = useAuthReady();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authReady) return;
    api.getDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [authReady]);

  if (loading) {
    return <div className="loading"><div className="spinner" /></div>;
  }

  if (error || !data) {
    return (
      <div className="empty-state">
        <IconBarChart size={48} />
        <p style={{ marginTop: 12 }}>{error || 'Failed to load dashboard data'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon pink"><IconUsers size={22} /></div>
          <div className="stat-info">
            <h3>{data.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><IconTarget size={22} /></div>
          <div className="stat-info">
            <h3>{data.totalHabits}</h3>
            <p>Total Habits</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><IconCheckCircle size={22} /></div>
          <div className="stat-info">
            <h3>{data.totalCompletions}</h3>
            <p>Total Completions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><IconZap size={22} /></div>
          <div className="stat-info">
            <h3>{data.activeUsersToday}</h3>
            <p>Active Today</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Completions (Last 7 Days)</h3>
          {data.completionsByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.completionsByDay}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#FE8DA1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <p>No completions in the last 7 days</p>
            </div>
          )}
        </div>
        <div className="chart-card">
          <h3>Habits by Category</h3>
          {data.habitsByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.habitsByCategory}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ category, count }: { category: string; count: number }) => `${category} (${count})`}
                >
                  {data.habitsByCategory.map((_: unknown, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <p>No habits created yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Recent Users</h3>
        {data.recentUsers.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Habits</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.recentUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar">{user.name?.[0]?.toUpperCase() || '?'}</div>
                        {user.name}
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.habit_count}</td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><p>No users yet</p></div>
        )}
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <AdminLayout>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of your Morrow app</p>
      </div>
      <DashboardContent />
    </AdminLayout>
  );
}
