'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { IconArrowLeft, IconTarget, IconCheckCircle, IconFire, IconArchive } from '@/components/Icons';
import { api } from '@/lib/api';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  created_at: string;
  habits: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
    category: string;
    streak: number;
    total_completions: number;
    archived: boolean;
  }>;
  stats: {
    totalHabits: number;
    totalCompletions: number;
    activeHabits: number;
    archivedHabits: number;
  };
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUser(params.id as string)
      .then(setUser)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <AdminLayout>
      <div className="back-link" onClick={() => router.push('/users')}>
        <IconArrowLeft size={16} /> Back to Users
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : !user ? (
        <div className="empty-state"><p>User not found</p></div>
      ) : (
        <>
          <div className="user-detail-header">
            <div className="avatar-lg">{user.name?.[0]?.toUpperCase() || '?'}</div>
            <div className="info">
              <h2>{user.name}</h2>
              <p>{user.email}</p>
              <p>Joined {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue"><IconTarget size={22} /></div>
              <div className="stat-info">
                <h3>{user.stats.totalHabits}</h3>
                <p>Total Habits</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><IconCheckCircle size={22} /></div>
              <div className="stat-info">
                <h3>{user.stats.totalCompletions}</h3>
                <p>Total Completions</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon pink"><IconFire size={22} /></div>
              <div className="stat-info">
                <h3>{user.stats.activeHabits}</h3>
                <p>Active Habits</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon yellow"><IconArchive size={22} /></div>
              <div className="stat-info">
                <h3>{user.stats.archivedHabits}</h3>
                <p>Archived</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Habits</h3>
            {user.habits.length === 0 ? (
              <div className="empty-state"><p>No habits created</p></div>
            ) : (
              <div className="habits-list">
                {user.habits.map((habit) => (
                  <div key={habit.id} className="habit-card">
                    <div className="emoji">{habit.emoji || '\u2713'}</div>
                    <div className="habit-info">
                      <h4>
                        {habit.name}
                        {habit.archived && (
                          <span className="badge inactive" style={{ marginLeft: 8 }}>Archived</span>
                        )}
                      </h4>
                      <p>Category: {habit.category || 'General'}</p>
                      <p>Streak: {habit.streak} days | {habit.total_completions} completions</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
