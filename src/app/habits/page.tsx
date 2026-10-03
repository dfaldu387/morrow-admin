'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { IconHabits } from '@/components/Icons';
import { api } from '@/lib/api';

interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  category: string;
  archived: boolean;
  user_name: string;
  user_email: string;
  total_completions: number;
  created_at: string;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getHabits(page, search);
      setHabits(data.habits);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHabits();
  };

  return (
    <AdminLayout>
      <div className="page-header">
        <h2>Habits</h2>
        <p>All habits across users</p>
      </div>

      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          placeholder="Search by habit name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : habits.length === 0 ? (
          <div className="empty-state">
            <IconHabits size={48} />
            <p style={{ marginTop: 12 }}>No habits found</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Habit</th>
                    <th>Category</th>
                    <th>User</th>
                    <th>Completions</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {habits.map((habit) => (
                    <tr key={habit.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 18 }}>{habit.emoji || '\u2713'}</span>
                          {habit.name}
                        </div>
                      </td>
                      <td>{habit.category || 'General'}</td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500 }}>{habit.user_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{habit.user_email}</div>
                        </div>
                      </td>
                      <td>{habit.total_completions}</td>
                      <td>
                        <span className={`badge ${habit.archived ? 'inactive' : 'active'}`}>
                          {habit.archived ? 'Archived' : 'Active'}
                        </span>
                      </td>
                      <td>{new Date(habit.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
